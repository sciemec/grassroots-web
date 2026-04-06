"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  Dumbbell, Brain, Trophy, ChevronRight, Play, Flame, Target, TrendingUp, Star,
  Layers, Apple, Zap, BookOpen, DollarSign, Film, Camera, Award, Activity, CalendarDays, Dna, Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { HubCard } from "@/components/ui/hub-card";
import api from "@/lib/api";
import { getSchedule, saveSchedule, getPendingSessions, clearPendingSession, type ScheduleDay } from "@/lib/offlineDB";

// Lazy-load THUTO chat widget (client-only — uses browser APIs)
const ThutoChat = dynamic(
  () => import("@/components/thuto/ThutoChat"),
  { ssr: false }
);

const UbuntuOptIn = dynamic(
  () => import("@/components/ubuntu/UbuntuOptIn") as Promise<{ default: ComponentType<{ onOptIn: () => void }> }>,
  { ssr: false }
);

const BeautifulMoment = dynamic(
  () => import("@/components/thuto/BeautifulMoment"),
  { ssr: false }
);

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
  ubuntu_opt_in: boolean;
  joy_score?: number;
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
  const [showUbuntuOptIn, setShowUbuntuOptIn] = useState(false);
  const [todaySession, setTodaySession] = useState<ScheduleDay | null>(null);

  // Auth guard is handled by PlayerLayout — this just loads data
  useEffect(() => {
    Promise.all([
      api.get("/sessions?per_page=5").catch(() => null),
      api.get("/profile").catch(() => null),
      api.get("/training/schedule").catch(() => null),
    ])
      .then(async ([sessRes, profRes, schedRes]) => {
        if (sessRes) setSessions(sessRes.data?.data ?? sessRes.data ?? []);
        if (profRes) {
          const prof = profRes.data?.profile ?? profRes.data;
          setProfile(prof);
          const hasOnboarded = localStorage.getItem("thuto_onboarded") === "true";
          if (hasOnboarded && prof && !prof.ubuntu_opt_in) {
            setShowUbuntuOptIn(true);
          }
        }

        // Load today's training session (API or IndexedDB fallback)
        let schedData = schedRes?.data?.schedule ?? null;
        if (schedData) {
          await saveSchedule({ ...schedData, cached_at: Date.now() });
        } else {
          const cached = await getSchedule();
          schedData = cached;
        }
        if (schedData?.schedule_json?.days) {
          const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
          const dayData = schedData.schedule_json.days.find(
            (d: ScheduleDay) => d.day.toLowerCase() === today.toLowerCase()
          );
          if (dayData && !dayData.is_rest) setTodaySession(dayData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Sync any pitch sessions that completed while offline
  useEffect(() => {
    async function syncOfflineSessions() {
      try {
        const pending = await getPendingSessions();
        for (const s of pending) {
          try {
            await api.post("/training/sessions", {
              schedule_id: s.schedule_id,
              day_name: s.day_name,
              drills_completed: s.drills_completed,
              total_drills: s.total_drills,
              feeling: s.feeling,
              completed_at: s.completed_at,
            });
            await clearPendingSession(s.localId);
          } catch {
            // Still offline — leave in queue for next time
          }
        }
      } catch {
        // IndexedDB not available
      }
    }
    syncOfflineSessions();
  }, []);

  if (loading) return <PageSkeleton />;

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completed.length)
    : 0;

  const hubCards = [
    { icon: Dna,          title: "Player DNA",      subtitle: "Tell THUTO your real life",  href: "/player/dna",                bg: "bg-[#1a3a4a]",  gradient: "bg-gradient-to-br from-[#1a6b6b] to-[#0d2b3a]" },
    { icon: Users,        title: "Ubuntu",          subtitle: "Train together — vanhu pamwe", href: "/player/ubuntu",             bg: "bg-[#1a3a2a]",  gradient: "bg-gradient-to-br from-[#1a6b4a] to-[#0d2b1a]" },
    { icon: CalendarDays, title: "Training Plan",  subtitle: "THUTO 7-day schedule",       href: "/player/training",           bg: "bg-teal-800",   gradient: "bg-gradient-to-br from-teal-600 to-emerald-800" },
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
      {/* THUTO floating chat widget — bottom-right corner */}
      <ThutoChat />

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

        {/* Ubuntu opt-in — shown after THUTO onboarding, before first Ubuntu join */}
        {showUbuntuOptIn && (
          <div className="mb-6">
            <UbuntuOptIn onOptIn={() => setShowUbuntuOptIn(false)} />
          </div>
        )}

        {/* Beautiful Game Score */}
        {profile && (profile.joy_score ?? 0) > 0 && (
          <div className="mb-6 rounded-2xl border border-[#f0b429]/30 bg-gradient-to-br from-[#1a3a1a] to-[#0d2b0d] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]/80">
                  Your Beautiful Game Score
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#f0b429]">{profile.joy_score}</span>
                  <span className="text-sm text-white/50">/ 100</span>
                </div>
                <p className="mt-1 text-xs text-white/60">
                  {(profile.joy_score ?? 0) >= 50
                    ? "Exceptional joy for the game — scouts notice this energy"
                    : (profile.joy_score ?? 0) >= 25
                    ? "Your love for the game is growing — keep it up!"
                    : "Every session adds to your story — keep going!"}
                </p>
              </div>
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#f0b429]/10 text-2xl">
                ⚽
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f0b429] to-[#f5c542] transition-all duration-500"
                style={{ width: `${profile.joy_score ?? 0}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-white/30">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>
        )}

        {/* Beautiful Moment — memory archive */}
        <BeautifulMoment />

        {/* Today's Session — Pitch Mode entry card */}
        {todaySession && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#15803d] to-[#0d5c2d] p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                  Today&apos;s Session
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">{todaySession.focus}</h2>
                <p className="mt-0.5 text-sm text-white/70">
                  {todaySession.total_duration_minutes} min · {todaySession.drills?.length ?? 0} drills ·{" "}
                  <span className="capitalize">{todaySession.intensity}</span> intensity
                </p>
              </div>
              <Zap className="h-6 w-6 flex-shrink-0 text-[#f0b429]" />
            </div>
            <Link
              href="/player/pitch"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-[#15803d] transition-opacity hover:opacity-90 active:scale-95"
            >
              <Play className="h-4 w-4" /> Start on Pitch →
            </Link>
          </div>
        )}

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
