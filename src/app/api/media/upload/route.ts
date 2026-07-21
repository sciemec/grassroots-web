// src/app/api/media/upload/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Unified Media Upload — Phase 1
//
// Step 1: POST here with file metadata → returns { uploadUrl, publicUrl, key }
// Step 2: Browser XHR PUTs file directly to R2 using uploadUrl
// Step 3: Browser calls POST /api/media/confirm with the key + Laravel metadata
//         → Next.js forwards to Laravel POST /media to register the DB record
//
// Why two steps?
//   Large video bytes never hit Next.js or Laravel.
//   Only the metadata flows through our servers.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  let body: {
    fileName:    string;
    contentType?: string;
    context:     string;   // showcase | vault | fan_hub | drill_analysis | arena_post | match_eye | training
    userId?:     string;   // included so the R2 key is namespaced per user
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }
  if (!body.context) {
    return NextResponse.json({ error: 'context is required' }, { status: 400 });
  }

  const VALID_CONTEXTS = [
    'showcase', 'vault', 'fan_hub', 'drill_analysis',
    'arena_post', 'match_eye', 'training', 'whatsapp',
  ];
  if (!VALID_CONTEXTS.includes(body.context)) {
    return NextResponse.json({ error: `Invalid context: ${body.context}` }, { status: 400 });
  }

  // R2 not configured — degrade gracefully
  if (
    (!process.env.CLOUDFLARE_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID) ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    return NextResponse.json({ uploadUrl: '', publicUrl: '', key: '' });
  }

  try {
    const contentType = body.contentType ?? 'video/mp4';
    const ext         = body.fileName.split('.').pop() ?? 'mp4';
    const unique      = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userSegment = body.userId ? `${body.userId}/` : '';

    // Unified R2 path: media/{user_id}/{context}/{unique}.ext
    const key = `media/${userSegment}${body.context}/${unique}.${ext}`;

    const uploadUrl = await generatePresignedPutUrl({
      key,
      contentType,
      expiresInSec: 900, // 15 minutes
    });

    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });

  } catch (err) {
    console.error('[media/upload] presign error:', err);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
