// src/app/api/cron/generate-tactical-report/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fires every 15 minutes via Vercel cron (see vercel.json addition below).
// Checks for matches that just finished and generates their Tactical Report.
//
// THIS IS THE LEGAL BOUNDARY:
//   - LiveCommentary.tsx polls WHILE the match is live and speaks events aloud
//     in real time → this is the broadcasting-risk pattern
//   - This cron route runs in the BACKGROUND, AFTER full-time, with no user
//     watching → reports simply exist, already finished, when a player opens
//     the app later. No live push to any client. No audio synced to play.
//
// HOW IT WORKS:
//   1. Vercel calls this URL every 15 minutes (no human involved)
//   2. Route checks bhora-ai for matches where status = 'completed' AND
//      tactical_report_generated = false
//   3. For each one, fetches the full event log and possession/shot stats
//   4. Classifies every event into one of 3 phases (see phase-classifier.ts)
//   5. Generates 2-3 "What Would You Do?" quiz moments from the highest-
//      leverage events (goals, turnovers in the defensive third, etc.)
//   6. Calls THUTO/Amara once per match for the phase narrative (not per event)
//   7. Saves the report, marks tactical_report_generated = true
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { classifyPhases } from '@/lib/tactical-iq/phase-classifier';
import { generateQuizMoments } from '@/lib/tactical-iq/quiz-generator';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function GET(req: NextRequest) {
  // ── Security: only Vercel's own cron scheduler can call this ────────────
  // Vercel automatically attaches this header — random requests get rejected
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Step 1 — find matches that just finished and have no report yet
    const matchesRes = await fetch(`${API}/world-cup/matches/pending-tactical-report`);
    if (!matchesRes.ok) {
      return NextResponse.json({ processed: 0, error: 'Could not fetch pending matches' });
    }
    const { matches } = await matchesRes.json();

    if (!matches || matches.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No matches awaiting reports' });
    }

    const results: { matchId: string; status: string }[] = [];

    // Step 2 — process each finished match
    for (const match of matches) {
      try {
        // Fetch full event log + stats for this match
        const detailRes = await fetch(`${API}/world-cup/matches/${match.id}/full-log`);
        if (!detailRes.ok) {
          results.push({ matchId: match.id, status: 'fetch_failed' });
          continue;
        }
        const matchData = await detailRes.json();

        // Step 3 — classify every event into Regain / Build / Finish
        const phases = classifyPhases(matchData.events, matchData.stats);

        // Step 4 — pick 2-3 high-leverage moments for the quiz
        const quizMoments = generateQuizMoments(matchData.events, phases);

        // Step 5 — one THUTO/Amara call for the whole match narrative
        // (not one call per event — keeps this cheap and fast)
        const narrativeRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/ai-coach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: buildPhasePrompt(phases, matchData),
            gender: 'male', // narrative is neutral; coach voice picked per-viewer client-side
            history: [],
            userContext: { mode: 'tactical_report' },
          }),
        });
        const narrative = narrativeRes.ok
          ? (await narrativeRes.json()).response ?? ''
          : '';

        // Step 6 — save the completed report
        // X-Cron-Secret authenticates this as a legitimate cron call, not a
        // random public request — must match CRON_SECRET set in Laravel's
        // config/services.php (env: CRON_SECRET, same value in both Vercel
        // and Render environment variables)
        const saveRes = await fetch(`${API}/world-cup/matches/${match.id}/tactical-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': process.env.CRON_SECRET ?? '',
          },
          body: JSON.stringify({
            phases,
            quizMoments,
            narrative,
            generatedAt: new Date().toISOString(),
          }),
        });

        results.push({
          matchId: match.id,
          status: saveRes.ok ? 'generated' : 'save_failed',
        });
      } catch (err) {
        results.push({ matchId: match.id, status: 'error' });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}

// Builds the single prompt sent to THUTO/Amara for the whole match —
// asks for tactical insight, not a play-by-play
function buildPhasePrompt(
  phases: ReturnType<typeof classifyPhases>,
  matchData: { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number },
): string {
  return `Analyse this match from a tactical education perspective for youth players.
Do not narrate the score. Identify ONE tactical pattern from the data below and
explain what a player could learn from it.

${matchData.homeTeam} ${matchData.homeScore} - ${matchData.awayScore} ${matchData.awayTeam}

Regaining Possession phase: ${phases.regain.successRate}% success rate, ${phases.regain.events.length} events
Building the Attack phase: ${phases.build.successRate}% success rate, ${phases.build.events.length} events
Finishing phase: ${phases.finish.successRate}% success rate, ${phases.finish.events.length} events

Keep the tone encouraging and educational. Address the player directly. Maximum 4 sentences.`;
}