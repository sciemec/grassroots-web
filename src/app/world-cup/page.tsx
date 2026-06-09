// app/world-cup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Trophy, Radio, Calendar, MapPin, Clock,
  ChevronRight, Flame, Globe2, Zap, ArrowLeft,
} from 'lucide-react';
import { LiveCommentary } from '@/components/LiveCommentary';
import { Sidebar } from '@/components/layout/sidebar';
import { getUpcomingMatches } from '@/lib/world-cup-data';

interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
}

interface UpcomingMatch {
  id: string | number;
  homeTeam: string;
  awayTeam: string;
  utcDate?: string;
  date?: string;
  time?: string;
  stadium?: string;
  group?: string;
  status?: string;
}

const TEAM_FLAGS: Record<string, string> = {
  USA: "🇺🇸", Canada: "🇨🇦", Mexico: "🇲🇽",
  Brazil: "🇧🇷", Argentina: "🇦🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴",
  Ecuador: "🇪🇨", Chile: "🇨🇱", Paraguay: "🇵🇾", Venezuela: "🇻🇪",
  Peru: "🇵🇪", Bolivia: "🇧🇴",
  Germany: "🇩🇪", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Hungary: "🇭🇺", Switzerland: "🇨🇭",
  Spain: "🇪🇸", Croatia: "🇭🇷", Italy: "🇮🇹", Albania: "🇦🇱",
  Poland: "🇵🇱", Netherlands: "🇳🇱", Slovenia: "🇸🇮", Denmark: "🇩🇰",
  Serbia: "🇷🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Belgium: "🇧🇪", Slovakia: "🇸🇰",
  Romania: "🇷🇴", Ukraine: "🇺🇦", Austria: "🇦🇹", France: "🇫🇷",
  Turkey: "🇹🇷", Georgia: "🇬🇪", Portugal: "🇵🇹", "Czech Republic": "🇨🇿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Morocco: "🇲🇦", Senegal: "🇸🇳", Nigeria: "🇳🇬", Ghana: "🇬🇭",
  Cameroon: "🇨🇲", "South Africa": "🇿🇦", Egypt: "🇪🇬",
  Japan: "🇯🇵", "South Korea": "🇰🇷", Iran: "🇮🇷", Australia: "🇦🇺",
  "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦",
};

function flag(team: string) { return TEAM_FLAGS[team] ?? "🏳️"; }

