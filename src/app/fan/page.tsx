"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, Trophy, Users, Globe, Star, ChevronRight, Search,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const leaderboard = [
  { rank: 1, initials: "T.M.", position: "Forward", province: "Harare", score: 94 },
  { rank: 2, initials: "K.N.", position: "Midfielder", province: "Bulawayo", score: 91 },
  { rank: 3, initials: "R.C.", position: "Goalkeeper", province: "Mutare", score: 88 },
  { rank: 4, initials: "B.S.", position: "Defender", province: "Gweru", score: 85 },
  { rank: 5, initials: "A.M.", position: "Midfielder", province: "Masvingo", score: 83 },
];

export default function FanHubPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "fan") { router.push("/dashboard"); return; }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Fan Hub 🎉</h1>
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

        {/* Discover banner */}
        <div className="mb-8 rounded-2xl border bg-gradient-to-r from-pink-950/40 to-green-950/40 p-6">
          <h3 className="mb-2 text-lg font-bold">Discover talent near you</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Browse verified athletes from your province. Privacy-protected profiles keep players safe.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by province, position, age group…"
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Search
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Top players this week
            </h2>
            <Link href="/fan/leaderboard" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Full leaderboard <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {leaderboard.map(({ rank, initials, position, province, score }) => (
              <div
                key={rank}
                className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span className={`w-6 text-center text-sm font-bold ${
                  rank === 1 ? "text-yellow-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                </span>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm">
                  {initials}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{initials}</p>
                  <p className="text-xs text-muted-foreground">{position} · {province}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-sm font-bold">{score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon features */}
        <div className="rounded-xl border border-dashed p-6">
          <h3 className="mb-2 font-semibold">More Fan features coming soon</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            We&apos;re building out the full Fan Hub experience including player follows,
            donation support for community athletes, academy directory, and live highlights.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Follow athletes", "Donation support", "Academy directory", "Live highlights", "Regional rankings"].map((f) => (
              <span key={f} className="rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
