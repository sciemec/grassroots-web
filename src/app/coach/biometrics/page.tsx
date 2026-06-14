'use client';
// src/app/coach/biometrics/page.tsx
// GRS Talent ID Tool — no camera required
// Coach enters 6 GRS test scores for a player, GRS Engine scores them,
// results are sorted by the selected coaching department priority.
// History stored in localStorage key: grs_talent_id_{playerName_snake}

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, ChevronDown, ChevronUp, History, Trophy } from 'lucide-react';
import { evaluate, type RawTestInputs, type GRSResult, type Gender, type Position } from '@/lib/grs-engine';

// ── Department configuration ─────────────────────────────────────────────────
type DeptKey = 'attack' | 'defence' | 'midfield' | 'goalkeeper';
type DomainKey = 'linearSpeed' | 'cognitiveSpeed' | 'ballMastery' | 'explosivePower' | 'balance' | 'endurance';

interface DeptConfig {
  label:       string;
  grsPosition: Position;
  pqKey:       'striker' | 'winger' | 'midfielder' | 'defender' | 'goalkeeper';
  color:       string;
  bgColor:     string;
  borderColor: string;
  priority:    DomainKey[];
}

const DEPT_CONFIG: Record<DeptKey, DeptConfig> = {
  attack: {
    label: 'Attack',
    grsPosition: 'striker',
    pqKey: 'striker',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    priority: ['linearSpeed', 'cognitiveSpeed', 'ballMastery', 'explosivePower', 'balance', 'endurance'],
  },
  defence: {
    label: 'Defence',
    grsPosition: 'defender',
    pqKey: 'defender',
    color: '#1d4ed8',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    priority: ['explosivePower', 'linearSpeed', 'cognitiveSpeed', 'balance', 'endurance', 'ballMastery'],
  },
  midfield: {
    label: 'Midfield',
    grsPosition: 'midfielder',
    pqKey: 'midfielder',
    color: '#15803d',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    priority: ['endurance', 'cognitiveSpeed', 'balance', 'ballMastery', 'linearSpeed', 'explosivePower'],
  },
  goalkeeper: {
    label: 'Goalkeeper',
    grsPosition: 'goalkeeper',
    pqKey: 'goalkeeper',
    color: '#7c3aed',
    bgColor: '#faf5ff',
    borderColor: '#ddd6fe',
    priority: ['cognitiveSpeed', 'explosivePower', 'balance', 'linearSpeed', 'ballMastery', 'endurance'],
  },
};

// ── Domain display metadata ───────────────────────────────────────────────────
const DOMAIN_META: Record<DomainKey, { label: string; test: string }> = {
  linearSpeed:    { label: 'Sprint Speed',         test: 'T2 — 20m Sprint'      },
  cognitiveSpeed: { label: 'Reaction / Decision',  test: 'T4 — Reaction Catch'  },
  ballMastery:    { label: 'Ball Mastery',          test: 'T6 — Juggling'        },
  explosivePower: { label: 'Explosive Power',       test: 'T1 — Jump'            },
  balance:        { label: 'Balance',               test: 'T3 — Balance'         },
  endurance:      { label: 'Endurance',             test: 'T5 — Chitima Run'     },
};

// ── Reference ranking table rows ──────────────────────────────────────────────
const TABLE_ROWS = [
  { test: 'T1 — Jump (cm)',           attack: 4, defence: 1, midfield: 6, goalkeeper: 2 },
  { test: 'T2 — 20m Sprint (sec)',    attack: 1, defence: 2, midfield: 5, goalkeeper: 4 },
  { test: 'T3 — Balance (errors)',    attack: 5, defence: 4, midfield: 3, goalkeeper: 3 },
  { test: 'T4 — Reaction (catches)',  attack: 2, defence: 3, midfield: 2, goalkeeper: 1 },
  { test: 'T5 — Chitima (min)',       attack: 6, defence: 5, midfield: 1, goalkeeper: 6 },
  { test: 'T6 — Juggling (count)',    attack: 3, defence: 6, midfield: 4, goalkeeper: 5 },
];

