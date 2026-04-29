"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { safeArray } from "@/lib/safe-array";
import { ArrowLeft, Calendar, Loader2, CheckCircle2, Clock, XCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Fixture {
  id: number;
  league_id: number;
  league_name: string;
  home_club_name: string;
  away_club_name: string;
  match_date: string;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "completed" | "postponed" | "cancelled";
}

const STATUS_CONFIG = {
  scheduled:  { label: "Scheduled",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",   icon: Clock },
  completed:  { label: "Completed",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",  icon: CheckCircle2 },
  postponed:  { label: "Postponed",  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",  icon: Clock },
  cancelled:  { label: "Cancelled",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    icon: XCircle },
};

type FilterStatus = "all" | Fixture["status"];

export default function AllFixturesPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState<FilterStatus>("all");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/fixtures`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => setFixtures(safeArray<Fixture>(j)))
      .catch(() => setError("Failed to load fixtures."))
      .finally(() => setLoading(false));
  }, [token]);

  const visible = filter === "all" ? fixtures : fixtures.filter((f) => f.status === filter);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Province Administration
            </p>
            <h1 className="text-2xl font-bold text-foreground">All Fixtures</h1>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "scheduled", "completed", "postponed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
                filter === s
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "bg-white/10 text-muted-foreground hover:bg-white/20"
              }`}
            >
              {s === "all" ? `All (${fixtures.length})` : `${s} (${fixtures.filter((f) => f.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading fixtures…</span>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No fixtures found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((fx) => {
              const cfg = STATUS_CONFIG[fx.status];
              const Icon = cfg.icon;
              return (
                <div
                  key={fx.id}
                  className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* League badge */}
                      <Link
                        href={`/province-admin/leagues/${fx.league_id}`}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-white transition-colors mb-2"
                      >
                        {fx.league_name} <ChevronRight className="h-3 w-3" />
                      </Link>

                      {/* Matchup */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{fx.home_club_name}</span>
                        {fx.status === "completed" && fx.home_score !== null ? (
                          <span className="text-lg font-bold text-accent">
                            {fx.home_score} – {fx.away_score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">vs</span>
                        )}
                        <span className="font-semibold text-foreground truncate">{fx.away_club_name}</span>
                      </div>

                      {/* Meta */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(fx.match_date).toLocaleDateString("en-ZW", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric",
                        })}
                        {fx.venue ? ` · ${fx.venue}` : ""}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`flex items-center gap-1 shrink-0 text-xs font-medium px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
