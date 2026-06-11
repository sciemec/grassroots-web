"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy, Calendar, Clock, MapPin, ArrowLeft,
  ChevronRight, Minus,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Fixture {
  id: string;
  category: Category;
  group: string;           // "Group A" | "Group B" | "SF1" | "Final" etc.
  round: Round;
  homeTeam: string;
  awayTeam: string;
  date: string;            // ISO e.g. "2026-05-03"
  time: string;            // "10:00"
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "completed";
}

interface Standing {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

type Category = "u14-boys" | "u14-girls" | "u16-boys" | "u16-girls";
type Round    = "group" | "quarter" | "semi" | "final";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "u14-boys",   label: "U14 Boys"  },
  { value: "u14-girls",  label: "U14 Girls" },
  { value: "u16-boys",   label: "U16 Boys"  },
  { value: "u16-girls",  label: "U16 Girls" },
];

const ROUND_LABELS: Record<Round, string> = {
  group:   "Group Stage",
  quarter: "Quarter-Finals",
  semi:    "Semi-Finals",
  final:   "Final",
};

const ROUND_ORDER: Round[] = ["group", "quarter", "semi", "final"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadFixtures(): Fixture[] {
  try { return JSON.parse(localStorage.getItem("munhumutapa_2026_fixtures") ?? "[]"); }
  catch { return []; }
}

function calcStandings(fixtures: Fixture[], category: Category): Record<string, Standing[]> {
  const groupFixtures = fixtures.filter(
    (f) => f.category === category && f.round === "group" && f.status === "completed"
  );

  const groups: Record<string, Record<string, Standing>> = {};

  groupFixtures.forEach((f) => {
    [f.homeTeam, f.awayTeam].forEach((team) => {
      if (!groups[f.group]) groups[f.group] = {};
      if (!groups[f.group][team]) {
        groups[f.group][team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      }
    });

    if (f.homeScore === null || f.awayScore === null) return;

    const home = groups[f.group][f.homeTeam];
    const away = groups[f.group][f.awayTeam];

    home.played++; away.played++;
    home.gf += f.homeScore; home.ga += f.awayScore;
    away.gf += f.awayScore; away.ga += f.homeScore;

    if (f.homeScore > f.awayScore) {
      home.won++;  home.points += 3;
      away.lost++;
    } else if (f.homeScore < f.awayScore) {
      away.won++;  away.points += 3;
      home.lost++;
    } else {
      home.drawn++; home.points += 1;
      away.drawn++; away.points += 1;
    }

    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;
  });

  // Sort each group: points → GD → GF
  const sorted: Record<string, Standing[]> = {};
  Object.entries(groups).forEach(([grp, teams]) => {
    sorted[grp] = Object.values(teams).sort(
      (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf
    );
  });
  return sorted;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("u14-boys");

  useEffect(() => {
    setFixtures(loadFixtures());

    // Also try reading from registered clubs to auto-detect categories with data
    const raw = localStorage.getItem("munhumutapa_2026_registrations");
    if (raw) {
      try {
        const regs = JSON.parse(raw);
        if (Array.isArray(regs) && regs.length > 0) {
          const cats = regs.map((r: { age_group: string; gender: string }) =>
            `${r.age_group.toLowerCase()}-${r.gender.toLowerCase()}` as Category
          );
          const first = CATEGORIES.find((c) => cats.includes(c.value));
          if (first) setActiveCategory(first.value);
        }
      } catch { /* ok */ }
    }
  }, []);

  const catFixtures = useMemo(
    () => fixtures.filter((f) => f.category === activeCategory),
    [fixtures, activeCategory]
  );

  const standings = useMemo(
    () => calcStandings(fixtures, activeCategory),
    [fixtures, activeCategory]
  );

  // Group fixtures by round then by date
  const byRound = useMemo(() => {
    const result: Partial<Record<Round, Fixture[]>> = {};
    ROUND_ORDER.forEach((r) => {
      const roundFixtures = catFixtures.filter((f) => f.round === r);
      if (roundFixtures.length > 0) result[r] = roundFixtures;
    });
    return result;
  }, [catFixtures]);

  const hasAnyFixtures = catFixtures.length > 0;
  const hasStandings   = Object.keys(standings).length > 0;
  const liveCount      = catFixtures.filter((f) => f.status === "live").length;

  return (
    <div className="min-h-screen bg-[#0a1f0e]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0D4A1F] to-[#0a1f0e] px-5 pb-8 pt-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg,#f0b429 0,#f0b429 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }}
        />
        <div className="relative mb-4 flex items-center justify-between">
          <Link href="/tournaments/munhumutapa-2026" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Tournament
          </Link>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white animate-pulse">
              ● LIVE — {liveCount} match{liveCount > 1 ? "es" : ""}
            </span>
          )}
        </div>
        <div className="relative text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-[#f0b429]" />
          <h1 className="text-xl font-black text-white uppercase tracking-wide">Fixtures &amp; Standings</h1>
          <p className="mt-1 text-xs text-white/50">Munhumutapa Challenge Cup 2026</p>
        </div>
      </div>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#f0b429]/10">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              activeCategory === c.value
                ? "border-b-2 border-[#f0b429] text-[#f0b429]"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-16 pt-5 space-y-6">

        {!hasAnyFixtures ? (
          /* ── Empty state ──────────────────────────────────────────────────── */
          <div className="rounded-2xl border border-dashed border-[#f0b429]/10 p-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="font-semibold text-white/40">Fixtures not yet published</p>
            <p className="mt-1 text-xs text-white/20">The draw and fixtures will be posted after the 21 April meeting</p>
          </div>
        ) : (
          <>
            {/* ── Standings ─────────────────────────────────────────────────── */}
            {hasStandings && (
              <div className="space-y-4">
                {Object.entries(standings)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([group, rows]) => (
                    <div key={group} className="rounded-2xl border border-[#f0b429]/10 bg-white/5 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-[#f0b429]/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#f0b429]">{group}</p>
                        <p className="text-[10px] text-white/30">Standings</p>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#f0b429]/5 text-white/30">
                            <th className="py-2 pl-4 text-left font-medium w-8">#</th>
                            <th className="py-2 text-left font-medium">Team</th>
                            <th className="py-2 text-center font-medium w-8">P</th>
                            <th className="py-2 text-center font-medium w-8">W</th>
                            <th className="py-2 text-center font-medium w-8">D</th>
                            <th className="py-2 text-center font-medium w-8">L</th>
                            <th className="py-2 text-center font-medium w-8">GD</th>
                            <th className="py-2 pr-4 text-center font-medium w-8">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((s, idx) => (
                            <tr
                              key={s.team}
                              className={`border-b border-[#f0b429]/5 last:border-0 ${idx === 0 ? "bg-[#f0b429]/5" : ""}`}
                            >
                              <td className="py-2.5 pl-4 text-white/40">{idx + 1}</td>
                              <td className="py-2.5 font-semibold text-white">{s.team}</td>
                              <td className="py-2.5 text-center text-white/60">{s.played}</td>
                              <td className="py-2.5 text-center text-white/60">{s.won}</td>
                              <td className="py-2.5 text-center text-white/60">{s.drawn}</td>
                              <td className="py-2.5 text-center text-white/60">{s.lost}</td>
                              <td className={`py-2.5 text-center font-medium ${s.gd > 0 ? "text-green-400" : s.gd < 0 ? "text-red-400" : "text-white/40"}`}>
                                {s.gd > 0 ? `+${s.gd}` : s.gd}
                              </td>
                              <td className="py-2.5 pr-4 text-center font-black text-[#f0b429]">{s.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
              </div>
            )}

            {/* ── Fixtures by round ─────────────────────────────────────────── */}
            {(Object.entries(byRound) as [Round, Fixture[]][]).map(([round, roundFixtures]) => {
              // Group fixtures by date
              const byDate: Record<string, Fixture[]> = {};
              roundFixtures.forEach((f) => {
                if (!byDate[f.date]) byDate[f.date] = [];
                byDate[f.date].push(f);
              });

              return (
                <div key={round}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
                    {ROUND_LABELS[round]}
                  </p>

                  {Object.entries(byDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, dateFixtures]) => (
                      <div key={date} className="mb-4">
                        <p className="mb-2 flex items-center gap-2 text-xs text-white/30">
                          <Calendar className="h-3 w-3" />
                          {formatDate(date)}
                        </p>

                        <div className="space-y-2">
                          {dateFixtures.map((f) => (
                            <FixtureCard key={f.id} fixture={f} />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              );
            })}
          </>
        )}

        {/* ── Admin link ──────────────────────────────────────────────────────── */}
        <div className="border-t border-[#f0b429]/5 pt-4 text-center">
          <Link
            href="/admin/tournaments/munhumutapa-2026/fixtures"
            className="text-xs text-white/20 hover:text-white/40"
          >
            Admin — Enter Results →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Fixture card ─────────────────────────────────────────────────────────────

function FixtureCard({ fixture: f }: { fixture: Fixture }) {
  const isCompleted = f.status === "completed";
  const isLive      = f.status === "live";
  const hasScore    = f.homeScore !== null && f.awayScore !== null;

  const homeWon = hasScore && f.homeScore! > f.awayScore!;
  const awayWon = hasScore && f.awayScore! > f.homeScore!;

  return (
    <div className={`rounded-xl border p-4 ${
      isLive
        ? "border-red-500/30 bg-red-900/10"
        : isCompleted
        ? "border-[#f0b429]/10 bg-white/5"
        : "border-[#f0b429]/10 bg-white/5"
    }`}>
      {/* Group + time row */}
      <div className="mb-3 flex items-center justify-between text-[10px] text-white/30">
        <span>{f.group}</span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
              ● LIVE
            </span>
          )}
          {!isLive && (
            <span className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> {f.time}
            </span>
          )}
          {f.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" /> {f.venue}
            </span>
          )}
        </div>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 text-right">
          <p className={`text-sm font-bold ${homeWon ? "text-[#f0b429]" : "text-white"}`}>
            {f.homeTeam}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 shrink-0">
          {hasScore ? (
            <>
              <span className={`text-xl font-black w-7 text-center ${homeWon ? "text-[#f0b429]" : "text-white"}`}>
                {f.homeScore}
              </span>
              <Minus className="h-3 w-3 text-white/20" />
              <span className={`text-xl font-black w-7 text-center ${awayWon ? "text-[#f0b429]" : "text-white"}`}>
                {f.awayScore}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-1">
              <span className="text-xs font-bold text-white/30">VS</span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 text-left">
          <p className={`text-sm font-bold ${awayWon ? "text-[#f0b429]" : "text-white"}`}>
            {f.awayTeam}
          </p>
        </div>
      </div>

      {/* Status badge */}
      {isCompleted && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-white/20">Full Time</span>
        </div>
      )}
    </div>
  );
}
