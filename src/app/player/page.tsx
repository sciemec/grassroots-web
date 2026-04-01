"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dumbbell, Brain, Trophy, ChevronRight, Play, Flame, Target, TrendingUp, Star,
  Layers, Apple, Zap, BookOpen, DollarSign, Film, Camera, Award, Activity,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { HubCard } from "@/components/ui/hub-card";
import api from "@/lib/api";

interface Session {
  id: string;
  focus_area: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

interface Profile {
  position: string;
  province: string;
  age_group: string;
  scout_visible: boolean;
}

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="mb-8 h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/15 text-green-700",
  active:    "bg-blue-500/15 text-blue-700",
  aborted:   "bg-muted text-muted-foreground",
};

export default function PlayerHubPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth guard is handled by PlayerLayout — this just loads data
  useEffect(() => {
    Promise.all([
      api.get("/sessions?per_page=5").catch(() => null),
      api.get("/profile").catch(() => null),
    ])
      .then(([sessRes, profRes]) => {
        if (sessRes) setSessions(sessRes.data?.data ?? sessRes.data ?? []);
        if (profRes) setProfile(profRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completed.length)
    : 0;

  const hubCards = [
    { icon: Brain,    title: "AI Coach",         subtitle: "Mubatsiri wako — Claude AI",  href: "/player/ai-coach",           bg: "bg-[#6c3483]",  gradient: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]" },
    { icon: Play,     title: "Start Session",    subtitle: "Tanga mushandiro",            href: "/player/sessions/new",       bg: "bg-[#1a6b3c]",  gradient: "bg-gradient-to-br from-[#27ae60] to-[#1a6b3c]" },
    { icon: Dumbbell, title: "Drill Library",    subtitle: "Madrills — 48+ exercises",   href: "/player/drills",             bg: "bg-[#1a5276]",  gradient: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]" },
    { icon: Layers,   title: "Training Formats", subtitle: "Rondo, SSG, Shooting",       href: "/player/training-formats",   bg: "bg-[#7d6608]",  gradient: "bg-gradient-to-br from-[#7d6608] to-[#5a4b06]" },
    { icon: Trophy,   title: "Milestones",       subtitle: "Zvikumbiro zvako",            href: "/player/milestones",         bg: "bg-[#d35400]",  gradient: "bg-gradient-to-br from-[#d35400] to-[#a04000]" },
    { icon: Zap,      title: "Talent ID",        subtitle: "Get scouted — Verekedza",    href: "/player/talent-id",          bg: "bg-[#1a5276]",  gradient: "bg-gradient-to-br from-[#2471a3] to-[#1a5276]" },
    { icon: Apple,    title: "Nutrition",        subtitle: "Sadza, nyama, zeventeen",    href: "/player/nutrition",          bg: "bg-[#1a6b3c]",  gradient: "bg-gradient-to-br from-[#1e8449] to-[#1a6b3c]" },
    { icon: TrendingUp,title: "My Progress",    subtitle: "Kuvandudzwa — track journey",href: "/player/progress",           bg: "bg-[#7d6608]",  gradient: "bg-gradient-to-br from-[#9d8209] to-[#7d6608]" },
    { icon: BookOpen,  title: "Knowledge Base",  subtitle: "Drills, tactics & nutrition", href: "/knowledge",              bg: "bg-[#1a5276]",  gradient: "bg-gradient-to-br from-[#2471a3] to-[#1a5276]" },
    { icon: TrendingUp,title: "My Potential",    subtitle: "AI development trajectory",   href: "/player/potential",          bg: "bg-[#6c3483]",  gradient: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]" },
    { icon: DollarSign,title: "Market Value",    subtitle: "Est. USD transfer value",      href: "/player/valuation",          bg: "bg-[#7d6608]",  gradient: "bg-gradient-to-br from-[#9d8209] to-[#7d6608]" },
    { icon: Film,      title: "Highlight Vault", subtitle: "Upload & share your videos",  href: "/player/vault",              bg: "bg-[#1a5276]",  gradient: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]" },
    { icon: Camera,    title: "Record Drill",    subtitle: "Record your performance now", href: "/player/record",             bg: "bg-[#7b241c]",  gradient: "bg-gradient-to-br from-[#c0392b] to-[#7b241c]" },
    { icon: Award,     title: "Talent Showcase", subtitle: "Upload clips — get scouted",  href: "/player/showcase",           bg: "bg-[#1a4971]",  gradient: "bg-gradient-to-br from-[#2471a3] to-[#1a4971]" },
    { icon: Activity,  title: "Session Tracker", subtitle: "Friend logs your actions live", href: "/player/session-tracker",    bg: "bg-[#1a6b3c]",  gradient: "bg-gradient-to-br from-[#1e8449] to-[#145a32]" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#1A6B3C]">
            Mhoro — Player Hub
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#0D2B1A]">
            {user?.name?.split(" ")[0] ?? "Player"} 👋
          </h1>
          <p className="mt-0.5 text-sm italic text-[#1A6B3C]/80">
            {profile?.position
              ? `${profile.position} · ${profile.province ?? ""} · ${profile.age_group?.toUpperCase() ?? ""}`
              : "Ita profile yako — Complete your profile"}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Flame,      label: "Completed",    value: completed.length, color: "text-orange-400" },
            { icon: Star,       label: "Avg score",    value: `${avgScore}%`,   color: "text-accent" },
            { icon: Target,     label: "Total",        value: sessions.length,  color: "text-blue-400" },
            { icon: TrendingUp, label: "Scout visible",value: profile?.scout_visible ? "Yes" : "No", color: "text-primary" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <Icon className={`mb-2 h-4 w-4 ${color}`} />
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Hub cards grid — mobile-style */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1A6B3C]">
            Your Hub
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hubCards.map((card) => (
              <HubCard key={card.href} {...card} />
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#1A6B3C]">
              Recent Sessions
            </p>
            <Link href="/player/sessions" className="flex items-center gap-1 text-xs text-[#1A6B3C] hover:text-[#0D2B1A] transition-colors">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
              <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-white">No sessions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tanga mushandiro wako wekutanga
              </p>
              <Link
                href="/player/sessions/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <Play className="h-3.5 w-3.5" /> Start session
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-card/60 px-4 py-3.5 transition-colors hover:bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-white">{session.focus_area}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString("en-ZW", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.overall_score !== null && (
                      <span className="text-sm font-bold text-accent">{session.overall_score}%</span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[session.status] ?? "bg-muted text-muted-foreground"}`}>
                      {session.status}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
