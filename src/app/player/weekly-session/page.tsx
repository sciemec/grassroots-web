'use client';
// src/app/player/weekly-session/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Weekly Session Orchestrator
//
// Wires together session-manager.ts (state machine) and screens.tsx (UI).
// Flow: setup → t1_jump → rest → t2_sprint → rest → ... → t6_ball → results
//
// Key decisions:
//   - Rest screens are local state (not session-manager state) — no TestId for rest
//   - Pre-advance values are captured from the state closure BEFORE setState fires,
//     so rest-detection always sees the correct completed test
//   - React 18 batching: SetupScreen calls onUpdate then onAdvance in one event;
//     functional updaters chain, so handleAdvance's setState sees config written
//     by handleUpdate's updater
//   - localStorage is auto-saved on every state change via saveSession()
//   - Resuming: if saved session has config + currentTest !== 'setup', prompt user
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  createInitialState,
  loadSession,
  saveSession,
  clearSession,
  submitSession,
  getNextTest,
  getPrevTest,
  type SessionState,
  type SessionPartials,
  type TestId,
} from '@/lib/session-manager';
import { SessionHeader } from '@/components/session/shared';
import {
  SetupScreen,
  JumpScreen,
  SprintScreen,
  BalanceScreen,
  ReactionScreen,
  ChitimaScreen,
  BallScreen,
  ResultsScreen,
} from '@/components/session/screens';

// ── Colour tokens ─────────────────────────────────────────────────────────────
const BG      = '#1a1a1a';
const CARD    = '#242424';
const BORDER  = '#333';
const TEXT    = '#e5e5e5';
const MUTED   = '#888';
const GREEN   = '#1c3d22';
const GREEN_B = '#2d5c35';
const GOLD    = '#c8962a';

// ── Human-readable test labels ────────────────────────────────────────────────
const TEST_LABELS: Record<string, string> = {
  t1_jump:       'T1 — Vertical Jump',
  t2_sprint:     'T2 — Sprint',
  t3_balance:    'T3 — Balance',
  t4_reaction:   'T4 — Reaction',
  t5_endurance:  'T5 — Endurance (Chitima)',
  t6_ball:       'T6 — Ball Mastery',
};

// ── REST SCREEN ───────────────────────────────────────────────────────────────
// 60-second countdown between tests. Auto-advances when timer hits 0.

interface RestScreenProps {
  completedTest: TestId;
  nextTest:      TestId;
  onContinue:    () => void;
}

function RestScreen({ completedTest, nextTest, onContinue }: RestScreenProps) {
  const [sec, setSec] = useState(60);

  useEffect(() => {
    if (sec <= 0) { onContinue(); return; }
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec, onContinue]);

  const pct = Math.round(((60 - sec) / 60) * 100);

  return (
    <div style={{
      background: BG, color: TEXT, minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px', textAlign: 'center',
    }}>
      {/* Completed badge */}
      <div style={{
        background: GREEN, border: `1px solid ${GREEN_B}`,
        borderRadius: 12, padding: '10px 20px', marginBottom: 28,
        fontSize: 13, color: '#4ade80', fontWeight: 600,
      }}>
        ✓ {TEST_LABELS[completedTest] ?? completedTest} complete
      </div>

      {/* Countdown ring */}
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 28 }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={60} fill="none" stroke={CARD} strokeWidth={8} />
          <circle
            cx={70} cy={70} r={60}
            fill="none" stroke={GOLD} strokeWidth={8}
            strokeDasharray={`${2 * Math.PI * 60}`}
            strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: GOLD, lineHeight: 1 }}>
            {sec}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>seconds</div>
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Rest</div>
      <div style={{ fontSize: 13, color: MUTED, marginBottom: 28, maxWidth: 280 }}>
        Shake out your legs. Get ready for the next test.
      </div>

      {/* Next test preview */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: '12px 20px', marginBottom: 28,
        fontSize: 13, color: MUTED,
      }}>
        Next up: <span style={{ color: TEXT, fontWeight: 600 }}>
          {TEST_LABELS[nextTest] ?? nextTest}
        </span>
      </div>

      <button
        onClick={onContinue}
        style={{
          padding: '12px 32px', borderRadius: 12,
          border: `1px solid ${BORDER}`, background: CARD,
          color: TEXT, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Skip rest — go now
      </button>
    </div>
  );
}

