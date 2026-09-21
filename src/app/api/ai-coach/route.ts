import { NextRequest, NextResponse } from "next/server";
import { findRelevantSessions } from "@/lib/football-knowledge";
import { geminiText } from "@/lib/gemini";

export const maxDuration = 60; // seconds — allow time for Render cold starts

/** GET /api/ai-coach — engine health check (returns which engines are configured) */
export async function GET() {
  const status: Record<string, string> = {};

  // Check DeepSeek
  status.deepseek = process.env.DEEPSEEK_API_KEY ? "key_present" : "key_missing";

  // Check Gemini
  if (!process.env.GEMINI_API_KEY) {
    status.gemini = "key_missing";
  } else {
    try {
      const result = await geminiText(
        "You are a test assistant. Reply with exactly: OK",
        [{ role: "user", content: "ping" }],
        { max_tokens: 10 }
      );
      status.gemini = result ? "ok" : "empty_response";
    } catch (err) {
      status.gemini = `error: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`;
    }
  }

  return NextResponse.json(status);
}

/**
 * POST /api/ai-coach
 *
 * TWO-ENGINE RULE (unchanged from original):
 *   1. DeepSeek first  — fast, cheap, handles simple questions
 *   2. Gemini second   — complex/analytical questions, or when DeepSeek fails
 *   3. DeepSeek again  — last resort if Gemini also fails
 *
 * PERSONA SELECTION (new):
 *   gender === 'female' → Amara (coaching persona for female athletes)
 *   gender === 'male' or missing → THUTO (coaching persona for male athletes)
 *   system_prompt in body → overrides persona entirely (admin/coach use cases)
 *
 * Body: { message, gender?, system_prompt?, history?, stream?, userContext? }
 */

// ─────────────────────────────────────────────────────────────────────────────
// THUTO — AI coaching persona for male athletes
// ─────────────────────────────────────────────────────────────────────────────
const THUTO_BASE_PROMPT =
  "You are THUTO, the GrassRoots Sports AI coaching assistant for male athletes in Zimbabwe. " +
  "You are an expert Zimbabwean sports mentor — you help players and coaches at grassroots, " +
  "school and Division 1/2 level with tactics, training, player development and match analysis. " +
  "\n\nYour personality:" +
  "\n- Direct and competitive — you speak like a coach who expects results" +
  "\n- You reference real Zimbabwe football — Warriors, ZIFA, Dynamos, Highlanders, Castle Lager Premier League" +
  "\n- At Student rank you are encouraging like a school teacher. At Lion rank you speak like a senior club coach." +
  "\n- You acknowledge effort and consistency — not just raw talent" +
  "\n- You know a player in Hurungwe has the same potential as one in Harare" +
  "\n- Use local flair like 'bhora pasi' or 'kujatisa' where it fits naturally" +
  "\n- If a player lacks equipment, suggest grassroots alternatives (stones instead of cones, etc.)" +
  "\n\nYour knowledge:" +
  "\n- The 6 GRS tests: jump, sprint, balance, reaction, endurance, ball mastery" +
  "\n- AQ (Athletic Quotient), DQ (development rate per week), PQ (position match score)" +
  "\n- 6 ranks: Student, Player, Skilled, Attacker, Star, Lion" +
  "\n- DQ matters more to scouts than raw AQ — a player improving 3% per week is more interesting than one who is static at a higher score" +
  "\n- The drill curriculum unlocks through 5 tiers as the player improves" +
  "\n\nRules:" +
  "\n- 3–5 sentences for most questions. Never generic — always specific." +
  "\n- Reference the player's test results directly when shared" +
  "\n- Never discourage — redirect negative framing toward actionable improvement" +
  "\n- Do not mention other AI systems or that you are built on Claude" +
  "\nEnd with: 'Train anywhere in Zimbabwe. Use AI to get recognized.'";

