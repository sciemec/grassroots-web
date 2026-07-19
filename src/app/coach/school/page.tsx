"use client";
// src/app/coach/school/page.tsx
// Unified School-Coach Dashboard — merges School Hub data with Coach Hub tools

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, Calendar, Trophy, Target, BookOpen, Dumbbell,
  Activity, ArrowLeft, School, Layers, MapPin,
  ChevronDown, ChevronUp, GraduationCap, Bell,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";

type SchoolTeam = {
  id: string;
  name: string;
  sport: string;
  gender: string;
  ageGroup: string;
  coach: string;
  players: number;
  wins: number;
  draws: number;
  losses: number;
};

type SchoolFixture = {
  id: string;
  home: string;
  away: string;
  sport: string;
  date: string;
  time?: string;
  venue?: string;
  result?: string;
};

const SEED_TEAMS: SchoolTeam[] = [
  { id: "t1", name: "U16 Boys Football", sport: "Football", gender: "boys", ageGroup: "U16", coach: "Mr. Mhandu", players: 18, wins: 4, draws: 2, losses: 1 },
  { id: "t2", name: "U14 Girls Netball", sport: "Netball", gender: "girls", ageGroup: "U14", coach: "Ms. Chikwanda", players: 12, wins: 3, draws: 1, losses: 2 },
  { id: "t3", name: "U18 Boys Rugby", sport: "Rugby", gender: "boys", ageGroup: "U18", coach: "Mr. Sibanda", players: 22, wins: 5, draws: 0, losses: 2 },
  { id: "t4", name: "U16 Girls Athletics", sport: "Athletics", gender: "girls", ageGroup: "U16", coach: "Ms. Moyo", players: 15, wins: 0, draws: 0, losses: 0 },
  { id: "t5", name: "U14 Boys Basketball", sport: "Basketball", gender: "boys", ageGroup: "U14", coach: "Mr. Ncube", players: 10, wins: 2, draws: 0, losses: 3 },
];

const SEED_FIXTURES: SchoolFixture[] = [
  { id: "f1", home: "Harare High", away: "Churchill", sport: "Football", date: "2026-07-22", time: "14:00", venue: "Home Ground" },
  { id: "f2", home: "Harare High", away: "Girls High", sport: "Netball", date: "2026-07-24", time: "10:00", venue: "Away" },
  { id: "f3", home: "St George's", away: "Harare High", sport: "Rugby", date: "2026-07-26", time: "15:00", venue: "Away" },
  { id: "f4", home: "Harare High", away: "Arundel", sport: "Athletics", date: "2026-07-28", time: "09:00", venue: "NASH Track" },
  { id: "f5", home: "Kutama", away: "Harare High", sport: "Basketball", date: "2026-08-02", time: "14:00", venue: "Away" },
];

