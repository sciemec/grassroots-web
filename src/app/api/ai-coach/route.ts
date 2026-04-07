import { NextRequest, NextResponse } from "next/server";
import { findRelevantSessions } from "@/lib/football-knowledge";
import { groqText } from "@/lib/groq";

/**
 * POST /api/ai-coach
 *
 * TWO-ENGINE RULE:
 *   1. DeepSeek first  — fast, cheap, handles simple questions
 *   2. Anthropic second — complex/analytical questions, or when DeepSeek fails
 *
 * Body: { message, system_prompt?, history?, stream?, userContext? }
 */

const AI_CONFIG = {
  deepseek:  { max_tokens: 1024, temperature: 0.7 },
  anthropic: { max_tokens: 1500, model: "claude-sonnet-4-6" },
} as const;

const COMPLEX_KEYWORDS = [
  "why", "how do i fix", "how do i improve", "what is wrong", "reason", "cause",
  "analyse", "analysis", "explain", "evaluate", "assess", "review", "diagnose",
  "tactical", "tactics", "strategy", "plan", "formation", "programme",
  "set piece", "corner", "free kick", "freekick", "penalty", "dead ball",
  "defending set", "attack set",
  "defend", "defensive", "attack", "attacking", "pressing", "high press",
  "low block", "mid block", "counter", "offside", "marking", "zonal",
  "man mark", "back line", "high line", "compact",
  "transition", "position", "movement", "shape", "structure", "overlap",
  "underlap", "width", "depth", "spacing", "channel", "combination",
  "develop", "potential", "long term", "periodis", "pre-season",
  "weakness", "injury", "scout", "valuation", "market value",
  "compare", "versus", "should i", "how should", "what if",
  "effect", "impact", "improve my", "work on",
  "half time", "halftime", "game plan", "opponent", "match plan",
  "substitut", "rotation",
];

function isComplex(message: string): boolean {
  const lower = message.toLowerCase();
  return COMPLEX_KEYWORDS.some((k) => lower.includes(k)) || message.length > 150;
}

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

async function callGroq(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  return groqText(systemPrompt, messages, { max_tokens: AI_CONFIG.anthropic.max_tokens });
}

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

  const { message, system_prompt, history = [], userContext } = body;
  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const relevantSessions = findRelevantSessions(message, 3);
  const knowledgeContext = relevantSessions.length > 0
    ? "\n\n---\nRELEVANT COACHING SESSIONS (FIFA/FA certified):\n" +
      relevantSessions.map((s) =>
        `[${s.title} | ${s.source} | ${s.level}]\n` +
        s.content.slice(0, 1500) + (s.content.length > 1500 ? "…" : "")
      ).join("\n\n") +
      "\n---\n"
    : "";

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
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  const complex = isComplex(message);

  // Simple messages: DeepSeek first (fast, cheap)
  if (!complex) {
    try {
      const reply = await callDeepSeek(fullSystem, messages);
      return NextResponse.json({ response: reply, engine: "deepseek" });
    } catch (err) {
      console.error("DeepSeek failed, escalating to Groq:", err);
    }
  }

  // Complex messages (or DeepSeek failure): Groq
  try {
    const result = await callGroq(fullSystem, messages);
    return NextResponse.json({ response: result, engine: "groq" });
  } catch (groqErr) {
    console.error("Groq failed, trying DeepSeek as last resort:", groqErr);
  }

  // Last resort: DeepSeek for complex messages when Groq fails
  if (complex) {
    try {
      const result = await callDeepSeek(fullSystem, messages);
      return NextResponse.json({ response: result, engine: "deepseek" });
    } catch (err) {
      console.error("DeepSeek last-resort also failed:", err);
    }
  }

  return NextResponse.json(
    { error: "Coach is temporarily offline. Check your connection." },
    { status: 500 },
  );
}
