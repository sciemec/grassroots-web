import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/ai-coach
 *
 * Server-side Claude proxy used when the Laravel backend is unavailable or
 * the caller is using the dev-bypass token (admin testing accounts).
 * The Anthropic API key never leaves the server.
 *
 * Body: { message: string, system_prompt: string, history: { role, content }[] }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local." },
      { status: 503 }
    );
  }

  let body: { message?: string; system_prompt?: string; history?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { message, system_prompt, history = [] } = body;
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Build message list: prior history + current user message
  const messages: Anthropic.MessageParam[] = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: system_prompt ?? "You are an expert sports coach on the Grassroots Sport platform.",
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    return NextResponse.json({ response: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