// ── RESUME BANNER ─────────────────────────────────────────────────────────────
// Shown on mount when a paused session is found in localStorage.

interface ResumeBannerProps {
  playerName:  string;
  currentTest: TestId;
  onContinue:  () => void;
  onDiscard:   () => void;
}

function ResumeBanner({ playerName, currentTest, onContinue, onDiscard }: ResumeBannerProps) {
  return (
    <div style={{
      background: BG, color: TEXT, minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>⏸</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Session paused</div>
      <div style={{ fontSize: 14, color: MUTED, marginBottom: 28 }}>
        {playerName}&rsquo;s session is in progress.
      </div>
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: '14px 20px', marginBottom: 28, fontSize: 13,
      }}>
        Resuming at:{' '}
        <span style={{ color: GOLD, fontWeight: 600 }}>
          {TEST_LABELS[currentTest] ?? currentTest}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        <button
          onClick={onContinue}
          style={{
            padding: '14px', borderRadius: 12, border: 'none',
            background: GREEN_B, color: '#4ade80',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Continue session
        </button>
        <button
          onClick={onDiscard}
          style={{
            padding: '12px', borderRadius: 12,
            border: `1px solid ${BORDER}`, background: 'none',
            color: MUTED, fontSize: 13, cursor: 'pointer',
          }}
        >
          Start fresh — discard saved session
        </button>
      </div>
    </div>
  );
}

// ── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────────

export default function WeeklySessionPage() {
  const [state,       setState]       = useState<SessionState>(createInitialState);
  const [restAfter,   setRestAfter]   = useState<TestId | null>(null);
  const [resumeState, setResumeState] = useState<SessionState | null>(null);
  const [loaded,      setLoaded]      = useState(false);

  // ── Restore saved session on mount ────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (
      saved?.config &&
      saved.currentTest !== 'setup' &&
      saved.currentTest !== 'results'
    ) {
      setResumeState(saved);
    }
    setLoaded(true);
  }, []);

  // ── Update any field on SessionState (used by SetupScreen for config) ─────
  const handleUpdate = useCallback((patch: Partial<SessionState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  // ── Advance to next test ───────────────────────────────────────────────────
  // Pre-advance values are captured from the state closure BEFORE setState fires.
  // This is safe because:
  //   - SetupScreen: preAdvanceTest === 'setup' → rest branch never entered
  //   - All other screens: state.config is already set; pre-advance values are correct
  const handleAdvance = useCallback((partials: Partial<SessionPartials> = {}) => {
    // Capture pre-advance state from closure BEFORE the setState call
    const preTest   = state.currentTest;
    const preCfg    = state.config;

    setState(prev => {
      const cfg = prev.config;
      if (!cfg) return prev;

      const newPartials   = { ...prev.partials, ...partials };
      const newCompleted  =
        prev.currentTest !== 'setup' && prev.currentTest !== 'results'
          ? [...prev.completedTests, prev.currentTest]
          : prev.completedTests;
      const nextTest = getNextTest(prev.currentTest, cfg.activeTests);

      let result = prev.result;
      if (nextTest === 'results') {
        result = submitSession({ ...prev, partials: newPartials, completedTests: newCompleted });
      }

      const newState: SessionState = {
        ...prev,
        partials:       newPartials,
        completedTests: newCompleted,
        currentTest:    nextTest,
        result,
      };
      saveSession(newState);
      return newState;
    });

    // Decide whether to show rest screen using the pre-advance values
    if (
      preCfg &&
      preTest !== 'setup' &&
      preTest !== 'results'
    ) {
      const nextTest = getNextTest(preTest, preCfg.activeTests);
      if (nextTest !== 'results') {
        setRestAfter(preTest);
      }
    }
  }, [state]); // depends on state so closure captures current values

  // ── Go back one test ──────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setRestAfter(null);
    setState(prev => {
      if (!prev.config) return prev;
      const prevTest     = getPrevTest(prev.currentTest, prev.config.activeTests);
      if (prevTest === prev.currentTest) return prev;
      const newCompleted = prev.completedTests.filter(t => t !== prevTest);
      const newState: SessionState = {
        ...prev,
        currentTest:    prevTest,
        completedTests: newCompleted,
        result:         null,
      };
      saveSession(newState);
      return newState;
    });
  }, []);

  // ── Skip the current test ─────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    setState(prev => {
      const cfg = prev.config;
      if (!cfg) return prev;
      const newSkipped = [...prev.skippedTests, prev.currentTest];
      const nextTest   = getNextTest(prev.currentTest, cfg.activeTests);

      let result = prev.result;
      if (nextTest === 'results') {
        result = submitSession({ ...prev, skippedTests: newSkipped });
      }

      const newState: SessionState = {
        ...prev,
        skippedTests: newSkipped,
        currentTest:  nextTest,
        result,
      };
      saveSession(newState);
      return newState;
    });
    setRestAfter(null);
  }, []);

  // ── Reset to a fresh session ──────────────────────────────────────────────
  const handleReset = useCallback(() => {
    clearSession();
    setRestAfter(null);
    setResumeState(null);
    setState(createInitialState());
  }, []);

  // ── Guard: wait for localStorage hydration ────────────────────────────────
  if (!loaded) return null;

  // ── Resume prompt ─────────────────────────────────────────────────────────
  if (resumeState) {
    return (
      <ResumeBanner
        playerName={resumeState.config!.playerName}
        currentTest={resumeState.currentTest}
        onContinue={() => {
          setState(resumeState);
          setResumeState(null);
        }}
        onDiscard={handleReset}
      />
    );
  }

  // ── Rest screen ───────────────────────────────────────────────────────────
  if (restAfter) {
    return (
      <RestScreen
        completedTest={restAfter}
        nextTest={state.currentTest}
        onContinue={() => setRestAfter(null)}
      />
    );
  }

  // ── Shared props for all test screens ─────────────────────────────────────
  const screenProps = {
    state,
    onAdvance: handleAdvance,
    onBack:    handleBack,
    onSkip:    handleSkip,
    onUpdate:  handleUpdate,
  };

  // ── Results page wrapper — adds "New session" button ─────────────────────
  if (state.currentTest === 'results') {
    return (
      <div style={{ background: BG, minHeight: '100vh' }}>
        <ResultsScreen {...screenProps} />
        <div style={{ padding: '0 16px 40px' }}>
          <button
            onClick={handleReset}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: `1px solid ${BORDER}`, background: CARD,
              color: TEXT, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← Test another player
          </button>
        </div>
      </div>
    );
  }

  // ── Active session render ─────────────────────────────────────────────────
  const showHeader = state.currentTest !== 'setup';

  return (
    <div style={{ background: BG, minHeight: '100vh' }}>
      {showHeader && <SessionHeader state={state} />}

      {state.currentTest === 'setup'        && <SetupScreen    {...screenProps} />}
      {state.currentTest === 't1_jump'      && <JumpScreen     {...screenProps} />}
      {state.currentTest === 't2_sprint'    && <SprintScreen   {...screenProps} />}
      {state.currentTest === 't3_balance'   && <BalanceScreen  {...screenProps} />}
      {state.currentTest === 't4_reaction'  && <ReactionScreen {...screenProps} />}
      {state.currentTest === 't5_endurance' && <ChitimaScreen  {...screenProps} />}
      {state.currentTest === 't6_ball'      && <BallScreen     {...screenProps} />}
    </div>
  );
}
