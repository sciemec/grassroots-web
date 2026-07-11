// src/app/api/whatsapp/route.ts
// Meta Cloud API — WhatsApp webhook
// Three-way media routing: media → prompt → choice (arena | vault | biometric)
// Plain text (non-command, ≥3 chars) → post to Arena feed
// Commands: HELP, STOP, UNSUBSCRIBE, STATS, GOAL, ALL

import { NextRequest, NextResponse } from 'next/server';
import { putBinaryObject } from '@/lib/r2';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';
const API       = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

// Words that are never treated as Arena posts
const COMMANDS = new Set(['stop', 'unsubscribe', 'start', 'help', 'stats', 'goal', 'all']);

// ── Send WhatsApp message via Meta Cloud API ──────────────────────────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error('[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return;
  }

  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[WhatsApp] Failed to send message:', err);
  }
}

// ── Resolve a Meta media ID to a download URL ─────────────────────────────────
async function fetchMetaMediaUrl(mediaId: string): Promise<string | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const res = await fetch(`${GRAPH_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error('[WhatsApp] Failed to fetch media URL for', mediaId);
    return null;
  }

  const data = await res.json();
  return data.url ?? null;
}

// ── Download media bytes from Meta CDN ───────────────────────────────────────
async function downloadMetaMedia(mediaUrl: string): Promise<ArrayBuffer | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error('[WhatsApp] Failed to download media from', mediaUrl);
    return null;
  }

  return res.arrayBuffer();
}

// ── Upload binary to Cloudflare R2 ───────────────────────────────────────────
async function uploadToR2(
  buffer: ArrayBuffer,
  phone: string,
  messageId: string,
  mimeType: string,
): Promise<string | null> {
  const ext    = mimeType.includes('mp4') ? 'mp4' : mimeType.split('/')[1] ?? 'bin';
  const digits = phone.replace(/\D/g, '');
  const key    = `whatsapp/${digits}/${messageId}.${ext}`;

  try {
    const ok = await putBinaryObject(key, buffer, mimeType);
    if (!ok) return null;

    const publicUrl = process.env.R2_PUBLIC_URL;
    return publicUrl ? `${publicUrl}/${key}` : null;
  } catch (err) {
    console.error('[R2] Upload failed:', err);
    return null;
  }
}

// ── POST plain text to Arena feed via Laravel ────────────────────────────────
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

// ── Forward pending media or routing choice to Laravel ───────────────────────
async function forwardToLaravel(payload: Record<string, string>): Promise<Response | null> {
  try {
    return await fetch(`${API}/whatsapp/inbound`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[Laravel] Forward failed:', err);
    return null;
  }
}

// ── Parse routing choice — accepts digit or keyword alias ─────────────────────
function parseRoutingChoice(text: string): 'arena' | 'vault' | 'biometric' | null {
  const t = text.trim().toLowerCase();
  if (['1', 'arena', 'post', 'feed'].includes(t))      return 'arena';
  if (['2', 'vault', 'save', 'highlight'].includes(t)) return 'vault';
  if (['3', 'scan', 'biometric'].includes(t))          return 'biometric';
  return null;
}

// ── Message templates ─────────────────────────────────────────────────────────
function buildPromptMessage(isVideo: boolean): string {
  return (
    `Got your ${isVideo ? 'video \uD83C\uDFA5' : 'photo \uD83D\uDCF8'}! What would you like to do?\n\n` +
    `Reply:\n` +
    `*1* \u2192 Post to Arena feed \uD83D\uDCF1\n` +
    `*2* \u2192 Save to Vault \uD83C\uDFAC` +
    (isVideo ? '\n*3* \u2192 Biometric Scan \uD83C\uDFC3' : '')
  );
}

function buildHelpMessage(affiliateUrl?: string): string {
  return (
    `\uD83D\uDCF1 *GrassRoots Sports \u2014 WhatsApp*\n\n` +
    `*Post to Arena:* Just type any message\n` +
    `*Share media:* Send a photo or video\n\n` +
    `*Commands:*\n` +
    `\u2022 STATS \u2014 match statistics\n` +
    `\u2022 GOAL \u2014 goal alerts only\n` +
    `\u2022 ALL \u2014 full match updates\n` +
    `\u2022 STOP \u2014 unsubscribe\n` +
    `\u2022 HELP \u2014 this menu` +
    (affiliateUrl ? `\n\n\uD83D\uDCB0 Betting: ${affiliateUrl}` : '') +
    `\n\n\uD83D\uDD17 grassrootssports.live`
  );
}

const ARENA_CONFIRM  = '\u2705 *Posted to your Arena feed!* View it at grassrootssports.live/arena';
const VAULT_CONFIRM  = '\u2705 *Video saved to your Highlight Vault!* View it at grassrootssports.live/player/vault';
const SCAN_CONFIRM   = '\uD83C\uDFC3 *Running your Biometric Scan now\u2026* You will receive your results in under 2 minutes.';
const NO_PENDING_MSG =
  `No pending media found. Send a photo or video first, then reply *1*, *2*, or *3*.\n\n` +
  `Or just type your update to post it to your Arena feed directly!`;

// ── GET: Meta webhook verification ───────────────────────────────────────────
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (
    mode === 'subscribe' &&
    token?.trim() === expectedToken &&
    expectedToken
  ) {
    console.log('[WhatsApp] Webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn(
    '[WhatsApp] Verification failed \u2014 mode:', mode,
    '| token match:', token?.trim() === expectedToken,
    '| env set:', !!expectedToken,
  );
  return new NextResponse('Forbidden', { status: 403 });
}

// ── POST: Main message handler ────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const entry   = (payload?.entry as Record<string, unknown>[])?.[0];
  const change  = (entry?.changes as Record<string, unknown>[])?.[0];
  const value   = change?.value as Record<string, unknown> | undefined;
  const message = (value?.messages as Record<string, unknown>[])?.[0];

  if (!message) {
    return new NextResponse('OK', { status: 200 });
  }

  const from      = message.from as string;
  const messageId = message.id as string;
  const type      = message.type as string;

  // ── 1. Video / audio — download → R2 → 3-option routing prompt ─────────────
  if (type === 'video' || type === 'audio') {
    const mediaObj = (message?.video ?? message?.audio) as Record<string, string> | undefined;
    const mediaId  = mediaObj?.id;
    const mimeType = mediaObj?.mime_type ?? 'video/mp4';

    if (!mediaId) {
      await sendWhatsAppMessage(from, buildHelpMessage());
      return new NextResponse('OK', { status: 200 });
    }

    const mediaUrl = await fetchMetaMediaUrl(mediaId);
    if (!mediaUrl) {
      await sendWhatsAppMessage(from, '\u26A0\uFE0F Could not process your video. Please try again.');
      return new NextResponse('OK', { status: 200 });
    }

    const buffer = await downloadMetaMedia(mediaUrl);
    if (!buffer) {
      await sendWhatsAppMessage(from, '\u26A0\uFE0F Could not download your video. Please try again.');
      return new NextResponse('OK', { status: 200 });
    }

    const r2Url     = await uploadToR2(buffer, from, messageId, mimeType);
    const storedUrl = r2Url ?? mediaUrl;

    await forwardToLaravel({
      action:      'prompt',
      phone:       `+${from}`,
      message_sid: messageId,
      media_url:   storedUrl,
      media_type:  mimeType,
    });

    await sendWhatsAppMessage(from, buildPromptMessage(true));
    return new NextResponse('OK', { status: 200 });
  }

  // ── 2. Image — download → R2 → 2-option routing prompt (no biometric) ───────
  if (type === 'image') {
    const imageObj = message?.image as Record<string, string> | undefined;
    const mediaId  = imageObj?.id;
    const mimeType = imageObj?.mime_type ?? 'image/jpeg';

    if (!mediaId) {
      await sendWhatsAppMessage(from, buildHelpMessage());
      return new NextResponse('OK', { status: 200 });
    }

    const mediaUrl  = await fetchMetaMediaUrl(mediaId);
    const buffer    = mediaUrl ? await downloadMetaMedia(mediaUrl) : null;
    const r2Url     = buffer ? await uploadToR2(buffer, from, messageId, mimeType) : null;
    const storedUrl = r2Url ?? mediaUrl ?? '';

    if (storedUrl) {
      await forwardToLaravel({
        action:      'prompt',
        phone:       `+${from}`,
        message_sid: messageId,
        media_url:   storedUrl,
        media_type:  mimeType,
      });
    }

    await sendWhatsAppMessage(from, buildPromptMessage(false));
    return new NextResponse('OK', { status: 200 });
  }

  // ── 3. Text messages ─────────────────────────────────────────────────────────
  if (type === 'text') {
    const body    = (message?.text as Record<string, string> | undefined)?.body ?? '';
    const command = body.trim().toLowerCase();

    // 3a. Routing choice for pending media
    const choice = parseRoutingChoice(body);
    if (choice) {
      const resp = await forwardToLaravel({
        action: 'route_pending',
        phone:  `+${from}`,
        choice,
      });

      if (resp?.status === 404) {
        await sendWhatsAppMessage(from, NO_PENDING_MSG);
      } else {
        const confirm =
          choice === 'arena'    ? ARENA_CONFIRM :
          choice === 'vault'    ? VAULT_CONFIRM :
                                  SCAN_CONFIRM;
        await sendWhatsAppMessage(from, confirm);
      }
      return new NextResponse('OK', { status: 200 });
    }

    // 3b. Known commands
    if (COMMANDS.has(command)) {
      const affiliateUrl = process.env.BETWAY_AFFILIATE_URL;

      switch (command) {
        case 'stop':
        case 'unsubscribe':
          await sendWhatsAppMessage(
            from,
            `You've been unsubscribed from GrassRoots Sports updates.\n\nReply *START* to resubscribe.`,
          );
          break;

        case 'stats':
          await sendWhatsAppMessage(
            from,
            `\uD83D\uDCCA To get match stats, reply with the match ID.\nExample: *STATS Spain vs Germany*`,
          );
          break;

        case 'goal':
          await sendWhatsAppMessage(
            from,
            `\u26BD Goal alerts only mode ON. Reply *ALL* for full updates.`,
          );
          break;

        case 'all':
          await sendWhatsAppMessage(
            from,
            `\uD83D\uDCF1 Full match updates ON. Reply *GOAL* for goals only.`,
          );
          break;

        case 'help':
        case 'start':
        default:
          await sendWhatsAppMessage(from, buildHelpMessage(affiliateUrl));
          break;
      }
      return new NextResponse('OK', { status: 200 });
    }

    // 3c. Plain text — post to Arena feed
    if (body.trim().length >= 3) {
      const result = await postTextToArena(`+${from}`, body.trim());

      if (result.ok) {
        const trimmed = body.trim();
        const preview = trimmed.slice(0, 60) + (trimmed.length > 60 ? '\u2026' : '');
        await sendWhatsAppMessage(
          from,
          `\u2705 Posted to your Arena feed!\n\n_"${preview}"_\n\nView it at grassrootssports.live/arena`,
        );
      } else if (result.error === 'not_registered') {
        await sendWhatsAppMessage(
          from,
          `Your number isn't linked to a GrassRoots account.\n\n` +
          `Sign up at *grassrootssports.live* then add your phone number in Settings \u2192 Profile.`,
        );
      } else if (result.error === 'rate_limited') {
        await sendWhatsAppMessage(
          from,
          `\u23F3 Slow down! You're posting too fast. Wait a few minutes.`,
        );
      } else {
        await sendWhatsAppMessage(
          from,
          `Something went wrong. Try again or post directly at grassrootssports.live/arena`,
        );
      }
      return new NextResponse('OK', { status: 200 });
    }
  }

  // ── 4. Fallback for unhandled message types ───────────────────────────────
  await sendWhatsAppMessage(from, buildHelpMessage());
  return new NextResponse('OK', { status: 200 });
}
