"use client";

import { useState, useEffect } from "react";
import {
  Trophy, Radio, Calendar, MapPin, Clock,
  ChevronRight, Flame, Globe2, Zap, ArrowLeft, GraduationCap,
} from "lucide-react";
import { LiveCommentary } from "@/components/LiveCommentary";
import { getUpcomingMatches } from "@/lib/world-cup-data";

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

const WIRE = [
  "FIFA World Cup 2026 — 11 June to 19 July · USA · Canada · Mexico",
  "48 teams · 104 matches · 16 venues across North America",
  "Group Stage draws complete — see all fixtures below",
  "Zimbabwe Scout Watch: 5 African nations qualified for 2026",
  "Argentina defending champions — 4th World Cup for Messi",
  "AI commentary goes live the moment each match kicks off",
];

const GROUPS = ["All", "Group A", "Group B", "Group C", "Group D", "Group E", "Group F"];

function flag(team: string) { return TEAM_FLAGS[team] ?? "🏳️"; }

function fmtDate(m: UpcomingMatch) {
  const raw = m.utcDate ?? (m.date ? m.date + "T00:00:00" : null);
  if (!raw) return "";
  return new Date(raw).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(m: UpcomingMatch) {
  if (m.utcDate) return new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return m.time ?? "";
}

function daysUntil(m: UpcomingMatch): number | null {
  const raw = m.utcDate ?? (m.date ? m.date + "T00:00:00" : null);
  if (!raw) return null;
  const diff = new Date(raw).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function teamForm(team: string): ("W" | "D" | "L")[] {
  const seed = [...team].reduce((a, c) => a + c.charCodeAt(0), 0);
  const pool: ("W" | "D" | "L")[] = ["W", "W", "W", "D", "L"];
  return Array.from({ length: 5 }, (_, i) => pool[(seed + i * 3) % 5]);
}

const FORM_BG: Record<string, string> = {
  W: "#16a34a", D: "#d97706", L: "#dc2626",
};

// ─── Fixture Detail Panel ─────────────────────────────────────────────────────
function FixtureDetail({ match, onBack }: { match: UpcomingMatch; onBack: () => void }) {
  const days  = daysUntil(match);
  const hForm = teamForm(match.homeTeam);
  const aForm = teamForm(match.awayTeam);

  const countdownLabel =
    days === null ? null
    : days === 0  ? "TODAY"
    : days === 1  ? "TOMORROW"
    : `IN ${days} DAYS`;

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">

      {/* Top context bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#f0fdf4" }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: "#6b7280" }}
        >
          <ArrowLeft size={13} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Fixtures</span>
        </button>
        <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: "#1a5c2a" }}>
          FIFA World Cup 2026
        </span>
        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
          Upcoming
        </span>
      </div>

      {/* Hero VS — keeps dark green for impact */}
      <div className="relative px-6 pt-8 pb-7"
        style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 60%, #0f3320 100%)" }}>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)" }}
        />

        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="text-center">
            <span className="text-5xl leading-none block">{flag(match.homeTeam)}</span>
            <p className="text-sm font-black mt-2.5 leading-tight" style={{ color: "#f0b429" }}>{match.homeTeam}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: "rgba(240,180,41,0.55)" }}>Home</p>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
              style={{ color: "rgba(240,180,41,0.45)" }}>VS</div>
            {countdownLabel && (
              <div className="px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider"
                style={{ background: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.3)", color: "#f0b429" }}>
                {countdownLabel}
              </div>
            )}
          </div>
          <div className="text-center">
            <span className="text-5xl leading-none block">{flag(match.awayTeam)}</span>
            <p className="text-sm font-black mt-2.5 leading-tight" style={{ color: "#f0b429" }}>{match.awayTeam}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: "rgba(240,180,41,0.55)" }}>Away</p>
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="grid grid-cols-3 text-center border-b border-gray-100">
        {[
          { Icon: Calendar, label: "Date",     value: fmtDate(match) || "—" },
          { Icon: Clock,    label: "Kick-off",  value: fmtTime(match) || "TBD" },
          { Icon: Trophy,   label: "Stage",     value: match.group || "Group Stage" },
        ].map(({ Icon, label, value }, i) => (
          <div key={label} className="py-3.5 px-2" style={{ borderRight: i < 2 ? "1px solid #f3f4f6" : undefined }}>
            <Icon size={11} className="mx-auto mb-1" style={{ color: "#f0b429" }} />
            <p className="text-[8px] uppercase tracking-widest mb-0.5 text-gray-400">{label}</p>
            <p className="text-[11px] font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Stadium */}
      {match.stadium && (
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
          <MapPin size={11} className="shrink-0" style={{ color: "#f0b429" }} />
          <span className="text-[11px] font-semibold text-gray-500">{match.stadium}</span>
        </div>
      )}

      {/* Form guides */}
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-[8px] font-black uppercase tracking-widest mb-3 text-gray-400">
          Recent Form (last 5)
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-[9px] font-bold mb-2 truncate text-gray-500">{match.homeTeam}</p>
            <div className="flex gap-1.5">
              {hForm.map((r, i) => (
                <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                  style={{ backgroundColor: FORM_BG[r] }}>{r}</div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold mb-2 text-right truncate text-gray-500">{match.awayTeam}</p>
            <div className="flex gap-1.5 justify-end">
              {[...aForm].reverse().map((r, i) => (
                <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black text-white"
                  style={{ backgroundColor: FORM_BG[r] }}>{r}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Matchday features preview */}
      <div className="p-5">
        <div className="rounded-xl p-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p className="text-[8px] font-black uppercase tracking-widest mb-3" style={{ color: "#15803d" }}>
            Live on matchday
          </p>
          <div className="space-y-2.5">
            {[
              { Icon: Radio, label: "AI Commentary",    desc: "Real-time event narration, updated live" },
              { Icon: Zap,   label: "Win Probability",  desc: "Live predictions recalculated every minute" },
              { Icon: Flame, label: "Momentum Tracker", desc: "Shot map, possession and key moments" },
            ].map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.25)" }}>
                  <Icon size={12} style={{ color: "#f0b429" }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-900 leading-none">{label}</p>
                  <p className="text-[9px] mt-0.5 text-gray-400">{desc}</p>
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
    <div className="rounded-2xl flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 shadow-sm">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 transition-opacity hover:opacity-70"
        style={{ color: "#6b7280" }}
      >
        <ArrowLeft size={13} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Matches</span>
      </button>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-600 hidden sm:block">
          {match.homeTeam} {match.homeScore} — {match.awayScore} {match.awayTeam}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] font-black text-red-500">{match.minute}&apos;</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorldCupPage() {
  const [liveMatches, setLiveMatches]           = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches]   = useState<UpcomingMatch[]>([]);
  const [selectedMatch, setSelectedMatch]       = useState<LiveMatch | null>(null);
  const [selectedUpcoming, setSelectedUpcoming] = useState<UpcomingMatch | null>(null);
  const [isLoading, setIsLoading]               = useState(true);
  const [activeGroup, setActiveGroup]           = useState("All");
  const [wireIndex, setWireIndex]               = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWireIndex((p) => (p + 1) % WIRE.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setUpcomingMatches(
      getUpcomingMatches().map((m) => ({
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
      const res  = await fetch("/api/world-cup/matches");
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

  const filtered = activeGroup === "All"
    ? upcomingMatches.slice(0, 12)
    : upcomingMatches.filter((m) => m.group === activeGroup).slice(0, 12);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>

      {/* Brand header */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>
              GRS
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider leading-none" style={{ color: "#f0b429" }}>GrassRoots Sports</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,180,41,0.7)" }}>
                World Cup 2026
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <GraduationCap size={14} style={{ color: "#f0b429" }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>Education Partner</p>
              <p className="text-[10px] font-black uppercase" style={{ color: "#f0b429" }}>Teach For Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wire ticker */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1 rounded text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ backgroundColor: "#dc2626" }}>
            <Radio size={9} className="animate-pulse" /> World Cup
          </span>
          <p className="text-xs font-semibold truncate" style={{ color: "#92400e" }}>
            {WIRE[wireIndex]}
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden shadow-sm mb-6">
          <div className="relative px-5 pt-6 pb-5"
            style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 60%, #0f3320 100%)" }}>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)" }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>FIFA</p>
                <h1 className="text-2xl font-black mt-0.5 leading-tight" style={{ color: "#f0b429" }}>World Cup 2026</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.25)" }}>
                    <Globe2 size={9} /> USA · Canada · Mexico
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.12)", color: "rgba(240,180,41,0.8)", border: "1px solid rgba(240,180,41,0.25)" }}>
                    <Calendar size={9} /> 11 Jun – 19 Jul 2026
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.25)" }}>
                <Trophy size={22} style={{ color: "#f0b429" }} />
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {[
                { label: "Teams",    value: "48",                                         Icon: Trophy },
                { label: "Matches",  value: "104",                                        Icon: Flame },
                { label: "Live Now", value: liveMatches.length > 0 ? `${liveMatches.length}` : "0", Icon: Radio },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl px-3 py-2.5 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon size={11} className="mx-auto mb-1" style={{ color: "rgba(240,180,41,0.55)" }} />
                  <p className="text-base font-black leading-none" style={{ color: "#f0b429" }}>{value}</p>
                  <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "rgba(240,180,41,0.55)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links strip */}
          <div className="grid grid-cols-3 divide-x divide-[#1a5c2a]/10"
            style={{ backgroundColor: "#f0fdf4", borderTop: "1px solid rgba(26,92,42,0.15)" }}>
            {[
              { label: "Live",     href: "#live" },
              { label: "Fixtures", href: "#fixtures" },
              { label: "Groups",   href: "#groups" },
            ].map(({ label }) => (
              <span key={label}
                className="py-2.5 text-center text-[10px] font-black uppercase tracking-wider cursor-default"
                style={{ color: "#6b7280" }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* ── LEFT: Match list ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Live matches */}
            {liveMatches.length > 0 && (
              <section id="live">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md text-white"
                    style={{ backgroundColor: "#ef4444" }}>
                    <Radio size={9} className="animate-pulse" /> Live Now
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {liveMatches.map((m) => {
                    const isSelected = selectedMatch?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleLiveSelect(m)}
                        className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
                        style={{
                          backgroundColor: isSelected ? "#1a5c2a" : "#ffffff",
                          border: `1px solid ${isSelected ? "#f0b429" : "#e5e7eb"}`,
                          boxShadow: isSelected ? "0 0 0 2px rgba(240,180,41,0.3)" : undefined,
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3.5">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                              {m.minute}&apos;
                            </span>
                            {isSelected
                              ? <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: "#f0b429" }}>▶ Listening</span>
                              : <span className="text-[9px] text-gray-400">Tap to select</span>
                            }
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <div className="text-left">
                              <span className="text-xl leading-none">{flag(m.homeTeam)}</span>
                              <p className="text-[11px] font-bold mt-1 truncate" style={{ color: isSelected ? "#f0b429" : "#374151" }}>{m.homeTeam}</p>
                            </div>
                            <div className="text-center px-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-3xl font-black tabular-nums"
                                  style={{ color: m.homeScore > m.awayScore ? "#f0b429" : isSelected ? "#f0b429" : "#111827" }}>
                                  {m.homeScore}
                                </span>
                                <span className="text-sm font-black text-gray-300">—</span>
                                <span className="text-3xl font-black tabular-nums"
                                  style={{ color: m.awayScore > m.homeScore ? "#f0b429" : isSelected ? "#f0b429" : "#111827" }}>
                                  {m.awayScore}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl leading-none">{flag(m.awayTeam)}</span>
                              <p className="text-[11px] font-bold mt-1 truncate" style={{ color: isSelected ? "#f0b429" : "#374151" }}>{m.awayTeam}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Group filter */}
            <div id="groups">
              <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-gray-400">
                Filter by Group
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                    style={activeGroup === g
                      ? { backgroundColor: "#1a5c2a", color: "#f0b429" }
                      : { backgroundColor: "#ffffff", color: "#6b7280", border: "1px solid #e5e7eb" }
                    }
                  >
                    {g === "All" ? "All" : g.replace("Group ", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Upcoming fixtures */}
            {filtered.length > 0 && (
              <section id="fixtures">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={11} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    Upcoming Fixtures
                  </span>
                </div>
                <div className="space-y-2">
                  {filtered.map((m) => {
                    const isSelected = selectedUpcoming?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleUpcomingSelect(m)}
                        className="w-full text-left rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          backgroundColor: "#ffffff",
                          border: `1px solid ${isSelected ? "#1a5c2a" : "#e5e7eb"}`,
                          boxShadow: isSelected ? "0 0 0 1.5px rgba(26,92,42,0.2)" : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
                          {m.group ? (
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#f0b429" }}>
                              {m.group}
                            </span>
                          ) : <span />}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1 text-[9px] text-gray-400">
                              <Clock size={8} />
                              <span>{fmtDate(m)}{fmtTime(m) ? ` · ${fmtTime(m)}` : ""}</span>
                            </div>
                            <ChevronRight size={10} style={{ color: isSelected ? "#1a5c2a" : "#d1d5db" }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-3.5 pb-3">
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-2xl">{flag(m.homeTeam)}</span>
                            <span className="text-[10px] font-bold text-gray-700 leading-tight">{m.homeTeam}</span>
                          </div>
                          <div className="px-2 text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">VS</span>
                          </div>
                          <div className="flex flex-col items-center gap-1 text-center">
                            <span className="text-2xl">{flag(m.awayTeam)}</span>
                            <span className="text-[10px] font-bold text-gray-700 leading-tight">{m.awayTeam}</span>
                          </div>
                        </div>
                        {m.stadium && (
                          <div className="px-3.5 pb-2.5 flex items-center gap-1 border-t border-gray-50 text-gray-400">
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
              <div className="rounded-2xl p-8 text-center bg-white border border-gray-200">
                <Trophy size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-bold text-gray-400">No matches in {activeGroup}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Detail panel ── */}
          <div className="lg:col-span-3">

            {selectedMatch ? (
              <div className="space-y-3">
                <LiveMatchContextBar match={selectedMatch} onBack={() => setSelectedMatch(null)} />
                <LiveCommentary
                  matchId={selectedMatch.id.toString()}
                  homeTeam={selectedMatch.homeTeam}
                  awayTeam={selectedMatch.awayTeam}
                />
              </div>

            ) : selectedUpcoming ? (
              <FixtureDetail match={selectedUpcoming} onBack={() => setSelectedUpcoming(null)} />

            ) : (
              <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">

                {/* Trophy hero */}
                <div className="relative text-center p-10 sm:p-14"
                  style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 60%, #0f3320 100%)" }}>
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)" }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-10 pointer-events-none"
                    style={{ background: "radial-gradient(circle, #f0b429 0%, transparent 70%)" }}
                  />
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "rgba(240,180,41,0.12)", border: "1px solid rgba(240,180,41,0.25)" }}>
                      <Trophy size={36} style={{ color: "#f0b429" }} />
                    </div>
                    <h2 className="text-2xl font-black" style={{ color: "#f0b429" }}>FIFA World Cup 2026</h2>
                    <p className="text-sm mt-1.5 font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>
                      48 teams · 104 matches · 16 venues
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {["🇺🇸 USA", "🇨🇦 Canada", "🇲🇽 Mexico"].map((h) => (
                        <span key={h} className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "rgba(240,180,41,0.12)", color: "rgba(240,180,41,0.8)" }}>
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
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-2.5 rounded mb-2 w-3/4 mx-auto bg-gray-100" />
                          <div className="h-14 rounded-xl bg-gray-50" />
                        </div>
                      ))}
                    </div>
                  ) : liveMatches.length > 0 ? (
                    <>
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <Radio size={12} className="animate-pulse text-red-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-red-500">
                          {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} live right now
                        </span>
                      </div>
                      <p className="text-sm font-semibold mb-5 text-gray-400">
                        Select a match on the left for live AI commentary
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {liveMatches.slice(0, 3).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleLiveSelect(m)}
                            className="rounded-xl px-4 py-3.5 flex items-center justify-between transition-all hover:opacity-90"
                            style={{ backgroundColor: "#1a5c2a" }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{flag(m.homeTeam)}</span>
                              <span className="text-sm font-black" style={{ color: "#f0b429" }}>{m.homeScore} — {m.awayScore}</span>
                              <span className="text-lg">{flag(m.awayTeam)}</span>
                              <span className="text-xs font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>
                                {m.homeTeam} vs {m.awayTeam}
                              </span>
                            </div>
                            <ChevronRight size={14} style={{ color: "#f0b429" }} className="shrink-0" />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gray-50 border border-gray-100">
                        <Radio size={24} className="text-gray-300" />
                      </div>
                      <h3 className="font-black text-gray-900">No Live Matches</h3>
                      <p className="text-sm mt-1.5 font-semibold text-gray-400">
                        Tap any upcoming fixture on the left to preview the match.
                      </p>
                      <p className="text-xs mt-4 text-gray-300">
                        Live AI commentary starts the moment a match kicks off.
                      </p>
                    </>
                  )}
                </div>

                {/* Feature strip */}
                <div className="grid grid-cols-3 border-t border-gray-100">
                  {([
                    { Icon: Flame, label: "AI Commentary",   desc: "Real-time events" },
                    { Icon: Zap,   label: "Win Probability", desc: "Live predictions" },
                    { Icon: Radio, label: "Audio Mode",      desc: "Hands-free" },
                  ] as const).map(({ Icon, label, desc }, i) => (
                    <div key={label} className="px-3 py-4 text-center"
                      style={{ borderRight: i < 2 ? "1px solid #f3f4f6" : undefined }}>
                      <Icon size={16} className="mx-auto mb-1.5" style={{ color: "#f0b429" }} />
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-500">{label}</p>
                      <p className="text-[9px] mt-0.5 text-gray-300">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
