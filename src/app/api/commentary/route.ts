// src/app/api/commentary/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const llmModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

export async function POST(req: Request) {
  try {
    const { event, matchContext } = await req.json();

    // Step 1: Generate commentary with Gemini 2.5 Flash-Lite
    const prompt = `
You are a Zimbabwean football commentator. Generate exciting, broadcast-ready commentary for this match event.

Match: ${matchContext.homeTeam} vs ${matchContext.awayTeam}
Score: ${matchContext.score || '0-0'}
Time: ${event.time || '0'}' minute

Event: ${event.type}
Player: ${event.player || 'Unknown'}
Team: ${event.team || 'Unknown'}
Description: ${event.description || ''}

Rules:
- Keep it short (15-25 words)
- Use natural sports terminology
- Match the emotion of the event
- Be enthusiastic for goals, calm for cards

Commentary:`;

    const result = await llmModel.generateContent(prompt);
    const commentary = result.response.text().trim();

    // Step 2: Convert to speech with Gemini 2.5 Flash TTS
    const ttsModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-tts'
    });

    // Add vocal directions for natural emotion
    const ttsInput = addVocalDirections(commentary, event.type);

    const audioResponse = await ttsModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: ttsInput }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    // Extract audio data from response
    const audioData = (audioResponse.response.candidates?.[0]?.content?.parts?.[0] as { inlineData?: { data?: string } })?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('No audio data generated');
    }

    // Return audio for streaming
    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/wav',
        'X-Commentary': encodeURIComponent(commentary),
      }
    });

  } catch (error) {
    console.error('Commentary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate commentary' },
      { status: 500 }
    );
  }
}

function addVocalDirections(commentary: string, eventType: string): string {
  const directions: Record<string, string> = {
    'GOAL': `[excitement] GOAL! ${commentary} [cheerful]`,
    'PENALTY': `[excitement] ${commentary}`,
    'CARD': `[serious] ${commentary}`,
    'SHOT': `[normal] ${commentary} [slight excitement]`,
    'SUBSTITUTION': `[normal] ${commentary}`,
    'HALF_TIME': `[calm] ${commentary}`,
    'FULL_TIME': `[excitement] ${commentary} [cheerful]`,
  };
  return directions[eventType] || `[normal] ${commentary}`;
}