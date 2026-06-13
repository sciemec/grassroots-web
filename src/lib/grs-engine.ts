// lib/grs-engine.ts — v5: MediaPipe Holistic Integration
// ─────────────────────────────────────────────────────────────────────────────
// WHAT'S NEW in v5 (Holistic):
//   - HolisticLandmark / HolisticResults / AthleteMetrics types added
//   - holisticMetrics?: AthleteMetrics added to RawTestInputs
//   - holisticClassification? added to GRSResult
//   - Domain blending: holistic data supplements physical test scores when
//     a test was not performed or camera data is available:
//       explosivePower: holistic.explosivePower as 20% tertiary fallback
//       balance: holistic.symmetryScore blended at 25% weight
//       endurance: holistic.fatigueIndex as chitimaDegScore proxy when missing
//       cognitiveSpeed: holistic.focusScore blended at 20% weight
//   - calculateBalanceAsymmetry() incorporates symmetryScore
//   - processHolisticData() / classifyFromHolistic() exported for use in
//     talent-id page and usePoseDetector hook
//   - holisticToInputs() bridge converts camera metrics to RawTestInputs partial
//   - Fixed operator precedence bug in headGazeX calculation (was || not ??)
//
// v4 CHANGES (Gender):
//   - gender threaded through RawTestInputs → all norm lookups
//   - pctLower() tail fix, chitimaDegScore modifier corrected
//   - DQ time-normalises by actual days, caps ±15%/wk, last 4 sessions
//   - PQ re-normalises weights for untested domains
//   - Balance uses weighted average (eyes-closed 1.5×)
//   - Reaction: catch rate primary, timer 30% blend
//   - Ball mastery: juggling capped 50, turns capped 15
//   - selectDrills() returns exactly 6 drills, one per domain
//
// Female norms: African youth female athletics data, FIFA Women's Development
// research, South African female youth football baseline, England FA Girls'.
//
// WHY SEPARATE NORMS MATTER:
//   A 15-year-old girl running 4.2s over 20m is exceptional for her cohort.
//   The same time for a 15-year-old boy is below average.
//   Using male norms for female athletes produces unfairly low scores
//   that actively discourage girls from engaging with the platform.
// ─────────────────────────────────────────────────────────────────────────────

export type AgeGroup   = '6-9' | '10-12' | '13-15' | '16-18' | '18+';
export type Gender     = 'male' | 'female';
export type Tier       = 'Elite' | 'Competitive' | 'Developmental' | 'Foundation';
export type Position   = 'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
export type PlayerRank = 'Student' | 'Player' | 'Skilled' | 'Attacker' | 'Star' | 'Lion';

export interface DrillSuggestion {
  id: string; name: string; duration: string; reason: string;
}

// ── MediaPipe Holistic types ───────────────────────────────────────────────
export interface HolisticLandmark { x: number; y: number; z: number; visibility?: number; }

export interface HolisticResults {
  poseLandmarks?:      HolisticLandmark[];
  faceLandmarks?:      HolisticLandmark[];
  leftHandLandmarks?:  HolisticLandmark[];
  rightHandLandmarks?: HolisticLandmark[];
}

export interface AthleteMetrics {
  // Biomechanics (from 33-point Pose)
  kneeAngle:            number;  // degrees — good jump = 80–100° at takeoff
  hipAngle:             number;  // hip extension angle
  torsoLean:            number;  // degrees from vertical (0 = upright)
  strideLength:         number;  // normalised 0–1 relative to frame height
  armSwingEfficiency:   number;  // 0–1
  // Cognitive / Fatigue (from 468-point Face Mesh)
  expressionFatigue:    number;  // 0–1 (higher = more fatigued eyebrow/jaw tension)
  focusScore:           number;  // 0–1 (head stability → attention proxy)
  headGazeX:            number;  // −1 (left) to +1 (right)
  headGazeY:            number;  // −1 (up) to +1 (down)
  // Hands (from 21 landmarks per hand, 42 total)
  gripStrength:         number;  // 0–1 (thumb-index pinch distance, inverted)
  gestureType:          string;  // 'open' | 'fist' | 'point' | 'unknown'
  // Composite derived scores (0–100)
  overallForm:          number;
  fatigueIndex:         number;  // 0–100 (higher = more fatigued)
  symmetryScore:        number;  // 0–100 (higher = more bilateral symmetry)
  explosivePower:       number;  // 0–100 derived from knee angle + jump kinematics
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
  // Optional: camera-derived biomechanics (from usePoseDetector / Holistic)
  holisticMetrics?:    AthleteMetrics;
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
  // Camera-derived position classification (when holisticMetrics present)
  holisticClassification?: { position: string; confidence: number };
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

