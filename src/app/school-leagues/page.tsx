"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trophy, BookOpen, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const SPORT_TABS = ["Football", "Netball", "Rugby", "Athletics"] as const;
type SportTab = (typeof SPORT_TABS)[number];

const SPORT_EMOJIS: Record<SportTab, string> = {
  Football: "⚽", Netball: "🏐", Rugby: "🏉", Athletics: "🏃",
};

interface Tournament {
  id: string;
  name: string;
  governing_body: "NASH" | "NAPH";
  sport: SportTab;
  status: "Active" | "Upcoming";
}

const ALL_TOURNAMENTS: Tournament[] = [
  { id: "1", name: "NASH Football Boys Championship", governing_body: "NASH", sport: "Football", status: "Active" },
  { id: "2", name: "NASH Football Girls Championship", governing_body: "NASH", sport: "Football", status: "Active" },
  { id: "3", name: "NAPH Football Under-13", governing_body: "NAPH", sport: "Football", status: "Upcoming" },
  { id: "4", name: "NASH Netball Championship", governing_body: "NASH", sport: "Netball", status: "Active" },
  { id: "5", name: "NASH Rugby Championship", governing_body: "NASH", sport: "Rugby", status: "Active" },
  { id: "6", name: "NASH Athletics Championship", governing_body: "NASH", sport: "Athletics", status: "Active" },
  { id: "7", name: "NAPH Athletics", governing_body: "NAPH", sport: "Athletics", status: "Upcoming" },
];

const SCHOOLS = [
  "Harare High", "St George's College", "Prince Edward", "Falcon College",
  "Peterhouse", "Churchill", "Gateway", "Chisipite",
];

interface LeagueRow {
  school: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
}

function makeLeagueTable(schools: string[]): LeagueRow[] {
  return schools.map((school, i) => {
    const w = Math.max(0, 5 - i);
    const d = i % 2;
    const l = Math.max(0, i - 1);
    const p = w + d + l;
    return { school, p, w, d, l, gf: w * 2 + d, ga: l * 2 + d };
  }).sort((a, b) => (b.w * 3 + b.d) - (a.w * 3 + a.d));
}

interface MatchResult {
  home: string;
  away: string;
  homeScore: string;
  awayScore: string;
}

function generateFixtures(schools: string[]): { home: string; away: string }[] {
  const fixtures: { home: string; away: string }[] = [];
  for (let i = 0; i < schools.length; i++) {
    for (let j = i + 1; j < schools.length; j++) {
      fixtures.push({ home: schools[i], away: schools[j] });
    }
  }
  return fixtures;
}

const STORAGE_KEY = "gs_school_league_tables";

function loadSavedTables(): Record<string, LeagueRow[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LeagueRow[]>) : {};
  } catch {
    return {};
  }
}

function saveTables(tables: Record<string, LeagueRow[]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tables)); } catch { /* quota exceeded */ }
}

