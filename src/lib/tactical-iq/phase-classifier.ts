// src/lib/tactical-iq/phase-classifier.ts
// ─────────────────────────────────────────────────────────────────────────────
// Converts a chronological match event log into the 3-phase framework:
//   Phase 1 — Regaining Possession
//   Phase 2 — Building the Attack
//   Phase 3 — Finishing
//
// This is the core "education, not broadcasting" transformation. The same
// event data that LiveCommentary.tsx narrates in real time gets reorganised
// here into a structure built for analysis, not consumption.
// ─────────────────────────────────────────────────────────────────────────────

export interface MatchEvent {
  id:          string;
  minute:      number;
  eventType:   string;   // 'GOAL' | 'TACKLE' | 'INTERCEPTION' | 'PASS' | 'SHOT' | 'TURNOVER' | etc.
  team:        'home' | 'away';
  player?:     string;
  zone:        'defensive_third' | 'middle_third' | 'attacking_third';
  outcome:     'success' | 'failure'; // did the team retain/progress the ball
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots:      { home: number; away: number };
}

export interface PhaseSummary {
  events:       MatchEvent[];
  successRate:  number;  // 0-100, % of events in this phase that succeeded
  dominantTeam: 'home' | 'away' | 'even';
}

export interface PhaseReport {
  regain: PhaseSummary;
  build:  PhaseSummary;
  finish: PhaseSummary;
}

// ── Event type → phase mapping ────────────────────────────────────────────────
// This is the heart of the classification. Each raw event type from the match
// feed gets assigned to exactly one of the 3 phases based on what it represents
// tactically, not chronologically.
const PHASE_MAP: Record<string, keyof PhaseReport> = {
  // Phase 1 — Regaining Possession: anything about winning the ball back
  TACKLE:        'regain',
  INTERCEPTION:  'regain',
  TURNOVER:      'regain',
  BLOCK:         'regain',
  CLEARANCE:     'regain',

  // Phase 2 — Building the Attack: anything about progressing the ball forward
  PASS:          'build',
  DRIBBLE:       'build',
  CROSS:         'build',
  THROUGH_BALL:  'build',
  SWITCH_PLAY:   'build',

  // Phase 3 — Finishing: anything in or around the final third aiming at goal
  SHOT:          'finish',
  GOAL:          'finish',
  HEADER:        'finish',
  PENALTY:       'finish',
};

export function classifyPhases(
  events: MatchEvent[],
  stats:  MatchStats,
): PhaseReport {
  const byPhase: Record<keyof PhaseReport, MatchEvent[]> = {
    regain: [],
    build:  [],
    finish: [],
  };

  // Sort every event into its phase
  for (const event of events) {
    const phase = PHASE_MAP[event.eventType.toUpperCase()];
    if (phase) byPhase[phase].push(event);
  }

  return {
    regain: summarisePhase(byPhase.regain),
    build:  summarisePhase(byPhase.build),
    finish: summarisePhase(byPhase.finish),
  };
}

function summarisePhase(events: MatchEvent[]): PhaseSummary {
  if (events.length === 0) {
    return { events: [], successRate: 0, dominantTeam: 'even' };
  }

  const successCount = events.filter(e => e.outcome === 'success').length;
  const successRate  = Math.round((successCount / events.length) * 100);

  const homeCount = events.filter(e => e.team === 'home').length;
  const awayCount = events.length - homeCount;
  const dominantTeam =
    homeCount > awayCount * 1.3 ? 'home' :
    awayCount > homeCount * 1.3 ? 'away' :
    'even';

  return { events, successRate, dominantTeam };
}

// ── Helper for the report UI — generates the question text the brainstorm
//    specifically called out as the model to follow
export function buildPhaseQuestion(phase: keyof PhaseReport, summary: PhaseSummary): string {
  const failRate = 100 - summary.successRate;

  switch (phase) {
    case 'regain':
      return failRate > 50
        ? `In the Regaining Possession phase, the team lost the ball back ${failRate}% of the time. What does this tell you about defensive shape?`
        : `The team regained possession cleanly ${summary.successRate}% of the time. What pressing pattern made this work?`;
    case 'build':
      return failRate > 50
        ? `${failRate}% of build-up attempts broke down before reaching the final third. Where in the pitch did most of these breakdowns happen?`
        : `${summary.successRate}% of build-up sequences progressed the ball forward. What passing patterns created the most progress?`;
    case 'finish':
      return summary.events.length === 0
        ? `No clear finishing opportunities were created. What needed to happen in the Build phase to generate more chances?`
        : `Out of ${summary.events.length} finishing attempts, ${summary.successRate}% were on target. What separates a good chance from a wasted one?`;
  }
}