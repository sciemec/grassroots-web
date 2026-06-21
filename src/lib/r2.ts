// lib/r2.ts
// ─────────────────────────────────────────────────────────────────────────────
// Lightweight Cloudflare R2 helper
// Zero npm dependencies — uses only Web Crypto API (built into Node.js 18+)
//
// Replaces: @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner (~2MB)
// With:     this file (~60 lines, 0 bytes added to bundle)
//
// What it does:
//   generatePresignedPutUrl()  → pre-signed URL for direct browser-to-R2 upload
//   getPublicUrl()             → public URL for a stored R2 object
//
// R2 uses the same signing algorithm as AWS S3 (Signature Version 4)
// so this works by implementing just the signing math we actually need.
//
// ENV variables required:
//   CLOUDFLARE_ACCOUNT_ID
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET_NAME=grassroots-videos
//   R2_PUBLIC_URL=https://pub-XXXX.r2.dev  (or custom domain)
// ─────────────────────────────────────────────────────────────────────────────

const REGION = 'auto';
const SERVICE = 's3';

function getAccountId(): string {
  return (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID)!;
}

function getBucket(): string {
  return (process.env.R2_BUCKET_NAME || process.env.R2_BUCKET)!;
}

function getEndpoint(): string {
  return `https://${getAccountId()}.r2.cloudflarestorage.com`;
}

export function getPublicUrl(r2Key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
}

// ── HMAC-SHA256 using Web Crypto ──────────────────────────────────────────────
async function hmac(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string'
    ? new TextEncoder().encode(key)
    : key;

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

// ── SHA-256 hash ──────────────────────────────────────────────────────────────
async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Convert ArrayBuffer to hex string ────────────────────────────────────────
function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Generate a pre-signed PUT URL (valid for 15 minutes) ─────────────────────
// The client browser uploads directly to this URL with:
//   fetch(uploadUrl, { method: 'PUT', body: videoBlob, headers: { 'Content-Type': contentType } })
export async function generatePresignedPutUrl(params: {
  key:          string;   // R2 object key (path in bucket)
  contentType:  string;   // 'video/mp4'
  expiresInSec?: number;  // default 900 (15 minutes)
}): Promise<string> {
  const { key, contentType, expiresInSec = 900 } = params;

  const bucket    = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const endpoint  = getEndpoint();

  const now       = new Date();
  const dateStr   = now.toISOString().slice(0, 10).replace(/-/g, '');   // 20260611
  const timeStr   = now.toISOString().slice(0, 19).replace(/[-:]/g, ''); // 20260611T120000Z
  const amzDate   = `${timeStr}Z`;
  const scope     = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${accessKey}/${scope}`;

  // Query parameters for presigned URL
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    credential,
    'X-Amz-Date':          amzDate,
    'X-Amz-Expires':       String(expiresInSec),
    'X-Amz-SignedHeaders': 'content-type;host',
  });

  const host         = `${bucket}.${getAccountId()}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const canonicalQS  = queryParams.toString();

  // Canonical request
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQS,
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  // String to sign
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    hashedCanonical,
  ].join('\n');

  // Signing key (derived from secret key)
  const kDate    = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion  = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');

  const signature = toHex(await hmac(kSigning, stringToSign));

  // Final URL
  return `${endpoint}/${bucket}/${key}?${canonicalQS}&X-Amz-Signature=${signature}`;
}

// ── Simple delete (no presigning needed — server-side only) ──────────────────
export async function deleteR2Object(key: string): Promise<boolean> {
  const bucket    = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const endpoint  = getEndpoint();

  const now      = new Date();
  const dateStr  = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr  = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate  = `${timeStr}Z`;
  const scope    = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;

  const host         = `${bucket}.${getAccountId()}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
  const payloadHash  = await sha256('');

  const canonicalRequest = [
    'DELETE',
    canonicalUri,
    '',
    `host:${host}\nx-amz-date:${amzDate}\n`,
    'host;x-amz-date',
    payloadHash,
  ].join('\n');

  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');

  const kDate    = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion  = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));

  const res = await fetch(`${endpoint}/${bucket}/${key}`, {
    method:  'DELETE',
    headers: {
      'host':         host,
      'x-amz-date':  amzDate,
      'authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=host;x-amz-date,Signature=${signature}`,
    },
  });

  return res.ok;
}