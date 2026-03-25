"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, Play, CheckCircle2, Brain, Loader2, TrendingUp,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";
import { calcBenchmarkScore } from "@/lib/skill-scoring";

// ── Test definitions ──────────────────────────────────────────────────────────

const POSITIONS_TESTS: Record<string, {
  label: string;
  tests: { name: string; desc: string; benchmark: string; unit: string }[];
}> = {
  goalkeeper: {
    label: "Goalkeeper",
    tests: [
      { name: "Reaction save",        desc: "Partner shoots from 7m. Record saves out of 10",          benchmark: "6",   unit: "saves/10" },
      { name: "Distribution accuracy",desc: "Throw accurately to target zones (10 throws)",             benchmark: "7",   unit: "accurate/10" },
      { name: "Dive reach (left)",    desc: "Measure max reach on a diving save left side",             benchmark: "2.3", unit: "metres" },
      { name: "Dive reach (right)",   desc: "Measure max reach on a diving save right side",            benchmark: "2.3", unit: "metres" },
    ],
  },
  defender: {
    label: "Defender",
    tests: [
      { name: "40m sprint",           desc: "Sprint 40m from standing start",                          benchmark: "5.2", unit: "seconds" },
      { name: "1v1 tackle success",   desc: "10 1v1 defending attempts vs attacker",                   benchmark: "6",   unit: "won/10" },
      { name: "Clearance distance",   desc: "Head or kick clearance from penalty area",                benchmark: "30",  unit: "metres" },
      { name: "Pass accuracy",        desc: "5m, 15m, 30m passes (10 each). Count accurate",          benchmark: "22",  unit: "accurate/30" },
    ],
  },
  midfielder: {
    label: "Midfielder",
    tests: [
      { name: "20m sprint",           desc: "Sprint 20m from standing start (acceleration)",           benchmark: "3.0", unit: "seconds" },
      { name: "Passing accuracy",     desc: "Pass to targets at 5m, 15m, 30m. 10 per distance",       benchmark: "24",  unit: "accurate/30" },
      { name: "Ball retention (1v1)", desc: "Keep the ball vs defender for 20 seconds, 5 attempts",   benchmark: "3",   unit: "retained/5" },
      { name: "Yo-Yo endurance",      desc: "Intermittent recovery test — record level reached",       benchmark: "14",  unit: "level" },
    ],
  },
  forward: {
    label: "Forward",
    tests: [
      { name: "10m sprint",           desc: "Pure acceleration over 10m",                              benchmark: "1.7", unit: "seconds" },
      { name: "Shooting accuracy",    desc: "Shoot from edge of box, 10 attempts (5 zones)",          benchmark: "5",   unit: "on target/10" },
      { name: "Dribble + finish",     desc: "Cone dribble 20m then finish. Time to goal",             benchmark: "8.5", unit: "seconds" },
      { name: "Aerial duel wins",     desc: "10 crosses from wide — win duel or score",               benchmark: "4",   unit: "won/10" },
    ],
  },
};

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 70) return "text-[#f0b429]";
  if (score >= 50) return "text-blue-400";
  return "text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Advanced";
  if (score >= 60) return "Developing";
  if (score >= 45) return "Beginner";
  return "Needs Work";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssessmentPage() {
  const { user } = useAuthStore();
  const [positionGroup, setPositionGroup] = useState("");
  const [started, setStarted]             = useState(false);
  const [results, setResults]             = useState<Record<string, string>>({});
  const [aiReport, setAiReport]           = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => { /* auth handled by layout.tsx */ }, [user]);

  const currentTests = positionGroup ? (POSITIONS_TESTS[positionGroup]?.tests ?? []) : [];
  const allFilled    = currentTests.length > 0 && currentTests.every((t) => results[t.name]?.trim());

  // Build radar data from benchmark scores
  const radarData = currentTests.map((t) => ({
    subject: t.name.length > 12 ? t.name.slice(0, 12) + "…" : t.name,
    score:   results[t.name] ? calcBenchmarkScore(t.benchmark, results[t.name], t.unit) : 0,
    fullMark: 100,
  }));

  const overallScore = radarData.length
    ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length)
    : 0;

  const getReport = async () => {
    setLoadingReport(true);
    const summary = currentTests
      .map((t) => `${t.name}: ${results[t.name]} ${t.unit} (benchmark: ${t.benchmark})`)
      .join(", ");
    try {
      const reply = await queryAI(
        `Position assessment results for ${positionGroup}: ${summary}.
Provide a brief analysis: overall rating out of 10, 2 key strengths, 2 areas to improve, and a 4-week training focus. Be specific and encouraging.`,
        "player",
      );
      setAiReport(reply);
    } catch {
      setAiReport("Unable to connect to AI Coach. Please check your connection and try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const compareToChampionship = (test: { benchmark: string; unit: string }, value: string): boolean => {
    const numVal   = parseFloat(value);
    const numBench = parseFloat(test.benchmark);
    if (isNaN(numVal) || isNaN(numBench)) return false;
    return test.unit === "seconds" ? numVal <= numBench : numVal >= numBench;
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Position Assessment</h1>
            <p className="text-sm text-muted-foreground">Benchmark yourself against Zimbabwe U17/Senior standards</p>
          </div>
        </div>

        {!started ? (
          /* ── Position selector ── */
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center backdrop-blur-sm">
              <Target className="mx-auto mb-4 h-12 w-12 text-[#f0b429]" />
              <h2 className="mb-2 text-xl font-bold text-white">Position Assessment Hub</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Run field tests with a partner and enter your results. AI will generate a performance report and skill radar.
              </p>
              <div className="mb-6">
                <label className="mb-3 block text-left text-sm font-semibold text-white">Select your position group</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(POSITIONS_TESTS).map(([id, { label }]) => (
                    <button
                      key={id}
                      onClick={() => setPositionGroup(id)}
                      className={`rounded-xl border p-4 text-sm font-medium transition-all ${
                        positionGroup === id
                          ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                          : "border-white/10 bg-white/5 text-white hover:border-white/20"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStarted(true)}
                disabled={!positionGroup}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] px-4 py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-50 transition-colors"
              >
                <Play className="h-4 w-4" /> Start Assessment
              </button>
            </div>
          </div>
        ) : (
          /* ── Test entry + results ── */
          <div className="mx-auto max-w-2xl">

            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold capitalize text-white">{positionGroup} Tests</h2>
              <button
                onClick={() => { setStarted(false); setResults({}); setAiReport(""); }}
                className="text-xs text-muted-foreground hover:text-white"
              >
                ← Change position
              </button>
            </div>

            <p className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              Run each test on the field with a partner. Enter your result — green means you met the Zimbabwe benchmark.
            </p>

            {/* ── Test cards ── */}
            <div className="mb-6 space-y-4">
              {currentTests.map((test) => {
                const val    = results[test.name] ?? "";
                const passed = val ? compareToChampionship(test, val) : null;
                const pct    = val ? calcBenchmarkScore(test.benchmark, val, test.unit) : null;
                return (
                  <div
                    key={test.name}
                    className={`rounded-xl border p-5 transition-all ${
                      passed === true  ? "border-green-500/40 bg-green-500/5" :
                      passed === false ? "border-red-500/30 bg-red-500/5"    : "border-white/10 bg-card/60"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold text-white">{test.name}</h3>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-muted-foreground">
                        Benchmark: {test.benchmark}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{test.desc}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={`Enter result (${test.unit})`}
                        value={val}
                        onChange={(e) => setResults((r) => ({ ...r, [test.name]: e.target.value }))}
                        className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-[#f0b429]"
                      />
                      <span className="text-xs text-muted-foreground">{test.unit}</span>
                      {pct !== null && (
                        <span className={`text-sm font-bold ${scoreColor(pct)}`}>{pct}%</span>
                      )}
                      {passed === true && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Skill Radar (shown as soon as any result is entered) ── */}
            {radarData.some((d) => d.score > 0) && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#f0b429]" />
                    <h3 className="font-semibold text-white">Skill Radar</h3>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black ${scoreColor(overallScore)}`}>
                      {overallScore}
                    </p>
                    <p className={`text-xs font-medium ${scoreColor(overallScore)}`}>
                      {scoreLabel(overallScore)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#c8edd0", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#f0b429"
                      fill="#f0b429"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  % of Zimbabwe benchmark achieved per test
                </p>
              </div>
            )}

            {/* ── AI Report button ── */}
            {allFilled && !aiReport && (
              <button
                onClick={getReport}
                disabled={loadingReport}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6c3483] px-4 py-3 text-sm font-bold text-white hover:bg-[#6c3483]/80 disabled:opacity-50 transition-colors"
              >
                {loadingReport ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating AI report…</>
                ) : (
                  <><Brain className="h-4 w-4" /> Get AI performance report</>
                )}
              </button>
            )}

            {/* ── AI Report display ── */}
            {aiReport && (
              <div className="rounded-xl border border-[#6c3483]/40 bg-[#6c3483]/10 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#a855f7]" />
                  <h3 className="font-semibold text-[#a855f7]">AI Performance Report</h3>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-white">
                  {aiReport}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