// ─────────────────────────────────────────────────────────────────────────────
// AMARA — AI coaching persona for female athletes
// ─────────────────────────────────────────────────────────────────────────────
const AMARA_BASE_PROMPT =
  "You are Amara, the GrassRoots Sports AI coaching assistant for female athletes in Zimbabwe. " +
  "You are an expert mentor — you help female players at grassroots, school and national level " +
  "with tactics, training, player development and match analysis." +
  "\n\nYour personality:" +
  "\n- Warm and technically precise — you combine encouragement with specific coaching detail" +
  "\n- You speak to female athletes as serious athletes, never patronising or overly gentle" +
  "\n- You reference women's football in Africa — Mighty Warriors (Zimbabwe), Super Falcons (Nigeria), Banyana Banyana (South Africa), COSAFA Women's Championship" +
  "\n- You celebrate female athletic achievement — you know how rare it is for a girl in Zimbabwe to have this kind of coaching access" +
  "\n- You build confidence while being honest about what needs work" +
  "\n- You understand many girls train without family support — never assume resources or backing" +
  "\n- If a player lacks equipment, suggest grassroots alternatives (stones instead of cones, etc.)" +
  "\n\nYour knowledge:" +
  "\n- The 6 GRS tests and that female athletes are scored against female-specific norms — never male benchmarks" +
  "\n- Female sprint norms are different, jump norms are different — a girl at 75th percentile is genuinely exceptional within her cohort" +
  "\n- AQ (Athletic Quotient), DQ (development rate per week), PQ (position match score)" +
  "\n- 6 ranks: Student, Player, Skilled, Attacker, Star, Lion" +
  "\n- DQ matters more to scouts than raw AQ" +
  "\n- Women's football in Zimbabwe is underserved — GRS exists specifically to change that" +
  "\n\nRules:" +
  "\n- 3–5 sentences for most questions. Never generic — always specific." +
  "\n- Compare female results only against female norms — never against male benchmarks" +
  "\n- Acknowledge barriers girls face (family pressure, lack of facilities, no role models) without assuming them" +
  "\n- Celebrate consistency and improvement as much as raw scores" +
  "\n- Never discourage — redirect negative framing toward actionable improvement" +
  "\n- Do not mention other AI systems or that you are built on Claude" +
  "\nEnd with: 'Train anywhere in Zimbabwe. Use AI to get recognized.'";

// ─────────────────────────────────────────────────────────────────────────────
// Engine config — Gemini primary, DeepSeek silent fallback
// ─────────────────────────────────────────────────────────────────────────────

async function callGemini(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  return geminiText(systemPrompt, messages, { max_tokens: 1500 });
}

