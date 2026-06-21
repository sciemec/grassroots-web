// src/lib/tactical-iq/tactical-iq-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// Tactical IQ scoring — deliberately separate from grs-engine.ts.
//
// WHY SEPARATE AND NOT MERGED INTO AQ:
//   AQ measures physical athletic ability (jump, sprint, balance, etc).
//   Tactical IQ measures decision-making and game understanding.
//   A scout needs both signals independently — a technically average player
//   with elite game-reading is a real prospect; conflating the two scores
//   would hide that. They appear side-by-side on the Talent Passport, never
//   combined into one number.
//
// Reuses the same SHAPE as grs-engine (0-100 score, rank, tier) for UI
// consistency, but is a fully independent calculation with its own data.
// ─────────────────────────────────────────────────────────────────────────────

export interface QuizAnswer {
  quizMomentId:  string;
  matchId:       string;
  chosenOptionId: string;
  wasOptimal:    boolean;
  answeredAt:    string;
}

export interface TacticalIQResult {
  score:           number;        // 0-100, % of all-time quiz answers that were optimal
  totalAnswered:   number;
  totalOptimal:    number;
  tier:            'Novice' | 'Developing' | 'Sharp' | 'Elite';
  recentTrend:     'improving' | 'stable' | 'declining' | null;
  strongestZone:   'defensive_third' | 'middle_third' | 'attacking_third' | null;
  weakestZone:     'defensive_third' | 'middle_third' | 'attacking_third' | null;
}

// ── Main scoring function ────────────────────────────────────────────────────
export function calculateTacticalIQ(
  allAnswers: (QuizAnswer & { zone?: string })[],
): TacticalIQResult {
  if (allAnswers.length === 0) {
    return {
      score: 0, totalAnswered: 0, totalOptimal: 0,
      tier: 'Novice', recentTrend: null,
      strongestZone: null, weakestZone: null,
    };
  }

  const totalOptimal = allAnswers.filter(a => a.wasOptimal).length;
  const score = Math.round((totalOptimal / allAnswers.length) * 100);

  // Trend: compare last 10 answers to the 10 before that
  const sorted = [...allAnswers].sort(
    (a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime()
  );
  const recentTrend = calculateTrend(sorted);

  // Zone breakdown — which phase of play does this player read best/worst
  const { strongestZone, weakestZone } = calculateZoneBreakdown(
    allAnswers.filter((a): a is QuizAnswer & { zone: string } => !!a.zone)
  );

  return {
    score,
    totalAnswered: allAnswers.length,
    totalOptimal,
    tier: resolveTacticalTier(score, allAnswers.length),
    recentTrend,
    strongestZone,
    weakestZone,
  };
}

function calculateTrend(sorted: QuizAnswer[]): TacticalIQResult['recentTrend'] {
  if (sorted.length < 6) return null; // need enough data for a meaningful trend

  const recent = sorted.slice(-10);
  const prior  = sorted.slice(-20, -10);
  if (prior.length === 0) return null;

  const recentRate = recent.filter(a => a.wasOptimal).length / recent.length;
  const priorRate  = prior.filter(a => a.wasOptimal).length / prior.length;
  const delta = recentRate - priorRate;

  if (delta > 0.1)  return 'improving';
  if (delta < -0.1) return 'declining';
  return 'stable';
}

function calculateZoneBreakdown(
  answers: (QuizAnswer & { zone: string })[],
): { strongestZone: TacticalIQResult['strongestZone']; weakestZone: TacticalIQResult['weakestZone'] } {
  const zones = ['defensive_third', 'middle_third', 'attacking_third'] as const;
  const rates: Record<string, number> = {};

  for (const zone of zones) {
    const zoneAnswers = answers.filter(a => a.zone === zone);
    if (zoneAnswers.length === 0) continue;
    rates[zone] = zoneAnswers.filter(a => a.wasOptimal).length / zoneAnswers.length;
  }

  const entries = Object.entries(rates);
  if (entries.length === 0) return { strongestZone: null, weakestZone: null };

  entries.sort(([, a], [, b]) => b - a);

  return {
    strongestZone: entries[0][0] as TacticalIQResult['strongestZone'],
    weakestZone:   entries[entries.length - 1][0] as TacticalIQResult['weakestZone'],
  };
}

// Tier requires both score AND volume — same principle as resolveRank() in
// grs-engine.ts: a single lucky quiz answer should not unlock "Elite"
function resolveTacticalTier(score: number, totalAnswered: number): TacticalIQResult['tier'] {
  if (score >= 80 && totalAnswered >= 15) return 'Elite';
  if (score >= 65 && totalAnswered >= 8)  return 'Sharp';
  if (totalAnswered >= 3)                  return 'Developing';
  return 'Novice';
}

// ── Narrative for the Talent Passport — mirrors buildScoutNarrative() pattern
//    from grs-engine.ts but for tactical understanding instead of physical
export function buildTacticalNarrative(result: TacticalIQResult, playerName: string): string {
  if (result.totalAnswered === 0) {
    return `${playerName} has not yet completed a Tactical IQ report. Available after their next match review.`;
  }

  const zoneLabel = (z: string | null) =>
    z ? z.replace('_', ' ') : null;

  const lines = [
    `${playerName} has a Tactical IQ of ${result.score}/100 across ${result.totalAnswered} match decisions reviewed (${result.tier} tier).`,
    result.strongestZone
      ? `Strongest decision-making in the ${zoneLabel(result.strongestZone)}.`
      : '',
    result.weakestZone && result.weakestZone !== result.strongestZone
      ? `Developing area: decisions in the ${zoneLabel(result.weakestZone)}.`
      : '',
    result.recentTrend === 'improving'
      ? 'Recent trend: tactical understanding improving with each match studied.'
      : result.recentTrend === 'declining'
      ? 'Recent trend: declining — may benefit from revisiting fundamentals.'
      : '',
  ];

  return lines.filter(Boolean).join(' ');
}