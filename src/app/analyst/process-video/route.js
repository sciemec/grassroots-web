import { NextResponse } from 'next/server';

// Extend Vercel function timeout to 5 minutes — video upload + AI processing takes time
export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

const ANALYSIS_PROMPT = `
  You are the elite head video tactical analyst for Grassroots Sports.
  Watch this full match footage carefully. Produce a structured report with these 5 sections:
  1. FORMATIONS & SHAPE — formation changes, press triggers, block densities for both teams.
  2. INDIVIDUAL METRICS — velocity, sprint distances, transition mistakes per player.
  3. TACTICAL PATTERNS — set pieces, danger zones, possession phases, transitions.
  4. KEY MOMENTS — decisive actions that changed the match.
  5. COACH RECOMMENDATIONS — 3 actionable improvements for next training session.
  Use football terminology and emojis. Format for instant WhatsApp sharing.
`;

export async function POST(request) {
  let geminiFileName = null;

  try {
    const { fileKey } = await request.json();
    if (!fileKey) {
      return NextResponse.json({ error: 'Missing file key.' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 500 });
    }

    // Determine video URL and MIME type
    const cdnBase = process.env.NEXT_PUBLIC_STORAGE_CDN_URL || process.env.R2_PUBLIC_URL || '';
    const videoUrl = `${cdnBase}/${fileKey}`;
    const mimeType = fileKey.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';

    // Step 1: Fetch video bytes from R2 storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      return NextResponse.json({ error: 'Could not retrieve video from storage.' }, { status: 502 });
    }
    const videoBuffer = await videoResponse.arrayBuffer();
    const videoBytes = new Uint8Array(videoBuffer);

    // Step 2: Upload to Gemini File API via multipart upload
    const boundary = '----GrassrootsFormBoundary';
    const metadataJson = JSON.stringify({ file: { display_name: fileKey } });
    const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n`;
    const mediaPart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const closingBoundary = `\r\n--${boundary}--`;

    const metadataBytes = new TextEncoder().encode(metadataPart);
    const mediaHeaderBytes = new TextEncoder().encode(mediaPart);
    const closingBytes = new TextEncoder().encode(closingBoundary);

    const multipartBody = new Uint8Array(
      metadataBytes.byteLength + mediaHeaderBytes.byteLength + videoBytes.byteLength + closingBytes.byteLength
    );
    let offset = 0;
    multipartBody.set(metadataBytes, offset);   offset += metadataBytes.byteLength;
    multipartBody.set(mediaHeaderBytes, offset); offset += mediaHeaderBytes.byteLength;
    multipartBody.set(videoBytes, offset);       offset += videoBytes.byteLength;
    multipartBody.set(closingBytes, offset);

    const uploadRes = await fetch(
      `${GEMINI_BASE}/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error('Gemini upload error:', errText);
      return NextResponse.json({ error: 'Failed to upload video to Gemini.' }, { status: 502 });
    }

    const uploadData = await uploadRes.json();
    geminiFileName = uploadData.file?.name;
    let fileState = uploadData.file?.state;
    const fileUri = uploadData.file?.uri;

    if (!geminiFileName || !fileUri) {
      return NextResponse.json({ error: 'Gemini upload did not return a valid file.' }, { status: 502 });
    }

    // Step 3: Poll until file is ACTIVE (Gemini processes it server-side)
    let attempts = 0;
    while (fileState === 'PROCESSING' && attempts < 36) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(
        `${GEMINI_BASE}/v1beta/${geminiFileName}?key=${GEMINI_API_KEY}`
      );
      if (pollRes.ok) {
        const pollData = await pollRes.json();
        fileState = pollData.state;
      }
      attempts++;
    }

    if (fileState !== 'ACTIVE') {
      return NextResponse.json({ error: 'Video processing timed out. Try a shorter clip.' }, { status: 504 });
    }

    // Step 4: Generate tactical analysis using the File API URI
    const generateRes = await fetch(
      `${GEMINI_BASE}/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: ANALYSIS_PROMPT },
                { file_data: { mime_type: mimeType, file_uri: fileUri } },
              ],
            },
          ],
        }),
      }
    );

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      console.error('Gemini generate error:', errText);
      return NextResponse.json({ error: 'AI analysis request failed.' }, { status: 502 });
    }

    const generateData = await generateRes.json();
    const report =
      generateData.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Analysis complete — no output returned.';

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error('Match Eye process-video error:', error);
    return NextResponse.json({ error: 'Video analysis failed. Please try again.' }, { status: 500 });
  } finally {
    // Step 5: Clean up uploaded file from Gemini (billing/quota hygiene)
    if (geminiFileName && GEMINI_API_KEY) {
      await fetch(
        `${GEMINI_BASE}/v1beta/${geminiFileName}?key=${GEMINI_API_KEY}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }
  }
}
