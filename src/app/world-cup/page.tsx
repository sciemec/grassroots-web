// app/world-cup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Trophy, Radio, Calendar, MapPin, Clock,
  ChevronRight, Flame, Globe2, Users,
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
  Germany: "🇩🇪", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Hungary: "🇭🇺", Switzerland: "🇨🇭",
  Spain: "🇪🇸", Croatia: "🇭🇷", Italy: "🇮🇹", Albania: "🇦🇱",
  Poland: "🇵🇱", Netherlands: "🇳🇱", Slovenia: "🇸🇮", Denmark: "🇩🇰",
  Serbia: "🇷🇸", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Belgium: "🇧🇪", Slovakia: "🇸🇰",
  Romania: "🇷🇴", Ukraine: "🇺🇦", Austria: "🇦🇹", France: "🇫🇷",
  Turkey: "🇹🇷", Georgia: "🇬🇪", Portugal: "🇵🇹", "Czech Republic": "🇨🇿",
};

function flag(team: string) { return TEAM_FLAGS[team] ?? "🏳️"; }

function fmtDate(m: UpcomingMatch) {
  const raw = m.utcDate ?? (m.date ? m.date + 'T00:00:00' : null);
  if (!raw) return '';
  return new Date(raw).toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  // Seed upcoming immediately from static data
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
    ? upcomingMatches.slice(0, 14)
    : upcomingMatches.filter(m => m.group === activeGroup).slice(0, 14);

  return (
    <div className="flex min-h-screen bg-[#070f1c]">
      <Sidebar />

      <main className="flex-1 min-w-0">

        {/* ═══ HERO HEADER ═══ */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a5c2a] via-[#0d3d1a] to-[#070f1c]" />
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#f0b429]/15 border border-[#f0b429]/30 p-2.5 rounded-xl">
                    <Trophy size={26} className="text-[#f0b429]" />
                  </div>
                  <div>
                    <p className="text-[#f0b429]/80 text-[9px] font-black uppercase tracking-[0.25em]">FIFA</p>
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">World Cup 2026</h1>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Globe2 size={11} /> USA · Canada · Mexico
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Calendar size={11} /> Jun 11 – Jul 19, 2026
                  </span>
                </div>
              </div>

              {/* Stat pills */}
              <div className="flex gap-2 shrink-0">
                {liveMatches.length > 0 && (
                  <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
                    <div className="flex items-center justify-center gap-1">
                      <Radio size={9} className="text-red-400 animate-pulse" />
                      <span className="text-red-400 text-[9px] font-black uppercase tracking-wider">Live</span>
                    </div>
                    <p className="text-2xl font-black text-white mt-0.5">{liveMatches.length}</p>
                  </div>
                )}
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
                  <p className="text-white/35 text-[9px] uppercase tracking-wider">Upcoming</p>
                  <p className="text-2xl font-black text-white mt-0.5">{upcomingMatches.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[72px]">
                  <p className="text-white/35 text-[9px] uppercase tracking-wider">Teams</p>
                  <p className="text-2xl font-black text-white mt-0.5">24</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid lg:grid-cols-5 gap-5">

            {/* ── LEFT: MATCH LIST ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Live matches */}
              {liveMatches.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                      <Radio size={9} className="animate-pulse" /> Live Now
                    </span>
                    <span className="text-white/30 text-[10px]">
                      {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {liveMatches.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMatch(m)}
                        className={`w-full text-left rounded-2xl overflow-hidden transition-all duration-200 ${
                          selectedMatch?.id === m.id
                            ? 'ring-2 ring-[#f0b429] shadow-lg shadow-[#f0b429]/10'
                            : 'hover:ring-1 hover:ring-white/15'
                        }`}
                      >
                        <div className={`p-4 ${
                          selectedMatch?.id === m.id ? 'bg-[#1a5c2a]' : 'bg-[#0f1e30] hover:bg-[#132640]'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                              {m.minute}&apos;
                            </span>
                            {selectedMatch?.id === m.id && (
                              <span className="text-[9px] text-[#f0b429] font-black uppercase tracking-wider">▶ Listening</span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {[
                              { team: m.homeTeam, score: m.homeScore, opp: m.awayScore },
                              { team: m.awayTeam, score: m.awayScore, opp: m.homeScore },
                            ].map(({ team, score, opp }) => (
                              <div key={team} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base shrink-0">{flag(team)}</span>
                                  <span className="text-sm font-bold text-white truncate">{team}</span>
                                </div>
                                <span className={`text-xl font-black tabular-nums shrink-0 ${
                                  score > opp ? 'text-[#f0b429]' : 'text-white/70'
                                }`}>{score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Group filter */}
              <div>
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-2">Filter by Group</p>
                <div className="flex flex-wrap gap-1.5">
                  {GROUPS.map(g => (
                    <button
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        activeGroup === g
                          ? 'bg-[#f0b429] text-[#070f1c]'
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
                      }`}
                    >
                      {g === 'All' ? 'All' : g.replace('Group ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              {filtered.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={11} className="text-white/30" />
                    <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Upcoming Fixtures</span>
                  </div>
                  <div className="space-y-2">
                    {filtered.map(m => (
                      <div key={m.id} className="bg-[#0f1e30] rounded-xl p-3.5 border border-white/5">
                        {/* Group + datetime */}
                        <div className="flex items-center justify-between mb-2.5">
                          {m.group && (
                            <span className="text-[9px] font-black text-[#f0b429]/60 uppercase tracking-widest bg-[#f0b429]/8 px-2 py-0.5 rounded-md">
                              {m.group}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-white/25 text-[9px] ml-auto">
                            <Clock size={8} />
                            <span>{fmtDate(m)} · {fmtTime(m)}</span>
                          </div>
                        </div>
                        {/* Teams */}
                        <div className="space-y-1.5">
                          {[m.homeTeam, m.awayTeam].map(t => (
                            <div key={t} className="flex items-center gap-2">
                              <span className="text-sm">{flag(t)}</span>
                              <span className="text-xs font-bold text-white/75">{t}</span>
                            </div>
                          ))}
                        </div>
                        {/* Stadium */}
                        {m.stadium && (
                          <div className="flex items-center gap-1 mt-2 text-white/20 text-[9px]">
                            <MapPin size={8} /> <span>{m.stadium}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!isLoading && filtered.length === 0 && liveMatches.length === 0 && (
                <div className="bg-[#0f1e30] rounded-2xl p-6 text-center border border-white/5">
                  <Trophy size={28} className="mx-auto text-[#f0b429]/20 mb-2" />
                  <p className="text-white/40 text-sm font-bold">No matches in {activeGroup}</p>
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
                <div className="bg-[#0f1e30] rounded-2xl border border-white/5 overflow-hidden">
                  {/* Trophy hero */}
                  <div className="relative bg-gradient-to-br from-[#1a5c2a] to-[#0d3d1a] p-10 sm:p-14 text-center">
                    <div className="absolute inset-0 opacity-[0.07]"
                      style={{ backgroundImage: 'repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)' }}
                    />
                    <div className="relative">
                      <div className="w-16 h-16 bg-[#f0b429]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trophy size={32} className="text-[#f0b429]" />
                      </div>
                      <h2 className="text-xl font-black text-white">FIFA World Cup 2026</h2>
                      <p className="text-white/45 text-sm mt-1">Live AI commentary · Win probability · Audio mode</p>
                    </div>
                  </div>

                  <div className="p-8 text-center">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse">
                            <div className="h-3 bg-white/8 rounded w-3/4 mx-auto mb-2" />
                            <div className="h-12 bg-white/4 rounded-xl" />
                          </div>
                        ))}
                      </div>
                    ) : liveMatches.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5 justify-center mb-2">
                          <Radio size={12} className="text-red-400 animate-pulse" />
                          <span className="text-red-400 text-xs font-black uppercase tracking-wider">
                            {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} live right now
                          </span>
                        </div>
                        <p className="text-white/40 text-sm mb-5">Select a match on the left to start listening</p>
                        <div className="flex flex-col gap-2">
                          {liveMatches.slice(0, 3).map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMatch(m)}
                              className="bg-[#1a5c2a] hover:bg-[#1f6e33] text-white rounded-xl px-4 py-3 flex items-center justify-between transition-colors"
                            >
                              <span className="text-sm font-bold">
                                {flag(m.homeTeam)} {m.homeTeam} {m.homeScore}–{m.awayScore} {m.awayTeam} {flag(m.awayTeam)}
                              </span>
                              <ChevronRight size={14} className="text-[#f0b429] shrink-0" />
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-white/4 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Radio size={22} className="text-white/15" />
                        </div>
                        <h3 className="text-white/70 font-bold">No Live Matches Right Now</h3>
                        <p className="text-white/35 text-sm mt-1">
                          Live AI commentary starts the moment a match kicks off.
                        </p>
                        <p className="text-white/25 text-xs mt-4">
                          Browse upcoming fixtures on the left to plan ahead.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Feature row */}
                  <div className="border-t border-white/5 grid grid-cols-3 divide-x divide-white/5">
                    {([
                      { Icon: Flame,  label: 'AI Commentary', desc: 'Real-time events' },
                      { Icon: Users,  label: 'Win Probability', desc: 'Live predictions' },
                      { Icon: Radio,  label: 'Audio Mode',  desc: 'Hands-free listening' },
                    ] as const).map(({ Icon, label, desc }) => (
                      <div key={label} className="px-3 py-4 text-center">
                        <Icon size={15} className="text-[#f0b429]/50 mx-auto mb-1.5" />
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-wider">{label}</p>
                        <p className="text-[9px] text-white/25 mt-0.5">{desc}</p>
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