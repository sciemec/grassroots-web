"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, Trophy, Users, Globe, Star, ChevronRight, Search, Calendar, MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface ScoutPlayer {
  id: string;
  initials: string;
  position: string;
  province: string;
  age_group?: string;
  talent_score?: number;
}

interface Fixture {
  id: number;
  home: string;
  away: string;
  date: string;
  venue: string;
  competition: string;
}

const FIXTURES: Fixture[] = [
  { id: 1, home: "Harare City FC", away: "CAPS United", date: "2026-03-22", venue: "Rufaro Stadium", competition: "Castle Lager PSL" },
  { id: 2, home: "Dynamos FC", away: "Highlanders FC", date: "2026-03-29", venue: "National Sports Stadium", competition: "Castle Lager PSL" },
  { id: 3, home: "FC Platinum", away: "Chicken Inn FC", date: "2026-04-05", venue: "Mandava Stadium", competition: "Castle Lager PSL" },
];

const PROVINCES = [
  { name: "Harare", count: 2840 },
  { name: "Bulawayo", count: 1620 },
  { name: "Manicaland", count: 980 },
  { name: "Midlands", count: 870 },
  { name: "Masvingo", count: 760 },
  { name: "Mashonaland East", count: 640 },
  { name: "Mashonaland West", count: 590 },
  { name: "Mashonaland Central", count: 480 },
  { name: "Matabeleland North", count: 320 },
  { name: "Matabeleland South", count: 290 },
];

const MAX_PROVINCE_COUNT = PROVINCES[0].count;

export default function FanHubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "fan") { router.push("/dashboard"); return; }
  }, [user, router]);

  const { data: playersData, isLoading: playersLoading, isError: playersError } = useQuery<{ data: ScoutPlayer[] }>({
    queryKey: ["fan-leaderboard"],
    queryFn: async () => {
      const res = await api.get("/scout/players", { params: { per_page: 10 } });
      return res.data;
    },
    enabled: !!user,
  });

  if (!user) return null;

  const players = playersData?.data ?? [];
  const filtered = search.trim()
    ? players.filter((p) =>
        p.position?.toLowerCase().includes(search.toLowerCase()) ||
        p.province?.toLowerCase().includes(search.toLowerCase()) ||
        p.age_group?.toLowerCase().includes(search.toLowerCase())
      )
    : players;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-balance">Fan Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover talent, follow athletes, and support grassroots sport
          </p>
        </div>

        {/* Quick stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Users, label: "Athletes on platform", value: "10K+", color: "text-green-500" },
            { icon: Trophy, label: "Top-rated this week", value: "250", color: "text-yellow-500" },
            { icon: Globe, label: "Provinces covered", value: "10", color: "text-blue-500" },
            { icon: Heart, label: "Players you follow", value: "0", color: "text-pink-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-balance">
              Top players this week
            </h2>
            <Link href="/fan/leaderboard" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Full leaderboard <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Search bar */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by province, position, age group…"
              className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {playersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : playersError || players.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              <Trophy className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No player data available right now.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No players match your filter.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((player, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span className={`w-6 text-center text-sm font-bold ${
                      rank === 1 ? "text-yellow-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                    </span>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm">
                      {player.initials}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium">{player.initials}</p>
                      <p className="text-xs text-muted-foreground">{player.position} · {player.province}</p>
                    </div>

                    {player.talent_score != null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="text-sm font-bold">{player.talent_score}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Fixtures */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-balance">
            Upcoming Fixtures
          </h2>
          <div className="space-y-3">
            {FIXTURES.map((f) => (
              <div key={f.id} className="rounded-xl border bg-card px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {f.home} <span className="text-muted-foreground font-normal">vs</span> {f.away}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {f.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(f.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {f.competition}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Provinces */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide text-balance">
            Top Provinces by Athletes
          </h2>
          <div className="rounded-xl border bg-card p-5 space-y-3">
            {PROVINCES.map((prov, i) => (
              <div key={prov.name} className="flex items-center gap-3">
                <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                <span className="w-36 text-sm font-medium truncate">{prov.name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(prov.count / MAX_PROVINCE_COUNT) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs text-muted-foreground">{prov.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
