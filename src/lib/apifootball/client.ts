// src/lib/apifootball/client.ts
// API-Football v3 (api-sports.io) — free tier: 100 requests/day
// Docs: https://www.api-football.com/documentation-v3

const API_BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY ?? '';

// ============================================
// TYPES
// ============================================

export interface AFFixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface AFTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface AFVenue {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface AFFixture {
  id: number;
  date: string;
  timezone: string;
  venue: AFVenue;
  status: AFFixtureStatus;
}

export interface AFLeague {
  id: number;
  name: string;
  round: string;
  season: number;
}

export interface AFGoals {
  home: number | null;
  away: number | null;
}

export interface AFMatch {
  fixture: AFFixture;
  league: AFLeague;
  teams: {
    home: AFTeam;
    away: AFTeam;
  };
  goals: AFGoals;
}

export interface AFResponse {
  response: AFMatch[];
  errors: string[] | Record<string, string>;
  results: number;
}

// Live = actively playing
const LIVE_STATUSES = new Set(['1H', '2H', 'ET', 'P', 'HT', 'BT', 'LIVE']);
// Finished = full time or equivalent
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

// ============================================
// HELPERS
// ============================================

async function request(endpoint: string): Promise<AFResponse> {
  if (!API_KEY) {
    throw new Error('API_FOOTBALL_KEY is not set');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': API_KEY,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<AFResponse>;
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/** Live World Cup matches currently in progress */
export async function getLiveMatches(leagueId: number, season: number): Promise<AFMatch[]> {
  try {
    const data = await request(`/fixtures?live=all&league=${leagueId}&season=${season}`);
    return (data.response ?? []).filter(m => LIVE_STATUSES.has(m.fixture.status.short));
  } catch (error) {
    console.error('API-Football getLiveMatches error:', error);
    return [];
  }
}

/** All fixtures for a league/season on a given date (YYYY-MM-DD) */
export async function getMatchesByDate(date: string, leagueId: number, season: number): Promise<AFMatch[]> {
  try {
    const data = await request(`/fixtures?date=${date}&league=${leagueId}&season=${season}`);
    return data.response ?? [];
  } catch (error) {
    console.error('API-Football getMatchesByDate error:', error);
    return [];
  }
}

/** All fixtures for a league/season — useful for completed matches */
export async function getAllFixtures(leagueId: number, season: number): Promise<AFMatch[]> {
  try {
    const data = await request(`/fixtures?league=${leagueId}&season=${season}`);
    return data.response ?? [];
  } catch (error) {
    console.error('API-Football getAllFixtures error:', error);
    return [];
  }
}

/** Completed (full-time) fixtures for a league/season */
export async function getCompletedMatches(leagueId: number, season: number): Promise<AFMatch[]> {
  try {
    const data = await request(`/fixtures?league=${leagueId}&season=${season}&status=FT`);
    return data.response ?? [];
  } catch (error) {
    console.error('API-Football getCompletedMatches error:', error);
    return [];
  }
}

export { LIVE_STATUSES, FINISHED_STATUSES };

// ============================================
// CONSTANTS
// ============================================

export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;
