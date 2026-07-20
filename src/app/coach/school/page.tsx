"use client";
// src/app/coach/school/page.tsx
// Unified School-Coach Dashboard — API-first, localStorage cache, seed fallback

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, Calendar, Trophy, Target, BookOpen, Dumbbell,
  Activity, ArrowLeft, School, Layers, MapPin,
  ChevronDown, ChevronUp, GraduationCap, Bell, Loader2,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const API_URL   = process.env.NEXT_PUBLIC_API_URL ?? "";

// Types aligned with backend schema (school_teams + school_fixtures tables)
interface ApiTeam {
  id: string;
  name: string;
  sport: string;
  grade: string | null;        // age group e.g. "U16"
  player_count: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  form: string | null;
  narrative: string | null;
}

interface ApiFixture {
  id: string;
  home_team: string;
  away_team: string;
  sport: string;
  venue: string | null;
  match_date: string;          // "YYYY-MM-DD"
  match_time: string | null;   // "HH:MM"
  status: "upcoming" | "completed" | "cancelled";
  home_score: number | null;
  away_score: number | null;
}

// Seed data (shown when both API and localStorage are empty)
const SEED_TEAMS: ApiTeam[] = [
  { id:"t1", name:"U16 Boys Football",  sport:"Football",  grade:"U16",  player_count:18, wins:4, draws:2, losses:1, goals_scored:14, goals_conceded:5,  form:"WWDLW", narrative:null },
  { id:"t2", name:"U14 Girls Netball",  sport:"Netball",   grade:"U14",  player_count:12, wins:3, draws:1, losses:2, goals_scored:0,  goals_conceded:0,  form:"WLWDL", narrative:null },
  { id:"t3", name:"U18 Boys Rugby",     sport:"Rugby",     grade:"U18",  player_count:22, wins:5, draws:0, losses:2, goals_scored:0,  goals_conceded:0,  form:"WWWLW", narrative:null },
  { id:"t4", name:"U16 Girls Athletics",sport:"Athletics", grade:"U16",  player_count:15, wins:0, draws:0, losses:0, goals_scored:0,  goals_conceded:0,  form:null,    narrative:null },
  { id:"t5", name:"U14 Boys Basketball",sport:"Basketball",grade:"U14",  player_count:10, wins:2, draws:0, losses:3, goals_scored:0,  goals_conceded:0,  form:"LLLWW", narrative:null },
];

const SEED_FIXTURES: ApiFixture[] = [
  { id:"f1", home_team:"Harare High", away_team:"Churchill",       sport:"Football",  venue:"Home Ground",  match_date:"2026-07-22", match_time:"14:00", status:"upcoming",   home_score:null, away_score:null },
  { id:"f2", home_team:"Harare High", away_team:"Girls High",      sport:"Netball",   venue:"Away",         match_date:"2026-07-24", match_time:"10:00", status:"upcoming",   home_score:null, away_score:null },
  { id:"f3", home_team:"St George's", away_team:"Harare High",     sport:"Rugby",     venue:"Away",         match_date:"2026-07-26", match_time:"15:00", status:"upcoming",   home_score:null, away_score:null },
  { id:"f4", home_team:"Harare High", away_team:"Arundel",         sport:"Athletics", venue:"NASH Track",   match_date:"2026-07-28", match_time:"09:00", status:"upcoming",   home_score:null, away_score:null },
  { id:"f5", home_team:"Kutama",      away_team:"Harare High",     sport:"Basketball",venue:"Away",         match_date:"2026-08-02", match_time:"14:00", status:"upcoming",   home_score:null, away_score:null },
];

const LS_TEAMS    = "gs_school_teams";
const LS_FIXTURES = "gs_school_fixtures";

const SPORT_EMOJI: Record<string, string> = {
  Football:"⚽", Netball:"🏐", Rugby:"🏉", Athletics:"🏃",
  Basketball:"🏀", Cricket:"🏏", Swimming:"🏊", Tennis:"🎾",
  Volleyball:"🏐", Hockey:"🏑",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-3 ml-0.5 flex items-center gap-2"
      style={{ color: "#9ca3af" }}>
      <span className="inline-block w-4 h-px bg-gray-300" />
      {children}
    </p>
  );
}

// Fetch from API → cache in localStorage → fall back to seed
async function loadData<T>(
  endpoint: string,
  lsKey: string,
  setter: (v: T[]) => void,
  seed: T[],
  token: string,
) {
  // 1. Show cached data instantly
  const cached = localStorage.getItem(lsKey);
  if (cached) {
    try { setter(JSON.parse(cached) as T[]); } catch {}
  }
  // 2. Fetch fresh from API
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      const data: T[] = Array.isArray(json) ? json : (json.data ?? []);
      setter(data);
      localStorage.setItem(lsKey, JSON.stringify(data));
      return;
    }
  } catch {}
  // 3. Seed if nothing cached
  if (!cached) setter(seed);
}

