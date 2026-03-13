"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Star } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
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

export default function ProgressPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/sessions?per_page=50")
      .then((res) => setSessions(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const completed = sessions.filter((s) => s.status === "completed" && s.overall_score !== null);

  // Score trend over time
  const trendData = completed.slice(-12).map((s, i) => ({
    label: `S${i + 1}`,
    score: s.overall_score,
    date: new Date(s.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }),
  }));

  // Sessions per focus area
  const focusCounts: Record<string, { count: number; totalScore: number }> = {};
  completed.forEach((s) => {
    if (!s.focus_area) return;
    const k = s.focus_area;
    focusCounts[k] = focusCounts[k] ?? { count: 0, totalScore: 0 };
    focusCounts[k].count += 1;
    focusCounts[k].totalScore += s.overall_score ?? 0;
  });
  const focusData = Object.entries(focusCounts).map(([name, { count, totalScore }]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    sessions: count,
    avgScore: count > 0 ? Math.round(totalScore / count) : 0,
  })).sort((a, b) => b.sessions - a.sessions).slice(0, 6);

  // Radar skills breakdown
  const radarData = [
    "dribbling", "shooting", "passing", "defending", "fitness", "heading"
  ].map((skill) => {
    const entries = completed.filter((s) => s.focus_area === skill);
    const avg = entries.length ? Math.round(entries.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / entries.length) : 20;
    return { skill: skill.charAt(0).toUpperCase() + skill.slice(1), score: avg };
  });

  const totalSessions = sessions.length;
  const completedCount = completed.length;
  const avgScore = completedCount ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / completedCount) : 0;
  const bestScore = completedCount ? Math.max(...completed.map((s) => s.overall_score ?? 0)) : 0;

  // Sessions by week (last 8 weeks)
  const weeklyData = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = sessions.filter((s) => {
      const d = new Date(s.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    return { week: `W${i + 1}`, sessions: count };
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">My Progress</h1>
            <p className="text-sm text-muted-foreground">Your development journey</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total sessions", value: totalSessions, icon: Calendar, color: "text-blue-500" },
            { label: "Completed", value: completedCount, icon: TrendingUp, color: "text-green-500" },
            { label: "Avg score", value: `${avgScore}%`, icon: Star, color: "text-yellow-500" },
            { label: "Best score", value: `${bestScore}%`, icon: Star, color: "text-orange-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : completed.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No performance data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete training sessions to see your progress charts</p>
            <Link href="/player/sessions/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Start a session
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score trend */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Score Trend (last 12 sessions)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                    formatter={(v) => [`${v}%`, "Score"]}
                  />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly sessions */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Weekly Training Volume</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v, "Sessions"]} />
                  <Bar dataKey="sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skills radar + focus areas */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 font-semibold">Skills Radar</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 font-semibold">Focus Area Breakdown</h2>
                <div className="space-y-3">
                  {focusData.map(({ name, sessions: cnt, avgScore: avg }) => (
                    <div key={name}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">{cnt} sessions · {avg}% avg</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${avg}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
