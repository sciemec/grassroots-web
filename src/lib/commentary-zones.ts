/**
 * commentary-zones.ts
 * Zone system for commentary-driven pitch visualisation.
 *
 * The pitch is divided into a 3×3 grid from the HOME team's perspective:
 *   top_*  = near the AWAY team's goal (home attacking third)
 *   mid_*  = midfield
 *   bot_*  = near the HOME team's goal (home defensive third)
 *   *_left / *_center / *_right = left / centre / right channels
 */

export type Zone =
  | "top_left"    | "top_center"    | "top_right"
  | "mid_left"    | "mid_center"    | "mid_right"
  | "bot_left"    | "bot_center"    | "bot_right";

/**
 * Default zone per position role (from the HOME team's perspective).
 * Derived from POS_XY coordinates in tactics/learn:
 *   y ≤ 50   → top third (attacking)
 *   50 < y ≤ 90 → mid third (midfield)
 *   y > 90   → bot third (defensive / GK)
 *   x ≤ 33   → left channel
 *   33 < x ≤ 66 → centre channel
 *   x > 66   → right channel
 */
export const ROLE_ZONE: Record<string, Zone> = {
  GK:  "bot_center",
  RB:  "bot_right",
  LB:  "bot_left",
  RWB: "mid_right",
  LWB: "mid_left",
  CB:  "bot_center",
  DM:  "mid_center",
  CM:  "mid_center",
  RM:  "mid_right",
  LM:  "mid_left",
  AM:  "top_center",
  RW:  "top_right",
  LW:  "top_left",
  ST:  "top_center",
  SS:  "top_center",
};

/** Mirror top ↔ bot (used for away team whose GK is at the top from home perspective). */
export function mirrorZone(z: Zone): Zone {
  if (z.startsWith("top_")) return z.replace("top_", "bot_") as Zone;
  if (z.startsWith("bot_")) return z.replace("bot_", "top_") as Zone;
  return z;
}

/** Map each zone to its [row, col] position in the 3×3 grid (0-indexed). */
export const ZONE_GRID: Record<Zone, [number, number]> = {
  top_left:   [0, 0],  top_center:  [0, 1],  top_right:  [0, 2],
  mid_left:   [1, 0],  mid_center:  [1, 1],  mid_right:  [1, 2],
  bot_left:   [2, 0],  bot_center:  [2, 1],  bot_right:  [2, 2],
};

/**
 * Per-formation role lists sourced from FORMATION_LIBRARY in thuto-tactics-knowledge.ts.
 * Used to derive formation-based default zones for Gemini.
 */
const FORMATION_ROLES: Record<string, string[]> = {
  "4-3-3":   ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  "4-4-2":   ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  "4-2-3-1": ["GK", "RB", "CB", "CB", "LB", "DM", "DM", "RM", "AM", "LM", "ST"],
  "3-5-2":   ["GK", "CB", "CB", "CB", "RWB", "CM", "CM", "CM", "LWB", "ST", "ST"],
  "5-3-2":   ["GK", "RWB", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "ST", "ST"],
};

export const SUPPORTED_FORMATIONS = Object.keys(FORMATION_ROLES);

/**
 * Build the formation zone text snippet injected into the Gemini prompt.
 * Lists each unique role + its default pitch zone for the given team.
 *
 * @param formation  e.g. "4-3-3"
 * @param team       Team display name (e.g. "Harare City")
 * @param isAway     true when generating for the away team
 */
export function buildFormationZoneText(
  formation: string,
  team: string,
  isAway: boolean,
): string {
  const roles = FORMATION_ROLES[formation];
  if (!roles) return "";

  const dir = isAway
    ? "attacks toward bot_* zones (from home perspective)"
    : "attacks toward top_* zones";

  const seen: Record<string, number> = {};
  const lines: string[] = [];

  for (const r of roles) {
    const count = roles.filter((x) => x === r).length;
    seen[r] = (seen[r] ?? 0) + 1;
    if (seen[r] === 1) {
      const baseZone = ROLE_ZONE[r] ?? "mid_center";
      const zone = isAway ? mirrorZone(baseZone) : baseZone;
      lines.push(`  - ${count > 1 ? `${r} ×${count}` : r}: ${zone}`);
    }
  }

  return `${team} (${formation}, ${dir}):\n${lines.join("\n")}`;
}