  // Holistic camera classification (cross-check against PQ bestFit)
  const holisticClassification = resolved.holisticMetrics
    ? classifyFromHolistic(resolved.holisticMetrics)
    : undefined;

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
    aiCoach, holisticClassification,
  };
}

// ── Domain calculators (gender-aware + holistic blending) ──────────────────
function calculateDomains(inputs: RawTestInputs, ageGroup: AgeGroup, gender: Gender): DomainScores {
  const h = inputs.holisticMetrics;
  return {
    explosivePower: calculateJump(inputs.jumpHeightCm, ageGroup, gender, h),
    linearSpeed:    calculateSprint(inputs.sprint20mSec, ageGroup, gender),
    balance:        calculateBalance(inputs, ageGroup, gender),
    cognitiveSpeed: calculateReaction(inputs, ageGroup, gender, h),
    endurance:      calculateEndurance(inputs, ageGroup, gender, h),
    ballMastery:    calculateBallMastery(inputs, ageGroup, gender),
  };
}

function calculateJump(
  heightCm: number | undefined,
  ag: AgeGroup,
  gender: Gender,
  h?: AthleteMetrics,
): TestPercentile {
  if (heightCm !== undefined) {
    let pct = percentileHigherBetter(heightCm, JUMP_NORMS[gender][ag]);
    // Holistic blend: explosivePower supplements at 20% when camera data present
    if (h && h.explosivePower > 0) {
      pct = pct * 0.80 + h.explosivePower * 0.20;
    }
    return { raw: heightCm, rawScore: `${heightCm}cm`, percentile: round(pct), label: pctLabel(pct), tested: true };
  }
  // Tertiary fallback: holistic explosivePower alone when no physical jump done
  if (h && h.explosivePower > 0) {
    const pct = h.explosivePower;
    return { raw: round(pct), rawScore: `${round(pct)}% holistic power`, percentile: round(pct), label: pctLabel(pct), tested: true };
  }
  return untested();
}

