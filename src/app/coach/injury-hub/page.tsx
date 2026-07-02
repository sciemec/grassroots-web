'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, AlertCircle, AlertTriangle, CheckCircle,
  Activity, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Biomechanics {
  knee_valgus:       boolean;
  hip_drop:          boolean;
  fatigue_breakdown: boolean;
  poor_mechanics:    boolean;
  balance_score:     number;
  endurance_score:   number;
  technique_score:   number;
}

interface PlayerRisk {
  user_id:                  string;
  name:                     string;
  position:                 string;
  age_group:                string;
  risk_score:               number;
  risk_level:               'low' | 'medium' | 'high';
  flags:                    string[];
  last_tested:              string | null;
  sessions_this_week:       number;
  match_minutes_this_week:  number;
  biomechanics:             Biomechanics;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_LABELS: Record<string, string> = {
  knee_valgus:       'Knee valgus',
  hip_drop:          'Hip drop',
  fatigue_breakdown: 'Fatigue breakdown',
  poor_mechanics:    'Poor mechanics',
  high_training_load:'High training load',
  previous_injury:   'Previous injury',
};

const FLAG_COLORS: Record<string, string> = {
  knee_valgus:       'bg-red-100 text-red-700',
  hip_drop:          'bg-orange-100 text-orange-700',
  fatigue_breakdown: 'bg-amber-100 text-amber-700',
  poor_mechanics:    'bg-yellow-100 text-yellow-700',
  high_training_load:'bg-blue-100 text-blue-700',
  previous_injury:   'bg-purple-100 text-purple-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const cfg = {
    high:   { icon: <AlertCircle   size={14} />, cls: 'bg-red-100   text-red-700',   label: 'High Risk'   },
    medium: { icon: <AlertTriangle size={14} />, cls: 'bg-amber-100 text-amber-700', label: 'Medium Risk' },
    low:    { icon: <CheckCircle   size={14} />, cls: 'bg-green-100 text-green-700', label: 'Low Risk'    },
  }[level];
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function ScoreBar({ value, label, danger = false }: { value: number; label: string; danger?: boolean }) {
  const pct   = Math.min(value, 100);
  const color = danger
    ? pct < 40 ? 'bg-red-500' : pct < 65 ? 'bg-amber-400' : 'bg-green-500'
    : 'bg-green-500';
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-gray-700">{value}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachInjuryHubPage() {
  const token = useAuthStore((s) => s.token);
  const [squad,   setSquad]   = useState<PlayerRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coach/injury-hub`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSquad(data.squad ?? []);
    } catch {
      setSquad(getMockSquad());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered   = squad.filter(p => filter === 'all' || p.risk_level === filter);
  const highCount  = squad.filter(p => p.risk_level === 'high').length;
  const medCount   = squad.filter(p => p.risk_level === 'medium').length;
  const lowCount   = squad.filter(p => p.risk_level === 'low').length;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }} className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/coach" className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} style={{ color: '#1a5c2a' }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-black" style={{ color: '#1a5c2a' }}>Injury Risk Hub</h1>
          <p className="text-xs text-gray-400">AI-powered squad health monitoring</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { count: highCount,  label: 'High Risk',   color: 'text-red-600',   bg: 'bg-red-50   border-red-100'   },
          { count: medCount,   label: 'Medium Risk',  color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { count: lowCount,   label: 'Cleared',      color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
        ].map(({ count, label, color, bg }) => (
          <div key={label} className={`rounded-2xl p-3 border text-center ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {highCount > 0 && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>
            <strong>{highCount} player{highCount > 1 ? 's' : ''}</strong> at high injury risk.
            Consider reducing their training load immediately.
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'text-white shadow-sm'
                : 'bg-white border text-gray-500 hover:bg-gray-50'
            }`}
            style={filter === f ? { backgroundColor: '#1a5c2a' } : {}}
          >
            {f === 'all' ? `All (${squad.length})` : f}
          </button>
        ))}
      </div>

      {/* Player list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border shadow-sm">
          <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
          <p className="font-semibold text-gray-700">No players in this category</p>
          <p className="text-sm text-gray-400 mt-1">All your players are healthy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(player => {
            const isOpen = expanded === player.user_id;
            return (
              <div key={player.user_id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">

                {/* Player row */}
                <button
                  className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : player.user_id)}
                >
                  {/* Risk score circle */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white shrink-0"
                    style={{
                      backgroundColor:
                        player.risk_level === 'high'   ? '#ef4444' :
                        player.risk_level === 'medium' ? '#f59e0b' : '#22c55e',
                    }}
                  >
                    {player.risk_score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{player.name}</p>
                    <p className="text-xs text-gray-400">{player.position} · {player.age_group}</p>
                    {/* Flags */}
                    {player.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {player.flags.map(flag => (
                          <span
                            key={flag}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${FLAG_COLORS[flag] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {FLAG_LABELS[flag] ?? flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <RiskBadge level={player.risk_level} />
                    {isOpen
                      ? <ChevronUp size={14} className="text-gray-400" />
                      : <ChevronDown size={14} className="text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">

                    {/* Two-column stats */}
                    <div className="grid grid-cols-2 gap-3">

                      {/* Training load */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Training Load</p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sessions / week</span>
                            <span className={`font-bold ${player.sessions_this_week >= 4 ? 'text-red-600' : 'text-gray-700'}`}>
                              {player.sessions_this_week}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Match minutes</span>
                            <span className={`font-bold ${player.match_minutes_this_week > 150 ? 'text-amber-600' : 'text-gray-700'}`}>
                              {player.match_minutes_this_week} min
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last AI test</span>
                            <span className="font-bold text-gray-700 text-[10px]">
                              {player.last_tested ?? 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Biomechanics flags */}
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Biomechanics</p>
                        <div className="space-y-1.5 text-xs">
                          {[
                            { label: 'Knee valgus',  val: player.biomechanics.knee_valgus       },
                            { label: 'Hip drop',     val: player.biomechanics.hip_drop           },
                            { label: 'Fatigue',      val: player.biomechanics.fatigue_breakdown  },
                            { label: 'Poor form',    val: player.biomechanics.poor_mechanics     },
                          ].map(({ label, val }) => (
                            <div key={label} className="flex justify-between items-center">
                              <span className="text-gray-500">{label}</span>
                              <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-full ${val ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {val ? 'Detected' : 'Clear'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score bars */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Athletic Scores</p>
                      <ScoreBar value={player.biomechanics.balance_score}   label="Balance"   danger />
                      <ScoreBar value={player.biomechanics.endurance_score} label="Endurance" danger />
                      <ScoreBar value={player.biomechanics.technique_score} label="Technique" danger />
                    </div>

                    {/* AI Recommendation */}
                    <div className={`rounded-xl p-3 text-xs border ${
                      player.risk_level === 'high'
                        ? 'bg-red-50   border-red-100   text-red-800'
                        : player.risk_level === 'medium'
                        ? 'bg-amber-50 border-amber-100 text-amber-800'
                        : 'bg-green-50 border-green-100 text-green-800'
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold mb-2">
                        <Activity size={13} />
                        Coach Recommendation
                      </div>
                      <ul className="space-y-1">
                        {player.risk_level === 'high' && (
                          <li>• Rest 48 hours minimum. No high-intensity or plyometric training.</li>
                        )}
                        {player.risk_level === 'medium' && (
                          <li>• Light technical training only. Monitor closely during session.</li>
                        )}
                        {player.risk_level === 'low' && (
                          <li>• Player cleared for full training and match selection.</li>
                        )}
                        {player.biomechanics.knee_valgus && (
                          <li>• Knee valgus: single-leg squats + VMO strengthening before return to play.</li>
                        )}
                        {player.biomechanics.hip_drop && (
                          <li>• Hip drop: lateral band walks + clam shells to strengthen glutes.</li>
                        )}
                        {player.biomechanics.fatigue_breakdown && (
                          <li>• Fatigue detected in movement: reduce training volume by 30% this week.</li>
                        )}
                        {player.sessions_this_week >= 4 && (
                          <li>• {player.sessions_this_week} sessions logged this week — overtraining risk is high.</li>
                        )}
                        {!player.last_tested && (
                          <li>• No AI fitness test on record. Ask player to complete the Athletic Test Battery.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-[10px] text-gray-400 mt-6">
        Risk scores are calculated from MediaPipe biomechanics + training load data.
        Always use clinical judgement alongside AI recommendations.
      </p>
    </main>
  );
}

// ─── Mock data (fallback when API not yet live) ────────────────────────────────

function getMockSquad(): PlayerRisk[] {
  return [
    {
      user_id: '1', name: 'Takudzwa Moyo', position: 'Striker', age_group: 'U17',
      risk_score: 85, risk_level: 'high',
      flags: ['knee_valgus', 'high_training_load'],
      last_tested: '2026-06-28',
      sessions_this_week: 5, match_minutes_this_week: 180,
      biomechanics: { knee_valgus: true, hip_drop: false, fatigue_breakdown: true, poor_mechanics: true, balance_score: 38, endurance_score: 32, technique_score: 41 },
    },
    {
      user_id: '2', name: 'Farai Chikwanda', position: 'Centre-Back', age_group: 'Senior',
      risk_score: 55, risk_level: 'medium',
      flags: ['hip_drop', 'previous_injury'],
      last_tested: '2026-06-25',
      sessions_this_week: 3, match_minutes_this_week: 90,
      biomechanics: { knee_valgus: false, hip_drop: true, fatigue_breakdown: false, poor_mechanics: false, balance_score: 52, endurance_score: 61, technique_score: 58 },
    },
    {
      user_id: '3', name: 'Simba Ndlovu', position: 'Winger', age_group: 'U17',
      risk_score: 18, risk_level: 'low',
      flags: [],
      last_tested: '2026-06-30',
      sessions_this_week: 2, match_minutes_this_week: 45,
      biomechanics: { knee_valgus: false, hip_drop: false, fatigue_breakdown: false, poor_mechanics: false, balance_score: 78, endurance_score: 72, technique_score: 80 },
    },
    {
      user_id: '4', name: 'Blessed Mutasa', position: 'Midfielder', age_group: 'Senior',
      risk_score: 70, risk_level: 'high',
      flags: ['fatigue_breakdown', 'high_training_load'],
      last_tested: '2026-06-29',
      sessions_this_week: 4, match_minutes_this_week: 160,
      biomechanics: { knee_valgus: false, hip_drop: true, fatigue_breakdown: true, poor_mechanics: false, balance_score: 44, endurance_score: 35, technique_score: 50 },
    },
  ];
}
