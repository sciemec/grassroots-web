// lib/world-cup/data-provider.ts
// REAL integration with sports data API (Sportmonks, iSports, etc.)

import type { MatchStats, PlayerMatchPerformance, WorldCupPlayer } from './types';

const API_KEY = process.env.SPORTS_DATA_API_KEY;
const API_BASE_URL = process.env.SPORTS_DATA_BASE_URL || 'https://api.sportmonks.com/v3/football';

export interface RawMatchResponse {
  id: number;
  name: string;
  starting_at: string;
  status: string;
  league_id: number;
  season_id: number;
  round_id: number;
  weather_report: any;
  participants: Array<{
    id: number;
    name: string;
    meta: {
      location: 'home' | 'away';
      goals: number;
    };
  }>;
  scores: {
    localteam_score: number;
    awayteam_score: number;
    ht_score: string;
    ft_score: string;
  };
  statistics: Array<{
    type: string;
    data: {
      localteam: any;
      awayteam: any;
    };
  }>;
}

export interface RawPlayerStats {
  player_id: number;
  player_name: string;
  team_id: number;
  team_name: string;
  position: string;
  jersey_number: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes: number;
  accurate_passes: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
  rating: number;
  minutes_played: number;
}

// Fetch all World Cup matches
export async function fetchWorldCupMatches(): Promise<MatchStats[]> {
  const response = await fetch(
    `${API_BASE_URL}/fixtures/between/2026-06-11/2026-07-19?include=localTeam,visitorTeam&api_token=${API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Filter only World Cup matches
  const worldCupMatches = data.data.filter((match: any) => 
    match.league_id === 1 // World Cup league ID - replace with actual
  );
  
  return worldCupMatches.map((match: any) => ({
    matchId: match.id.toString(),
    matchDate: match.starting_at,
    homeTeam: match.localTeam.data.name,
    awayTeam: match.visitorTeam.data.name,
    homeScore: match.scores.localteam_score,
    awayScore: match.scores.awayteam_score,
    status: match.status === 'finished' ? 'finished' : match.status === 'inprogress' ? 'live' : 'scheduled',
    minute: match.time?.minute || 0
  }));
}

// Fetch all players in a match with their statistics
export async function fetchMatchPlayerStats(matchId: string): Promise<PlayerMatchPerformance[]> {
  const response = await fetch(
    `${API_BASE_URL}/fixtures/${matchId}/statistics?include=playerstats.player&api_token=${API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  const players: PlayerMatchPerformance[] = [];
  
  // Extract player statistics from both teams
  for (const teamStat of data.data) {
    if (teamStat.playerstats && teamStat.playerstats.data) {
      for (const playerStat of teamStat.playerstats.data) {
        players.push({
          playerId: playerStat.player_id.toString(),
          matchId: matchId,
          minutesPlayed: playerStat.minutes_played || 0,
          goals: playerStat.goals || 0,
          assists: playerStat.assists || 0,
          shots: playerStat.shots_total || 0,
          shotsOnTarget: playerStat.shots_on_target || 0,
          passesCompleted: playerStat.passes_accurate || 0,
          passesAttempted: playerStat.passes_total || 0,
          tackles: playerStat.tackles_total || 0,
          interceptions: playerStat.interceptions || 0,
          clearances: playerStat.clearances || 0,
          foulsCommitted: playerStat.fouls_committed || 0,
          foulsSuffered: playerStat.fouls_suffered || 0,
          yellowCards: playerStat.yellow_cards || 0,
          redCards: playerStat.red_cards || 0,
          saves: playerStat.saves || 0,
          cleanSheet: playerStat.clean_sheet || false,
          rating: playerStat.rating || 0
        });
      }
    }
  }
  
  return players;
}

// Fetch player information
export async function fetchPlayerInfo(playerId: string): Promise<WorldCupPlayer | null> {
  const response = await fetch(
    `${API_BASE_URL}/players/${playerId}?api_token=${API_KEY}`
  );
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  const player = data.data;
  
  return {
    id: player.id.toString(),
    name: player.fullname,
    country: player.country?.name || 'Unknown',
    position: mapPosition(player.position?.name || 'Midfielder'),
    shirtNumber: player.jersey_number || 0,
    age: player.age || 0,
    height: player.height || 0,
    weight: player.weight || 0
  };
}

// Helper: Map position to standard categories
function mapPosition(position: string): 'GK' | 'DF' | 'MF' | 'FW' {
  const pos = position.toLowerCase();
  if (pos.includes('goalkeeper')) return 'GK';
  if (pos.includes('defender')) return 'DF';
  if (pos.includes('forward') || pos.includes('striker')) return 'FW';
  return 'MF';
}