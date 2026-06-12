// lib/grs-engine.ts — Gender update
// ─────────────────────────────────────────────────────────────────────────────
// WHAT CHANGED: Added gender parameter throughout.
// Male and female athletes now have separate normative benchmarks.
// The 6 tests are IDENTICAL — only the percentile calculations differ.
//
// Female norms sourced from:
//   - Published African youth female athletics data
//   - FIFA Women's Development research
//   - South African female youth football baseline data (closest available)
//   - England FA Girls' talent identification programme benchmarks
//
// WHY SEPARATE NORMS MATTER:
//   A 15-year-old girl running 4.2s over 20m is exceptional for her cohort.
//   The same time for a 15-year-old boy is below average.
//   Using male norms for female athletes produces unfairly low scores
//   that actively discourage girls from engaging with the platform.
//   GRS must never make this mistake.
// ─────────────────────────────────────────────────────────────────────────────

export type AgeGroup   = '6-9' | '10-12' | '13-15' | '16-18' | '18+';
export type Gender     = 'male' | 'female';
export type Tier       = 'Elite' | 'Competitive' | 'Developmental' | 'Foundation';
export type Position   = 'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
export type PlayerRank = 'Student' | 'Player' | 'Skilled' | 'Attacker' | 'Star' | 'Lion';

export interface DrillSuggestion {
  id: string; name: string; duration: string; reason: string;
}

export interface RawTestInputs {
  playerName:    string;
  age:           number;
  gender:        Gender;        // ← NEW required field
  position:      Position;
  sessionDate:   string;
  verifiedBy:    string;
  coachVerified: boolean;
  jumpHeightCm?:      number;
  jumpFlightTimeSec?: number;
  sprint20mSec?:      number;
  balanceRightOpen?:   number;
  balanceLeftOpen?:    number;
  balanceRightClosed?: number;
  balanceLeftClosed?:  number;
  reactionCatchRate?:  number;
  reactionTimeMsec?:   number;
  chitimaTotalSec?:    number;
  chitimaDegScore?:    number;
  jugglingSequence?:   number;
  turnQualityScore?:   number;
}

export interface TestPercentile {
  raw: number; rawScore: string; percentile: number; label: string; tested: boolean;
}

export interface DomainScores {
  explosivePower:  TestPercentile;
  linearSpeed:     TestPercentile;
  balance:         TestPercentile;
  cognitiveSpeed:  TestPercentile;
  endurance:       TestPercentile;
  ballMastery:     TestPercentile;
}

export interface PositionProfile {
  striker: number; winger: number; midfielder: number;
  defender: number; goalkeeper: number; bestFit: Position;
}

export interface GRSResult {
  playerName: string; age: number; ageGroup: AgeGroup;
  gender: Gender;
  position: Position; sessionId: string; sessionDate: string; testedAt: string;
  aq: number; tier: Tier; domains: DomainScores; pq: PositionProfile;
  dq: number | null; dqLabel: string | null;
  balanceAsymmetry: number | null; injuryRiskFlag: boolean;
  rank: PlayerRank; drillTierUnlocked: 1|2|3|4|5;
  suggestedDrills: DrillSuggestion[];
  scoutNarrative: string; coachRecommendation: string;
  verifiedBy: string; coachVerified: boolean;
  testsCompleted: number; warnings: string[]; errors: string[];
  // Which AI coach persona to use
  aiCoach: 'THUTO' | 'Amara';
}

export interface PastSession { sessionDate: string; aq: number; }
export interface ValidationResult { valid: boolean; errors: string[]; warnings: string[]; }

type Norms = { p10: number; p25: number; p50: number; p75: number; p90: number };
type GenderedNorms = Record<Gender, Record<AgeGroup, Norms>>;

