// app/api/whatsapp/webhook/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Twilio WhatsApp inbound webhook
//
// FLOWS:
//   Text message (non-command, ≥3 chars) → POST to Arena feed
//   Media message (photo/video)          → download → R2 → pending → choice prompt
//   Choice "1"                           → route pending → Arena post
//   Choice "2"                           → route pending → Video Vault
//   Choice "3"                           → route pending → Biometric Scan
//   Commands (HELP, STOP, STATS, etc.)   → existing handlers
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

const API = process.env.NEXT_PUBLIC_API_URL!;

// Words that are never treated as Arena posts
const COMMANDS       = new Set(['stop', 'unsubscribe', 'start', 'help', 'stats', 'goal', 'all']);
const ROUTING_CHOICES = new Set(['1', '2', '3']);

function twimlResponse(status = 200) {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status, headers: { 'Content-Type': 'application/xml' } },
  );
}

// ── Download media from Twilio (requires Basic Auth) ──────────────────────────
async function downloadMedia(url: string): Promise<ArrayBuffer | null> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}` },
    });
    return resp.ok ? resp.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// ── Upload to Cloudflare R2 via presigned PUT ────────────────────────────────
async function uploadToR2(buffer: ArrayBuffer, key: string, contentType: string): Promise<string | null> {
  try {
    const signedUrl = await generatePresignedPutUrl({ key, contentType });
    const res = await fetch(signedUrl, {
      method:  'PUT',
      body:    buffer,
      headers: { 'Content-Type': contentType },
    });
    return res.ok ? getPublicUrl(key) : null;
  } catch {
    return null;
  }
}

// ── POST text to Arena via Laravel ────────────────────────────────────────────
async function postTextToArena(
  phone: string,
  body: string,
): Promise<{ ok: boolean; userName?: string; error?: 'not_registered' | 'rate_limited' | 'server_error' }> {
  try {
    const resp = await fetch(`${API}/arena/posts/from-whatsapp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone, body: body.slice(0, 280) }),
    });
    if (resp.status === 404) return { ok: false, error: 'not_registered' };
    if (resp.status === 429) return { ok: false, error: 'rate_limited' };
    if (!resp.ok)            return { ok: false, error: 'server_error' };
    const data = await resp.json() as { user_name?: string };
    return { ok: true, userName: data.user_name };
  } catch {
    return { ok: false, error: 'server_error' };
  }
}