// ── Saved assessment type ─────────────────────────────────────────────────────
interface SavedAssessment {
  date:  string;
  dept:  DeptKey;
  aq:    number;
  tier:  string;
  rank:  string;
  pqFit: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function storageKey(name: string) {
  return `grs_talent_id_${name.toLowerCase().replace(/\s+/g, '_')}`;
}

function loadHistory(name: string): SavedAssessment[] {
  try {
    const raw = localStorage.getItem(storageKey(name));
    return raw ? (JSON.parse(raw) as SavedAssessment[]) : [];
  } catch { return []; }
}

function saveToHistory(name: string, entry: SavedAssessment) {
  try {
    const hist = loadHistory(name);
    hist.unshift(entry);
    localStorage.setItem(storageKey(name), JSON.stringify(hist.slice(0, 10)));
  } catch { /* storage unavailable */ }
}

function formatChitima(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}

function rankColor(rank: string) {
  const map: Record<string, string> = {
    Lion: '#f59e0b', Star: '#6366f1', Attacker: '#dc2626',
    Skilled: '#15803d', Player: '#2563eb', Student: '#6b7280',
  };
  return map[rank] ?? '#6b7280';
}

function medalLabel(idx: number) {
  return idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GRSTalentIDPage() {
  const [dept,        setDept]        = useState<DeptKey>('attack');
  const [playerName,  setPlayerName]  = useState('');
  const [age,         setAge]         = useState('');
  const [gender,      setGender]      = useState<Gender>('male');
  const [verifiedBy,  setVerifiedBy]  = useState('');

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
  const [history,     setHistory]     = useState<SavedAssessment[]>([]);
  const [showTable,   setShowTable]   = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const cfg = DEPT_CONFIG[dept];

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
      playerName:    playerName.trim(),
      age:           parseInt(age, 10),
      gender,
      position:      cfg.grsPosition,
      sessionDate:   new Date().toISOString().split('T')[0],
      verifiedBy:    verifiedBy.trim() || 'Coach',
      coachVerified: true,
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

    const entry: SavedAssessment = {
      date:  new Date().toLocaleDateString(),
      dept,
      aq:    res.aq,
      tier:  res.tier,
      rank:  res.rank,
      pqFit: Math.round(res.pq[cfg.pqKey]),
    };
    saveToHistory(playerName.trim(), entry);
    setHistory(loadHistory(playerName.trim()));
    setShowHistory(false);
  }, [playerName, age, gender, verifiedBy, dept, cfg,
      jumpCm, sprintSec, balRightOpen, balLeftOpen, balRightClosed, balLeftClosed,
      catches, chitimaTotalSec, juggles]);

  const openHistory = () => {
    if (playerName.trim()) {
      setHistory(loadHistory(playerName.trim()));
      setShowHistory(true);
    }
  };

