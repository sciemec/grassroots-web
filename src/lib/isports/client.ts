// src/lib/isports/client.ts
// Correct base URL: http://api.isportsapi.com/sport/football
// Auth: ?api_key=KEY (query param, not header)

const API_BASE_URL = 'http://api.isportsapi.com/sport/football';
const API_KEY = process.env.ISPORTS_API_KEY || process.env.NEXT_PUBLIC_ISPORTS_API_KEY || 'UxvtgcXSXEP2Qzy1';

// World Cup 2026 league ID on iSports
export const ISPORTS_WORLD_CUP_LEAGUE_ID = '1572';

// ============================================
// TYPES  (reflect the actual iSports response)
// ============================================
export interface iSportsMatch {
  matchId: string;
  leagueId: string;
  leagueName: string;
  leagueShortName?: string;
  matchTime: number;        // Unix timestamp
  halfStartTime?: number;
  status: number;           // -1=FT, 0=NS, 1=1H, 2=HT, 3=2H, 4=ET, 5=PEN
  homeId: string;
  homeName: string;
  awayId: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  homeHalfScore?: number;
  awayHalfScore?: number;
  homeRed?: number;
  awayRed?: number;
  homeYellow?: number;
  awayYellow?: number;
  homeCorner?: number;
  awayCorner?: number;
  homeRank?: string;
  awayRank?: string;
  season?: string;
  round?: string;
  group?: string;
  location?: string;
  weather?: string;
  temperature?: string;
  extraExplain?: {
    minute?: number;
    homeScore?: number;
    awayScore?: number;
    kickOff?: number;
  };
}

export interface iSportsApiResponse {
  code: number;
  message: string;
  data: iSportsMatch[] | null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function request(endpoint: string): Promise<iSportsApiResponse> {
  // Append api_key correctly regardless of whether endpoint already has ?
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${API_BASE_URL}${endpoint}${sep}api_key=${API_KEY}`;
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
  if (!data || data.code !== 0) return [];
  if (Array.isArray(data.data)) return data.data;
  return [];
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/** Live/in-progress matches. Optionally filter by league. */
export async function getLiveMatches(leagueId?: string): Promise<iSportsMatch[]> {
  try {
    const q = leagueId ? `?league_id=${leagueId}` : '';
    const data = await request(`/livescores${q}`);
    return extractMatches(data);
  } catch (error) {
    console.error('iSports getLiveMatches error:', error);
    return [];
  }
}

/** Completed/results. Optionally filter by league and/or date (YYYY-MM-DD). */
export async function getCompletedMatches(leagueId?: string, date?: string): Promise<iSportsMatch[]> {
  try {
    const params = new URLSearchParams();
    if (leagueId) params.set('league_id', leagueId);
    if (date)     params.set('date', date);
    const q = params.size ? `?${params}` : '';
    const data = await request(`/results${q}`);
    const all = extractMatches(data);
    return all.filter((m) => m.status === -1);
  } catch (error) {
    console.error('iSports getCompletedMatches error:', error);
    return [];
  }
}

/** Scheduled (not started) matches for a date. */
export async function getMatchesByDate(date: string, leagueId?: string): Promise<iSportsMatch[]> {
  try {
    let q = `?date=${date}`;
    if (leagueId) q += `&league_id=${leagueId}`;
    const data = await request(`/schedule${q}`);
    return extractMatches(data);
  } catch (error) {
    console.error('iSports getMatchesByDate error:', error);
    return [];
  }
}

/** All matches (live + scheduled + recent results) for a league. */
export async function getMatchesByLeague(leagueId: string): Promise<iSportsMatch[]> {
  try {
    const [live, results] = await Promise.allSettled([
      getLiveMatches(leagueId),
      getCompletedMatches(leagueId),
    ]);
    return [
      ...(live.status === 'fulfilled' ? live.value : []),
      ...(results.status === 'fulfilled' ? results.value : []),
    ];
  } catch (error) {
    console.error('iSports getMatchesByLeague error:', error);
    return [];
  }
}

// iSports league IDs (corrected from live API data)
export const LEAGUE_IDS = {
  WORLD_CUP_2026: '1572',
} as const;