// lib/grs-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// GRS Athletic Intelligence Framework — Scoring Engine v3
//
// WHAT CHANGED FROM v2 (merged from evaluateBiometrics):
//
//   NEW — rawScore: human-readable display string per test
//         e.g. "3.24s Sprint", "42cm Jump", "4/5 catches"
//         Used directly in the UI result cards
//
//   NEW — suggestedDrills[]: real named drills returned with every result
//         Drills are position-specific AND tier-specific
//         Elite players get advanced drills. Foundation players get basics.
//         Drill IDs match the drill library in page.tsx (FOOTBALL_POSITION_DRILLS)
//
//   NEW — jumpFromFlightTime(): kinematic formula h = 1.226 × t²
//         Converts video flight time (seconds) to jump height (cm)
//         Useful when coach times from video rather than measuring with tape
//
//   KEPT — All 6 GRS tests (T1–T6)
//   KEPT — AQ / DQ / PQ three-score system
//   KEPT — Balance asymmetry + injury risk detection
//   KEPT — Technique degradation score (T5 Chitima)
//   KEPT — Validation with error/warning system
//   KEPT — Zimbabwe age groups (6-9, 10-12, 13-15, 16-18, 18+)
//   KEPT — Scout narrative + coach recommendation in plain language
//   KEPT — Percentile interpolation (lerp) for smooth 0–100 scoring
//
//   REJECTED from evaluateBiometrics:
//   ✗ U8/U13/U17/Senior age labels (our 5-band system is more precise)
//   ✗ Hard-coded percentile jumps without interpolation
//   ✗ The fallback jump formula 45 + (1/t) × 4 (mathematically wrong)
//   ✗ Jargon-heavy narrative language not suitable for Zimbabwe coaches
//
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AgeGroup   = '6-9' | '10-12' | '13-15' | '16-18' | '18+';
export type Tier       = 'Elite' | 'Competitive' | 'Developmental' | 'Foundation';
export type Position   = 'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
export type PlayerRank = 'Rookie' | 'Player' | 'Skilled' | 'Attacker' | 'Star' | 'Lion';

// A single drill suggestion returned with test results
export interface DrillSuggestion {
  id:          string;    // matches FOOTBALL_POSITION_DRILLS drill IDs in page.tsx
  name:        string;
  duration:    string;
  reason:      string;    // why this drill was suggested for this score
}

// Raw inputs from one test session
// All fields are optional — a session may include any subset of the 6 tests
export interface RawTestInputs {
  playerName:    string;
  age:           number;
  position:      Position;
  sessionDate:   string;        // ISO date string
  verifiedBy:    string;        // coach name or 'self'
  coachVerified: boolean;

  // T1 — Muhondo Jump
  // Option A: direct height measurement in cm
  jumpHeightCm?:     number;   // valid: 5–90
  // Option B: flight time from video (seconds) — engine converts using h = 1.226 × t²
  jumpFlightTimeSec?: number;  // valid: 0.2–0.9

  // T2 — Nzira Sprint
  sprint20mSec?:     number;   // seconds — lower is better — valid: 2.5–8.0

  // T3 — Balance (4 readings — one per leg per eye condition)
  balanceRightOpen?:   number; // correction count 0–20 — lower is better
  balanceLeftOpen?:    number;
  balanceRightClosed?: number;
  balanceLeftClosed?:  number;

  // T4 — Kurumidza Reaction
  reactionCatchRate?:  number; // catches out of 5 — valid: 0–5
  reactionTimeMsec?:   number; // milliseconds — valid: 100–800

  // T5 — Chitima Circuit
  chitimaTotalSec?:    number; // total time seconds — valid: 30–300
  chitimaDegScore?:    number; // technique degradation 0–100 — lower is better

  // T6 — Ball Mastery
  jugglingSequence?:   number; // longest unbroken sequence — valid: 0–500
  turnQualityScore?:   number; // sum of 5 turn ratings 0–15 — valid: 0–15
}

// Percentile score for one test — now includes rawScore display string
export interface TestPercentile {
  raw:        number;   // the actual measurement
  rawScore:   string;   // ← NEW: human-readable e.g. "3.24s", "42cm", "4/5 catches"
  percentile: number;   // 0–100 vs age-group norms
  label:      string;   // 'top 10%' | 'top 25%' | 'above average' | 'below average' | 'bottom 25%'
  tested:     boolean;  // false if this test was skipped
}

// Domain scores — the 6 dimensions of the AQ
export interface DomainScores {
  explosivePower:  TestPercentile; // T1 jump
  linearSpeed:     TestPercentile; // T2 sprint
  balance:         TestPercentile; // T3 balance
  cognitiveSpeed:  TestPercentile; // T4 reaction
  endurance:       TestPercentile; // T5 chitima
  ballMastery:     TestPercentile; // T6 ball mastery
}

// Position quotient — one score per position
export interface PositionProfile {
  striker:    number;
  winger:     number;
  midfielder: number;
  defender:   number;
  goalkeeper: number;
  bestFit:    Position;
}

