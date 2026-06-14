'use client';
// src/app/player/session/page.tsx  (or src/app/player/talent-id/page.tsx)
// ─────────────────────────────────────────────────────────────────────────────
// GRS Weekly Test Session — main orchestrator page
//
// SCREEN FLOW:
//   setup → t1_jump → REST → t2_sprint → REST → t3_balance → REST
//         → t4_reaction → REST → t5_chitima → REST → t6_ball → results
//
// REST SCREEN appears automatically between every test:
//   - 60-second countdown
//   - Shows completed value
//   - Shows next test equipment + setup tip
//   - THUTO/Amara coaching tip for next test
//   - "Start [test]" button — only enabled when timer done
//
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';
import { SetupScreen }    from '@/components/session/screens';
import { JumpScreen }     from '@/components/session/screens';
import { SprintScreen }   from '@/components/session/screens';
import { BalanceScreen }  from '@/components/session/screens';
import { ReactionScreen } from '@/components/session/screens';
import { ChitimaScreen }  from '@/components/session/screens';
import { BallScreen }     from '@/components/session/screens';
import { ResultsScreen }  from '@/components/session/screens';
import RestScreen         from '@/components/session/RestScreen';
import {
  createInitialState, submitSession, saveSession,
  type SessionState, type TestId,
} from '@/lib/session-manager';

// ── Screen types — interleaved tests and rest screens ────────────────────────
type ScreenId =
  | 'setup'
  | 't1_jump'       | 'rest_after_t1'
  | 't2_sprint'     | 'rest_after_t2'
  | 't3_balance'    | 'rest_after_t3'
  | 't4_reaction'   | 'rest_after_t4'
  | 't5_chitima'    | 'rest_after_t5'
  | 't6_ball'
  | 'results';

const SCREEN_SEQUENCE: ScreenId[] = [
  'setup',
  't1_jump',       'rest_after_t1',
  't2_sprint',     'rest_after_t2',
  't3_balance',    'rest_after_t3',
  't4_reaction',   'rest_after_t4',
  't5_chitima',    'rest_after_t5',
  't6_ball',
  'results',
];

// Map each test screen to the test that comes next (used by RestScreen)
const NEXT_TEST: Record<string, TestId> = {
  't1_jump':   't2_sprint',
  't2_sprint':  't3_balance',
  't3_balance': 't4_reaction',
  't4_reaction':'t5_chitima',
  't5_chitima': 't6_ball',
};

// Human-readable value from partials for the "just finished" card in RestScreen
function completedValueLabel(testId: string, state: SessionState): string {
  const p = state.partials;
  switch (testId) {
    case 't1_jump':
      if (p.jumpHeightCm)     return `${p.jumpHeightCm} cm`;
      if (p.jumpFlightTimeSec) return `${p.jumpFlightTimeSec} sec`;
      return 'Recorded';
    case 't2_sprint':
      return p.sprintSec ? `${p.sprintSec} sec` : 'Recorded';
    case 't3_balance':
      return (p.balanceRightOpen !== undefined)
        ? `R: ${(p.balanceRightOpen ?? 0) + (p.balanceRightClosed ?? 0)} · L: ${(p.balanceLeftOpen ?? 0) + (p.balanceLeftClosed ?? 0)} corrections`
        : 'Recorded';
    case 't4_reaction':
      return (p.reactionCatches !== undefined) ? `${p.reactionCatches}/5 catches` : 'Recorded';
    case 't5_chitima':
      return p.chitimaTotalSec
        ? `${Math.floor(p.chitimaTotalSec / 60)}:${String(p.chitimaTotalSec % 60).padStart(2, '0')}`
        : 'Recorded';
    case 't6_ball':
      return (p.jugglingBest !== undefined) ? `${p.jugglingBest} juggles` : 'Recorded';
    default:
      return 'Recorded';
  }
}

export default function SessionPage() {
  const [screen,    setScreen]    = useState<ScreenId>('setup');
  const [state,     setState]     = useState<SessionState>(createInitialState());
  const [lastTest,  setLastTest]  = useState<string>('t1_jump'); // for rest screen

  // ── Advance to the next screen in sequence ───────────────────────────────
  const advance = useCallback((newPartials?: Record<string, unknown>) => {
    const currentIndex = SCREEN_SEQUENCE.indexOf(screen);
    const nextScreen   = SCREEN_SEQUENCE[currentIndex + 1] as ScreenId;

    setState(prev => {
      const updated = newPartials
        ? { ...prev, partials: { ...prev.partials, ...newPartials } }
        : prev;
      // Compute + store result when we're about to show the results screen
      if (nextScreen === 'results') {
        const result = submitSession(updated);
        const withResult = { ...updated, result };
        saveSession(withResult);
        return withResult;
      }
      saveSession(updated);
      return updated;
    });

    if (nextScreen) {
      // If the current screen is a test, record it as lastTest for RestScreen
      if (!screen.startsWith('rest_') && screen !== 'setup' && screen !== 'results') {
        setLastTest(screen);
      }
      setScreen(nextScreen);
    }
  }, [screen]);

  const goBack = useCallback(() => {
    const currentIndex = SCREEN_SEQUENCE.indexOf(screen);
    const prevScreen   = SCREEN_SEQUENCE[currentIndex - 1] as ScreenId;
    if (prevScreen) setScreen(prevScreen);
  }, [screen]);

  const skip = useCallback(() => {
    advance(); // advance without recording a value
  }, [advance]);

  // ── Update root-level state fields (config, startedAt) ───────────────────
  const update = useCallback((patch: Partial<SessionState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  // ── POST result to backend when results screen loads ──────────────────────
  useEffect(() => {
    if (screen !== 'results' || !state.result || !state.config) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token || token === 'dev-token') return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/grs-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        player_name:  state.config.playerName,
        age:          state.config.age,
        position:     state.config.position,
        session_date: state.config.sessionDate,
        verified_by:  state.config.verifiedBy,
        aq_score:     state.result.aq,
        tier:         state.result.tier,
        dq_value:     state.result.dq,
        partials:     state.partials,
      }),
    }).catch(() => { /* fire and forget */ });
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Common props passed to every test screen ─────────────────────────────
  const screenProps = {
    state,
    onAdvance: advance,
    onBack:    goBack,
    onSkip:    skip,
    onUpdate:  update,
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {screen === 'setup'       && <SetupScreen    {...screenProps} />}
      {screen === 't1_jump'     && <JumpScreen      {...screenProps} />}
      {screen === 't2_sprint'   && <SprintScreen    {...screenProps} />}
      {screen === 't3_balance'  && <BalanceScreen   {...screenProps} />}
      {screen === 't4_reaction' && <ReactionScreen  {...screenProps} />}
      {screen === 't5_chitima'  && <ChitimaScreen   {...screenProps} />}
      {screen === 't6_ball'     && <BallScreen       {...screenProps} />}
      {screen === 'results'     && <ResultsScreen   {...screenProps} />}

      {/* Rest screens — one after each test except the last */}
      {screen.startsWith('rest_after_') && state.config && (
        <RestScreen
          completedTestId={lastTest}
          completedValue={completedValueLabel(lastTest, state)}
          nextTestId={NEXT_TEST[lastTest] ?? 't2_sprint'}
          playerPosition={state.config.position}
          playerGender={
            typeof window !== 'undefined'
              ? (localStorage.getItem('player_gender') as 'male' | 'female') ?? 'male'
              : 'male'
          }
          onStartNextTest={advance}
        />
      )}
    </>
  );
}