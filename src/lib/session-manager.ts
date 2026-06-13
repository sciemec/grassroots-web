// lib/session-manager.ts
// ─────────────────────────────────────────────────────────────────────────────
// GRS Weekly Session Manager
//
// Controls the flow through all 6 tests in a session.
// Holds partial results as the coach completes each test.
// A session can be paused and resumed — state is stored in localStorage.
// When all tests are done (or coach manually submits), calls evaluate().
// ─────────────────────────────────────────────────────────────────────────────

import {
  evaluate,
  resolveAgeGroup,
  type RawTestInputs,
  type GRSResult,
  type Position,
  type Gender,
  type PastSession,
} from './grs-engine';

// ── Test IDs in run order ─────────────────────────────────────────────────────
export type TestId =
  | 'setup'
  | 't1_jump'
  | 't2_sprint'
  | 't3_balance'
  | 't4_reaction'
  | 't5_endurance'
  | 't6_ball'
  | 'results';

export const TEST_ORDER: TestId[] = [
  'setup',
  't1_jump',
  't2_sprint',
  't3_balance',
  't4_reaction',
  't5_endurance',
  't6_ball',
  'results',
];

// ── Session config (set on setup screen) ─────────────────────────────────────
export interface SessionConfig {
  playerName:    string;
  age:           number;
  gender?:       Gender;
  position:      Position;
  sessionDate:   string;
  verifiedBy:    string;
  coachVerified: boolean;
  // Which tests to run (coach can skip tests not available today)
  activeTests:   TestId[];
}

// ── Partial results collected test by test ───────────────────────────────────
export interface SessionPartials {
  // T1
  jumpHeightCm?:       number;
  jumpFlightTimeSec?:  number;
  jumpMethod?:         'measure' | 'video_time'; // which input method was used

  // T2
  sprint20mSec?:       number;

  // T3
  balanceRightOpen?:   number;
  balanceLeftOpen?:    number;
  balanceRightClosed?: number;
  balanceLeftClosed?:  number;

  // T4
  reactionCatchRate?:  number;
  reactionTimeMsec?:   number;

  // T5
  enduranceTotalSec?:    number;
  enduranceDegScore?:    number;
  enduranceRound1Quality?: number; // 1–5 coach rating
  enduranceRound3Quality?: number; // 1–5 coach rating

  // T6
  jugglingSequence?:   number;
  turnQualityScore?:   number;
}

// ── Full session state ────────────────────────────────────────────────────────
export interface SessionState {
  sessionId:       string;
  config:          SessionConfig | null;
  currentTest:     TestId;
  partials:        SessionPartials;
  completedTests:  TestId[];
  skippedTests:    TestId[];
  startedAt:       string | null;
  result:          GRSResult | null;
  pastSessions:    PastSession[];
}

// ── Initial state ─────────────────────────────────────────────────────────────
export function createInitialState(): SessionState {
  return {
    sessionId:      crypto.randomUUID?.() ?? Date.now().toString(),
    config:         null,
    currentTest:    'setup',
    partials:       {},
    completedTests: [],
    skippedTests:   [],
    startedAt:      null,
    result:         null,
    pastSessions:   [],
  };
}

// ── Navigation helpers ────────────────────────────────────────────────────────
export function getNextTest(
  current: TestId,
  activeTests: TestId[],
): TestId {
  const order = TEST_ORDER.filter(t => t === 'setup' || t === 'results' || activeTests.includes(t));
  const idx   = order.indexOf(current);
  return order[idx + 1] ?? 'results';
}

export function getPrevTest(
  current: TestId,
  activeTests: TestId[],
): TestId {
  const order = TEST_ORDER.filter(t => t === 'setup' || t === 'results' || activeTests.includes(t));
  const idx   = order.indexOf(current);
  return order[Math.max(0, idx - 1)];
}

export function getTestProgress(
  current: TestId,
  activeTests: TestId[],
): { current: number; total: number } {
  const tests = activeTests.filter(t => t !== 'setup' && t !== 'results');
  const idx   = tests.indexOf(current as typeof tests[number]);
  return { current: idx + 1, total: tests.length };
}

// ── Build RawTestInputs from completed session ────────────────────────────────
export function buildInputs(config: SessionConfig, partials: SessionPartials): RawTestInputs {
  // Calculate technique degradation from coach quality ratings
  let enduranceDegScore: number | undefined;
  if (
    partials.enduranceRound1Quality !== undefined &&
    partials.enduranceRound3Quality !== undefined
  ) {
    // Degradation = how much quality dropped from round 1 to round 3
    // Quality scale 1–5. If round1=5 and round3=3, degradation = (2/4)*100 = 50
    const drop = partials.enduranceRound1Quality - partials.enduranceRound3Quality;
    const maxPossibleDrop = partials.enduranceRound1Quality - 1;
    enduranceDegScore = maxPossibleDrop <= 0
      ? 0
      : Math.round((Math.max(0, drop) / maxPossibleDrop) * 100);
  }

  return {
    playerName:    config.playerName,
    age:           config.age,
    gender:        config.gender ?? 'male',
    position:      config.position,
    sessionDate:   config.sessionDate,
    verifiedBy:    config.verifiedBy,
    coachVerified: config.coachVerified,
    jumpHeightCm:      partials.jumpHeightCm,
    jumpFlightTimeSec: partials.jumpMethod === 'video_time' ? partials.jumpFlightTimeSec : undefined,
    sprint20mSec:      partials.sprint20mSec,
    balanceRightOpen:   partials.balanceRightOpen,
    balanceLeftOpen:    partials.balanceLeftOpen,
    balanceRightClosed: partials.balanceRightClosed,
    balanceLeftClosed:  partials.balanceLeftClosed,
    reactionCatchRate:  partials.reactionCatchRate,
    reactionTimeMsec:   partials.reactionTimeMsec,
    chitimaTotalSec:    partials.enduranceTotalSec,
    chitimaDegScore:    enduranceDegScore,
    jugglingSequence:   partials.jugglingSequence,
    turnQualityScore:   partials.turnQualityScore,
  };
}

// ── Run the engine on completed session ───────────────────────────────────────
export function submitSession(state: SessionState): GRSResult | null {
  if (!state.config) return null;
  const inputs = buildInputs(state.config, state.partials);
  return evaluate(inputs, state.pastSessions);
}

// ── localStorage persistence ──────────────────────────────────────────────────
const STORAGE_KEY = 'grs_active_session';

export function saveSession(state: SessionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage unavailable */ }
}

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}