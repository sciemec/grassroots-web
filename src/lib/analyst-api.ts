import api from "./api";

export interface AnalystMatchEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type: "shot" | "pass" | "press" | "set_piece" | "substitution";
  zoneId?: string;
  xg?: number;
  isGoal?: boolean;
  completed?: boolean;
  setPieceType?: "corner" | "free_kick" | "throw_in";
  location?: "left" | "centre" | "right";
  outcome?: "goal" | "shot_on" | "cleared" | "wasted";
  reason?: "tactical" | "injury" | "fatigue";
}

export interface PossessionBlock {
  team: "home" | "away";
  startMinute: number;
}

export interface AnalystMatchStats {
  home_goals: number;
  away_goals: number;
  home_xg: number;
  away_xg: number;
  home_shots: number;
  away_shots: number;
  total_events: number;
}

export interface AnalystMatch {
  id: string;
  home_team: string;
  away_team: string;
  sport: string;
  match_date: string;
  events: AnalystMatchEvent[];
  possession_log: PossessionBlock[];
  elapsed: number;
  phase: "live" | "ended";
  stats: AnalystMatchStats;
  created_at: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function listMatches(): Promise<AnalystMatch[]> {
  const res = await api.get<{ data: AnalystMatch[] }>("/analyst/matches");
  return res.data.data ?? [];
}

export async function saveMatch(payload: {
  home_team: string;
  away_team: string;
  sport: string;
  events: AnalystMatchEvent[];
  possession_log: PossessionBlock[];
  elapsed: number;
  phase: "live" | "ended";
}): Promise<AnalystMatch> {
  const res = await api.post<{ data: AnalystMatch }>("/analyst/matches", payload);
  return res.data.data;
}

export async function getMatch(id: string): Promise<AnalystMatch> {
  const res = await api.get<{ data: AnalystMatch }>(`/analyst/matches/${id}`);
  return res.data.data;
}

export async function deleteMatch(id: string): Promise<void> {
  await api.delete(`/analyst/matches/${id}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calculate possession % from a possession log */
export function calcPossessionFromLog(
  log: PossessionBlock[],
  elapsedSeconds: number
): { home: number; away: number } {
  if (log.length === 0) return { home: 50, away: 50 };
  const currentMinute = Math.max(1, Math.floor(elapsedSeconds / 60) + 1);
  let homeMin = 0, awayMin = 0;
  log.forEach((block, i) => {
    const end = i < log.length - 1 ? log[i + 1].startMinute : currentMinute;
    const dur = Math.max(0, end - block.startMinute);
    if (block.team === "home") homeMin += dur; else awayMin += dur;
  });
  const total = homeMin + awayMin;
  if (total === 0) return { home: 50, away: 50 };
  return {
    home: Math.round((homeMin / total) * 100),
    away: Math.round((awayMin / total) * 100),
  };
}

/** Zone ID → label map (mirrors live-match XG_ZONES) */
export const ZONE_LABELS: Record<string, string> = {
  six_yard:        "Six-Yard Box",
  wide_box_left:   "Wide Box (L)",
  penalty_spot:    "Penalty Spot",
  wide_box_right:  "Wide Box (R)",
  central_box:     "Central Box",
  edge_wide_left:  "Edge (L)",
  edge_centre:     "Edge (Centre)",
  edge_wide_right: "Edge (R)",
  long_range:      "Long Range",
};

/** Zone ID → xG value */
export const ZONE_XG: Record<string, number> = {
  six_yard:        0.76,
  wide_box_left:   0.12,
  penalty_spot:    0.45,
  wide_box_right:  0.12,
  central_box:     0.35,
  edge_wide_left:  0.07,
  edge_centre:     0.18,
  edge_wide_right: 0.07,
  long_range:      0.04,
};

/** Convert live match shot events into the Shot format used by xg-analysis */
export interface XgShot {
  id: string;
  team: "home" | "away";
  zone: string;
  xg: number;
  minute: number;
  isGoal: boolean;
}

export function extractShots(events: AnalystMatchEvent[]): XgShot[] {
  return events
    .filter((e) => e.type === "shot")
    .map((e) => ({
      id: e.id,
      team: e.team,
      zone: ZONE_LABELS[e.zoneId ?? ""] ?? e.zoneId ?? "Unknown",
      xg: e.xg ?? ZONE_XG[e.zoneId ?? ""] ?? 0,
      minute: e.minute,
      isGoal: e.isGoal ?? false,
    }));
}
