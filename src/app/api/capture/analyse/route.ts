/**
 * POST /api/capture/analyse
 *
 * THUTO analyses a player's skill clip using Claude vision.
 * Receives a base64 JPEG frame extracted client-side from the recording.
 *
 * Body:
 *   frame            — base64 JPEG (from canvas frame extraction)
 *   drill            — e.g. "Dribbling", "Shooting"
 *   focus            — position-specific focus areas for the drill
 *   playerName       — player's first name
 *   position         — e.g. "striker", "midfielder" (optional)
 *   videoUrl         — R2 public URL (optional — for record keeping)
 *
 * Returns:
 *   { strength, correction, drillRecommendation }
 *
 * Falls back to text-only analysis if no frame is provided or
 * if ANTHROPIC_API_KEY is not configured.
 */

import { NextRequest, NextResponse } from "next/server";

interface AnalyseBody {
  frame?:       string;       // base64 JPEG
  drill:        string;
  focus?:       string;
  playerName?:  string;
  position?:    string;
  videoUrl?:    string | null;
}

interface FeedbackResult {
  strength:            string;
  correction:          string;
  drillRecommendation: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let body: AnalyseBody;
  try {
    body = (await req.json()) as AnalyseBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    frame,
    drill       = "Football skill",
    focus       = "technique, body position, movement",
    playerName  = "Player",
    position    = "footballer",
  } = body;

  if (!drill) {
    return NextResponse.json({ error: "drill is required" }, { status: 400 });
  }

  // ── THUTO prompt ──────────────────────────────────────────────────────────
  const systemPrompt =
    "You are THUTO — a personal football development AI for grassroots players in Zimbabwe. " +
    "You speak warmly, directly, and with belief in every player. " +
    "You know that this player might be training on a dirt pitch in Chitungwiza or Bulawayo " +
    "with no professional coaching. Your feedback can change their career. " +
    "Be specific — never generic. Never say 'keep practising' without showing exactly how. " +
    "Always end with encouragement. Speak as a coach on the pitch would — simple, clear, real.";

  const userPrompt = frame
    ? `You are reviewing a video frame of ${playerName}, a ${position} from Zimbabwe, performing ${drill}.

The player wants specific feedback on: ${focus}.

Look carefully at the frame. Analyse their actual technique — not what you assume they did.

Return a JSON object with EXACTLY these three fields (no markdown, no extra text):
{
  "strength": "One specific thing they did well in THIS clip — reference what you can see (body position, foot placement, etc.).",
  "correction": "One specific thing to improve — be kind and precise. Tell them exactly what to change and why.",
  "drillRecommendation": "One concrete drill they can do alone, right now, to fix the correction. Use simple equipment (a ball, a wall, stones as markers). Name the drill and explain it in 2 sentences."
}`
    : `${playerName} is a ${position} from Zimbabwe. They have been practising ${drill}.

The technique focus areas for this skill are: ${focus}.

Without seeing their specific footage, give general THUTO coaching feedback.

Return a JSON object with EXACTLY these three fields (no markdown, no extra text):
{
  "strength": "One encouraging observation about what players who practise ${drill} typically do well at grassroots level.",
  "correction": "The most common technical mistake in ${drill} at grassroots level — and how to fix it.",
  "drillRecommendation": "One concrete solo drill to improve ${drill} technique. Name it and explain in 2 sentences. Use simple equipment."
}`;

  // ── No API key — return a sensible fallback ───────────────────────────────
  if (!apiKey) {
    const fallback: FeedbackResult = {
      strength: `You showed up and put in the work on your ${drill.toLowerCase()}. That discipline is what separates players who improve from those who do not.`,
      correction: `Focus on your body position when performing ${drill.toLowerCase()}. Keep your knees slightly bent and your weight balanced over the ball — this gives you more control and quicker reaction time.`,
      drillRecommendation: `Wall pass drill: Stand 3 metres from a wall. Pass the ball against the wall and control the return with your first touch, alternating feet. Do 3 sets of 20 repetitions daily. This builds the muscle memory you need.`,
    };
    return NextResponse.json(fallback);
  }

  // ── Build Claude API message content ─────────────────────────────────────
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

  const content: ContentBlock[] = [];

  if (frame) {
    content.push({
      type:   "image",
      source: { type: "base64", media_type: "image/jpeg", data: frame },
    });
  }

  content.push({ type: "text", text: userPrompt });

  // ── Call Claude ────────────────────────────────────────────────────────────
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 800,
        system:     systemPrompt,
        messages:   [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const raw  = data?.content?.[0]?.text ?? "";

    // Strip markdown code fences if present, then parse JSON
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/,          "")
      .trim();

    let feedback: FeedbackResult;
    try {
      feedback = JSON.parse(cleaned) as FeedbackResult;
    } catch {
      // Claude returned narrative text — wrap it gracefully
      feedback = {
        strength:            `Great work recording yourself — that alone shows commitment. ${raw.slice(0, 200)}`,
        correction:          "Focus on your body position and balance throughout the movement.",
        drillRecommendation: "Slow-motion shadow drill: perform the skill at 50% speed, focusing on each body position. 3 sets of 5 repetitions.",
      };
    }

    // Validate fields exist
    if (!feedback.strength || !feedback.correction || !feedback.drillRecommendation) {
      throw new Error("Incomplete feedback from Claude");
    }

    return NextResponse.json(feedback);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    console.error("THUTO capture analyse error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