async function callDeepSeekFallback(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  let res: Response;
  try {
    res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("DeepSeek returned empty response");
  return reply;
}

// ─────────────────────────────────────────────────────────────────────────────
// Match Eye context — latest video analysis fetched from the Laravel DB
// Called only on the first message of each chat session (history.length === 0)
// Returns "" on any failure — never throws
// ─────────────────────────────────────────────────────────────────────────────
async function fetchMatchEyeContext(authToken: string): Promise<string> {
  if (!authToken) return "";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);

    let res: Response;
    try {
      res = await fetch(`${apiUrl}/video-analyses`, {
        headers: { "Authorization": `Bearer ${authToken}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return "";

    const json = await res.json() as { data?: Array<{ ai_feedback: string; sport?: string; created_at?: string }> };
    const analyses = json?.data ?? [];
    if (!analyses.length) return "";

    const latest   = analyses[0];
    const feedback = JSON.parse(latest.ai_feedback) as {
      overall_rating?: number;
      performance_summary?: string;
      technical_strengths?: string[];
      areas_to_improve?: string[];
    };

    const rating    = feedback.overall_rating ?? null;
    const summary   = feedback.performance_summary?.split(".")[0] ?? null;
    const strengths = (feedback.technical_strengths ?? []).slice(0, 2);
    const improve   = (feedback.areas_to_improve   ?? []).slice(0, 2);

    const parts: string[] = [];
    if (rating !== null)  parts.push(`Rating ${rating}/10`);
    if (strengths.length) parts.push(`Strengths: ${strengths.join("; ")}`);
    if (improve.length)   parts.push(`Needs work: ${improve.join("; ")}`);
    if (summary)          parts.push(summary);

    if (!parts.length) return "";

    const sport = latest.sport       ? ` (${latest.sport})`               : "";
    const date  = latest.created_at  ? ` — ${latest.created_at.slice(0, 10)}` : "";

    return `\n\nPLAYER'S RECENT MATCH EYE ANALYSIS${sport}${date}: ${parts.join(". ")}.`;
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    gender?: "male" | "female";
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

  const { message, gender, system_prompt, history = [], userContext } = body;

  if (!message) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  // ── Auth token (forwarded from ThutoChat for Match Eye context fetch) ──────
  const authToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  // ── Select persona ─────────────────────────────────────────────────────────
  // system_prompt in body overrides everything (admin/coach custom prompts)
  // Otherwise: female → Amara, male/missing → THUTO
  const coachName   = gender === "female" ? "Amara" : "THUTO";
  const basePersona = system_prompt
    ?? (gender === "female" ? AMARA_BASE_PROMPT : THUTO_BASE_PROMPT);

  // ── Player context (unchanged from original) ───────────────────────────────
  const playerContext = userContext
    ? `\nYou are speaking with ${userContext.name || "a player"}, ` +
      `a ${userContext.age || "young"}-year-old ${userContext.position || "athlete"}. ` +
      (userContext.recentStats ? `Recent performance: ${userContext.recentStats}. ` : "")
    : "";

  // ── Match Eye context — fetched once per chat session (first message only) ─
  const matchEyeContext = history.length === 0
    ? await fetchMatchEyeContext(authToken)
    : "";

  // ── Knowledge retrieval (unchanged from original) ─────────────────────────
  const relevantSessions = findRelevantSessions(message, 3);
  const knowledgeContext = relevantSessions.length > 0
    ? "\n\n---\nRELEVANT COACHING SESSIONS (FIFA/FA certified):\n" +
      relevantSessions.map((s) =>
        `[${s.title} | ${s.source} | ${s.level}]\n` +
        s.content.slice(0, 1500) + (s.content.length > 1500 ? "…" : "")
      ).join("\n\n") +
      "\n---\n"
    : "";

  // ── Full system prompt: persona + player context + Match Eye + knowledge ───
  const fullSystem = basePersona + playerContext + matchEyeContext + knowledgeContext;

  // ── Conversation history (last 6 turns) ───────────────────────────────────
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  // ── Engine routing — Gemini primary, DeepSeek silent fallback ────────────
  const geminiKey   = process.env.GEMINI_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  console.log(`[ai-coach] request received | coach=${coachName} | gemini=${geminiKey ? "key_present" : "KEY_MISSING"} | deepseek=${deepseekKey ? "key_present" : "KEY_MISSING"}`);

  try {
    const result = await callGemini(fullSystem, messages);
    console.log(`[ai-coach] Gemini responded OK | coach=${coachName}`);
    return NextResponse.json({ response: result, engine: "gemini", coach: coachName });
  } catch (geminiErr) {
    console.error(`[ai-coach] Gemini FAILED | coach=${coachName} | error:`, geminiErr instanceof Error ? geminiErr.message : geminiErr);
  }

  try {
    const result = await callDeepSeekFallback(fullSystem, messages);
    console.log(`[ai-coach] DeepSeek fallback responded OK | coach=${coachName}`);
    return NextResponse.json({ response: result, engine: "deepseek", coach: coachName });
  } catch (err) {
    console.error(`[ai-coach] DeepSeek fallback ALSO FAILED | coach=${coachName} | error:`, err instanceof Error ? err.message : err);
  }

  return NextResponse.json(
    { error: "Coach is temporarily offline. Check your connection.", coach: coachName },
    { status: 500 },
  );
}