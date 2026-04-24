import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

interface Frame {
  base64: string;
  timestamp: number;
}

interface MatchEvent {
  time: string;
  team: "home" | "away" | "neutral";
  type: string;
  description: string;
}

interface MatchAnalysis {
  formation_home: string;
  formation_away: string;
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  shots_on_target_home: number;
  shots_on_target_away: number;
  fouls_detected: number;
  key_events: MatchEvent[];
  tactical_patterns: string[];
  defensive_issues: string[];
  attacking_strengths: string[];
  man_of_match_candidate: string;
  halftime_recommendation: string;
  key_coaching_points: string[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractJSON(text: string): MatchAnalysis | null {
  try {
    return JSON.parse(text) as MatchAnalysis;
  } catch {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (mdMatch) {
      try { return JSON.parse(mdMatch[1]) as MatchAnalysis; } catch { /* fall through */ }
    }
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as MatchAnalysis; } catch { /* fall through */ }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { frames, homeTeam, awayTeam, competition, sport } = await req.json() as {
      frames: Frame[];
      homeTeam: string;
      awayTeam: string;
      competition?: string;
      sport?: string;
    };

    if (!frames || frames.length === 0) {
      return Response.json({ error: "No frames provided" }, { status: 400 });
    }

    const googleKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 500 });
    }

    // ── Build Gemini parts array ──────────────────────────────────────────────
    const systemPrompt = `You are a professional football analyst with UEFA A-licence coaching experience.
You will analyse a sequence of ${frames.length} match frames from ${homeTeam} vs ${awayTeam}${competition ? ` (${competition})` : ""}.
Each frame is labelled with its exact match timestamp.

Study the player positions, ball location, team shapes, and any visible events in each frame.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact structure:
{
  "formation_home": "4-3-3",
  "formation_away": "4-4-2",
  "possession_home": 55,
  "possession_away": 45,
  "shots_home": 8,
  "shots_away": 5,
  "shots_on_target_home": 4,
  "shots_on_target_away": 2,
  "fouls_detected": 3,
  "key_events": [
    { "time": "23:00", "team": "home", "type": "shot", "description": "Right-footed shot from edge of box" },
    { "time": "45:00", "team": "away", "type": "goal", "description": "Header from corner kick" }
  ],
  "tactical_patterns": [
    "Home team pressed high in the first 30 minutes",
    "Away team consistently attacked down the right channel"
  ],
  "defensive_issues": [
    "Left back exposed on counter-attacks repeatedly"
  ],
  "attacking_strengths": [
    "Strong combination play through the central midfield"
  ],
  "man_of_match_candidate": "Home team central midfielder — controlled the tempo all match",
  "halftime_recommendation": "Push the right winger higher and switch to a 4-2-3-1 to press their slower left back",
  "key_coaching_points": [
    "Defensive line needs to step up 5 metres when opponent goalkeeper has the ball",
    "Set pieces — near-post runs are being missed"
  ]
}

For possession: estimate based on which team has the ball in each frame.
For events: only include events you can see evidence of in the frames.
For formations: identify from player positioning visible in frames.
Be specific and professional. Base everything on what you observe in the frames.`;

    const geminiFlatParts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      { text: systemPrompt },
    ];

    for (let i = 0; i < frames.length; i++) {
      geminiFlatParts.push({ text: `\n--- Frame ${i + 1} | Match time: ${formatTime(frames[i].timestamp)} ---` });
      geminiFlatParts.push({
        inline_data: { mime_type: "image/jpeg", data: frames[i].base64 },
      });
    }

    geminiFlatParts.push({
      text: "\nNow provide your complete JSON analysis of this match based on all the frames above.",
    });

    // ── Call Gemini 1.5 Pro ───────────────────────────────────────────────────
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: geminiFlatParts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return Response.json({ error: `Gemini API error: ${geminiRes.status}`, detail: errText }, { status: 502 });
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const analysis = extractJSON(geminiText);

    if (!analysis) {
      return Response.json({
        error: "Gemini returned unreadable analysis",
        raw: geminiText.slice(0, 500),
      }, { status: 502 });
    }

    // ── Call Claude for tactical narrative ────────────────────────────────────
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    let narrative = "";

    if (anthropicKey) {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `You are a professional football analyst writing a post-match report for a coach.

Match: ${homeTeam} vs ${awayTeam}${competition ? `\nCompetition: ${competition}` : ""}${sport ? `\nSport: ${sport}` : ""}

AI Vision Analysis (from Gemini watching ${frames.length} match frames):
${JSON.stringify(analysis, null, 2)}

Write a professional 4-paragraph tactical match report:
1. Match overview — what happened and who controlled the game
2. Tactical analysis — what formations were used, what worked, what didn't
3. Individual highlights and areas of concern
4. Training recommendations for the next session based on what was seen

Write as a UEFA A-licence coach. Be specific, direct, and actionable. Use the data above — reference formations, patterns, and events by name. No generic advice.`,
            },
          ],
        }),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json() as {
          content?: Array<{ text?: string }>;
        };
        narrative = claudeData.content?.[0]?.text ?? "";
      }
    }

    return Response.json({ analysis, narrative, framesAnalysed: frames.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
