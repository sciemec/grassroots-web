// app/api/vault/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Video Vault API — updated to use lib/r2.ts (zero npm dependencies)
//
// Replaces @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
// with a native Web Crypto implementation in lib/r2.ts
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

const DEFAULT_VISIBILITY: Record<string, string> = {
  test_session:   'school',
  drill_training: 'private',
  player_upload:  'private',
  whatsapp:       'private',
};

// ── GET — list player's videos ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId');
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 });

  try {
    const videos = await prisma.playerVideo.findMany({
      where:   { playerId },
      orderBy: { uploadedAt: 'desc' },
    });

    const grouped = {
      test_session:   videos.filter(v => v.source === 'test_session'),
      drill_training: videos.filter(v => v.source === 'drill_training'),
      player_upload:  videos.filter(v => v.source === 'player_upload'),
      whatsapp:       videos.filter(v => v.source === 'whatsapp'),
    };

    return NextResponse.json({
      total:          videos.length,
      videos,
      grouped,
      passportVideos: selectPassportVideos(videos),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch vault' }, { status: 500 });
  }
}

// ── POST — upload, confirm, update ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  if (action === 'upload')  return handleUploadRequest(body);
  if (action === 'confirm') return handleConfirm(body);
  if (action === 'update')  return handleUpdate(body);
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// Step 1: pre-signed PUT URL — uses lib/r2.ts, zero SDK
async function handleUploadRequest(body: {
  playerId: string; fileName: string; fileType: string;
  source: string; testType?: string; label?: string;
}) {
  const { playerId, fileName, fileType, source, testType, label } = body;
  const date   = new Date().toISOString().split('T')[0];
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext    = fileName.split('.').pop() ?? 'mp4';
  const r2Key  = `${playerId}/${source}/${date}/${unique}.${ext}`;

  try {
    // Create DB placeholder
    const video = await prisma.playerVideo.create({
      data: {
        playerId,
        url:        '',
        r2Path:     r2Key,
        label:      label ?? `${testType ?? source} ${date}`,
        source,
        verified:   false,
        visibility: DEFAULT_VISIBILITY[source] ?? 'private',
        uploadedAt: new Date(),
      },
    });

    // Generate pre-signed URL using native Web Crypto — NO AWS SDK needed
    const uploadUrl = await generatePresignedPutUrl({
      key:         r2Key,
      contentType: fileType,
      expiresInSec: 900,
    });

    return NextResponse.json({ uploadUrl, r2Key, videoId: video.id });
  } catch (err) {
    console.error('Upload request error:', err);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}

// Step 2: confirm after client uploads directly to R2
async function handleConfirm(body: {
  videoId: string; r2Key: string; durationSec?: number; fileSizeKb?: number;
}) {
  const { videoId, r2Key, durationSec, fileSizeKb } = body;
  try {
    const video = await prisma.playerVideo.update({
      where: { id: videoId },
      data: {
        url:        getPublicUrl(r2Key),
        durationSec: durationSec ?? null,
        fileSizeKb:  fileSizeKb ?? null,
      },
    });
    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to confirm upload' }, { status: 500 });
  }
}

async function handleUpdate(body: { videoId: string; label?: string; visibility?: string }) {
  try {
    const video = await prisma.playerVideo.update({
      where: { id: body.videoId },
      data:  { label: body.label ?? undefined, visibility: body.visibility ?? undefined },
    });
    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

function selectPassportVideos(videos: any[]): any[] {
  const passport: any[] = [];
  const testVideos  = videos.filter(v => v.source === 'test_session');
  const drillVideos = videos.filter(v => v.source === 'drill_training');
  const sprint = testVideos.find(v => v.label?.toLowerCase().includes('sprint'));
  if (sprint) passport.push({ ...sprint, passportSlot: 'sprint' });
  const jump = testVideos.find(v => v.label?.toLowerCase().includes('jump'));
  if (jump && passport.length < 2) passport.push({ ...jump, passportSlot: 'jump' });
  const drill = drillVideos[0];
  if (drill && passport.length < 3) passport.push({ ...drill, passportSlot: 'drill' });
  for (const v of testVideos) {
    if (passport.length >= 3) break;
    if (!passport.find(p => p.id === v.id)) passport.push({ ...v, passportSlot: 'additional' });
  }
  return passport.slice(0, 3);
}