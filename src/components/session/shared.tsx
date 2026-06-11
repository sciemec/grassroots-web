// components/session/shared.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components used across all 6 test screens
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { isPlausible } from '@/lib/grs-engine';
import type { SessionState } from '@/lib/session-manager';

// ── Shared props interface ────────────────────────────────────────────────────
export interface TestScreenProps {
  state:      SessionState;
  onAdvance:  (partials?: Partial<SessionState['partials']>) => void;
  onBack:     () => void;
  onSkip:     () => void;
  onUpdate:   (patch: Partial<SessionState>) => void;
}

// ── Session header — progress bar + player name + test count ─────────────────
export function SessionHeader({ state }: { state: SessionState }) {
  const activeTests = (state.config?.activeTests ?? [])
    .filter(t => t !== 'setup' && t !== 'results');
  const completed   = state.completedTests.filter(t => t !== 'setup').length;
  const progress    = activeTests.length > 0 ? (completed / activeTests.length) * 100 : 0;

  const TEST_LABELS: Record<string, string> = {
    t1_jump:     'T1 Jump',
    t2_sprint:   'T2 Sprint',
    t3_balance:  'T3 Balance',
    t4_reaction: 'T4 Reaction',
    t5_chitima:  'T5 Endurance',
    t6_ball:     'T6 Ball',
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {state.config?.playerName ?? 'Athlete'}
          </div>
          <div className="text-xs text-gray-400">
            Age {state.config?.age} · {state.config?.position}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium" style={{ color: '#1c3d22' }}>
            {TEST_LABELS[state.currentTest] ?? state.currentTest}
          </div>
          <div className="text-xs text-gray-400">
            {completed} / {activeTests.length} tests
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: '#1c3d22' }}
        />
      </div>
      {/* Test dots */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {activeTests.map(t => (
          <div key={t}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: state.completedTests.includes(t)
                ? '#1c3d22'
                : state.currentTest === t
                ? '#c8962a'
                : '#e5e5e5',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Instruction card — shown at top of every test screen ─────────────────────
export function InstructionCard({
  testNum, testName, icon, steps, equipment, timeEstimate, canSkip,
}: {
  testNum:      string;
  testName:     string;
  icon:         string;
  steps:        string[];
  equipment:    string;
  timeEstimate: string;
  canSkip?:     boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: '#1c3d22' }}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{testNum}</div>
          <div className="text-sm font-bold text-gray-900">{testName}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeEstimate}</span>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
          {/* Equipment */}
          <div className="flex items-center gap-2 pt-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0">
              You need
            </span>
            <span className="text-xs text-gray-600">{equipment}</span>
          </div>
          {/* Steps */}
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ background: '#1c3d22', fontSize: '10px' }}>
                  {i + 1}
                </div>
                <div className="text-xs text-gray-600 leading-relaxed">{step}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Numeric input with live validation ────────────────────────────────────────
export function MeasurementInput({
  label, unit, value, onChange, min, max, step = 0.01,
  placeholder, hint, validationField,
}: {
  label:            string;
  unit:             string;
  value:            number | '';
  onChange:         (v: number | '') => void;
  min:              number;
  max:              number;
  step?:            number;
  placeholder?:     string;
  hint?:            string;
  validationField?: Parameters<typeof isPlausible>[0];
}) {
  const isValid   = value === '' || (typeof value === 'number' && value >= min && value <= max);
  const showWarn  = value !== '' && !isValid;

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder ?? `${min}–${max}`}
          onChange={e => {
            const v = e.target.value === '' ? '' : parseFloat(e.target.value);
            onChange(v);
          }}
          className={`w-full pr-14 text-xl font-bold rounded-xl border py-3 px-4 outline-none transition-all ${
            showWarn
              ? 'border-red-300 bg-red-50 text-red-700'
              : value !== ''
              ? 'border-green-200 bg-green-50 text-gray-900'
              : 'border-gray-200 bg-white text-gray-900'
          }`}
          style={{ fontSize: '20px' }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
          {unit}
        </span>
      </div>
      {showWarn && (
        <div className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          <span>Valid range: {min}–{max} {unit}. Check and re-enter.</span>
        </div>
      )}
      {hint && !showWarn && (
        <div className="text-xs text-gray-400">{hint}</div>
      )}
    </div>
  );
}

// ── Counter input (for balance corrections, catch count) ─────────────────────
export function CounterInput({
  label, value, onChange, min = 0, max = 20,
}: {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  min?:     number;
  max?:     number;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-light text-gray-600 active:scale-95 transition-transform"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <span className="text-3xl font-black" style={{ color: '#1c3d22' }}>{value}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-xl font-light text-gray-600 active:scale-95 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── 1–5 quality rating input ──────────────────────────────────────────────────
export function QualityRating({
  label, value, onChange,
  labels = ['Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
}: {
  label:   string;
  value:   number;
  onChange:(v: number) => void;
  labels?: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              value === n
                ? 'text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
            style={value === n ? { background: '#1c3d22' } : {}}>
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <div className="text-xs text-center" style={{ color: '#1c3d22' }}>
          {labels[value - 1]}
        </div>
      )}
    </div>
  );
}

// ── Bottom navigation bar ─────────────────────────────────────────────────────
export function NavBar({
  onBack, onNext, onSkip,
  canGoBack = true, canGoNext, isFirst = false, isLast = false,
  nextLabel = 'Next test →',
}: {
  onBack?:    () => void;
  onNext:     () => void;
  onSkip?:    () => void;
  canGoBack?: boolean;
  canGoNext:  boolean;
  isFirst?:   boolean;
  isLast?:    boolean;
  nextLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 space-y-2">
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
          canGoNext
            ? 'text-white active:scale-98'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
        }`}
        style={canGoNext ? { background: '#1c3d22' } : {}}>
        {nextLabel}
      </button>
      <div className="flex gap-2">
        {!isFirst && canGoBack && onBack && (
          <button onClick={onBack}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600">
            ← Back
          </button>
        )}
        {onSkip && (
          <button onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500">
            Skip this test
          </button>
        )}
      </div>
    </div>
  );
}

// ── Timer component ───────────────────────────────────────────────────────────
export function SessionTimer({
  onComplete, label = 'Hold for 30 seconds',
  seconds = 30,
}: {
  onComplete: (elapsed: number) => void;
  label?:     string;
  seconds?:   number;
}) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone]       = useState(false);

  const start = () => {
    setElapsed(0);
    setDone(false);
    setRunning(true);

    const interval = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= seconds) {
          clearInterval(interval);
          setRunning(false);
          setDone(true);
          onComplete(seconds);
          return seconds;
        }
        return e + 1;
      });
    }, 1000);
  };

  const pct = (elapsed / seconds) * 100;

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      {/* Circle timer */}
      <div className="flex justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e5e5" strokeWidth="6" />
            <circle cx="48" cy="48" r="40" fill="none"
              stroke={done ? '#1c3d22' : '#c8962a'} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black" style={{ color: done ? '#1c3d22' : '#1a1a1a' }}>
              {done ? '✓' : seconds - elapsed}
            </span>
          </div>
        </div>
      </div>
      {!done ? (
        <button onClick={start} disabled={running}
          className={`w-full py-3 rounded-xl text-sm font-bold ${
            running ? 'bg-gray-100 text-gray-400' : 'text-white'
          }`}
          style={!running ? { background: '#c8962a' } : {}}>
          {running ? 'Timing...' : 'Start timer'}
        </button>
      ) : (
        <div className="text-center text-sm font-medium" style={{ color: '#1c3d22' }}>
          Timer complete ✓
        </div>
      )}
    </div>
  );
}