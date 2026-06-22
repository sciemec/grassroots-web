import { NextRequest, NextResponse } from "next/server";
import { generatePresignedPutUrl, getPublicUrl, isR2Configured } from "@/lib/r2";

/**
 * POST /api/whatsapp
 * Twilio inbound WhatsApp webhook receiver with interactive prompt routing.
 *
 * Two-turn conversation flow:
 *
 *   Turn 1 — video arrives:
 *     → Validates media is a video
 *     → Downloads video from Twilio (Basic Auth) and uploads to Cloudflare R2
 *     → Forwards to Laravel with action="prompt" and the stable R2 URL
 *     → Laravel stores pending video keyed by phone (whatsapp_pending_videos table)
 *     → Bot replies asking the user to choose: Biometric Scan or Video Vault
 *
 *   Turn 2 — user replies "1" or "2" (text-only):
 *     → Forwards to Laravel with action="route_pending" + choice
 *     → Laravel looks up pending video by phone and dispatches:
 *         choice=1 → AnalyseWhatsappVideoJob (reads R2 URL — no Twilio auth needed)
 *         choice=2 → saves R2 URL to player_highlights table
 *     → Bot confirms the action taken
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  — for downloading Twilio-hosted media (Basic Auth)
 *   TWILIO_AUTH_TOKEN   — confirms service is configured
 *   NEXT_PUBLIC_API_URL — Laravel backend base URL
 *
 * R2 upload env vars (optional — falls back to Twilio URL if not set):
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET            — bucket name (default: grassroots-videos)
 *   R2_PUBLIC_URL        — public base URL (e.g. https://pub-xxx.r2.dev)
 *
 * Laravel endpoint called:
 *   POST /api/v1/whatsapp/inbound
 *   Turn 1 body: { action, message_sid, phone, media_url, media_type, profile_name }
 *   Turn 2 body: { action, message_sid, phone, choice }
 *   Response:    { ok, user_id?, message? }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const PROMPT_MESSAGE =
  "Video received! What would you like to do?\n\n" +
  "Reply *1* — Run AI Biometric Scan\n" +
  "Reply *2* — Save to Video Vault";

const HELP_MESSAGE =
  "Send a video clip to get started.\n\n" +
  "If you already sent a video, reply *1* for Biometric Scan or *2* for Video Vault.";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TwilioInboundPayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
}

interface BackendInboundBody {
  action: "prompt" | "route_pending";
  message_sid: string;
  phone: string;
  media_url?: string;
  media_type?: string;
  profile_name?: string | null;
  choice?: "1" | "2";
}

interface BackendInboundResponse {
  ok: boolean;
  user_id?: string;
  message?: string;
}

// ─── R2 helpers ──────────────────────────────────────────────────────────────

/**
 * Download a Twilio-hosted media file using Basic Auth, then upload the bytes
 * to Cloudflare R2 via a presigned PUT URL (uses @/lib/r2 — no AWS SDK).
 *
 * Key format: whatsapp/{phone_digits}/{messageSid}.{ext}
 * e.g.        whatsapp/263712345678/MM1234abcd.mp4
 *
 * Returns the public R2 URL on success, or null if R2 is not configured or
 * any step fails. The caller falls back to the original Twilio URL.
 */
async function uploadToR2(
  twilioUrl: string,
  mediaType: string,
  phone: string,
  messageSid: string,
  LOG: string,
): Promise<string | null> {
  if (!isR2Configured()) {
    console.log(`${LOG} R2 not configured — storing Twilio URL directly`);
    return null;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.warn(`${LOG} TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing — cannot download media`);
    return null;
  }

  // 1. Download from Twilio with Basic Auth
  let videoBytes: ArrayBuffer;
  try {
    const res = await fetch(twilioUrl, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      },
    });
    if (!res.ok) {
      console.error(`${LOG} Twilio media download failed status=${res.status}`);
      return null;
    }
    videoBytes = await res.arrayBuffer();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Twilio media download error: ${msg}`);
    return null;
  }

  // 2. Build R2 key — strip leading '+' from phone so the key is path-safe
  const ext    = mediaType.includes("quicktime") || mediaType.includes("mov") ? "mov" : "mp4";
  const digits = phone.replace(/^\+/, "");
  const key    = `whatsapp/${digits}/${messageSid}.${ext}`;

  // 3. Upload via presigned PUT URL (server-side fetch — no browser involved)
  try {
    const uploadUrl = await generatePresignedPutUrl({ key, contentType: mediaType });
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: Buffer.from(videoBytes),
      headers: { "Content-Type": mediaType },
    });
    if (!putRes.ok) {
      console.error(`${LOG} R2 PUT failed status=${putRes.status} key=${key}`);
      return null;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} R2 upload failed key=${key}: ${msg}`);
    return null;
  }

  const publicUrl = getPublicUrl(key);
  console.log(`${LOG} Uploaded to R2 key=${key} url=${publicUrl}`);
  return publicUrl;
}

// ─── Twilio payload helpers ───────────────────────────────────────────────────

function parseRoutingChoice(body: string): "1" | "2" | null {
  const t = body.trim().toLowerCase();
  if (t === "1" || t.includes("scan") || t.includes("biometric")) return "1";
  if (t === "2" || t.includes("vault") || t.includes("save") || t.includes("highlight")) return "2";
  return null;
}

