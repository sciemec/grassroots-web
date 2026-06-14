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

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function SetupScreen({ onAdvance, onUpdate }: TestScreenProps) {
  const [playerName, setPlayerName]   = useState('');
  const [age,        setAge]          = useState<number>(14);
  const [position,   setPosition]     = useState<Position>('midfielder');
  const [verifiedBy, setVerifiedBy]   = useState('');

  const POSITIONS: { key: Position; label: string }[] = [
    { key: 'striker',    label: 'Striker'    },
    { key: 'winger',     label: 'Winger'     },
    { key: 'midfielder', label: 'Midfielder' },
    { key: 'defender',   label: 'Defender'   },
    { key: 'goalkeeper', label: 'Goalkeeper' },
  ];

  const ALL_TESTS = ['t1_jump','t2_sprint','t3_balance','t4_reaction','t5_endurance','t6_ball'] as const;
  const [selectedTests, setSelectedTests] = useState<string[]>([...ALL_TESTS]);

  const TEST_NAMES: Record<string, string> = {
    t1_jump: 'T1 Jump', t2_sprint: 'T2 Sprint', t3_balance: 'T3 Balance',
    t4_reaction: 'T4 Reaction', t5_endurance: 'T5 Endurance', t6_ball: 'T6 Ball',
  };

  const toggleTest = (t: string) =>
    setSelectedTests(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );

  const canStart = playerName.trim().length > 0 && verifiedBy.trim().length > 0 && selectedTests.length > 0;

  const handleStart = () => {
    const config: SessionConfig = {
      playerName:    playerName.trim(),
      age,
      position,
      sessionDate:   new Date().toISOString().split('T')[0],
      verifiedBy:    verifiedBy.trim(),
      coachVerified: true,
      activeTests:   [...selectedTests, 'results'] as any,
    };
    onUpdate({ config, startedAt: new Date().toISOString() });
    onAdvance({});
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* Hero */}
      <div className="px-4 pt-8 pb-6" style={{ background: GRS_GREEN }}>
        <div className="text-xs font-medium text-white/60 uppercase tracking-widest mb-1">
          GrassRoots Sports
        </div>
        <div className="text-2xl font-black text-white">Weekly test session</div>
        <div className="text-sm text-white/70 mt-1">
          {new Date().toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* Player details */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Player details</div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Player name</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Age</label>
            <div className="flex items-center gap-3">
              <input type="range" min={6} max={35} value={age}
                onChange={e => setAge(+e.target.value)} className="flex-1" />
              <span className="text-2xl font-black w-10 text-right" style={{ color: GRS_GREEN }}>{age}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500">Position</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map(p => (
                <button key={p.key} onClick={() => setPosition(p.key)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={position === p.key
                    ? { background: GRS_GREEN, color: '#fff' }
                    : { background: '#f1f1f1', color: '#555' }
                  }>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Coach / verifier name</label>
            <input
              type="text"
              value={verifiedBy}
              onChange={e => setVerifiedBy(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-300"
            />
          </div>
        </div>

        {/* Test selection */}
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tests to run today</div>
          <div className="text-xs text-gray-400">Deselect tests you cannot run today (no wall for jump, no ball, etc.)</div>
          <div className="grid grid-cols-3 gap-2">
            {ALL_TESTS.map(t => {
              const active = selectedTests.includes(t);
              return (
                <button key={t} onClick={() => toggleTest(t)}
                  className="py-2.5 rounded-xl text-xs font-medium border transition-all"
                  style={active
                    ? { background: GRS_GREEN, color: '#fff', borderColor: GRS_GREEN }
                    : { borderColor: '#e5e5e5', color: '#888' }
                  }>
                  {TEST_NAMES[t]}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-400 text-center">
            {selectedTests.length} of 6 tests selected · ~{selectedTests.length * 7} minutes
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-2xl font-black text-base ${canStart ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
          style={canStart ? { background: GRS_GREEN } : {}}>
          {canStart ? `Start session — ${selectedTests.length} tests` : 'Fill in player details above'}
        </button>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// T1 — JUMP SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export function JumpScreen({ state, onAdvance, onBack, onSkip }: TestScreenProps) {
  const [method, setMethod] = useState<'measure' | 'video_time'>('measure');
  const [heightCm, setHeightCm]     = useState<number | ''>('');
  const [flightSec, setFlightSec]   = useState<number | ''>('');

  const canNext = method === 'measure'
    ? heightCm !== '' && heightCm >= 5 && heightCm <= 90
    : flightSec !== '' && flightSec >= 0.2 && flightSec <= 0.9;

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

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
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">How are you measuring?</div>
          <div className="grid grid-cols-2 gap-2">
            {(['measure', 'video_time'] as const).map(m => (
              <button key={m} onClick={() => setMethod(m)}
                className="py-3 rounded-xl text-xs font-medium border transition-all"
                style={method === m
                  ? { background: GRS_GREEN, color: '#fff', borderColor: GRS_GREEN }
                  : { borderColor: '#e5e5e5', color: '#666' }
                }>
                {m === 'measure' ? 'Measuring tape (cm)' : 'Video timing (sec)'}
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
            <div className="space-y-2">
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
                <div className="text-xs text-center font-medium rounded-lg py-2" style={{ background: '#eaf3de', color: GRS_GREEN }}>
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

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

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

        <div className="bg-white rounded-2xl p-4">
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

        {/* Age reference */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Reference times</div>
          <div className="space-y-1.5 text-xs">
            {[
              { range: 'Under 3.0s', label: 'Elite — top 10%' },
              { range: '3.0–3.4s',   label: 'Competitive — top 25%' },
              { range: '3.4–3.9s',   label: 'Developmental — average' },
              { range: 'Over 3.9s',  label: 'Foundation — needs work' },
            ].map(r => (
              <div key={r.range} className="flex justify-between">
                <span className="font-mono text-gray-700">{r.range}</span>
                <span className="text-gray-400">{r.label}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2">For age 13–15. Other age groups vary.</div>
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

  // Asymmetry preview
  const rightTotal = rightOpen + rightClosed;
  const leftTotal  = leftOpen  + leftClosed;
  const worse  = Math.max(rightTotal, leftTotal);
  const better = Math.min(rightTotal, leftTotal);
  const asymmetry = worse === 0 ? 0 : Math.round(((worse - better) / worse) * 100);
  const riskFlag  = asymmetry > 25;

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

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

        {/* Phase toggle */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['eyes_open', 'eyes_closed'] as const).map(p => (
              <button key={p} onClick={() => setPhase(p)}
                className="py-2.5 rounded-xl text-xs font-medium border transition-all"
                style={phase === p
                  ? { background: GRS_GREEN, color: '#fff', borderColor: GRS_GREEN }
                  : { borderColor: '#e5e5e5', color: '#666' }
                }>
                {p === 'eyes_open' ? 'Eyes open' : 'Eyes closed'}
              </button>
            ))}
          </div>

          <SessionTimer
            seconds={30}
            label={`Timer — 30 seconds per leg`}
            onComplete={() => {}}
          />
        </div>

        {/* Correction counts */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {phase === 'eyes_open' ? 'Eyes open — corrections' : 'Eyes closed — corrections'}
          </div>
          <div className="text-xs text-gray-400">
            Tap + each time the athlete touches their other foot down to stop falling.
          </div>

          {phase === 'eyes_open' ? (
            <div className="grid grid-cols-2 gap-4">
              <CounterInput label="Right leg" value={rightOpen} onChange={setRightOpen} />
              <CounterInput label="Left leg"  value={leftOpen}  onChange={setLeftOpen}  />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <CounterInput label="Right leg" value={rightClosed} onChange={setRightClosed} />
              <CounterInput label="Left leg"  value={leftClosed}  onChange={setLeftClosed}  />
            </div>
          )}
        </div>

        {/* Live asymmetry preview */}
        {(rightOpen > 0 || leftOpen > 0) && (
          <div className={`rounded-xl p-3 ${riskFlag ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="text-xs font-bold mb-1" style={{ color: riskFlag ? '#b42318' : GRS_GREEN }}>
              {riskFlag ? '⚠ Asymmetry flag' : '✓ Balance looks symmetric'}
            </div>
            <div className="text-xs" style={{ color: riskFlag ? '#9b2335' : '#3b6d11' }}>
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
  const [catches, setCatches]  = useState(0);
  const [attempt, setAttempt]  = useState(0);
  const MAX_ATTEMPTS = 5;

  const recordAttempt = (caught: boolean) => {
    if (attempt >= MAX_ATTEMPTS) return;
    if (caught) setCatches(c => c + 1);
    setAttempt(a => a + 1);
  };

  const reset = () => { setCatches(0); setAttempt(0); };

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

        <InstructionCard
          testNum="Test 4 of 6"
          testName="Reaction — cognitive speed"
          icon="⚡"
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
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Attempts {attempt}/{MAX_ATTEMPTS}
            </div>
            <button onClick={reset} className="text-xs text-gray-400 underline">Reset</button>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 justify-center">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{
                  borderColor: i < attempt ? GRS_GREEN : '#e5e5e5',
                  background:  i < attempt ? (i < catches ? GRS_GREEN : '#fee2e2') : 'transparent',
                  color:       i < attempt ? '#fff' : '#ccc',
                }}>
                {i < attempt ? (i < catches ? '✓' : '✗') : i + 1}
              </div>
            ))}
          </div>

          {attempt < MAX_ATTEMPTS ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => recordAttempt(true)}
                className="py-4 rounded-xl font-bold text-white text-base"
                style={{ background: GRS_GREEN }}>
                ✓ Caught
              </button>
              <button onClick={() => recordAttempt(false)}
                className="py-4 rounded-xl font-bold text-sm border-2"
                style={{ borderColor: '#fee2e2', color: '#b42318' }}>
                ✗ Missed
              </button>
            </div>
          ) : (
            <div className="text-center py-3 rounded-xl font-bold text-lg" style={{ background: '#eaf3de', color: GRS_GREEN }}>
              {catches}/5 catches recorded
            </div>
          )}
        </div>

        {/* Science note */}
        <div className="bg-amber-50 rounded-xl p-3">
          <div className="text-xs font-bold text-amber-700 mb-1">Coach note</div>
          <div className="text-xs text-amber-600 leading-relaxed">
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
  const [totalSec,  setTotalSec]  = useState<number | ''>('');
  const [round1Q,   setRound1Q]   = useState(0);
  const [round3Q,   setRound3Q]   = useState(0);
  const [timerSec,  setTimerSec]  = useState(0);
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);

  const startTimer = () => {
    setElapsed(0);
    setRunning(true);
    const interval = setInterval(() => {
      setElapsed(e => { const n = e + 1; return n; });
    }, 1000);
    (window as any).__enduranceTimer = interval;
  };

  const stopTimer = () => {
    clearInterval((window as any).__enduranceTimer);
    setRunning(false);
    setTotalSec(elapsed);
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const canNext = totalSec !== '' && round1Q > 0 && round3Q > 0;

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

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
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Circuit timer</div>
          <div className="text-center">
            <div className="text-5xl font-black" style={{ color: running ? GRS_GOLD : GRS_GREEN }}>
              {formatTime(elapsed)}
            </div>
          </div>
          {!running && elapsed === 0 ? (
            <button onClick={startTimer}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: GRS_GREEN }}>
              Start circuit
            </button>
          ) : running ? (
            <button onClick={stopTimer}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ background: '#b42318' }}>
              Stop — circuit complete
            </button>
          ) : (
            <div className="text-center text-sm font-medium" style={{ color: GRS_GREEN }}>
              Time recorded: {formatTime(elapsed)} ✓
            </div>
          )}
        </div>

        {/* Technique quality */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Technique quality — coach rating
          </div>
          <div className="text-xs text-gray-400">
            Rate movement quality 1–5. Watch how burpees and squat jumps look in round 1 vs round 3.
          </div>
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

          {round1Q > 0 && round3Q > 0 && (
            <div className={`rounded-xl p-3 text-xs font-medium ${
              round3Q >= round1Q ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {round3Q >= round1Q
                ? `Excellent engine — technique held or improved under fatigue.`
                : `Technique dropped ${round1Q - round3Q} point${round1Q-round3Q>1?'s':''} from round 1 to round 3.`}
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
  const [juggling,  setJuggling]  = useState<number | ''>('');
  const [turn1,     setTurn1]     = useState(0);
  const [turn2,     setTurn2]     = useState(0);
  const [turn3,     setTurn3]     = useState(0);
  const [turn4,     setTurn4]     = useState(0);
  const [turn5,     setTurn5]     = useState(0);

  const turnTotal = turn1 + turn2 + turn3 + turn4 + turn5;
  const canNext   = juggling !== '' && [turn1,turn2,turn3,turn4,turn5].every(t => t > 0);

  const TURN_LABELS = ['1st turn', '2nd turn', '3rd turn', '4th turn', '5th turn'];
  const turns = [turn1, turn2, turn3, turn4, turn5];
  const setTurns = [setTurn1, setTurn2, setTurn3, setTurn4, setTurn5];

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex flex-col">
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">

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
        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Part A — Juggling</div>
          <SessionTimer seconds={30} label="30-second juggling window" onComplete={() => {}} />
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

        {/* Turn quality */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Part B — Inside-cut turns</div>
          <div className="text-xs text-gray-400">
            Rate each turn 1–3. 1 = ball runs away · 2 = close but stiff · 3 = ball and body as one
          </div>
          <div className="grid grid-cols-5 gap-2">
            {turns.map((t, i) => (
              <div key={i} className="space-y-1">
                <div className="text-xs text-gray-400 text-center">{i + 1}</div>
                {[1,2,3].map(n => (
                  <button key={n} onClick={() => setTurns[i](n)}
                    className="w-full py-2 rounded-lg text-xs font-bold border transition-all"
                    style={t === n
                      ? { background: GRS_GREEN, color: '#fff', borderColor: GRS_GREEN }
                      : { borderColor: '#e5e5e5', color: '#aaa' }
                    }>
                    {n}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {turnTotal > 0 && (
            <div className="text-center text-sm font-bold" style={{ color: GRS_GREEN }}>
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-sm text-gray-400">Calculating results...</div>
    </div>
  );

  const TIER_BG: Record<string, string> = {
    Elite: GRS_GOLD, Competitive: GRS_GREEN, Developmental: '#185fa5', Foundation: '#888',
  };

  const domainLabels: Record<string, string> = {
    explosivePower: 'Jump',  linearSpeed: 'Sprint',  balance: 'Balance',
    cognitiveSpeed: 'React', endurance:   'Endurance', ballMastery: 'Ball',
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* Tier banner */}
      <div className="px-4 pt-6 pb-5 text-white" style={{ background: TIER_BG[result.tier] }}>
        <div className="text-xs font-medium opacity-70 uppercase tracking-widest mb-1">
          {result.playerName} · {result.ageGroup} · {result.position}
        </div>
        <div className="text-3xl font-black">{result.tier}</div>
        <div className="flex items-end gap-3 mt-2">
          <div>
            <div className="text-5xl font-black">{result.aq}</div>
            <div className="text-xs opacity-70">Athletic Quotient</div>
          </div>
          {result.dq !== null && (
            <div className="mb-1">
              <div className="text-xl font-bold">
                {result.dq > 0 ? '+' : ''}{result.dq}%/wk
              </div>
              <div className="text-xs opacity-70">{result.dqLabel}</div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Domain scores */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Domain scores</div>
          <div className="space-y-2.5">
            {Object.entries(result.domains).map(([key, domain]: [string, any]) => {
              if (!domain.tested) return null;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{domainLabels[key]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{domain.rawScore}</span>
                      <span className="text-xs font-bold" style={{ color: GRS_GREEN }}>{domain.percentile}th pct</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${domain.percentile}%`,
                      background: domain.percentile >= 75 ? GRS_GREEN
                        : domain.percentile >= 40 ? GRS_GOLD : '#b42318',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PQ */}
        <div className="bg-white rounded-2xl p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Position match</div>
          <div className="grid grid-cols-5 gap-1.5">
            {(['striker','winger','midfielder','defender','goalkeeper'] as const).map(pos => (
              <div key={pos} className={`rounded-xl p-2 text-center ${pos === result.pq.bestFit ? 'ring-2' : ''}`}
                style={pos === result.pq.bestFit ? { outline: `2px solid ${GRS_GREEN}`, background: '#eaf3de' } : { background: '#f5f5f5' }}>
                <div className="text-sm font-black" style={{ color: pos === result.pq.bestFit ? GRS_GREEN : '#888' }}>
                  {result.pq[pos]}
                </div>
                <div className="text-xs text-gray-400 mt-0.5" style={{ fontSize: '9px' }}>
                  {pos.slice(0,3).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Injury flag */}
        {result.injuryRiskFlag && (
          <div className="bg-red-50 rounded-2xl p-4">
            <div className="text-xs font-bold text-red-700 mb-1">⚠ Balance asymmetry flag</div>
            <div className="text-xs text-red-600">
              Left-right difference: {result.balanceAsymmetry}% — above the 25% injury risk threshold.
              Prioritise single-leg stability work this week.
            </div>
          </div>
        )}

        {/* Suggested drills */}
        {result.suggestedDrills.length > 0 && (
          <div className="bg-white rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Drills for this week</div>
            {result.suggestedDrills.map((drill, i) => (
              <div key={drill.id} className={`rounded-xl p-3 ${i === result.suggestedDrills.length - 1 ? 'border border-dashed border-gray-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold text-gray-800">{drill.name}</span>
                  <span className="text-xs text-gray-400">{drill.duration}</span>
                </div>
                <div className="text-xs text-gray-500">{drill.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Scout narrative */}
        <div className="bg-white rounded-2xl p-4 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Scout report</div>
          <div className="text-xs text-gray-600 leading-relaxed">{result.scoutNarrative}</div>
          {result.coachVerified && (
            <div className="flex items-center gap-1 mt-2">
              <span style={{ color: GRS_GREEN }}>✓</span>
              <span className="text-xs font-medium" style={{ color: GRS_GREEN }}>
                Verified by {result.verifiedBy}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pb-6">
          <button
            onClick={() => router.push('/player/passport')}
            className="w-full py-4 rounded-xl font-bold text-white text-sm"
            style={{ background: GRS_GREEN }}>
            Generate Talent Passport
          </button>
          <button
            onClick={() => {
              const text = encodeURIComponent(
                `🏆 ${result.playerName} scored AQ ${result.aq} (${result.tier}) on the GRS Weekly Test!\n\nView their Talent Passport: grassrootssports.live/player/passport`
              );
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="w-full py-3 rounded-xl font-medium text-sm border border-gray-200 text-gray-600">
            Share player card via WhatsApp
          </button>
          <button
            onClick={() => { window.location.href = '/player/session'; }}
            className="w-full py-3 rounded-xl font-medium text-sm border border-gray-200 text-gray-600">
            Test another player
          </button>
        </div>
      </div>
    </div>
  );
}