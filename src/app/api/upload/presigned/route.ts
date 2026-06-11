/**
 * POST /api/upload/presigned
 * Returns a presigned PUT URL for direct client-to-R2 upload.
 * Uses lightweight lib/r2.ts (zero AWS SDK dependencies)
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePresignedPutUrl, getPublicUrl } from "@/lib/r2";

const ALLOWED_TYPES = [
  "video/mp4", "video/quicktime", "video/avi", "video/x-matroska", "video/webm",
  "image/jpeg", "image/png", "image/webp",
];

export async function POST(req: NextRequest) {
  // Check required env vars
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKey || !secretKey || !bucket) {
    return NextResponse.json(
      { error: "R2 storage not configured. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in Vercel." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { filename, content_type, folder = "uploads" } = body;

  if (!filename || !content_type) {
    return NextResponse.json({ error: "filename and content_type are required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(content_type)) {
    return NextResponse.json({ error: `File type not allowed: ${content_type}` }, { status: 400 });
  }

  const timestamp = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${timestamp}-${safe}`;

  try {
    const upload_url = await generatePresignedPutUrl({
      key,
      contentType: content_type,
      expiresInSec: 3600
    });

    const public_url = getPublicUrl(key);

    return NextResponse.json({
      upload_url,
      public_url,
      key,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Presign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}