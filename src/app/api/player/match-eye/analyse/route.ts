import { NextRequest } from "next/server";
import { waitForGeminiFile, callGemini } from "@/lib/gemini-api";
import { FOOTBALL_POSITION_DRILLS } from "@/lib/drill-data";

// Compact catalog injected into the Gemini prompt so it recommends real drill IDs
const DRILL_CATALOG = Object.values(FOOTBALL_POSITION_DRILLS)
  .flatMap((track) => track.drills)
  .map((d) => ({
    id:        d.id,
    name:      d.name,
    positions: d.position_tags,
    benefit:   d.football_benefit.split(".")[0].slice(0, 100),
  }));

export const maxDuration = 600;
export const runtime = "nodejs";

interface KeyMoment {
  time: string;
  type: "strength" | "weakness" | "neutral";
  description: string;
}

interface DrillRecommendation {
  drill_id?: string | null;
  drill: string;
  why: string;
  frequency: string;
}

interface PlayerAnalysis {
  overall_rating: number;
  performance_summary: string;
  key_moments: KeyMoment[];
  technical_strengths: string[];
  areas_to_improve: string[];
  positioning_analysis: string;
  physical_assessment: string;
  tactical_understanding: string;
  drill_recommendations: DrillRecommendation[];
  scout_note: string;
}

function extractJSON(text: string): PlayerAnalysis | null {
  try {
    return JSON.parse(text) as PlayerAnalysis;
  } catch {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) {
      try { return JSON.parse(mdMatch[1]) as PlayerAnalysis; } catch { /* fall through */ }
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as PlayerAnalysis; } catch { /* fall through */ }
    }
    return null;
  }
}


export async function POST(req: NextRequest) {
  try {
    const {
      fileUri, fileName, mimeType, fileState,
      sport, position, jersey, focusQuestion,
    } = await req.json() as {
      fileUri: string;
      fileName: string;
      mimeType: string;
      fileState?: string;
      sport?: string;
      position?: string;
      jersey?: string;
      focusQuestion?: string;
    };

    if (!fileUri || !fileName) {
      return Response.json({ error: "No file URI provided" }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    if (fileState !== "ACTIVE") {
      await waitForGeminiFile(fileName, googleKey, 10);
    }

    const sportLabel    = sport     || "Football";
    const positionLabel = position  || "player";
    const jerseyLabel   = jersey    ? ` (Jersey #${jersey})` : "";
    const focusLabel    = focusQuestion
      ? `\n\nCoach focus: "${focusQuestion}" — pay particular attention to this.`
      : "";

    const systemPrompt = `You are an expert ${sportLabel} coach reviewing footage of an individual player.
Player: ${positionLabel}${jerseyLabel}${focusLabel}

Watch the full video carefully. Focus entirely on this one player's individual performance — their movement, technical execution, decision-making, positioning relative to teammates and opponents, work rate, and standout moments.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact structure:
{
  "overall_rating": 7,
  "performance_summary": "2-3 sentence overview of the player's overall performance in this footage",
  "key_moments": [
    { "time": "12:30", "type": "strength", "description": "Specific action — what happened and why it was good" },
    { "time": "23:45", "type": "weakness", "description": "Specific action — what went wrong and why" },
    { "time": "38:10", "type": "neutral", "description": "Neutral observation about positioning or decision" }
  ],
  "technical_strengths": [
    "Specific technical quality observed — be precise, not generic",
    "Another technical strength"
  ],
  "areas_to_improve": [
    "Specific technical weakness — describe exactly what needs fixing",
    "Another area needing work"
  ],
  "positioning_analysis": "Paragraph: where did the player position themselves? Good movements, bad movements. Were they in the right place at the right time?",
  "physical_assessment": "Paragraph: pace, stamina, physicality, aerial ability. What physical qualities stood out positively or negatively?",
  "tactical_understanding": "Paragraph: decision-making, reading the game, understanding of their role. Did they make smart choices?",
  "drill_recommendations": [
    { "drill_id": "eng_st_01", "drill": "Lions' Den Central Turning", "why": "Why this drill addresses what was seen", "frequency": "3x per week" },
    { "drill_id": null, "drill": "Generic drill if no catalog match", "why": "Why", "frequency": "Daily" }
  ],
  "scout_note": "One sentence a scout would write — honest, professional, specific to what was seen"
}

overall_rating: 1 (very poor) to 10 (exceptional). Be honest — most grassroots players are 4-7.
key_moments: include 3-6 moments with accurate timestamps.
technical_strengths and areas_to_improve: 3-5 items each — specific to THIS player in THIS video.
drill_recommendations: 2-4 drills. For each weakness you identify, pick the BEST matching drill from the catalog below by ID. Set drill_id to that ID and drill to that drill's name. If no catalog drill fits the weakness, set drill_id to null and invent a suitable drill name.
Base everything on what you actually see in the video.

DRILL CATALOG — match weaknesses to these drills by ID:
${JSON.stringify(DRILL_CATALOG)}`;

    const geminiText = await callGemini(
      googleKey,
      [
        { text: systemPrompt },
        { file_data: { mime_type: mimeType, file_uri: fileUri } },
        { text: "Now provide your complete JSON analysis of this player's performance." },
      ],
      { temperature: 0.2, maxOutputTokens: 4096 }
    );
    const analysis = extractJSON(geminiText);

    if (!analysis) {
      return Response.json(
        { error: "Gemini returned unreadable analysis", raw: geminiText.slice(0, 500) },
        { status: 502 }
      );
    }

    // ── Gemini personal coaching narrative ───────────────────────────────────
    let narrative = "";

    try {
      narrative = await callGemini(
        googleKey,
        [{
          text: `You are a personal sports coach writing feedback directly to a ${sportLabel} player.

Player: ${positionLabel}${jerseyLabel}
AI Vision Analysis (from the video):
${JSON.stringify(analysis, null, 2)}

Write a personal 3-paragraph coaching message directly to the player (use "you"):
1. What you did well — celebrate the genuine strengths you saw
2. Where you need to grow — honest, specific, kind — reference real moments from the video
3. Your action plan — exactly what to work on before the next session, with one priority drill

Write as a coach who knows this player and cares about their development. Be direct, specific, and encouraging. No generic advice. Reference what was actually seen in the video. Plain text only — no markdown.`,
        }],
        { temperature: 0.4, maxOutputTokens: 1024 }
      );
    } catch {
      // narrative is optional — silently skip if Gemini call fails
    }

    return Response.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
