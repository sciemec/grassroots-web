// src/lib/isports/client.ts
// REAL iSports API - no mock data

const API_BASE = 'http://api.isportsapi.com/sport/football';
const API_KEY = process.env.ISPORTS_API_KEY;

if (!API_KEY) {
  throw new Error('ISPORTS_API_KEY is required. Get it from iSports dashboard.');
}

interface ISportsResponse<T> {
  code: number;      // 0 = success, non-zero = error
  message: string;
  data: T;
}

export async function fetchLiveMatch(matchId: string) {
  const url = `${API_BASE}/livescores?api_key=${API_KEY}&match_id=${matchId}`;
  const res = await fetch(url, { next: { revalidate: 5 } });
  
  if (!res.ok) {
    throw new Error(`iSports API error: ${res.status}`);
  }
  
  const json: ISportsResponse<any> = await res.json();
  
  if (json.code !== 0) {
    throw new Error(`iSports API error: ${json.message}`);
  }
  
  return json.data;
}

export async function fetchMatchEvents(matchId: string, lastEventId?: string) {
  // Use cmd=new to get only NEW events (no duplicates)
  const url = `${API_BASE}/events?api_key=${API_KEY}&match_id=${matchId}&cmd=${lastEventId ? 'new' : 'all'}`;
  const res = await fetch(url, { next: { revalidate: 3 } });
  
  if (!res.ok) {
    throw new Error(`iSports API error: ${res.status}`);
  }
  
  const json: ISportsResponse<any> = await res.json();
  
  if (json.code !== 0) {
    throw new Error(`iSports API error: ${json.message}`);
  }
  
  return json.data;
}

export async function fetchMatchLineups(matchId: string) {
  const url = `${API_BASE}/lineups?api_key=${API_KEY}&match_id=${matchId}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  
  if (!res.ok) {
    throw new Error(`iSports API error: ${res.status}`);
  }
  
  const json: ISportsResponse<any> = await res.json();
  
  if (json.code !== 0) {
    throw new Error(`iSports API error: ${json.message}`);
  }
  
  return json.data;
}

export async function fetchMatchStatistics(matchId: string) {
  const url = `${API_BASE}/statistics/match?api_key=${API_KEY}&match_id=${matchId}`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  
  if (!res.ok) {
    throw new Error(`iSports API error: ${res.status}`);
  }
  
  const json: ISportsResponse<any> = await res.json();
  
  if (json.code !== 0) {
    throw new Error(`iSports API error: ${json.message}`);
  }
  
  return json.data;
}