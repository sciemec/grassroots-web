'use client';
// src/app/player/position-fit/page.tsx
// Player Position Finder — GRS Engine scores tell a player which football
// position their physical profile suits best.
// History stored in localStorage: grs_pos_fit_{playerName_snake}

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crosshair, ChevronDown, ChevronUp, History, Star } from 'lucide-react';
import { evaluate, type RawTestInputs, type GRSResult, type Gender, type Position } from '@/lib/grs-engine';
import { useAuthStore } from '@/lib/auth-store';

// ── Position configuration ────────────────────────────────────────────────────
type PosKey = 'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
type DomainKey = 'linearSpeed' | 'cognitiveSpeed' | 'ballMastery' | 'explosivePower' | 'balance' | 'endurance';

interface PosConfig {
  label:      string;
  emoji:      string;
  grsPos:     Position;
  pqKey:      PosKey;
  color:      string;
  bgColor:    string;
  borderColor:string;
  tagline:    string;
  priority:   DomainKey[];
}

const POS_CONFIG: Record<PosKey, PosConfig> = {
  striker: {
    label: 'Striker', emoji: '⚽', grsPos: 'striker', pqKey: 'striker',
    color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca',
    tagline: 'Goals · Pace · Finishing',
    priority: ['linearSpeed', 'cognitiveSpeed', 'ballMastery', 'explosivePower', 'balance', 'endurance'],
  },
  winger: {
    label: 'Winger', emoji: '⚡', grsPos: 'winger', pqKey: 'winger',
    color: '#ea580c', bgColor: '#fff7ed', borderColor: '#fed7aa',
    tagline: 'Pace · Dribbling · Width',
    priority: ['linearSpeed', 'ballMastery', 'cognitiveSpeed', 'explosivePower', 'balance', 'endurance'],
  },
  midfielder: {
    label: 'Midfielder', emoji: '🧠', grsPos: 'midfielder', pqKey: 'midfielder',
    color: '#15803d', bgColor: '#f0fdf4', borderColor: '#bbf7d0',
    tagline: 'Engine · Vision · Stamina',
    priority: ['endurance', 'cognitiveSpeed', 'balance', 'ballMastery', 'linearSpeed', 'explosivePower'],
  },
  defender: {
    label: 'Defender', emoji: '🛡️', grsPos: 'defender', pqKey: 'defender',
    color: '#1d4ed8', bgColor: '#eff6ff', borderColor: '#bfdbfe',
    tagline: 'Power · Aerial · Composure',
    priority: ['explosivePower', 'linearSpeed', 'cognitiveSpeed', 'balance', 'endurance', 'ballMastery'],
  },
  goalkeeper: {
    label: 'Goalkeeper', emoji: '🧤', grsPos: 'goalkeeper', pqKey: 'goalkeeper',
    color: '#7c3aed', bgColor: '#faf5ff', borderColor: '#ddd6fe',
    tagline: 'Reflexes · Jump · Command',
    priority: ['cognitiveSpeed', 'explosivePower', 'balance', 'linearSpeed', 'ballMastery', 'endurance'],
  },
};

// ── Domain labels ─────────────────────────────────────────────────────────────
const DOMAIN_META: Record<DomainKey, { label: string; test: string }> = {
  linearSpeed:    { label: 'Sprint Speed',          test: 'T2 — 20m Sprint'      },
  cognitiveSpeed: { label: 'Reaction / Decision',   test: 'T4 — Reaction Catch'  },
  ballMastery:    { label: 'Ball Mastery',           test: 'T6 — Juggling'        },
  explosivePower: { label: 'Explosive Power',        test: 'T1 — Jump'            },
  balance:        { label: 'Balance',                test: 'T3 — Balance'         },
  endurance:      { label: 'Endurance',              test: 'T5 — Chitima Run'     },
};