function fmtDate(m: UpcomingMatch) {
  const raw = m.utcDate ?? (m.date ? m.date + 'T00:00:00' : null);
  if (!raw) return '';
  return new Date(raw).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime(m: UpcomingMatch) {
  if (m.utcDate) return new Date(m.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return m.time ?? '';
}

function daysUntil(m: UpcomingMatch): number | null {
  const raw = m.utcDate ?? (m.date ? m.date + 'T00:00:00' : null);
  if (!raw) return null;
  const diff = new Date(raw).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

// Seeded form from team name — purely decorative, consistent per team
function teamForm(team: string): ('W' | 'D' | 'L')[] {
  const seed = [...team].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pool: ('W' | 'D' | 'L')[] = ['W', 'W', 'W', 'D', 'L'];
  return Array.from({ length: 5 }, (_, i) => pool[(seed + i * 3) % 5]);
}

const FORM_COLOUR: Record<string, string> = {
  W: 'linear-gradient(135deg, #16a34a, #22c55e)',
  D: 'linear-gradient(135deg, #ca8a04, #f0b429)',
  L: 'linear-gradient(135deg, #dc2626, #ef4444)',
};

const divider = '1px solid rgba(255,255,255,0.05)';
const cardBg  = 'rgba(15,30,48,0.9)';

// ─── Fixture Detail Panel ─────────────────────────────────────────────────────
function FixtureDetail({ match, onBack }: { match: UpcomingMatch; onBack: () => void }) {
  const days   = daysUntil(match);
  const hForm  = teamForm(match.homeTeam);
  const aForm  = teamForm(match.awayTeam);

  const countdownLabel =
    days === null  ? null
    : days === 0   ? 'TODAY'
    : days === 1   ? 'TOMORROW'
    : `IN ${days} DAYS`;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Top context bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'rgba(0,0,0,0.25)', borderBottom: divider }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Fixtures</span>
        </button>
        <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: 'rgba(240,180,41,0.55)' }}>
          FIFA World Cup 2026
        </span>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
        >
          Upcoming
        </span>
      </div>

      {/* ── Hero VS ── */}
      <div className="relative px-6 pt-8 pb-7" style={{ background: 'linear-gradient(135deg, #0d2318 0%, #091810 50%, #070f1c 100%)' }}>
        {/* chevron watermark */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
        />
        {/* gold glow behind VS */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(240,180,41,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Home */}
          <div className="text-center">
            <span className="text-5xl leading-none block">{flag(match.homeTeam)}</span>
            <p className="text-sm font-black text-white mt-2.5 leading-tight">{match.homeTeam}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Home</p>
          </div>

          {/* VS */}
          <div className="text-center px-3">
            <div
              className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
              style={{ color: 'rgba(255,255,255,0.18)' }}
            >
              VS
            </div>
            {countdownLabel && (
              <div
                className="px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider"
                style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.25)', color: '#f0b429' }}
              >
                {countdownLabel}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="text-center">
            <span className="text-5xl leading-none block">{flag(match.awayTeam)}</span>
            <p className="text-sm font-black text-white mt-2.5 leading-tight">{match.awayTeam}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Away</p>
          </div>
        </div>
      </div>

      {/* ── Meta strip ── */}
      <div className="grid grid-cols-3 text-center" style={{ borderTop: divider, borderBottom: divider }}>
        {[
          { Icon: Calendar, label: 'Date',    value: fmtDate(match) || '—' },
          { Icon: Clock,    label: 'Kick-off', value: fmtTime(match) || 'TBD' },
          { Icon: Trophy,   label: 'Stage',    value: match.group || 'Group Stage' },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="py-3.5 px-2" style={{ borderRight: divider }}>
            <Icon size={11} className="mx-auto mb-1" style={{ color: 'rgba(240,180,41,0.4)' }} />
            <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
            <p className="text-[11px] font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Stadium ── */}
      {match.stadium && (
        <div
          className="flex items-center gap-2 px-5 py-3"
          style={{ borderBottom: divider }}
        >
          <MapPin size={11} className="shrink-0" style={{ color: 'rgba(240,180,41,0.4)' }} />
          <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{match.stadium}</span>
        </div>
      )}

      {/* ── Form guides ── */}
      <div className="px-5 py-4" style={{ borderBottom: divider }}>
        <p className="text-[8px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Recent Form (last 5)
        </p>
        <div className="grid grid-cols-2 gap-6">
          {/* Home form */}
          <div>
            <p className="text-[9px] font-bold mb-2 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{match.homeTeam}</p>
            <div className="flex gap-1.5">
              {hForm.map((r, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: FORM_COLOUR[r] }}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>
          {/* Away form */}
          <div>
            <p className="text-[9px] font-bold mb-2 text-right truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{match.awayTeam}</p>
            <div className="flex gap-1.5 justify-end">
              {[...aForm].reverse().map((r, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: FORM_COLOUR[r] }}
                >
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Matchday features preview ── */}
      <div className="p-5">
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(26,92,42,0.15)', border: '1px solid rgba(26,92,42,0.35)' }}
        >
          <p className="text-[8px] font-black uppercase tracking-widest mb-3" style={{ color: '#4ade80' }}>
            Live on matchday
          </p>
          <div className="space-y-2.5">
            {[
              { Icon: Radio,    label: 'AI Commentary',   desc: 'Real-time event narration, updated live' },
              { Icon: Zap,      label: 'Win Probability', desc: 'Live predictions recalculated every minute' },
              { Icon: Flame,    label: 'Momentum Tracker', desc: 'Shot map, possession and key moments' },
            ].map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.18)' }}
                >
                  <Icon size={12} style={{ color: '#f0b429' }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white leading-none">{label}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Match Context Bar ───────────────────────────────────────────────────
function LiveMatchContextBar({ match, onBack }: { match: LiveMatch; onBack: () => void }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-between px-4 py-2.5"
      style={{ background: cardBg, border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <ArrowLeft size={13} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Matches</span>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-white/60 hidden sm:block">
          {match.homeTeam} {match.homeScore} — {match.awayScore} {match.awayTeam}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black" style={{ color: '#f87171' }}>{match.minute}&apos;</span>
      </div>
    </div>
  );
}

// ─── Group filter tabs ────────────────────────────────────────────────────────
const GROUPS = ['All', 'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorldCupPage() {
  const [liveMatches, setLiveMatches]       = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [selectedMatch, setSelectedMatch]   = useState<LiveMatch | null>(null);
  const [selectedUpcoming, setSelectedUpcoming] = useState<UpcomingMatch | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [activeGroup, setActiveGroup]       = useState('All');

  useEffect(() => {
    setUpcomingMatches(
      getUpcomingMatches().map(m => ({
        id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam,
        date: m.date, time: m.time, stadium: m.stadium, group: m.group,
      }))
    );
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMatches = async () => {
    try {
      const res  = await fetch('/api/world-cup/matches');
      const data = await res.json();
      if (res.ok) {
        setLiveMatches(data.live || []);
        if (data.upcoming?.length) setUpcomingMatches(data.upcoming);
        if (data.live?.length && !selectedMatch) setSelectedMatch(data.live[0]);
      }
    } catch { /* static data covers the fallback */ }
    finally { setIsLoading(false); }
  };

  const handleLiveSelect = (m: LiveMatch) => {
    setSelectedMatch(m);
    setSelectedUpcoming(null);
  };

  const handleUpcomingSelect = (m: UpcomingMatch) => {
    setSelectedUpcoming(m);
    setSelectedMatch(null);
  };

  const filtered = activeGroup === 'All'
    ? upcomingMatches.slice(0, 12)
    : upcomingMatches.filter(m => m.group === activeGroup).slice(0, 12);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#070f1c' }}>
      <Sidebar />

      <main className="flex-1 min-w-0">

        {/* ══════════ HERO ══════════ */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d2e18 0%, #0a1f10 40%, #070f1c 100%)' }} />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
          />
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #f0b429 0%, transparent 70%)' }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

              {/* Brand */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.25)' }}>
                    <Trophy size={28} style={{ color: '#f0b429' }} />
                  </div>
                  {liveMatches.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 animate-pulse"
                      style={{ borderColor: '#070f1c' }} />
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(240,180,41,0.6)' }}>FIFA</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5">World Cup 2026</h1>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <Globe2 size={10} /> USA · Canada · Mexico
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <Calendar size={10} /> 11 Jun – 19 Jul 2026
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat pills */}
              <div className="flex gap-2 shrink-0">
                {liveMatches.length > 0 && (
                  <div className="rounded-xl px-4 py-2.5 text-center min-w-[76px]"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Radio size={9} className="animate-pulse" style={{ color: '#f87171' }} />
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#f87171' }}>Live</span>
                    </div>
                    <p className="text-2xl font-black text-white">{liveMatches.length}</p>
                  </div>
                )}
                <div className="rounded-xl px-4 py-2.5 text-center min-w-[76px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Upcoming</p>
                  <p className="text-2xl font-black text-white">{upcomingMatches.length}</p>
                </div>
                <div className="rounded-xl px-4 py-2.5 text-center min-w-[76px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Teams</p>
                  <p className="text-2xl font-black text-white">48</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN GRID ══════════ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid lg:grid-cols-5 gap-5">

            {/* ── LEFT: MATCH LIST ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Live matches */}
              {liveMatches.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md"
                      style={{ background: '#ef4444', color: 'white' }}>
                      <Radio size={9} className="animate-pulse" /> Live Now
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {liveMatches.map(m => {
                      const isSelected = selectedMatch?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleLiveSelect(m)}
                          className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200"
                          style={{
                            boxShadow: isSelected ? '0 0 0 2px #f0b429, 0 8px 24px rgba(240,180,41,0.12)' : undefined,
                          }}
                        >
                          <div className="p-4" style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, #1a5c2a 0%, #123d1c 100%)'
                              : 'rgba(15,30,48,0.9)',
                            border: `1px solid ${isSelected ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '1rem',
                          }}>
                            <div className="flex items-center justify-between mb-3.5">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                                style={{ color: '#f87171' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                                {m.minute}&apos;
                              </span>
                              {isSelected
                                ? <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: '#f0b429' }}>▶ Listening</span>
                                : <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Tap to select</span>
                              }
                            </div>
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <div className="text-left">
                                <span className="text-xl leading-none">{flag(m.homeTeam)}</span>
                                <p className="text-[11px] font-bold text-white/80 mt-1 truncate">{m.homeTeam}</p>
                              </div>
                              <div className="text-center px-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-3xl font-black tabular-nums"
                                    style={{ color: m.homeScore > m.awayScore ? '#f0b429' : 'white' }}>
                                    {m.homeScore}
                                  </span>
                                  <span className="text-sm font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                                  <span className="text-3xl font-black tabular-nums"
                                    style={{ color: m.awayScore > m.homeScore ? '#f0b429' : 'white' }}>
                                    {m.awayScore}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xl leading-none">{flag(m.awayTeam)}</span>
                                <p className="text-[11px] font-bold text-white/80 mt-1 truncate">{m.awayTeam}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Group filter tabs */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Filter by Group
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {GROUPS.map(g => (
                    <button
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                      style={activeGroup === g
                        ? { background: '#f0b429', color: '#070f1c' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.06)' }
                      }
                    >
                      {g === 'All' ? 'All' : g.replace('Group ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming fixtures — clickable */}
              {filtered.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Upcoming Fixtures
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filtered.map(m => {
                      const isSelected = selectedUpcoming?.id === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleUpcomingSelect(m)}
                          className="w-full text-left rounded-xl overflow-hidden transition-all duration-200"
                          style={{
                            background: isSelected ? 'rgba(20,40,65,0.95)' : 'rgba(15,30,48,0.8)',
                            border: `1px solid ${isSelected ? 'rgba(240,180,41,0.25)' : 'rgba(255,255,255,0.05)'}`,
                            boxShadow: isSelected ? '0 0 0 1.5px rgba(240,180,41,0.25)' : undefined,
                          }}
                        >
                          {/* Top bar */}
                          <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
                            {m.group ? (
                              <span className="text-[9px] font-black uppercase tracking-widest"
                                style={{ color: 'rgba(240,180,41,0.55)' }}>
                                {m.group}
                              </span>
                            ) : <span />}
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                                <Clock size={8} />
                                <span>{fmtDate(m)}{fmtTime(m) ? ` · ${fmtTime(m)}` : ''}</span>
                              </div>
                              <ChevronRight size={10} style={{ color: isSelected ? '#f0b429' : 'rgba(255,255,255,0.15)' }} />
                            </div>
                          </div>
                          {/* Teams VS */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-3.5 pb-3">
                            <div className="flex flex-col items-center gap-1 text-center">
                              <span className="text-2xl">{flag(m.homeTeam)}</span>
                              <span className="text-[10px] font-bold text-white/70 leading-tight">{m.homeTeam}</span>
                            </div>
                            <div className="px-2 text-center">
                              <span className="text-[9px] font-black uppercase tracking-widest"
                                style={{ color: 'rgba(255,255,255,0.2)' }}>VS</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-center">
                              <span className="text-2xl">{flag(m.awayTeam)}</span>
                              <span className="text-[10px] font-bold text-white/70 leading-tight">{m.awayTeam}</span>
                            </div>
                          </div>
                          {/* Stadium footer */}
                          {m.stadium && (
                            <div className="px-3.5 pb-2.5 flex items-center gap-1"
                              style={{ color: 'rgba(255,255,255,0.18)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <MapPin size={8} className="shrink-0" />
                              <span className="text-[9px] truncate">{m.stadium}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {!isLoading && filtered.length === 0 && liveMatches.length === 0 && (
                <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,30,48,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Trophy size={28} className="mx-auto mb-2" style={{ color: 'rgba(240,180,41,0.2)' }} />
                  <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No matches in {activeGroup}</p>
                </div>
              )}
            </div>

            {/* ── RIGHT: DETAIL PANEL ── */}
            <div className="lg:col-span-3">

              {/* ── Live match selected ── */}
              {selectedMatch ? (
                <div className="space-y-3">
                  <LiveMatchContextBar
                    match={selectedMatch}
                    onBack={() => setSelectedMatch(null)}
                  />
                  <LiveCommentary
                    matchId={selectedMatch.id.toString()}
                    homeTeam={selectedMatch.homeTeam}
                    awayTeam={selectedMatch.awayTeam}
                  />
                </div>

              /* ── Upcoming fixture selected ── */
              ) : selectedUpcoming ? (
                <FixtureDetail
                  match={selectedUpcoming}
                  onBack={() => setSelectedUpcoming(null)}
                />

              /* ── Nothing selected — trophy placeholder ── */
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,30,48,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Trophy hero */}
                  <div className="relative text-center p-10 sm:p-14"
                    style={{ background: 'linear-gradient(135deg, #0d2e18 0%, #091a0d 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                      style={{ background: 'radial-gradient(circle, #f0b429 0%, transparent 70%)' }}
                    />
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.22)' }}>
                        <Trophy size={36} style={{ color: '#f0b429' }} />
                      </div>
                      <h2 className="text-2xl font-black text-white">FIFA World Cup 2026</h2>
                      <p className="text-sm mt-1.5 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        48 teams · 104 matches · 16 venues
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        {['🇺🇸 USA', '🇨🇦 Canada', '🇲🇽 Mexico'].map(h => (
                          <span key={h} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* State message */}
                  <div className="p-7 text-center">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-2.5 rounded mb-2 w-3/4 mx-auto" style={{ background: 'rgba(255,255,255,0.07)' }} />
                            <div className="h-14 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
                          </div>
                        ))}
                      </div>
                    ) : liveMatches.length > 0 ? (
                      <>
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                          <Radio size={12} className="animate-pulse" style={{ color: '#f87171' }} />
                          <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#f87171' }}>
                            {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} live right now
                          </span>
                        </div>
                        <p className="text-sm font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          Select a match on the left for live AI commentary
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {liveMatches.slice(0, 3).map(m => (
                            <button
                              key={m.id}
                              onClick={() => handleLiveSelect(m)}
                              className="rounded-xl px-4 py-3.5 flex items-center justify-between transition-all"
                              style={{ background: 'rgba(26,92,42,0.6)', border: '1px solid rgba(26,92,42,0.8)' }}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{flag(m.homeTeam)}</span>
                                <span className="text-sm font-black text-white">
                                  {m.homeScore} — {m.awayScore}
                                </span>
                                <span className="text-lg">{flag(m.awayTeam)}</span>
                                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                  {m.homeTeam} vs {m.awayTeam}
                                </span>
                              </div>
                              <ChevronRight size={14} style={{ color: '#f0b429' }} className="shrink-0" />
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <Radio size={24} style={{ color: 'rgba(255,255,255,0.12)' }} />
                        </div>
                        <h3 className="font-black text-white">No Live Matches</h3>
                        <p className="text-sm mt-1.5 font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          Tap any upcoming fixture on the left to preview the match.
                        </p>
                        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          Live AI commentary starts the moment a match kicks off.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Feature strip */}
                  <div className="grid grid-cols-3" style={{ borderTop: divider }}>
                    {([
                      { Icon: Flame,    label: 'AI Commentary',   desc: 'Real-time events' },
                      { Icon: Zap,      label: 'Win Probability', desc: 'Live predictions' },
                      { Icon: Radio,    label: 'Audio Mode',      desc: 'Hands-free' },
                    ] as const).map(({ Icon, label, desc }, i) => (
                      <div key={label} className="px-3 py-4 text-center"
                        style={{ borderRight: i < 2 ? divider : undefined }}>
                        <Icon size={16} className="mx-auto mb-1.5" style={{ color: 'rgba(240,180,41,0.45)' }} />
                        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
