// hooks/useSprintTimer.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sprint timing hook for the T2 Sprint test (20m / 15m depending on age).
//
// Uses performance.now() — accuracy to 0.001s (1ms), displayed to 0.01s.
// The interval fires every 10ms so the display updates smoothly without
// burning CPU unnecessarily.
//
// Usage:
//   const { state, elapsed, finalTime, display, start, stop, reset } = useSprintTimer();
//
// State machine:
//   idle → (start()) → running → (stop()) → stopped → (reset()) → idle
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type TimerState = 'idle' | 'running' | 'stopped';

export interface SprintTimerResult {
  /** Current timer state */
  state:     TimerState;
  /** Elapsed seconds, updated every 10ms while running */
  elapsed:   number;
  /** Final elapsed time — set when stop() is called, null otherwise */
  finalTime: number | null;
  /** Formatted display string e.g. "3.84" */
  display:   string;
  start:  () => void;
  stop:   () => void;
  reset:  () => void;
}

function fmt(sec: number): string {
  return sec.toFixed(2);
}

export function useSprintTimer(): SprintTimerResult {
  const [state,     setState]     = useState<TimerState>('idle');
  const [elapsed,   setElapsed]   = useState(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);

  const startAtRef  = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTick();
    setElapsed(0);
    setFinalTime(null);
    startAtRef.current = performance.now();
    setState('running');

    intervalRef.current = setInterval(() => {
      if (startAtRef.current === null) return;
      const secs = (performance.now() - startAtRef.current) / 1000;
      setElapsed(secs);
    }, 10);
  }, [clearTick]);

  const stop = useCallback(() => {
    if (startAtRef.current === null) return;
    // Capture the exact time before clearing anything
    const secs = (performance.now() - startAtRef.current) / 1000;
    clearTick();
    setElapsed(secs);
    setFinalTime(secs);
    setState('stopped');
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    startAtRef.current = null;
    setElapsed(0);
    setFinalTime(null);
    setState('idle');
  }, [clearTick]);

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick]);

  return {
    state,
    elapsed,
    finalTime,
    display: fmt(elapsed),
    start,
    stop,
    reset,
  };
}
