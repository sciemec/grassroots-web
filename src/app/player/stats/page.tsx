"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, TrendingUp, Trophy, BarChart2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORTS, FIELD_META_LABELS, SportKey } from "@/config/sports";
import api from "@/lib/api";

// Human-readable stat labels (re-exported from config in a moment)
const SPORT_EMOJIS: Record<string, string> = Object.fromEntries(
  SPORTS.map((s) => [s.key, s.emoji])
);

const RESULT_STYLE: Record<string, string> = {
  Win:  "bg-green-500/15 text-green-700",
  Loss: "bg-red-500/15 text-red-700",
  Draw: "bg-amber-500/15 text-amber-700",
  "N/A": "bg-muted text-muted-foreground",
};

interface StatEntry {
  id: string;
  sport: SportKey;
  role: string;
  match_type: string;
  opponent: string | null;
  match_date: string;
  competition: string | null;
  result: string;
  score: string | null;
  stats: Record<string, string>;
  notes: string | null;
  created_at: string;
}

export default function PlayerStatsPage() {
  const { user } = useAuthStore();
  const [entries, setEntries]   = useState<StatEntry[]>([]);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportKey | "all">("all");

  useEffect(() => {
    if (!user) return; // guests see empty state
    setLoading(true);
    api.get("/player/stats")
      .then((res) => setEntries(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = sportFilter === "all"
    ? entries
    : entries.filter((e) => e.sport === sportFilter);

  // Quick summary stats
  const totalMatches   = entries.filter((e) => e.match_type === "match").length;
  const wins           = entries.filter((e) => e.result === "Win").length;
  const uniqueSports   = Array.from(new Set(entries.map((e) => e.sport))).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">My Stats</h1>
                <p className="text-sm text-muted-foreground">Your match and training performance history</p>
              </div>
            </div>
            <Link
              href="/player/stats/new"
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Log Stats
            </Link>
          </div>

          {/* Summary cards */}
          {entries.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                { icon: BarChart2, label: "Total Logged",   value: entries.length, color: "text-primary" },
                { icon: Trophy,    label: "Matches",        value: totalMatches,   color: "text-amber-500" },
                { icon: TrendingUp, label: "Wins",          value: wins,           color: "text-green-500" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl border bg-card p-4 text-center">
                  <Icon className={`mx-auto mb-1.5 h-5 w-5 ${color}`} />
                  <p className="text-2xl font-extrabold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sport filter chips */}
          {uniqueSports > 1 && (
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setSportFilter("all")}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${sportFilter === "all" ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}
              >
                All sports
              </button>
              {Array.from(new Set(entries.map((e) => e.sport))).map((s) => (
                <button
                  key={s}
                  onClick={() => setSportFilter(s)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${sportFilter === s ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}
                >
                  {SPORT_EMOJIS[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <BarChart2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No stats logged yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Log your first match or training stats so scouts can see your performance.
              </p>
              <Link
                href="/player/stats/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Log your first stats
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-card overflow-hidden">
                  {/* Row header — always visible */}
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-2xl flex-shrink-0">{SPORT_EMOJIS[entry.sport] ?? "🏅"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold capitalize">{entry.sport}</p>
                        <span className="text-xs text-muted-foreground capitalize">· {entry.match_type}</span>
                        {entry.opponent && (
                          <span className="text-xs text-muted-foreground">vs {entry.opponent}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.match_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                        {entry.competition && ` · ${entry.competition}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.score && <span className="text-sm font-bold">{entry.score}</span>}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_STYLE[entry.result] ?? RESULT_STYLE["N/A"]}`}>
                        {entry.result}
                      </span>
                    </div>
                  </button>

                  {/* Expanded stats */}
                  {expanded === entry.id && (
                    <div className="border-t px-5 py-4">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                        {Object.entries(entry.stats)
                          .filter(([, v]) => v !== "" && v !== null)
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-1 border-b border-dashed border-muted last:border-0">
                              <span className="text-xs text-muted-foreground">
                                {(FIELD_META_LABELS as Record<string, string>)[key] ?? key}
                              </span>
                              <span className="text-sm font-semibold">{value}</span>
                            </div>
                          ))}
                      </div>
                      {entry.notes && (
                        <p className="mt-3 text-xs text-muted-foreground italic">&quot;{entry.notes}&quot;</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