export default function SchoolCoachPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [teams,    setTeams]    = useState<ApiTeam[]>([]);
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load data — API first, localStorage cache, seed fallback
  useEffect(() => {
    const t = token ?? localStorage.getItem("auth_token") ?? "";
    const go = async () => {
      setLoading(true);
      await Promise.allSettled([
        loadData<ApiTeam>(    "/school/teams",    LS_TEAMS,    setTeams,    SEED_TEAMS,    t),
        loadData<ApiFixture>( "/school/fixtures", LS_FIXTURES, setFixtures, SEED_FIXTURES, t),
      ]);
      setLoading(false);
    };
    go();
  }, [token]);

  const today    = new Date();
  const upcoming = fixtures
    .filter((f) => f.status === "upcoming" && new Date(f.match_date) >= today)
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .slice(0, 5);

  const totalPlayers = teams.reduce((s, t) => s + (t.player_count ?? 0), 0);
  const wins         = teams.reduce((s, t) => s + t.wins, 0);
  const draws        = teams.reduce((s, t) => s + t.draws, 0);
  const losses       = teams.reduce((s, t) => s + t.losses, 0);
  const thisWeek     = upcoming.filter((f) => {
    const diff = (new Date(f.match_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const daysDiff = (d: string) =>
    Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/coach" style={{ color: "#6b7280", display: "flex" }}>
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>School Coach</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {user?.name ?? "Coach"} · NASH Programme
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/coach/notifications" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 10,
                backgroundColor: "#f3f4f6", fontSize: 12, fontWeight: 600,
                color: "#374151", textDecoration: "none",
              }}>
                <Bell size={13} /> Alerts
              </Link>
              <Link href="/school-hub" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 10,
                backgroundColor: "#f0fdf4", fontSize: 12, fontWeight: 600,
                color: GRS_GREEN, textDecoration: "none", border: "1px solid #bbf7d0",
              }}>
                <School size={13} /> School Hub
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 72px" }}>

        {loading && teams.length === 0 ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading school data…</span>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {([
                { label: "Teams",     value: teams.length, icon: Users,     color: GRS_GREEN,  bg: "#f0fdf4" },
                { label: "Players",   value: totalPlayers, icon: Activity,  color: "#2563eb",  bg: "#eff6ff" },
                { label: "This Week", value: thisWeek,     icon: Calendar,  color: "#d97706",  bg: "#fef3c7" },
                { label: "Wins",      value: wins,         icon: Trophy,    color: "#059669",  bg: "#dcfce7" },
              ] as const).map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1"
                    style={{ backgroundColor: bg }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* ── My School Teams ─────────────────────── */}
            <SectionLabel>My School Teams</SectionLabel>
            <div className="space-y-2 mb-6">
              {teams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <Users size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">No teams found</p>
                  <Link href="/school-hub" className="text-xs font-semibold mt-1 block" style={{ color: GRS_GREEN }}>
                    Add teams in School Hub
                  </Link>
                </div>
              ) : teams.map((team) => {
                const isOpen = expanded === team.id;
                const gp     = team.wins + team.draws + team.losses;
                const pts    = team.wins * 3 + team.draws;
                return (
                  <div key={team.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      onClick={() => setExpanded(isOpen ? null : team.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: "#f0fdf4" }}>
                          {SPORT_EMOJI[team.sport] ?? "🏅"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-none">{team.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {team.grade ?? "Open"} · {team.player_count} players
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-bold" style={{ color: GRS_GREEN }}>{pts} pts</p>
                          <p className="text-[10px] text-gray-400">
                            {gp > 0 ? `${team.wins}W ${team.draws}D ${team.losses}L` : "No games yet"}
                          </p>
                        </div>
                        {isOpen
                          ? <ChevronUp size={14} className="text-gray-300" />
                          : <ChevronDown size={14} className="text-gray-300" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                        {gp > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>Season form</span>
                              <span>{Math.round((team.wins / gp) * 100)}% win rate</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.round((team.wins / gp) * 100)}%`, backgroundColor: GRS_GREEN }} />
                            </div>
                          </div>
                        )}
                        {team.narrative && (
                          <p className="text-[10px] text-gray-500 mb-3 italic leading-relaxed">{team.narrative}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { href: "/coach/tactics",       icon: Layers,   label: "Tactics Board", bg: "#f0fdf4", color: GRS_GREEN  },
                            { href: "/coach/training-plans",icon: Dumbbell, label: "Training Plan", bg: "#eff6ff", color: "#2563eb"  },
                            { href: "/coach/squad",         icon: Users,    label: "Squad List",    bg: "#fef3c7", color: "#d97706"  },
                            { href: "/school-leagues",      icon: Trophy,   label: "League Table",  bg: "#fffbeb", color: "#c8962a"  },
                          ].map(({ href, icon: Icon, label, bg, color }) => (
                            <Link key={href} href={href}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: bg, color }}>
                              <Icon size={13} /> {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Upcoming Fixtures ────────────────────── */}
            <SectionLabel>Upcoming Fixtures</SectionLabel>
            <div className="space-y-2 mb-6">
              {upcoming.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400 font-medium">No upcoming fixtures</p>
                  <Link href="/school-hub" className="text-xs font-semibold mt-1 block" style={{ color: GRS_GREEN }}>
                    Manage fixtures in School Hub
                  </Link>
                </div>
              ) : upcoming.map((fix) => {
                const diff     = daysDiff(fix.match_date);
                const isUrgent = diff <= 3;
                const scoreStr = fix.home_score != null && fix.away_score != null
                  ? `${fix.home_score}–${fix.away_score}`
                  : null;
                return (
                  <div key={fix.id}
                    className="bg-white rounded-2xl border px-4 py-3 flex items-center justify-between"
                    style={{ borderColor: isUrgent ? "#fca5a5" : "#f3f4f6" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{SPORT_EMOJI[fix.sport] ?? "🏅"}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-none">
                          {fix.home_team} <span className="font-normal text-gray-400">vs</span> {fix.away_team}
                          {scoreStr && <span className="ml-2 font-black" style={{ color: GRS_GREEN }}>{scoreStr}</span>}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar size={9} />
                            {formatDate(fix.match_date)}{fix.match_time ? ` · ${fix.match_time}` : ""}
                          </span>
                          {fix.venue && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <MapPin size={9} /> {fix.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: diff === 0 ? "#fee2e2" : isUrgent ? "#fff7ed" : "#f0fdf4",
                        color: diff === 0 ? "#dc2626" : isUrgent ? "#ea580c" : GRS_GREEN,
                      }}>
                      {diff === 0 ? "TODAY" : diff === 1 ? "TOMORROW" : `IN ${diff}D`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Season Record ────────────────────────── */}
            <SectionLabel>Combined Season Record</SectionLabel>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "Wins",   value: wins,   color: "#059669", bg: "#f0fdf4" },
                  { label: "Draws",  value: draws,  color: "#d97706", bg: "#fef3c7" },
                  { label: "Losses", value: losses, color: "#dc2626", bg: "#fee2e2" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{label}</p>
                  </div>
                ))}
              </div>
              {(wins + draws + losses) > 0 && (
                <>
                  <p className="text-[10px] text-gray-400 mb-1">Win rate across all teams</p>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((wins / (wins + draws + losses)) * 100)}%`,
                        backgroundColor: GRS_GREEN,
                      }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">
                    {Math.round((wins / (wins + draws + losses)) * 100)}% win rate · {wins + draws + losses} games played
                  </p>
                </>
              )}
            </div>

            {/* ── Coaching Tools ───────────────────────── */}
            <SectionLabel>Coaching Tools</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: "/coach/tactics/learn",  icon: BookOpen,      label: "Tactics Academy", desc: "Formations & principles", bg: "#f0fdf4", color: GRS_GREEN  },
                { href: "/coach/training-plans", icon: Calendar,      label: "Training Plans",  desc: "Build & assign plans",   bg: "#dbeafe", color: "#2563eb"  },
                { href: "/coach/live-match",     icon: Activity,      label: "Live Match",      desc: "Real-time match tools",  bg: "#fee2e2", color: "#dc2626"  },
                { href: "/coach/set-pieces",     icon: Target,        label: "Set Pieces",      desc: "Corner & free kick lab", bg: "#fef3c7", color: "#d97706"  },
                { href: "/coach/drills",         icon: Dumbbell,      label: "Drills Library",  desc: "Browse all drills",      bg: "#ede9fe", color: "#7c3aed"  },
                { href: "/school-leagues",       icon: GraduationCap, label: "School Leagues",  desc: "NASH / NAPH tables",     bg: "#fffbeb", color: "#c8962a"  },
              ].map(({ href, icon: Icon, label, desc, bg, color }) => (
                <Link key={href} href={href}
                  className="group bg-white rounded-2xl p-4 flex items-start gap-3 border border-gray-200 hover:border-[#1a5c2a] shadow-sm hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide leading-none text-gray-900">{label}</p>
                    <p className="text-[10px] font-medium mt-1 leading-snug text-gray-400">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
