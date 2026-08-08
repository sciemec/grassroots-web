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

    return NextResponse.json({ commentary });

  } catch (error) {
    console.error('Commentary generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate commentary' },
      { status: 500 }
    );
  }
}