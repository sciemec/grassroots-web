import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/video-analysis
 *
 * Server-side Claude vision proxy for the AI Video Analysis Studio.
 * Accepts extracted video frames (base64 JPEGs) + match context, calls the
 * Anthropic Messages API with the vision capability, and returns the analysis.
 *
 * Body: {
 *   frames:        string[]   base64 JPEG strings (max 15), may be empty
 *   context:       string     match context text built from the form
 *   system_prompt: string     from videoAnalysisPrompt() in src/config/prompts.ts
 * }
 */
export async function POST(req: NextRequest) {
  // Auth gate — require a valid session token to prevent anonymous API abuse
  const token =
    req.cookies.get("grassroots_token")?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on this server." },
      { status: 503 }
    );
  }

  let body: {
    frames?: string[];
    context?: string;
    system_prompt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { frames = [], context = "", system_prompt } = body;

  if (!context.trim() && frames.length === 0) {
    return NextResponse.json(
      { error: "At least one of frames or context is required." },
      { status: 400 }
    );
  }

  // Build the user message content array.
  // Images come first (Claude processes them left-to-right), then the text prompt.
  type ContentBlock =
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } }
    | { type: "text"; text: string };

  const content: ContentBlock[] = [
    // Include up to 15 frames
    ...frames.slice(0, 15).map((data) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
    })),
    {
      type: "text" as const,
      text: frames.length > 0
        ? `I have shared ${frames.length} evenly-spaced frames from the match video above.\n\n${context}`
        : context,
    },
  ];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: system_prompt ?? "You are a professional sports video analyst on the Grassroots Sport platform serving coaches and athletes in Zimbabwe.",
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic API error", res.status, errBody);
      return NextResponse.json(
        { error: `AI analysis failed (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const analysis: string = data?.content?.[0]?.text ?? "No analysis received.";
    return NextResponse.json({ analysis });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Video analysis request failed";
    console.error("Video analysis exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
