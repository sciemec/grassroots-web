// src/app/api/analyse-video/route.ts
// Server-side route — GEMINI_API_KEY never exposed to the browser.
// Accepts base64 video frames + set piece context, returns AI coaching analysis.

import { NextRequest, NextResponse } from "next/server";
import { geminiVision, geminiText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      frames?: string[];
      type: string;
      context: string;
      notes?: string;
      prompt: string;
    };

    const { frames, prompt, notes } = body;

    const systemPrompt =
      "You are a practical football set piece coach working with grassroots teams in Zimbabwe. " +
      "Give specific, actionable advice in plain English. " +
      "When analysing video frames, describe exactly what you observe — player positions, movement patterns, " +
      "delivery quality — before giving your tactical recommendations.";

    const userText = notes?.trim()
      ? `${prompt}\n\nCoach notes: ${notes.trim()}`
      : prompt;

    let analysis: string;

    if (frames && frames.length > 0) {
      // Real video analysis — send frames to Gemini Vision
      analysis = await geminiVision(systemPrompt, frames, userText, { max_tokens: 1500 });
    } else {
      // No video — text-only tactical analysis
      analysis = await geminiText(
        systemPrompt,
        [{ role: "user", content: userText }],
        { max_tokens: 1200 },
      );
    }

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    const status = message.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
