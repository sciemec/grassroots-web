"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Star, Search, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface LeaderboardPlayer {
  id: string;
  initials: string;
  position: string;
  province: string;
  age_group?: string;
  overall_score?: number;
  talent_score?: number;
  sessions_count?: number;
}

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const AGE_GROUPS = ["u13", "u17", "u20", "senior"];

const rankColors: Record<number, string> = {
  1: "text-yellow-500",
  2: "text-slate-400",
  3: "text-amber-600",
};

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-500" : s >= 60 ? "text-yellow-500" : "text-muted-foreground";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500/15 text-green-700" :
    score >= 60 ? "bg-yellow-500/15 text-yellow-700" :
    "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
      <Star className="h-3 w-3" /> {score}
    </span>
  );
}

export default function FanLeaderboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [ageGroup, setAgeGroup] = useState("");

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return; // guests allowed
    if (user.role !== "fan" && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [hydrated, user, router]);

  const { data, isLoading, isError } = useQuery<{ data: LeaderboardPlayer[] }>({
    queryKey: ["fan-leaderboard-full", position, ageGroup],
    queryFn: async () => {
      const res = await api.get("/scout/players", {
        params: {
          position: position || undefined,
          age_group: ageGroup || undefined,
          per_page: 50,
        },
      });
      return res.data;
    },
    enabled: hydrated && !!user,
  });

  if (!hydrated) return null;

  const players = data?.data ?? [];
  const filtered = search.trim()
    ? players.filter((p) =>
        p.position?.toLowerCase().includes(search.toLowerCase()) ||
        p.province?.toLowerCase().includes(search.toLowerCase()) ||
        p.age_group?.toLowerCase().includes(search.toLowerCase()) ||
        p.initials?.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  const sorted = [...filtered].sort((a, b) => {
    const sa = a.overall_score ?? a.talent_score ?? 0;
    const sb = b.overall_score ?? b.talent_score ?? 0;
    return sb - sa;
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/fan" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top-rated players across Zimbabwe</p>
          </div>
        </div>

        {/* Top 3 podium */}
        {!isLoading && sorted.length >= 3 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
              const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const score = p.overall_score ?? p.talent_score ?? 0;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border bg-card p-5 text-center ${
                    actualRank === 1 ? "border-yellow-500/40 bg-yellow-500/5" : ""
                  }`}
                >
                  <div className="mb-2 text-2xl">
                    {actualRank === 1 ? "🥇" : actualRank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {p.initials}
                  </div>
                  <p className="text-sm font-semibold uppercase">{p.position}</p>
                  <p className="text-xs text-muted-foreground">{p.province}</p>
                  {score > 0 && (
                    <div className={`mt-2 text-xl font-black ${scoreColor(score)}`}>{score}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by initials, province, position…"
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPosition("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !position ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All positions
            </button>
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(position === pos ? "" : pos)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  position === pos ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setAgeGroup("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !ageGroup ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              All ages
            </button>
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag}
                onClick={() => setAgeGroup(ageGroup === ag ? "" : ag)}
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition-colors ${
                  ageGroup === ag ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <Trophy className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="text-sm">Could not load leaderboard. Please try again.</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No players match your filters</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <div className="border-b bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div className="grid grid-cols-[2rem_3rem_1fr_1fr_1fr_5rem] gap-3">
                <span>#</span>
                <span></span>
                <span>Position</span>
                <span>Province</span>
                <span>Age Group</span>
                <span className="text-right">Score</span>
              </div>
            </div>
            <div className="divide-y">
              {sorted.map((p, index) => {
                const rank = index + 1;
                const score = p.overall_score ?? p.talent_score;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[2rem_3rem_1fr_1fr_1fr_5rem] items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <span className={`text-sm font-bold ${rankColors[rank] ?? "text-muted-foreground"}`}>
                      {rank <= 3 ? (rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉") : rank}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {p.initials}
                    </div>
                    <span className="text-sm font-semibold uppercase">{p.position}</span>
                    <span className="text-sm text-muted-foreground">{p.province}</span>
                    <span className="text-xs font-medium uppercase text-muted-foreground">{p.age_group ?? "—"}</span>
                    <div className="flex justify-end">
                      {score != null ? (
                        <ScoreBadge score={score} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              {sorted.length} player{sorted.length !== 1 ? "s" : ""} shown · Ranked by training score
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
