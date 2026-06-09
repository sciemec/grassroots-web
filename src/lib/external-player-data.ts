// lib/external-player-data.ts
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

export interface ExternalPlayer {
  id: number;
  name: string;
  position: 'Goalkeeper' | 'Defence' | 'Midfield' | 'Offence';
  shirtNumber: number;
  // Performance metrics (from external API)
  goalsThisSeason?: number;
  assistsThisSeason?: number;
  yellowCards?: number;
  rating?: number; // 0-10 match rating
}

export async function getMatchLineup(matchId: number): Promise<{
  home: ExternalPlayer[];
  away: ExternalPlayer[];
}> {
  const res = await fetch(`${BASE_URL}/matches/${matchId}/lineups`, {
    headers: { 'X-Auth-Token': FOOTBALL_API_KEY! }
  });
  const data = await res.json();
  
  const home = data.home.players.map((p: any) => ({
    id: p.player.id,
    name: p.player.name,
    position: p.position,
    shirtNumber: p.shirtNumber,
  }));
  const away = data.away.players.map((p: any) => ({
    id: p.player.id,
    name: p.player.name,
    position: p.position,
    shirtNumber: p.shirtNumber,
  }));
  
  return { home, away };
}

// Get player performance from external stats API (e.g., API-Football)
export async function getPlayerPerformance(playerId: number): Promise<{
  goals: number;
  assists: number;
  cards: number;
  rating: number;
}> {
  // Use RapidAPI football API (example)
  const url = `https://api-football-v1.p.rapidapi.com/v3/players?id=${playerId}&season=2026`;
  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  });
  const data = await res.json();
  const stats = data.response[0].statistics[0];
  return {
    goals: stats.goals.total ?? 0,
    assists: stats.goals.assists ?? 0,
    cards: (stats.discipline.yellow ?? 0) + (stats.discipline.red ?? 0),
    rating: parseFloat(stats.games.rating ?? 0)
  };
}