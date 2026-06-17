// src/lib/isports/client.ts
const API_KEY = process.env.ISPORTS_API_KEY || 'TH5aYbIbe2XhXb2G';
const BASE_URL = 'https://api.isportsapi.com/sport/football';

if (!API_KEY) {
  console.warn('ISPORTS_API_KEY not set. Using fallback data.');
}

export interface ISportsMatch {
  id: string;
  home_team: { id: number; name: string };
  away_team: { id: number; name: string };
  home_score: number;
  away_score: number;
  status: 'not_started' | 'first_half' | 'halftime' | 'second_half' | 'finished';
  minute: number;
  date: string;
  time: string;
  venue: string;
  league_id: number;
  season_id: number;
}

export interface ISportsEvent {
  id: string;
  match_id: string;
  minute: number;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'shot' | 'corner' | 'offside' | 'foul';
  team_id: number;
  team_name: string;
  player_name?: string;
  assist_player_name?: string;
  coordinate_x?: number;  // 0-100 pitch coordinate
  coordinate_y?: number;  // 0-100 pitch coordinate
  description: string;
}

export interface ISportsLineup {
  match_id: string;
  team_id: number;
  team_name: string;
  formation: string;
  starting_xi: Array<{
    player_id: number;
    player_name: string;
    player_number: number;
    position: string;
    coordinate_x?: number;
    coordinate_y?: number;
  }>;
}

export interface ISportsStatistics {
  match_id: string;
  home: {
    possession: number;
    shots: number;
    shots_on_target: number;
    passes: number;
    pass_accuracy: number;
    fouls: number;
    corners: number;
    offsides: number;
  };
  away: {
    possession: number;
    shots: number;
    shots_on_target: number;
    passes: number;
    pass_accuracy: number;
    fouls: number;
    corners: number;
    offsides: number;
  };
}

// Fetch live matches
export async function fetchLiveMatches(): Promise<ISportsMatch[]> {
  if (!API_KEY) {
    console.warn('ISPORTS_API_KEY not set');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/livescores?api_key=${API_KEY}&include=league`,
      { next: { revalidate: 10 } }
    );

    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`iSports API error: ${data.message}`);
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

// Fetch match events with cmd=new to get only new events
export async function fetchMatchEvents(matchId: string, lastEventId?: string): Promise<ISportsEvent[]> {
  if (!API_KEY) return [];

  try {
    const url = `${BASE_URL}/events?api_key=${API_KEY}&match_id=${matchId}${lastEventId ? `&cmd=new` : ''}`;
    const response = await fetch(url, { next: { revalidate: 5 } });

    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`iSports API error: ${data.message}`);
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching match events:', error);
    return [];
  }
}

// Fetch match lineups
export async function fetchMatchLineups(matchId: string): Promise<ISportsLineup[]> {
  if (!API_KEY) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/lineups?api_key=${API_KEY}&match_id=${matchId}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`iSports API error: ${data.message}`);
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching lineups:', error);
    return [];
  }
}

// Fetch match statistics
export async function fetchMatchStatistics(matchId: string): Promise<ISportsStatistics | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/statistics/match?api_key=${API_KEY}&match_id=${matchId}`,
      { next: { revalidate: 10 } }
    );

    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`iSports API error: ${data.message}`);
    }

    return data.data || null;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return null;
  }
}

// Fetch schedule for today
export async function fetchTodaySchedule(): Promise<ISportsMatch[]> {
  if (!API_KEY) return [];

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(
      `${BASE_URL}/schedule/basic?api_key=${API_KEY}&date=${today}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`iSports API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.code !== 0) {
      throw new Error(`iSports API error: ${data.message}`);
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}