"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Activity, Target, Trophy, TrendingUp, AlertTriangle,
  Brain, Loader2, Calendar, Shield, Dumbbell,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import type { SquadMember, TrainingSession } from "@/types";

const STATUS_BADGE: Record<string, string> = {
  fit:     "bg-green-500/15 text-green-700",
  injured: "bg-red-500/15 text-red-700",
  caution: "bg-amber-500/15 text-amber-700",
};

interface PlayerStats {
  overall_score: number;
  sessions_total: number;
  sessions_this_week: number;
  avg_score: number;
  top_skill: string;
  improvement_area: string;
  streak_days: number;
}

export default function CoachPlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const memberId = params?.id as string;

  const [member, setMember] = useState<SquadMember | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [aiReport, setAiReport] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      api.get(`/coach/squad/${memberId}`),
      api.get(`/coach/squad/${memberId}/sessions`).catch(() => ({ data: [] })),
      api.get(`/coach/squad/${memberId}/stats`).catch(() => ({ data: null })),
    ]).then(([memberRes, sessionsRes, statsRes]) => {
      setMember(memberRes.data?.data ?? memberRes.data);
      setSessions(sessionsRes.data?.data ?? sessionsRes.data ?? []);
      setStats(statsRes.data?.data ?? statsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, router, memberId]);

  const getAiReport = async () => {
    if (!member) return;
    setLoadingAi(true);
    setAiReport("");
    try {
      const reply = await queryAI(`Generate a player development report for ${member.player?.name}, position: ${member.position}, status: ${member.status}. Recent sessions: ${sessions.length}. Avg score: ${stats?.avg_score ?? "N/A"}. Top skill: ${stats?.top_skill ?? "N/A"}. Area to improve: ${stats?.improvement_area ?? "N/A"}. Provide: 1) Current form assessment, 2) Recommended training focus for next 2 weeks, 3) Tactical role suitability.`, "coach");
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report. Please try again."); }
    finally { setLoadingAi(false); }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach/squad" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Player Profile</h1>
            <p className="text-sm text-muted-foreground">Individual performance and development</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl border bg-muted/40 animate-pulse" />)}
          </div>
        ) : !member ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Player not found.</p>
            <Link href="/coach/squad" className="mt-4 inline-block text-sm text-primary hover:underline">Back to squad</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player card */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black">
                  {member.shirt_no}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{member.player?.name ?? "—"}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{member.position}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[member.status] ?? "bg-muted"}`}>
                      {member.status}
                    </span>
                    {member.player?.province && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{member.player.province}</span>
                    )}
                    {member.player?.age_group && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs uppercase">{member.player.age_group}</span>
                    )}
                  </div>
                  {member.status_note && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> {member.status_note}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/injury-tracker?player_id=${member.player_id}&position=${member.position}`}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Activity className="h-4 w-4 text-orange-500" /> Injury Risk
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Target,    label: "Overall Score",       value: `${stats.overall_score ?? "—"}%`, color: "text-primary" },
                  { icon: Dumbbell,  label: "Sessions Total",       value: stats.sessions_total,             color: "text-blue-500" },
                  { icon: TrendingUp,label: "Avg Session Score",    value: `${stats.avg_score ?? "—"}%`,    color: "text-green-600" },
                  { icon: Trophy,    label: "Training Streak",      value: `${stats.streak_days} days`,     color: "text-amber-500" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Skills insight */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-green-500/5 border-green-500/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-sm">Strongest Skill</h3>
                  </div>
                  <p className="text-lg font-bold capitalize">{stats.top_skill || "—"}</p>
                </div>
                <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-sm">Focus Area</h3>
                  </div>
                  <p className="text-lg font-bold capitalize">{stats.improvement_area || "—"}</p>
                </div>
              </div>
            )}

            {/* Recent sessions */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Recent Sessions
                </h2>
                <span className="text-xs text-muted-foreground">{sessions.length} total</span>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 8).map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">{s.focus_area}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.session_type} · {new Date(s.created_at).toLocaleDateString("en-ZW")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.overall_score != null && (
                          <span className={`text-sm font-bold ${s.overall_score >= 70 ? "text-green-600" : s.overall_score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                            {s.overall_score}%
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${s.status === "completed" ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {s.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* AI Development Report */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" /> AI Development Report
                </h2>
                <button
                  onClick={getAiReport}
                  disabled={loadingAi}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {aiReport ? "Regenerate" : "Generate Report"}
                </button>
              </div>
              {aiReport ? (
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate an AI-powered development report for {member.player?.name?.split(" ")[0] ?? "this player"} based on their training history and performance data.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
