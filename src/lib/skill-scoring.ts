/**
 * skill-scoring.ts
 * Position-weighted skill scoring engine for all GrassRoots sports.
 * Used by /player/assessment to calculate overall skill score and radar chart data.
 */

// ── Position weight maps ──────────────────────────────────────────────────────

export const POSITION_WEIGHTS: Record<string, Record<string, Record<string, number>>> = {
  football: {
    striker:    { pace: 0.25, finishing: 0.30, heading: 0.15, dribbling: 0.20, positioning: 0.10 },
    forward:    { pace: 0.25, finishing: 0.30, heading: 0.15, dribbling: 0.20, positioning: 0.10 },
    midfielder: { passing: 0.30, vision: 0.25, stamina: 0.20, dribbling: 0.15, tackling: 0.10 },
    defender:   { tackling: 0.30, heading: 0.25, positioning: 0.25, pace: 0.10, passing: 0.10 },
    goalkeeper: { reflexes: 0.30, positioning: 0.25, distribution: 0.20, handling: 0.15, communication: 0.10 },
  },
  netball: {
    shooter:    { accuracy: 0.40, movement: 0.20, court_sense: 0.20, strength: 0.20 },
    defender:   { intercepts: 0.35, footwork: 0.30, anticipation: 0.25, strength: 0.10 },
    midcourt:   { fitness: 0.35, passing: 0.30, court_sense: 0.25, intercepts: 0.10 },
  },
  rugby: {
    forward:    { tackling: 0.30, strength: 0.30, carries: 0.20, fitness: 0.20 },
    back:       { pace: 0.30, handling: 0.25, kicking: 0.25, agility: 0.20 },
  },
  athletics: {
    sprinter:   { pace: 0.50, reaction_time: 0.25, technique: 0.25 },
    distance:   { stamina: 0.50, pace: 0.30, technique: 0.20 },
  },
  basketball: {
    guard:      { passing: 0.25, dribbling: 0.25, pace: 0.25, shooting: 0.25 },
    forward:    { finishing: 0.30, strength: 0.30, pace: 0.20, rebounding: 0.20 },
    center:     { strength: 0.35, rebounding: 0.35, positioning: 0.30 },
  },
};

// ── Human-readable attribute labels ──────────────────────────────────────────

export const ATTRIBUTE_LABELS: Record<string, string> = {
  pace: "Pace", finishing: "Finishing", heading: "Heading", dribbling: "Dribbling",
  positioning: "Positioning", passing: "Passing", vision: "Vision", stamina: "Stamina",
  tackling: "Tackling", reflexes: "Reflexes", distribution: "Distribution",
  handling: "Handling", communication: "Comm.", accuracy: "Accuracy",
  movement: "Movement", court_sense: "Court Sense", strength: "Strength",
  intercepts: "Intercepts", footwork: "Footwork", anticipation: "Anticipation",
  fitness: "Fitness", carries: "Carries", kicking: "Kicking", agility: "Agility",
  reaction_time: "Reaction", technique: "Technique", shooting: "Shooting",
  rebounding: "Rebounding",
};

// ── Core functions ────────────────────────────────────────────────────────────

function genericScore(attributes: Record<string, number>): number {
  const vals = Object.values(attributes);
  if (!vals.length) return 50;
  return Math.min(100, Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10));
}

/** Returns an overall skill score 0–100 for a given position + sport. */
export function calculateSkillScore(
  attributes: Record<string, number>,
  position: string,
  sport = "football",
): number {
  const weights = POSITION_WEIGHTS[sport.toLowerCase()]?.[position.toLowerCase()];
  if (!weights) return genericScore(attributes);
  const total = Object.entries(weights).reduce(
    (sum, [attr, w]) => sum + (attributes[attr] ?? 5) * w,
    0,
  );
  return Math.min(100, Math.round(total * 10));
}

/** Returns the list of key attributes for a given position + sport. */
export function getPositionAttributes(position: string, sport = "football"): string[] {
  return Object.keys(POSITION_WEIGHTS[sport.toLowerCase()]?.[position.toLowerCase()] ?? {});
}

/**
 * Converts raw attributes (1–10 scale) into recharts-compatible radar data.
 * Falls back to showing all provided attributes if position is unknown.
 */
export function getRadarData(
  attributes: Record<string, number>,
  position: string,
  sport = "football",
): { attribute: string; value: number; fullMark: number }[] {
  const attrs = getPositionAttributes(position, sport);
  const keys = attrs.length ? attrs : Object.keys(attributes);
  return keys.map((k) => ({
    attribute: ATTRIBUTE_LABELS[k] ?? k,
    value:     Math.round((attributes[k] ?? 5) * 10),
    fullMark:  100,
  }));
}

/**
 * Calculates how well a test result compares to the benchmark (0–100 scale).
 * For time-based tests (unit === "seconds") lower is better.
 */
export function calcBenchmarkScore(
  benchmark: string,
  result: string,
  unit: string,
): number {
  const numResult = parseFloat(result);
  const numBench  = parseFloat(benchmark);
  if (isNaN(numResult) || isNaN(numBench) || numBench === 0) return 50;

  const ratio = unit === "seconds"
    ? numBench / numResult          // lower time = better score
    : numResult / numBench;         // higher value = better score

  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}
