// components/session/shared.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components used across all 6 test screens
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { isPlausible } from '@/lib/grs-engine';
import type { SessionState } from '@/lib/session-manager';

// ── Dark theme tokens ─────────────────────────────────────────────────────────
const BG     = '#111111';
const CARD   = '#1c1c1c';
const BORDER = '#2a2a2a';
const TEXT   = '#f0f0f0';
const MUTED  = '#666';
const GOLD   = '#c8962a';
const GREEN  = '#2ecc71';

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
    t1_jump:      'T1 Jump',
    t2_sprint:    'T2 Sprint',
    t3_balance:   'T3 Balance',
    t4_reaction:  'T4 Reaction',
    t5_endurance: 'T5 Endurance',
    t6_ball:      'T6 Ball',
  };

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: CARD, borderBottom: `1px solid ${BORDER}`,
      padding: '10px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
            {state.config?.playerName ?? 'Athlete'}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>
            Age {state.config?.age} · {state.config?.position}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>
            {TEST_LABELS[state.currentTest] ?? state.currentTest}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>
            {completed} / {activeTests.length} tests
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: BORDER, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${progress}%`, background: GREEN,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
        {activeTests.map(t => (
          <div key={t} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: state.completedTests.includes(t)
              ? GREEN
              : state.currentTest === t
              ? GOLD
              : BORDER,
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Instruction card — shown at top of every test screen ─────────────────────
export function InstructionCard({
  testNum, testName, icon, steps, equipment, timeEstimate,
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
    <div style={{
      background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', textAlign: 'left',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, background: `${GOLD}22`, border: `1px solid ${GOLD}44`,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {testNum}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{testName}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: MUTED }}>{timeEstimate}</span>
          <span style={{ fontSize: 10, color: MUTED }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 12, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: GOLD,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              width: 60, flexShrink: 0, paddingTop: 1,
            }}>
              You need
            </span>
            <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{equipment}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 900, color: BG, background: GOLD, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{step}</div>
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
  placeholder, hint,
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
  const isValid  = value === '' || (typeof value === 'number' && value >= min && value <= max);
  const showWarn = value !== '' && !isValid;

  const borderColor = showWarn ? '#e74c3c' : value !== '' ? GREEN : BORDER;
  const bgColor     = showWarn ? '#1f0f0f' : value !== '' ? '#0f1f14' : '#161616';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
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
          style={{
            width: '100%', paddingRight: 52, paddingLeft: 14,
            paddingTop: 12, paddingBottom: 12,
            fontSize: 22, fontWeight: 900,
            background: bgColor,
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12, color: showWarn ? '#e74c3c' : TEXT,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        />
        <span style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 12, fontWeight: 600, color: MUTED,
        }}>
          {unit}
        </span>
      </div>
      {showWarn && (
        <div style={{ fontSize: 11, color: '#e74c3c', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠</span>
          <span>Valid range: {min}–{max} {unit}. Check and re-enter.</span>
        </div>
      )}
      {hint && !showWarn && (
        <div style={{ fontSize: 11, color: MUTED }}>{hint}</div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: 44, height: 44, borderRadius: 12,
            border: `1px solid ${BORDER}`, background: '#161616',
            color: TEXT, fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >−</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: GOLD }}>{value}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: 44, height: 44, borderRadius: 12,
            border: `1px solid ${BORDER}`, background: '#161616',
            color: TEXT, fontSize: 22, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >+</button>
      </div>
    </div>
  );
}

// ── 1–5 quality rating input ──────────────────────────────────────────────────
export function QualityRating({
  label, value, onChange,
  labels = ['Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
}: {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  labels?:  string[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, paddingTop: 10, paddingBottom: 10, borderRadius: 10,
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            border: value === n ? `1.5px solid ${GOLD}` : `1px solid ${BORDER}`,
            background: value === n ? `${GOLD}22` : '#161616',
            color: value === n ? GOLD : MUTED,
            transition: 'all 0.15s',
          }}>
            {n}
          </button>
        ))}
      </div>
      {value > 0 && (
        <div style={{ fontSize: 11, textAlign: 'center', color: GOLD, fontWeight: 600 }}>
          {labels[value - 1]}
        </div>
      )}
    </div>
  );
}

// ── Bottom navigation bar ─────────────────────────────────────────────────────
export function NavBar({
  onBack, onNext, onSkip,
  canGoBack = true, canGoNext, isFirst = false,
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
    <div style={{
      position: 'sticky', bottom: 0,
      background: '#0d0d0d', borderTop: `1px solid ${BORDER}`,
      padding: '10px 16px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          fontSize: 14, fontWeight: 800,
          cursor: canGoNext ? 'pointer' : 'not-allowed',
          background: canGoNext ? 'linear-gradient(90deg, #1a5c2a, #2ecc71)' : '#1a1a1a',
          color: canGoNext ? '#fff' : '#444',
        }}
      >
        {nextLabel}
      </button>
      {(!isFirst || onSkip) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {!isFirst && canGoBack && onBack && (
            <button onClick={onBack} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: `1px solid ${BORDER}`, background: 'none',
              color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              ← Back
            </button>
          )}
          {onSkip && (
            <button onClick={onSkip} style={{
              flex: 1, padding: '10px', borderRadius: 10,
              border: `1px solid ${BORDER}`, background: 'none',
              color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Skip this test
            </button>
          )}
        </div>
      )}
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
  const R   = 40;
  const CIR = 2 * Math.PI * R;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={48} cy={48} r={R} fill="none" stroke={BORDER} strokeWidth={6} />
            <circle
              cx={48} cy={48} r={R}
              fill="none"
              stroke={done ? GREEN : GOLD}
              strokeWidth={6}
              strokeDasharray={CIR}
              strokeDashoffset={CIR * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: done ? GREEN : TEXT }}>
              {done ? '✓' : seconds - elapsed}
            </span>
          </div>
        </div>
      </div>
      {!done ? (
        <button onClick={start} disabled={running} style={{
          width: '100%', padding: '12px', borderRadius: 10, border: 'none',
          fontSize: 13, fontWeight: 700,
          cursor: running ? 'not-allowed' : 'pointer',
          background: running ? BORDER : GOLD,
          color: running ? MUTED : '#0d0d0d',
        }}>
          {running ? 'Timing...' : 'Start timer'}
        </button>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: GREEN }}>
          Timer complete ✓
        </div>
      )}
    </div>
  );
}
