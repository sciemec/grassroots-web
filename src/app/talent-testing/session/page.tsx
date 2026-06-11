// app/talent-testing/session/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Weekly Test Session — Main Orchestrator
//
// This page controls the full session flow:
//   Setup → T1 Jump → T2 Sprint → T3 Balance → T4 Reaction → T5 Chitima → T6 Ball → Results
//
// The coach sees one test at a time. Each test has:
//   - Instructions panel (what to do, how to set up)
//   - Input panel (enter the measurement)
//   - Validation (instant feedback if value looks wrong)
//   - Navigation (back / next / skip)
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createInitialState,
  getNextTest,
  getPrevTest,
  submitSession,
  saveSession,
  loadSession,
  clearSession,
  type SessionState,
  type TestId,
} from '@/lib/session-manager';
import type { GRSResult } from '@/lib/grs-engine';

// Test screens
import SetupScreen     from '@/components/session/SetupScreen';
import JumpScreen      from '@/components/session/JumpScreen';
import SprintScreen    from '@/components/session/SprintScreen';
import BalanceScreen   from '@/components/session/BalanceScreen';
import ReactionScreen  from '@/components/session/ReactionScreen';
import ChitimaScreen   from '@/components/session/ChitimaScreen';
import BallScreen      from '@/components/session/BallScreen';
import ResultsScreen   from '@/components/session/ResultsScreen';
import SessionHeader   from '@/components/session/SessionHeader';

export default function SessionPage() {
  const [state, setState] = useState<SessionState>(createInitialState);
  const [resumePrompt, setResumePrompt] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.currentTest !== 'setup' && saved.currentTest !== 'results') {
      setResumePrompt(true);
    }
  }, []);

  const update = useCallback((patch: Partial<SessionState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  // Called by each test screen when the coach taps "Next"
  const advance = useCallback((partialUpdate?: Partial<SessionState['partials']>) => {
    setState(prev => {
      const activeTests = prev.config?.activeTests ?? [];
      const nextTest = getNextTest(prev.currentTest, activeTests);
      const completed = prev.completedTests.includes(prev.currentTest)
        ? prev.completedTests
        : [...prev.completedTests, prev.currentTest];

      // Run the engine when reaching results
      let result = prev.result;
      if (nextTest === 'results') {
        result = submitSession({ ...prev, partials: { ...prev.partials, ...partialUpdate } });
      }

      const next: SessionState = {
        ...prev,
        currentTest:    nextTest,
        completedTests: completed,
        partials:       { ...prev.partials, ...partialUpdate },
        result,
      };
      saveSession(next);
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      const activeTests = prev.config?.activeTests ?? [];
      const prevTest = getPrevTest(prev.currentTest, activeTests);
      const next = { ...prev, currentTest: prevTest };
      saveSession(next);
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setState(prev => {
      const activeTests = prev.config?.activeTests ?? [];
      const nextTest = getNextTest(prev.currentTest, activeTests);
      const skipped = [...prev.skippedTests, prev.currentTest];
      const next = { ...prev, currentTest: nextTest, skippedTests: skipped };
      saveSession(next);
      return next;
    });
  }, []);

  const startFresh = () => {
    clearSession();
    setState(createInitialState());
    setResumePrompt(false);
  };

  const resumeSaved = () => {
    const saved = loadSession();
    if (saved) setState(saved);
    setResumePrompt(false);
  };

  // Shared props passed to every test screen
  const screenProps = {
    state,
    onAdvance: advance,
    onBack:    goBack,
    onSkip:    skip,
    onUpdate:  update,
  };

  // Resume prompt
  if (resumePrompt) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
          <div className="text-lg font-bold text-gray-900 mb-2">Resume session?</div>
          <div className="text-sm text-gray-500 mb-6">
            You have an unfinished test session. Would you like to continue where you left off?
          </div>
          <div className="space-y-2">
            <button onClick={resumeSaved}
              className="w-full py-3 rounded-xl font-medium text-white text-sm"
              style={{ background: '#1c3d22' }}>
              Continue session
            </button>
            <button onClick={startFresh}
              className="w-full py-3 rounded-xl font-medium text-sm border border-gray-200 text-gray-600">
              Start new session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* Header — shows progress, player name, current test */}
      {state.currentTest !== 'setup' && state.currentTest !== 'results' && (
        <SessionHeader state={state} />
      )}

      {/* Test screens */}
      {state.currentTest === 'setup'      && <SetupScreen    {...screenProps} />}
      {state.currentTest === 't1_jump'    && <JumpScreen     {...screenProps} />}
      {state.currentTest === 't2_sprint'  && <SprintScreen   {...screenProps} />}
      {state.currentTest === 't3_balance' && <BalanceScreen  {...screenProps} />}
      {state.currentTest === 't4_reaction'&& <ReactionScreen {...screenProps} />}
      {state.currentTest === 't5_chitima' && <ChitimaScreen  {...screenProps} />}
      {state.currentTest === 't6_ball'    && <BallScreen     {...screenProps} />}
      {state.currentTest === 'results'    && <ResultsScreen  {...screenProps} />}
    </div>
  );
}