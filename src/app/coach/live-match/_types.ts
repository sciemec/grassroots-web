export type EventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "sub"
  | "injury"
  | "shot_on_target"
  | "foul";

export interface MatchEvent {
  id: string;
  type: EventType;
  minute: number;
  player: string;
  team: "home" | "away";
}

export interface MatchSetup {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  formation: string;
}

export type MatchPhase = "setup" | "live" | "halftime" | "ended";
