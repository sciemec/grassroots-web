// src/lib/isports/client.ts

const API_BASE_URL = 'https://api.isportsapi.com/v1/football';
const API_KEY = process.env.NEXT_PUBLIC_ISPORTS_API_KEY || 'TH5aYbIbe2XhXb2G';

// ============================================
// TYPES
// ============================================
export interface iSportsTeam {
  id: string;
  name: string;
  logo?: string;
}

export interface iSportsMatch {
  id: string;
  home_team: iSportsTeam;
  away_team: iSportsTeam;
  home_score: number;
  away_score: number;
  status: 'first_half' | 'second_half' | 'finished' | 'not_started' | 'live';
  minute?: number;
  time_elapsed?: number;
  date: string;
  time: string;
  venue?: string;
  stadium?: string;
  city?: string;
  league_id?: string;
  league_name?: string;
  round?: string;
}

export interface iSportsApiResponse {
  status: string;
  message?: string;
  data?: {
    matches?: iSportsMatch[];
    match?: iSportsMatch;
    [key: string]: any;
  };
  matches?: iSportsMatch[];
  [key: string]: any;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function request(endpoint: string): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}&api_key=${API_KEY}`;
  console.log('iSports API Request:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('iSports API Response:', data);
    return data;
  } catch (error) {
    console.error('iSports API request failed:', error);
    throw error;
  }
}

function extractMatches(data: iSportsApiResponse): iSportsMatch[] {
  if (!data) return [];
  
  // Try different response structures
  if (data.data?.matches) {
    return data.data.matches;
  }
  if (data.matches) {
    return data.matches;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get live matches for a specific league
 * @param leagueId - League ID (default: '1' for FIFA World Cup)
 */
export async function getLiveMatches(leagueId: string = '1'): Promise<iSportsMatch[]> {
  try {
    const data = await request(`/matches/live?league_id=${leagueId}`);
    return extractMatches(data);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

/**
 * Get matches for a specific date
 * @param date - Date in YYYY-MM-DD format
 * @param leagueId - League ID (default: '1' for FIFA World Cup)
 */
export async function getMatchesByDate(date: string, leagueId: string = '1'): Promise<iSportsMatch[]> {
  try {
    const data = await request(`/matches/date?date=${date}&league_id=${leagueId}`);
    return extractMatches(data);
  } catch (error) {
    console.error('Error fetching matches by date:', error);
    return [];
  }
}

/**
 * Get match details by match ID
 * @param matchId - Match ID
 */
export async function getMatchDetails(matchId: string): Promise<iSportsMatch | null> {
  try {
    const data = await request(`/matches/details?id=${matchId}`);
    if (data?.data?.match) {
      return data.data.match;
    }
    return null;
  } catch (error) {
    console.error('Error fetching match details:', error);
    return null;
  }
}

/**
 * Get matches for a specific league
 * @param leagueId - League ID (default: '1' for FIFA World Cup)
 */
export async function getMatchesByLeague(leagueId: string = '1'): Promise<iSportsMatch[]> {
  try {
    const data = await request(`/matches/league?league_id=${leagueId}`);
    return extractMatches(data);
  } catch (error) {
    console.error('Error fetching league matches:', error);
    return [];
  }
}

/**
 * Get today's matches across all leagues
 */
export async function getTodayMatches(): Promise<iSportsMatch[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await getMatchesByDate(today);
  } catch (error) {
    console.error('Error fetching today\'s matches:', error);
    return [];
  }
}

/**
 * Get matches for a specific date range
 * @param fromDate - Start date in YYYY-MM-DD format
 * @param toDate - End date in YYYY-MM-DD format
 */
export async function getMatchesByDateRange(fromDate: string, toDate: string): Promise<iSportsMatch[]> {
  try {
    const data = await request(`/matches/range?from=${fromDate}&to=${toDate}`);
    return extractMatches(data);
  } catch (error) {
    console.error('Error fetching matches by date range:', error);
    return [];
  }
}

/**
 * Search for teams by name
 * @param query - Search query
 */
export async function searchTeams(query: string): Promise<any> {
  try {
    const data = await request(`/teams/search?q=${encodeURIComponent(query)}`);
    return data?.data?.teams || [];
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

/**
 * Get team details by team ID
 * @param teamId - Team ID
 */
export async function getTeamDetails(teamId: string): Promise<any> {
  try {
    const data = await request(`/teams/details?id=${teamId}`);
    return data?.data?.team || null;
  } catch (error) {
    console.error('Error fetching team details:', error);
    return null;
  }
}

// ============================================
// AVAILABLE LEAGUE IDs
// ============================================
export const LEAGUE_IDS = {
  WORLD_CUP: '1',
  PREMIER_LEAGUE: '2',
  LA_LIGA: '3',
  SERIE_A: '4',
  BUNDESLIGA: '5',
  LIGUE_1: '6',
  CHAMPIONS_LEAGUE: '7',
  EUROPA_LEAGUE: '8',
  WORLD_CUP_QUALIFIERS: '9',
  INTERNATIONAL_FRIENDLY: '10',
} as const;

export type LeagueId = typeof LEAGUE_IDS[keyof typeof LEAGUE_IDS];

// ============================================
// REACT HOOK (optional export)
// ============================================
/**
 * React hook to get live matches with auto-refresh
 * This can be imported separately if needed
 */
export function useISportsLive(leagueId: string = '1', refreshInterval: number = 30000) {
  // This is just for exporting the pattern - actual hook is in src/hooks/useLiveMatch.ts
  throw new Error('Please use src/hooks/useLiveMatch.ts instead');
}

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  getLiveMatches,
  getMatchesByDate,
  getMatchDetails,
  getMatchesByLeague,
  getTodayMatches,
  getMatchesByDateRange,
  searchTeams,
  getTeamDetails,
  LEAGUE_IDS,
};