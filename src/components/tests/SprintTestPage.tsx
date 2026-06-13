// components/tests/SprintTestPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// T2 Sprint Test — 20m sprint (15m for age 10–12) with live timer.
//
// Two input modes:
//   1. Timer mode  — helper taps START when athlete crosses the start line,
//                    taps STOP when athlete crosses the finish. Accurate to 0.01s.
//   2. Manual mode — typed entry for existing stopwatch readings.
//
// The confirmed time is passed back via onConfirm(seconds).
// The parent (talent-id page) sets sprint20mSec from this value.
//
// Design: dark theme matching AgeGroupGuide.tsx colour tokens.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { useSprintTimer } from '@/hooks/useSprintTimer';

// ── Colour tokens (match AgeGroupGuide.tsx) ───────────────────────────────
const BG      = '#1a1a1a';
const CARD    = '#242424';
const BORDER  = '#333';
const TEXT    = '#e5e5e5';
const MUTED   = '#888';
const GREEN   = '#1c3d22';
const GREEN_B = '#2d5c35';
const GOLD    = '#c8962a';
const RED     = '#b91c1c';
const RED_B   = '#dc2626';

interface SprintTestPageProps {
  /** Player age — determines whether sprint distance is 15m or 20m */
  age:        number;
  /** Called with the confirmed sprint time in seconds */
  onConfirm:  (seconds: number) => void;
  /** Called when the player wants to skip this test */
  onSkip?:    () => void;
}

