// src/app/api/cron/streak-reminder/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Weekly streak reminder — Gap 2 of the Nurture goal
//
// Fires every Friday afternoon (set up as a Vercel cron job).
// Sends a push notification to every player who has NOT tested this week.
// Message: "You have not tested this week yet. Your streak is at risk."
//
// Also handles the school leaderboard weekly reset on Sunday midnight.
//
// HOW TO SET UP THE CRON:
// Add to vercel.json:
// {
//   "crons": [
//     { "path": "/api/cron/streak-reminder", "schedule": "0 14 * * 5" },
//     { "path": "/api/cron/school-leaderboard", "schedule": "0 0 * * 0" }
//   ]
// }
//
// The route is protected by CRON_SECRET — Vercel sets this automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function GET(req: NextRequest) {
  // Verify this is coming from Vercel cron (not a random public request)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Ask bhora-ai for all players who have not tested in the last 7 days
    const res = await fetch(`${API}/admin/players/streak-at-risk`, {
      headers: {
        'Accept':        'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not fetch at-risk players' }, { status: 500 });
    }

    const { players } = await res.json();
    // players: [{ id, name, fcm_token, weekly_streak, last_test_at }]

    let sent = 0;
    let failed = 0;

    for (const player of players ?? []) {
      if (!player.fcm_token) continue;

      const streakMsg = player.weekly_streak > 0
        ? `You have not tested this week yet. Your ${player.weekly_streak}-week streak is at risk.`
        : `Test this week to start your training streak. Every session counts.`;

      try {
        await sendFCMNotification({
          token:   player.fcm_token,
          title:   'GRS Friday reminder 🔥',
          body:    streakMsg,
          data:    {
            type: 'streak_reminder',
            url:  '/player/talent-id',
          },
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total:     players?.length ?? 0,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('streak-reminder cron error:', err);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}

// ── FCM push notification sender ──────────────────────────────────────────────
// Uses Firebase Admin SDK via env var credentials
async function sendFCMNotification(params: {
  token: string;
  title: string;
  body:  string;
  data?: Record<string, string>;
}): Promise<void> {
  // Get a Firebase access token via service account credentials
  const accessToken = await getFirebaseAccessToken();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const endpoint  = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const payload = {
    message: {
      token:        params.token,
      notification: { title: params.title, body: params.body },
      data:         params.data ?? {},
      webpush: {
        notification: {
          title:  params.title,
          body:   params.body,
          icon:   '/icons/icon-192.png',
          badge:  '/icons/badge-72.png',
          click_action: params.data?.url ?? '/',
        },
      },
    },
  };

  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FCM send failed: ${err}`);
  }
}

// ── Get Firebase OAuth2 access token from service account ────────────────────
async function getFirebaseAccessToken(): Promise<string> {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON not set');

  const credentials = JSON.parse(credentialsJson);
  const now = Math.floor(Date.now() / 1000);

  // Build JWT
  const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss:   credentials.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }));

  // Sign with private key (using Web Crypto — works in Next.js edge/serverless)
  const privateKeyPem = credentials.private_key;
  const keyData = await crypto.subtle.importKey(
    'pkcs8',
    pemToBuf(privateKeyPem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyData,
    new TextEncoder().encode(`${header}.${payload}`)
  );

  const jwt = `${header}.${payload}.${bufToBase64Url(signature)}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

function pemToBuf(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----.*?-----/g, '').replace(/\s/g, '');
  const binary  = atob(base64);
  const buf     = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function bufToBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}