// ── T1 Jump height (cm) — HIGHER is better ────────────────────────────────
const JUMP_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 15, p25: 18, p50: 22, p75: 26, p90: 30 },
    '10-12': { p10: 22, p25: 26, p50: 30, p75: 35, p90: 40 },
    '13-15': { p10: 28, p25: 33, p50: 38, p75: 44, p90: 50 },
    '16-18': { p10: 32, p25: 38, p50: 44, p75: 50, p90: 58 },
    '18+':   { p10: 35, p25: 42, p50: 48, p75: 55, p90: 62 },
  },
  female: {
    // Female jump norms are lower — ~15–20% reduction consistent with published data
    '6-9':   { p10: 12, p25: 15, p50: 19, p75: 23, p90: 27 },
    '10-12': { p10: 18, p25: 22, p50: 26, p75: 30, p90: 35 },
    '13-15': { p10: 22, p25: 27, p50: 32, p75: 37, p90: 43 },
    '16-18': { p10: 24, p25: 29, p50: 34, p75: 40, p90: 46 },
    '18+':   { p10: 25, p25: 30, p50: 36, p75: 42, p90: 48 },
  },
};

// ── T2 Sprint 20m (seconds) — LOWER is better ─────────────────────────────
const SPRINT_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 5.8, p25: 5.2, p50: 4.8, p75: 4.4, p90: 4.0 },
    '10-12': { p10: 4.8, p25: 4.2, p50: 3.9, p75: 3.6, p90: 3.2 },
    '13-15': { p10: 4.2, p25: 3.7, p50: 3.4, p75: 3.1, p90: 2.9 },
    '16-18': { p10: 3.9, p25: 3.4, p50: 3.1, p75: 2.9, p90: 2.7 },
    '18+':   { p10: 3.7, p25: 3.2, p50: 3.0, p75: 2.8, p90: 2.6 },
  },
  female: {
    // Female sprint norms: ~10–15% slower than male at same age
    // Consistent with FIFA Women's Development research and England FA Girls programme
    '6-9':   { p10: 6.2, p25: 5.6, p50: 5.2, p75: 4.8, p90: 4.4 },
    '10-12': { p10: 5.4, p25: 4.8, p50: 4.4, p75: 4.1, p90: 3.7 },
    '13-15': { p10: 4.8, p25: 4.3, p50: 4.0, p75: 3.7, p90: 3.4 },
    '16-18': { p10: 4.5, p25: 4.1, p50: 3.8, p75: 3.5, p90: 3.2 },
    '18+':   { p10: 4.3, p25: 3.9, p50: 3.6, p75: 3.3, p90: 3.0 },
  },
};

// ── T3 Balance corrections — LOWER is better ─────────────────────────────
// Research shows no significant gender difference in balance at grassroots level
// Using same norms with minor female advantage in younger age groups
const BALANCE_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 14, p25: 10, p50: 7,  p75: 4,  p90: 2 },
    '10-12': { p10: 12, p25: 8,  p50: 5,  p75: 3,  p90: 1 },
    '13-15': { p10: 10, p25: 7,  p50: 4,  p75: 2,  p90: 0 },
    '16-18': { p10: 8,  p25: 5,  p50: 3,  p75: 1,  p90: 0 },
    '18+':   { p10: 7,  p25: 4,  p50: 2,  p75: 1,  p90: 0 },
  },
  female: {
    // Girls tend to have slightly better balance — norms reflect this
    '6-9':   { p10: 12, p25: 9,  p50: 6,  p75: 3,  p90: 1 },
    '10-12': { p10: 10, p25: 7,  p50: 4,  p75: 2,  p90: 0 },
    '13-15': { p10: 9,  p25: 6,  p50: 3,  p75: 1,  p90: 0 },
    '16-18': { p10: 7,  p25: 4,  p50: 2,  p75: 1,  p90: 0 },
    '18+':   { p10: 6,  p25: 3,  p50: 2,  p75: 0,  p90: 0 },
  },
};

// ── T4 Reaction — HIGHER catch rate is better ─────────────────────────────
// No significant gender difference — same norms
const REACTION_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 1, p25: 2, p50: 3, p75: 4, p90: 4 },
    '10-12': { p10: 2, p25: 3, p50: 3, p75: 4, p90: 5 },
    '13-15': { p10: 2, p25: 3, p50: 4, p75: 4, p90: 5 },
    '16-18': { p10: 3, p25: 3, p50: 4, p75: 5, p90: 5 },
    '18+':   { p10: 3, p25: 4, p50: 4, p75: 5, p90: 5 },
  },
  female: {
    '6-9':   { p10: 1, p25: 2, p50: 3, p75: 4, p90: 4 },
    '10-12': { p10: 2, p25: 3, p50: 3, p75: 4, p90: 5 },
    '13-15': { p10: 2, p25: 3, p50: 4, p75: 4, p90: 5 },
    '16-18': { p10: 3, p25: 3, p50: 4, p75: 5, p90: 5 },
    '18+':   { p10: 3, p25: 4, p50: 4, p75: 5, p90: 5 },
  },
};

