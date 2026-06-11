import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export const R2_BUCKET = process.env.R2_BUCKET ?? "grassroots-videos";

// Lazy client — only throws at call-time if env vars are missing,
// not at module-import time (prevents Next.js cold-start crashes).
function getR2Client(): S3Client {
  const accountId       = process.env.R2_ACCOUNT_ID;
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 configuration incomplete. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
      "and R2_SECRET_ACCESS_KEY in your environment variables."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// Exported singleton — evaluated lazily via the getter above.
export const r2Client = getR2Client();

// Generate a presigned PUT URL for direct browser-to-R2 uploads.
export async function generatePresignedPutUrl({
  key,
  contentType,
  expiresInSec = 900,
}: {
  key:          string;
  contentType:  string;
  expiresInSec?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSec });
}

// Build the public CDN URL for an R2 object.
export function getPublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL ?? "";
  return `${base.replace(/\/$/, "")}/${key}`;
}
