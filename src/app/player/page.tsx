"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell, Brain, Trophy, ChevronRight, Play, Flame, Target, TrendingUp, Star,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
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
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "player" && user.role !== "admin") { router.push("/dashboard"); return; }

    Promise.all([
      api.get("/sessions?per_page=5"),
      api.get("/profile").catch(() => null),
    ])
      .then(([sessRes, profRes]) => {
        setSessions(sessRes.data?.data ?? sessRes.data ?? []);
        if (profRes) setProfile(profRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user || loading) return <PageSkeleton />;

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completed.length)
    : 0;

  const quickActions = [
    { icon: Play,    label: "Start Session", href: "/player/sessions/new", bg: "bg-green-500",  hover: "hover:bg-green-400" },
    { icon: Brain,   label: "Ask AI Coach",  href: "/player/ai-coach",     bg: "bg-purple-500", hover: "hover:bg-purple-400" },
    { icon: Dumbbell,label: "Drill Library", href: "/player/drills",       bg: "bg-blue-500",   hover: "hover:bg-blue-400" },
    { icon: Trophy,  label: "Milestones",    href: "/player/milestones",   bg: "bg-amber-500",  hover: "hover:bg-amber-400" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-balance text-2xl font-bold">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.position
              ? `${profile.position} · ${profile.province ?? ""} · ${profile.age_group?.toUpperCase() ?? ""}`
              : "Complete your profile to get discovered by scouts"}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Flame,     label: "Sessions completed", value: completed.length, color: "text-orange-500" },
            { icon: Star,      label: "Avg score",          value: `${avgScore}%`,   color: "text-yellow-500" },
            { icon: Target,    label: "Total sessions",     value: sessions.length,  color: "text-blue-500" },
            { icon: TrendingUp,label: "Scout visible",      value: profile?.scout_visible ? "Yes" : "No", color: "text-green-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* AI Coach banner */}
        <div className="mb-8 rounded-2xl border bg-gradient-to-r from-purple-950/60 to-green-950/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 flex-shrink-0 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">AI Coach — Claude</span>
              </div>
              <h3 className="mb-1 text-balance text-lg font-bold text-white">
                What do you want to improve today?
              </h3>
              <p className="text-sm leading-relaxed text-green-300">
                Technique, training plans, nutrition, or anything about your game.
                Supports English and Shona.
              </p>
            </div>
            <Link
              href="/player/ai-coach"
              className="flex-shrink-0 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-400 active:scale-95"
            >
              Open Chat
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ icon: Icon, label, href, bg, hover }) => (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center gap-3 rounded-xl p-5 text-center text-sm font-semibold text-white transition-all active:scale-95 ${bg} ${hover}`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent sessions
            </h2>
            <Link
              href="/player/sessions"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No sessions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start your first training session to track progress
              </p>
              <Link
                href="/player/sessions/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{session.focus_area}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString("en-ZW", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.overall_score !== null && (
                      <span className="text-sm font-bold">{session.overall_score}%</span>
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