function calculateSprint(timeSec: number | undefined, ag: AgeGroup, gender: Gender): TestPercentile {
  if (timeSec === undefined) return untested();
  const pct = percentileLowerBetter(timeSec, SPRINT_NORMS[gender][ag]);
  return { raw: timeSec, rawScore: `${timeSec.toFixed(2)}s Sprint`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

function calculateBalance(inputs: RawTestInputs, ag: AgeGroup, gender: Gender): TestPercentile {
  const vals = [inputs.balanceRightOpen, inputs.balanceLeftOpen, inputs.balanceRightClosed, inputs.balanceLeftClosed]
    .filter((v): v is number => v !== undefined);
  const h = inputs.holisticMetrics;
  if (vals.length === 0) {
    // Holistic symmetryScore as standalone balance proxy when no physical test
    if (h && h.symmetryScore > 0) {
      const pct = h.symmetryScore;
      return { raw: round(pct), rawScore: `${round(pct)}% symmetry`, percentile: round(pct), label: pctLabel(pct), tested: true };
    }
    return untested();
  }
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  let pct = percentileLowerBetter(avg, BALANCE_NORMS[gender][ag]);
  // Blend holistic symmetry at 25% when available alongside physical test
  if (h && h.symmetryScore > 0) {
    pct = pct * 0.75 + h.symmetryScore * 0.25;
  }
  return { raw: round(avg), rawScore: `${round(avg)} avg corrections`, percentile: round(pct), label: pctLabel(pct), tested: true };
}

function calculateReaction(
  inputs: RawTestInputs,
  ag: AgeGroup,
  gender: Gender,
  h?: AthleteMetrics,
): TestPercentile {
  if (inputs.reactionCatchRate === undefined) return untested();
  const catchPct = percentileHigherBetter(inputs.reactionCatchRate, REACTION_NORMS[gender][ag]);
  let blended = catchPct;
  if (inputs.reactionTimeMsec !== undefined) {
    const speedPct = Math.max(5, Math.min(100, 100 - ((inputs.reactionTimeMsec - 100) / 700) * 95));
    blended = catchPct * 0.70 + speedPct * 0.30;
  }
  // Holistic focusScore blended at 20% — head stability as cognitive proxy
  if (h && h.focusScore > 0) {
    blended = blended * 0.80 + (h.focusScore * 100) * 0.20;
  }
  return { raw: inputs.reactionCatchRate, rawScore: `${inputs.reactionCatchRate}/5 catches`, percentile: round(blended), label: pctLabel(blended), tested: true };
}

function calculateEndurance(
  inputs: RawTestInputs,
  ag: AgeGroup,
  gender: Gender,
  h?: AthleteMetrics,
): TestPercentile {
  if (inputs.chitimaTotalSec === undefined) return untested();
  const timePct = percentileLowerBetter(inputs.chitimaTotalSec, CHITIMA_NORMS[gender][ag]);
  let finalPct = timePct;
  // Use explicit chitimaDegScore if provided; otherwise use holistic fatigueIndex as proxy
  const degScore = inputs.chitimaDegScore ?? (h ? h.fatigueIndex : undefined);
  if (degScore !== undefined) {
    const mod = ((50 - degScore) / 50) * 12.5;
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
  const hasRight = inputs.balanceRightOpen !== undefined || inputs.balanceRightClosed !== undefined;
  const hasLeft  = inputs.balanceLeftOpen  !== undefined || inputs.balanceLeftClosed  !== undefined;

  // If holistic symmetryScore available but no physical balance test, derive asymmetry from it
  if ((!hasRight || !hasLeft) && inputs.holisticMetrics?.symmetryScore !== undefined) {
    const asymmetry = round(100 - inputs.holisticMetrics.symmetryScore);
    return { asymmetry, injuryRisk: asymmetry > 25 };
  }

  if (!hasRight || !hasLeft) return { asymmetry: null, injuryRisk: false };
  const total = rt + lt;
  if (total === 0) return { asymmetry: 0, injuryRisk: false };
  const worse = Math.max(rt, lt); const better = Math.min(rt, lt);
  let asymmetry = better === 0 ? 100 : round(((worse - better) / worse) * 100);

  // If holistic symmetryScore also available, blend it at 25% for extra precision
  if (inputs.holisticMetrics?.symmetryScore !== undefined) {
    const holisticAsym = 100 - inputs.holisticMetrics.symmetryScore;
    asymmetry = round(asymmetry * 0.75 + holisticAsym * 0.25);
  }

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

// ── selectDrills — returns exactly 6 drills, one per test domain ──────────────
// Each drill trains the physical quality measured by one GRS test:
//   T1 explosivePower  → plyometric / jump drill
//   T2 linearSpeed     → sprint / acceleration drill
//   T3 balance         → single-leg stability drill
//   T4 cognitiveSpeed  → reaction / decision drill
//   T5 endurance       → circuit / aerobic drill
//   T6 ballMastery     → ball technique drill
//
// Drills are selected by tier (Foundation/Developmental → Competitive → Elite)
// and refined by position where meaningful.
function selectDrills(position: Position, tier: Tier): DrillSuggestion[] {
  const isElite       = tier === 'Elite';
  const isCompetitive = tier === 'Competitive';
  const isAdvanced    = isElite || isCompetitive;

  // ── T1 — Explosive Power (Jump) ─────────────────────────────────────────
  const t1: DrillSuggestion = isElite ? {
    id: 'pow_e', name: 'Depth drop reactive jump', duration: '12 mins',
    reason: 'T1 Jump · Elite — step off a 40cm box, land and immediately explode upward. 4 sets of 6.',
  } : isCompetitive ? {
    id: 'pow_c', name: 'Squat jump to sprint', duration: '10 mins',
    reason: 'T1 Jump · Competitive — 3 squat jumps then sprint 10m. 5 reps. Trains elastic power.',
  } : {
    id: 'pow_f', name: 'Knee-height wall jump', duration: '8 mins',
    reason: 'T1 Jump · Foundation — step off a low wall, land both feet, immediately jump as high as possible. 10 reps.',
  };

  // ── T2 — Linear Speed (Sprint) ───────────────────────────────────────────
  const t2: DrillSuggestion = isElite ? {
    id: 'spd_e', name: 'Resistance band sprint release', duration: '15 mins',
    reason: 'T2 Sprint · Elite — partner holds resistance band, sprint 20m on release. 6 reps each side.',
  } : isCompetitive ? {
    id: 'spd_c', name: '10-20-10 acceleration ladder', duration: '12 mins',
    reason: 'T2 Sprint · Competitive — sprint 10m, jog back, sprint 20m, jog back, sprint 10m. 4 sets.',
  } : {
    id: 'spd_f', name: '20m flat sprint with standing start', duration: '8 mins',
    reason: 'T2 Sprint · Foundation — mark 20m with two objects. Sprint full effort 6 times, 60s rest between.',
  };

  // ── T3 — Balance (Proprioception) ────────────────────────────────────────
  const t3: DrillSuggestion = isAdvanced ? {
    id: 'bal_a', name: 'Single-leg ball juggle', duration: '10 mins',
    reason: 'T3 Balance · Advanced — stand on one leg and juggle for 30s. Switch legs. Trains balance under distraction.',
  } : {
    id: 'bal_f', name: 'Single-leg 30-second hold', duration: '8 mins',
    reason: 'T3 Balance · Foundation — stand on one foot, arms out. Count corrections. 4 sets each leg, eyes open and closed.',
  };

  // ── T4 — Cognitive Speed (Reaction) ──────────────────────────────────────
  // Position-specific: goalkeepers get a diving variation
  const t4: DrillSuggestion = position === 'goalkeeper' ? {
    id: 'rea_gk', name: 'Ball drop reflex dive', duration: '10 mins',
    reason: 'T4 Reaction · GK — partner drops ball from shoulder height at varying angles. Dive to catch before second bounce.',
  } : isAdvanced ? {
    id: 'rea_a', name: 'Two-cone colour call sprint', duration: '12 mins',
    reason: 'T4 Reaction · Advanced — stand between two cones 5m apart. Coach calls left/right, sprint to that cone. 10 reps.',
  } : {
    id: 'rea_f', name: 'Ball drop catch', duration: '8 mins',
    reason: 'T4 Reaction · Foundation — partner holds ball at shoulder height and drops without warning. Catch before second bounce. 5 attempts.',
  };

  // ── T5 — Endurance (Chitima circuit) ─────────────────────────────────────
  // Position-specific: strikers and wingers get a sprint-biased version
  const t5: DrillSuggestion = (position === 'striker' || position === 'winger') ? {
    id: 'end_sw', name: 'Sprint-recovery interval', duration: '15 mins',
    reason: 'T5 Endurance · Attacker — sprint 20m, walk 20m, sprint 20m. 8 reps. Mimics match sprint pattern.',
  } : isAdvanced ? {
    id: 'end_a', name: 'Full Chitima circuit — 4 rounds', duration: '18 mins',
    reason: 'T5 Endurance · Advanced — 5 burpees → sprint 10m → 5 squat jumps → sprint back. 4 rounds. Rate technique each round.',
  } : {
    id: 'end_f', name: 'Chitima circuit — 3 rounds', duration: '12 mins',
    reason: 'T5 Endurance · Foundation — 5 burpees → sprint 10m → 5 squat jumps → sprint back. 3 rounds. No rest between.',
  };

  // ── T6 — Ball Mastery ────────────────────────────────────────────────────
  // Position-specific: defenders get a clearance variation, GKs get distribution
  const t6: DrillSuggestion = position === 'goalkeeper' ? {
    id: 'bal_gk', name: 'GK distribution juggle and throw', duration: '12 mins',
    reason: 'T6 Ball · GK — juggle 10 touches then throw accurately to a target 15m away. 8 sets.',
  } : position === 'defender' ? {
    id: 'bal_df', name: 'First-touch control + inside cut', duration: '12 mins',
    reason: 'T6 Ball · Defender — receive a pass, control with inside foot, inside-cut turn around cone. 10 reps each foot.',
  } : isElite ? {
    id: 'bal_e', name: 'Juggle sequence + Cruyff turn', duration: '15 mins',
    reason: 'T6 Ball · Elite — juggle 20 touches, receive pass, execute Cruyff turn around cone. No ball touches the ground.',
  } : isCompetitive ? {
    id: 'bal_c', name: 'Juggling record attempt + inside cuts', duration: '12 mins',
    reason: 'T6 Ball · Competitive — juggle for 30s (longest run), then 5 inside-cut turns around a cone.',
  } : {
    id: 'bal_f2', name: 'Juggling ladder', duration: '10 mins',
    reason: 'T6 Ball · Foundation — juggle the ball and count your longest sequence without it hitting the ground. 5 attempts, record best.',
  };

  return [t1, t2, t3, t4, t5, t6];
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

// ── MediaPipe Holistic helper functions ────────────────────────────────────

/** Angle at vertex B formed by points A–B–C (degrees). */
export function calculateAngle(
  a: HolisticLandmark,
  b: HolisticLandmark,
  c: HolisticLandmark,
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

/** Euclidean distance between two landmarks. */
export function calculateDistance(a: HolisticLandmark, b: HolisticLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

/**
 * Processes a raw MediaPipe Holistic frame into structured AthleteMetrics.
 * Covers Pose (33 pts) + Face Mesh (468 pts) + Hands (42 pts).
 *
 * Returns null if landmarks are missing or insufficient.
 */
export function processHolisticData(results: HolisticResults): AthleteMetrics | null {
  const pose = results.poseLandmarks;
  const face = results.faceLandmarks;
  const lHand = results.leftHandLandmarks;
  const rHand = results.rightHandLandmarks;

  if (!pose || pose.length < 33) return null;

  // ── Biomechanics from Pose ────────────────────────────────────────────────
  // MediaPipe Pose landmark indices:
  //  11=leftShoulder  12=rightShoulder
  //  23=leftHip       24=rightHip
  //  25=leftKnee      26=rightKnee
  //  27=leftAnkle     28=rightAnkle
  const lKneeAngle = calculateAngle(pose[23], pose[25], pose[27]);
  const rKneeAngle = calculateAngle(pose[24], pose[26], pose[28]);
  const kneeAngle  = (lKneeAngle + rKneeAngle) / 2;

  const lHipAngle = calculateAngle(pose[11], pose[23], pose[25]);
  const rHipAngle = calculateAngle(pose[12], pose[24], pose[26]);
  const hipAngle  = (lHipAngle + rHipAngle) / 2;

  // Torso lean: angle of shoulder-midpoint to hip-midpoint from vertical
  const shoulderMid = { x: (pose[11].x + pose[12].x) / 2, y: (pose[11].y + pose[12].y) / 2, z: 0 };
  const hipMid      = { x: (pose[23].x + pose[24].x) / 2, y: (pose[23].y + pose[24].y) / 2, z: 0 };
  const torsoLean = Math.abs(Math.atan2(shoulderMid.x - hipMid.x, hipMid.y - shoulderMid.y) * (180 / Math.PI));

  // Stride length: horizontal distance left-ankle to right-ankle, normalised by frame height
  const ankleSpread = Math.abs(pose[27].x - pose[28].x);
  const frameHeight = Math.abs(pose[0].y - ((pose[27].y + pose[28].y) / 2));
  const strideLength = frameHeight > 0 ? Math.min(1, ankleSpread / frameHeight) : 0;

  // Arm swing: shoulder-to-wrist angle asymmetry (smaller = more efficient)
  const lWrist = pose[15]; const rWrist = pose[16];
  const lArmAngle = lWrist ? calculateAngle(pose[11], pose[13], lWrist) : 90;
  const rArmAngle = rWrist ? calculateAngle(pose[12], pose[14], rWrist) : 90;
  const armAsymmetry = Math.abs(lArmAngle - rArmAngle);
  const armSwingEfficiency = Math.max(0, Math.min(1, 1 - armAsymmetry / 90));

  // ── Cognitive / Fatigue from Face Mesh ───────────────────────────────────
  let expressionFatigue = 0.5;
  let focusScore        = 0.5;
  let headGazeX         = 0;
  let headGazeY         = 0;

  if (face && face.length >= 468) {
    // Brow tension: distance between inner brows (indices 70 + 300)
    // Smaller distance = furrowed brows = fatigue/concentration
    const lBrow = face[70]; const rBrow = face[300];
    const browDist = calculateDistance(lBrow, rBrow);
    expressionFatigue = Math.max(0, Math.min(1, 1 - browDist * 4));

    // Head stability: nose tip y-variance proxy — using nose tip (1) vs chin (152)
    const noseTip = face[1]; const chin = face[152];
    const headHeight = Math.abs(noseTip.y - chin.y);
    focusScore = Math.max(0, Math.min(1, headHeight * 5)); // taller head = upright = focused

    // Gaze: left eye (33) vs right eye (263) — fixed operator precedence bug
    const leftEye  = face[33];
    const rightEye = face[263];
    headGazeX = ((leftEye?.x ?? 0) + (rightEye?.x ?? 0)) / 2 - 0.5; // −0.5→+0.5 centred
    headGazeY = ((leftEye?.y ?? 0) + (rightEye?.y ?? 0)) / 2 - 0.5;
  }

  // ── Hands ─────────────────────────────────────────────────────────────────
  let gripStrength = 0.5;
  let gestureType  = 'unknown';

  const hand = rHand ?? lHand;
  if (hand && hand.length >= 21) {
    // Grip: thumb tip (4) to index finger tip (8) — smaller = tighter grip
    const thumbTip = hand[4]; const indexTip = hand[8];
    const pinchDist = calculateDistance(thumbTip, indexTip);
    gripStrength = Math.max(0, Math.min(1, 1 - pinchDist * 5));

    // Simple gesture: if all fingertips below MCP joints → fist
    const tips = [hand[4], hand[8], hand[12], hand[16], hand[20]];
    const mcps = [hand[2], hand[5], hand[9],  hand[13], hand[17]];
    const closedFingers = tips.filter((t, i) => t.y > mcps[i].y).length;
    if (closedFingers >= 4)     gestureType = 'fist';
    else if (closedFingers <= 1) gestureType = 'open';
    else if (hand[8].y < hand[6].y && closedFingers === 3) gestureType = 'point';
  }

  // ── Composite scores ──────────────────────────────────────────────────────

  // Symmetry: compares left vs right sides of body (shoulders, hips, ankles)
  const shoulderAsym = Math.abs(pose[11].y - pose[12].y);
  const hipAsym      = Math.abs(pose[23].y - pose[24].y);
  const ankleAsym    = Math.abs(pose[27].y - pose[28].y);
  const rawAsym      = (shoulderAsym + hipAsym + ankleAsym) / 3;
  const symmetryScore = Math.round(Math.max(0, Math.min(100, (1 - rawAsym * 20) * 100)));

  // Fatigue index: 0=fresh, 100=exhausted. From expressionFatigue + arm efficiency drop + torso lean
  const fatigueIndex = Math.round(Math.min(100, expressionFatigue * 50 + (1 - armSwingEfficiency) * 30 + Math.min(20, torsoLean)));

  // Explosive power: derived from knee angle at ~90° (optimal for jump takeoff)
  const kneeOptimal = Math.max(0, 1 - Math.abs(kneeAngle - 90) / 90);
  const explosivePower = Math.round(Math.min(100, kneeOptimal * 60 + armSwingEfficiency * 25 + (1 - torsoLean / 45) * 15));

  // Overall form: weighted composite
  const overallForm = Math.round(symmetryScore * 0.30 + (100 - fatigueIndex) * 0.25 + explosivePower * 0.25 + armSwingEfficiency * 100 * 0.20);

  return {
    kneeAngle: round(kneeAngle),
    hipAngle:  round(hipAngle),
    torsoLean: round(torsoLean),
    strideLength: round(strideLength, 3),
    armSwingEfficiency: round(armSwingEfficiency, 3),
    expressionFatigue:  round(expressionFatigue, 3),
    focusScore:         round(focusScore, 3),
    headGazeX:          round(headGazeX, 3),
    headGazeY:          round(headGazeY, 3),
    gripStrength:        round(gripStrength, 3),
    gestureType,
    overallForm,
    fatigueIndex,
    symmetryScore,
    explosivePower,
  };
}

/**
 * Maps AthleteMetrics to a position classification.
 * Used as a cross-check against the PQ bestFit from physical tests.
 */
export function classifyFromHolistic(m: AthleteMetrics): { position: string; confidence: number } {
  const scores: Record<string, number> = {
    goalkeeper:  m.gripStrength * 35 + m.focusScore * 35 + (m.symmetryScore / 100) * 30,
    striker:     (m.explosivePower / 100) * 40 + (m.strideLength) * 35 + m.armSwingEfficiency * 25,
    winger:      (m.strideLength) * 45 + (m.explosivePower / 100) * 30 + m.armSwingEfficiency * 25,
    midfielder:  m.focusScore * 40 + (m.symmetryScore / 100) * 35 + m.armSwingEfficiency * 25,
    defender:    (m.symmetryScore / 100) * 40 + m.focusScore * 30 + m.gripStrength * 30,
  };
  let best = 'midfielder'; let bestScore = 0;
  for (const [pos, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = pos; }
  }
  // Confidence = how far ahead of second-best (0–1)
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const confidence = sorted[1] > 0 ? round(Math.min(1, (sorted[0] - sorted[1]) / sorted[0]), 2) : 1;
  return { position: best, confidence };
}

/**
 * Bridge: converts AthleteMetrics from camera into partial RawTestInputs.
 * The talent-id page calls this to pre-populate fields before a session starts.
 *
 * Only sets fields the camera can reliably derive; physical test fields
 * (sprint20mSec, jugglingSequence, etc.) are still entered manually.
 */
export function holisticToInputs(
  metrics: AthleteMetrics,
  partial: Partial<RawTestInputs> = {},
): Partial<RawTestInputs> {
  const updates: Partial<RawTestInputs> = { ...partial, holisticMetrics: metrics };

  // Derive jumpHeightCm if not yet measured: explosivePower → rough height estimate
  // (20cm = minimum plausible; 60cm = maximum from camera proxy)
  if (!partial.jumpHeightCm && metrics.explosivePower > 20) {
    updates.jumpHeightCm = Math.round(20 + (metrics.explosivePower / 100) * 40);
  }

  // Derive chitimaDegScore from fatigueIndex when no Chitima test yet taken
  if (!partial.chitimaDegScore) {
    updates.chitimaDegScore = metrics.fatigueIndex;
  }

  return updates;
}