// Full engine output
export interface GRSResult {
  // Identity
  playerName:    string;
  age:           number;
  ageGroup:      AgeGroup;
  position:      Position;
  sessionId:     string;
  sessionDate:   string;
  testedAt:      string;

  // The three scores
  aq:            number;    // 0–100
  tier:          Tier;
  domains:       DomainScores;
  pq:            PositionProfile;
  dq:            number | null;
  dqLabel:       string | null;

  // Injury risk
  balanceAsymmetry: number | null;
  injuryRiskFlag:   boolean;

  // Gamification
  rank:              PlayerRank;
  drillTierUnlocked: 1 | 2 | 3 | 4 | 5;

  // ← NEW: suggested drills — position-specific, tier-specific, max 3
  suggestedDrills: DrillSuggestion[];

  // Output text
  scoutNarrative:       string;
  coachRecommendation:  string;

  // Verification
  verifiedBy:     string;
  coachVerified:  boolean;
  testsCompleted: number;
  warnings:       string[];
  errors:         string[];
}

export interface ValidationResult {
  valid:    boolean;
  errors:   string[];
  warnings: string[];
}

export interface PastSession {
  sessionDate: string;
  aq:          number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — DRILL LIBRARY
// Real named drills from FOOTBALL_POSITION_DRILLS in page.tsx
// Organised by position and tier so the engine can suggest the right ones
// ═══════════════════════════════════════════════════════════════════════════════

type DrillEntry = { id: string; name: string; duration: string };

// Drills indexed by position then tier (1=Foundation up to 3=Elite)
// These IDs must match exactly the drill IDs in page.tsx
const DRILL_LIBRARY: Record<Position, Record<'foundation' | 'competitive' | 'elite', DrillEntry[]>> = {
  striker: {
    foundation: [
      { id: 'eng_st_01', name: "Lions' Den Central Turning",    duration: '15 mins' },
      { id: 'eng_st_02', name: 'Tri-Third Elimination End Zones', duration: '20 mins' },
    ],
    competitive: [
      { id: 'eng_st_03', name: 'Three-Goal Endline Finale',    duration: '15 mins' },
      { id: 'eng_st_04', name: 'Double Trouble Combination',   duration: '15 mins' },
    ],
    elite: [
      { id: 'eng_st_05', name: 'The Great Escape Funnel',      duration: '20 mins' },
    ],
  },
  winger: {
    // Wingers share striker drills — no winger-specific drills in current library
    foundation:  [
      { id: 'eng_st_01', name: "Lions' Den Central Turning",    duration: '15 mins' },
    ],
    competitive: [
      { id: 'eng_st_04', name: 'Double Trouble Combination',   duration: '15 mins' },
    ],
    elite: [
      { id: 'eng_st_05', name: 'The Great Escape Funnel',      duration: '20 mins' },
    ],
  },
  midfielder: {
    foundation: [
      { id: 'eng_md_02', name: 'Around the Clock Passing Ring',    duration: '12 mins' },
      { id: 'eng_md_05', name: 'Three-Channel Tight Turning',      duration: '15 mins' },
    ],
    competitive: [
      { id: 'cat_md_01', name: 'Barcelona 3-2-1 Build Up Choices', duration: '15 mins' },
      { id: 'eng_md_03', name: 'Connect Four Corner Squares',      duration: '20 mins' },
    ],
    elite: [
      { id: 'eng_md_04', name: 'Table Football Tri-Thirds Match',  duration: '25 mins' },
    ],
  },
  defender: {
    foundation: [
      { id: 'eng_df_01', name: 'Angled Pressing & Directional Dictation', duration: '15 mins' },
      { id: 'eng_df_04', name: 'Stadium Game 1v1 Marking',                duration: '15 mins' },
    ],
    competitive: [
      { id: 'eng_df_02', name: 'Cover and Recover Horizontal Channels',   duration: '15 mins' },
      { id: 'eng_df_03', name: 'Line Cover and Press 2v2',                duration: '20 mins' },
    ],
    elite: [
      { id: 'eng_df_05', name: 'Five-Section Possession Grid',            duration: '20 mins' },
    ],
  },
  goalkeeper: {
    foundation: [
      { id: 'so_gk_01', name: "Ground Side-Diving & Ball Recovery",      duration: '15 mins' },
      { id: 'so_gk_02', name: "The 'W' & 'M' Handling Fundamentals",     duration: '10 mins' },
    ],
    competitive: [
      { id: 'eng_gk_03', name: 'Circular Target-Gate Angle Coverage',    duration: '15 mins' },
      { id: 'eng_gk_04', name: 'Feeder-Attacker Isolation Guard',        duration: '15 mins' },
    ],
    elite: [
      { id: 'eng_gk_05', name: 'Asymmetric Low Block Clearing',          duration: '20 mins' },
    ],
  },
};

// Drill reasons — why each tier gets their drills
const DRILL_REASONS: Record<Tier, string> = {
  Elite:        'Your score puts you in the top tier. These drills develop elite-level technical details.',
  Competitive:  'Strong score. These drills build on your existing ability with more complex scenarios.',
  Developmental:'Good foundation. These drills focus on technique precision and pattern recognition.',
  Foundation:   'These fundamental drills build the movement and technique base for all future development.',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — NORMATIVE DATA
// Zimbabwe-calibrated age-group percentile breakpoints
// ═══════════════════════════════════════════════════════════════════════════════

type Norms = { p10: number; p25: number; p50: number; p75: number; p90: number };

const JUMP_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 15, p25: 18, p50: 22, p75: 26, p90: 30 },
  '10-12': { p10: 22, p25: 26, p50: 30, p75: 35, p90: 40 },
  '13-15': { p10: 28, p25: 33, p50: 38, p75: 44, p90: 50 },
  '16-18': { p10: 32, p25: 38, p50: 44, p75: 50, p90: 58 },
  '18+':   { p10: 35, p25: 42, p50: 48, p75: 55, p90: 62 },
};