// ── Reference table ───────────────────────────────────────────────────────────
const TABLE_ROWS: { test: string; striker: number; winger: number; midfielder: number; defender: number; goalkeeper: number }[] = [
  { test: 'T1 — Jump (cm)',           striker: 4, winger: 4, midfielder: 6, defender: 1, goalkeeper: 2 },
  { test: 'T2 — 20m Sprint (sec)',    striker: 1, winger: 1, midfielder: 5, defender: 2, goalkeeper: 4 },
  { test: 'T3 — Balance (errors)',    striker: 5, winger: 5, midfielder: 3, defender: 4, goalkeeper: 3 },
  { test: 'T4 — Reaction (catches)',  striker: 2, winger: 3, midfielder: 2, defender: 3, goalkeeper: 1 },
  { test: 'T5 — Chitima (min)',       striker: 6, winger: 6, midfielder: 1, defender: 5, goalkeeper: 6 },
  { test: 'T6 — Juggling (count)',    striker: 3, winger: 2, midfielder: 4, defender: 6, goalkeeper: 5 },
];

// ── Position label for fit display ───────────────────────────────────────────
const FIT_LABELS: [PosKey, string][] = [
  ['striker',    'Striker'],
  ['winger',     'Winger'],
  ['midfielder', 'Midfielder'],
  ['defender',   'Defender'],
  ['goalkeeper', 'Goalkeeper'],
];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface SavedResult { date: string; pos: PosKey; aq: number; tier: string; bestFit: string; pqFit: number }

