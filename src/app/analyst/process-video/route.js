import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai'; // Multi-modal model call framework

// Configure multi-modal AI clients with secure keys stored safely inside your .env
const aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request) {
  try {
    const { fileKey } = await request.json();
    if (!fileKey) {
      return NextResponse.json({ error: "Missing active video tracking file reference link key." }, { status: 400 });
    }

    // 1. SYSTEM MODEL PROMPT DIRECTION MAPPING
    const matchAnalysisPrompt = `
      You are the elite head video tactical analyst for Grassroots Sports. 
      Watch this full match footage asset carefully. Perform the following structural procedures:
      1. Outline the main formation changes, press triggers, and block densities for both units.
      2. Group individual performance metrics, noting velocity acceleration, sprint distances, and transition mistakes.
      3. Draft a comprehensive 5-section coach technical report summary layout. Keep it highly tactical, using descriptive football terminology and emojis. Structure it so it is ready to be shared instantly on WhatsApp channels.
    `;

    // 2. TRIGGER MULTI-MODAL GEMINI FLASH VISION PARSING ENGINE
    // This passes the bucket asset directly into the AI system to watch it natively
    const videoStreamUrl = `${process.env.STORAGE_CDN_URL}/${fileKey}`;
    
    const aiResponse = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [
          { text: matchAnalysisPrompt },
          { fileData: { fileUri: videoStreamUrl, mimeType: 'video/mp4' } }
        ]}
      ]
    });

    const tacticalSummaryOutput = aiResponse.text || "Tactical processing grid dropped loop sync counters.";

    return NextResponse.json({ 
      success: true, 
      report: tacticalSummaryOutput 
    });

  } catch (error) {
    console.error("Critical AI Processing Crash Error:", error);
    return NextResponse.json({ error: "Internal processing arrays dropped connection." }, { status: 500 });
  }
}