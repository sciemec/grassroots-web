import { NextRequest } from "next/server";

export const maxDuration = 300;
export const runtime = "nodejs";

interface MatchEvent {
  time: string;
  team: "home" | "away" | "neutral";
  type: string;
  description: string;
}

interface PlayerTrackingResult {
  jersey: string;
  name: string;
  position_tendency: string;
  key_moments: string[];
  rating: number;
  improvement: string;
}

interface TrackedPlayer {
  jersey: string;
  name: string;
  position: string;
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
  player_tracking?: PlayerTrackingResult[];
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

// Poll Gemini until the uploaded file is ACTIVE (ready for generateContent)
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

    await new Promise((r) => setTimeout(r, 5000)); // check every 5s → 10 min max
  }
  throw new Error("Video file did not become ready within 10 minutes");
}

export async function POST(req: NextRequest) {
  try {
    const { fileUri, fileName, mimeType, fileState, homeTeam, awayTeam, competition, sport, trackedPlayers } =
      await req.json() as {
        fileUri: string;
        fileName: string;
        mimeType: string;
        fileState?: string;
        homeTeam: string;
        awayTeam: string;
        competition?: string;
        sport?: string;
        trackedPlayers?: TrackedPlayer[];
      };

    if (!fileUri || !fileName) {
      return Response.json({ error: "No file URI provided" }, { status: 400 });
    }

    const googleKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
    if (!googleKey) {
      return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Skip polling if upload already confirmed ACTIVE
    if (fileState !== "ACTIVE") {
      await waitForFileActive(fileName, googleKey);
    }

    // ── Build player tracking section (injected when coach specifies players) ───
    const activePlayers = (trackedPlayers ?? []).filter((p) => p.jersey || p.name);
    const playerTrackingPrompt = activePlayers.length > 0
      ? `\n\nPLAYER TRACKING REQUEST — Watch specifically for these players by jersey number:
${activePlayers.map((p) => `#${p.jersey}${p.name ? ` — ${p.name}` : ""}${p.position ? ` (${p.position})` : ""}`).join("\n")}

For each player, include a "player_tracking" array in your JSON with this structure:
"player_tracking": [
  {
    "jersey": "7",
    "name": "Player Name",
    "position_tendency": "Where they positioned themselves and how they moved",
    "key_moments": ["12:30 — specific action description", "38:00 — another moment"],
    "rating": 7,
    "improvement": "One specific, actionable thing this player must improve"
  }
]
Track every player listed above. If a jersey number is not visible in the video, note that in position_tendency.`
      : "";

    // ── Call Gemini with native video file_data ───────────────────────────────
    const systemPrompt = `You are a professional football analyst with UEFA A-licence coaching experience.
You will watch the full match video: ${homeTeam} vs ${awayTeam}${competition ? ` (${competition})` : ""}${sport ? ` — Sport: ${sport}` : ""}.

Watch the entire video. Observe player positions, ball movement, team shapes, events, and tactical patterns throughout the full match.

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

For possession: estimate based on which team controlled the ball across the full match.
For events: include all significant events visible in the video with accurate timestamps.
For formations: identify from player positioning throughout the full match.
Be specific and professional. Base everything on what you observe in the video.${playerTrackingPrompt}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { file_data: { mime_type: mimeType, file_uri: fileUri } },
              { text: "Now provide your complete JSON analysis of this full match video." },
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
    const analysis = extractJSON(geminiText);

    if (!analysis) {
      return Response.json(
        { error: "Gemini returned unreadable analysis", raw: geminiText.slice(0, 500) },
        { status: 502 }
      );
    }

    // ── Call Claude for tactical narrative ────────────────────────────────────────
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
          messages: [{
            role: "user",
            content: `You are a professional football analyst writing a post-match report for a coach.

Match: ${homeTeam} vs ${awayTeam}${competition ? `\nCompetition: ${competition}` : ""}${sport ? `\nSport: ${sport}` : ""}

AI Vision Analysis (Gemini 1.5 Pro watched the full match video natively):
${JSON.stringify(analysis, null, 2)}

Write a professional 4-paragraph tactical match report:
1. Match overview — what happened and who controlled the game
2. Tactical analysis — what formations were used, what worked, what didn't
3. Individual highlights${activePlayers.length > 0 ? ` — include specific observations on tracked players (${activePlayers.map((p) => `#${p.jersey}${p.name ? ` ${p.name}` : ""}`).join(", ")})` : " and areas of concern"}
4. Training recommendations for the next session based on what was seen

Write as a UEFA A-licence coach. Be specific, direct, and actionable. Reference formations, patterns, and events by name. No generic advice.`,
          }],
        }),
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json() as {
          content?: Array<{ text?: string }>;
        };
        narrative = claudeData.content?.[0]?.text ?? "";
      }
    }

    return Response.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
