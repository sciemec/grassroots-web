import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/whatsapp
 * Twilio inbound WhatsApp webhook receiver with interactive prompt routing.
 *
 * Two-turn conversation flow:
 *
 *   Turn 1 — video arrives:
 *     → Validates media is a video
 *     → Forwards to Laravel with action="prompt"
 *     → Laravel stores pending video keyed by phone (whatsapp_pending_videos table)
 *     → Bot replies asking the user to choose: Biometric Scan or Video Vault
 *
 *   Turn 2 — user replies "1" or "2" (text-only):
 *     → Forwards to Laravel with action="route_pending" + choice
 *     → Laravel looks up pending video by phone and dispatches:
 *         choice=1 → biometric scan pipeline (Python AI service /analyse)
 *         choice=2 → saves media_url to player_highlights table under player's profile
 *     → Bot confirms the action taken
 *
 * Required env vars:
 *   TWILIO_AUTH_TOKEN   — confirms service is configured
 *   NEXT_PUBLIC_API_URL — Laravel backend base URL
 *
 * Laravel endpoint called:
 *   POST /api/v1/whatsapp/inbound
 *   Turn 1 body: { action, message_sid, phone, media_url, media_type, profile_name }
 *   Turn 2 body: { action, message_sid, phone, choice }
 *   Response:    { ok, user_id?, message? }
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Sent to the user immediately after a video is received.
 * Twilio renders \n as a new line in WhatsApp messages.
 */
const PROMPT_MESSAGE =
  "Video received! What would you like to do?\n\n" +
  "Reply *1* — Run AI Biometric Scan\n" +
  "Reply *2* — Save to Video Vault";

const HELP_MESSAGE =
  "Send a video clip to get started.\n\n" +
  "If you already sent a video, reply *1* for Biometric Scan or *2* for Video Vault.";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Fields Twilio sends in the webhook POST body (all values arrive as strings). */
interface TwilioInboundPayload {
  MessageSid: string;
  From: string;               // e.g. "whatsapp:+263712345678"
  To: string;
  Body: string;
  NumMedia: string;           // "0", "1", etc.
  MediaUrl0?: string;         // URL of first media attachment
  MediaContentType0?: string; // MIME type, e.g. "video/mp4"
  ProfileName?: string;       // WhatsApp display name of sender
}

/**
 * Shape of the payload forwarded to the Laravel backend.
 * action="prompt"       → Turn 1: video received, store pending and await choice
 * action="route_pending" → Turn 2: user chose an action, dispatch accordingly
 */
interface BackendInboundBody {
  action: "prompt" | "route_pending";
  message_sid: string;
  phone: string;
  // Turn 1 fields (action=prompt):
  media_url?: string;
  media_type?: string;
  profile_name?: string | null;
  // Turn 2 fields (action=route_pending):
  choice?: "1" | "2";
}

