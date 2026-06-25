"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, Play, CheckCircle2, Brain, Loader2, TrendingUp,
  Activity, ChevronRight, Star, Zap, Scan, AlertCircle, Trophy,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";
import { calcBenchmarkScore } from "@/lib/skill-scoring";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";
import { FIELD_META_LABELS } from "@/config/sports";

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

// ── APK session types ─────────────────────────────────────────────────────────

interface TrainingSession {
  id: string;
  status: string;
  overall_score: number | null;
  created_at: string;
  focus_area?: string;
}

interface DrillSet {
  drill_name?: string;
  form_score?: number | null;
  rep_count?: number | null;
}

interface CoachingReport {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  drill_tips?: string[];
  shona_message?: string;
}

interface SessionReport {
  session?: { id: string; overall_score: number | null };
  coaching_report?: CoachingReport;
  drill_sets?: DrillSet[];
}

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

interface BiometricScan {
  mode: string;
  mode_label: string;
  score: number;
  level: "Elite" | "Good" | "Raw";
  asymmetry_score: number;
  asymmetry_diff: number;
  weak_side: string | null;
  frames_analysed: number;
  session_date: string;
}

// ── Match stat types ──────────────────────────────────────────────────────────

interface MatchStat {
  id: string;
  sport: string;
  role?: string;
  match_type?: string;
  match_date?: string;
  opponent?: string;
  result?: string;
  score?: string;
  competition?: string;
  stats: Record<string, number | string>;
  created_at: string;
}

const RESULT_COLOR: Record<string, string> = {
  W: "#22c55e",
  D: "#f0b429",
  L: "#ef4444",
};

const RESULT_LABEL: Record<string, string> = {
  W: "Win",
  D: "Draw",
  L: "Loss",
};

const BIOMETRIC_LEVEL_COLOR: Record<string, string> = {
  Elite: "#22c55e",
  Good:  "#f0b429",
  Raw:   "#ef4444",
};