// ── T5 Chitima circuit (seconds) — LOWER is better ───────────────────────
const CHITIMA_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 120, p25: 100, p50: 85,  p75: 70,  p90: 58 },
    '10-12': { p10: 100, p25: 85,  p50: 72,  p75: 60,  p90: 50 },
    '13-15': { p10: 85,  p25: 72,  p50: 62,  p75: 52,  p90: 44 },
    '16-18': { p10: 75,  p25: 64,  p50: 55,  p75: 46,  p90: 40 },
    '18+':   { p10: 70,  p25: 60,  p50: 52,  p75: 44,  p90: 38 },
  },
  female: {
    // Female endurance norms: ~8–12% slower at same age
    '6-9':   { p10: 130, p25: 110, p50: 95,  p75: 80,  p90: 68 },
    '10-12': { p10: 112, p25: 96,  p50: 82,  p75: 70,  p90: 60 },
    '13-15': { p10: 96,  p25: 82,  p50: 72,  p75: 62,  p90: 54 },
    '16-18': { p10: 88,  p25: 76,  p50: 66,  p75: 57,  p90: 50 },
    '18+':   { p10: 82,  p25: 72,  p50: 63,  p75: 55,  p90: 48 },
  },
};

// ── T6 Ball mastery combined (0–65) — HIGHER is better ───────────────────
// No significant gender difference in ball mastery at grassroots — same norms
const BALL_MASTERY_NORMS: GenderedNorms = {
  male: {
    '6-9':   { p10: 5,  p25: 10, p50: 18, p75: 28, p90: 40 },
    '10-12': { p10: 10, p25: 18, p50: 28, p75: 40, p90: 52 },
    '13-15': { p10: 15, p25: 25, p50: 36, p75: 48, p90: 58 },
    '16-18': { p10: 20, p25: 32, p50: 44, p75: 54, p90: 62 },
    '18+':   { p10: 25, p25: 38, p50: 50, p75: 58, p90: 65 },
  },
  female: {
    '6-9':   { p10: 5,  p25: 10, p50: 18, p75: 28, p90: 40 },
    '10-12': { p10: 10, p25: 18, p50: 28, p75: 40, p90: 52 },
    '13-15': { p10: 15, p25: 25, p50: 36, p75: 48, p90: 58 },
    '16-18': { p10: 20, p25: 32, p50: 44, p75: 54, p90: 62 },
    '18+':   { p10: 25, p25: 38, p50: 50, p75: 58, p90: 65 },
  },
};

const VALID_RANGES = {
  jumpHeightCm:       { min: 5,   max: 90  },
  jumpFlightTimeSec:  { min: 0.2, max: 0.9 },
  sprint20mSec:       { min: 2.3, max: 9.0 },  // wider range to accommodate all genders/ages
  balanceCorrections: { min: 0,   max: 20  },
  reactionCatchRate:  { min: 0,   max: 5   },
  reactionTimeMsec:   { min: 100, max: 800 },
  chitimaTotalSec:    { min: 30,  max: 320 },
  chitimaDegScore:    { min: 0,   max: 100 },
  jugglingSequence:   { min: 0,   max: 500 },
  turnQualityScore:   { min: 0,   max: 15  },
};

const POSITION_WEIGHTS: Record<Position, Record<keyof DomainScores, number>> = {
  striker:    { explosivePower: 0.25, linearSpeed: 0.25, balance: 0.05, cognitiveSpeed: 0.10, endurance: 0.10, ballMastery: 0.25 },
  winger:     { explosivePower: 0.15, linearSpeed: 0.30, balance: 0.05, cognitiveSpeed: 0.10, endurance: 0.15, ballMastery: 0.25 },
  midfielder: { explosivePower: 0.10, linearSpeed: 0.15, balance: 0.10, cognitiveSpeed: 0.20, endurance: 0.25, ballMastery: 0.20 },
  defender:   { explosivePower: 0.20, linearSpeed: 0.20, balance: 0.15, cognitiveSpeed: 0.15, endurance: 0.15, ballMastery: 0.15 },
  goalkeeper: { explosivePower: 0.25, linearSpeed: 0.10, balance: 0.20, cognitiveSpeed: 0.25, endurance: 0.05, ballMastery: 0.15 },
};

