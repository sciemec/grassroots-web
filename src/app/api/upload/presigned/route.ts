// src/app/api/upload/presigned/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Presigned R2 upload URL
//
// CHANGED: removed @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
//          now uses @/lib/r2 (generatePresignedPutUrl, getPublicUrl)
//
// POST /api/upload/presigned
// Body: { fileName, contentType, source?, label? }
// Returns: { uploadUrl, publicUrl, key }
//
// The client uploads directly to R2 with:
//   fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': contentType } })
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  let body: {
    fileName?:    string;
    contentType?: string;
    source?:      string;
    label?:       string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { fileName, contentType = 'video/mp4', source = 'player_upload', label } = body;

  if (!fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }

  // Check required R2 env vars are present — degrade gracefully if not configured
  if (
    (!process.env.CLOUDFLARE_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID) ||
    !process.env.R2_ACCESS_KEY_ID                                        ||
    !process.env.R2_SECRET_ACCESS_KEY
  ) {
    // R2 not configured — return empty URL so callers can handle gracefully
    // Video saves without a video_url rather than crashing
    return NextResponse.json({ uploadUrl: '', publicUrl: '', key: '' }, { status: 200 });
  }

  try {
    // Build the R2 key: source / YYYY-MM-DD / timestamp_filename
    const date   = new Date().toISOString().split('T')[0];
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ext    = fileName.split('.').pop() ?? 'mp4';
    const key    = `${source}/${date}/${unique}.${ext}`;

    // Generate presigned PUT URL (valid 15 minutes)
    // Uses @/lib/r2 — zero npm dependencies, Web Crypto API only
    const uploadUrl = await generatePresignedPutUrl({
      key,
      contentType,
      expiresInSec: 900,
    });

    const publicUrl = getPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl, key });

  } catch (err) {
    console.error('presigned route error:', err);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}