  const orderedDomains = cfg.priority;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }}>
      {/* Nav */}
      <div style={{ backgroundColor: '#1a5c2a', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/coach" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> Coach Hub
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span>
        <span style={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Target size={16} /> GRS Talent ID
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>GRS Talent ID Tool</h1>
          <p style={{ fontSize: 14, color: '#555', marginTop: 4 }}>
            Enter a player&apos;s 6 GRS test scores. Results are ranked by fit for the selected coaching role.
          </p>
        </div>

        {/* ── Reference table ──────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 24, overflow: 'hidden' }}>
          <button
            onClick={() => setShowTable(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#111' }}
          >
            <span>Priority Ranking Table — which tests matter most per role?</span>
            {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showTable && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 20px', fontWeight: 600, color: '#374151' }}>GRS Test</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#dc2626' }}>Attack</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#1d4ed8' }}>Defence</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#15803d' }}>Midfield</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#7c3aed' }}>Goalkeeper</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={row.test} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 20px', fontWeight: 500, color: '#111' }}>{row.test}</td>
                      {(['attack', 'defence', 'midfield', 'goalkeeper'] as DeptKey[]).map(d => {
                        const val = row[d];
                        const top3 = val <= 3;
                        const colors: Record<DeptKey, string> = { attack: '#dc2626', defence: '#1d4ed8', midfield: '#15803d', goalkeeper: '#7c3aed' };
                        return (
                          <td key={d} style={{ textAlign: 'center', padding: '10px 16px' }}>
                            <span style={{
                              display: 'inline-block', minWidth: 28, padding: '2px 8px', borderRadius: 99,
                              fontSize: 12, fontWeight: 700,
                              backgroundColor: top3 ? colors[d] : '#f3f4f6',
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
                #1 = most important · #6 = least important. Coloured badges = top 3 for that role.
              </p>
            </div>
          )}
        </div>

        {/* ── Player details ────────────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, marginTop: 0 }}>Player Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Player Name *', value: playerName, set: setPlayerName, ph: 'e.g. Tendai Moyo', type: 'text' },
              { label: 'Age *',         value: age,        set: setAge,        ph: 'e.g. 16',          type: 'number' },
              { label: 'Assessed By',   value: verifiedBy, set: setVerifiedBy, ph: 'Coach name',        type: 'text' },
            ].map(({ label, value, set, ph, type }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</label>
                <input
                  type={type} value={value} placeholder={ph}
                  onChange={e => set(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            ))}
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

        {/* ── Department selector ───────────────────────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12, marginTop: 0 }}>Coaching Role</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {(Object.entries(DEPT_CONFIG) as [DeptKey, DeptConfig][]).map(([key, c]) => (
              <button key={key} onClick={() => setDept(key)}
                style={{
                  padding: '12px 8px', borderRadius: 8,
                  border: `2px solid ${dept === key ? c.color : '#e5e7eb'}`,
                  backgroundColor: dept === key ? c.bgColor : 'white',
                  color: dept === key ? c.color : '#374151',
                  fontWeight: dept === key ? 700 : 500,
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.15s',
                }}>
                {c.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 10, marginBottom: 0 }}>
            Inputs below are sorted by priority for <strong style={{ color: cfg.color }}>{cfg.label}</strong>.
            &nbsp;🥇🥈🥉 = top 3 most important for this role.
          </p>
        </div>

        {/* ── Test inputs sorted by dept priority ──────────────────────── */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 16, marginTop: 0 }}>Test Scores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
                        onChange={e => setJumpCm(e.target.value)} placeholder="Jump height"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 140 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>cm — higher is better</span>
                    </div>
                  )}

                  {/* T2 Sprint */}
                  {domainKey === 'linearSpeed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={2} max={10} step={0.01} value={sprintSec}
                        onChange={e => setSprintSec(e.target.value)} placeholder="20m time"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 140 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>seconds — lower is better</span>
                    </div>
                  )}

                  {/* T3 Balance */}
                  {domainKey === 'balance' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 420 }}>
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
                        Number of foot-touch corrections. Lower = better. Eyes-closed weighted 1.5×.
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
                      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, marginBottom: 0 }}>5 = all caught (excellent) · Higher is better</p>
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
                        <span style={{ fontSize: 13, color: '#6b7280' }}>sec — longer is better</span>
                      </div>
                      {chitimaTotalSec !== undefined && (
                        <p style={{ fontSize: 12, color: cfg.color, marginTop: 6, marginBottom: 0, fontWeight: 600 }}>
                          = {formatChitima(chitimaTotalSec)} ({chitimaTotalSec}s)
                        </p>
                      )}
                    </div>
                  )}

                  {/* T6 Juggling */}
                  {domainKey === 'ballMastery' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={0} max={200} value={juggles}
                        onChange={e => setJuggles(e.target.value)} placeholder="Count"
                        style={{ padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, width: 120 }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>juggles — higher is better</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Action buttons ────────────────────────────────────────────── */}
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
            Run GRS Assessment
          </button>
          <button
            onClick={openHistory}
            disabled={!playerName.trim()}
            style={{
              padding: '14px 20px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              backgroundColor: 'white', color: '#374151', display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <History size={16} /> History
          </button>
        </div>

        {/* ── History panel ─────────────────────────────────────────────── */}
        {showHistory && (
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={16} /> History — {playerName}
            </h3>
            {history.length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No assessments yet. Run one to start tracking.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, backgroundColor: '#f9fafb', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>{h.date}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: DEPT_CONFIG[h.dept].bgColor, color: DEPT_CONFIG[h.dept].color }}>
                      {DEPT_CONFIG[h.dept].label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>AQ {h.aq}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{h.tier}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: rankColor(h.rank), color: 'white' }}>{h.rank}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>Fit: {h.pqFit}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* AQ header card */}
            <div style={{ borderRadius: 12, padding: 24, background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>{result.playerName} · {cfg.label} Assessment</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                    <span style={{ fontSize: 52, fontWeight: 800, lineHeight: 1 }}>{result.aq}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, opacity: 0.85 }}>AQ Score / 100</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{result.tier} · {result.ageGroup}</p>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    <Trophy size={18} />
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{result.rank}</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.85 }}>
                    {cfg.label} Fit: <strong>{Math.round(result.pq[cfg.pqKey])}%</strong>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.85 }}>
                    {result.testsCompleted} / 6 tests completed
                  </p>
                </div>
              </div>
            </div>

            {/* Position fit bars */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>All Position Fits</h3>
              {(Object.entries({ Attack: result.pq.striker, Winger: result.pq.winger, Midfield: result.pq.midfielder, Defence: result.pq.defender, Goalkeeper: result.pq.goalkeeper }) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([pos, score]) => {
                  const barColor = score >= 70 ? '#15803d' : score >= 50 ? '#ca8a04' : '#dc2626';
                  return (
                    <div key={pos} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{pos}</span>
                        <span style={{ fontWeight: 700, color: barColor }}>{Math.round(score)}%</span>
                      </div>
                      <div style={{ height: 8, backgroundColor: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(score, 100)}%`, backgroundColor: barColor, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Domain scores in dept priority order */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 14 }}>
                Domain Scores — {cfg.label} priority order
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderedDomains.map((key, idx) => {
                  const domain = result.domains[key];
                  const meta   = DOMAIN_META[key];
                  const isTop3 = idx < 3;
                  if (!domain.tested) {
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.4, padding: '8px 14px' }}>
                        <span style={{ fontSize: 11, minWidth: 28, color: '#9ca3af' }}>{medalLabel(idx)}</span>
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{meta.label} — not tested</span>
                      </div>
                    );
                  }
                  const pct = domain.percentile;
                  const barC = pct >= 75 ? '#15803d' : pct >= 50 ? '#ca8a04' : pct >= 25 ? '#ea580c' : '#dc2626';
                  return (
                    <div key={key} style={{
                      padding: '12px 14px', borderRadius: 8,
                      border: `1px solid ${isTop3 ? cfg.borderColor : '#f3f4f6'}`,
                      backgroundColor: isTop3 ? cfg.bgColor : '#fafafa',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
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
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 10 }}>Scout Narrative</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.scoutNarrative}</p>
            </div>

            {/* Coach recommendation */}
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#15803d', marginTop: 0, marginBottom: 10 }}>Coach Recommendation</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: 0 }}>{result.coachRecommendation}</p>
            </div>

            {/* Suggested drills */}
            {result.suggestedDrills.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111', marginTop: 0, marginBottom: 12 }}>Suggested Drills</h3>
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

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div style={{ backgroundColor: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginTop: 0, marginBottom: 8 }}>Notes</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.warnings.map((w, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
