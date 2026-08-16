import { NextRequest } from "next/server";
import { waitForGeminiFile, callGemini } from "@/lib/gemini-api";
import { TACTICAL_PRINCIPLES } from "@/lib/thuto-tactics-knowledge";

export const maxDuration = 600;
export const runtime = "nodejs";

// Compact tactics catalog injected into Gemini prompt so it can link turnovers to principles by ID
const TACTICS_CATALOG = TACTICAL_PRINCIPLES.map((p) => ({
  id:       p.id,
  title:    p.title,
  category: p.category,
  summary:  p.summary.split(".")[0].slice(0, 100),
}));

interface TeamTurnoverMoment {
  time:            string;
  pattern:         string;
  consequence:     string;
  principle_id:    string;
  principle_title: string;
  principle_fix:   string;
  safety_flag:     boolean;
  safety_note?:    string;
}

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
  turnover_moments?: TeamTurnoverMoment[];
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

// ── Merge helpers ─────────────────────────────────────────────────────────────

function mergePlayerTracking(players: PlayerTrackingResult[]): PlayerTrackingResult[] {
  const byJersey = new Map<string, PlayerTrackingResult>();
  for (const p of players) {
    const key = p.jersey || p.name;
    if (!key) continue;
    const existing = byJersey.get(key);
    if (!existing) {
      byJersey.set(key, { ...p, key_moments: [...(p.key_moments ?? [])] });
    } else {
      existing.key_moments = [...existing.key_moments, ...(p.key_moments ?? [])];
      existing.rating = Math.round((existing.rating + p.rating) / 2);
    }
  }
  return [...byJersey.values()];
}

