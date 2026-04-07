import { NextRequest, NextResponse } from "next/server";
import { groqVision, groqText } from "@/lib/groq";

/**
 * POST /api/video-analysis
 *
 * Server-side Groq vision proxy for the AI Video Analysis Studio.
 * Accepts extracted video frames (base64 JPEGs) + match context and returns analysis.
 *
 * Body: {
 *   frames:        string[]   base64 JPEG strings (max 15), may be empty
 *   context:       string     match context text built from the form
 *   system_prompt: string     from videoAnalysisPrompt() in src/config/prompts.ts
 * }
 */
export async function POST(req: NextRequest) {
  const token =
    req.cookies.get("grassroots_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: { frames?: string[]; context?: string; system_prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { frames = [], context = "", system_prompt } = body;

  if (!context.trim() && frames.length === 0) {
    return NextResponse.json(
      { error: "At least one of frames or context is required." },
      { status: 400 },
    );
  }

  const systemPrompt = system_prompt ??
    "You are a professional sports video analyst on the Grassroots Sport platform serving coaches and athletes in Zimbabwe.";

  const userText = frames.length > 0
    ? `I have shared ${frames.length} evenly-spaced frames from the match video above.\n\n${context}`
    : context;

  try {
    const analysis = frames.length > 0
      ? await groqVision(systemPrompt, frames.slice(0, 15), userText, { max_tokens: 2000 })
      : await groqText(systemPrompt, [{ role: "user", content: userText }], { max_tokens: 2000 });

    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Video analysis request failed";
    console.error("Video analysis exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
