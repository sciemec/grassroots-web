"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, TrendingUp, Star, Loader2, Target } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
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

const SKILL_LABELS: Record<string, string> = {
  dribbling: "Dribbling", shooting: "Shooting", passing: "Passing",
  defending: "Defending", fitness: "Fitness", heading: "Heading",
  goalkeeping: "Goalkeeping", crossing: "Crossing",
};

export default function TalentIDPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiScoutReport, setAiScoutReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/sessions?per_page=100&status=completed")
      .then((res) => setSessions(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const completed = sessions.filter((s) => s.status === "completed" && s.overall_score !== null);

  // Calculate per-skill averages
  const skillMap: Record<string, number[]> = {};
  completed.forEach((s) => {
    if (!s.focus_area) return;
    skillMap[s.focus_area] = skillMap[s.focus_area] ?? [];
    skillMap[s.focus_area].push(s.overall_score ?? 0);
  });
  const skills = Object.entries(skillMap).map(([k, scores]) => ({
    skill: SKILL_LABELS[k] ?? k.charAt(0).toUpperCase() + k.slice(1),
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));

  // Overall TalentID score (average of all skills)
  const talentScore = skills.length
    ? Math.round(skills.reduce((s, k) => s + k.score, 0) / skills.length)
    : 0;

  // Grade
  const grade = talentScore >= 85 ? { label: "Elite", color: "text-yellow-500", bg: "bg-yellow-500/20" } :
    talentScore >= 70 ? { label: "Advanced", color: "text-green-500", bg: "bg-green-500/20" } :
    talentScore >= 55 ? { label: "Developing", color: "text-blue-500", bg: "bg-blue-500/20" } :
    { label: "Beginner", color: "text-muted-foreground", bg: "bg-muted" };

  // Score trend
  const trendData = completed.slice(-20).map((s, i) => ({
    s: i + 1,
    score: s.overall_score,
    date: new Date(s.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }),
  }));

  const generateScoutReport = async () => {
    setLoadingReport(true);
    const summary = skills.map((s) => `${s.skill}: ${s.score}%`).join(", ");
    try {
      const res = await api.post("/ai-coach/query", {
        message: `Generate an AI scouting report for a player with these skill averages: ${summary}. Overall TalentID: ${talentScore}% (${grade.label}). Format as a professional scouting report with: Player Grade, Key Strengths (3), Development Areas (2), Recommended Position(s), and Transfer Potential rating (1–10). Write in a formal scouting tone.`,
      });
      setAiScoutReport(res.data?.response ?? "");
    } catch { setAiScoutReport("Unable to generate scout report. Please try again."); }
    finally { setLoadingReport(false); }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Talent ID</h1>
            <p className="text-sm text-muted-foreground">Your AI-generated performance profile</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : completed.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete training sessions to build your Talent ID profile</p>
            <Link href="/player/sessions/new" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Start training
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* TalentID score card */}
            <div className="flex items-center gap-6 rounded-2xl border bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6">
              <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-yellow-500 bg-yellow-500/10">
                <div className="text-center">
                  <p className="text-3xl font-black text-yellow-600">{talentScore}</p>
                  <p className="text-xs text-yellow-600">TalentID</p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${grade.bg} ${grade.color}`}>{grade.label}</span>
                </div>
                <p className="mt-1 text-lg font-bold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{completed.length} sessions analysed · {skills.length} skills tracked</p>
                <button onClick={generateScoutReport} disabled={loadingReport}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                  {loadingReport ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Brain className="h-3.5 w-3.5" /> Generate Scout Report</>}
                </button>
              </div>
            </div>

            {/* Radar chart */}
            {skills.length >= 3 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 font-semibold">Skills Radar</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={skills}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                    <Radar dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Score trend */}
            {trendData.length >= 3 && (
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <h2 className="font-semibold">Performance Trend</h2>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="s" tick={{ fontSize: 10 }} label={{ value: "Session", position: "insideBottom", offset: -2, fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ""} formatter={(v) => [`${v}%`, "Score"]} />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Skill breakdown bars */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Skill Breakdown</h2>
              <div className="space-y-3">
                {skills.sort((a, b) => b.score - a.score).map(({ skill, score }) => (
                  <div key={skill}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{skill}</span>
                      <span className={`font-bold ${score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500"}`}>{score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scout report */}
            {aiScoutReport && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-purple-700">AI Scout Report</h3>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiScoutReport}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
