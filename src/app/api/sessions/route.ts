// src/app/api/sessions/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Next.js route handler — saves GRS test session results to PostgreSQL
// via the Laravel backend. Fails gracefully so the results screen always
// loads even when the backend is cold-starting or the player is offline.
//
// Called by: src/hooks/useSessionSubmit.ts → Step 1
// Laravel endpoint: POST /api/v1/sessions
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const LARAVEL = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ saved: false, error: 'Invalid request body' }, { status: 400 });
  }

  const authHeader  = req.headers.get('authorization') ?? '';
  const token       = authHeader.replace(/^Bearer\s+/i, '').trim();
  const isRealToken = token.length > 10 && token !== 'dev-token';

  // ── Forward to Laravel when a real auth token is present ─────────────────
  if (isRealToken) {
    try {
      const laravelRes = await fetch(`${LARAVEL}/sessions`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body:   JSON.stringify(body),
        signal: AbortSignal.timeout(8000), // never block the results screen > 8s
      });

      if (laravelRes.ok) {
        const data = await laravelRes.json();
        return NextResponse.json({ saved: true, ...data });
      }

      const errText = await laravelRes.text().catch(() => '');
      console.error(`[sessions] Laravel ${laravelRes.status}:`, errText);

    } catch (err) {
      console.error('[sessions] Backend unreachable:', err);
    }
  }

  // ── Offline / unauthenticated / backend unavailable ──────────────────────
  // Return 200 so useSessionSubmit doesn't throw and the results screen loads.
  return NextResponse.json({
    saved:     false,
    local:     true,
    sessionId: (body?.sessionId as string) ?? crypto.randomUUID(),
    message:   isRealToken
      ? 'Backend unavailable — session saved locally and will sync on next login'
      : 'Sign in to save your results to your permanent record',
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token      = authHeader.replace(/^Bearer\s+/i, '').trim();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '12';

  if (!token || token === 'dev-token') {
    return NextResponse.json({ sessions: [] });
  }

  try {
    const res = await fetch(`${LARAVEL}/sessions?limit=${limit}`, {
      headers: {
        'Accept':        'application/json',
        'Authorization': `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return NextResponse.json({ sessions: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}