// ── Store pending media + route choice via Laravel ────────────────────────────
async function forwardToLaravel(payload: Record<string, string>): Promise<Response | null> {
  try {
    return fetch(`${API}/whatsapp/inbound`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Validate Twilio signature
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (authToken) {
      const signature = req.headers.get('x-twilio-signature') ?? '';
      const url       = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`;
      const params    = Object.fromEntries(
        [...formData.entries()].map(([k, v]) => [k, v.toString()]),
      ) as Record<string, string>;
      if (!twilio.validateRequest(authToken, signature, url, params)) {
        console.warn('Webhook: invalid Twilio signature — rejected');
        return twimlResponse(403);
      }
    }

    const body       = formData.get('Body')?.toString() ?? '';
    const from       = formData.get('From')?.toString().replace('whatsapp:', '') ?? '';
    const numMedia   = parseInt(formData.get('NumMedia')?.toString() ?? '0');
    const command    = body.toLowerCase().trim();

    if (!from) return twimlResponse(200);

    // ── 1. Incoming media (photo or video) ──────────────────────────────────
    if (numMedia > 0) {
      const mediaUrl         = formData.get('MediaUrl0')?.toString() ?? '';
      const mediaContentType = formData.get('MediaContentType0')?.toString() ?? 'video/mp4';
      const messageSid       = formData.get('MessageSid')?.toString() ?? Date.now().toString();
      const isVideo          = mediaContentType.startsWith('video');
      const ext              = mediaContentType.split('/')[1]?.split(';')[0] ?? (isVideo ? 'mp4' : 'jpg');
      const r2Key            = `whatsapp/${from.replace(/\D/g, '')}/${messageSid}.${ext}`;

      // Download from Twilio → upload to R2 (fire in background; fallback to Twilio URL)
      let stableUrl = mediaUrl;
      const buffer  = await downloadMedia(mediaUrl);
      if (buffer) {
        const r2Url = await uploadToR2(buffer, r2Key, mediaContentType);
        if (r2Url) stableUrl = r2Url;
      }

      // Store pending on Laravel
      await forwardToLaravel({
        action:      'media_pending',
        phone:       from,
        media_url:   stableUrl,
        media_type:  mediaContentType,
        message_sid: messageSid,
      });

      await sendWhatsAppMessage(
        from,
        `Got your ${isVideo ? 'video 🎥' : 'photo 📸'}! What would you like to do?\n\n` +
        `Reply:\n*1* → Post to Arena feed 📱\n*2* → Save to Vault 🎬` +
        (isVideo ? '\n*3* → Biometric Scan 🏃' : ''),
      );
      return twimlResponse(200);
    }

    // ── 2. Routing choice for pending media ─────────────────────────────────
    if (ROUTING_CHOICES.has(command)) {
      const choiceMap: Record<string, string> = { '1': 'arena', '2': 'vault', '3': 'biometric' };
      const resp = await forwardToLaravel({
        action: 'route_pending',
        phone:  from,
        choice: choiceMap[command],
      });

      if (resp?.status === 404) {
        // No pending media — treat as confusion, send guidance
        await sendWhatsAppMessage(
          from,
          `No pending media found. Send a photo or video first, then reply *1*, *2*, or *3*.\n\n` +
          `Or just type your update to post it to your Arena feed directly!`,
        );
      }
      // Success reply is sent by Laravel (AnalyseWhatsappVideoJob / ArenaFeedController)
      return twimlResponse(200);
    }

    // ── 3. Known commands ────────────────────────────────────────────────────
    if (COMMANDS.has(command)) {
      const affiliateUrl = process.env.BETWAY_AFFILIATE_URL ?? '';

      switch (command) {
        case 'stop':
        case 'unsubscribe':
          await sendWhatsAppMessage(from,
            `You've been unsubscribed from GrassRoots Sports updates.\n\nReply *START* to resubscribe.`,
          );
          break;

        case 'stats':
          await sendWhatsAppMessage(from,
            `📊 To get match stats, reply with the match ID.\nExample: *STATS Spain vs Germany*`,
          );
          break;

        case 'goal':
          await sendWhatsAppMessage(from, `⚽ Goal alerts only mode ON. Reply *ALL* for full updates.`);
          break;

        case 'all':
          await sendWhatsAppMessage(from, `📱 Full match updates ON. Reply *GOAL* for goals only.`);
          break;

        case 'help':
        default:
          await sendWhatsAppMessage(
            from,
            `📱 *GrassRoots Sports — WhatsApp*\n\n` +
            `*Post to Arena:* Just type any message\n` +
            `*Share media:* Send a photo or video\n\n` +
            `*Commands:*\n` +
            `• STATS — match statistics\n` +
            `• GOAL — goal alerts only\n` +
            `• ALL — full match updates\n` +
            `• STOP — unsubscribe\n` +
            `• HELP — this menu` +
            (affiliateUrl ? `\n\n💰 Betting: ${affiliateUrl}` : ''),
          );
          break;
      }
      return twimlResponse(200);
    }

    // ── 4. Plain text → post to Arena feed ──────────────────────────────────
    if (body.trim().length >= 3) {
      const result = await postTextToArena(from, body.trim());

      if (result.ok) {
        const preview = body.trim().slice(0, 60) + (body.trim().length > 60 ? '…' : '');
        await sendWhatsAppMessage(
          from,
          `✅ Posted to your Arena feed!\n\n` +
          `_"${preview}"_\n\n` +
          `View it at grassrootssports.live/arena`,
        );
      } else if (result.error === 'not_registered') {
        await sendWhatsAppMessage(
          from,
          `Your number isn't linked to a GrassRoots account.\n\n` +
          `Sign up at *grassrootssports.live* then add your phone number in Settings → Profile.`,
        );
      } else if (result.error === 'rate_limited') {
        await sendWhatsAppMessage(from, `⏳ Slow down! You're posting too fast. Wait a few minutes.`);
      } else {
        await sendWhatsAppMessage(
          from,
          `Something went wrong. Try again or post directly at grassrootssports.live/arena`,
        );
      }
    }

    return twimlResponse(200);

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return twimlResponse(200); // Always 200 — non-200 causes Twilio to retry
  }
}

// Health check (Twilio doesn't use GET but useful for monitoring)
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
