// src/app/api/cron/generate-tactical-report/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fires every 15 minutes via Vercel cron (see vercel.json).
// For each newly-finished World Cup match that has no report yet:
//   1. Calls Gemini to synthesise plausible match events from the final score
//   2. Classifies those events into Regain / Build / Finish phases
//   3. Generates quiz moments from the highest-leverage events
//   4. Stores the JSON report in R2 at tactical-reports/{matchId}.json
//   5. Updates the manifest at tactical-reports/index.json
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCompletedMatches, ISPORTS_WORLD_CUP_LEAGUE_ID } from '@/lib/isports/client';
import { classifyPhases, type MatchEvent, type MatchStats } from '@/lib/tactical-iq/phase-classifier';
import { generateQuizMoments } from '@/lib/tactical-iq/quiz-generator';

// ── R2 client ────────────────────────────────────────────────────────────────

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });
}

const BUCKET = process.env.R2_BUCKET ?? 'grassroots-videos';
const MANIFEST_KEY = 'tactical-reports/index.json';

async function getManifest(r2: S3Client): Promise<Record<string, boolean>> {
  try {
    const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: MANIFEST_KEY }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
}

async function saveReport(r2: S3Client, matchId: string, report: object): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: `tactical-reports/${matchId}.json`,
    Body: JSON.stringify(report),
    ContentType: 'application/json',
  }));
}

async function updateManifest(r2: S3Client, manifest: Record<string, boolean>): Promise<void> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: MANIFEST_KEY,
    Body: JSON.stringify(manifest),
    ContentType: 'application/json',
  }));
}

// ── Gemini call ──────────────────────────────────────────────────────────────

interface GeminiEvents {
  events: MatchEvent[];
  narrative: string;
}

async function callGemini(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  matchDate: string,
): Promise<GeminiEvents> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const prompt = `You are a football (soccer) analyst generating educational match data for youth coaches.

Match: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}
Date: ${matchDate}

Generate a plausible, realistic set of match events for this final score. Return ONLY valid JSON — no markdown, no explanation.

Requirements:
- Exactly ${homeScore + awayScore} GOAL events (${homeScore} for home team, ${awayScore} for away team)
- 25 to 35 total events spread across 90 minutes
- Mix of event types: PASS, SHOT, GOAL, DRIBBLE, TACKLE, INTERCEPTION, CROSS, HEADER, CLEARANCE, TURNOVER, THROUGH_BALL, BLOCK, PENALTY, SWITCH_PLAY
- Realistic minute distribution — more events in 30-45 and 60-80 minute ranges
- Zones: "defensive_third", "middle_third", "attacking_third"
- Outcomes: "success" or "failure"
- narrative: exactly 3 paragraphs of tactical education for youth players. No score narration. Focus on WHY the tactical patterns worked or failed.

Return this exact JSON structure:
{
  "events": [
    {"id": "e1", "minute": 12, "eventType": "TACKLE", "team": "home", "zone": "defensive_third", "outcome": "success"},
    ...
  ],
  "narrative": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: GeminiEvents;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Try to extract JSON object from the text
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini returned no valid JSON');
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed.events)) throw new Error('Gemini response missing events array');
  return parsed;
}

// ── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vercel cron attaches this header automatically
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const r2 = getR2();
  if (!r2) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 500 });
  }

  try {
    // Step 1 — fetch all completed World Cup matches from iSports
    const completed = await getCompletedMatches(ISPORTS_WORLD_CUP_LEAGUE_ID);
    if (completed.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No completed matches' });
    }

    // Step 2 — read manifest to find which matches already have reports
    const manifest = await getManifest(r2);
    const pending = completed.filter((m) => !manifest[m.matchId]);

    if (pending.length === 0) {
      return NextResponse.json({ processed: 0, message: 'All matches already have reports' });
    }

    const results: { matchId: string; status: string }[] = [];

    // Step 3 — process each pending match (max 5 per cron tick to stay within time limits)
    for (const match of pending.slice(0, 5)) {
      try {
        const matchDate = new Date(match.matchTime * 1000).toISOString().split('T')[0];

        // Step 4 — call Gemini to synthesise events + narrative
        const geminiData = await callGemini(
          match.homeName,
          match.awayName,
          match.homeScore ?? 0,
          match.awayScore ?? 0,
          matchDate,
        );

        // Step 5 — classify events into phases
        const homeShots = geminiData.events.filter((e) => e.team === 'home' && (e.eventType === 'SHOT' || e.eventType === 'GOAL')).length;
        const awayShots = geminiData.events.filter((e) => e.team === 'away' && (e.eventType === 'SHOT' || e.eventType === 'GOAL')).length;
        const stats: MatchStats = {
          possession: { home: 50, away: 50 },
          shots:      { home: homeShots, away: awayShots },
        };
        const phases = classifyPhases(geminiData.events, stats);

        // Step 6 — generate quiz moments
        const quizMoments = generateQuizMoments(geminiData.events, phases);

        // Step 7 — build and store the report in R2
        const report = {
          available: true,
          matchId: match.matchId,
          homeTeam: match.homeName,
          awayTeam: match.awayName,
          homeScore: match.homeScore ?? 0,
          awayScore: match.awayScore ?? 0,
          matchDate,
          phases,
          quizMoments,
          narrative: geminiData.narrative,
          generatedAt: new Date().toISOString(),
        };

        await saveReport(r2, match.matchId, report);
        manifest[match.matchId] = true;

        results.push({ matchId: match.matchId, status: 'generated' });
      } catch (err) {
        console.error(`Failed to generate report for ${match.matchId}:`, err);
        results.push({ matchId: match.matchId, status: 'error' });
      }
    }

    // Step 8 — update manifest with all newly generated reports
    await updateManifest(r2, manifest);

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error('Cron execution failed:', err);
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}
