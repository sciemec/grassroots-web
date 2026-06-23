// app/api/world-cup/matches/route.ts
// Feeds the /worldcup page with real World Cup 2026 data from iSports.
//
// ?status=live      → in-progress matches (score + minute)
// ?status=completed → finished matches
// No status param   → all of the above merged
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveMatches,
  getCompletedMatches,
  getMatchesByDate,
  ISPORTS_WORLD_CUP_LEAGUE_ID,
  type iSportsMatch,
} from '@/lib/isports/client';

// iSports status codes:
// -1 = FT (finished)   0 = NS (not started)
// 1 = 1H  2 = HT  3 = 2H  4 = ET  5 = PEN
const LIVE_STATUSES = new Set([1, 2, 3, 4, 5]);

function isoFromUnix(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

function mapToPageMatch(m: iSportsMatch) {
  const iso  = isoFromUnix(m.matchTime);
  const minute = m.extraExplain?.minute ?? 0;

  let statusCode = 'NS';
  if (m.status === -1) statusCode = 'FT';
  else if (m.status === 2) statusCode = 'HT';
  else if (m.status === 4) statusCode = 'ET';
  else if (m.status === 5) statusCode = 'PEN';
  else if (LIVE_STATUSES.has(m.status)) statusCode = 'LIVE';

  return {
    id:                        m.matchId,
    home_team:                 m.homeName,
    away_team:                 m.awayName,
    home_score:                m.homeScore,
    away_score:                m.awayScore,
    date:                      iso.split('T')[0],
    time:                      iso.split('T')[1]?.slice(0, 5) ?? '',
    stadium:                   m.location ?? 'TBD',
    city:                      '',
    minute,
    possession_home:           50,
    possession_away:           50,
    tactical_report_generated: false,
    round:                     m.round ?? '',
    group:                     m.group ?? '',
    status:                    statusCode,
    home_rank:                 m.homeRank ?? '',
    away_rank:                 m.awayRank ?? '',
    weather:                   m.weather ?? '',
    temperature:               m.temperature ?? '',
  };
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const lid    = ISPORTS_WORLD_CUP_LEAGUE_ID;

  try {
    if (status === 'live') {
      const matches = await getLiveMatches(lid);
      const live = matches.filter((m) => LIVE_STATUSES.has(m.status));
      return NextResponse.json({ matches: live.map(mapToPageMatch) });
    }

    if (status === 'completed') {
      const matches = await getCompletedMatches(lid);
      return NextResponse.json({ matches: matches.map(mapToPageMatch) });
    }

    // No param — today's live + schedule, plus recent results
    const today   = new Date().toISOString().split('T')[0];
    const [liveRes, scheduledRes, resultsRes] = await Promise.allSettled([
      getLiveMatches(lid),
      getMatchesByDate(today, lid),
      getCompletedMatches(lid),
    ]);

    const seen = new Set<string>();
    const all: ReturnType<typeof mapToPageMatch>[] = [];
    for (const r of [liveRes, scheduledRes, resultsRes]) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (!seen.has(m.matchId)) {
            seen.add(m.matchId);
            all.push(mapToPageMatch(m));
          }
        }
      }
    }

    return NextResponse.json({ matches: all });

  } catch (error) {
    console.error('iSports World Cup error:', error);
    return NextResponse.json(
      { matches: [], error: error instanceof Error ? error.message : 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
