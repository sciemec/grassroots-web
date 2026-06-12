import { NextResponse } from 'next/server';
import { generatePresignedPutUrl, getPublicUrl } from '@/lib/r2';

export async function POST(request) {
  try {
    const { filename, contentType = 'application/octet-stream' } = await request.json();
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    const uniqueKey = `uploads/${Date.now()}-${filename}`;
    const uploadUrl = await generatePresignedPutUrl({ key: uniqueKey, contentType, expiresInSec: 300 });
    const fileUrl   = getPublicUrl(uniqueKey);

    return NextResponse.json({ uploadUrl, fileKey: uniqueKey, fileUrl });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
