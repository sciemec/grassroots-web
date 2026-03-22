/**
 * POST /api/upload/presigned
 * Returns a presigned PUT URL for direct client-to-R2/S3 upload.
 * The client uploads the file directly — no passing through Next.js server.
 *
 * Required env vars (Vercel + .env.local):
 *   R2_ACCOUNT_ID          — Cloudflare account ID
 *   R2_ACCESS_KEY_ID       — R2 access key
 *   R2_SECRET_ACCESS_KEY   — R2 secret key
 *   R2_BUCKET              — bucket name (e.g. grassroots-videos)
 *   R2_PUBLIC_URL          — public bucket URL (e.g. https://pub-xxx.r2.dev)
 *
 * Body: { filename, content_type, folder? }
 * Response: { upload_url, public_url, key }
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_TYPES = [
  "video/mp4", "video/quicktime", "video/avi", "video/x-matroska", "video/webm",
  "image/jpeg", "image/png", "image/webp",
];

function getS3Client() {
  const accountId  = process.env.R2_ACCOUNT_ID;
  const accessKey  = process.env.R2_ACCESS_KEY_ID;
  const secretKey  = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

interface PresignBody {
  filename?: string;
  content_type?: string;
  folder?: string;
}

export async function POST(req: NextRequest) {
  const client = getS3Client();
  if (!client) {
    return NextResponse.json(
      { error: "R2 storage not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in Vercel." },
      { status: 503 }
    );
  }

  let body: PresignBody;
  try {
    body = (await req.json()) as PresignBody;
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

  const bucket = process.env.R2_BUCKET ?? "grassroots-videos";
  const publicUrl = process.env.R2_PUBLIC_URL ?? "";
  const timestamp = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${folder}/${timestamp}-${safe}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: content_type,
    });

    const upload_url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return NextResponse.json({
      upload_url,
      public_url: publicUrl ? `${publicUrl}/${key}` : null,
      key,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Presign failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