export default function AssessmentPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"field" | "apk" | "biometric" | "stats">("field");

  // Field tests state
  const [positionGroup, setPositionGroup] = useState("");
  const [started, setStarted]             = useState(false);
  const [results, setResults]             = useState<Record<string, string>>({});
  const [aiReport, setAiReport]           = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  // Biometric scan history from localStorage
  const [bioScans, setBioScans] = useState<BiometricScan[]>([]);

  // Match stats state
  const [matchStats, setMatchStats]             = useState<MatchStat[]>([]);
  const [matchStatsLoading, setMatchStatsLoading] = useState(false);
  const [expandedStatId, setExpandedStatId]     = useState<string | null>(null);

  // APK sessions state
  const [sessions, setSessions]         = useState<TrainingSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [sessionReport, setSessionReport]     = useState<SessionReport | null>(null);
  const [reportLoading, setReportLoading]     = useState(false);

  useEffect(() => { /* auth handled by layout.tsx */ }, [user]);

  // Load biometric scans from localStorage when tab switches
  useEffect(() => {
    if (activeTab !== "biometric") return;
    try {
      const raw = JSON.parse(localStorage.getItem("gs_biometric_scans") || "[]");
      setBioScans(Array.isArray(raw) ? raw : []);
    } catch {
      setBioScans([]);
    }
  }, [activeTab]);

  // Load match stats when tab switches to "stats"
  useEffect(() => {
    if (activeTab !== "stats" || matchStats.length > 0) return;
    setMatchStatsLoading(true);
    api.get("/player/stats")
      .then((res) => {
        setMatchStats(safeArray<MatchStat>(res.data));
      })
      .catch(() => {})
      .finally(() => setMatchStatsLoading(false));
  }, [activeTab, matchStats.length]);

  // Load APK sessions when tab switches to "apk"
  useEffect(() => {
    if (activeTab !== "apk" || sessions.length > 0) return;
    setSessionsLoading(true);
    api.get("/training/sessions")
      .then((res) => {
        setSessions(safeArray<TrainingSession>(res.data));
      })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [activeTab, sessions.length]);

  // Load individual session report
  const loadReport = async (session: TrainingSession) => {
    setSelectedSession(session);
    setSessionReport(null);
    setReportLoading(true);
    try {
      const res = await api.get(`/sessions/${session.id}/report`);
      const data = res.data?.data ?? res.data ?? {};
      setSessionReport(data as SessionReport);
    } catch {
      setSessionReport({});
    } finally {
      setReportLoading(false);
    }
  };

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
            <ArrowLeft className="h-4 w-4" style={{ color: "#f0b429" }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f0b429" }}>Assessment</h1>
            <p className="text-sm font-bold text-white">Field tests + APK biomechanics coaching reports</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-1">
          <button
            onClick={() => setActiveTab("field")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "field"
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-[#f0b429]/70 hover:text-[#f0b429]"
            }`}
          >
            <Target className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            Field Tests
          </button>
          <button
            onClick={() => setActiveTab("apk")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "apk"
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-[#f0b429]/70 hover:text-[#f0b429]"
            }`}
          >
            <Activity className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            APK Sessions
          </button>
          <button
            onClick={() => setActiveTab("biometric")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "biometric"
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-[#f0b429]/70 hover:text-[#f0b429]"
            }`}
          >
            <Scan className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            Biometric
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "stats"
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-[#f0b429]/70 hover:text-[#f0b429]"
            }`}
          >
            <Trophy className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            Match Stats
          </button>
        </div>

        {/* ── FIELD TESTS TAB ── */}
        {activeTab === "field" && (
          !started ? (
            <div className="mx-auto max-w-lg">
              <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-8 text-center backdrop-blur-sm">
                <Target className="mx-auto mb-4 h-12 w-12 text-[#f0b429]" />
                <h2 className="mb-2 text-xl font-bold" style={{ color: "#f0b429" }}>Position Assessment Hub</h2>
                <p className="mb-6 text-sm font-bold text-white">
                  Run field tests with a partner and enter your results. AI will generate a performance report and skill radar.
                </p>
                <div className="mb-6">
                  <label className="mb-3 block text-left text-sm font-semibold" style={{ color: "#f0b429" }}>Select your position group</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(POSITIONS_TESTS).map(([id, { label }]) => (
                      <button
                        key={id}
                        onClick={() => setPositionGroup(id)}
                        className={`rounded-xl border p-4 text-sm font-medium transition-all ${
                          positionGroup === id
                            ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                            : "border-[#f0b429]/15 bg-[#f0b429]/5 text-[#f0b429]/70 hover:border-[#f0b429]/20"
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
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold capitalize" style={{ color: "#f0b429" }}>{positionGroup} Tests</h2>
                <button
                  onClick={() => { setStarted(false); setResults({}); setAiReport(""); }}
                  className="text-xs text-muted-foreground hover:text-[#f0b429]"
                >
                  ← Change position
                </button>
              </div>

              <p className="mb-5 rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 px-4 py-3 text-sm font-bold text-white">
                Run each test on the field with a partner. Enter your result — green means you met the Zimbabwe benchmark.
              </p>

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
                        passed === false ? "border-red-500/30 bg-red-500/5"    : "border-[#f0b429]/15 bg-card/60"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-[#f0b429]">{test.name}</h3>
                        <span className="rounded-full bg-[#f0b429]/10 px-2.5 py-0.5 text-xs font-bold text-white">
                          Benchmark: {test.benchmark}
                        </span>
                      </div>
                      <p className="mb-3 text-sm font-bold text-white">{test.desc}</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={`Enter result (${test.unit})`}
                          value={val}
                          onChange={(e) => setResults((r) => ({ ...r, [test.name]: e.target.value }))}
                          className="flex-1 rounded-lg border border-[#f0b429]/15 bg-black/20 px-3 py-2 text-sm text-[#f0b429] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-[#f0b429]"
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

              {radarData.some((d) => d.score > 0) && (
                <div className="mb-6 rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#f0b429]" />
                      <h3 className="font-semibold" style={{ color: "#f0b429" }}>Skill Radar</h3>
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
                      <PolarGrid stroke="rgba(240,180,41,0.15)" />
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
                  <p className="mt-2 text-center text-xs font-bold text-white">
                    % of Zimbabwe benchmark achieved per test
                  </p>
                </div>
              )}

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

              {aiReport && (
                <div className="rounded-xl border border-[#6c3483]/40 bg-[#6c3483]/10 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-[#a855f7]" />
                    <h3 className="font-semibold text-[#a855f7]">AI Performance Report</h3>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#f0b429]/85">
                    {aiReport}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── APK SESSIONS TAB ── */}
        {activeTab === "apk" && (
          <div className="mx-auto max-w-2xl">
            {!selectedSession ? (
              <>
                <div className="mb-4 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
                  <p className="text-xs font-bold text-white">
                    These are your real training sessions recorded in the GrassRoots APK. Each session includes biomechanics analysis from your phone camera.
                  </p>
                </div>

                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-8 text-center">
                    <Activity className="mx-auto mb-3 h-10 w-10 text-[#f0b429]/45" />
                    <p className="text-white font-bold text-sm">No APK sessions found yet.</p>
                    <p className="mt-1 text-xs font-bold text-white">
                      Complete a training session in the GrassRoots mobile app to see your coaching reports here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => loadReport(session)}
                        className="w-full flex items-center justify-between rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-4 text-left hover:bg-[#f0b429]/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            session.status === "completed" ? "bg-green-500/20" : "bg-[#f0b429]/10"
                          }`}>
                            {session.status === "completed"
                              ? <CheckCircle2 className="h-5 w-5 text-green-400" />
                              : <Activity className="h-5 w-5 text-[#f0b429]/55" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#f0b429]">
                              {session.focus_area ?? "Training Session"}
                            </p>
                            <p className="text-xs text-[#f0b429]/70">
                              {new Date(session.created_at).toLocaleDateString("en-ZW", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.overall_score !== null && session.overall_score !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-[#f0b429]" />
                              <span className={`text-sm font-bold ${scoreColor(session.overall_score)}`}>
                                {session.overall_score}
                              </span>
                            </div>
                          )}
                          <ChevronRight className="h-4 w-4 text-[#f0b429]/45" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Session report detail */
              <div>
                <button
                  onClick={() => { setSelectedSession(null); setSessionReport(null); }}
                  className="mb-4 flex items-center gap-2 text-sm text-[#f0b429]/70 hover:text-[#f0b429] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to sessions
                </button>

                <div className="mb-4 rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 px-4 py-3">
                  <p className="text-xs text-[#f0b429]/70">
                    {new Date(selectedSession.created_at).toLocaleDateString("en-ZW", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })}
                  </p>
                  <p className="mt-1 text-lg font-bold" style={{ color: "#f0b429" }}>
                    {selectedSession.focus_area ?? "Training Session"}
                  </p>
                  {selectedSession.overall_score !== null && selectedSession.overall_score !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-2xl font-black ${scoreColor(selectedSession.overall_score)}`}>
                        {selectedSession.overall_score}
                      </span>
                      <span className="text-sm text-[#f0b429]/55">/ 100</span>
                      <span className={`text-xs font-medium ${scoreColor(selectedSession.overall_score)}`}>
                        — {scoreLabel(selectedSession.overall_score)}
                      </span>
                    </div>
                  )}
                </div>

                {reportLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
                  </div>
                ) : sessionReport ? (
                  <div className="space-y-4">

                    {/* Coaching summary */}
                    {sessionReport.coaching_report?.summary && (
                      <div className="rounded-xl border border-[#6c3483]/40 bg-[#6c3483]/10 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-[#a855f7]" />
                          <h3 className="text-sm font-semibold text-[#a855f7]">THUTO Coaching Report</h3>
                        </div>
                        <p className="text-sm text-[#f0b429]/85 leading-relaxed">
                          {sessionReport.coaching_report.summary}
                        </p>
                      </div>
                    )}

                    {/* Shona message */}
                    {sessionReport.coaching_report?.shona_message && (
                      <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
                        <p className="text-sm text-[#f0b429] font-medium italic">
                          &ldquo;{sessionReport.coaching_report.shona_message}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Strengths + Improvements row */}
                    {(sessionReport.coaching_report?.strengths?.length ?? 0) > 0 ||
                     (sessionReport.coaching_report?.improvements?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(sessionReport.coaching_report?.strengths?.length ?? 0) > 0 && (
                          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-400">
                              Strengths
                            </p>
                            <ul className="space-y-1">
                              {sessionReport.coaching_report!.strengths!.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[#f0b429]/85">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(sessionReport.coaching_report?.improvements?.length ?? 0) > 0 && (
                          <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#f0b429]">
                              Areas to Improve
                            </p>
                            <ul className="space-y-1">
                              {sessionReport.coaching_report!.improvements!.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[#f0b429]/85">
                                  <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#f0b429]" />
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Drill tips */}
                    {(sessionReport.coaching_report?.drill_tips?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
                          Drill Tips
                        </p>
                        <ul className="space-y-1">
                          {sessionReport.coaching_report!.drill_tips!.map((tip, i) => (
                            <li key={i} className="text-sm text-[#f0b429]/85">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Per-drill form scores */}
                    {(sessionReport.drill_sets?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#f0b429]/70">
                          Drill Breakdown
                        </p>
                        <div className="space-y-3">
                          {sessionReport.drill_sets!.map((ds, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm text-[#f0b429]">
                                  {ds.drill_name ?? `Drill ${i + 1}`}
                                </p>
                                {ds.rep_count !== null && ds.rep_count !== undefined && (
                                  <p className="text-xs text-[#f0b429]/55">{ds.rep_count} reps</p>
                                )}
                              </div>
                              {ds.form_score !== null && ds.form_score !== undefined && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <div className="w-24 h-1.5 rounded-full bg-[#f0b429]/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-[#f0b429] transition-all"
                                      style={{ width: `${ds.form_score}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold w-8 text-right ${scoreColor(ds.form_score)}`}>
                                    {ds.form_score}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty coaching report state */}
                    {!sessionReport.coaching_report?.summary &&
                     (sessionReport.drill_sets?.length ?? 0) === 0 && (
                      <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-6 text-center">
                        <Activity className="mx-auto mb-2 h-8 w-8 text-[#f0b429]/45" />
                        <p className="text-sm font-bold text-white">
                          Coaching report not yet available for this session.
                        </p>
                        <p className="mt-1 text-xs font-bold text-white">
                          Reports are generated after session completion.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-6 text-center">
                    <p className="text-sm font-bold text-white">Could not load report. Please try again.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BIOMETRIC SCAN HISTORY TAB ── */}
        {activeTab === "biometric" && (
          <div className="mx-auto max-w-2xl">
            {bioScans.length === 0 ? (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-8 text-center">
                <Scan className="mx-auto mb-3 h-10 w-10 text-[#f0b429]/45" />
                <p className="text-white font-bold text-sm">No biometric scans saved yet.</p>
                <p className="mt-1 text-xs font-bold text-white">
                  Run a body scan from the Player Hub or Analyst Hub, then tap &quot;Save Scan&quot; to track your progress here.
                </p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {(["Elite", "Good", "Raw"] as const).map((lvl) => {
                    const count = bioScans.filter(s => s.level === lvl).length;
                    return (
                      <div key={lvl} className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-3 text-center">
                        <p className="text-xl font-black" style={{ color: BIOMETRIC_LEVEL_COLOR[lvl] }}>{count}</p>
                        <p className="text-xs text-[#f0b429]/70 mt-0.5">{lvl} scans</p>
                      </div>
                    );
                  })}
                </div>

                {/* Score trend chart */}
                <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 mb-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-[#f0b429]" />
                    <h3 className="font-semibold text-sm" style={{ color: "#f0b429" }}>Score Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[...bioScans].reverse().slice(-12).map((s, i) => ({
                      name: `#${i + 1}`,
                      score: s.score,
                      level: s.level,
                      date: s.session_date,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,180,41,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: "rgba(240,180,41,0.7)", fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(240,180,41,0.7)", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a3d26", border: "1px solid rgba(240,180,41,0.2)", borderRadius: 8 }}
                        labelStyle={{ color: "#f0b429", fontSize: 11 }}
                        formatter={(value: any, _: any, entry: any) => [
                          `${value}/100 — ${entry.payload.level}`,
                          entry.payload.date,
                        ]}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {[...bioScans].reverse().slice(-12).map((s, i) => (
                          <Cell key={i} fill={BIOMETRIC_LEVEL_COLOR[s.level] ?? "#6b7280"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Asymmetry trend */}
                {bioScans.some(s => s.asymmetry_diff > 0) && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <h3 className="font-semibold text-amber-300 text-sm">Asymmetry History</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={[...bioScans].reverse().slice(-12).map((s, i) => ({
                        name: `#${i + 1}`,
                        diff: s.asymmetry_diff,
                        side: s.weak_side,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,180,41,0.1)" />
                        <XAxis dataKey="name" tick={{ fill: "rgba(240,180,41,0.7)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(240,180,41,0.7)", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1a3d26", border: "1px solid rgba(240,180,41,0.2)", borderRadius: 8 }}
                          labelStyle={{ color: "#f0b429", fontSize: 11 }}
                          formatter={(value: any, _: any, entry: any) => [
                            `${value}° difference${entry.payload.side ? ` (${entry.payload.side} side weaker)` : ""}`,
                            "Asymmetry",
                          ]}
                        />
                        <Bar dataKey="diff" radius={[4, 4, 0, 0]}>
                          {[...bioScans].reverse().slice(-12).map((s, i) => (
                            <Cell key={i} fill={s.asymmetry_diff > 10 ? "#f59e0b" : "#22c55e"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-amber-400/70 mt-2">
                      Green = symmetric (&lt;10°). Amber = compensation detected (&gt;10°). Persistent imbalance = injury risk.
                    </p>
                  </div>
                )}

                {/* Recent scans list */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]/55 mb-3">Recent Scans</p>
                  {bioScans.slice(0, 10).map((s, i) => (
                    <div key={i} className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                          style={{ backgroundColor: BIOMETRIC_LEVEL_COLOR[s.level] ?? "#6b7280" }}
                        >
                          {s.score}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#f0b429]">{s.mode_label}</p>
                          <p className="text-[11px] text-[#f0b429]/55">{s.session_date} · {s.frames_analysed} frames</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            color: BIOMETRIC_LEVEL_COLOR[s.level],
                            backgroundColor: `${BIOMETRIC_LEVEL_COLOR[s.level]}20`,
                          }}
                        >
                          {s.level}
                        </span>
                        {s.asymmetry_diff > 10 && (
                          <p className="text-[10px] text-amber-400 mt-0.5">⚠ {s.asymmetry_diff}° gap</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MATCH STATS TAB ── */}
        {activeTab === "stats" && (
          <div className="mx-auto max-w-2xl">
            {/* Summary row */}
            {matchStats.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-3 text-center">
                  <p className="text-xl font-black text-[#f0b429]">{matchStats.length}</p>
                  <p className="text-xs text-[#f0b429]/70 mt-0.5">Total Logged</p>
                </div>
                <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-3 text-center">
                  <p className="text-xl font-black text-green-400">
                    {matchStats.filter((s) => s.result === "W").length}
                  </p>
                  <p className="text-xs text-[#f0b429]/70 mt-0.5">Wins</p>
                </div>
                <div className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-3 text-center">
                  <p className="text-xl font-black text-red-400">
                    {matchStats.filter((s) => s.result === "L").length}
                  </p>
                  <p className="text-xs text-[#f0b429]/70 mt-0.5">Losses</p>
                </div>
              </div>
            )}

            {matchStatsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
              </div>
            ) : matchStats.length === 0 ? (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-8 text-center">
                <Trophy className="mx-auto mb-3 h-10 w-10 text-[#f0b429]/45" />
                <p className="text-white font-bold text-sm">No match stats logged yet.</p>
                <p className="mt-1 text-xs font-bold text-white mb-4">
                  Log your stats after a match or training session.
                </p>
                <Link
                  href="/player/stats/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542] transition-colors"
                >
                  <Trophy className="h-4 w-4" /> Log Match Stats
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]/55">
                    Recent Entries
                  </p>
                  <Link
                    href="/player/stats/new"
                    className="text-xs text-[#f0b429]/70 hover:text-[#f0b429] transition-colors"
                  >
                    + Log new stats
                  </Link>
                </div>

                {matchStats.map((entry) => {
                  const isExpanded = expandedStatId === entry.id;
                  const statEntries = Object.entries(entry.stats ?? {}).filter(
                    ([, v]) => v !== null && v !== undefined && v !== ""
                  );
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 overflow-hidden"
                    >
                      {/* Header row — always visible */}
                      <button
                        onClick={() => setExpandedStatId(isExpanded ? null : entry.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f0b429]/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {entry.result && RESULT_COLOR[entry.result] && (
                            <span
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                              style={{ backgroundColor: RESULT_COLOR[entry.result] }}
                            >
                              {entry.result}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#f0b429] truncate">
                              {entry.opponent ? `vs ${entry.opponent}` : entry.match_type ?? "Match"}
                            </p>
                            <p className="text-[11px] text-[#f0b429]/55">
                              {entry.sport}
                              {entry.match_date
                                ? ` · ${new Date(entry.match_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}`
                                : ""}
                              {entry.competition ? ` · ${entry.competition}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {entry.score && (
                            <span className="text-xs font-bold text-[#f0b429] bg-[#f0b429]/10 px-2 py-0.5 rounded-full">
                              {entry.score}
                            </span>
                          )}
                          {entry.result && RESULT_COLOR[entry.result] && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                color: RESULT_COLOR[entry.result],
                                backgroundColor: `${RESULT_COLOR[entry.result]}20`,
                              }}
                            >
                              {RESULT_LABEL[entry.result]}
                            </span>
                          )}
                          <ChevronRight
                            className={`h-4 w-4 text-[#f0b429]/45 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Expanded stat breakdown */}
                      {isExpanded && statEntries.length > 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#f0b429]/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b429]/45 mb-3">
                            Stats · {entry.role ?? "Player"}
                          </p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            {statEntries.map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-[#f0b429]/65 truncate">
                                  {FIELD_META_LABELS[key] ?? key.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs font-bold text-[#f0b429] ml-2 flex-shrink-0">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isExpanded && statEntries.length === 0 && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#f0b429]/10">
                          <p className="text-xs text-[#f0b429]/45">No individual stats recorded for this entry.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
