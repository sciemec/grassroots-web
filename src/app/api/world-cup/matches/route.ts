// app/api/world-cup/matches/route.ts
// Feeds the /worldcup page with live and completed World Cup matches from API-Football v3.
//
// ?status=live      → returns in-progress matches (score + minute)
// ?status=completed → returns finished matches
// No status param   → returns all matches for today's date
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  getLiveMatches,
  getMatchesByDate,
  getCompletedMatches,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  type AFMatch,
} from '@/lib/apifootball/client';

function mapToPageMatch(m: AFMatch) {
  return {
    id:                        String(m.fixture.id),
    home_team:                 m.teams.home.name,
    away_team:                 m.teams.away.name,
    home_score:                m.goals.home ?? 0,
    away_score:                m.goals.away ?? 0,
    date:                      m.fixture.date.split('T')[0],
    time:                      m.fixture.date.split('T')[1]?.slice(0, 5) ?? '',
    stadium:                   m.fixture.venue.name ?? 'TBD',
    city:                      m.fixture.venue.city ?? 'TBD',
    minute:                    m.fixture.status.elapsed ?? 0,
    possession_home:           50,
    possession_away:           50,
    tactical_report_generated: false,
    round:                     m.league.round ?? '',
    status:                    m.fixture.status.short,
  };
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');

  try {
    if (status === 'live') {
      const matches = await getLiveMatches(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);
      return NextResponse.json({ matches: matches.map(mapToPageMatch) });
    }

    if (status === 'completed') {
      const matches = await getCompletedMatches(WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);
      return NextResponse.json({ matches: matches.map(mapToPageMatch) });
    }

    // No status param — today's matches
    const today = new Date().toISOString().split('T')[0];
    const matches = await getMatchesByDate(today, WORLD_CUP_LEAGUE_ID, WORLD_CUP_SEASON);
    return NextResponse.json({ matches: matches.map(mapToPageMatch) });

  } catch (error) {
    console.error('API-Football error:', error);
    return NextResponse.json(
      { matches: [], error: error instanceof Error ? error.message : 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
