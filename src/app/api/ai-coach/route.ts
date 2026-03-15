import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai-coach
 *
 * Server-side Anthropic Claude proxy for the AI Coach.
 * Used when the caller has a dev-bypass token (admin testing) or when the
 * Laravel backend returns 401. The ANTHROPIC_API_KEY never leaves the server.
 *
 * Body: { message: string, system_prompt?: string, history?: { role, content }[] }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
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

  // Build messages array for Anthropic API (user/assistant turns only)
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
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
        max_tokens: 1024,
        system: system_prompt ?? "You are an expert sports coach on the Grassroots Sport platform serving athletes in Zimbabwe.",
        messages,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Anthropic API error", res.status, errBody);
      return NextResponse.json(
        { error: `Anthropic API error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const reply: string = data?.content?.[0]?.text ?? "No response received.";
    return NextResponse.json({ response: reply });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Claude request failed";
    console.error("Anthropic fetch exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
