import { NextRequest, NextResponse } from "next/server";
import { findRelevantSessions } from "@/lib/football-knowledge";

/**
 * POST /api/ai-coach
 *
 * TWO-ENGINE RULE (permanent):
 *   1. DeepSeek first  — fast, cheap, handles most questions
 *   2. Claude second   — complex/analytical questions only, or when DeepSeek fails
 *
 * Complexity is detected from keywords in the message.
 * DeepSeek failure always escalates to Claude automatically.
 *
 * Body: { message, system_prompt?, history?, stream?, userContext? }
 */

// ─── Engine config ───────────────────────────────────────────────────────────
// Centralised token limits — change here, applies everywhere
const AI_CONFIG = {
  deepseek: { max_tokens: 1024, temperature: 0.7 },
  claude:   { max_tokens: 1500 },
} as const;

// ─── Complexity detector ─────────────────────────────────────────────────────
// Questions matching these keywords need deep reasoning → Claude
const COMPLEX_KEYWORDS = [
  // Causality & problem-solving
  "why", "how do i fix", "how do i improve", "what is wrong", "reason", "cause",
  // Analysis & evaluation
  "analyse", "analysis", "explain", "evaluate", "assess", "review", "diagnose",
  // Strategy & planning
  "tactical", "tactics", "strategy", "plan", "formation", "programme",
  // Set pieces & dead ball
  "set piece", "corner", "free kick", "freekick", "penalty", "dead ball",
  "defending set", "attack set",
  // Defensive & attacking systems
  "defend", "defensive", "attack", "attacking", "pressing", "high press",
  "low block", "mid block", "counter", "offside", "marking", "zonal",
  "man mark", "back line", "high line", "compact",
  // Deep coaching concepts
  "transition", "position", "movement", "shape", "structure", "overlap",
  "underlap", "width", "depth", "spacing", "channel", "combination",
  // Player development
  "develop", "potential", "long term", "periodis", "pre-season",
  // Performance
  "weakness", "injury", "scout", "valuation", "market value",
  "compare", "versus", "should i", "how should", "what if",
  "effect", "impact", "improve my", "work on",
  // Match analysis
  "half time", "halftime", "game plan", "opponent", "match plan",
  "substitut", "rotation",
];

function isComplex(message: string): boolean {
  const lower = message.toLowerCase();
  // Complex if: contains analytical keyword OR message is long (likely multi-part)
  return COMPLEX_KEYWORDS.some((k) => lower.includes(k)) || message.length > 150;
}

// ─── DeepSeek call ───────────────────────────────────────────────────────────
async function callDeepSeek(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: AI_CONFIG.deepseek.max_tokens,
      temperature: AI_CONFIG.deepseek.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("DeepSeek returned empty response");
  return reply;
}

// ─── Claude call ─────────────────────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  stream: boolean,
): Promise<Response | string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: AI_CONFIG.claude.max_tokens,
      stream,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error ${res.status}: ${err}`);
  }

  if (stream && res.body) return res; // caller handles the stream
  const data = await res.json();
  const reply = data?.content?.[0]?.text;
  if (!reply) throw new Error("Claude returned empty response");
  return reply;
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    system_prompt?: string;
    history?: { role: string; content: string }[];
    stream?: boolean;
    userContext?: {
      name?: string;
      age?: string | number;
      position?: string;
      recentStats?: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { message, system_prompt, history = [], stream = false, userContext } = body;
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  // Build knowledge context from FIFA/FA coaching library
  const relevantSessions = findRelevantSessions(message, 3);
  const knowledgeContext = relevantSessions.length > 0
    ? "\n\n---\nRELEVANT COACHING SESSIONS (FIFA/FA certified):\n" +
      relevantSessions.map((s) =>
        `[${s.title} | ${s.source} | ${s.level}]\n` +
        s.content.slice(0, 1500) + (s.content.length > 1500 ? "…" : "")
      ).join("\n\n") +
      "\n---\n"
    : "";

  // Build system prompt — inject player context if provided
  const playerContext = userContext
    ? `\nYou are speaking with ${userContext.name || "a player"}, ` +
      `a ${userContext.age || "young"}-year-old ${userContext.position || "athlete"}. ` +
      (userContext.recentStats ? `Recent performance: ${userContext.recentStats}. ` : "")
    : "";

  const baseSystem = system_prompt ??
    "You are an expert Zimbabwean sports mentor on Grassroots Sport — Zimbabwe's AI sports platform. " +
    "You help players and coaches at grassroots, school and Division 1/2 level with tactics, training, " +
    "player development and match analysis. Relate advice to the Zimbabwean football context (ZIFA, NASH schools). " +
    "Speak like a coach on a pitch in Harare or Bulawayo — practical, direct, encouraging. " +
    "Use local flair like 'bhora pasi' or 'kujatisa' where it fits naturally. " +
    "If a player lacks equipment, suggest grassroots alternatives (stones instead of cones, etc.). " +
    "End with: 'Train anywhere in Zimbabwe. Use AI to get recognized.'";

  const fullSystem = baseSystem + playerContext + knowledgeContext;

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-6) // keep last 6 for context
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  const complex = isComplex(message);
  const engine = complex ? "claude" : "deepseek";

  // ── Engine selection ──────────────────────────────────────────────────────
  // Simple question → DeepSeek. Complex → Claude. DeepSeek failure → Claude.

  if (!complex) {
    // SYSTEM 1: DeepSeek — fast, cheap, good for drills/basic advice
    try {
      const reply = await callDeepSeek(fullSystem, messages);
      return NextResponse.json({ response: reply, engine });
    } catch (err) {
      // DeepSeek failed — escalate to Claude silently
      console.error("DeepSeek failed, escalating to Claude:", err);
    }
  }

  // SYSTEM 2: Claude — complex/analytical questions, or DeepSeek fallback
  try {
    const result = await callClaude(fullSystem, messages, stream);

    if (stream && result instanceof Response) {
      return new Response((result as Response).body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
          "X-Engine": "claude",
        },
      });
    }

    return NextResponse.json({ response: result as string, engine: "claude" });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Coach is offline";
    console.error("Both engines failed:", msg);
    return NextResponse.json(
      { error: "Coach is temporarily offline. Check your connection." },
      { status: 500 },
    );
  }
}
