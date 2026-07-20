// src/app/api/tts/route.ts
// TTS route — returns 503 so client falls back to window.speechSynthesis.
// Gemini 2.0 Flash does not offer a TTS endpoint.
// A future upgrade could add Google Cloud Text-to-Speech here.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
}
