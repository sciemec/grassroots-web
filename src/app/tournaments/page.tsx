"use client";

import { useState } from "react";
import { Trophy, Calendar, MapPin, Users, ChevronRight, Filter } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { SportSelector } from "@/components/sports/sport-selector";
import { SPORTS, SPORT_MAP, SportKey } from "@/config/sports";

interface Tournament {
  id: string;
  name: string;
  sport: SportKey;
  organiser: string;
  ageGroup: string;
  province: string;
  startDate: string;
  endDate: string;
  teams: number;
  status: "upcoming" | "ongoing" | "completed";
  prize?: string;
}

// Static NASH tournament data — replace with API call when backend is ready
const TOURNAMENTS: Tournament[] = [
  {
    id: "nash-football-2026",
    name: "NASH Football Championships",
    sport: "football",
    organiser: "NASH / ZIFA",
    ageGroup: "U20",
    province: "National",
    startDate: "2026-04-05",
    endDate: "2026-04-20",
    teams: 32,
    status: "upcoming",
    prize: "National title + COSAFA qualification",
  },
  {
    id: "nash-netball-2026",
    name: "NASH Netball Championships",
    sport: "netball",
    organiser: "NASH / ZNA",
    ageGroup: "U20",
    province: "National",
    startDate: "2026-04-07",
    endDate: "2026-04-15",
    teams: 24,
    status: "upcoming",
    prize: "National title",
  },
  {
    id: "nash-athletics-2026",
    name: "NASH Athletics Championships",
    sport: "athletics",
    organiser: "NASH / AAZ",
    ageGroup: "U18 / U20",
    province: "National",
    startDate: "2026-03-28",
    endDate: "2026-03-30",
    teams: 10,
    status: "ongoing",
  },
  {
    id: "nash-rugby-2026",
    name: "NASH Rugby Schools Cup",
    sport: "rugby",
    organiser: "NASH / ZRU",
    ageGroup: "U18",
    province: "National",
    startDate: "2026-05-10",
    endDate: "2026-05-25",
    teams: 16,
    status: "upcoming",
    prize: "Schools Cup + senior academy trials",
  },
  {
    id: "harare-basketball-2026",
    name: "Harare Metro Basketball League",
    sport: "basketball",
    organiser: "ZBFA",
    ageGroup: "Senior",
    province: "Harare",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
    teams: 12,
    status: "upcoming",
  },
  {
    id: "premier-league-2026",
    name: "Castle Lager Premier League 2026",
    sport: "football",
    organiser: "ZIFA",
    ageGroup: "Senior",
    province: "National",
    startDate: "2026-03-01",
    endDate: "2026-11-30",
    teams: 18,
    status: "ongoing",
    prize: "AFCON/COSAFA qualification",
  },
  {
    id: "logan-cup-2026",
    name: "Logan Cup",
    sport: "cricket",
    organiser: "Zimbabwe Cricket",
    ageGroup: "Senior",
    province: "National",
    startDate: "2026-01-10",
    endDate: "2026-03-28",
    teams: 5,
    status: "ongoing",
    prize: "Logan Cup trophy",
  },
  {
    id: "nash-volleyball-2026",
    name: "NASH Volleyball Championships",
    sport: "volleyball",
    organiser: "NASH / ZVBF",
    ageGroup: "U20",
    province: "National",
    startDate: "2026-05-20",
    endDate: "2026-05-25",
    teams: 20,
    status: "upcoming",
  },
  {
    id: "nash-swimming-2026",
    name: "NASH Swimming Championships",
    sport: "swimming",
    organiser: "NASH / ZSWF",
    ageGroup: "U18 / U20",
    province: "National",
    startDate: "2026-06-05",
    endDate: "2026-06-07",
    teams: 15,
    status: "upcoming",
  },
  {
    id: "chibuku-super-cup-2026",
    name: "Chibuku Super Cup",
    sport: "football",
    organiser: "ZIFA",
    ageGroup: "Senior",
    province: "National",
    startDate: "2026-07-15",
    endDate: "2026-08-30",
    teams: 16,
    status: "upcoming",
    prize: "Cup title + prize money",
  },
];

const STATUS_STYLES = {
  upcoming: "bg-blue-500/15 text-blue-600",
  ongoing: "bg-green-500/15 text-green-600",
  completed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS = {
  upcoming: "Upcoming",
  ongoing: "Live",
  completed: "Completed",
};

export default function TournamentsPage() {
  const [sportFilter, setSportFilter] = useState<SportKey[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = TOURNAMENTS.filter((t) => {
    if (sportFilter.length > 0 && !sportFilter.includes(t.sport)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    total: TOURNAMENTS.length,
    ongoing: TOURNAMENTS.filter((t) => t.status === "ongoing").length,
    upcoming: TOURNAMENTS.filter((t) => t.status === "upcoming").length,
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tournaments</h1>
              <p className="text-sm text-muted-foreground">
                NASH, ZIFA, and national competitions across all 10 sports
              </p>
            </div>
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                showFilter || sportFilter.length > 0 || statusFilter !== "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {(sportFilter.length > 0 || statusFilter !== "all") && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-[10px] font-bold">
                  {sportFilter.length + (statusFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Stats row */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: "Total", value: counts.total, color: "text-foreground" },
              { label: "Live Now", value: counts.ongoing, color: "text-green-600" },
              { label: "Upcoming", value: counts.upcoming, color: "text-blue-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border bg-card p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="mb-6 rounded-xl border bg-card p-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filter by sport
                </p>
                <SportSelector
                  value={sportFilter}
                  onChange={(v) => setSportFilter(v as SportKey[])}
                  multi
                  size="sm"
                />
                {sportFilter.length > 0 && (
                  <button
                    onClick={() => setSportFilter([])}
                    className="mt-2 text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Clear sport filter
                  </button>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "upcoming", "ongoing", "completed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        statusFilter === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {s === "all" ? "All" : STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sport quick-filter chips */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSportFilter([])}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                sportFilter.length === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All sports
            </button>
            {SPORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSportFilter(sportFilter.includes(s.key) ? sportFilter.filter((k) => k !== s.key) : [...sportFilter, s.key])}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sportFilter.includes(s.key) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Tournament list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No tournaments match your filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const sportCfg = SPORT_MAP[t.sport];
                return (
                  <div
                    key={t.id}
                    className="rounded-xl border bg-card p-5 hover:border-primary/30 hover:bg-muted/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                        {sportCfg.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{t.name}</h3>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[t.status]}`}>
                                {STATUS_LABELS[t.status]}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{t.organiser} · {t.ageGroup}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(t.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            {" — "}
                            {new Date(t.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t.province}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t.teams} teams
                          </span>
                          {t.prize && (
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3 w-3 text-yellow-500" />
                              {t.prize}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
