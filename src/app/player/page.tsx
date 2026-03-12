"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell, Brain, Trophy, Star, ChevronRight, Play, Flame, Target, TrendingUp,
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

export default function PlayerHubPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "player") { router.push("/dashboard"); return; }

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

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completedSessions.length)
    : 0;

  const quickActions = [
    { icon: Play, label: "Start Session", href: "/player/sessions/new", color: "bg-green-500 text-white" },
    { icon: Brain, label: "Ask AI Coach", href: "/player/ai-coach", color: "bg-purple-500 text-white" },
    { icon: Dumbbell, label: "Drill Library", href: "/player/drills", color: "bg-blue-500 text-white" },
    { icon: Trophy, label: "Milestones", href: "/player/milestones", color: "bg-yellow-500 text-white" },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.position
              ? `${profile.position} · ${profile?.province ?? ""} · ${profile?.age_group?.toUpperCase() ?? ""}`
              : "Complete your profile to get discovered by scouts"}
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Flame, label: "Sessions this week", value: completedSessions.length, color: "text-orange-500" },
            { icon: Star, label: "Avg score", value: `${avgScore}%`, color: "text-yellow-500" },
            { icon: Target, label: "Total sessions", value: sessions.length, color: "text-blue-500" },
            { icon: TrendingUp, label: "Scout visible", value: profile?.scout_visible ? "Yes" : "No", color: "text-green-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* AI Coach teaser */}
        <div className="mb-8 rounded-2xl border bg-gradient-to-r from-purple-950/60 to-green-950/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">AI Coach — Claude</span>
              </div>
              <h3 className="mb-1 text-lg font-bold text-white">
                What do you want to improve today?
              </h3>
              <p className="text-sm text-green-300">
                Ask about technique, training plans, nutrition, or anything about your game.
                Supports English and Shona.
              </p>
            </div>
            <Link
              href="/player/ai-coach"
              className="ml-4 flex-shrink-0 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition-colors"
            >
              Open Chat
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ icon: Icon, label, href, color }) => (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center gap-3 rounded-xl p-5 text-center font-medium text-sm transition-opacity hover:opacity-90 ${color}`}
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
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent sessions</h2>
            <Link href="/player/sessions" className="flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No sessions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Start your first training session to track progress</p>
              <Link
                href="/player/sessions/new"
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Start session <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium capitalize">{session.focus_area}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.overall_score !== null && (
                      <span className="text-sm font-bold">{session.overall_score}%</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      session.status === "completed"
                        ? "bg-green-500/20 text-green-600"
                        : session.status === "active"
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
