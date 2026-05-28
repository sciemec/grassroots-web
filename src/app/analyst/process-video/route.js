import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Extend Vercel function timeout to 5 minutes — video upload + AI processing takes time
export const maxDuration = 300;

const aiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY });

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
  let geminiFile = null;

  try {
    const { fileKey } = await request.json();
    if (!fileKey) {
      return NextResponse.json({ error: 'Missing file key.' }, { status: 400 });
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
    const videoBlob = await videoResponse.blob();

    // Step 2: Upload to Gemini File API
    // Gemini requires a File API URI — raw CDN URLs are not accepted as fileUri
    geminiFile = await aiClient.files.upload({
      file: videoBlob,
      config: { mimeType, displayName: fileKey },
    });

    // Step 3: Poll until file is ACTIVE (Gemini processes it server-side)
    let attempts = 0;
    while (geminiFile.state === 'PROCESSING' && attempts < 36) {
      await new Promise((r) => setTimeout(r, 5000));
      geminiFile = await aiClient.files.get(geminiFile.name);
      attempts++;
    }

    if (geminiFile.state !== 'ACTIVE') {
      return NextResponse.json({ error: 'Video processing timed out. Try a shorter clip.' }, { status: 504 });
    }

    // Step 4: Generate tactical analysis using the File API URI
    const aiResponse = await aiClient.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: ANALYSIS_PROMPT },
            { fileData: { fileUri: geminiFile.uri, mimeType } },
          ],
        },
      ],
    });

    const report = aiResponse.text || 'Analysis complete — no output returned.';

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error('Match Eye process-video error:', error);
    return NextResponse.json({ error: 'Video analysis failed. Please try again.' }, { status: 500 });
  } finally {
    // Step 5: Clean up uploaded file from Gemini (billing/quota hygiene)
    if (geminiFile?.name) {
      await aiClient.files.delete(geminiFile.name).catch(() => {});
    }
  }
}