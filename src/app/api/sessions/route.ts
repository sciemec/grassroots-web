// src/app/api/sessions/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Session save API — stores GRS test results
// Proxies to bhora-ai backend. Falls back to localStorage on failure.
// Called by: useSessionSubmit.ts, talent-id page
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Get auth token from request header (passed by client)
  const authHeader = req.headers.get('authorization');

  try {
    const res = await fetch(`${API}/player/test-sessions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Return 200 with a localStorage hint — client handles offline fallback
      return NextResponse.json({
        saved:   false,
        offline: true,
        message: 'Session saved locally — will sync when connected',
      }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json({ saved: true, session: data });

  } catch (err) {
    // Network error — client will use localStorage
    return NextResponse.json({
      saved:   false,
      offline: true,
      message: 'Offline — session saved locally',
    }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '12';

  try {
    const res = await fetch(`${API}/player/test-sessions?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (!res.ok) return NextResponse.json({ sessions: [] });
    const data = await res.json();
    return NextResponse.json(data);

  } catch {
    return NextResponse.json({ sessions: [] });
  }
}