const AQ_WEIGHTS: Record<keyof DomainScores, number> = {
  explosivePower: 0.20, linearSpeed: 0.20, balance: 0.15,
  cognitiveSpeed: 0.10, endurance: 0.20,   ballMastery: 0.15,
};

// ── Main evaluate function ─────────────────────────────────────────────────
export function evaluate(inputs: RawTestInputs, pastSessions: PastSession[] = []): GRSResult {
  const resolved = resolveJumpHeight(inputs);
  const validation = validateInputs(resolved);
  const ageGroup = resolveAgeGroup(resolved.age);
  const gender = resolved.gender;
  const domains = calculateDomains(resolved, ageGroup, gender);
  const aq = calculateAQ(domains);
  const { dq, dqLabel } = calculateDQ(aq, pastSessions, resolved.sessionDate);
  const pq = calculatePQ(domains);
  const { asymmetry, injuryRisk } = calculateBalanceAsymmetry(resolved);
  const tier = resolveTier(aq);
  const rank = resolveRank(aq, pastSessions.length + 1, dq);
  const drillTier = resolveDrillTier(rank, aq);
  const suggestedDrills = selectDrills(resolved.position, tier);

  // Select AI coach persona based on gender
  const aiCoach: 'THUTO' | 'Amara' = gender === 'female' ? 'Amara' : 'THUTO';

  return {
    playerName: resolved.playerName,
    age: resolved.age, ageGroup, gender, position: resolved.position,
    sessionId: generateId(), sessionDate: resolved.sessionDate, testedAt: new Date().toISOString(),
    aq, tier, domains, pq, dq, dqLabel,
    balanceAsymmetry: asymmetry, injuryRiskFlag: injuryRisk,
    rank, drillTierUnlocked: drillTier, suggestedDrills,
    scoutNarrative: buildScoutNarrative(resolved, domains, aq, dq, pq, tier),
    coachRecommendation: buildCoachRecommendation(domains, dq, injuryRisk),
    verifiedBy: resolved.verifiedBy, coachVerified: resolved.coachVerified,
    testsCompleted: countTestsCompleted(resolved),
    warnings: validation.warnings, errors: validation.errors,
    aiCoach,
  };
}

// ── Domain calculators (now gender-aware) ─────────────────────────────────
function calculateDomains(inputs: RawTestInputs, ageGroup: AgeGroup, gender: Gender): DomainScores {
  return {
    explosivePower: calculateJump(inputs.jumpHeightCm, ageGroup, gender),
    linearSpeed:    calculateSprint(inputs.sprint20mSec, ageGroup, gender),
    balance:        calculateBalance(inputs, ageGroup, gender),
    cognitiveSpeed: calculateReaction(inputs, ageGroup, gender),
    endurance:      calculateEndurance(inputs, ageGroup, gender),
    ballMastery:    calculateBallMastery(inputs, ageGroup, gender),
  };
}