function storageKey(name: string) { return `grs_pos_fit_${name.toLowerCase().replace(/\s+/g, '_')}`; }
function loadHistory(name: string): SavedResult[] {
  try { const r = localStorage.getItem(storageKey(name)); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveToHistory(name: string, entry: SavedResult) {
  try {
    const h = loadHistory(name); h.unshift(entry);
    localStorage.setItem(storageKey(name), JSON.stringify(h.slice(0, 10)));
  } catch { /* unavailable */ }
}
function formatChitima(sec: number) {
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}
function medalLabel(idx: number) {
  return idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PositionFitPage() {
  const user = useAuthStore((s) => s.user);

  const [pos,          setPos]          = useState<PosKey>('midfielder');
  const [playerName,   setPlayerName]   = useState(user?.name ?? '');
  const [age,          setAge]          = useState('');
  const [gender,       setGender]       = useState<Gender>('male');

  // Test inputs
  const [jumpCm,         setJumpCm]         = useState('');
  const [sprintSec,      setSprintSec]      = useState('');
  const [balRightOpen,   setBalRightOpen]   = useState('');
  const [balLeftOpen,    setBalLeftOpen]    = useState('');
  const [balRightClosed, setBalRightClosed] = useState('');
  const [balLeftClosed,  setBalLeftClosed]  = useState('');
  const [catches,        setCatches]        = useState<number | null>(null);
  const [chitimaMin,     setChitimaMin]     = useState('');
  const [chitimaSec,     setChitimaSec]     = useState('');
  const [juggles,        setJuggles]        = useState('');

  const [result,      setResult]      = useState<GRSResult | null>(null);
  const [history,     setHistory]     = useState<SavedResult[]>([]);
  const [showTable,   setShowTable]   = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const cfg = POS_CONFIG[pos];

  const chitimaTotalSec = (() => {
    const m = parseFloat(chitimaMin);
    const s = parseFloat(chitimaSec);
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
    if (!isNaN(m)) return m * 60;
    return undefined;
  })();

  const runAssessment = useCallback(() => {
    if (!playerName.trim() || !age) return;
    const inputs: RawTestInputs = {
      playerName: playerName.trim(), age: parseInt(age, 10), gender,
      position: cfg.grsPos,
      sessionDate: new Date().toISOString().split('T')[0],
      verifiedBy: 'Self-assessment', coachVerified: false,
      jumpHeightCm:       jumpCm         ? parseFloat(jumpCm)          : undefined,
      sprint20mSec:       sprintSec      ? parseFloat(sprintSec)       : undefined,
      balanceRightOpen:   balRightOpen   ? parseInt(balRightOpen,   10) : undefined,
      balanceLeftOpen:    balLeftOpen    ? parseInt(balLeftOpen,    10) : undefined,
      balanceRightClosed: balRightClosed ? parseInt(balRightClosed, 10) : undefined,
      balanceLeftClosed:  balLeftClosed  ? parseInt(balLeftClosed,  10) : undefined,
      reactionCatchRate:  catches !== null ? catches : undefined,
      chitimaTotalSec,
      jugglingSequence:   juggles        ? parseInt(juggles, 10)       : undefined,
    };
    const res = evaluate(inputs, []);
    setResult(res);
    const best = res.pq.bestFit;
    const entry: SavedResult = {
      date: new Date().toLocaleDateString(), pos, aq: res.aq, tier: res.tier,
      bestFit: POS_CONFIG[best as PosKey]?.label ?? best,
      pqFit: Math.round(res.pq[cfg.pqKey]),
    };
    saveToHistory(playerName.trim(), entry);
    setHistory(loadHistory(playerName.trim()));
    setShowHistory(false);
  }, [playerName, age, gender, pos, cfg,
      jumpCm, sprintSec, balRightOpen, balLeftOpen, balRightClosed, balLeftClosed,
      catches, chitimaTotalSec, juggles]);

  const openHistory = () => {
    if (playerName.trim()) { setHistory(loadHistory(playerName.trim())); setShowHistory(true); }
  };

  const orderedDomains = cfg.priority;

  // Sorted position fits from result
  const sortedFits = result
    ? ([...FIT_LABELS] as [PosKey, string][]).map(([k, label]) => ({ key: k, label, score: result.pq[k] })).sort((a, b) => b.score - a.score)
    : [];

  const bestPos = result ? POS_CONFIG[result.pq.bestFit as PosKey] : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }}>
      {/* Nav */}
      <div style={{ backgroundColor: '#1a5c2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/player" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> Player Hub
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Crosshair size={16} /> Position Finder
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>What Position Suits You?</h1>
          <p style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            Enter your 6 GRS test scores and find out which football position your physical profile fits best.
          </p>
        </div>

        {/* ── Reference table ──────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24, overflow: 'hidden' }}>
          <button
            onClick={() => setShowTable(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#111' }}
          >
            <span>Which tests matter most per position?</span>
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTable && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600, color: '#374151' }}>GRS Test</th>
                    {(Object.entries(POS_CONFIG) as [PosKey, PosConfig][]).map(([k, c]) => (
                      <th key={k} style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: c.color }}>
                        {c.emoji} {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={row.test} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: '#111' }}>{row.test}</td>
                      {(Object.keys(POS_CONFIG) as PosKey[]).map(k => {
                        const val  = row[k];
                        const top3 = val <= 3;
                        return (
                          <td key={k} style={{ textAlign: 'center', padding: '10px 12px' }}>
                            <span style={{
                              display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 99,
                              fontSize: 12, fontWeight: 700,
                              backgroundColor: top3 ? POS_CONFIG[k].color : '#f3f4f6',
                              color: top3 ? 'white' : '#6b7280',
                            }}>#{val}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 12, color: '#9ca3af', padding: '10px 20px', borderTop: '1px solid #f3f4f6', margin: 0 }}>
                #1 = most important for that position · Coloured = top 3
              </p>
            </div>
          )}
        </div>

        {/* ── Player details ────────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, marginTop: 0 }}>Your Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Your Name *</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Your name"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Age *</label>
              <input type="number" min={6} max={40} value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 17"
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Gender</label>
              <select value={gender} onChange={e => setGender(e.target.value as Gender)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Position selector ─────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4, marginTop: 0 }}>Your Position</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: 0 }}>
            Select your position. The test inputs below will sort by what matters most for that role.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {(Object.entries(POS_CONFIG) as [PosKey, PosConfig][]).map(([key, c]) => (
              <button key={key} onClick={() => setPos(key)}
                style={{
                  padding: '10px 4px', borderRadius: 8,
                  border: `2px solid ${pos === key ? c.color : '#e5e7eb'}`,
                  backgroundColor: pos === key ? c.bgColor : 'white',
                  color: pos === key ? c.color : '#374151',
                  fontWeight: pos === key ? 700 : 500,
                  cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
            {cfg.emoji} <strong style={{ color: cfg.color }}>{cfg.label}</strong> — {cfg.tagline} &nbsp;·&nbsp;
            🥇🥈🥉 test inputs below are sorted by priority for this position.
          </p>
        </div>

        {/* ── Test inputs sorted by position priority ───────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, marginTop: 0 }}>Your Test Scores</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: 0 }}>
            Enter as many as you have. You can skip any test you have not done yet.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orderedDomains.map((domainKey, idx) => {
              const meta   = DOMAIN_META[domainKey];
              const isTop3 = idx < 3;
              return (
                <div key={domainKey} style={{
                  borderRadius: 8,
                  border: `1px solid ${isTop3 ? cfg.borderColor : '#e5e7eb'}`,
                  backgroundColor: isTop3 ? cfg.bgColor : '#fafafa',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{meta.label}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{meta.test}</span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      backgroundColor: isTop3 ? cfg.color : '#e5e7eb',
                      color: isTop3 ? 'white' : '#6b7280',
                    }}>{medalLabel(idx)}</span>
                  </div>

                  {/* T1 Jump */}
                  {domainKey === 'explosivePower' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={0} max={100} step={0.5} value={jumpCm}
                        onChange={e => setJumpCm(e.target.value)} placeholder="Height"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 120 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>cm — higher is better</span>
                    </div>
                  )}

                  {/* T2 Sprint */}
                  {domainKey === 'linearSpeed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={2} max={10} step={0.01} value={sprintSec}
                        onChange={e => setSprintSec(e.target.value)} placeholder="Time"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 120 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>seconds — lower is better</span>
                    </div>
                  )}

                  {/* T3 Balance */}
                  {domainKey === 'balance' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 400 }}>
                        {([
                          ['Right — eyes open',   balRightOpen,   setBalRightOpen],
                          ['Left — eyes open',    balLeftOpen,    setBalLeftOpen],
                          ['Right — eyes closed', balRightClosed, setBalRightClosed],
                          ['Left — eyes closed',  balLeftClosed,  setBalLeftClosed],
                        ] as [string, string, (v: string) => void][]).map(([lbl, val, setter]) => (
                          <div key={lbl}>
                            <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{lbl}</label>
                            <input type="number" min={0} max={30} value={val}
                              onChange={e => setter(e.target.value)} placeholder="corrections"
                              style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>
                        Foot correction count · lower is better · eyes-closed counts 1.5×
                      </p>
                    </div>
                  )}

                  {/* T4 Reaction */}
                  {domainKey === 'cognitiveSpeed' && (
                    <div>
                      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 0, marginBottom: 10 }}>Catches out of 5 — tap to select:</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[0, 1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setCatches(catches === n ? null : n)}
                            style={{
                              width: 44, height: 44, borderRadius: 8,
                              border: `2px solid ${catches === n ? cfg.color : '#d1d5db'}`,
                              backgroundColor: catches === n ? cfg.bgColor : 'white',
                              color: catches === n ? cfg.color : '#374151',
                              fontWeight: catches === n ? 700 : 500,
                              fontSize: 16, cursor: 'pointer',
                            }}>{n}</button>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>5 = excellent · higher is better</p>
                    </div>
                  )}

                  {/* T5 Chitima */}
                  {domainKey === 'endurance' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="number" min={0} max={60} value={chitimaMin}
                          onChange={e => setChitimaMin(e.target.value)} placeholder="min"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 72 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>min</span>
                        <input type="number" min={0} max={59} value={chitimaSec}
                          onChange={e => setChitimaSec(e.target.value)} placeholder="sec"
                          style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 72 }} />
                        <span style={{ fontSize: 13, color: '#6b7280' }}>sec</span>
                      </div>
                      {chitimaTotalSec !== undefined && (
                        <p style={{ fontSize: 12, color: cfg.color, marginTop: 6, marginBottom: 0, fontWeight: 600 }}>
                          = {formatChitima(chitimaTotalSec)} ({chitimaTotalSec}s total) — longer is better
                        </p>
                      )}
                    </div>
                  )}

                  {/* T6 Juggling */}
                  {domainKey === 'ballMastery' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={0} max={200} value={juggles}
                        onChange={e => setJuggles(e.target.value)} placeholder="Count"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 110 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>juggles — higher is better</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Buttons ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={runAssessment}
            disabled={!playerName.trim() || !age}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700,
              backgroundColor: playerName.trim() && age ? '#1a5c2a' : '#d1d5db',
              color: playerName.trim() && age ? 'white' : '#9ca3af',
              transition: 'all 0.15s',
            }}>
            Find My Best Position
          </button>
          <button onClick={openHistory} disabled={!playerName.trim()}
            style={{ padding: '14px 20px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 14,
              fontWeight: 500, backgroundColor: 'white', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={16} /> History
          </button>
        </div>

        {/* ── History ───────────────────────────────────────────────────── */}
        {showHistory && (
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12 }}>History — {playerName}</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No assessments yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h, i) => {
                  const pc = POS_CONFIG[h.pos];
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: '#f9fafb', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>{h.date}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: pc.bgColor, color: pc.color }}>
                        {pc.emoji} {pc.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>AQ {h.aq}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{h.tier}</span>
                      <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>Best fit: <strong>{h.bestFit}</strong></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Best position hero */}
            {bestPos && (
              <div style={{
                borderRadius: 12, padding: 24,
                background: `linear-gradient(135deg, ${bestPos.color}, ${bestPos.color}cc)`,
                color: 'white',
              }}>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>{result.playerName} · GRS Position Analysis</p>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>Your best-fit position is</p>
                    <p style={{ margin: '4px 0 0', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
                      {bestPos.emoji} {bestPos.label}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>{bestPos.tagline}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Star size={16} />
                      <span style={{ fontSize: 24, fontWeight: 700 }}>{result.aq}</span>
                      <span style={{ fontSize: 14, opacity: 0.85 }}>AQ</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{result.tier} · {result.ageGroup}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                      Fit for {cfg.label}: <strong>{Math.round(result.pq[cfg.pqKey])}%</strong>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                      {result.testsCompleted} / 6 tests completed
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Position fit ranking */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>Your Position Fit Ranking</h3>
              {sortedFits.map(({ key, label, score }, idx) => {
                const pc       = POS_CONFIG[key];
                const barColor = score >= 70 ? '#15803d' : score >= 50 ? '#ca8a04' : '#dc2626';
                const isBest   = idx === 0;
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{pc.emoji}</span>
                        <span style={{ fontWeight: isBest ? 700 : 500, color: isBest ? pc.color : '#374151' }}>{label}</span>
                        {isBest && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, backgroundColor: pc.color, color: 'white' }}>
                            Best fit
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 700, color: barColor }}>{Math.round(score)}%</span>
                    </div>
                    <div style={{ height: 10, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: `${Math.min(score, 100)}%`,
                        backgroundColor: isBest ? pc.color : barColor,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Domain breakdown for selected position */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>
                {cfg.emoji} {cfg.label} Domain Scores — priority order
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderedDomains.map((key, idx) => {
                  const domain = result.domains[key];
                  const meta   = DOMAIN_META[key];
                  const isTop3 = idx < 3;
                  if (!domain.tested) {
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4, padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, minWidth: 32, color: '#9ca3af' }}>{medalLabel(idx)}</span>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{meta.label} — not tested</span>
                      </div>
                    );
                  }
                  const pct  = domain.percentile;
                  const barC = pct >= 75 ? '#15803d' : pct >= 50 ? '#ca8a04' : pct >= 25 ? '#ea580c' : '#dc2626';
                  return (
                    <div key={key} style={{
                      padding: '12px 14px', borderRadius: 8,
                      border: `1px solid ${isTop3 ? cfg.borderColor : '#f3f4f6'}`,
                      backgroundColor: isTop3 ? cfg.bgColor : '#fafafa',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: isTop3 ? cfg.color : '#9ca3af', fontWeight: 700, minWidth: 32 }}>{medalLabel(idx)}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{meta.label}</span>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>{domain.rawScore}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: barC }}>p{pct}</span>
                          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 6 }}>{domain.label}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barC, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scout narrative */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 10 }}>What Scouts See</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.scoutNarrative}</p>
            </div>

            {/* Coach recommendation */}
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#15803d', marginTop: 0, marginBottom: 10 }}>What to Work On</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.coachRecommendation}</p>
            </div>

            {/* Drills */}
            {result.suggestedDrills.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12 }}>Drills for Your Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {result.suggestedDrills.map(drill => (
                    <div key={drill.id} style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{drill.name}</span>
                        <span style={{ fontSize: 11, color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: 99, whiteSpace: 'nowrap' }}>{drill.duration}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{drill.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div style={{ backgroundColor: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginTop: 0, marginBottom: 8 }}>Notes</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.warnings.map((w, i) => <li key={i} style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>{w}</li>)}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
