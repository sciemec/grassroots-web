import { NextRequest, NextResponse } from 'next/server';
import { GEMINI_VISION_MODEL } from '@/lib/gemini';

// POST /api/analyse-commentary
// ─────────────────────────────────────────────────────────────────────────────
// Analyst uploads audio commentary recorded during a match.
// Gemini transcribes + extracts structured match data: shots, events, tactics.
//
// Body: { fileUri, fileName, mimeType, homeTeam, awayTeam, sport, half, token }
//
// Flow:
//   1. Poll Gemini until file is ACTIVE (max 3 min)
//   2. generateContent with structured commentary extraction prompt
//   3. Return CommentaryResult JSON directly (no queue, no polling)
// ─────────────────────────────────────────────────────────────────────────────

export const maxDuration = 300;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'AI analysis is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  let fileUri  = '';
  let fileName = '';
  let mimeType = 'audio/webm';
  let homeTeam = 'Home';
  let awayTeam = 'Away';
  let sport    = 'Football';
  let half     = 'first';
  let token    = '';

  try {
    const body  = await req.json() as Record<string, string>;
    fileUri  = body.fileUri  ?? '';
    fileName = body.fileName ?? '';
    mimeType = body.mimeType ?? 'audio/webm';
    homeTeam = body.homeTeam || 'Home';
    awayTeam = body.awayTeam || 'Away';
    sport    = body.sport    || 'Football';
    half     = body.half     || 'first';
    token    = body.token    ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!fileUri) {
    return NextResponse.json({ error: 'No file URI provided.' }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Please log in to use AI analysis.', login_required: true },
      { status: 401 }
    );
  }

  // ── Poll until Gemini file is ACTIVE (max 3 min, 36 × 5 s) ───────────────
  if (fileName) {
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5_000));
      try {
        const stateRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
          { signal: AbortSignal.timeout(10_000) }
        );
        if (stateRes.ok) {
          const s = await stateRes.json() as { state?: string };
          if (s.state === 'ACTIVE') break;
        }
      } catch {
        // Continue polling
      }
    }
  }

  // ── XG zone reference for Gemini ─────────────────────────────────────────
  const halfLabel = half === 'first' ? '1st Half' : half === 'second' ? '2nd Half' : 'Full Match';

  // ── Structured extraction prompt ──────────────────────────────────────────
  const prompt = `You are a professional football analyst AI. You are given an audio recording of spoken match commentary recorded by an analyst during a ${sport} match: ${homeTeam} vs ${awayTeam} (${halfLabel}).

Listen carefully to all speech. Extract every event, shot, player name, and tactical observation mentioned. Be thorough — do not omit any named player, mentioned shot, or described event.

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "match_info": {
    "home_score": <integer or null>,
    "away_score": <integer or null>,
    "home_formation": "<e.g. 4-3-3 or null>",
    "away_formation": "<e.g. 4-4-2 or null>",
    "possession_home": <integer 0-100 or null>,
    "shots_home": <integer or null>,
    "shots_away": <integer or null>,
    "on_target_home": <integer or null>,
    "on_target_away": <integer or null>,
    "home_xg": <decimal or null>,
    "away_xg": <decimal or null>
  },
  "shots": [
    {
      "team": "<${homeTeam} or ${awayTeam}>",
      "player": "<player name or null>",
      "minute": <integer or null>,
      "zone_id": "<one of: six_yard|penalty_spot|central_box|wide_box_left|wide_box_right|edge_centre|edge_wide_left|edge_wide_right|long_range>",
      "zone_label": "<human readable zone name>",
      "xg": <decimal — use: six_yard=0.76, penalty_spot=0.45, central_box=0.35, wide_box=0.12, edge_centre=0.18, edge_wide=0.07, long_range=0.04>,
      "is_goal": <true or false>,
      "description": "<one sentence>"
    }
  ],
  "player_positions": [
    {
      "name": "<player name>",
      "team": "<${homeTeam} or ${awayTeam}>",
      "number": <shirt number or null>,
      "pitch_x": <0-100, 0=own goal, 100=opponent goal>,
      "pitch_y": <0-100, 0=left touchline, 100=right touchline>,
      "active_zones": [<zone indices 0-59, row*6+col, where 10 rows=defensive-to-attacking, 6 cols=left-to-right>]
    }
  ],
  "pass_combinations": [
    {
      "from_name": "<player name>",
      "from_number": <integer or null>,
      "to_name": "<player name>",
      "to_number": <integer or null>,
      "count": <how many times this combination was mentioned>,
      "team": "<${homeTeam} or ${awayTeam}>"
    }
  ],
  "tactical": {
    "observations": ["<tactical observation 1>", "<observation 2>"],
    "strengths":    ["<strength 1>"],
    "weaknesses":   ["<weakness 1>"]
  },
  "events_timeline": [
    {
      "minute": <match minute as integer or null>,
      "audio_time_seconds": <integer seconds into the audio recording when this event was spoken — e.g. 142 for 2 min 22 s into the file, or null if unclear>,
      "event_type": "<goal|yellow_card|red_card|substitution|corner|free_kick|penalty|injury|var_check|other>",
      "team": "<${homeTeam} or ${awayTeam} or null>",
      "player": "<player name or null>",
      "description": "<one sentence>"
    }
  ],
  "key_players_mentioned": ["<every player name mentioned by the commentator>"],
  "summary": "<2-3 sentence overall match summary based on the commentary>",
  "match_summary": "<1 sentence headline result>"
}

Rules:
- If a stat is not mentioned, use null (do not guess).
- If no shots are mentioned, return shots as an empty array [].
- Every player name spoken must appear in key_players_mentioned.
- For pass_combinations, only include combinations explicitly described or clearly implied.
- For tactical observations, capture all coaching points made.
- For audio_time_seconds, use your audio analysis to estimate when in the recording each event was spoken (not when it occurred in the match). Use the audio file's own timestamps.`;

  // ── Generate analysis ─────────────────────────────────────────────────────
  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: mimeType, file_uri: fileUri } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 3000 },
      }),
      signal: AbortSignal.timeout(120_000),
    }
  );

  if (!genRes.ok) {
    const errText = await genRes.text().catch(() => '');
    return NextResponse.json(
      { error: `AI could not process the audio. ${errText || 'Please try again.'}` },
      { status: 502 }
    );
  }

  const genData = await genRes.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // ── Parse JSON ────────────────────────────────────────────────────────────
  let result: Record<string, unknown> | null = null;
  try {
    result = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        result = JSON.parse(match[0]) as Record<string, unknown>;
      } catch { /* fall through */ }
    }
  }

  if (!result) {
    return NextResponse.json(
      { error: 'Could not parse the analysis. Try a clearer recording.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ result });
}