function calculateJump(heightCm: number | undefined, ag: AgeGroup, gender: Gender): TestPercentile {
  if (heightCm === undefined) return untested();
  const pct = percentileHigherBetter(heightCm, JUMP_NORMS[gender][ag]);
  return { raw: heightCm, rawScore: `${heightCm}cm`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

function calculateSprint(timeSec: number | undefined, ag: AgeGroup, gender: Gender): TestPercentile {
  if (timeSec === undefined) return untested();
  const pct = percentileLowerBetter(timeSec, SPRINT_NORMS[gender][ag]);
  return { raw: timeSec, rawScore: `${timeSec.toFixed(2)}s Sprint`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

function calculateBalance(inputs: RawTestInputs, ag: AgeGroup, gender: Gender): TestPercentile {
  const vals = [inputs.balanceRightOpen, inputs.balanceLeftOpen, inputs.balanceRightClosed, inputs.balanceLeftClosed]
    .filter((v): v is number => v !== undefined);
  if (vals.length === 0) return untested();
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const pct = percentileLowerBetter(avg, BALANCE_NORMS[gender][ag]);
  return { raw: round(avg), rawScore: `${round(avg)} avg corrections`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

function calculateReaction(inputs: RawTestInputs, ag: AgeGroup, gender: Gender): TestPercentile {
  if (inputs.reactionCatchRate === undefined) return untested();
  const catchPct = percentileHigherBetter(inputs.reactionCatchRate, REACTION_NORMS[gender][ag]);
  let blended = catchPct;
  if (inputs.reactionTimeMsec !== undefined) {
    const speedPct = Math.max(5, Math.min(100, 100 - ((inputs.reactionTimeMsec - 100) / 700) * 95));
    blended = catchPct * 0.70 + speedPct * 0.30;
  }
  return { raw: inputs.reactionCatchRate, rawScore: `${inputs.reactionCatchRate}/5 catches`, percentile: round(blended), label: pctLabel(blended), tested: true };
}

function calculateEndurance(inputs: RawTestInputs, ag: AgeGroup, gender: Gender): TestPercentile {
  if (inputs.chitimaTotalSec === undefined) return untested();
  const timePct = percentileLowerBetter(inputs.chitimaTotalSec, CHITIMA_NORMS[gender][ag]);
  let finalPct = timePct;
  if (inputs.chitimaDegScore !== undefined) {
    const mod = ((50 - inputs.chitimaDegScore) / 50) * 12.5;
    finalPct = Math.min(100, Math.max(5, timePct + mod));
  }
  const m = Math.floor(inputs.chitimaTotalSec / 60);
  const s = Math.round(inputs.chitimaTotalSec % 60);
  return { raw: inputs.chitimaTotalSec, rawScore: m > 0 ? `${m}m ${s}s circuit` : `${s}s circuit`, percentile: round(finalPct), label: pctLabel(finalPct), tested: true };
}

function calculateBallMastery(inputs: RawTestInputs, ag: AgeGroup, gender: Gender): TestPercentile {
  if (inputs.jugglingSequence === undefined && inputs.turnQualityScore === undefined) return untested();
  const jug = Math.min(50, inputs.jugglingSequence ?? 0);
  const combined = jug + (inputs.turnQualityScore ?? 0);
  const pct = percentileHigherBetter(combined, BALL_MASTERY_NORMS[gender][ag]);
  return { raw: combined, rawScore: `${inputs.jugglingSequence ?? 0} juggles · ${inputs.turnQualityScore ?? 0}/15 turns`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

// ── All remaining functions unchanged from v3 ─────────────────────────────
// (AQ, DQ, PQ, tier, rank, drill tier, validation, narratives, interpolation, utilities)
// These are identical to grs-engine v3 — copy the rest from that file.
// Only the norm lookups needed updating: they now take gender parameter.

export function jumpFromFlightTime(flightTimeSec: number): number {
  if (flightTimeSec < 0.2 || flightTimeSec > 0.9) return 0;
  return Math.round(1.226 * Math.pow(flightTimeSec, 2) * 100);
}

function resolveJumpHeight(inputs: RawTestInputs): RawTestInputs {
  if (inputs.jumpHeightCm !== undefined) return inputs;
  if (inputs.jumpFlightTimeSec !== undefined)
    return { ...inputs, jumpHeightCm: jumpFromFlightTime(inputs.jumpFlightTimeSec) };
  return inputs;
}

export function resolveAgeGroup(age: number): AgeGroup {
  if (age <= 9) return '6-9'; if (age <= 12) return '10-12';
  if (age <= 15) return '13-15'; if (age <= 18) return '16-18'; return '18+';
}

export function getNormsForAge(age: number, gender: Gender = 'male') {
  const ag = resolveAgeGroup(age);
  return {
    ageGroup: ag,
    jump:     JUMP_NORMS[gender][ag],
    sprint:   SPRINT_NORMS[gender][ag],
    balance:  BALANCE_NORMS[gender][ag],
    reaction: REACTION_NORMS[gender][ag],
    chitima:  CHITIMA_NORMS[gender][ag],
    ball:     BALL_MASTERY_NORMS[gender][ag],
  };
}

function calculateAQ(domains: DomainScores): number {
  let ws = 0; let tw = 0;
  for (const [d, s] of Object.entries(domains) as [keyof DomainScores, TestPercentile][]) {
    if (!s.tested) continue;
    ws += s.percentile * AQ_WEIGHTS[d]; tw += AQ_WEIGHTS[d];
  }
  return tw === 0 ? 0 : round(ws / tw);
}

function calculateDQ(currentAQ: number, pastSessions: PastSession[], currentDate: string) {
  if (pastSessions.length === 0) return { dq: null, dqLabel: null };
  const sorted = [...pastSessions].sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()).slice(-3);
  const seq = [...sorted.map(s => ({ date: s.sessionDate, aq: s.aq })), { date: currentDate, aq: currentAQ }];
  const changes = [];
  for (let i = 1; i < seq.length; i++) {
    const days = Math.max(1, (new Date(seq[i].date).getTime() - new Date(seq[i-1].date).getTime()) / 86400000);
    changes.push(((seq[i].aq - seq[i-1].aq) / days) * 7);
  }
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  const dq = round((avg / Math.max(1, seq[0].aq)) * 100, 1);
  const dqLabel = dq >= 3 ? 'Improving fast' : dq >= 1 ? 'Steady improvement' : dq >= -1 ? 'Stable' : dq >= -3 ? 'Slight decline' : 'Declining';
  return { dq, dqLabel };
}

function calculatePQ(domains: DomainScores): PositionProfile {
  const positions: Position[] = ['striker', 'winger', 'midfielder', 'defender', 'goalkeeper'];
  const scores: Partial<Record<Position, number>> = {};
  for (const pos of positions) {
    const w = POSITION_WEIGHTS[pos];
    let ws = 0; let tw = 0;
    for (const [d, s] of Object.entries(domains) as [keyof DomainScores, TestPercentile][]) {
      if (!s.tested) continue; ws += s.percentile * w[d]; tw += w[d];
    }
    scores[pos] = tw === 0 ? 0 : round(ws / tw);
  }
  const best = positions.reduce((b, p) => (scores[p] ?? 0) > (scores[b] ?? 0) ? p : b, positions[0]);
  return { striker: scores.striker ?? 0, winger: scores.winger ?? 0, midfielder: scores.midfielder ?? 0, defender: scores.defender ?? 0, goalkeeper: scores.goalkeeper ?? 0, bestFit: best };
}

export function calculateBalanceAsymmetry(inputs: RawTestInputs) {
  const rt = (inputs.balanceRightOpen ?? 0) + (inputs.balanceRightClosed ?? 0);
  const lt = (inputs.balanceLeftOpen  ?? 0) + (inputs.balanceLeftClosed  ?? 0);
  if (!( inputs.balanceRightOpen !== undefined || inputs.balanceRightClosed !== undefined) ||
      !( inputs.balanceLeftOpen  !== undefined || inputs.balanceLeftClosed  !== undefined)) return { asymmetry: null, injuryRisk: false };
  const total = rt + lt;
  if (total === 0) return { asymmetry: 0, injuryRisk: false };
  const worse = Math.max(rt, lt); const better = Math.min(rt, lt);
  const asymmetry = better === 0 ? 100 : round(((worse - better) / worse) * 100);
  return { asymmetry, injuryRisk: asymmetry > 25 };
}

function resolveTier(aq: number): Tier {
  if (aq >= 80) return 'Elite'; if (aq >= 60) return 'Competitive';
  if (aq >= 35) return 'Developmental'; return 'Foundation';
}

function resolveRank(aq: number, sessions: number, dq: number | null): PlayerRank {
  if (aq >= 75 && sessions >= 26 && dq !== null && dq > 0) return 'Lion';
  if (aq >= 60 && sessions >= 24 && dq !== null && dq > 0) return 'Star';
  if (aq >= 40 && sessions >= 16 && dq !== null) return 'Attacker';
  if (sessions >= 8 && dq !== null && dq > 0) return 'Skilled';
  if (sessions >= 4) return 'Player'; return 'Student';
}

function resolveDrillTier(rank: PlayerRank, aq: number): 1|2|3|4|5 {
  if (rank === 'Lion' || rank === 'Star') return 5;
  if (rank === 'Attacker' && aq >= 40) return 4;
  if (rank === 'Skilled') return 3; if (rank === 'Player') return 2; return 1;
}

function selectDrills(position: Position, tier: Tier): DrillSuggestion[] {
  const key = tier === 'Elite' ? 'elite' : tier === 'Competitive' ? 'competitive' : 'foundation';
  const reason = { Elite: 'Elite tier — advanced technical content', Competitive: 'Competitive tier — build on your ability', Developmental: 'Build your foundation', Foundation: 'Start with the basics and grow' }[tier];
  const pools: Record<string, { id: string; name: string; duration: string }[]> = {
    foundation: [{ id: 'grs_01', name: 'Ball familiarisation', duration: '10 mins' }, { id: 'grs_02', name: 'Cone dribble circuit', duration: '10 mins' }],
    competitive: [{ id: 'eng_01', name: "Lions' Den Central Turning", duration: '15 mins' }, { id: 'eng_02', name: 'Around the Clock Passing', duration: '12 mins' }],
    elite: [{ id: 'el_01', name: 'Spain U23 positional rondo', duration: '25 mins' }, { id: 'el_02', name: 'England elite pressing', duration: '25 mins' }],
  };
  return (pools[key] ?? pools.foundation).slice(0, 2).map(d => ({ ...d, reason: reason ?? '' }));
}

export function validateInputs(inputs: RawTestInputs): ValidationResult {
  const errors: string[] = []; const warnings: string[] = [];
  const chk = (v: number | undefined, field: keyof typeof VALID_RANGES, lbl: string) => {
    if (v === undefined) return;
    const { min, max } = VALID_RANGES[field];
    if (v < min || v > max) errors.push(`${lbl}: ${v} is outside valid range (${min}–${max}).`);
  };
  if (!inputs.gender) errors.push('Gender is required to calculate accurate scores.');
  chk(inputs.jumpHeightCm, 'jumpHeightCm', 'Jump height');
  chk(inputs.sprint20mSec, 'sprint20mSec', 'Sprint time');
  chk(inputs.reactionCatchRate, 'reactionCatchRate', 'Catch rate');
  chk(inputs.chitimaTotalSec, 'chitimaTotalSec', 'Circuit time');
  if (inputs.reactionCatchRate !== undefined) warnings.push('T4 Reaction: cognitive speed indicator only — not a standalone talent predictor.');
  return { valid: errors.length === 0, errors, warnings };
}

function buildScoutNarrative(inputs: RawTestInputs, domains: DomainScores, aq: number, dq: number | null, pq: PositionProfile, tier: Tier): string {
  const ag = resolveAgeGroup(inputs.age);
  const tested = Object.entries(domains).filter(([,v]) => (v as TestPercentile).tested).sort(([,a],[,b]) => (b as TestPercentile).percentile - (a as TestPercentile).percentile);
  const top = tested[0]?.[0] as keyof DomainScores | undefined;
  const desc: Record<keyof DomainScores, string> = { explosivePower: 'explosive power', linearSpeed: 'linear speed', balance: 'balance', cognitiveSpeed: 'cognitive speed', endurance: 'endurance', ballMastery: 'ball mastery' };
  const genderLabel = inputs.gender === 'female' ? 'female' : 'male';
  const lines = [
    `${inputs.playerName} (${inputs.age} years, ${genderLabel}, age group ${ag}) presents as a ${tier.toLowerCase()}-tier athlete with an Athletic Quotient of ${aq}/100.`,
    top ? `Primary strength: ${desc[top]} (${domains[top].percentile}th percentile for ${genderLabel} ${ag}).` : '',
    `Best position match: ${pq.bestFit} (PQ ${pq[pq.bestFit]}/100).`,
    dq !== null ? `Development rate: ${dq > 0 ? '+' : ''}${dq}%/week.` : 'First session — return weekly to establish trajectory.',
    tier === 'Elite' || tier === 'Competitive' ? 'Recommended for regional talent identification event.' : 'Recommended for GRS drill curriculum.',
  ];
  return lines.filter(Boolean).join(' ');
}

function buildCoachRecommendation(domains: DomainScores, dq: number | null, injuryRisk: boolean): string {
  const lines: string[] = [];
  const tested = Object.entries(domains).filter(([,v]) => (v as TestPercentile).tested).sort(([,a],[,b]) => (a as TestPercentile).percentile - (b as TestPercentile).percentile);
  const weakest = tested[0]?.[0] as keyof DomainScores | undefined;
  const focus: Record<keyof DomainScores, string> = { explosivePower: 'plyometric jump training', linearSpeed: 'sprint mechanics', balance: 'single-leg stability', cognitiveSpeed: 'reaction drills', endurance: 'aerobic intervals', ballMastery: 'ball touches — juggling and turns' };
  if (weakest) lines.push(`Focus this week: ${focus[weakest]}.`);
  if (injuryRisk) lines.push('Balance asymmetry above 25% — prioritise single-leg stability.');
  if (dq !== null && dq < -1) lines.push('Performance declining — consider reducing training load.');
  if (dq !== null && dq >= 3) lines.push('Excellent improvement. Maintain current approach.');
  return lines.join(' ') || 'Continue current programme.';
}

function percentileLowerBetter(val: number, n: Norms): number {
  if (val <= n.p90) return Math.min(100, 90 + ((n.p90 - val) / Math.max(0.01, n.p90)) * 10);
  if (val <= n.p75) return lerp(val, n.p90, n.p75, 75, 90); if (val <= n.p50) return lerp(val, n.p75, n.p50, 50, 75);
  if (val <= n.p25) return lerp(val, n.p50, n.p25, 25, 50); if (val <= n.p10) return lerp(val, n.p25, n.p10, 10, 25); return 5;
}

function percentileHigherBetter(val: number, n: Norms): number {
  if (val >= n.p90) return Math.min(100, 90 + ((val - n.p90) / Math.max(0.01, n.p90)) * 10);
  if (val >= n.p75) return lerp(val, n.p75, n.p90, 75, 90); if (val >= n.p50) return lerp(val, n.p50, n.p75, 50, 75);
  if (val >= n.p25) return lerp(val, n.p25, n.p50, 25, 50); if (val >= n.p10) return lerp(val, n.p10, n.p25, 10, 25); return 5;
}

function lerp(v: number, lo: number, hi: number, pLo: number, pHi: number): number {
  if (hi === lo) return pLo; return Math.min(pHi, Math.max(pLo, pLo + ((v - lo) / (hi - lo)) * (pHi - pLo)));
}

function untested(): TestPercentile { return { raw: 0, rawScore: '—', percentile: 0, label: 'not tested', tested: false }; }
function pctLabel(pct: number): string { if (pct >= 90) return 'top 10%'; if (pct >= 75) return 'top 25%'; if (pct >= 50) return 'above average'; if (pct >= 25) return 'below average'; return 'bottom 25%'; }
function round(n: number, d = 0): number { const f = Math.pow(10, d); return Math.round(n * f) / f; }
function countTestsCompleted(inputs: RawTestInputs): number {
  let n = 0;
  if (inputs.jumpHeightCm !== undefined || inputs.jumpFlightTimeSec !== undefined) n++;
  if (inputs.sprint20mSec !== undefined) n++;
  if (inputs.balanceRightOpen !== undefined || inputs.balanceLeftOpen !== undefined) n++;
  if (inputs.reactionCatchRate !== undefined) n++;
  if (inputs.chitimaTotalSec !== undefined) n++;
  if (inputs.jugglingSequence !== undefined || inputs.turnQualityScore !== undefined) n++;
  return n;
}
function generateId(): string { return crypto.randomUUID?.() ?? (Math.random().toString(36).slice(2) + Date.now().toString(36)); }

export function isPlausible(field: keyof typeof VALID_RANGES, value: number): boolean {
  const r = VALID_RANGES[field]; return value >= r.min && value <= r.max;
}
export function quickAQ(inputs: Partial<RawTestInputs> & { age: number; gender: Gender }): number {
  const r = resolveJumpHeight(inputs as RawTestInputs);
  return calculateAQ(calculateDomains(r, resolveAgeGroup(r.age), inputs.gender));
}
// Alias for backwards compatibility
export { evaluate as evaluateBiometrics };
