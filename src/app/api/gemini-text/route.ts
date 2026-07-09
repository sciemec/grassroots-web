import { NextRequest, NextResponse } from "next/server";
import { geminiText } from "@/lib/gemini";

export const maxDuration = 30;

/**
 * POST /api/gemini-text
 * Lightweight Gemini text endpoint for skill analyzers.
 * Body: { message: string, system_prompt?: string }
 * Returns: { response: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { message, system_prompt } = await req.json();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const response = await geminiText(
      system_prompt ?? "You are a professional sports coaching assistant. Always return only valid JSON.",
      [{ role: "user", content: message }],
      { max_tokens: 800, temperature: 0.3 },
    );

    return NextResponse.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
