// components/session/screens.tsx
// ─────────────────────────────────────────────────────────────────────────────
// All 8 screens in the session flow:
//   SetupScreen → JumpScreen → SprintScreen → BalanceScreen →
//   ReactionScreen → ChitimaScreen → BallScreen → ResultsScreen
//
// Each screen exports a default component.
// Split into separate files in production; combined here for Claude Code.
// ─────────────────────────────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  InstructionCard, MeasurementInput, CounterInput,
  QualityRating, NavBar, SessionTimer,
  type TestScreenProps,
} from './shared';
import type { Position } from '@/lib/grs-engine';
import type { SessionConfig } from '@/lib/session-manager';

const BG     = '#111111';
const CARD   = '#1c1c1c';
const BORDER = '#2a2a2a';
const TEXT   = '#f0f0f0';
const MUTED  = '#666';
const GOLD   = '#c8962a';
const GREEN  = '#2ecc71';

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function SetupScreen({ onAdvance, onUpdate }: TestScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [age,        setAge]        = useState<number>(14);
  const [gender,     setGender]     = useState<'male' | 'female'>('male');
  const [position,   setPosition]   = useState<Position>('midfielder');
  const [verifiedBy, setVerifiedBy] = useState('');

  const ALL_TESTS = ['t1_jump','t2_sprint','t3_balance','t4_reaction','t5_endurance','t6_ball'] as const;
  const [selectedTests, setSelectedTests] = useState<string[]>([...ALL_TESTS]);

  const TEST_META: Record<string, { label: string; icon: string; duration: string }> = {
    t1_jump:       { label: 'Jump',      icon: '↑', duration: '5 min' },
    t2_sprint:     { label: 'Sprint',    icon: '⚡', duration: '5 min' },
    t3_balance:    { label: 'Balance',   icon: '⚖', duration: '6 min' },
    t4_reaction:   { label: 'Reaction',  icon: '◎', duration: '5 min' },
    t5_endurance:  { label: 'Endurance', icon: '♥', duration: '8 min' },
    t6_ball:       { label: 'Ball',      icon: '●', duration: '5 min' },
  };

  const POSITIONS: { key: Position; label: string; abbr: string }[] = [
    { key: 'striker',    label: 'Striker',    abbr: 'ST' },
    { key: 'winger',     label: 'Winger',     abbr: 'WG' },
    { key: 'midfielder', label: 'Midfielder', abbr: 'MF' },
    { key: 'defender',   label: 'Defender',   abbr: 'DF' },
    { key: 'goalkeeper', label: 'Goalkeeper', abbr: 'GK' },
  ];

  const toggleTest = (t: string) =>
    setSelectedTests(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );

  const totalMins = selectedTests.reduce(
    (sum, t) => sum + parseInt(TEST_META[t]?.duration ?? '5'), 0
  );

  const canStart = playerName.trim().length > 0 && verifiedBy.trim().length > 0 && selectedTests.length > 0;

  const handleStart = () => {
    const config: SessionConfig = {
      playerName:    playerName.trim(),
      age,
      gender,
      position,
      sessionDate:   new Date().toISOString().split('T')[0],
      verifiedBy:    verifiedBy.trim(),
      coachVerified: true,
      activeTests:   [...selectedTests, 'results'] as any,
    };
    onUpdate({ config, startedAt: new Date().toISOString() });
    onAdvance({});
  };

  // ── Colour tokens (match ResultsScreen) ───────────────────────────────────
  const BG     = '#111111';
  const CARD   = '#1c1c1c';
  const BORDER = '#2a2a2a';
  const TEXT   = '#f0f0f0';
  const MUTED  = '#666';
  const GOLD   = '#c8962a';
  const GREEN  = '#2ecc71';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: '#161616', border: `1px solid ${BORDER}`,
    borderRadius: 10, color: TEXT, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, color: MUTED,
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, paddingBottom: 120 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '36px 20px 24px',
        borderBottom: `1px solid ${BORDER}`,
        background: 'linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)',
      }}>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
          GrassRoots Sports
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: TEXT, lineHeight: 1.1 }}>
          Weekly Session
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>
          {new Date().toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Player details ────────────────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={sectionLabel}>Player details</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Name */}
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6 }}>Player name</div>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Full name"
                style={inputStyle}
              />
            </div>

            {/* Age stepper */}
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6 }}>Age</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setAge(a => Math.max(6, a - 1))}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`,
                    background: '#161616', color: TEXT, fontSize: 20, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >−</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{age}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>years old</div>
                </div>
                <button
                  onClick={() => setAge(a => Math.min(35, a + 1))}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`,
                    background: '#161616', color: TEXT, fontSize: 20, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >+</button>
              </div>
            </div>

            {/* Gender */}
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6 }}>Gender</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setGender(g)} style={{
                    padding: '10px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    border: gender === g ? `1.5px solid ${GOLD}` : `1px solid ${BORDER}`,
                    background: gender === g ? `${GOLD}18` : '#161616',
                    color: gender === g ? GOLD : MUTED,
                  }}>
                    {g === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 8 }}>Position</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {POSITIONS.map(p => {
                  const active = position === p.key;
                  return (
                    <button key={p.key} onClick={() => setPosition(p.key)} style={{
                      padding: '10px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                      border: active ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                      background: active ? `${GREEN}18` : '#161616',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: active ? GREEN : '#555' }}>
                        {p.abbr}
                      </div>
                      <div style={{ fontSize: 9, color: active ? GREEN : MUTED, marginTop: 3, fontWeight: 600 }}>
                        {p.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coach name */}
            <div>
              <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6 }}>Coach / verifier name</div>
              <input
                type="text"
                value={verifiedBy}
                onChange={e => setVerifiedBy(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>

          </div>
        </div>

        {/* ── Test selection ────────────────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={sectionLabel}>Tests today</span>
            <span style={{ fontSize: 11, color: MUTED }}>
              {selectedTests.length}/6 · ~{totalMins} min
            </span>
          </div>
          <div style={{ padding: '12px 16px 16px' }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>
              Tap to deselect any test you cannot run today.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {ALL_TESTS.map(t => {
                const active = selectedTests.includes(t);
                const meta   = TEST_META[t];
                return (
                  <button key={t} onClick={() => toggleTest(t)} style={{
                    padding: '12px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: active ? `1.5px solid ${GREEN}44` : `1px solid ${BORDER}`,
                    background: active ? `${GREEN}0f` : '#161616',
                    opacity: active ? 1 : 0.45,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 4, color: active ? GREEN : MUTED }}>
                      {meta.icon}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: active ? TEXT : MUTED }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>
                      {meta.duration}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── Sticky start button ───────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d0d0d', borderTop: `1px solid ${BORDER}`,
        padding: '12px 16px 24px',
      }}>
        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            width: '100%', padding: '15px', borderRadius: 12, border: 'none',
            cursor: canStart ? 'pointer' : 'not-allowed',
            fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
            background: canStart
              ? 'linear-gradient(90deg, #1a5c2a, #2ecc71)'
              : '#1a1a1a',
            color: canStart ? '#fff' : '#444',
          }}
        >
          {canStart
            ? `Start session — ${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''}`
            : 'Enter player name and coach name to begin'}
        </button>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T1 — JUMP SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function JumpScreen({ state, onAdvance, onBack, onSkip }: TestScreenProps) {
  const [method,    setMethod]    = useState<'measure' | 'video_time'>('measure');
  const [heightCm,  setHeightCm]  = useState<number | ''>('');
  const [flightSec, setFlightSec] = useState<number | ''>('');

  const canNext = method === 'measure'
    ? heightCm !== '' && heightCm >= 5 && heightCm <= 90
    : flightSec !== '' && flightSec >= 0.2 && flightSec <= 0.9;

  const cardStyle: React.CSSProperties = {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        <InstructionCard
          testNum="Test 1 of 6"
          testName="Jump — explosive power"
          icon="⬆"
          equipment="A low wall or step (knee height, 40–60cm). Phone on a tripod or propped to the side at hip height."
          timeEstimate="~5 mins"
          steps={[
            'Find a low wall, step, or bench — any surface at roughly knee height.',
            'Athlete stands on the edge and steps off — landing on BOTH feet at the same time.',
            'The instant both feet hit the ground, they jump straight UP as high as possible. No pause.',
            '3 attempts. Record the best result below.',
            'Coach holds the phone sideways at hip height, 2–3 metres to the side, recording each attempt.',
          ]}
        />

        {/* Input method toggle */}
        <div style={cardStyle}>
          <div style={sectionLabel}>How are you measuring?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {(['measure', 'video_time'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: method === m ? `1.5px solid ${GOLD}` : `1px solid ${BORDER}`,
                background: method === m ? `${GOLD}22` : '#161616',
                color: method === m ? GOLD : MUTED,
              }}>
                {m === 'measure' ? 'Tape measure (cm)' : 'Video timing (sec)'}
              </button>
            ))}
          </div>

          {method === 'measure' ? (
            <MeasurementInput
              label="Best jump height"
              unit="cm"
              value={heightCm}
              onChange={setHeightCm}
              min={5} max={90} step={1}
              placeholder="e.g. 38"
              hint="Measure from standing reach to the highest point touched"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <MeasurementInput
                label="Flight time from video"
                unit="sec"
                value={flightSec}
                onChange={setFlightSec}
                min={0.2} max={0.9} step={0.01}
                placeholder="e.g. 0.55"
                hint="Time from feet leaving ground to first landing contact. App converts to cm automatically."
              />
              {flightSec !== '' && typeof flightSec === 'number' && flightSec >= 0.2 && (
                <div style={{
                  textAlign: 'center', fontSize: 12, fontWeight: 700,
                  padding: '8px', borderRadius: 8,
                  background: `${GREEN}18`, color: GREEN,
                  border: `1px solid ${GREEN}33`,
                }}>
                  ≈ {Math.round(122.6 * Math.pow(flightSec, 2))} cm jump height
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance(method === 'measure'
          ? { jumpHeightCm: heightCm as number, jumpMethod: 'measure' }
          : { jumpFlightTimeSec: flightSec as number, jumpMethod: 'video_time' }
        )}
        onSkip={onSkip}
        canGoNext={canNext}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T2 — SPRINT SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function SprintScreen({ onAdvance, onBack, onSkip }: TestScreenProps) {
  const [sprintSec, setSprintSec] = useState<number | ''>('');

  const cardStyle: React.CSSProperties = {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
  };

  const REF_TIMES = [
    { range: 'Under 3.0s', label: 'Elite — top 10%',       colour: GOLD },
    { range: '3.0–3.4s',   label: 'Competitive — top 25%', colour: GREEN },
    { range: '3.4–3.9s',   label: 'Developmental — average', colour: '#60a5fa' },
    { range: 'Over 3.9s',  label: 'Foundation — needs work', colour: MUTED },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        <InstructionCard
          testNum="Test 2 of 6"
          testName="Sprint — linear speed"
          icon="⚡"
          equipment="Two markers 20m apart (cones, shoes, water bottles — anything). Phone perpendicular to the lane."
          timeEstimate="~6 mins"
          steps={[
            'Mark two points 20m apart. No tape? Walk 25 adult steps — close enough.',
            'Coach stands to the SIDE of the lane (not at the finish). Hold the phone sideways so both markers are visible.',
            'Before the first run, tap the START point on the phone screen, then tap the FINISH point. These become the timing lines.',
            'Athlete starts standing still. Coach says "GO". Athlete sprints as hard as possible.',
            '2 runs. Record the best time below.',
          ]}
        />

        <div style={cardStyle}>
          <MeasurementInput
            label="Best sprint time"
            unit="sec"
            value={sprintSec}
            onChange={setSprintSec}
            min={2.5} max={8.0} step={0.01}
            placeholder="e.g. 3.40"
            hint="Record to 2 decimal places — e.g. 3.24"
          />
        </div>

        <div style={cardStyle}>
          <div style={sectionLabel}>Reference times</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REF_TIMES.map(r => (
              <div key={r.range} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 8, background: '#161616',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: r.colour }}>
                  {r.range}
                </span>
                <span style={{ fontSize: 11, color: MUTED }}>{r.label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 10 }}>For age 13–15. Other age groups vary.</div>
        </div>
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance({ sprint20mSec: sprintSec as number })}
        onSkip={onSkip}
        canGoNext={sprintSec !== '' && (sprintSec as number) >= 2.5 && (sprintSec as number) <= 8.0}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T3 — BALANCE SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function BalanceScreen({ onAdvance, onBack, onSkip }: TestScreenProps) {
  const [rightOpen,   setRightOpen]   = useState(0);
  const [leftOpen,    setLeftOpen]    = useState(0);
  const [rightClosed, setRightClosed] = useState(0);
  const [leftClosed,  setLeftClosed]  = useState(0);
  const [phase, setPhase] = useState<'eyes_open' | 'eyes_closed'>('eyes_open');

  const rightTotal = rightOpen + rightClosed;
  const leftTotal  = leftOpen  + leftClosed;
  const worse      = Math.max(rightTotal, leftTotal);
  const better     = Math.min(rightTotal, leftTotal);
  const asymmetry  = worse === 0 ? 0 : Math.round(((worse - better) / worse) * 100);
  const riskFlag   = asymmetry > 25;

  const cardStyle: React.CSSProperties = {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        <InstructionCard
          testNum="Test 3 of 6"
          testName="Balance — proprioception and injury risk"
          icon="⚖"
          equipment="Flat floor. Phone timer only. Can be done alone."
          timeEstimate="~6 mins"
          steps={[
            'Athlete stands on ONE foot — heel slightly raised, arms loose.',
            'Start the 30-second timer. Count each time they touch the other foot down to stop falling.',
            'Record both legs with eyes OPEN first, then CLOSED. Eyes closed is harder.',
            'Enter the 4 correction counts below (one per leg per condition).',
          ]}
        />

        {/* Phase toggle + timer */}
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {(['eyes_open', 'eyes_closed'] as const).map(p => (
              <button key={p} onClick={() => setPhase(p)} style={{
                padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: phase === p ? `1.5px solid ${GOLD}` : `1px solid ${BORDER}`,
                background: phase === p ? `${GOLD}22` : '#161616',
                color: phase === p ? GOLD : MUTED,
              }}>
                {p === 'eyes_open' ? '👁 Eyes open' : '🙈 Eyes closed'}
              </button>
            ))}
          </div>
          <SessionTimer seconds={30} label="Timer — 30 seconds per leg" onComplete={() => {}} />
        </div>

        {/* Correction counts */}
        <div style={cardStyle}>
          <div style={sectionLabel}>
            {phase === 'eyes_open' ? 'Eyes open — corrections' : 'Eyes closed — corrections'}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
            Tap + each time the athlete touches their other foot down to stop falling.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {phase === 'eyes_open' ? (
              <>
                <CounterInput label="Right leg" value={rightOpen}   onChange={setRightOpen}   />
                <CounterInput label="Left leg"  value={leftOpen}    onChange={setLeftOpen}    />
              </>
            ) : (
              <>
                <CounterInput label="Right leg" value={rightClosed} onChange={setRightClosed} />
                <CounterInput label="Left leg"  value={leftClosed}  onChange={setLeftClosed}  />
              </>
            )}
          </div>
        </div>

        {/* Live asymmetry preview */}
        {(rightOpen > 0 || leftOpen > 0) && (
          <div style={{
            borderRadius: 12, padding: '12px 14px',
            background: riskFlag ? '#1f0d0d' : '#0d1f0d',
            border: `1px solid ${riskFlag ? '#e74c3c44' : `${GREEN}44`}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: riskFlag ? '#e74c3c' : GREEN, marginBottom: 4 }}>
              {riskFlag ? '⚠ Asymmetry flag' : '✓ Balance looks symmetric'}
            </div>
            <div style={{ fontSize: 12, color: riskFlag ? '#c0392b' : '#27ae60' }}>
              Left-right difference: {asymmetry}%
              {riskFlag ? ' — above 25% threshold. Injury risk noted.' : ' — within normal range.'}
            </div>
          </div>
        )}
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance({
          balanceRightOpen: rightOpen, balanceLeftOpen: leftOpen,
          balanceRightClosed: rightClosed, balanceLeftClosed: leftClosed,
        })}
        onSkip={onSkip}
        canGoNext={rightOpen >= 0 && leftOpen >= 0}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T4 — REACTION SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function ReactionScreen({ onAdvance, onBack, onSkip }: TestScreenProps) {
  const [catches, setCatches] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const MAX_ATTEMPTS = 5;

  const recordAttempt = (caught: boolean) => {
    if (attempt >= MAX_ATTEMPTS) return;
    if (caught) setCatches(c => c + 1);
    setAttempt(a => a + 1);
  };

  const reset = () => { setCatches(0); setAttempt(0); };

  const cardStyle: React.CSSProperties = {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px',
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        <InstructionCard
          testNum="Test 4 of 6"
          testName="Reaction — cognitive speed"
          icon="◎"
          equipment="One football. 2 metres of open space."
          timeEstimate="~5 mins"
          steps={[
            'Coach holds a football at shoulder height, arm stretched out.',
            'Athlete stands 2 metres away, watching the ball. NO warning given.',
            'Coach opens their hand — ball drops.',
            'Athlete must catch the ball before it bounces a SECOND time.',
            '5 attempts. Tap Caught or Missed after each one.',
          ]}
        />

        {/* Attempt tracker */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Attempts {attempt}/{MAX_ATTEMPTS}
            </div>
            <button onClick={reset} style={{
              fontSize: 11, color: MUTED, background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}>Reset</button>
          </div>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
              const done    = i < attempt;
              const caught  = done && i < catches;
              const missed  = done && i >= catches;
              return (
                <div key={i} style={{
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  border: done ? `2px solid ${caught ? GREEN : '#e74c3c'}` : `2px solid ${BORDER}`,
                  background: caught ? `${GREEN}22` : missed ? '#1f0d0d' : 'transparent',
                  color: caught ? GREEN : missed ? '#e74c3c' : MUTED,
                }}>
                  {done ? (caught ? '✓' : '✗') : i + 1}
                </div>
              );
            })}
          </div>

          {attempt < MAX_ATTEMPTS ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => recordAttempt(true)} style={{
                padding: '16px', borderRadius: 12, cursor: 'pointer',
                background: `${GREEN}22`, border: `1.5px solid ${GREEN}`,
                color: GREEN, fontSize: 15, fontWeight: 800,
              }}>
                ✓ Caught
              </button>
              <button onClick={() => recordAttempt(false)} style={{
                padding: '16px', borderRadius: 12, cursor: 'pointer',
                background: '#1f0d0d', border: `1.5px solid #e74c3c44`,
                color: '#e74c3c', fontSize: 15, fontWeight: 800,
              }}>
                ✗ Missed
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '12px', borderRadius: 12,
              background: `${GREEN}18`, border: `1px solid ${GREEN}33`,
              fontSize: 16, fontWeight: 800, color: GREEN,
            }}>
              {catches}/5 catches recorded
            </div>
          )}
        </div>

        {/* Coach note */}
        <div style={{
          borderRadius: 12, padding: '12px 14px',
          background: '#1a1200', border: `1px solid ${GOLD}33`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Coach note</div>
          <div style={{ fontSize: 12, color: '#b8862a', lineHeight: 1.6 }}>
            This test measures cognitive speed — how fast the brain reacts and the body responds.
            Research shows simple reaction time alone does not definitively identify elite talent,
            so this score has a lower weight in the overall AQ.
          </div>
        </div>
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance({ reactionCatchRate: catches })}
        onSkip={onSkip}
        canGoNext={attempt === MAX_ATTEMPTS}
        nextLabel={attempt < MAX_ATTEMPTS ? `Complete ${MAX_ATTEMPTS - attempt} more attempts` : 'Next test →'}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T5 — CHITIMA SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function ChitimaScreen({ onAdvance, onBack, onSkip }: TestScreenProps) {
  const [totalSec, setTotalSec] = useState<number | ''>('');
  const [round1Q,  setRound1Q]  = useState(0);
  const [round3Q,  setRound3Q]  = useState(0);
  const [running,  setRunning]  = useState(false);
  const [elapsed,  setElapsed]  = useState(0);

  const startTimer = () => {
    setElapsed(0);
    setRunning(true);
    const interval = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    (window as any).__enduranceTimer = interval;
  };

  const stopTimer = () => {
    clearInterval((window as any).__enduranceTimer);
    setRunning(false);
    setTotalSec(elapsed);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const canNext = totalSec !== '' && round1Q > 0 && round3Q > 0;

  const cardStyle: React.CSSProperties = {
    background: CARD, borderRadius: 14, border: `1px solid ${BORDER}`, padding: '14px 16px',
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, display: 'flex', flexDirection: 'column', paddingBottom: 100 }}>
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

        <InstructionCard
          testNum="Test 5 of 6"
          testName="Endurance Circuit — technique under fatigue"
          icon="🔥"
          equipment="Two markers 10m apart. Phone recording from the side."
          timeEstimate="~8 mins"
          steps={[
            'Mark two points 10m apart — shoes, cones, bottles, anything.',
            '3 rounds with NO rest: 5 burpees → sprint 10m → 5 squat jumps → sprint back.',
            'Start the timer below when the athlete starts. Stop it when round 3 is complete.',
            'Rate the QUALITY of their movement in round 1 and round 3 separately.',
            'The drop in quality between round 1 and round 3 is the unique GRS fatigue score.',
          ]}
        />

        {/* Live timer */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Circuit timer</div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              fontSize: 56, fontWeight: 900, lineHeight: 1,
              color: running ? GOLD : totalSec !== '' ? GREEN : TEXT,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(elapsed)}
            </div>
            {totalSec !== '' && !running && (
              <div style={{ fontSize: 11, color: GREEN, marginTop: 6, fontWeight: 600 }}>
                Time recorded ✓
              </div>
            )}
          </div>
          {!running && elapsed === 0 ? (
            <button onClick={startTimer} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: `${GREEN}22`, border: `1.5px solid ${GREEN}`,
              color: GREEN, fontSize: 14, fontWeight: 800, cursor: 'pointer',
            }}>
              Start circuit
            </button>
          ) : running ? (
            <button onClick={stopTimer} style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: '#1f0d0d', border: `1.5px solid #e74c3c44`,
              color: '#e74c3c', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            }}>
              Stop — circuit complete
            </button>
          ) : null}
        </div>

        {/* Technique quality */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Technique quality — coach rating</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>
            Rate movement quality 1–5. Watch burpees and squat jumps in round 1 vs round 3.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <QualityRating
              label="Round 1 quality"
              value={round1Q}
              onChange={setRound1Q}
              labels={['Breaking down', 'Struggling', 'Acceptable', 'Good form', 'Excellent form']}
            />
            <QualityRating
              label="Round 3 quality"
              value={round3Q}
              onChange={setRound3Q}
              labels={['Collapsed', 'Very tired', 'Holding on', 'Maintained', 'Strong finish']}
            />
          </div>

          {round1Q > 0 && round3Q > 0 && (
            <div style={{
              marginTop: 16, borderRadius: 10, padding: '10px 12px',
              background: round3Q >= round1Q ? `${GREEN}18` : '#1a1200',
              border: `1px solid ${round3Q >= round1Q ? GREEN : GOLD}33`,
              fontSize: 12, fontWeight: 600,
              color: round3Q >= round1Q ? GREEN : GOLD,
            }}>
              {round3Q >= round1Q
                ? 'Excellent engine — technique held or improved under fatigue.'
                : `Technique dropped ${round1Q - round3Q} point${round1Q - round3Q > 1 ? 's' : ''} from round 1 to round 3.`}
            </div>
          )}
        </div>
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance({
          enduranceTotalSec: totalSec as number,
          enduranceRound1Quality: round1Q,
          enduranceRound3Quality: round3Q,
        })}
        onSkip={onSkip}
        canGoNext={canNext}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T6 — BALL MASTERY SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function BallScreen({ onAdvance, onBack, onSkip }: TestScreenProps) {
  const [juggling, setJuggling] = useState<number | ''>('');
  const [turn1,    setTurn1]    = useState(0);
  const [turn2,    setTurn2]    = useState(0);
  const [turn3,    setTurn3]    = useState(0);
  const [turn4,    setTurn4]    = useState(0);
  const [turn5,    setTurn5]    = useState(0);

  const turnTotal = turn1 + turn2 + turn3 + turn4 + turn5;
  const canNext   = juggling !== '' && [turn1,turn2,turn3,turn4,turn5].every(t => t > 0);

  const turns    = [turn1, turn2, turn3, turn4, turn5];
  const setTurns = [setTurn1, setTurn2, setTurn3, setTurn4, setTurn5];

  const cardStyle: React.CSSProperties = {
    background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: 16, padding: '16px', marginBottom: 0,
  };
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: MUTED,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, paddingBottom: 100 }}>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <InstructionCard
          testNum="Test 6 of 6"
          testName="Ball Mastery — football naturalness"
          icon="⚽"
          equipment="One football. One cone. Any open space."
          timeEstimate="~5 mins"
          steps={[
            'Part A (Juggling): Athlete juggles for 30 seconds. Any surface — feet, thighs, head. Dropping is fine — restart immediately. Record the LONGEST unbroken sequence only.',
            'Part B (Turns): Place one cone on the ground. Athlete dribbles toward it and does an inside-cut turn, alternating feet. 5 turns total.',
            'Rate each turn: 1 = ball runs away, 2 = close but stiff, 3 = ball and body move as one.',
          ]}
        />

        {/* Juggling */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Part A — Juggling</div>
          <SessionTimer seconds={30} label="30-second juggling window" onComplete={() => {}} />
          <div style={{ marginTop: 12 }}>
            <MeasurementInput
              label="Longest unbroken sequence"
              unit="touches"
              value={juggling}
              onChange={setJuggling}
              min={0} max={500} step={1}
              placeholder="e.g. 18"
              hint="Count the longest run without a drop. Total touches not needed."
            />
          </div>
        </div>

        {/* Turn quality */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Part B — Inside-cut turns</div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>
            Rate each turn 1–3.&nbsp; 1 = ball runs away · 2 = close but stiff · 3 = ball and body as one
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {turns.map((t, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', fontWeight: 600 }}>
                  {i + 1}
                </div>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setTurns[i](n)}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 8,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      background: t === n ? `${GOLD}22` : 'transparent',
                      border: t === n ? `1.5px solid ${GOLD}` : `1px solid ${BORDER}`,
                      color: t === n ? GOLD : MUTED,
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {turnTotal > 0 && (
            <div style={{
              marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 700, color: GOLD,
            }}>
              Turn quality total: {turnTotal}/15
            </div>
          )}
        </div>
      </div>

      <NavBar
        onBack={onBack}
        onNext={() => onAdvance({
          jugglingSequence: juggling as number,
          turnQualityScore: turnTotal,
        })}
        onSkip={onSkip}
        canGoNext={canNext}
        nextLabel="See results →"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESULTS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function ResultsScreen({ state }: TestScreenProps) {
  const router = useRouter();
  const result = state.result;

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#666', fontSize: 13 }}>Calculating results…</div>
    </div>
  );

  // ── Colour tokens ──────────────────────────────────────────────────────────
  const BG      = '#111111';
  const CARD    = '#1c1c1c';
  const BORDER  = '#2a2a2a';
  const TEXT    = '#f0f0f0';
  const MUTED   = '#666';
  const GOLD    = '#c8962a';
  const GREEN   = '#2ecc71';
  const RED     = '#e74c3c';
  const AMBER   = '#f39c12';

  const TIER_COLOUR: Record<string, string> = {
    Elite: GOLD, Competitive: GREEN, Developmental: '#60a5fa', Foundation: '#888',
  };
  const tierColour = TIER_COLOUR[result.tier] ?? '#888';

  const DOMAIN_META: Record<string, { label: string; icon: string }> = {
    explosivePower: { label: 'Vertical Jump',  icon: '↑' },
    linearSpeed:    { label: 'Sprint Speed',   icon: '⚡' },
    balance:        { label: 'Balance',        icon: '⚖' },
    cognitiveSpeed: { label: 'Reaction',       icon: '◎' },
    endurance:      { label: 'Endurance',      icon: '♥' },
    ballMastery:    { label: 'Ball Mastery',   icon: '●' },
  };

  const POSITIONS = ['striker','winger','midfielder','defender','goalkeeper'] as const;
  const POS_SHORT: Record<string, string> = {
    striker: 'ST', winger: 'WG', midfielder: 'MF', defender: 'DF', goalkeeper: 'GK',
  };

  // AQ ring geometry
  const R   = 54;
  const CIR = 2 * Math.PI * R;
  const pct = Math.min(result.aq / 100, 1);

  const barColour = (p: number) => p >= 75 ? GREEN : p >= 40 ? GOLD : RED;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, paddingBottom: 120 }}>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '32px 20px 28px',
        background: `linear-gradient(160deg, #1a1a1a 0%, #0d0d0d 100%)`,
        borderBottom: `1px solid ${BORDER}`,
        textAlign: 'center',
      }}>
        {/* Player meta */}
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
          {result.playerName} · {result.ageGroup} · {result.position}
        </div>

        {/* AQ ring */}
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
          <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={70} cy={70} r={R} fill="none" stroke={BORDER} strokeWidth={8} />
            <circle
              cx={70} cy={70} r={R}
              fill="none"
              stroke={tierColour}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={CIR}
              strokeDashoffset={CIR * (1 - pct)}
              style={{ filter: `drop-shadow(0 0 6px ${tierColour}88)` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, color: tierColour }}>{result.aq}</div>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>AQ Score</div>
          </div>
        </div>

        {/* Tier + trend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: tierColour,
            background: `${tierColour}18`,
            border: `1px solid ${tierColour}44`,
          }}>
            {result.tier}
          </span>
          {result.dq !== null && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: result.dq >= 0 ? GREEN : RED,
            }}>
              {result.dq > 0 ? '+' : ''}{result.dq}%/wk
            </span>
          )}
        </div>

        {/* Rank label */}
        {result.rank && (
          <div style={{ fontSize: 11, color: MUTED, marginTop: 10, fontWeight: 600 }}>
            {result.rank}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Domain scores ─────────────────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Domain Scores
            </span>
          </div>
          <div style={{ padding: '10px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(result.domains).map(([key, domain]: [string, any]) => {
              if (!domain.tested) return null;
              const meta   = DOMAIN_META[key] ?? { label: key, icon: '·' };
              const colour = barColour(domain.percentile);
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, color: colour, width: 16, textAlign: 'center' }}>{meta.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{meta.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: MUTED }}>{domain.rawScore}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: colour,
                        background: `${colour}18`, border: `1px solid ${colour}33`,
                        borderRadius: 99, padding: '2px 7px',
                      }}>
                        {domain.percentile}th
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: '#2a2a2a', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${domain.percentile}%`,
                      background: colour,
                      boxShadow: `0 0 6px ${colour}66`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Position match ────────────────────────────────────────────────── */}
        <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Position Match
            </span>
          </div>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {POSITIONS.map(pos => {
              const isBest = pos === result.pq.bestFit;
              return (
                <div key={pos} style={{
                  borderRadius: 12,
                  padding: '10px 4px',
                  textAlign: 'center',
                  background: isBest ? `${GREEN}18` : '#222',
                  border: isBest ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                  boxShadow: isBest ? `0 0 12px ${GREEN}22` : 'none',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: isBest ? GREEN : '#555' }}>
                    {result.pq[pos]}
                  </div>
                  <div style={{ fontSize: 9, color: isBest ? GREEN : MUTED, marginTop: 3, fontWeight: 700, letterSpacing: '0.05em' }}>
                    {POS_SHORT[pos]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Injury flag ───────────────────────────────────────────────────── */}
        {result.injuryRiskFlag && (
          <div style={{
            background: '#1f1200',
            borderRadius: 14,
            border: `1px solid ${AMBER}44`,
            padding: '14px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>⚠</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: AMBER, marginBottom: 4 }}>
                Balance asymmetry detected
              </div>
              <div style={{ fontSize: 12, color: '#c8852a', lineHeight: 1.5 }}>
                Left–right difference: <strong>{result.balanceAsymmetry}%</strong> — above the 25% injury risk threshold.
                Prioritise single-leg stability drills this week.
              </div>
            </div>
          </div>
        )}

        {/* ── Suggested drills ──────────────────────────────────────────────── */}
        {result.suggestedDrills.length > 0 && (
          <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}` }}>
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Drills This Week
              </span>
            </div>
            <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {result.suggestedDrills.map((drill: any, i: number) => (
                <div key={drill.id} style={{
                  padding: '12px 0',
                  borderBottom: i < result.suggestedDrills.length - 1 ? `1px solid ${BORDER}` : 'none',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: `${GOLD}18`,
                    border: `1px solid ${GOLD}33`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0, fontSize: 12, color: GOLD, fontWeight: 900,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{drill.name}</span>
                      <span style={{ fontSize: 11, color: MUTED, flexShrink: 0, marginLeft: 8 }}>{drill.duration}</span>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{drill.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Scout report ──────────────────────────────────────────────────── */}
        <div style={{
          background: CARD, borderRadius: 16,
          border: `1px solid ${BORDER}`,
          borderLeft: `3px solid ${GOLD}`,
          padding: '16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
            Scout Report
          </div>
          <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.65 }}>{result.scoutNarrative}</div>
          {result.coachVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, color: GREEN,
                background: `${GREEN}18`, border: `1px solid ${GREEN}33`,
                borderRadius: 99, padding: '3px 10px', letterSpacing: '0.06em',
              }}>
                ✓ VERIFIED
              </span>
              <span style={{ fontSize: 11, color: MUTED }}>by {result.verifiedBy}</span>
            </div>
          )}
        </div>

      </div>

      {/* ── Sticky action bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d0d0d',
        borderTop: `1px solid ${BORDER}`,
        padding: '12px 16px 20px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <button
          onClick={() => router.push('/player/passport')}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: `linear-gradient(90deg, #1a5c2a, #2ecc71)`,
            color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Generate Talent Passport
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const text = encodeURIComponent(
                `🏆 ${result.playerName} scored AQ ${result.aq} (${result.tier}) on the GRS Weekly Test!\n\nView their Talent Passport: grassrootssports.live/player/passport`
              );
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: 12,
              border: `1px solid ${BORDER}`, background: '#1a1a1a',
              color: '#aaa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Share via WhatsApp
          </button>
          <button
            onClick={() => { window.location.href = '/player/weekly-session'; }}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: 12,
              border: `1px solid ${BORDER}`, background: '#1a1a1a',
              color: '#aaa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Test another player
          </button>
        </div>
      </div>
    </div>
  );
}