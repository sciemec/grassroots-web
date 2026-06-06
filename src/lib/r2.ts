import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 client — S3-compatible storage for GrassRoots Sports.
 *
 * Required environment variables (Vercel + .env.local):
 *   R2_ACCOUNT_ID        — Cloudflare account ID (from R2 dashboard)
 *   R2_ACCESS_KEY_ID     — R2 API token key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *
 * Optional:
 *   R2_BUCKET   — bucket name (default: "grassroots-videos")
 *
 * Usage:
 *   import { r2Client, R2_BUCKET } from "@/lib/r2";
 *   import { PutObjectCommand } from "@aws-sdk/client-s3";
 *
 *   await r2Client.send(new PutObjectCommand({
 *     Bucket: R2_BUCKET,
 *     Key:    "highlights/player-123/clip.mp4",
 *     Body:   videoBuffer,
 *     ContentType: "video/mp4",
 *   }));
 */

const accountId       = process.env.R2_ACCOUNT_ID;
const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  throw new Error(
    "R2 configuration incomplete. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, " +
    "and R2_SECRET_ACCESS_KEY in your environment variables."
  );
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET ?? "grassroots-videos";