export default function SprintTestPage({ age, onConfirm, onSkip }: SprintTestPageProps) {
  const distance  = age >= 10 && age <= 12 ? 15 : 20;

  const timer = useSprintTimer();
  const [mode,        setMode]        = useState<'pick' | 'timer' | 'manual'>('pick');
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');
  const [confirmed,   setConfirmed]   = useState(false);

  // ── Confirm timer result ─────────────────────────────────────────────────
  const handleTimerConfirm = () => {
    if (timer.finalTime === null) return;
    setConfirmed(true);
    onConfirm(parseFloat(timer.finalTime.toFixed(2)));
  };

  // ── Confirm manual entry ─────────────────────────────────────────────────
  const handleManualConfirm = () => {
    const val = parseFloat(manualInput);
    if (isNaN(val) || val < 2 || val > 30) {
      setManualError('Enter a time between 2.00 and 30.00 seconds');
      return;
    }
    setManualError('');
    setConfirmed(true);
    onConfirm(parseFloat(val.toFixed(2)));
  };

  // ── Confirmed screen ─────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div style={{ background: BG, color: TEXT, minHeight: '100%', padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>
          Time recorded
        </div>
        <div style={{ fontSize: 14, color: MUTED }}>
          Sprint result saved — moving to next test
        </div>
      </div>
    );
  }

  // ── Mode picker ──────────────────────────────────────────────────────────
  if (mode === 'pick') {
    return (
      <div style={{ background: BG, color: TEXT, minHeight: '100%', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            T2 — Sprint test
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {distance}m sprint
          </div>
          <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.65 }}>
            Player runs flat-out over {distance} metres. Time starts when they cross
            the start cone and stops when they cross the finish cone.
            {age >= 10 && age <= 12 && (
              <span style={{ color: GOLD }}> Distance is {distance}m for ages 10–12.</span>
            )}
          </div>
        </div>

        {/* Setup guide */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 10 }}>
            Set up
          </div>
          {[
            `Mark the start and finish ${distance}m apart — any two objects work (shoes, stones, bags)`,
            'Player stands behind the start cone, still, before the timer starts',
            'One person stands at the finish line holding the phone',
            'Player drives off on their own — do not use a starting command (that introduces reaction time)',
            'Tap START the moment the player\'s front foot crosses the start line',
            'Tap STOP the moment their chest crosses the finish line',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{
                minWidth: 20, height: 20, borderRadius: '50%',
                background: GREEN, color: '#4ade80',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.55 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* Mode selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setMode('timer')}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none',
              background: GREEN_B, color: '#4ade80', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            Use in-app timer
            <div style={{ fontSize: 12, fontWeight: 400, color: '#86efac', marginTop: 2 }}>
              Tap START / STOP — accurate to 0.01 seconds
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${BORDER}`, background: CARD,
              color: TEXT, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}
          >
            Enter time manually
            <div style={{ fontSize: 12, fontWeight: 400, color: MUTED, marginTop: 2 }}>
              Already timed with a stopwatch? Type the result
            </div>
          </button>
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', color: MUTED, fontSize: 13, cursor: 'pointer' }}
          >
            Skip this test today
          </button>
        )}
      </div>
    );
  }

  // ── Timer mode ───────────────────────────────────────────────────────────
  if (mode === 'timer') {
    const isIdle    = timer.state === 'idle';
    const isRunning = timer.state === 'running';
    const isStopped = timer.state === 'stopped';

    return (
      <div style={{ background: BG, color: TEXT, minHeight: '100%', padding: '20px 16px' }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            T2 — {distance}m timer
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            Helper taps START at the start line, STOP at the finish line.
          </div>
        </div>

        {/* Big timer display */}
        <div style={{
          background: CARD, border: `1px solid ${isRunning ? GOLD : BORDER}`,
          borderRadius: 16, padding: '32px 16px', textAlign: 'center', marginBottom: 24,
          transition: 'border-color 0.2s',
        }}>
          <div style={{
            fontSize: 64, fontWeight: 800, letterSpacing: '-2px',
            fontVariantNumeric: 'tabular-nums',
            color: isRunning ? GOLD : isStopped ? '#4ade80' : TEXT,
            lineHeight: 1,
          }}>
            {timer.display}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
            seconds
          </div>

          {isRunning && (
            <div style={{
              marginTop: 12, fontSize: 12, color: GOLD,
              animation: 'pulse 1s infinite',
            }}>
              RUNNING — tap STOP when player crosses the line
            </div>
          )}

          {isStopped && timer.finalTime !== null && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
              {timer.finalTime.toFixed(2)}s — is this correct?
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isIdle && (
            <button
              onClick={timer.start}
              style={{
                padding: '16px', borderRadius: 12, border: 'none',
                background: GREEN_B, color: '#4ade80',
                fontSize: 18, fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              START
            </button>
          )}

          {isRunning && (
            <button
              onClick={timer.stop}
              style={{
                padding: '16px', borderRadius: 12, border: 'none',
                background: RED, color: '#fff',
                fontSize: 18, fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              STOP
            </button>
          )}

          {isStopped && (
            <>
              <button
                onClick={handleTimerConfirm}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: GREEN_B, color: '#4ade80',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Use this time — {timer.finalTime?.toFixed(2)}s
              </button>

              <button
                onClick={timer.reset}
                style={{
                  padding: '12px', borderRadius: 12,
                  border: `1px solid ${BORDER}`, background: CARD,
                  color: TEXT, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Retake — try again
              </button>
            </>
          )}

          <button
            onClick={() => { timer.reset(); setMode('pick'); }}
            style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ── Manual entry mode ─────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100%', padding: '20px 16px' }}>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          T2 — Manual entry
        </div>
        <div style={{ fontSize: 13, color: MUTED }}>
          Enter the stopwatch time in seconds (e.g. 3.84 for 3 seconds 84)
        </div>
      </div>

      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 16px', marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 8 }}>
          {distance}m sprint time (seconds)
        </label>
        <input
          type="number"
          step="0.01"
          min="2"
          max="30"
          placeholder="e.g. 3.84"
          value={manualInput}
          onChange={e => { setManualInput(e.target.value); setManualError(''); }}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            border: `1px solid ${manualError ? RED_B : BORDER}`,
            background: '#1a1a1a', color: TEXT,
            fontSize: 24, fontWeight: 700, textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            outline: 'none', boxSizing: 'border-box',
          }}
          autoFocus
        />
        {manualError && (
          <div style={{ fontSize: 12, color: RED_B, marginTop: 6 }}>{manualError}</div>
        )}

        {/* Reference norms */}
        <div style={{ marginTop: 14, padding: '10px 12px', background: GREEN, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#86efac', fontWeight: 600, marginBottom: 4 }}>
            Reference times (age {age}) for {distance}m
          </div>
          <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.7 }}>
            {age <= 12
              ? 'Under 3.5s = excellent · 3.5–4.0s = good · Over 4.0s = developing'
              : age <= 15
              ? 'Under 3.2s = excellent · 3.2–3.7s = good · Over 3.7s = developing'
              : 'Under 2.9s = excellent · 2.9–3.4s = good · Over 3.4s = developing'
            }
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleManualConfirm}
          disabled={!manualInput}
          style={{
            padding: '14px', borderRadius: 12, border: 'none',
            background: manualInput ? GREEN_B : '#2a2a2a',
            color: manualInput ? '#4ade80' : MUTED,
            fontSize: 15, fontWeight: 700, cursor: manualInput ? 'pointer' : 'default',
          }}
        >
          Confirm time
        </button>

        <button
          onClick={() => setMode('pick')}
          style={{ background: 'none', border: 'none', color: MUTED, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
