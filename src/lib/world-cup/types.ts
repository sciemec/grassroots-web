// lib/world-cup/types.ts

export interface WorldCupPlayer {
  id: string;
  name: string;
  country: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  shirtNumber: number;
  age: number;
  height: number;
  weight: number;
}

export interface MatchStats {
  matchId: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'finished';
  minute: number;
}

export interface PlayerMatchPerformance {
  playerId: string;
  matchId: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesCompleted: number;
  passesAttempted: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  foulsCommitted: number;
  foulsSuffered: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  cleanSheet: boolean;
  rating: number;
}

export interface AggregatedPlayerStats {
  playerId: string;
  playerName: string;
  country: string;
  position: string;
  shirtNumber: number;
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  saves: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  performanceScore: number;
  lastUpdated: string;
}

export interface LeaderboardFilters {
  position?: 'GK' | 'DF' | 'MF' | 'FW' | 'ALL';
  country?: string;
  minMatches?: number;
  sortBy?: 'goals' | 'assists' | 'performanceScore' | 'avgRating';
  limit?: number;
}