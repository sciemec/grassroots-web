// src/app/api/whatsapp/route.ts
// Meta Cloud API — WhatsApp webhook
// Migrated from Twilio on 23 June 2026
// Two-turn video routing: video → prompt → choice 1 (biometric) or 2 (vault)

import { NextRequest, NextResponse } from 'next/server';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

// ─── Meta API helpers ────────────────────────────────────────────────────────

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/**
 * Send a WhatsApp text message via Meta Cloud API
 */
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

/**
 * Fetch the download URL for a Meta media object using its ID
 */
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

/**
 * Download video bytes from Meta CDN using Bearer token
 */
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

// ─── R2 upload helper (unchanged from Twilio version) ────────────────────────

function getS3Client(): S3Client | null {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

async function uploadToR2(
  buffer: ArrayBuffer,
  phone: string,
  messageId: string,
  mimeType: string,
): Promise<string | null> {
  const s3 = getS3Client();
  if (!s3) return null;

  const ext    = mimeType.includes('mp4') ? 'mp4' : mimeType.split('/')[1] ?? 'bin';
  const digits = phone.replace(/\D/g, '');
  const key    = `whatsapp/${digits}/${messageId}.${ext}`;
  const bucket = process.env.R2_BUCKET ?? 'grassroots-videos';

  try {
    await s3.send(new PutObjectCommand({
      Bucket:      bucket,
      Key:         key,
      Body:        Buffer.from(buffer),
      ContentType: mimeType,
    }));

    const publicUrl = process.env.R2_PUBLIC_URL;
    return publicUrl ? `${publicUrl}/${key}` : null;
  } catch (err) {
    console.error('[R2] Upload failed:', err);
    return null;
  }
}

// ─── Laravel forwarding helper (unchanged) ────────────────────────────────────

async function forwardToLaravel(payload: Record<string, string>): Promise<void> {
  const laravelUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

  try {
    await fetch(`${laravelUrl}/whatsapp/inbound`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[Laravel] Forward failed:', err);
  }
}

// ─── Routing choice parser (unchanged) ───────────────────────────────────────

function parseRoutingChoice(text: string): '1' | '2' | null {
  const t = text.trim().toLowerCase();
  if (['1', 'scan', 'biometric'].includes(t)) return '1';
  if (['2', 'vault', 'save', 'highlight'].includes(t)) return '2';
  return null;
}

// ─── Message strings ──────────────────────────────────────────────────────────

const PROMPT_MESSAGE = `🎬 *GrassRoots Sports* received your video!

Reply with:
*1* — Biometric Scan (AI analyses your movement)
*2* — Video Vault (save to your Highlight Vault)`;

const HELP_MESSAGE = `👋 *GrassRoots Sports Bot*

Send a video to get started.
Reply *1* to run a Biometric Scan or *2* to save to your Vault.

🔗 grassrootssports.live`;

const SCAN_CONFIRM  = '🏃 *Running your Biometric Scan now…* You will receive your results in under 2 minutes.';
const VAULT_CONFIRM = '✅ *Video saved to your Highlight Vault!* View it at grassrootssports.live/player/vault';

// ─── GET — Meta webhook verification ─────────────────────────────────────────

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
    console.log('[WhatsApp] Webhook verified ✅');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[WhatsApp] Verification failed — mode:', mode, '| token match:', token?.trim() === expectedToken, '| env set:', !!expectedToken);
  return new NextResponse('Forbidden', { status: 403 });
}

// ─── POST — Incoming WhatsApp messages ───────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Extract message from Meta's nested payload structure
  const entry   = (payload?.entry as Record<string, unknown>[])?.[0];
  const change  = (entry?.changes as Record<string, unknown>[])?.[0];
  const value   = change?.value as Record<string, unknown> | undefined;
  const message = (value?.messages as Record<string, unknown>[])?.[0];

  // Ignore delivery receipts and read receipts (no message object)
  if (!message) {
    return new NextResponse('OK', { status: 200 });
  }

  const from      = message.from as string;       // E.164 without + e.g. "263712345678"
  const messageId = message.id as string;          // "wamid.xxxxx"
  const type      = message.type as string;        // "video" | "text" | "image" | etc.

  // ── TURN 1: Video arrives ─────────────────────────────────────────────────
  if (type === 'video' || type === 'audio') {
    const videoObj = (message?.video ?? message?.audio) as Record<string, string> | undefined;
    const mediaId  = videoObj?.id;
    const mimeType = videoObj?.mime_type ?? 'video/mp4';

    if (!mediaId) {
      await sendWhatsAppMessage(from, HELP_MESSAGE);
      return new NextResponse('OK', { status: 200 });
    }

    // Fetch the actual download URL from Meta
    const mediaUrl = await fetchMetaMediaUrl(mediaId);
    if (!mediaUrl) {
      await sendWhatsAppMessage(from, '⚠️ Could not process your video. Please try again.');
      return new NextResponse('OK', { status: 200 });
    }

    // Download video bytes
    const buffer = await downloadMetaMedia(mediaUrl);
    if (!buffer) {
      await sendWhatsAppMessage(from, '⚠️ Could not download your video. Please try again.');
      return new NextResponse('OK', { status: 200 });
    }

    // Upload to R2
    const r2Url     = await uploadToR2(buffer, from, messageId, mimeType);
    const storedUrl = r2Url ?? mediaUrl; // fallback to Meta URL if R2 fails

    // Forward to Laravel — store as pending, await player choice
    await forwardToLaravel({
      action:      'prompt',
      phone:       `+${from}`,
      message_sid: messageId,
      media_url:   storedUrl,
      media_type:  mimeType,
    });

    // Send routing prompt to player
    await sendWhatsAppMessage(from, PROMPT_MESSAGE);
    return new NextResponse('OK', { status: 200 });
  }

  // ── Reject images (not supported) ────────────────────────────────────────
  if (type === 'image') {
    await sendWhatsAppMessage(
      from,
      '📹 Please send a *video*, not a photo. We need a video clip to run your analysis.',
    );
    return new NextResponse('OK', { status: 200 });
  }

  // ── TURN 2: Player replies with choice ───────────────────────────────────
  if (type === 'text') {
    const body   = (message?.text as Record<string, string> | undefined)?.body ?? '';
    const choice = parseRoutingChoice(body);

    if (!choice) {
      await sendWhatsAppMessage(from, HELP_MESSAGE);
      return new NextResponse('OK', { status: 200 });
    }

    // Forward choice to Laravel
    await forwardToLaravel({
      action: 'route_pending',
      phone:  `+${from}`,
      choice,
    });

    // Confirm to player
    await sendWhatsAppMessage(from, choice === '1' ? SCAN_CONFIRM : VAULT_CONFIRM);
    return new NextResponse('OK', { status: 200 });
  }

  // ── Unknown message type ──────────────────────────────────────────────────
  await sendWhatsAppMessage(from, HELP_MESSAGE);
  return new NextResponse('OK', { status: 200 });
}
