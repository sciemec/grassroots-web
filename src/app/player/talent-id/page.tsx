"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Brain, TrendingUp, Star, Loader2, Target,
  Zap, Shield, Activity, Users, BookOpen, ChevronRight, Share2,
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { searchOffline } from "@/lib/offline-ai";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  focus_area: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

// ─── 5-Dimension scoring (ported from Bhora AI TalentIdService) ───────────────
//
// Weights (match Bhora AI Section 28.2):
//   Physical Trajectory   30%
//   Movement Quality      25%
//   Training Commitment   20%
//   Match Performance     15%   (proxied as skill-area diversity)
//   Coachability Index    10%
//
// Relative age correction: players born Oct–Dec get +5% on physical scores.

const WEIGHTS = {
  physical_trajectory:  0.30,
  movement_quality:     0.25,
  training_commitment:  0.20,
  match_performance:    0.15,
  coachability:         0.10,
};

interface Dimensions {
  physical_trajectory:  number | null;
  movement_quality:     number | null;
  training_commitment:  number | null;
  match_performance:    number | null;
  coachability:         number | null;
}

function calcDimensions(sessions: Session[]): Dimensions {
  const completed = sessions.filter((s) => s.status === "completed" && s.overall_score !== null);

  // 1. Physical Trajectory — first-5 avg vs last-5 avg improvement rate
  let physicalTrajectory: number | null = null;
  if (completed.length >= 5) {
    const sorted = [...completed].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstAvg = sorted.slice(0, 5).reduce((s, x) => s + (x.overall_score ?? 0), 0) / 5;
    const lastAvg  = sorted.slice(-5).reduce((s, x) => s + (x.overall_score ?? 0), 0) / 5;
    const improvement = lastAvg - firstAvg; // +10 pts → 80, +20 pts → 100
    physicalTrajectory = Math.min(100, Math.max(0, ((improvement + 10) / 20) * 100));
  }

  // 2. Movement Quality — average overall score across all completed sessions
  const movementQuality = completed.length > 0
    ? completed.reduce((s, x) => s + (x.overall_score ?? 0), 0) / completed.length
    : null;

  // 3. Training Commitment — sessions completed (50 sessions = 100%)
  const trainingCommitment = Math.min(100, Math.max(0, ((completed.length - 5) / 45) * 100));

  // 4. Match Performance (proxied) — skill diversity: trained 8+ different areas = 100%
  const uniqueAreas = new Set(completed.map((s) => s.focus_area).filter(Boolean)).size;
  const matchPerformance = Math.min(100, (uniqueAreas / 8) * 100);

  // 5. Coachability Index — score consistency (low variance = high coachability)
  let coachability: number | null = null;
  if (completed.length >= 3) {
    const scores = completed.map((s) => s.overall_score ?? 0);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    // Low stdDev = consistent = high coachability. stdDev=0 → 100, stdDev=30 → 0
    coachability = Math.min(100, Math.max(0, 100 - (stdDev / 30) * 100));
  }

  return { physical_trajectory: physicalTrajectory, movement_quality: movementQuality, training_commitment: trainingCommitment, match_performance: matchPerformance, coachability };
}

function calcOverall(dims: Dimensions): number | null {
  const entries = Object.entries(WEIGHTS) as [keyof Dimensions, number][];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [key, weight] of entries) {
    const val = dims[key];
    if (val !== null) { weightedSum += val * weight; totalWeight += weight; }
  }
  if (totalWeight === 0) return null;
  return Math.round(weightedSum / totalWeight);
}

// ─── Skill labels ─────────────────────────────────────────────────────────────

const SKILL_LABELS: Record<string, string> = {
  dribbling: "Dribbling", shooting: "Shooting", passing: "Passing",
  defending: "Defending", fitness: "Fitness", heading: "Heading",
  goalkeeping: "Goalkeeping", crossing: "Crossing", tackling: "Tackling",
  control: "Ball Control", positioning: "Positioning",
};

// ─── Dimension config ─────────────────────────────────────────────────────────

