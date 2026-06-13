'use client';
// src/app/player/talent-id/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Talent Identification page — Identify
// Wires grs-engine v3 into the existing talent-id UI.
// Players run the 6 tests, get AQ/DQ/PQ scores, see their Player Card,
// and upload videos directly from this page.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { evaluate, resolveAgeGroup, getNormsForAge } from '@/lib/grs-engine';
import type { GRSResult, Position } from '@/lib/grs-engine';
import PlayerCard from '@/components/ui/PlayerCard';
import type { PlayerCardData } from '@/components/ui/PlayerCard';

const POSITIONS: { key: Position; label: string }[] = [
  { key: 'striker',    label: 'Striker'    },
  { key: 'winger',     label: 'Winger'     },
  { key: 'midfielder', label: 'Midfielder' },
  { key: 'defender',   label: 'Defender'   },
  { key: 'goalkeeper', label: 'Goalkeeper' },
];

// Map grs-engine Tier to PlayerCard rank using session count from localStorage
function resolveRankFromResult(result: GRSResult): import('@/components/ui/PlayerCard').PlayerRank {
  return result.rank as import('@/components/ui/PlayerCard').PlayerRank;
}

export default function TalentIdPage() {
  const router = useRouter();
  const [step, setStep]     = useState<'setup' | 'tests' | 'results'>('setup');
  const [age,  setAge]      = useState(14);
  const [pos,  setPos]      = useState<Position>('midfielder');
  const [name, setName]     = useState('');
  const [result, setResult] = useState<GRSResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Test inputs
  const [jumpCm,      setJumpCm]      = useState<number | ''>('');
  const [sprintSec,   setSprintSec]   = useState<number | ''>('');
  const [balRO,       setBalRO]       = useState(0);
  const [balLO,       setBalLO]       = useState(0);
  const [balRC,       setBalRC]       = useState(0);
  const [balLC,       setBalLC]       = useState(0);
  const [catchRate,   setCatchRate]   = useState<number | ''>('');
  const [chitimaSec,  setChitimaSec]  = useState<number | ''>('');
  const [chitimaR1,   setChitimaR1]   = useState(3);
  const [chitimaR3,   setChitimaR3]   = useState(3);
  const [juggling,    setJuggling]    = useState<number | ''>('');
  const [turnQuality, setTurnQuality] = useState(0);

  const norms = getNormsForAge(age);

  const handleRun = () => {
    // Calculate degradation score from coach quality ratings
    const degScore = chitimaR1 > 0 && chitimaR3 > 0
      ? Math.round(Math.max(0, (chitimaR1 - chitimaR3) / Math.max(1, chitimaR1 - 1)) * 100)
      : undefined;

    const res = evaluate({
      playerName:    name || 'Player',
      age,
      gender:        'male' as const,
      position:      pos,
      sessionDate:   new Date().toISOString().split('T')[0],
      verifiedBy:    'Self',
      coachVerified: false,
      jumpHeightCm:  jumpCm     !== '' ? +jumpCm     : undefined,
      sprint20mSec:  sprintSec  !== '' ? +sprintSec  : undefined,
      balanceRightOpen:   balRO || undefined,
      balanceLeftOpen:    balLO || undefined,
      balanceRightClosed: balRC || undefined,
      balanceLeftClosed:  balLC || undefined,
      reactionCatchRate:  catchRate !== '' ? +catchRate : undefined,
      chitimaTotalSec:    chitimaSec !== '' ? +chitimaSec : undefined,
      chitimaDegScore:    degScore,
      jugglingSequence:   juggling !== '' ? +juggling : undefined,
      turnQualityScore:   turnQuality || undefined,
    });

    if (res.errors.length > 0) {
      alert(res.errors.join('\n'));
      return;
    }

    setResult(res);
    setStep('results');

    // Save session via API (non-blocking)
    saveSession(res);
  };

  const saveSession = async (res: GRSResult) => {
    setSaving(true);
    try {
      await fetch('/api/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aqScore:          res.aq,
          tier:             res.tier,
          position:         res.position,
          ageGroup:         res.ageGroup,
          sessionDate:      res.sessionDate,
          sprintTime:       res.domains.linearSpeed.tested   ? res.domains.linearSpeed.raw   : null,
          jumpHeight:       res.domains.explosivePower.tested ? res.domains.explosivePower.raw : null,
          chitimaTotalSec:  res.domains.endurance.tested     ? res.domains.endurance.raw     : null,
          reactionCatch:    res.domains.cognitiveSpeed.tested ? res.domains.cognitiveSpeed.raw : null,
          jugglingSeq:      res.domains.ballMastery.tested   ? res.domains.ballMastery.raw   : null,
          sprintPercentile:    res.domains.linearSpeed.percentile,
          jumpPercentile:      res.domains.explosivePower.percentile,
          balancePercentile:   res.domains.balance.percentile,
          reactionPercentile:  res.domains.cognitiveSpeed.percentile,
          chitimaPercentile:   res.domains.endurance.percentile,
          ballPercentile:      res.domains.ballMastery.percentile,
          scoutNarrative:      res.scoutNarrative,
          coachVerified:       res.coachVerified,
          verifiedBy:          res.verifiedBy,
          injuryRisk:          res.injuryRiskFlag,
          balanceAsymmetry:    res.balanceAsymmetry,
          pqStriker:           res.pq.striker,
          pqWinger:            res.pq.winger,
          pqMidfielder:        res.pq.midfielder,
          pqDefender:          res.pq.defender,
          pqGoalkeeper:        res.pq.goalkeeper,
        }),
      });
    } catch (e) {
      // Save to localStorage as fallback (offline)
      const key = 'grs_sessions';
      const existing = JSON.parse(localStorage.getItem(key) ?? '[]');
      existing.unshift({ ...res, savedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    } finally {
      setSaving(false);
    }
  };

  const cardData: PlayerCardData | null = result ? {
    playerName:   result.playerName,
    position:     result.position,
    school:       '',
    ageGroup:     result.ageGroup,
    rank:         resolveRankFromResult(result),
    aqScore:      result.aq,
    weeklyStreak: 0,
    tier:         result.tier,
    domainScores: {
      speed:     result.domains.linearSpeed.percentile,
      power:     result.domains.explosivePower.percentile,
      agility:   result.domains.cognitiveSpeed.percentile,
      endurance: result.domains.endurance.percentile,
      ball:      result.domains.ballMastery.percentile,
      balance:   result.domains.balance.percentile,
    },
    dq:           result.dq,
    coachVerified: result.coachVerified,
  } : null;

  return (
    <div className="min-h-screen bg-[#F4F2EE] p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Talent Identification
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GRS Athletic Tests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete the 6 tests to get your AQ score, position profile, and drill recommendations.
          </p>
        </div>

        {/* ── SETUP STEP ── */}
        {step === 'setup' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name"
                className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400" />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</label>
              <div className="flex items-center gap-3 mt-2">
                <input type="range" min={6} max={35} value={age} onChange={e => setAge(+e.target.value)} className="flex-1" />
                <span className="text-2xl font-black w-10 text-right" style={{ color: '#1c3d22' }}>{age}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Age group: {norms.ageGroup}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {POSITIONS.map(p => (
                  <button key={p.key} onClick={() => setPos(p.key)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={pos === p.key ? { background: '#1c3d22', color: '#fff' } : { background: '#f1f1f1', color: '#555' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep('tests')}
              className="w-full py-4 rounded-xl font-bold text-white text-base"
              style={{ background: '#1c3d22' }}>
              Start tests →
            </button>
          </div>
        )}

        {/* ── TESTS STEP ── */}
        {step === 'tests' && (
          <div className="space-y-4">
            {/* T1 Jump */}
            <TestCard title="T1 — Jump test" what="Explosive power — how high you can jump" how="Step off a knee-height wall. Land and immediately jump up as high as possible. 3 attempts, best counts." equipment="Low wall or step · Phone to the side at hip height">
              <NumInput label="Best jump height" unit="cm" value={jumpCm} onChange={setJumpCm} min={5} max={90} hint={`Average for ${norms.ageGroup}: ${norms.jump.p50}cm`} />
            </TestCard>

            {/* T2 Sprint */}
            <TestCard title="T2 — Sprint test" what="Linear speed — 20m time" how="Sprint between two markers 20m apart. Coach stands to the side. 2 runs, best time counts." equipment="2 markers 20m apart · Phone to the side">
              <NumInput label="Best sprint time" unit="sec" value={sprintSec} onChange={setSprintSec} min={2.5} max={8} step={0.01} hint={`Average for ${norms.ageGroup}: ${norms.sprint.p50}s`} />
            </TestCard>

            {/* T3 Balance */}
            <TestCard title="T3 — Balance test" what="Proprioception and injury risk — how well your body controls itself" how="Stand on one foot for 30 seconds. Count every time you touch the ground to stop falling. Eyes open, then closed. Both legs." equipment="Flat floor · Phone timer">
              <div className="grid grid-cols-2 gap-3">
                <CounterInput label="Right leg eyes open" value={balRO} onChange={setBalRO} />
                <CounterInput label="Left leg eyes open"  value={balLO} onChange={setBalLO} />
                <CounterInput label="Right leg eyes closed" value={balRC} onChange={setBalRC} />
                <CounterInput label="Left leg eyes closed"  value={balLC} onChange={setBalLC} />
              </div>
            </TestCard>

            {/* T4 Reaction */}
            <TestCard title="T4 — Reaction test" what="Cognitive speed — how fast your brain reacts and your body responds" how="Coach drops a football from shoulder height without warning. Catch it before it bounces twice. 5 attempts." equipment="1 football · 2m of space">
              <NumInput label="Catches out of 5" unit="/5" value={catchRate} onChange={setCatchRate} min={0} max={5} step={1} />
            </TestCard>

            {/* T5 Chitima */}
            <TestCard title="T5 — Endurance circuit" what="Fitness and technique under fatigue — does your form hold when tired?" how="3 rounds: 5 burpees → sprint 10m → 5 squat jumps → sprint back. No rest. Rate your technique in round 1 and round 3." equipment="2 markers 10m apart · Phone timer">
              <NumInput label="Total time" unit="sec" value={chitimaSec} onChange={setChitimaSec} min={30} max={300} step={1} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Round 1 quality (1–5)</div>
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setChitimaR1(n)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={chitimaR1 === n ? { background: '#1c3d22', color: '#fff' } : { background: '#f1f1f1', color: '#888' }}>
                      {n}
                    </button>
                  ))}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Round 3 quality (1–5)</div>
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setChitimaR3(n)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                      style={chitimaR3 === n ? { background: '#1c3d22', color: '#fff' } : { background: '#f1f1f1', color: '#888' }}>
                      {n}
                    </button>
                  ))}</div>
                </div>
              </div>
            </TestCard>

            {/* T6 Ball mastery */}
            <TestCard title="T6 — Ball mastery" what="Football naturalness — how comfortably you relate to the ball" how="Part A: juggle for 30 seconds, record your longest unbroken run. Part B: 5 inside-cut turns around a cone, rate each 1–3." equipment="1 football · 1 cone">
              <NumInput label="Longest juggling sequence" unit="touches" value={juggling} onChange={setJuggling} min={0} max={500} step={1} />
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">Turn quality — total (5 turns, max 15)</div>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={15} value={turnQuality} onChange={e => setTurnQuality(+e.target.value)} className="flex-1" />
                  <span className="text-xl font-bold w-10 text-right" style={{ color: '#1c3d22' }}>{turnQuality}</span>
                </div>
              </div>
            </TestCard>

            <div className="flex gap-3">
              <button onClick={() => setStep('setup')}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                ← Back
              </button>
              <button onClick={handleRun}
                className="flex-1 py-4 rounded-xl font-bold text-white text-base"
                style={{ background: '#1c3d22' }}>
                Calculate my scores
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS STEP ── */}
        {step === 'results' && result && cardData && (
          <div className="space-y-4">

            {/* Player card */}
            <PlayerCard data={cardData} />

            {/* Domain scores */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Athletic profile</div>
              {[
                { label: 'Sprint',    raw: result.domains.linearSpeed.rawScore,    pct: result.domains.linearSpeed.percentile    },
                { label: 'Jump',      raw: result.domains.explosivePower.rawScore,  pct: result.domains.explosivePower.percentile  },
                { label: 'Balance',   raw: result.domains.balance.rawScore,         pct: result.domains.balance.percentile         },
                { label: 'Reaction',  raw: result.domains.cognitiveSpeed.rawScore,  pct: result.domains.cognitiveSpeed.percentile  },
                { label: 'Endurance', raw: result.domains.endurance.rawScore,       pct: result.domains.endurance.percentile       },
                { label: 'Ball',      raw: result.domains.ballMastery.rawScore,     pct: result.domains.ballMastery.percentile     },
              ].filter(d => d.pct > 0).map(d => (
                <div key={d.label} className="mb-2.5">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{d.raw}</span>
                      <span className="text-xs font-bold" style={{ color: d.pct >= 75 ? '#1c3d22' : d.pct >= 40 ? '#c8962a' : '#b42318' }}>
                        {d.pct}th pct
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${d.pct}%`,
                      background: d.pct >= 75 ? '#1c3d22' : d.pct >= 40 ? '#c8962a' : '#b42318',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Position fit */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Best position matches</div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  ['Striker',    result.pq.striker],
                  ['Winger',     result.pq.winger],
                  ['Midfielder', result.pq.midfielder],
                  ['Defender',   result.pq.defender],
                  ['GK',         result.pq.goalkeeper],
                ].map(([pos, score]) => (
                  <div key={pos as string}
                    className="text-center p-2 rounded-xl"
                    style={{ background: pos === result.pq.bestFit.charAt(0).toUpperCase() + result.pq.bestFit.slice(1) ? '#eaf3de' : '#f5f5f5' }}>
                    <div className="text-base font-black" style={{ color: '#1c3d22' }}>{score}</div>
                    <div style={{ fontSize: 9 }} className="text-gray-500 mt-0.5">{pos}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6 suggested drills — one per test domain */}
            {result.suggestedDrills.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Your 6 training drills this week
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: '#eaf3de', color: '#1c3d22' }}>
                    {result.tier} tier
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  One drill for each test domain. Each one directly trains the physical quality the GRS engine just measured.
                </p>

                {/* Domain labels matching the 6 tests */}
                {[
                  { label: 'T1 — Jump',      icon: '🦘', color: '#c8962a' },
                  { label: 'T2 — Sprint',    icon: '⚡', color: '#185fa5' },
                  { label: 'T3 — Balance',   icon: '⚖️', color: '#1c3d22' },
                  { label: 'T4 — Reaction',  icon: '🎯', color: '#534ab7' },
                  { label: 'T5 — Endurance', icon: '🔥', color: '#b42318' },
                  { label: 'T6 — Ball',      icon: '⚽', color: '#1c3d22' },
                ].map((domain, i) => {
                  const drill = result.suggestedDrills[i];
                  if (!drill) return null;
                  return (
                    <div key={drill.id}
                      className="mb-3 rounded-xl border border-gray-100 overflow-hidden">
                      {/* Domain header */}
                      <div className="flex items-center gap-2 px-3 py-2"
                        style={{ background: '#f8faf7' }}>
                        <span>{domain.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-wide"
                          style={{ color: domain.color }}>
                          {domain.label}
                        </span>
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">
                          {drill.duration}
                        </span>
                      </div>
                      {/* Drill name and instruction */}
                      <div className="px-3 py-2.5">
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {drill.name}
                        </div>
                        <div className="text-xs text-gray-500 leading-relaxed">
                          {drill.reason}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => router.push('/player/drills')}
                  className="w-full mt-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#1c3d22' }}>
                  Open full drill library →
                </button>
              </div>
            )}

            {/* Scout narrative */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Scout report</div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.scoutNarrative}</p>
            </div>

            {/* Injury flag */}
            {result.injuryRiskFlag && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <div className="text-sm font-bold text-red-700 mb-1">Balance asymmetry flag</div>
                <div className="text-xs text-red-600">
                  Left-right difference: {result.balanceAsymmetry}% — above 25% threshold. Focus on single-leg stability this week.
                </div>
              </div>
            )}

            <div className="flex gap-3 pb-6">
              <button onClick={() => { setStep('setup'); setResult(null); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
                Test again
              </button>
              <button onClick={() => router.push('/player/drills')}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: '#1c3d22' }}>
                Go to drills →
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// ── Small shared sub-components ─────────────────────────────────────────────

function TestCard({ title, what, how, equipment, children }: {
  title: string; what: string; how: string; equipment: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div>
          <div className="text-sm font-bold text-gray-900">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{what}</div>
        </div>
        <span className="text-gray-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          <div className="text-xs text-gray-500 leading-relaxed">{how}</div>
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Equipment: {equipment}
          </div>
          {children}
        </div>
      )}
      {!open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function NumInput({ label, unit, value, onChange, min, max, step = 1, hint }: {
  label: string; unit: string; value: number | '';
  onChange: (v: number | '') => void; min: number; max: number; step?: number; hint?: string;
}) {
  const invalid = value !== '' && (typeof value === 'number') && (value < min || value > max);
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="relative">
        <input type="number" inputMode="decimal" min={min} max={max} step={step} value={value}
          placeholder={`${min}–${max}`}
          onChange={e => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
          className={`w-full pr-12 text-xl font-bold rounded-xl border py-3 px-4 outline-none ${invalid ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200'}`} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{unit}</span>
      </div>
      {invalid && <div className="text-xs text-red-500 mt-1">Valid range: {min}–{max}</div>}
      {hint && !invalid && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

function CounterInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1.5">{label}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg text-gray-600">−</button>
        <span className="flex-1 text-center text-2xl font-black" style={{ color: '#1c3d22' }}>{value}</span>
        <button onClick={() => onChange(Math.min(20, value + 1))}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-lg text-gray-600">+</button>
      </div>
    </div>
  );
}