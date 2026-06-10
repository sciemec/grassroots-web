// lib/live-scores.ts - NO MOCKS, REAL API ONLY

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

export interface RealMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: 'LIVE' | 'FINISHED' | 'SCHEDULED' | 'PAUSED';
  matchday: number;
  utcDate: string;
}

export interface RealEvent {
  id: number;
  minute: number;
  eventType: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  player: string;
  teamId: number;
}

export async function getRealLiveMatches(): Promise<RealMatch[]> {
  if (!API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY is not set. Get free key from football-data.org');
  }
  
  const response = await fetch(`${BASE_URL}/matches`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Filter ONLY real live matches (no mocks)
  return (data.matches ?? [])
    .filter((m: any) => m.status === 'LIVE' || m.status === 'IN_PLAY')
    .map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      minute: m.minute ?? 0,
      status: 'LIVE' as const,
      matchday: m.matchday,
      utcDate: m.utcDate
    }));
}

export async function getRealMatchEvents(matchId: number): Promise<RealEvent[]> {
  if (!API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY is not set');
  }
  
  const response = await fetch(`${BASE_URL}/matches/${matchId}/timeline`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return (data.events || [])
    .filter((e: any) => ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].includes(e.type))
    .map((e: any) => ({
      id: e.id,
      minute: e.minute,
      eventType: e.type,
      player: e.player?.name ?? 'Unknown',
      teamId: e.team?.id ?? 0
    }));
}

// Alias used by match detail route
export const fetchMatchEvents = getRealMatchEvents;