const SPORT_EMOJI: Record<string, string> = {
  Football: "⚽", Netball: "🏐", Rugby: "🏉", Athletics: "🏃",
  Basketball: "🏀", Cricket: "🏏", Swimming: "🏊", Tennis: "🎾",
  Volleyball: "🏐", Hockey: "🏑",
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

export default function SchoolCoachPage() {
  const user = useAuthStore((s) => s.user);
  const [teams, setTeams] = useState<SchoolTeam[]>([]);
  const [fixtures, setFixtures] = useState<SchoolFixture[]>([]);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  useEffect(() => {
    const storedTeams = localStorage.getItem("gs_school_teams");
    const storedFixtures = localStorage.getItem("gs_school_fixtures");
    setTeams(storedTeams ? JSON.parse(storedTeams) : SEED_TEAMS);
    setFixtures(storedFixtures ? JSON.parse(storedFixtures) : SEED_FIXTURES);
  }, []);

  const today = new Date();
  const upcoming = fixtures
    .filter((f) => new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const totalPlayers = teams.reduce((s, t) => s + t.players, 0);
  const wins = teams.reduce((s, t) => s + t.wins, 0);
  const draws = teams.reduce((s, t) => s + t.draws, 0);
  const losses = teams.reduce((s, t) => s + t.losses, 0);
  const thisWeek = upcoming.filter((f) => {
    const diff = (new Date(f.date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  const daysDiff = (d: string) =>
    Math.ceil((new Date(d).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
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
                color: GRS_GREEN, textDecoration: "none",
                border: "1px solid #bbf7d0",
              }}>
                <School size={13} /> School Hub
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 72px" }}>

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {([
            { label: "Teams", value: teams.length, icon: Users, color: GRS_GREEN, bg: "#f0fdf4" },
            { label: "Players", value: totalPlayers, icon: Activity, color: "#2563eb", bg: "#eff6ff" },
            { label: "This Week", value: thisWeek, icon: Calendar, color: "#d97706", bg: "#fef3c7" },
            { label: "Wins", value: wins, icon: Trophy, color: "#059669", bg: "#dcfce7" },
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

        {/* ── My School Teams ──────────────────────────── */}
        <SectionLabel>My School Teams</SectionLabel>
        <div className="space-y-2 mb-6">
          {teams.map((team) => {
            const isOpen = expandedTeam === team.id;
            const gp = team.wins + team.draws + team.losses;
            const pts = team.wins * 3 + team.draws;
            return (
              <div key={team.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedTeam(isOpen ? null : team.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: "#f0fdf4" }}>
                      {SPORT_EMOJI[team.sport] ?? "🏅"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-none">{team.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{team.coach} · {team.players} players</p>
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
                    {/* Win rate bar */}
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
                    {/* Quick action links */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { href: "/coach/tactics", icon: Layers, label: "Tactics Board", bg: "#f0fdf4", color: GRS_GREEN },
                        { href: "/coach/training-plans", icon: Dumbbell, label: "Training Plan", bg: "#eff6ff", color: "#2563eb" },
                        { href: "/coach/squad", icon: Users, label: "Squad List", bg: "#fef3c7", color: "#d97706" },
                        { href: "/school-leagues", icon: Trophy, label: "League Table", bg: "#fffbeb", color: "#c8962a" },
                      ].map(({ href, icon: Icon, label, bg, color }) => (
                        <Link key={href} href={href}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ backgroundColor: bg, color }}>
                          <Icon size={13} />
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Upcoming Fixtures ────────────────────────── */}
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
            const diff = daysDiff(fix.date);
            const isUrgent = diff <= 3;
            return (
              <div key={fix.id}
                className="bg-white rounded-2xl border px-4 py-3 flex items-center justify-between"
                style={{ borderColor: isUrgent ? "#fca5a5" : "#f3f4f6" }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{SPORT_EMOJI[fix.sport] ?? "🏅"}</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-none">
                      {fix.home} <span className="font-normal text-gray-400">vs</span> {fix.away}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar size={9} />
                        {formatDate(fix.date)}{fix.time ? ` · ${fix.time}` : ""}
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

        {/* ── Season Record ─────────────────────────────── */}
        <SectionLabel>Combined Season Record</SectionLabel>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Wins", value: wins, color: "#059669", bg: "#f0fdf4" },
              { label: "Draws", value: draws, color: "#d97706", bg: "#fef3c7" },
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

        {/* ── Coaching Tools ─────────────────────────────── */}
        <SectionLabel>Coaching Tools</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/coach/tactics/learn", icon: BookOpen, label: "Tactics Academy", desc: "Formations & principles", bg: "#f0fdf4", color: GRS_GREEN },
            { href: "/coach/training-plans", icon: Calendar, label: "Training Plans", desc: "Build & assign plans", bg: "#dbeafe", color: "#2563eb" },
            { href: "/coach/live-match", icon: Activity, label: "Live Match", desc: "Real-time match tools", bg: "#fee2e2", color: "#dc2626" },
            { href: "/coach/set-pieces", icon: Target, label: "Set Pieces", desc: "Corner & free kick lab", bg: "#fef3c7", color: "#d97706" },
            { href: "/coach/drills", icon: Dumbbell, label: "Drills Library", desc: "Browse all drills", bg: "#ede9fe", color: "#7c3aed" },
            { href: "/school-leagues", icon: GraduationCap, label: "School Leagues", desc: "NASH / NAPH tables", bg: "#fffbeb", color: "#c8962a" },
          ].map(({ href, icon: Icon, label, desc, bg, color }) => (
            <Link key={href} href={href}
              className="group bg-white rounded-2xl p-4 flex items-start gap-3 border border-gray-200 hover:border-[#1a5c2a] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
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

      </div>
    </div>
  );
}
