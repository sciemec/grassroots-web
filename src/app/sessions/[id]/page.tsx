"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Dumbbell, CheckCircle2, Clock, Brain, TrendingUp,
  AlertTriangle, Loader2, Star,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface DrillSet {
  id: string;
  drill: { name: string; category: string; difficulty: string } | null;
  reps: number | null;
  duration_seconds: number | null;
  score: number | null;
  created_at: string;
}

interface CoachingReport {
  summary: string;
  strengths: string[];
  improvements: string[];
  generated_at: string;
}

interface SessionDetail {
  id: string;
  user: { name?: string; email: string };
  session_type: string;
  focus_area: string;
  overall_score: number | null;
  status: string;
  created_offline: boolean;
  created_at: string;
  completed_at: string | null;
  drill_sets: DrillSet[];
  coaching_report: CoachingReport | null;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/15 text-green-700",
  active:    "bg-blue-500/15 text-blue-700",
  aborted:   "bg-muted text-muted-foreground",
};

const diffColor: Record<string, string> = {
  beginner:     "bg-green-500/20 text-green-700",
  intermediate: "bg-yellow-500/20 text-yellow-700",
  advanced:     "bg-red-500/20 text-red-700",
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const pct   = Math.min(100, Math.max(0, score));
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="55" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="currentColor">
          {score}
        </text>
        <text x="55" y="67" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
          / 100
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">Overall score</p>
    </div>
  );
}

function DrillSetCard({ ds, index }: { ds: DrillSet; index: number }) {
  const score = ds.score ?? 0;
  const scoreColor = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const barColor   = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium">{ds.drill?.name ?? "Unnamed drill"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {ds.drill?.category && (
                <span className="text-xs capitalize text-muted-foreground">{ds.drill.category}</span>
              )}
              {ds.drill?.difficulty && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${diffColor[ds.drill.difficulty] ?? "bg-muted text-muted-foreground"}`}>
                  {ds.drill.difficulty}
                </span>
              )}
              {ds.reps && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> {ds.reps} reps
                </span>
              )}
              {ds.duration_seconds && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {ds.duration_seconds}s
                </span>
              )}
            </div>
          </div>
        </div>
        {ds.score !== null && (
          <span className={`flex-shrink-0 text-lg font-bold ${scoreColor}`}>{ds.score}%</span>
        )}
      </div>
      {ds.score !== null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get(`/sessions/${id}`)
      .then((res) => setSession(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router, id]);

  const generateAiReport = async () => {
    if (!session) return;
    setLoadingAi(true);
    const drillSummary = session.drill_sets
      .map((ds) => `${ds.drill?.name ?? "drill"}: ${ds.score ?? "no score"}%`)
      .join(", ");
    try {
      const res = await api.post("/ai-coach/query", {
        message: `Session analysis: Focus area: ${session.focus_area}, Overall score: ${session.overall_score ?? "N/A"}%. Drill breakdown: ${drillSummary || "no drills recorded"}. Provide: 1) Brief performance summary, 2) Top strength from this session, 3) One specific improvement tip. Keep it concise and encouraging.`,
      });
      setAiReport(res.data?.response ?? "");
    } catch { setAiReport("Unable to generate analysis. Try again."); }
    finally { setLoadingAi(false); }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
              <div className="lg:col-span-2 h-48 animate-pulse rounded-xl bg-muted" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Session not found</p>
            <Link href="/player/sessions" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Back to sessions
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const drillsWithScore = session.drill_sets.filter((ds) => ds.score !== null);
  const duration = session.completed_at && session.created_at
    ? Math.round((new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 60000)
    : null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-balance text-2xl font-bold capitalize">{session.focus_area} Session</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(session.created_at).toLocaleDateString("en-ZW", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${STATUS_STYLES[session.status] ?? "bg-muted text-muted-foreground"}`}>
            {session.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left: score + meta */}
          <div className="space-y-4">

            {/* Score card */}
            <div className="rounded-xl border bg-card p-5 text-center">
              {session.overall_score !== null ? (
                <ScoreGauge score={session.overall_score} />
              ) : (
                <div className="py-4">
                  <Dumbbell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No score recorded</p>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold">Session details</h2>
              <dl className="space-y-2 text-sm">
                {[
                  ["Type", session.session_type],
                  ["Focus", session.focus_area?.replace(/-/g, " ")],
                  ["Drills", `${session.drill_sets.length}`],
                  ...(duration !== null ? [["Duration", `${duration} min`]] : []),
                  ...(session.created_offline ? [["Source", "Offline sync"]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="capitalize text-muted-foreground">{label}</dt>
                    <dd className="font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* AI report */}
            {(session.coaching_report || aiReport) ? (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-purple-700">AI Coach Report</h3>
                </div>

                {session.coaching_report && (
                  <>
                    <p className="mb-3 text-sm leading-relaxed">{session.coaching_report.summary}</p>
                    {session.coaching_report.strengths?.length > 0 && (
                      <div className="mb-2">
                        <p className="mb-1 text-xs font-semibold text-green-700">Strengths</p>
                        {session.coaching_report.strengths.map((s, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" /> {s}
                          </p>
                        ))}
                      </div>
                    )}
                    {session.coaching_report.improvements?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-amber-700">To improve</p>
                        {session.coaching_report.improvements.map((s, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500" /> {s}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {aiReport && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
                )}
              </div>
            ) : session.status === "completed" && (
              <button
                onClick={generateAiReport}
                disabled={loadingAi}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
              >
                {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {loadingAi ? "Analysing…" : "Get AI analysis"}
              </button>
            )}
          </div>

          {/* Right: drills */}
          <div className="lg:col-span-2 space-y-4">

            {/* Drill score summary bar */}
            {drillsWithScore.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h2 className="font-semibold">Drill Performance</h2>
                </div>
                <div className="space-y-3">
                  {drillsWithScore.map((ds) => {
                    const s = ds.score!;
                    const barColor = s >= 75 ? "bg-green-500" : s >= 50 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div key={ds.id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium capitalize">{ds.drill?.name ?? "Drill"}</span>
                          <span className="font-bold">{s}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${s}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Drill set cards */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Drill Sets ({session.drill_sets.length})
              </h2>
              {session.drill_sets.length === 0 ? (
                <div className="rounded-xl border border-dashed p-10 text-center">
                  <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No drills were recorded in this session</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {session.drill_sets.map((ds, i) => (
                    <DrillSetCard key={ds.id} ds={ds} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