const DIM_CONFIG = [
  { key: "physical_trajectory" as const,  label: "Physical Trajectory", icon: TrendingUp, color: "#22c55e", weight: "30%", desc: "Rate of improvement across sessions" },
  { key: "movement_quality" as const,     label: "Movement Quality",    icon: Activity,   color: "#3b82f6", weight: "25%", desc: "Average performance score quality" },
  { key: "training_commitment" as const,  label: "Training Commitment", icon: Target,     color: "#f59e0b", weight: "20%", desc: "Total sessions completed (max 50)" },
  { key: "match_performance" as const,    label: "Skill Diversity",     icon: Zap,        color: "#a855f7", weight: "15%", desc: "Range of skills trained (max 8 areas)" },
  { key: "coachability" as const,         label: "Coachability Index",  icon: Shield,     color: "#f97316", weight: "10%", desc: "Score consistency — lower variance = higher" },
];

// ─── Grade ────────────────────────────────────────────────────────────────────

function getGrade(score: number) {
  if (score >= 85) return { label: "Elite",      color: "text-yellow-400",  bg: "bg-yellow-500/20",  border: "border-yellow-500/40" };
  if (score >= 70) return { label: "Advanced",   color: "text-green-400",   bg: "bg-green-500/20",   border: "border-green-500/40" };
  if (score >= 55) return { label: "Developing", color: "text-blue-400",    bg: "bg-blue-500/20",    border: "border-blue-500/40" };
  return             { label: "Beginner",    color: "text-muted-foreground",bg: "bg-muted",          border: "border-muted" };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TalentIDPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiScoutReport, setAiScoutReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    // guests allowed — no login redirect
    api.get("/sessions?per_page=100&status=completed")
      .then((res) => setSessions(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  const completed = sessions.filter((s) => s.status === "completed" && s.overall_score !== null);

  // 5-dimension scores
  const dims = calcDimensions(sessions);
  const talentScore = calcOverall(dims) ?? 0;
  const grade = talentScore > 0 ? getGrade(talentScore) : null;

  // Per-skill averages for radar
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

  // Score trend (last 20 sessions)
  const trendData = completed.slice(-20).map((s, i) => ({
    s: i + 1,
    score: s.overall_score,
    date: new Date(s.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }),
  }));

  const generateScoutReport = async () => {
    setLoadingReport(true);
    const dimSummary = DIM_CONFIG
      .map((d) => `${d.label}: ${dims[d.key]?.toFixed(0) ?? "N/A"}% (${d.weight})`)
      .join(", ");
    const skillSummary = skills.map((s) => `${s.skill}: ${s.score}%`).join(", ");
    const prompt = `Generate a professional AI scouting report for a football player.\n\nTalentID Score: ${talentScore}/100 (${grade?.label ?? "Building"})\n\nDimension Scores:\n${dimSummary}\n\nSkill Averages:\n${skillSummary}\n\nFormat the report with:\n1. Player Grade & Summary\n2. Top 3 Strengths\n3. 2 Development Areas\n4. Recommended Position(s)\n5. Transfer Potential (1–10)\n\nWrite in formal scouting language. Keep it under 250 words.`;

    try {
      // Step 1 — Laravel backend
      try {
        const res = await api.post("/ask", { question: prompt, role: "coach", language: "english" });
        const reply = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
        if (reply) { setAiScoutReport(reply); return; }
      } catch { /* fall through */ }

      // Step 2 — Claude proxy
      try {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, system_prompt: "You are a professional football scout writing detailed, accurate player reports.", history: [] }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.response ?? data?.message ?? "";
          if (reply) { setAiScoutReport(reply); return; }
        }
      } catch { /* fall through */ }

      // Step 3 — Offline AI
      const offline = await searchOffline(`scout report ${skills.map((s) => s.skill).join(" ")}`);
      if (offline) {
        setAiScoutReport(`📊 TalentID Score: ${talentScore}/100 — ${grade?.label ?? "Building"}\n\n${offline.text}\n\n_Generated offline from knowledge base_`);
        return;
      }

      setAiScoutReport("Unable to generate scout report right now. Check your connection and try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const shareTalentID = async () => {
    const name = user?.name ?? "Athlete";
    const gradeLabel = grade?.label ?? "Building";
    const text = `🏆 My Grassroots Sport Pro TalentID Score: ${talentScore}/100 (${gradeLabel})\n\n${name} — powered by Bhora AI\n\nTrack your football progress at grassrootssports.live`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "My TalentID Score", text }); } catch { /* cancelled */ }
    } else {
      // Fallback: WhatsApp deep link
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };


  const isBuilding = completed.length < 10;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6 lg:pt-6 pt-20">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Player Profile</p>
            <h1 className="text-2xl font-bold text-white">Talent ID</h1>
            <p className="mt-0.5 text-sm italic text-accent/80">AI-powered 5-dimension performance profile</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : completed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
            <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-white">No training data yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete training sessions to build your Talent ID profile.<br />
              You need at least 10 sessions to unlock your full score.
            </p>
            <Link
              href="/player/sessions/new"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start training
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* TalentID score card */}
            <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-6">
              <div className="flex items-center gap-6">
                {/* Score circle */}
                <div className="flex-shrink-0">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-yellow-500/60 bg-yellow-500/10">
                    {isBuilding ? (
                      <div className="text-center">
                        <p className="text-2xl font-black text-yellow-500">—</p>
                        <p className="text-xs text-yellow-500/80">Building</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-4xl font-black text-yellow-400">{talentScore}</p>
                        <p className="text-xs font-semibold text-yellow-500/80">/ 100</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {grade ? (
                      <span className={`rounded-full px-3 py-1 text-sm font-bold border ${grade.bg} ${grade.color} ${grade.border}`}>
                        {grade.label}
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm font-bold text-white">
                        Building Profile
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-lg font-bold text-white">{user?.name?.split(" ")[0] ?? "Player"}</p>
                  <p className="text-sm text-muted-foreground">
                    {completed.length} sessions · {skills.length} skills · {new Set(completed.map((s) => s.focus_area)).size} training areas
                  </p>

                  {isBuilding && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-yellow-500 transition-all"
                          style={{ width: `${Math.min(100, (completed.length / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{completed.length}/10 sessions</span>
                    </div>
                  )}

                  {!isBuilding && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={generateScoutReport}
                        disabled={loadingReport}
                        className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                      >
                        {loadingReport
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                          : <><Brain className="h-3.5 w-3.5" /> Generate Scout Report</>}
                      </button>
                      <button
                        onClick={shareTalentID}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share Score
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5-Dimension breakdown */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                <h2 className="font-semibold text-white">5-Dimension Analysis</h2>
                <span className="ml-auto text-xs text-muted-foreground">Bhora AI scoring model</span>
              </div>
              <div className="space-y-3">
                {DIM_CONFIG.map(({ key, label, icon: Icon, color, weight, desc }) => {
                  const val = dims[key];
                  const pct = val !== null ? Math.round(val) : null;
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color }} />
                          <span className="text-sm font-medium text-white">{label}</span>
                          <span className="text-xs text-muted-foreground">({weight})</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: pct !== null ? color : undefined }}>
                          {pct !== null ? `${pct}%` : "—"}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        {pct !== null && (
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar chart */}
            {skills.length >= 3 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <h2 className="font-semibold text-white">Skills Radar</h2>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={skills}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }} />
                    <Radar dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Score trend */}
            {trendData.length >= 3 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <h2 className="font-semibold text-white">Performance Trend</h2>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="s" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} label={{ value: "Session", position: "insideBottom", offset: -2, fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a2332", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                      labelFormatter={(_, p) => p?.[0]?.payload?.date ?? ""}
                      formatter={(v) => [`${v}%`, "Score"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Skill breakdown bars */}
            {skills.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <h2 className="font-semibold text-white">Skill Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {skills.sort((a, b) => b.score - a.score).map(({ skill, score }) => (
                    <div key={skill}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-white">{skill}</span>
                        <span className={`font-bold ${score >= 75 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scout report */}
            {aiScoutReport && (
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-900/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <h3 className="font-semibold text-purple-300">AI Scout Report</h3>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{aiScoutReport}</div>
              </div>
            )}

            {/* Knowledge base CTA */}
            <Link
              href="/knowledge"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/60 px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Improve your weak areas</p>
                  <p className="text-xs text-muted-foreground">Browse drills & coaching knowledge →</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

          </div>
        )}
      </main>
    </div>
  );
}