export default function SchoolLeaguesPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [activeSport, setActiveSport] = useState<SportTab>("Football");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [savedTables, setSavedTables] = useState<Record<string, LeagueRow[]>>({});
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultForm, setResultForm] = useState<MatchResult>({ home: SCHOOLS[0], away: SCHOOLS[1], homeScore: "", awayScore: "" });
  const [fixtures, setFixtures] = useState<{ home: string; away: string }[] | null>(null);

  // Load saved tables from localStorage on mount
  useEffect(() => {
    setSavedTables(loadSavedTables());
  }, []);

  const leagueRows = selectedTournament
    ? (savedTables[selectedTournament.id] ?? makeLeagueTable(SCHOOLS))
    : makeLeagueTable(SCHOOLS);

  const setLeagueRows = (updater: (prev: LeagueRow[]) => LeagueRow[]) => {
    if (!selectedTournament) return;
    setSavedTables((prev) => {
      const current = prev[selectedTournament.id] ?? makeLeagueTable(SCHOOLS);
      const next = updater(current);
      const updated = { ...prev, [selectedTournament.id]: next };
      saveTables(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") router.push("/dashboard");
  }, [_hasHydrated, user, router]);

  const tournamentsForSport = ALL_TOURNAMENTS.filter((t) => t.sport === activeSport);

  function handleLogResult() {
    if (!resultForm.homeScore || !resultForm.awayScore) return;
    const hs = parseInt(resultForm.homeScore, 10);
    const as = parseInt(resultForm.awayScore, 10);
    setLeagueRows((rows) =>
      rows
        .map((row) => {
          if (row.school === resultForm.home) {
            const w = hs > as ? 1 : 0;
            const d = hs === as ? 1 : 0;
            const l = hs < as ? 1 : 0;
            return { ...row, p: row.p + 1, w: row.w + w, d: row.d + d, l: row.l + l, gf: row.gf + hs, ga: row.ga + as };
          }
          if (row.school === resultForm.away) {
            const w = as > hs ? 1 : 0;
            const d = hs === as ? 1 : 0;
            const l = as < hs ? 1 : 0;
            return { ...row, p: row.p + 1, w: row.w + w, d: row.d + d, l: row.l + l, gf: row.gf + as, ga: row.ga + hs };
          }
          return row;
        })
        .sort((a, b) => (b.w * 3 + b.d) - (a.w * 3 + a.d))
    );
    setShowResultForm(false);
    setResultForm({ home: SCHOOLS[0], away: SCHOOLS[1], homeScore: "", awayScore: "" });
  }

  if (!_hasHydrated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">School League Manager</h1>
          <p className="text-sm text-muted-foreground">
            Manejimenti weMatambo eChikoro — NASH and NAPH tournament management
          </p>
        </div>

        {/* Sport tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {SPORT_TABS.map((sport) => (
            <button
              key={sport}
              onClick={() => { setActiveSport(sport); setSelectedTournament(null); setFixtures(null); }}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeSport === sport
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "border border-white/10 bg-card/60 hover:bg-muted"
              }`}
            >
              {SPORT_EMOJIS[sport]} {sport}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Tournaments list */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {activeSport} Tournaments
            </h2>
            {tournamentsForSport.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No tournaments loaded for {activeSport} yet
              </div>
            )}
            {tournamentsForSport.map((tournament) => (
              <div
                key={tournament.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  selectedTournament?.id === tournament.id
                    ? "border-[#f0b429]/50 bg-[#f0b429]/5"
                    : "border-white/10 bg-card/60 backdrop-blur-sm"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{SPORT_EMOJIS[tournament.sport]}</span>
                    <div>
                      <p className="font-semibold text-sm">{tournament.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          tournament.governing_body === "NASH"
                            ? "bg-[#1a5c2a]/20 text-[#1a5c2a]"
                            : "bg-blue-500/15 text-blue-700"
                        }`}>
                          {tournament.governing_body}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tournament.status === "Active"
                            ? "bg-green-500/15 text-green-700"
                            : "bg-amber-500/15 text-amber-700"
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTournament(tournament)}
                  className="flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a5c2a]/90 transition-colors"
                >
                  <Trophy className="h-3.5 w-3.5" /> View League Table
                </button>
              </div>
            ))}
          </div>

          {/* Right — League Table */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
            {!selectedTournament ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <BookOpen className="h-9 w-9 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Select a tournament on the left to view its league table
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedTournament.name}</p>
                    <p className="text-xs text-muted-foreground">League Table</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!selectedTournament) return;
                        setSavedTables((prev) => {
                          const updated = { ...prev, [selectedTournament.id]: makeLeagueTable(SCHOOLS) };
                          saveTables(updated);
                          return updated;
                        });
                      }}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      title="Reset table"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setShowResultForm((v) => !v)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#f0b429] px-3 py-1.5 text-xs font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Result
                    </button>
                  </div>
                </div>

                {/* Add Result form */}
                {showResultForm && (
                  <div className="mb-4 rounded-xl border border-white/10 bg-muted/30 p-4">
                    <p className="mb-3 text-xs font-semibold">Log Match Result</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Home Team</label>
                        <select
                          value={resultForm.home}
                          onChange={(e) => setResultForm((f) => ({ ...f, home: e.target.value }))}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                        >
                          {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Away Team</label>
                        <select
                          value={resultForm.away}
                          onChange={(e) => setResultForm((f) => ({ ...f, away: e.target.value }))}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                        >
                          {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Home Score</label>
                        <input
                          type="number" min={0} value={resultForm.homeScore}
                          onChange={(e) => setResultForm((f) => ({ ...f, homeScore: e.target.value }))}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Away Score</label>
                        <input
                          type="number" min={0} value={resultForm.awayScore}
                          onChange={(e) => setResultForm((f) => ({ ...f, awayScore: e.target.value }))}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleLogResult}
                      disabled={!resultForm.homeScore || !resultForm.awayScore || resultForm.home === resultForm.away}
                      className="mt-3 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c2a]/90 disabled:opacity-50 transition-colors"
                    >
                      Log Result
                    </button>
                  </div>
                )}

                {/* League table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 text-left font-medium w-6">Pos</th>
                        <th className="pb-2 text-left font-medium">School</th>
                        <th className="pb-2 text-center font-medium w-6">P</th>
                        <th className="pb-2 text-center font-medium w-6">W</th>
                        <th className="pb-2 text-center font-medium w-6">D</th>
                        <th className="pb-2 text-center font-medium w-6">L</th>
                        <th className="pb-2 text-center font-medium w-8">GF</th>
                        <th className="pb-2 text-center font-medium w-8">GA</th>
                        <th className="pb-2 text-center font-medium w-8">GD</th>
                        <th className="pb-2 text-center font-medium w-8">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leagueRows.map((row, idx) => (
                        <tr key={row.school} className={`border-b border-white/5 ${idx === 0 ? "text-[#f0b429]" : ""}`}>
                          <td className="py-2 text-center font-bold">{idx + 1}</td>
                          <td className="py-2 font-medium">{row.school}</td>
                          <td className="py-2 text-center">{row.p}</td>
                          <td className="py-2 text-center">{row.w}</td>
                          <td className="py-2 text-center">{row.d}</td>
                          <td className="py-2 text-center">{row.l}</td>
                          <td className="py-2 text-center">{row.gf}</td>
                          <td className="py-2 text-center">{row.ga}</td>
                          <td className="py-2 text-center">{row.gf - row.ga}</td>
                          <td className="py-2 text-center font-bold">{row.w * 3 + row.d}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fixtures generator */}
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Fixtures Generator</p>
                    <button
                      onClick={() => setFixtures(generateFixtures(SCHOOLS))}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Generate Fixtures
                    </button>
                  </div>
                  {fixtures && (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {fixtures.map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
                          <span className="font-medium">{f.home}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-medium">{f.away}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