async function parseTwilioPayload(req: NextRequest): Promise<TwilioInboundPayload | null> {
  try {
    const form = await req.formData();
    return {
      MessageSid:        String(form.get("MessageSid") ?? ""),
      From:              String(form.get("From") ?? ""),
      To:                String(form.get("To") ?? ""),
      Body:              String(form.get("Body") ?? ""),
      NumMedia:          String(form.get("NumMedia") ?? "0"),
      MediaUrl0:         form.has("MediaUrl0")         ? String(form.get("MediaUrl0"))         : undefined,
      MediaContentType0: form.has("MediaContentType0") ? String(form.get("MediaContentType0")) : undefined,
      ProfileName:       form.has("ProfileName")       ? String(form.get("ProfileName"))       : undefined,
    };
  } catch {
    return null;
  }
}

function normalisePhone(from: string): string {
  return from.replace(/^whatsapp:/i, "").trim();
}

function twimlResponse(message?: string): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const LOG = "[whatsapp/inbound]";

  // 1. Confirm required env vars
  const apiUrl         = process.env.NEXT_PUBLIC_API_URL;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

  if (!twilioAuthToken) {
    console.error(`${LOG} TWILIO_AUTH_TOKEN is not set — rejecting webhook`);
    return twimlResponse();
  }
  if (!apiUrl) {
    console.error(`${LOG} NEXT_PUBLIC_API_URL is not set — cannot forward to backend`);
    return twimlResponse();
  }

  // 2. Parse Twilio form-encoded payload
  const payload = await parseTwilioPayload(req);
  if (!payload) {
    console.warn(`${LOG} Failed to parse form body — ignoring request`);
    return twimlResponse();
  }

  const { MessageSid, From, Body, NumMedia, MediaUrl0, MediaContentType0, ProfileName } = payload;

  console.log(
    `${LOG} Received sid=${MessageSid} from=${From}` +
    ` numMedia=${NumMedia} profile=${ProfileName ?? "unknown"}`
  );

  // 3. Normalise sender phone
  const phone = normalisePhone(From);
  if (!phone) {
    console.error(`${LOG} Could not extract phone from From="${From}" sid=${MessageSid}`);
    return twimlResponse();
  }

  const numMedia = parseInt(NumMedia, 10);

  // ── TURN 2: Text-only reply ──────────────────────────────────────────────
  if (numMedia === 0 || !MediaUrl0 || !MediaContentType0) {
    const choice = parseRoutingChoice(Body);

    if (!choice) {
      console.log(`${LOG} Unrecognised text body="${Body}" sid=${MessageSid}`);
      return twimlResponse(HELP_MESSAGE);
    }

    console.log(`${LOG} Routing choice=${choice} phone=${phone} sid=${MessageSid}`);

    const forwardBody: BackendInboundBody = {
      action:      "route_pending",
      message_sid: MessageSid,
      phone,
      choice,
    };

    let backendMessage: string | undefined;
    try {
      const res = await fetch(`${apiUrl}/whatsapp/inbound`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(forwardBody),
      });
      if (res.ok) {
        const data: BackendInboundResponse = await res.json();
        backendMessage = data.message;
        console.log(`${LOG} Route dispatched userId=${data.user_id ?? "unknown"} choice=${choice} sid=${MessageSid}`);
      } else {
        const errText = await res.text();
        console.error(`${LOG} Backend rejected status=${res.status} body=${errText} sid=${MessageSid}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${LOG} Backend fetch failed: ${msg} sid=${MessageSid}`);
    }

    return twimlResponse(
      backendMessage ??
        (choice === "1"
          ? "Running your Biometric Scan now. Results will appear on your profile shortly."
          : "Video saved to your Vault. View it at grassrootssports.live")
    );
  }

  // ── TURN 1: Video arrives ────────────────────────────────────────────────

  // 4. Reject non-video media
  if (!MediaContentType0.startsWith("video/")) {
    console.warn(`${LOG} Non-video media rejected contentType=${MediaContentType0} sid=${MessageSid}`);
    return twimlResponse(
      `File type "${MediaContentType0}" is not supported. ` +
      "Please send a video file (MP4, MOV, AVI, etc.) to submit your highlight."
    );
  }

  console.log(`${LOG} Video confirmed type=${MediaContentType0} url=${MediaUrl0} sid=${MessageSid}`);

  // 5. Upload to R2 now so the pending record holds a permanent, auth-free URL.
  //    Falls back to the Twilio URL if R2 is not configured or the upload fails.
  const r2Url    = await uploadToR2(MediaUrl0, MediaContentType0, phone, MessageSid, LOG);
  const mediaUrl = r2Url ?? MediaUrl0;

  if (r2Url) {
    console.log(`${LOG} Using R2 URL for pending record sid=${MessageSid}`);
  } else {
    console.log(`${LOG} Using Twilio URL for pending record (R2 unavailable) sid=${MessageSid}`);
  }

  // 6. Forward to Laravel — passes the R2 URL (or Twilio fallback) as media_url
  const forwardBody: BackendInboundBody = {
    action:       "prompt",
    message_sid:  MessageSid,
    phone,
    media_url:    mediaUrl,
    media_type:   MediaContentType0,
    profile_name: ProfileName ?? null,
  };

  let backendMessage: string | undefined;
  try {
    const res = await fetch(`${apiUrl}/whatsapp/inbound`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(forwardBody),
    });
    if (res.ok) {
      const data: BackendInboundResponse = await res.json();
      backendMessage = data.message;
      console.log(`${LOG} Pending video stored userId=${data.user_id ?? "pending"} sid=${MessageSid}`);
    } else {
      const errText = await res.text();
      console.error(`${LOG} Backend rejected status=${res.status} body=${errText} sid=${MessageSid}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Backend fetch failed: ${msg} sid=${MessageSid}`);
  }

  // 7. Always reply with the routing prompt
  return twimlResponse(backendMessage ?? PROMPT_MESSAGE);
}
