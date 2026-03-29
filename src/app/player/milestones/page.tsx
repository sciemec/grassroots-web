"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, CheckCircle2, Circle, ArrowLeft, TrendingUp, Star } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: string;
  xp_reward: number;
  achieved_at: string | null;
  progress: number;
  target: number;
}

interface Programme {
  current_phase: string;
  phase_label: string;
  overall_progress: number;
  weeks_completed: number;
  total_weeks: number;
  next_milestone: string | null;
}

export default function MilestonesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "achieved" | "pending">("all");

  useEffect(() => {
    // guests allowed — no login redirect
    Promise.all([
      api.get("/milestones"),
      api.get("/milestones/programme").catch(() => null),
    ])
      .then(([msRes, progRes]) => {
        setMilestones(msRes.data?.data ?? msRes.data ?? []);
        if (progRes) setProgramme(progRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const achieved = milestones.filter((m) => m.achieved_at);
  const pending = milestones.filter((m) => !m.achieved_at);
  const displayed = tab === "achieved" ? achieved : tab === "pending" ? pending : milestones;
  const totalXP = achieved.reduce((sum, m) => sum + (m.xp_reward ?? 0), 0);


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Milestones</h1>
            <p className="text-sm text-muted-foreground">Track your development journey</p>
          </div>
        </div>

        {/* XP + stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5 text-center">
            <Star className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{totalXP}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">{achieved.length}</p>
            <p className="text-xs text-muted-foreground">Achieved</p>
          </div>
          <div className="rounded-xl border bg-card p-5 text-center">
            <Trophy className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{milestones.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        {/* Programme progress */}
        {programme && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Development Programme</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                {programme.phase_label ?? programme.current_phase}
              </span>
            </div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Week {programme.weeks_completed} of {programme.total_weeks}</span>
              <span>{programme.overall_progress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${programme.overall_progress}%` }}
              />
            </div>
            {programme.next_milestone && (
              <p className="mt-2 text-xs text-muted-foreground">
                Next: <span className="font-medium text-foreground">{programme.next_milestone}</span>
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border bg-muted p-1">
          {(["all", "achieved", "pending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {t} {t === "achieved" ? `(${achieved.length})` : t === "pending" ? `(${pending.length})` : `(${milestones.length})`}
            </button>
          ))}
        </div>

        {/* Milestones list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No milestones here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete more training sessions to unlock milestones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((m) => {
              const pct = m.target > 0 ? Math.min(100, Math.round((m.progress / m.target) * 100)) : 0;
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 transition-all ${m.achieved_at ? "bg-green-500/5 border-green-500/20" : "bg-card"}`}
                >
                  <div className="flex items-start gap-3">
                    {m.achieved_at ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${m.achieved_at ? "text-green-700" : ""}`}>{m.title}</p>
                        <span className="flex-shrink-0 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-700">
                          +{m.xp_reward} XP
                        </span>
                      </div>
                      {m.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                      )}
                      {!m.achieved_at && m.target > 0 && (
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{m.progress} / {m.target}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      {m.achieved_at && (
                        <p className="mt-1 text-xs text-green-600">
                          Achieved {new Date(m.achieved_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
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
