// lib/r2.ts
const REGION = 'auto';
const SERVICE = 's3';

function validateEnv(): void {
  const missing: string[] = [];
  if (!process.env.R2_ACCOUNT_ID && !process.env.CLOUDFLARE_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!process.env.R2_BUCKET     && !process.env.R2_BUCKET_NAME)         missing.push('R2_BUCKET');
  if (!process.env.R2_ACCESS_KEY_ID)                                      missing.push('R2_ACCESS_KEY_ID');
  if (!process.env.R2_SECRET_ACCESS_KEY)                                  missing.push('R2_SECRET_ACCESS_KEY');
  if (!process.env.R2_PUBLIC_URL)                                         missing.push('R2_PUBLIC_URL');
  if (missing.length > 0) throw new Error(`Missing R2 env vars: ${missing.join(', ')}`);
}

function getAccountId(): string {
  return (process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID)!;
}
function getBucket(): string {
  return (process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME)!;
}

function getEndpoint(): string {
  validateEnv();
  return `https://${getAccountId()}.r2.cloudflarestorage.com`;
}

export function getPublicUrl(r2Key: string): string {
  validateEnv();
  return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
}

async function hmac(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const keyData = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isCryptoAvailable(): boolean {
  try {
    return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
  } catch {
    return false;
  }
}

export async function generatePresignedPutUrl(params: { key: string; contentType: string; expiresInSec?: number; }): Promise<string> {
  if (!isCryptoAvailable()) throw new Error('crypto.subtle is not available in this environment.');
  validateEnv();
  const { key, contentType, expiresInSec = 900 } = params;
  const bucket = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const accountId = getAccountId();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate = `${timeStr}Z`;
  const scope = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const credential = `${accessKey}/${scope}`;
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSec),
    'X-Amz-SignedHeaders': 'content-type;host',
  });
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  const canonicalUri = `/${encodedKey}`;
  const canonicalQS = queryParams.toString();
  const canonicalRequest = ['PUT', canonicalUri, canonicalQS, `content-type:${contentType}\nhost:${host}\n`, 'content-type;host', 'UNSIGNED-PAYLOAD'].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  return `https://${host}/${encodedKey}?${canonicalQS}&X-Amz-Signature=${signature}`;
}

export async function deleteR2Object(key: string): Promise<boolean> {
  if (!isCryptoAvailable()) { console.warn('crypto.subtle not available, skipping delete'); return false; }
  validateEnv();
  const bucket = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const accountId = getAccountId();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate = `${timeStr}Z`;
  const scope = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  const canonicalUri = `/${encodedKey}`;
  const payloadHash = await sha256('');
  const canonicalRequest = ['DELETE', canonicalUri, '', `host:${host}\nx-amz-date:${amzDate}\n`, 'host;x-amz-date', payloadHash].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  try {
    const res = await fetch(`https://${host}/${encodedKey}`, {
      method: 'DELETE',
      headers: { 'host': host, 'x-amz-date': amzDate, 'authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=host;x-amz-date,Signature=${signature}` },
    });
    if (!res.ok) console.warn(`R2 delete failed: ${res.status} ${res.statusText} for key: ${key}`);
    return res.ok;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

export async function getObject(key: string): Promise<string | null> {
  if (!isCryptoAvailable()) { console.warn('crypto.subtle not available, skipping get'); return null; }
  validateEnv();
  const bucket = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const accountId = getAccountId();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate = `${timeStr}Z`;
  const scope = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  const canonicalUri = `/${encodedKey}`;
  const payloadHash = await sha256('');
  const canonicalRequest = ['GET', canonicalUri, '', `host:${host}\nx-amz-date:${amzDate}\n`, 'host;x-amz-date', payloadHash].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  try {
    const res = await fetch(`https://${host}/${encodedKey}`, {
      method: 'GET',
      headers: { 'host': host, 'x-amz-date': amzDate, 'authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=host;x-amz-date,Signature=${signature}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) { console.warn(`R2 get failed: ${res.status} ${res.statusText} for key: ${key}`); return null; }
    return await res.text();
  } catch (error) {
    console.error('R2 get error:', error);
    return null;
  }
}

export async function putObject(key: string, body: string, contentType: string = 'application/json'): Promise<boolean> {
  if (!isCryptoAvailable()) { console.warn('crypto.subtle not available, skipping put'); return false; }
  validateEnv();
  const bucket = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const accountId = getAccountId();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate = `${timeStr}Z`;
  const scope = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  const canonicalUri = `/${encodedKey}`;
  const payloadHash = await sha256(body);
  const canonicalRequest = ['PUT', canonicalUri, '', `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`, 'content-type;host;x-amz-date', payloadHash].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  try {
    const res = await fetch(`https://${host}/${encodedKey}`, {
      method: 'PUT',
      headers: { 'host': host, 'x-amz-date': amzDate, 'content-type': contentType, 'authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=content-type;host;x-amz-date,Signature=${signature}` },
      body,
    });
    if (!res.ok) console.warn(`R2 put failed: ${res.status} ${res.statusText} for key: ${key}`);
    return res.ok;
  } catch (error) {
    console.error('R2 put error:', error);
    return false;
  }
}

export function isR2Configured(): boolean {
  try {
    validateEnv();
    return true;
  } catch {
    return false;
  }
}

async function sha256Buffer(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function putBinaryObject(key: string, data: ArrayBuffer, contentType: string): Promise<boolean> {
  if (!isCryptoAvailable()) { console.warn('crypto.subtle not available, skipping binary put'); return false; }
  validateEnv();
  const bucket = getBucket();
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!;
  const accountId = getAccountId();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toISOString().slice(0, 19).replace(/[-:]/g, '');
  const amzDate = `${timeStr}Z`;
  const scope = `${dateStr}/${REGION}/${SERVICE}/aws4_request`;
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const encodedKey = key.split('/').map(part => encodeURIComponent(part)).join('/');
  const canonicalUri = `/${encodedKey}`;
  const payloadHash = await sha256Buffer(data);
  const canonicalRequest = ['PUT', canonicalUri, '', `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\n`, 'content-type;host;x-amz-date', payloadHash].join('\n');
  const hashedCanonical = await sha256(canonicalRequest);
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, hashedCanonical].join('\n');
  const kDate = await hmac(`AWS4${secretKey}`, dateStr);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = toHex(await hmac(kSigning, stringToSign));
  try {
    const res = await fetch(`https://${host}/${encodedKey}`, {
      method: 'PUT',
      headers: { 'host': host, 'x-amz-date': amzDate, 'content-type': contentType, 'authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=content-type;host;x-amz-date,Signature=${signature}` },
      body: data,
    });
    if (!res.ok) console.warn(`R2 binary put failed: ${res.status} ${res.statusText} for key: ${key}`);
    return res.ok;
  } catch (error) {
    console.error('R2 binary put error:', error);
    return false;
  }
}