function mergeSegments(segments: MatchAnalysis[]): MatchAnalysis {
  if (segments.length === 1) return segments[0];
  const last = segments[segments.length - 1];
  return {
    formation_home:          segments[0].formation_home,
    formation_away:          segments[0].formation_away,
    possession_home:         Math.round(segments.reduce((s, r) => s + (r.possession_home ?? 50), 0) / segments.length),
    possession_away:         Math.round(segments.reduce((s, r) => s + (r.possession_away ?? 50), 0) / segments.length),
    shots_home:              segments.reduce((s, r) => s + (r.shots_home ?? 0), 0),
    shots_away:              segments.reduce((s, r) => s + (r.shots_away ?? 0), 0),
    shots_on_target_home:    segments.reduce((s, r) => s + (r.shots_on_target_home ?? 0), 0),
    shots_on_target_away:    segments.reduce((s, r) => s + (r.shots_on_target_away ?? 0), 0),
    fouls_detected:          segments.reduce((s, r) => s + (r.fouls_detected ?? 0), 0),
    key_events:              segments.flatMap((r) => r.key_events ?? []),
    tactical_patterns:       [...new Set(segments.flatMap((r) => r.tactical_patterns ?? []))],
    defensive_issues:        [...new Set(segments.flatMap((r) => r.defensive_issues ?? []))],
    attacking_strengths:     [...new Set(segments.flatMap((r) => r.attacking_strengths ?? []))],
    key_coaching_points:     [...new Set(segments.flatMap((r) => r.key_coaching_points ?? []))],
    man_of_match_candidate:  last.man_of_match_candidate,
    halftime_recommendation: last.halftime_recommendation,
    turnover_moments:        segments.flatMap((r) => r.turnover_moments ?? []).slice(0, 3),
    player_tracking:         mergePlayerTracking(segments.flatMap((r) => r.player_tracking ?? [])),
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      fileUri, fileName, mimeType, fileState,
      sessionType,
      homeTeam, awayTeam, competition,
      drillType, drillFocus,
      sport, trackedPlayers,
    } = await req.json() as {
      fileUri: string;
      fileName: string;
      mimeType: string;
      fileState?: string;
      sessionType?: string;
      homeTeam?: string;
      awayTeam?: string;
      competition?: string;
      drillType?: string;
      drillFocus?: string;
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
      await waitForGeminiFile(fileName, googleKey, 10);
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

    // ── DRILL MODE ────────────────────────────────────────────────────────────
    if (sessionType === "drill") {
      const drillPrompt = `You are an experienced ${sport ?? "football"} coach with UEFA A-licence experience watching a training drill video.
Drill type: ${drillType ?? "Training Drill"}
Sport: ${sport ?? "Football"}${drillFocus ? `\nCoach's focus: ${drillFocus}` : ""}

Watch the full video carefully. Observe player movement, technique, decision-making, press intensity, and coaching moments throughout.

Return ONLY a valid JSON object — no markdown, no explanation:
{
  "drill_type": "${drillType ?? "Training Drill"}",
  "duration_observed": "estimated duration e.g. 8 minutes",
  "intensity_rating": 7,
  "player_count": 8,
  "key_observations": [
    "Pattern or behaviour you observe across the group as a whole",
    "Another repeated pattern"
  ],
  "individual_feedback": [
    {
      "identifier": "describe by jersey colour, bib, position or number",
      "observation": "specific thing this player does wrong or well",
      "fix": "exact actionable correction or praise"
    }
  ],
  "technical_issues": [
    "Technical problem affecting the whole group",
    "Another technical issue"
  ],
  "positives": [
    "Something the group or individuals are doing well",
    "Another positive to reinforce"
  ],
  "coaching_points": [
    "Most important thing to address right now",
    "Second priority coaching point",
    "Third priority"
  ],
  "drill_progression": "Specific way to progress or regress this drill based on what you observed"
}

Be specific and practical. Reference what you actually see — jersey colours, positions, moments in the video. No generic advice.${playerTrackingPrompt}`;

      const drillText = await callGemini(
        googleKey,
        [
          { text: drillPrompt },
          { file_data: { mime_type: mimeType, file_uri: fileUri }, videoMetadata: { endOffset: { seconds: 3600 } } },
          { text: "Now provide your complete JSON analysis of this training drill video." },
        ],
        { temperature: 0.2, maxOutputTokens: 3000 }
      );
      const drillAnalysis = extractJSON(drillText);

      if (!drillAnalysis) {
        return Response.json({ error: "Gemini returned unreadable drill analysis", raw: drillText.slice(0, 500) }, { status: 502 });
      }

      // Narrative for drill
      const drillNarrativePrompt = `You are an experienced ${sport ?? "football"} coach writing a brief training session report.

Drill: ${drillType ?? "Training Drill"}${drillFocus ? `\nFocus: ${drillFocus}` : ""}
Analysis data:
${JSON.stringify(drillAnalysis, null, 2)}

Write a concise 3-paragraph coaching report:
1. Overall session assessment — intensity, engagement, what the group achieved
2. Main technical issue to work on and why it matters in a match situation
3. What to do next — specific instruction for the next drill or session

Write as a coach talking directly to their assistant. Be specific, direct, practical. No generic phrases. Plain text only — no markdown.`;

      let drillNarrative = "";
      try {
        drillNarrative = await callGemini(
          googleKey,
          [{ text: drillNarrativePrompt }],
          { temperature: 0.4, maxOutputTokens: 800 }
        );
      } catch {
        // narrative is optional — silently skip
      }

      return Response.json({ analysis: drillAnalysis, narrative: drillNarrative });
    }

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
  ],
  "turnover_moments": [
    {
      "time": "34:15",
      "pattern": "Midfield repeatedly received the ball facing their own goal and dribbled into pressure instead of turning or playing early",
      "consequence": "Ball lost in a dangerous central midfield zone on three separate occasions, each leading to a counter-attack",
      "principle_id": "pass-and-move",
      "principle_title": "Pass and Move",
      "principle_fix": "Midfielders should scan before receiving, know their exit pass, and release the ball earlier when facing pressure",
      "safety_flag": true,
      "safety_note": "Players were tackled while surrounded in tight areas — high collision risk in central zones"
    }
  ]
}

For possession: estimate based on which team controlled the ball across the full match.
For events: include all significant events visible in the video with accurate timestamps.
For formations: identify from player positioning throughout the full match.
turnover_moments: identify 0-3 recurring team-level patterns where a collective decision or habit directly caused repeated possession loss. Describe the team behaviour and its consequence, then pick the MOST relevant principle from the TACTICS CATALOG by ID. Set safety_flag to true only when players were tackled under heavy physical pressure in tight areas (collision risk). If no clear turnover patterns are visible, return an empty array [].
Be specific and professional. Base everything on what you observe in the video.

TACTICS CATALOG — match turnover patterns to these principles by ID:
${JSON.stringify(TACTICS_CATALOG)}${playerTrackingPrompt}`;

    // ── Server-side segmentation: 3 × 15-minute sequential calls ────────────
    // Gemini processes video at 1 fps by default. Each 15-min segment = 900 frames × 258
    // tokens ≈ 234K tokens — 4.5× headroom under the 1,048,576 token limit.
    // Only startOffset/endOffset are valid videoMetadata fields in the Gemini REST API.
    // The fps field is NOT part of the REST API schema and is silently ignored by Gemini.
    const SEGMENTS: Array<{ startSeconds: number; endSeconds: number; label: string; offsetMins: number }> = [
      { startSeconds: 0,    endSeconds: 900,  label: "minutes 0-15",  offsetMins: 0  },
      { startSeconds: 900,  endSeconds: 1800, label: "minutes 15-30", offsetMins: 15 },
      { startSeconds: 1800, endSeconds: 2700, label: "minutes 30-45", offsetMins: 30 },
    ];

    const segmentResults: (MatchAnalysis | null)[] = [];

    for (const seg of SEGMENTS) {
      const timeNote = seg.offsetMins > 0
        ? `\n\nANALYSIS WINDOW: You are viewing ${seg.label} of the match. Add ${seg.offsetMins} minutes to all timestamps you observe — e.g. if you see 3:00 in this clip, report it as "${seg.offsetMins + 3}:00".`
        : `\n\nANALYSIS WINDOW: You are viewing the opening ${seg.label} of the match. Report timestamps exactly as you observe them.`;

      try {
        const segText = await callGemini(
          googleKey,
          [
            { text: systemPrompt + timeNote },
            {
              file_data:     { mime_type: mimeType, file_uri: fileUri },
              videoMetadata: {
                startOffset: { seconds: seg.startSeconds },
                endOffset:   { seconds: seg.endSeconds },
              },
            },
            { text: `Provide your complete JSON analysis of the ${seg.label} segment.` },
          ],
          { temperature: 0.2, maxOutputTokens: 4096 }
        );
        segmentResults.push(extractJSON(segText));
      } catch {
        segmentResults.push(null);
      }
    }

    const validResults = segmentResults.filter((r): r is MatchAnalysis => r !== null);

    if (validResults.length === 0) {
      return Response.json(
        { error: "Gemini could not analyse any segment of this video. The file may still be processing — wait 30 seconds and try again." },
        { status: 502 }
      );
    }

    const analysis = mergeSegments(validResults);

    // ── Call Gemini for tactical narrative ────────────────────────────────────────
    let narrative = "";

    const narrativePrompt = `You are a professional football analyst writing a post-match report for a coach.

Match: ${homeTeam} vs ${awayTeam}${competition ? `\nCompetition: ${competition}` : ""}${sport ? `\nSport: ${sport}` : ""}

Match analysis data:
${JSON.stringify(analysis, null, 2)}

Write a professional 4-paragraph tactical match report:
1. Match overview — what happened and who controlled the game
2. Tactical analysis — what formations were used, what worked, what didn't
3. Individual highlights${activePlayers.length > 0 ? ` — include specific observations on tracked players (${activePlayers.map((p) => `#${p.jersey}${p.name ? ` ${p.name}` : ""}`).join(", ")})` : " and areas of concern"}
4. Training recommendations for the next session based on what was seen

Write as a UEFA A-licence coach. Be specific, direct, and actionable. Reference formations, patterns, and events by name. No generic advice. Return plain text only — no markdown, no bullet points.`;

    try {
      narrative = await callGemini(
        googleKey,
        [{ text: narrativePrompt }],
        { temperature: 0.4, maxOutputTokens: 1500 }
      );
    } catch {
      // narrative is optional — silently skip
    }

    return Response.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Gemini token-limit error — video segment still too long (endOffset may not be recognised)
    if (
      message.includes("input token count") ||
      message.includes("1048576") ||
      message.includes("token limit") ||
      message.includes("context limit") ||
      message.includes("too long for model") ||
      message.includes("exceeds the maximum")
    ) {
      return Response.json(
        { error: "Video is too long. Upload each half separately — first half in the First Half slot, second half in the Second Half slot (each must be under 60 minutes)." },
        { status: 422 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
