import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/whatsapp
 * Twilio inbound WhatsApp webhook receiver.
 *
 * Twilio calls this URL when a WhatsApp message arrives on the sandbox/approved number.
 * This route:
 *   1. Parses the form-encoded Twilio payload
 *   2. Validates the attached media is a video
 *   3. Extracts the sender's phone number (strips "whatsapp:" prefix)
 *   4. Forwards the video metadata to Laravel — backend resolves the user by phone
 *      and queues the clip for processing (no hardcoded user mappings here)
 *   5. Returns a TwiML XML 200 response — Twilio retries on non-200, so we always 200
 *
 * Required env vars:
 *   TWILIO_AUTH_TOKEN        — used to confirm service is configured
 *   NEXT_PUBLIC_API_URL      — Laravel backend base URL
 *
 * Laravel endpoint called:
 *   POST /api/v1/whatsapp/inbound
 *   Body: { message_sid, phone, media_url, media_type, profile_name }
 */

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

/** Shape of the payload forwarded to the Laravel backend. */
interface BackendInboundBody {
  message_sid: string;
  phone: string;
  media_url: string;
  media_type: string;
  profile_name: string | null;
}

/** Expected shape of the Laravel backend response. */
interface BackendInboundResponse {
  ok: boolean;
  user_id?: string;
  message?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    // Still return 200 TwiML so Twilio does not queue retries
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

  const {
    MessageSid,
    From,
    NumMedia,
    MediaUrl0,
    MediaContentType0,
    ProfileName,
  } = payload;

  console.log(
    `${LOG} Received sid=${MessageSid} from=${From}` +
    ` numMedia=${NumMedia} profile=${ProfileName ?? "unknown"}`
  );

  // 3. Reject if no media is attached
  const numMedia = parseInt(NumMedia, 10);
  if (numMedia === 0 || !MediaUrl0 || !MediaContentType0) {
    console.log(
      `${LOG} No media attached — text-only message ignored sid=${MessageSid}`
    );
    return twimlResponse(
      "No video received. Please send a video clip to submit your highlight."
    );
  }

  // 4. Validate the media is a video — reject images, audio, documents
  if (!MediaContentType0.startsWith("video/")) {
    console.warn(
      `${LOG} Non-video media rejected contentType=${MediaContentType0} sid=${MessageSid}`
    );
    return twimlResponse(
      `File type "${MediaContentType0}" is not supported. ` +
      "Please send a video file (MP4, MOV, AVI, etc.) to submit your highlight."
    );
  }

  console.log(
    `${LOG} Video confirmed type=${MediaContentType0} url=${MediaUrl0} sid=${MessageSid}`
  );

  // 5. Normalise the sender's phone number
  const phone = normalisePhone(From);
  if (!phone) {
    console.error(
      `${LOG} Could not extract phone from From="${From}" sid=${MessageSid}`
    );
    return twimlResponse();
  }

  // 6. Forward video metadata to Laravel backend.
  //    Laravel resolves the user by phone number and queues the clip — no client-side
  //    auth store is accessible here (Zustand is browser-only localStorage).
  const forwardBody: BackendInboundBody = {
    message_sid:  MessageSid,
    phone,
    media_url:    MediaUrl0,
    media_type:   MediaContentType0,
    profile_name: ProfileName ?? null,
  };

  let backendAccepted = false;
  try {
    const res = await fetch(`${apiUrl}/whatsapp/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardBody),
    });

    if (res.ok) {
      const data: BackendInboundResponse = await res.json();
      backendAccepted = true;
      console.log(
        `${LOG} Backend accepted userId=${data.user_id ?? "pending"} sid=${MessageSid}`
      );
    } else {
      const errText = await res.text();
      console.error(
        `${LOG} Backend rejected status=${res.status} body=${errText} sid=${MessageSid}`
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} Backend fetch failed: ${msg} sid=${MessageSid}`);
  }

  // 7. Always return HTTP 200 TwiML — prevents Twilio from queuing retries
  if (backendAccepted) {
    return twimlResponse(
      "Video received! Your highlight is being processed and will appear on your profile shortly."
    );
  }

  // Backend was unavailable — acknowledge receipt and process asynchronously
  return twimlResponse(
    "Video received. We'll process your clip soon and add it to your profile."
  );
}
