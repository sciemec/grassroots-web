import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai-coach
 *
 * Server-side DeepSeek proxy — mirrors the Laravel DeepSeekService so the
 * web app and mobile backend use the same AI model and behaviour.
 *
 * Used when:
 *  - The caller has a dev-bypass token (admin testing without a backend session)
 *  - The Laravel backend returns 401 (token not recognised)
 *
 * The DEEPSEEK_API_KEY never leaves the server.
 *
 * Body: { message: string, system_prompt?: string, history?: { role, content }[] }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY is not configured. Add it to .env.local." },
      { status: 503 }
    );
  }

  let body: {
    message?: string;
    system_prompt?: string;
    history?: { role: string; content: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { message, system_prompt, history = [] } = body;
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  // Build messages array — same structure as DeepSeekService::chat()
  const messages: { role: string; content: string }[] = [];

  if (system_prompt) {
    messages.push({ role: "system", content: system_prompt });
  }

  for (const entry of history) {
    if (entry.role === "user" || entry.role === "assistant") {
      messages.push(entry);
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("DeepSeek API error", res.status, errBody);
      return NextResponse.json(
        { error: `DeepSeek API error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "No response received.";
    return NextResponse.json({ response: reply });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "DeepSeek request failed";
    console.error("DeepSeek fetch exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