/** Expected shape of the Laravel backend response. */
interface BackendInboundResponse {
  ok: boolean;
  user_id?: string;
  message?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a free-text routing reply into a canonical choice.
 * Accepts: "1", "scan", "biometric" → "1"
 *          "2", "vault", "save", "highlight" → "2"
 * Returns null for anything unrecognised.
 */
function parseRoutingChoice(body: string): "1" | "2" | null {
  const t = body.trim().toLowerCase();
  if (t === "1" || t.includes("scan") || t.includes("biometric")) return "1";
  if (t === "2" || t.includes("vault") || t.includes("save") || t.includes("highlight")) return "2";
  return null;
}

/**
 * Parse Twilio's application/x-www-form-urlencoded webhook body into typed fields.
 * Returns null if the body cannot be read.
 */
async function parseTwilioPayload(
  req: NextRequest
): Promise<TwilioInboundPayload | null> {
  try {
    const form = await req.formData();
    return {
      MessageSid:        String(form.get("MessageSid") ?? ""),
      From:              String(form.get("From") ?? ""),
      To:                String(form.get("To") ?? ""),
      Body:              String(form.get("Body") ?? ""),
      NumMedia:          String(form.get("NumMedia") ?? "0"),
      MediaUrl0:         form.has("MediaUrl0")
                           ? String(form.get("MediaUrl0"))
                           : undefined,
      MediaContentType0: form.has("MediaContentType0")
                           ? String(form.get("MediaContentType0"))
                           : undefined,
      ProfileName:       form.has("ProfileName")
                           ? String(form.get("ProfileName"))
                           : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Strip the "whatsapp:" prefix Twilio prepends to the From field.
 * Returns the raw E.164 phone number string, e.g. "+263712345678".
 */
function normalisePhone(from: string): string {
  return from.replace(/^whatsapp:/i, "").trim();
}

/**
 * Build a TwiML XML response.
 * Twilio requires Content-Type: text/xml and HTTP 200 — any other status triggers retries.
 * If message is provided, Twilio sends it back to the user as a reply.
 */
function twimlResponse(message?: string): NextResponse {
  const body =
    message
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

  // 1. Confirm required env vars are present
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
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

  // 3. Normalise the sender's phone number — required for all branches
  const phone = normalisePhone(From);
  if (!phone) {
    console.error(`${LOG} Could not extract phone from From="${From}" sid=${MessageSid}`);
    return twimlResponse();
  }

  const numMedia = parseInt(NumMedia, 10);

  // ── TURN 2: Text-only reply — user is routing a previously received video ──
  if (numMedia === 0 || !MediaUrl0 || !MediaContentType0) {
    const choice = parseRoutingChoice(Body);

    if (!choice) {
      // Unrecognised text — guide the user
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forwardBody),
      });

      if (res.ok) {
        const data: BackendInboundResponse = await res.json();
        backendMessage = data.message;
        console.log(
          `${LOG} Route dispatched userId=${data.user_id ?? "unknown"} choice=${choice} sid=${MessageSid}`
        );
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

  // ── TURN 1: Video message — validate, store pending, prompt for routing choice ──

  // 4. Reject non-video media (images, audio, documents)
  if (!MediaContentType0.startsWith("video/")) {
    console.warn(
      `${LOG} Non-video media rejected contentType=${MediaContentType0} sid=${MessageSid}`
    );
    return twimlResponse(
      `File type "${MediaContentType0}" is not supported. ` +
      "Please send a video file (MP4, MOV, AVI, etc.) to submit your highlight."
    );
  }

  console.log(`${LOG} Video confirmed type=${MediaContentType0} url=${MediaUrl0} sid=${MessageSid}`);

  // 5. Forward to Laravel with action="prompt".
  //    Laravel resolves the user by phone, stores the pending video in
  //    whatsapp_pending_videos keyed by phone, and awaits the routing choice.
  //    No client-side auth store (Zustand is browser-only localStorage).
  const forwardBody: BackendInboundBody = {
    action:       "prompt",
    message_sid:  MessageSid,
    phone,
    media_url:    MediaUrl0,
    media_type:   MediaContentType0,
    profile_name: ProfileName ?? null,
  };

  let backendMessage: string | undefined;
  try {
    const res = await fetch(`${apiUrl}/whatsapp/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardBody),
    });

    if (res.ok) {
      const data: BackendInboundResponse = await res.json();
      backendMessage = data.message;
      console.log(
        `${LOG} Pending video stored userId=${data.user_id ?? "pending"} sid=${MessageSid}`
      );
    } else {
      const errText = await res.text();
      console.error(`${LOG} Backend rejected status=${res.status} body=${errText} sid=${MessageSid}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Backend fetch failed: ${msg} sid=${MessageSid}`);
  }

  // 6. Always reply with the routing prompt — even if the backend was unavailable.
  //    The backend's custom message overrides the default when present.
  return twimlResponse(backendMessage ?? PROMPT_MESSAGE);
}
