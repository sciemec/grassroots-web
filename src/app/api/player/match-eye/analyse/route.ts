import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

interface KeyMoment {
  time: string;
  type: "strength" | "weakness" | "neutral";
  description: string;
}

interface DrillRecommendation {
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

async function waitForFileActive(fileName: string, googleKey: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${googleKey}`
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`File state check failed: ${res.status} — ${body.slice(0, 300)}`);
    }
    const data = await res.json() as { state: string };
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED") throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Video file did not become ready within 10 minutes");
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
      await waitForFileActive(fileName, googleKey);
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
    { "drill": "Specific drill name", "why": "Why this drill addresses what was seen", "frequency": "3x per week" },
    { "drill": "Another drill", "why": "Why", "frequency": "Daily" }
  ],
  "scout_note": "One sentence a scout would write — honest, professional, specific to what was seen"
}

overall_rating: 1 (very poor) to 10 (exceptional). Be honest — most grassroots players are 4-7.
key_moments: include 3-6 moments with accurate timestamps.
technical_strengths and areas_to_improve: 3-5 items each — specific to THIS player in THIS video.
drill_recommendations: 2-4 drills that directly address the weaknesses observed.
Base everything on what you actually see in the video.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { file_data: { mime_type: mimeType, file_uri: fileUri } },
              { text: "Now provide your complete JSON analysis of this player's performance." },
            ],
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return Response.json(
        { error: `Gemini API error: ${geminiRes.status}`, detail: errText },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const analysis   = extractJSON(geminiText);

    if (!analysis) {
      return Response.json(
        { error: "Gemini returned unreadable analysis", raw: geminiText.slice(0, 500) },
        { status: 502 }
      );
    }

    // ── Gemini personal coaching narrative ───────────────────────────────────
    let narrative = "";

    try {
      const narrativeRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
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
            }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
          }),
        }
      );

      if (narrativeRes.ok) {
        const narrativeData = await narrativeRes.json() as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        narrative = narrativeData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    } catch {
      // narrative is optional — silently skip if Gemini call fails
    }

    return Response.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
