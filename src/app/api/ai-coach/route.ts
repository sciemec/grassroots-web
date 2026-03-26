import { NextRequest, NextResponse } from "next/server";
import { findRelevantSessions } from "@/lib/football-knowledge";

/**
 * POST /api/ai-coach
 *
 * Server-side Anthropic Claude proxy for the AI Coach.
 * Automatically injects relevant FIFA/FA coaching session knowledge
 * from the PDF library as context when answering coaching questions.
 *
 * Body: { message: string, system_prompt?: string, history?: { role, content }[], role?: string }
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
    role?: string;
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

  // Find relevant sessions from the PDF knowledge base
  const relevantSessions = findRelevantSessions(message, 3);
  const knowledgeContext = relevantSessions.length > 0
    ? "\n\n---\nRELEVANT COACHING SESSIONS FROM YOUR KNOWLEDGE BASE (FIFA/FA certified sources):\n" +
      "Reference these sessions directly when answering. Cite the session title when you use it.\n" +
      relevantSessions.map(s =>
        `\n[${s.title} | Source: ${s.source} | Level: ${s.level} | Category: ${s.category}]\n` +
        s.content.slice(0, 1500) + (s.content.length > 1500 ? "…" : "")
      ).join("\n\n") +
      "\n---\n"
    : "\n\nNo specific session from your knowledge base matched this question — answer from general coaching expertise.";

  const baseSystem = system_prompt ??
    "You are an expert football coach AI on Grassroots Sport — Zimbabwe's sports platform. " +
    "You help coaches at grassroots, school and Division 1/2 level with tactics, session planning, player development and match analysis. " +
    "Always relate advice to the Zimbabwean football context (ZIFA, NASH schools, local conditions). " +
    "Keep answers practical, clear and actionable.";

  const fullSystem = baseSystem + knowledgeContext;

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
        max_tokens: 1500,
        system: fullSystem,
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
