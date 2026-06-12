// src/app/api/vault/route.ts
// Called by useSessionSubmit.ts step 4 (background fire-and-forget).
// POST /api/vault { action, playerId, fileName, fileType, source, label }
// Returns presigned R2 PUT URL so the client uploads directly.

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const authHeader = req.headers.get('authorization');

  const {
    playerId,
    fileName    = 'session.mp4',
    fileType    = 'video/mp4',
    source      = 'test_session',
    label       = 'Session video',
  } = body;

  if (
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID      &&
    process.env.R2_SECRET_ACCESS_KEY
  ) {
    try {
      const date   = new Date().toISOString().split('T')[0];
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const ext    = fileName.split('.').pop() ?? 'mp4';
      const key    = `vault/${playerId ?? 'anon'}/${source}/${date}/${unique}.${ext}`;

      const uploadUrl = await generatePresignedPutUrl({ key, contentType: fileType, expiresInSec: 900 });

      // Register with Laravel best-effort
      fetch(`${API}/player/vault/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ playerId, r2Key: key, label, source }),
      }).catch(() => {});

      return NextResponse.json({ uploadUrl, publicUrl: getPublicUrl(key), key });
    } catch (err) {
      console.error('vault route error:', err);
    }
  }

  // R2 not configured — silent no-op
  return NextResponse.json({ uploadUrl: '', publicUrl: '', key: '' });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  try {
    const res = await fetch(`${API}/player/vault?${searchParams.toString()}`, {
      headers: { 'Accept': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
    });
    if (!res.ok) return NextResponse.json({ videos: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ videos: [] });
  }
}