const SPRINT_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 5.8, p25: 5.2, p50: 4.8, p75: 4.4, p90: 4.0 },
  '10-12': { p10: 4.8, p25: 4.2, p50: 3.9, p75: 3.6, p90: 3.2 },
  '13-15': { p10: 4.2, p25: 3.7, p50: 3.4, p75: 3.1, p90: 2.9 },
  '16-18': { p10: 3.9, p25: 3.4, p50: 3.1, p75: 2.9, p90: 2.7 },
  '18+':   { p10: 3.7, p25: 3.2, p50: 3.0, p75: 2.8, p90: 2.6 },
};

const BALANCE_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 14, p25: 10, p50: 7,  p75: 4,  p90: 2 },
  '10-12': { p10: 12, p25: 8,  p50: 5,  p75: 3,  p90: 1 },
  '13-15': { p10: 10, p25: 7,  p50: 4,  p75: 2,  p90: 0 },
  '16-18': { p10: 8,  p25: 5,  p50: 3,  p75: 1,  p90: 0 },
  '18+':   { p10: 7,  p25: 4,  p50: 2,  p75: 1,  p90: 0 },
};

const REACTION_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 1, p25: 2, p50: 3, p75: 4, p90: 4 },
  '10-12': { p10: 2, p25: 3, p50: 3, p75: 4, p90: 5 },
  '13-15': { p10: 2, p25: 3, p50: 4, p75: 4, p90: 5 },
  '16-18': { p10: 3, p25: 3, p50: 4, p75: 5, p90: 5 },
  '18+':   { p10: 3, p25: 4, p50: 4, p75: 5, p90: 5 },
};

const CHITIMA_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 120, p25: 100, p50: 85, p75: 70, p90: 58 },
  '10-12': { p10: 100, p25: 85,  p50: 72, p75: 60, p90: 50 },
  '13-15': { p10: 85,  p25: 72,  p50: 62, p75: 52, p90: 44 },
  '16-18': { p10: 75,  p25: 64,  p50: 55, p75: 46, p90: 40 },
  '18+':   { p10: 70,  p25: 60,  p50: 52, p75: 44, p90: 38 },
};

