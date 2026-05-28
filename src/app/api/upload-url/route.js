import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize your storage client (Configured for Cloudflare R2 or AWS S3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT, // Used for Cloudflare R2: https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { filename, contentType } = await request.json();
    
    // Generate a unique file path name inside your bucket
    const uniqueKey = `uploads/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Create a temporary secure upload link valid for 5 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ uploadUrl, fileKey: uniqueKey });
  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate secure upload ticket' }, { status: 500 });
  }
}