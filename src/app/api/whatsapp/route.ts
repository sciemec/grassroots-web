// src/app/api/whatsapp/route.ts
// Meta Cloud API — WhatsApp webhook proxy
// GET:  Meta webhook verification (stays in Next.js)
// POST: verify HMAC-SHA256, forward raw payload to Laravel WhatsAppController

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const LARAVEL = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

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

// ── POST: proxy all Meta webhook events to Laravel ───────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256') ?? '';

  // Verify HMAC-SHA256 if WHATSAPP_APP_SECRET is configured
  // (Meta App Secret from Meta Developer Console → App Settings → Basic)
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex');
    if (signature !== expected) {
      console.warn('[WhatsApp] HMAC signature mismatch — rejecting webhook');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // Forward raw payload to Laravel — pass signature header so Laravel can re-verify
  try {
    const resp = await fetch(`${LARAVEL}/whatsapp/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type':        'application/json',
        'X-Hub-Signature-256': signature,
      },
      body: rawBody,
      // Stay within Meta's 20 s retry window
      signal: AbortSignal.timeout(18_000),
    });

    if (!resp.ok) {
      console.error('[WhatsApp] Laravel returned', resp.status, 'for webhook forward');
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to forward webhook to Laravel:', err);
  }

  // Always return 200 — Meta retries on any non-2xx response
  return new NextResponse('OK', { status: 200 });
}