const BALL_MASTERY_NORMS: Record<AgeGroup, Norms> = {
  '6-9':   { p10: 5,  p25: 10, p50: 18, p75: 28, p90: 40 },
  '10-12': { p10: 10, p25: 18, p50: 28, p75: 40, p90: 52 },
  '13-15': { p10: 15, p25: 25, p50: 36, p75: 48, p90: 58 },
  '16-18': { p10: 20, p25: 32, p50: 44, p75: 54, p90: 62 },
  '18+':   { p10: 25, p25: 38, p50: 50, p75: 58, p90: 65 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — VALIDATION RANGES
// ═══════════════════════════════════════════════════════════════════════════════

const VALID_RANGES = {
  jumpHeightCm:       { min: 5,   max: 90  },
  jumpFlightTimeSec:  { min: 0.2, max: 0.9 },
  sprint20mSec:       { min: 2.5, max: 8.0 },
  balanceCorrections: { min: 0,   max: 20  },
  reactionCatchRate:  { min: 0,   max: 5   },
  reactionTimeMsec:   { min: 100, max: 800 },
  chitimaTotalSec:    { min: 30,  max: 300 },
  chitimaDegScore:    { min: 0,   max: 100 },
  jugglingSequence:   { min: 0,   max: 500 },
  turnQualityScore:   { min: 0,   max: 15  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — POSITION WEIGHTING MATRIX
// ═══════════════════════════════════════════════════════════════════════════════

const POSITION_WEIGHTS: Record<Position, Record<keyof DomainScores, number>> = {
  striker:    { explosivePower: 0.25, linearSpeed: 0.25, balance: 0.05, cognitiveSpeed: 0.10, endurance: 0.10, ballMastery: 0.25 },
  winger:     { explosivePower: 0.15, linearSpeed: 0.30, balance: 0.05, cognitiveSpeed: 0.10, endurance: 0.15, ballMastery: 0.25 },
  midfielder: { explosivePower: 0.10, linearSpeed: 0.15, balance: 0.10, cognitiveSpeed: 0.20, endurance: 0.25, ballMastery: 0.20 },
  defender:   { explosivePower: 0.20, linearSpeed: 0.20, balance: 0.15, cognitiveSpeed: 0.15, endurance: 0.15, ballMastery: 0.15 },
  goalkeeper: { explosivePower: 0.25, linearSpeed: 0.10, balance: 0.20, cognitiveSpeed: 0.25, endurance: 0.05, ballMastery: 0.15 },
};

const AQ_WEIGHTS: Record<keyof DomainScores, number> = {
  explosivePower: 0.20,
  linearSpeed:    0.20,
  balance:        0.15,
  cognitiveSpeed: 0.10,
  endurance:      0.20,
  ballMastery:    0.15,
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — KINEMATIC HELPER (NEW from evaluateBiometrics)
//
// Converts jump flight time to height using physics formula:
//   h = ½ × g × (t/2)²  =  1.226 × t²
// where g = 9.81 m/s² and t = total flight time in seconds
//
// Use this when the coach times the jump from video instead of measuring height
// ═══════════════════════════════════════════════════════════════════════════════

export function jumpFromFlightTime(flightTimeSec: number): number {
  if (flightTimeSec < 0.2 || flightTimeSec > 0.9) return 0;
  const heightM = 1.226 * Math.pow(flightTimeSec, 2);
  return Math.round(heightM * 100); // convert to cm
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — MAIN ENGINE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function evaluate(
  inputs: RawTestInputs,
  pastSessions: PastSession[] = []
): GRSResult {

  // Resolve jump height — prefer direct measurement, fall back to flight time
  const resolvedInputs = resolveJumpHeight(inputs);

  const validation = validateInputs(resolvedInputs);
  const ageGroup   = resolveAgeGroup(resolvedInputs.age);
  const domains    = calculateDomains(resolvedInputs, ageGroup);
  const aq         = calculateAQ(domains);
  const { dq, dqLabel } = calculateDQ(aq, pastSessions, resolvedInputs.sessionDate);
  const pq         = calculatePQ(domains);
  const { asymmetry, injuryRisk } = calculateBalanceAsymmetry(resolvedInputs);
  const tier       = resolveTier(aq);
  const rank       = resolveRank(aq, pastSessions.length + 1, dq);
  const drillTier  = resolveDrillTier(rank, aq);

  // NEW: select drills based on position + tier
  const suggestedDrills = selectDrills(resolvedInputs.position, tier);

  return {
    playerName:    resolvedInputs.playerName,
    age:           resolvedInputs.age,
    ageGroup,
    position:      resolvedInputs.position,
    sessionId:     generateId(),
    sessionDate:   resolvedInputs.sessionDate,
    testedAt:      new Date().toISOString(),
    aq,
    tier,
    domains,
    pq,
    dq,
    dqLabel,
    balanceAsymmetry:  asymmetry,
    injuryRiskFlag:    injuryRisk,
    rank,
    drillTierUnlocked: drillTier,
    suggestedDrills,
    scoutNarrative:      buildScoutNarrative(resolvedInputs, domains, aq, dq, pq, tier),
    coachRecommendation: buildCoachRecommendation(domains, dq, injuryRisk),
    verifiedBy:    resolvedInputs.verifiedBy,
    coachVerified: resolvedInputs.coachVerified,
    testsCompleted: countTestsCompleted(resolvedInputs),
    warnings:  validation.warnings,
    errors:    validation.errors,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — JUMP HEIGHT RESOLVER
// If jumpHeightCm is provided, use it directly.
// If only jumpFlightTimeSec is provided, convert using kinematic formula.
// ═══════════════════════════════════════════════════════════════════════════════

function resolveJumpHeight(inputs: RawTestInputs): RawTestInputs {
  if (inputs.jumpHeightCm !== undefined) return inputs;
  if (inputs.jumpFlightTimeSec !== undefined) {
    return {
      ...inputs,
      jumpHeightCm: jumpFromFlightTime(inputs.jumpFlightTimeSec),
    };
  }
  return inputs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — DOMAIN CALCULATORS
// Each returns a TestPercentile including the new rawScore display string
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDomains(inputs: RawTestInputs, ageGroup: AgeGroup): DomainScores {
  return {
    explosivePower: calculateJump(inputs.jumpHeightCm, ageGroup),
    linearSpeed:    calculateSprint(inputs.sprint20mSec, ageGroup),
    balance:        calculateBalance(inputs, ageGroup),
    cognitiveSpeed: calculateReaction(inputs, ageGroup),
    endurance:      calculateEndurance(inputs, ageGroup),
    ballMastery:    calculateBallMastery(inputs, ageGroup),
  };
}

function calculateJump(heightCm: number | undefined, ageGroup: AgeGroup): TestPercentile {
  if (heightCm === undefined) return untested();
  const pct = percentileHigherBetter(heightCm, JUMP_NORMS[ageGroup]);
  return {
    raw:        heightCm,
    rawScore:   `${heightCm}cm`,                    // ← NEW
    percentile: round(pct),
    label:      pctLabel(pct),
    tested:     true,
  };
}

function calculateSprint(timeSec: number | undefined, ageGroup: AgeGroup): TestPercentile {
  if (timeSec === undefined) return untested();
  const pct = percentileLowerBetter(timeSec, SPRINT_NORMS[ageGroup]);
  return {
    raw:        timeSec,
    rawScore:   `${timeSec.toFixed(2)}s Sprint`,    // ← NEW  e.g. "3.24s Sprint"
    percentile: round(pct),
    label:      pctLabel(pct),
    tested:     true,
  };
}

function calculateBalance(inputs: RawTestInputs, ageGroup: AgeGroup): TestPercentile {
  const vals = [
    inputs.balanceRightOpen,
    inputs.balanceLeftOpen,
    inputs.balanceRightClosed,
    inputs.balanceLeftClosed,
  ].filter((v): v is number => v !== undefined);

  if (vals.length === 0) return untested();

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const pct = percentileLowerBetter(avg, BALANCE_NORMS[ageGroup]);
  return {
    raw:        round(avg),
    rawScore:   `${round(avg)} avg corrections`,    // ← NEW
    percentile: round(pct),
    label:      pctLabel(pct),
    tested:     true,
  };
}

function calculateReaction(inputs: RawTestInputs, ageGroup: AgeGroup): TestPercentile {
  if (inputs.reactionCatchRate === undefined) return untested();

  const catchPct = percentileHigherBetter(inputs.reactionCatchRate, REACTION_NORMS[ageGroup]);
  let blendedPct = catchPct;

  if (inputs.reactionTimeMsec !== undefined) {
    const speedPct = Math.max(5, Math.min(100,
      100 - ((inputs.reactionTimeMsec - 100) / 700) * 95
    ));
    blendedPct = catchPct * 0.70 + speedPct * 0.30;
  }

  return {
    raw:        inputs.reactionCatchRate,
    rawScore:   `${inputs.reactionCatchRate}/5 catches`,  // ← NEW
    percentile: round(blendedPct),
    label:      pctLabel(blendedPct),
    tested:     true,
  };
}

function calculateEndurance(inputs: RawTestInputs, ageGroup: AgeGroup): TestPercentile {
  if (inputs.chitimaTotalSec === undefined) return untested();

  const timePct = percentileLowerBetter(inputs.chitimaTotalSec, CHITIMA_NORMS[ageGroup]);
  let finalPct  = timePct;

  if (inputs.chitimaDegScore !== undefined) {
    const degModifier = ((50 - inputs.chitimaDegScore) / 50) * 12.5;
    finalPct = Math.min(100, Math.max(5, timePct + degModifier));
  }

  const mins = Math.floor(inputs.chitimaTotalSec / 60);
  const secs = Math.round(inputs.chitimaTotalSec % 60);
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return {
    raw:        inputs.chitimaTotalSec,
    rawScore:   `${timeStr} circuit`,               // ← NEW  e.g. "1m 12s circuit"
    percentile: round(finalPct),
    label:      pctLabel(finalPct),
    tested:     true,
  };
}

function calculateBallMastery(inputs: RawTestInputs, ageGroup: AgeGroup): TestPercentile {
  if (inputs.jugglingSequence === undefined && inputs.turnQualityScore === undefined) {
    return untested();
  }

  const jugglingNorm = Math.min(50, inputs.jugglingSequence ?? 0);
  const combined     = jugglingNorm + (inputs.turnQualityScore ?? 0);
  const pct          = percentileHigherBetter(combined, BALL_MASTERY_NORMS[ageGroup]);

  return {
    raw:        combined,
    rawScore:   `${inputs.jugglingSequence ?? 0} juggles · ${inputs.turnQualityScore ?? 0}/15 turns`, // ← NEW
    percentile: round(pct),
    label:      pctLabel(pct),
    tested:     true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — DRILL SELECTOR (NEW from evaluateBiometrics concept)
// Returns 3 drills: 2 from the player's tier + 1 from the tier above
// The "one above" drill acts as an aspirational stretch goal
// ═══════════════════════════════════════════════════════════════════════════════

function selectDrills(position: Position, tier: Tier): DrillSuggestion[] {
  const tierKey: 'foundation' | 'competitive' | 'elite' =
    tier === 'Elite'         ? 'elite'
    : tier === 'Competitive' ? 'competitive'
    : 'foundation';

  const aboveTierKey: 'foundation' | 'competitive' | 'elite' =
    tierKey === 'foundation'  ? 'competitive'
    : tierKey === 'competitive' ? 'elite'
    : 'elite';

  const positionDrills  = DRILL_LIBRARY[position] ?? DRILL_LIBRARY.midfielder;
  const currentDrills   = positionDrills[tierKey]   ?? [];
  const aboveDrills     = positionDrills[aboveTierKey] ?? [];

  const reason        = DRILL_REASONS[tier];
  const stretchReason = 'Stretch goal — this drill is one level above your current tier to challenge your growth.';

  const results: DrillSuggestion[] = [];

  // Up to 2 from current tier
  currentDrills.slice(0, 2).forEach(d =>
    results.push({ id: d.id, name: d.name, duration: d.duration, reason })
  );

  // 1 stretch drill from above tier (only if not already at elite)
  if (tierKey !== 'elite' && aboveDrills.length > 0) {
    const stretch = aboveDrills[0];
    results.push({ id: stretch.id, name: stretch.name, duration: stretch.duration, reason: stretchReason });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — AQ CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateAQ(domains: DomainScores): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [domain, score] of Object.entries(domains) as [keyof DomainScores, TestPercentile][]) {
    if (!score.tested) continue;
    const weight = AQ_WEIGHTS[domain];
    weightedSum += score.percentile * weight;
    totalWeight += weight;
  }

  return totalWeight === 0 ? 0 : round(weightedSum / totalWeight);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — DQ CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculateDQ(
  currentAQ: number,
  pastSessions: PastSession[],
  currentDate: string
): { dq: number | null; dqLabel: string | null } {

  if (pastSessions.length === 0) return { dq: null, dqLabel: null };

  const sorted = [...pastSessions]
    .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
    .slice(-3);

  const sequence = [
    ...sorted.map(s => ({ date: s.sessionDate, aq: s.aq })),
    { date: currentDate, aq: currentAQ },
  ];

  const weeklyChanges: number[] = [];
  for (let i = 1; i < sequence.length; i++) {
    const daysDiff = Math.max(1,
      (new Date(sequence[i].date).getTime() - new Date(sequence[i-1].date).getTime())
      / (1000 * 60 * 60 * 24)
    );
    weeklyChanges.push(((sequence[i].aq - sequence[i-1].aq) / daysDiff) * 7);
  }

  const avgWeeklyChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length;
  const baselineAQ      = Math.max(1, sequence[0].aq);
  const dq              = round((avgWeeklyChange / baselineAQ) * 100, 1);

  const dqLabel = dq >= 3  ? 'Improving fast'
               : dq >= 1  ? 'Steady improvement'
               : dq >= -1 ? 'Stable'
               : dq >= -3 ? 'Slight decline'
               :             'Declining';

  return { dq, dqLabel };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13 — PQ CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

function calculatePQ(domains: DomainScores): PositionProfile {
  const positions: Position[] = ['striker', 'winger', 'midfielder', 'defender', 'goalkeeper'];
  const scores: Partial<Record<Position, number>> = {};

  for (const position of positions) {
    const weights = POSITION_WEIGHTS[position];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [domain, score] of Object.entries(domains) as [keyof DomainScores, TestPercentile][]) {
      if (!score.tested) continue;
      weightedSum += score.percentile * weights[domain];
      totalWeight += weights[domain];
    }

    scores[position] = totalWeight === 0 ? 0 : round(weightedSum / totalWeight);
  }

  const bestFit = positions.reduce((best, pos) =>
    (scores[pos] ?? 0) > (scores[best] ?? 0) ? pos : best
  , positions[0]);

  return {
    striker:    scores.striker    ?? 0,
    winger:     scores.winger     ?? 0,
    midfielder: scores.midfielder ?? 0,
    defender:   scores.defender   ?? 0,
    goalkeeper: scores.goalkeeper ?? 0,
    bestFit,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 14 — BALANCE ASYMMETRY
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateBalanceAsymmetry(inputs: RawTestInputs): {
  asymmetry: number | null;
  injuryRisk: boolean;
} {
  const rightTotal = (inputs.balanceRightOpen ?? 0) + (inputs.balanceRightClosed ?? 0);
  const leftTotal  = (inputs.balanceLeftOpen  ?? 0) + (inputs.balanceLeftClosed  ?? 0);

  const rightHasData = inputs.balanceRightOpen !== undefined || inputs.balanceRightClosed !== undefined;
  const leftHasData  = inputs.balanceLeftOpen  !== undefined || inputs.balanceLeftClosed  !== undefined;

  if (!rightHasData || !leftHasData) return { asymmetry: null, injuryRisk: false };

  const total = rightTotal + leftTotal;
  if (total === 0) return { asymmetry: 0, injuryRisk: false };

  const worse     = Math.max(rightTotal, leftTotal);
  const better    = Math.min(rightTotal, leftTotal);
  const asymmetry = better === 0 ? 100 : round(((worse - better) / worse) * 100);

  return { asymmetry, injuryRisk: asymmetry > 25 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 15 — TIER / RANK / DRILL TIER
// ═══════════════════════════════════════════════════════════════════════════════

function resolveTier(aq: number): Tier {
  if (aq >= 80) return 'Elite';
  if (aq >= 60) return 'Competitive';
  if (aq >= 35) return 'Developmental';
  return 'Foundation';
}

function resolveRank(aq: number, totalSessions: number, dq: number | null): PlayerRank {
  if (aq >= 75 && totalSessions >= 26 && dq !== null && dq > 0) return 'Lion';
  if (aq >= 60 && totalSessions >= 24 && dq !== null && dq > 0) return 'Star';
  if (aq >= 40 && totalSessions >= 16 && dq !== null)           return 'Attacker';
  if (totalSessions >= 8  && dq !== null && dq > 0)             return 'Skilled';
  if (totalSessions >= 4)                                        return 'Player';
  return 'Rookie';
}

function resolveDrillTier(rank: PlayerRank, aq: number): 1 | 2 | 3 | 4 | 5 {
  if (rank === 'Lion' || rank === 'Star')  return 5;
  if (rank === 'Attacker' && aq >= 40)    return 4;
  if (rank === 'Skilled')                 return 3;
  if (rank === 'Player')                  return 2;
  return 1;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 16 — VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export function validateInputs(inputs: RawTestInputs): ValidationResult {
  const errors:   string[] = [];
  const warnings: string[] = [];

  const check = (val: number | undefined, field: keyof typeof VALID_RANGES, label: string) => {
    if (val === undefined) return;
    const { min, max } = VALID_RANGES[field];
    if (val < min || val > max)
      errors.push(`${label}: ${val} is outside the valid range (${min}–${max}). Please re-test.`);
  };

  check(inputs.jumpHeightCm,       'jumpHeightCm',       'T1 Jump height (cm)');
  check(inputs.jumpFlightTimeSec,  'jumpFlightTimeSec',  'T1 Jump flight time (sec)');
  check(inputs.sprint20mSec,       'sprint20mSec',       'T2 Sprint time');
  check(inputs.balanceRightOpen,   'balanceCorrections', 'T3 Right leg eyes-open');
  check(inputs.balanceLeftOpen,    'balanceCorrections', 'T3 Left leg eyes-open');
  check(inputs.balanceRightClosed, 'balanceCorrections', 'T3 Right leg eyes-closed');
  check(inputs.balanceLeftClosed,  'balanceCorrections', 'T3 Left leg eyes-closed');
  check(inputs.reactionCatchRate,  'reactionCatchRate',  'T4 Catch rate');
  check(inputs.reactionTimeMsec,   'reactionTimeMsec',   'T4 Reaction time');
  check(inputs.chitimaTotalSec,    'chitimaTotalSec',    'T5 Circuit time');
  check(inputs.chitimaDegScore,    'chitimaDegScore',    'T5 Degradation score');
  check(inputs.jugglingSequence,   'jugglingSequence',   'T6 Juggling sequence');
  check(inputs.turnQualityScore,   'turnQualityScore',   'T6 Turn quality');

  if (inputs.reactionCatchRate !== undefined || inputs.reactionTimeMsec !== undefined) {
    warnings.push(
      'T4 Reaction: presented as cognitive speed indicator only. ' +
      'Research shows simple reaction time does not reliably separate elite from sub-elite players.'
    );
  }

  if (resolveAgeGroup(inputs.age) === '6-9') {
    if (inputs.sprint20mSec !== undefined || inputs.chitimaTotalSec !== undefined) {
      warnings.push(
        'Sprint and circuit tests are not reliable for ages 6–9. ' +
        'Scores recorded but excluded from AQ calculation for this age group.'
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 17 — NARRATIVE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function buildScoutNarrative(
  inputs: RawTestInputs,
  domains: DomainScores,
  aq: number,
  dq: number | null,
  pq: PositionProfile,
  tier: Tier
): string {
  const ageGroup = resolveAgeGroup(inputs.age);

  const domainDescriptions: Record<keyof DomainScores, string> = {
    explosivePower: 'explosive jump power',
    linearSpeed:    'linear sprint speed',
    balance:        'balance and body control',
    cognitiveSpeed: 'cognitive reaction speed',
    endurance:      'endurance and fitness engine',
    ballMastery:    'natural ball relationship',
  };

  const tested = Object.entries(domains)
    .filter(([, v]) => (v as TestPercentile).tested)
    .sort(([, a], [, b]) => (b as TestPercentile).percentile - (a as TestPercentile).percentile);

  const strongest = tested[0]?.[0] as keyof DomainScores | undefined;
  const second    = tested[1]?.[0] as keyof DomainScores | undefined;

  const lines: string[] = [
    `${inputs.playerName} (${inputs.age} years, age group ${ageGroup}) presents as a ${tier.toLowerCase()}-tier athlete with an Athletic Quotient of ${aq}/100.`,
  ];

  if (strongest)
    lines.push(`Primary strength: ${domainDescriptions[strongest]} (${domains[strongest].percentile}th percentile for this age group).`);

  if (second)
    lines.push(`Secondary strength: ${domainDescriptions[second]} (${domains[second].percentile}th percentile).`);

  lines.push(
    `Best position match: ${capitalise(pq.bestFit)} (PQ ${pq[pq.bestFit]}/100). ` +
    `Full profile: Striker ${pq.striker} · Winger ${pq.winger} · Midfielder ${pq.midfielder} · Defender ${pq.defender} · Goalkeeper ${pq.goalkeeper}.`
  );

  if (dq !== null) {
    const dqDesc = dq >= 3 ? 'improving rapidly' : dq >= 1 ? 'showing steady improvement' : dq >= -1 ? 'stable' : 'showing a decline that warrants attention';
    lines.push(`Development rate (DQ): ${dq > 0 ? '+' : ''}${dq}% per week — ${dqDesc}. This is the most reliable indicator of future potential.`);
  } else {
    lines.push('Development rate (DQ): First session. Return weekly to establish trajectory.');
  }

  lines.push(
    tier === 'Elite' || tier === 'Competitive'
      ? 'Recommended for consideration at a regional GRS talent identification event.'
      : 'Recommended for continued development through the GRS drill curriculum.'
  );

  return lines.join(' ');
}

function buildCoachRecommendation(
  domains: DomainScores,
  dq: number | null,
  injuryRisk: boolean
): string {
  const drillFocus: Record<keyof DomainScores, string> = {
    explosivePower: 'plyometric and explosive jump training',
    linearSpeed:    'sprint mechanics and acceleration drills',
    balance:        'single-leg stability and proprioception work',
    cognitiveSpeed: 'reaction and decision-speed drills',
    endurance:      'aerobic intervals and circuit training',
    ballMastery:    'ball touches — juggling, turns, and close control',
  };

  const lines: string[] = [];

  const weakest = Object.entries(domains)
    .filter(([, v]) => (v as TestPercentile).tested)
    .sort(([, a], [, b]) => (a as TestPercentile).percentile - (b as TestPercentile).percentile)[0]?.[0] as keyof DomainScores | undefined;

  if (weakest) lines.push(`Focus area this week: ${drillFocus[weakest]}.`);

  if (injuryRisk)
    lines.push('Injury risk flag: left-right balance asymmetry above 25%. Prioritise single-leg stability on the weaker side before high-intensity work.');

  if (dq !== null && dq < -1)
    lines.push('Performance declining across recent sessions. Consider reducing training load — possible overtraining or fatigue.');

  if (dq !== null && dq >= 3)
    lines.push('Excellent improvement trajectory. Maintain current training approach.');

  return lines.join(' ') || 'Continue with current training programme.';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 18 — PERCENTILE INTERPOLATION
// ═══════════════════════════════════════════════════════════════════════════════

function percentileLowerBetter(val: number, norms: Norms): number {
  if (val <= norms.p90) return Math.min(100, 90 + ((norms.p90 - val) / Math.max(0.01, norms.p90)) * 10);
  if (val <= norms.p75) return lerp(val, norms.p90, norms.p75, 75, 90);
  if (val <= norms.p50) return lerp(val, norms.p75, norms.p50, 50, 75);
  if (val <= norms.p25) return lerp(val, norms.p50, norms.p25, 25, 50);
  if (val <= norms.p10) return lerp(val, norms.p25, norms.p10, 10, 25);
  return 5;
}

function percentileHigherBetter(val: number, norms: Norms): number {
  if (val >= norms.p90) return Math.min(100, 90 + ((val - norms.p90) / Math.max(0.01, norms.p90)) * 10);
  if (val >= norms.p75) return lerp(val, norms.p75, norms.p90, 75, 90);
  if (val >= norms.p50) return lerp(val, norms.p50, norms.p75, 50, 75);
  if (val >= norms.p25) return lerp(val, norms.p25, norms.p50, 25, 50);
  if (val >= norms.p10) return lerp(val, norms.p10, norms.p25, 10, 25);
  return 5;
}

function lerp(val: number, lo: number, hi: number, pLo: number, pHi: number): number {
  if (hi === lo) return pLo;
  return Math.min(pHi, Math.max(pLo, pLo + ((val - lo) / (hi - lo)) * (pHi - pLo)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 19 — UTILITIES AND CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function resolveAgeGroup(age: number): AgeGroup {
  if (age <= 9)  return '6-9';
  if (age <= 12) return '10-12';
  if (age <= 15) return '13-15';
  if (age <= 18) return '16-18';
  return '18+';
}

export function isPlausible(field: keyof typeof VALID_RANGES, value: number): boolean {
  const r = VALID_RANGES[field];
  return value >= r.min && value <= r.max;
}

export function getNormsForAge(age: number) {
  const ag = resolveAgeGroup(age);
  return { ageGroup: ag, jump: JUMP_NORMS[ag], sprint: SPRINT_NORMS[ag], balance: BALANCE_NORMS[ag], reaction: REACTION_NORMS[ag], chitima: CHITIMA_NORMS[ag], ball: BALL_MASTERY_NORMS[ag] };
}

export function quickAQ(inputs: Partial<RawTestInputs> & { age: number }): number {
  const resolved = resolveJumpHeight(inputs as RawTestInputs);
  const ag       = resolveAgeGroup(resolved.age);
  return calculateAQ(calculateDomains(resolved, ag));
}


function untested(): TestPercentile {
  return { raw: 0, rawScore: '—', percentile: 0, label: 'not tested', tested: false };
}

function pctLabel(pct: number): string {
  if (pct >= 90) return 'top 10%';
  if (pct >= 75) return 'top 25%';
  if (pct >= 50) return 'above average';
  if (pct >= 25) return 'below average';
  return 'bottom 25%';
}

function round(n: number, decimals = 0): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}