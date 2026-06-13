// src/lib/isports/client.ts
// iSports API client — lazy API key check (no module-level throw)

import type { ISportsMatch, ISportsEvent, ISportsLineup, ISportsStatistics } from './types';

const API_BASE = 'http://api.isportsapi.com/sport/football';

function getKey(): string {
  const key = process.env.ISPORTS_API_KEY;
  if (!key) throw new Error('ISPORTS_API_KEY is required. Get it from iSports dashboard.');
  return key;
}

interface ISportsResponse<T> {
  code: number;      // 0 = success, non-zero = error
  message: string;
  data: T;
}

async function isportsGet<T>(path: string, revalidate: number): Promise<T> {
  const url = `${API_BASE}${path}&api_key=${getKey()}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`iSports API error: ${res.status}`);
  const json: ISportsResponse<T> = await res.json();
  if (json.code !== 0) throw new Error(`iSports API error: ${json.message}`);
  return json.data;
}

export async function fetchLiveMatch(matchId: string): Promise<ISportsMatch> {
  return isportsGet<ISportsMatch>(`/livescores?match_id=${matchId}`, 5);
}

export async function fetchMatchEvents(matchId: string, lastEventId?: string): Promise<ISportsEvent[]> {
  const cmd = lastEventId ? 'new' : 'all';
  return isportsGet<ISportsEvent[]>(`/events?match_id=${matchId}&cmd=${cmd}`, 3);
}

export async function fetchMatchLineups(matchId: string): Promise<ISportsLineup> {
  return isportsGet<ISportsLineup>(`/lineups?match_id=${matchId}`, 60);
}

export async function fetchMatchStatistics(matchId: string): Promise<ISportsStatistics> {
  return isportsGet<ISportsStatistics>(`/statistics/match?match_id=${matchId}`, 10);
}
