// app/world-cup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Trophy, Radio, Calendar, MapPin, Clock,
  ChevronRight, Flame, Globe2, Users, Zap,
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
  // North/Central America & Caribbean
  USA: "🇺🇸", Canada: "🇨🇦", Mexico: "🇲🇽",
  // South America
  Brazil: "🇧🇷", Argentina: "🇦🇷", Uruguay: "🇺🇾", Colombia: "🇨🇴",
  Ecuador: "🇪🇨", Chile: "🇨🇱", Paraguay: "🇵🇾", Venezuela: "🇻🇪",
  Peru: "🇵🇪", Bolivia: "🇧🇴",
  // Europe
  Germany: "🇩🇪", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Hungary: "🇭🇺", Switzerland: "🇨🇭",
  Spain: "🇪🇸", Croatia: "🇭🇷", Italy: "🇮🇹", Albania: "🇦🇱",
  Poland: "🇵🇱", Netherlands: "🇳🇱", Slovenia: "🇸🇮", Denmark: "🇩🇰",
  Serbia: "🇷🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Belgium: "🇧🇪", Slovakia: "🇸🇰",
  Romania: "🇷🇴", Ukraine: "🇺🇦", Austria: "🇦🇹", France: "🇫🇷",
  Turkey: "🇹🇷", Georgia: "🇬🇪", Portugal: "🇵🇹", "Czech Republic": "🇨🇿",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Netherlands: "🇳🇱",
  // Africa
  Morocco: "🇲🇦", Senegal: "🇸🇳", Nigeria: "🇳🇬", Ghana: "🇬🇭",
  Cameroon: "🇨🇲", "South Africa": "🇿🇦", Egypt: "🇪🇬",
  // Asia
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

const GROUPS = ['All', 'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F'];

export default function WorldCupPage() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('All');

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
      const res = await fetch('/api/world-cup/matches');
      const data = await res.json();
      if (res.ok) {
        setLiveMatches(data.live || []);
        if (data.upcoming?.length) setUpcomingMatches(data.upcoming);
        if (data.live?.length && !selectedMatch) setSelectedMatch(data.live[0]);
      }
    } catch { /* static data covers the fallback */ }
    finally { setIsLoading(false); }
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
          {/* layered background */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d2e18 0%, #0a1f10 40%, #070f1c 100%)' }} />
          {/* chevron overlay */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
          />
          {/* gold glow top-left */}
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
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2"
                      style={{ borderColor: '#070f1c', animation: 'pulse 2s infinite' }} />
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

              {/* Live matches — broadcast scorecard style */}
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
                          onClick={() => setSelectedMatch(m)}
                          className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200"
                          style={{
                            boxShadow: isSelected ? '0 0 0 2px #f0b429, 0 8px 24px rgba(240,180,41,0.12)' : undefined,
                            outline: isSelected ? 'none' : undefined,
                          }}
                        >
                          <div className="p-4" style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, #1a5c2a 0%, #123d1c 100%)'
                              : 'rgba(15,30,48,0.9)',
                            border: `1px solid ${isSelected ? 'rgba(240,180,41,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '1rem',
                          }}>
                            {/* Minute bar */}
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
                            {/* Broadcast score layout: flag · name · SCORE — SCORE · name · flag */}
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              {/* Home */}
                              <div className="text-left">
                                <span className="text-xl leading-none">{flag(m.homeTeam)}</span>
                                <p className="text-[11px] font-bold text-white/80 mt-1 truncate">{m.homeTeam}</p>
                              </div>
                              {/* Score */}
                              <div className="text-center px-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-3xl font-black tabular-nums" style={{ color: m.homeScore > m.awayScore ? '#f0b429' : 'white' }}>
                                    {m.homeScore}
                                  </span>
                                  <span className="text-sm font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                                  <span className="text-3xl font-black tabular-nums" style={{ color: m.awayScore > m.homeScore ? '#f0b429' : 'white' }}>
                                    {m.awayScore}
                                  </span>
                                </div>
                              </div>
                              {/* Away */}
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

              {/* Upcoming fixtures — VS card layout */}
              {filtered.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Upcoming Fixtures
                    </span>
                  </div>
                  <div className="space-y-2">
                    {filtered.map(m => (
                      <div key={m.id} className="rounded-xl overflow-hidden"
                        style={{ background: 'rgba(15,30,48,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Top bar: group + date */}
                        <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
                          {m.group ? (
                            <span className="text-[9px] font-black uppercase tracking-widest"
                              style={{ color: 'rgba(240,180,41,0.55)' }}>
                              {m.group}
                            </span>
                          ) : <span />}
                          <div className="flex items-center gap-1 text-[9px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                            <Clock size={8} />
                            <span>{fmtDate(m)}{fmtTime(m) ? ` · ${fmtTime(m)}` : ''}</span>
                          </div>
                        </div>
                        {/* Teams VS layout */}
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
                      </div>
                    ))}
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

            {/* ── RIGHT: COMMENTARY / PLACEHOLDER ── */}
            <div className="lg:col-span-3">
              {selectedMatch ? (
                <LiveCommentary
                  matchId={selectedMatch.id.toString()}
                  homeTeam={selectedMatch.homeTeam}
                  awayTeam={selectedMatch.awayTeam}
                />
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,30,48,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Trophy hero panel */}
                  <div className="relative text-center p-10 sm:p-14"
                    style={{ background: 'linear-gradient(135deg, #0d2e18 0%, #091a0d 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
                    />
                    {/* glow spot */}
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

                  {/* State: loading / live / empty */}
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
                              onClick={() => setSelectedMatch(m)}
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
                          Live AI commentary starts the moment a match kicks off.
                        </p>
                        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          Browse upcoming fixtures on the left to plan ahead.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Feature strip */}
                  <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.05)' }}>
                    {([
                      { Icon: Flame,   label: 'AI Commentary',    desc: 'Real-time events' },
                      { Icon: Zap,     label: 'Win Probability',  desc: 'Live predictions' },
                      { Icon: Radio,   label: 'Audio Mode',       desc: 'Hands-free' },
                    ] as const).map(({ Icon, label, desc }) => (
                      <div key={label} className="px-3 py-4 text-center" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
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