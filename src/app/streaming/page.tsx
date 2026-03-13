"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Users, Clock, MapPin, Eye, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

// Mock live matches — in production these come from backend
const LIVE_MATCHES = [
  {
    id: "1",
    homeTeam: "Harare City Youth",
    awayTeam: "Dynamos FC U17",
    homeScore: 2,
    awayScore: 1,
    minute: 67,
    venue: "Rufaro Stadium",
    province: "Harare",
    ageGroup: "U17",
    viewers: 142,
    status: "live",
    commentary: "⚡ GOAL! Tinashe scores with a powerful left-foot strike from 25 yards!",
  },
  {
    id: "2",
    homeTeam: "Bulawayo Chiefs",
    awayTeam: "Highlanders Academy",
    homeScore: 0,
    awayScore: 0,
    minute: 34,
    venue: "Barbourfields",
    province: "Bulawayo",
    ageGroup: "U20",
    viewers: 89,
    status: "live",
    commentary: "🔥 End-to-end action — Mutanda nearly scores from the corner!",
  },
];

const UPCOMING = [
  { id: "3", homeTeam: "Mutare FC", awayTeam: "Masvingo Stars", date: "Today 15:00", venue: "Sakubva Stadium", province: "Manicaland", ageGroup: "Senior" },
  { id: "4", homeTeam: "Gweru United", awayTeam: "Kwekwe FC", date: "Tomorrow 10:00", venue: "Gweru SC Ground", province: "Midlands", ageGroup: "U17" },
  { id: "5", homeTeam: "Bindura Youth", awayTeam: "Shamva FC", date: "Tomorrow 14:00", venue: "Trojan Stadium", province: "Mashonaland Central", ageGroup: "U13" },
];

export default function StreamingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);
  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-red-500 animate-pulse" /> Live Streaming Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Zimbabwe grassroots matches — live and upcoming</p>
        </div>

        {/* Live now */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Live Now</h2>
          </div>

          <div className="space-y-4">
            {LIVE_MATCHES.map((match) => (
              <div key={match.id} className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-5">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-500">LIVE {match.minute}&apos;</span>
                    <span className="text-xs text-muted-foreground">{match.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {match.viewers} watching
                  </div>
                </div>

                {/* Score */}
                <div className="mb-4 flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-sm font-bold">{match.homeTeam}</p>
                    <p className="text-4xl font-black text-primary">{match.homeScore}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold text-muted-foreground">vs</div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{match.awayTeam}</p>
                    <p className="text-4xl font-black text-primary">{match.awayScore}</p>
                  </div>
                </div>

                {/* Commentary */}
                <div className="mb-3 rounded-lg bg-background/60 px-3 py-2.5 text-sm">{match.commentary}</div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}, {match.province}</span>
                  <button className="flex items-center gap-1 font-medium text-primary hover:underline">
                    Watch live <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Matches</h2>
          <div className="space-y-2">
            {UPCOMING.map((match) => (
              <div key={match.id} className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:bg-muted/40 transition-colors">
                <div>
                  <p className="font-medium">{match.homeTeam} vs {match.awayTeam}</p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {match.ageGroup}</span>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{match.province}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coach streaming CTA */}
        {user.role === "coach" && (
          <div className="mt-8 rounded-2xl border border-dashed p-6 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">Stream your match</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Coaches can record and stream matches directly from the mobile app. Real-time commentary generated from pose tracking.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Use the Grassroots Sport mobile app to start streaming →</p>
          </div>
        )}
      </main>
    </div>
  );
}
