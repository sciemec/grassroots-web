// src/app/api/world-cup/reports/[matchId]/route.ts
// Serves a cached tactical report from R2.
// Returns { available: false } when no report exists yet.

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });
}

const BUCKET = process.env.R2_BUCKET ?? 'grassroots-videos';

export async function GET(
  _req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;
  if (!matchId) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const r2 = getR2();
  if (!r2) {
    return NextResponse.json({ available: false, error: 'Storage not configured' });
  }

  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: `tactical-reports/${matchId}.json`,
    }));
    const body = await res.Body?.transformToString();
    if (!body) return NextResponse.json({ available: false });
    const report = JSON.parse(body);
    return NextResponse.json(report);
  } catch {
    // NoSuchKey or any other error → report not ready yet
    return NextResponse.json({ available: false });
  }
}
