// src/lib/isports/types.ts
// Based on iSports API documentation - no mocks

export interface ISportsMatch {
  match_id: string;
  sport_id: number;
  league_id: number;
  league_name: string;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  home_red_card: number;
  away_red_card: number;
  home_yellow_card: number;
  away_yellow_card: number;
  match_time: string;        // Unix timestamp
  match_status: '1' | '2' | '3';  // 1=not started, 2=in progress, 3=finished
  match_period: '1H' | '2H' | 'HT' | 'ET' | 'PEN';
  match_minute: number;
  has_lineups: '0' | '1';
  has_statistics: '0' | '1';
  has_events: '0' | '1';
}

export interface ISportsEvent {
  event_id: string;
  match_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'corner' | 'offside' | 'foul';
  event_minute: number;
  event_extra_minute?: number;
  team_id: number;
  team_name: string;
  player_id?: number;
  player_name?: string;
  assist_player_id?: number;
  assist_player_name?: string;
  event_coordinate_x?: number;  // 0-100 pitch coordinate
  event_coordinate_y?: number;  // 0-100 pitch coordinate
  event_description: string;
}

export interface ISportsLineup {
  match_id: string;
  team_id: number;
  team_name: string;
  coach_name: string;
  formation: string;
  starting_xi: Array<{
    player_id: number;
    player_name: string;
    player_number: number;
    position: string;
    coordinate_x: number;  // 0-100 pitch coordinate
    coordinate_y: number;  // 0-100 pitch coordinate
  }>;
  substitutes: Array<{
    player_id: number;
    player_name: string;
    player_number: number;
  }>;
}

export interface ISportsStatistics {
  match_id: string;
  home: {
    possession: number;     // percentage
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