"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, Play, CheckCircle2, Brain, Loader2, TrendingUp,
  Activity, ChevronRight, Star, Zap, AlertCircle, Trophy,
  Upload, X, Video, Camera,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";
import { calcBenchmarkScore } from "@/lib/skill-scoring";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";
import { FIELD_META_LABELS } from "@/config/sports";
import { measureFromVideo, type VideoMeasurement, type TestType } from "@/lib/super-engine";

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

// ── Video test definitions ─────────────────────────────────────────────────────

interface VideoTestDef {
  name: string;
  testType: TestType;
  cameraGuide: string;
}

const VIDEO_TESTS: Record<string, VideoTestDef[]> = {
  goalkeeper: [
    { name: "Dive reach",       testType: "jump",         cameraGuide: "Side view — full body from head to outstretched hand" },
  ],
  defender: [
    { name: "40m sprint",       testType: "sprint",       cameraGuide: "Side view — full body visible from start to finish" },
    { name: "Clearance jump",   testType: "jump",         cameraGuide: "Front-on view — full body including feet on takeoff" },
  ],
  midfielder: [
    { name: "20m sprint",       testType: "sprint",       cameraGuide: "Side view — full body visible" },
    { name: "Ball retention",   testType: "ball_mastery", cameraGuide: "Side view — include ball and both players" },
  ],
  forward: [
    { name: "10m sprint",       testType: "sprint",       cameraGuide: "Side view — full body from start line" },
    { name: "Aerial duel",      testType: "jump",         cameraGuide: "Side view — full body including peak of jump" },
    { name: "Dribble + finish", testType: "ball_mastery", cameraGuide: "Side view — full cone course visible" },
  ],
};

interface VideoScore { label: string; value: number; hint: string }

function vmToScores(vm: VideoMeasurement, testType: TestType): VideoScore[] {
  if (testType === "jump") {
    const scores: VideoScore[] = [];
    if (vm.jumpHeightCm != null)
      scores.push({ label: "Jump Height",     value: Math.min(100, Math.round((vm.jumpHeightCm / 60) * 100)), hint: `${vm.jumpHeightCm.toFixed(1)} cm` });
    scores.push({ label: "Landing Balance", value: Math.max(0, Math.round(100 - (vm.sprintAsymmetry ?? 30))), hint: vm.sprintAsymmetry != null ? `${vm.sprintAsymmetry.toFixed(0)}% asymmetry` : "" });
    scores.push({ label: "Knee Flexion",    value: Math.round(vm.sprintKneeDrive ?? 50), hint: "On landing" });
    return scores;
  }
  if (testType === "ball_mastery") {
    const scores: VideoScore[] = [];
    if (vm.jugglingCount   != null) scores.push({ label: "Ball Touches",  value: Math.min(100, vm.jugglingCount * 5),         hint: `${vm.jugglingCount} touches` });
    if (vm.turnQualityScore != null) scores.push({ label: "Turn Quality", value: Math.round(vm.turnQualityScore),              hint: "0–100 scale" });
    if (!scores.length) scores.push({ label: "Form Quality", value: Math.round(((vm.sprintTrunkLean ?? 50) + (vm.sprintKneeDrive ?? 50)) / 2), hint: "" });
    return scores;
  }
  // sprint (default)
  return [
    { label: "Trunk Lean", value: Math.round(vm.sprintTrunkLean  ?? 50), hint: "Forward lean score" },
    { label: "Knee Drive", value: Math.round(vm.sprintKneeDrive  ?? 50), hint: "Drive phase quality" },
    { label: "Arm Swing",  value: Math.round(vm.sprintArmSwing   ?? 50), hint: "Arm mechanics score" },
    { label: "Symmetry",   value: Math.max(0, Math.round(100 - (vm.sprintAsymmetry ?? 30))), hint: "Left/right balance" },
  ];
}


export default function AssessmentPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<"field" | "apk" | "stats" | "video">("field");

  // Field tests state
  const [positionGroup, setPositionGroup] = useState("");
  const [started, setStarted]             = useState(false);
  const [results, setResults]             = useState<Record<string, string>>({});
  const [aiReport, setAiReport]           = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

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

  // Video analysis state
  const videoInputRef                             = useRef<HTMLInputElement>(null);
  const [videoPosGroup,  setVideoPosGroup]        = useState("");
  const [videoTest,      setVideoTest]            = useState<VideoTestDef | null>(null);
  const [videoFile,      setVideoFile]            = useState<File | null>(null);
  const [videoPct,       setVideoPct]             = useState(0);
  const [videoPhase,     setVideoPhase]           = useState<"pick" | "analyse" | "results">("pick");
  const [videoMeasure,   setVideoMeasure]         = useState<VideoMeasurement | null>(null);
  const [videoLoading,   setVideoLoading]         = useState(false);
  const [videoError,     setVideoError]           = useState("");
  const [videoNote,      setVideoNote]            = useState("");
  const [videoNoteLoading, setVideoNoteLoading]   = useState(false);

  useEffect(() => { /* auth handled by layout.tsx */ }, [user]);

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

  const fetchVideoNote = async (vm: VideoMeasurement, test: VideoTestDef) => {
    setVideoNoteLoading(true);
    const scores  = vmToScores(vm, test.testType);
    const summary = scores.map((s) => `${s.label}: ${s.value}/100${s.hint ? ` (${s.hint})` : ""}`).join(", ");
    try {
      const note = await queryAI(
        `Biomechanics video analysis for a ${videoPosGroup} doing "${test.name}": ${summary}. ` +
        `Frames analysed: ${vm.framesAnalysed ?? "unknown"}. Confidence: ${((vm.confidence ?? 0) * 100).toFixed(0)}%. ` +
        `Give 2–3 sentences of specific coaching feedback for a Zimbabwean grassroots player. ` +
        `Mention one clear strength and one actionable improvement.`,
        "player",
      );
      setVideoNote(note);
    } catch {
      setVideoNote("");
    } finally {
      setVideoNoteLoading(false);
    }
  };

  const runVideoTest = async () => {
    if (!videoFile || !videoTest) return;
    setVideoLoading(true);
    setVideoError("");
    setVideoPct(0);
    try {
      const vm = await measureFromVideo(videoFile, videoTest.testType, (pct) => setVideoPct(pct));
      if (!vm || vm.confidence < 0.1) {
        setVideoError("No person detected. Film a clear side-view clip with your full body visible.");
        setVideoPhase("pick");
        setVideoLoading(false);
        return;
      }
      setVideoMeasure(vm);
      setVideoPhase("results");
      fetchVideoNote(vm, videoTest);
    } catch {
      setVideoError("Analysis failed. Try a shorter clip (under 30 seconds) with good lighting.");
      setVideoPhase("pick");
    } finally {
      setVideoLoading(false);
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
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "video"
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-[#f0b429]/70 hover:text-[#f0b429]"
            }`}
          >
            <Video className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
            Video AI
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

        {/* ── VIDEO AI TAB ── */}
        {activeTab === "video" && (
          <div className="mx-auto max-w-lg space-y-4">

            {/* Hidden file input */}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setVideoFile(f);
                setVideoError("");
              }}
            />

            {/* ── PHASE: pick ── */}
            {videoPhase === "pick" && (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-7 backdrop-blur-sm">
                <div className="mb-5 flex items-center gap-3">
                  <Camera className="h-8 w-8 text-[#f0b429]" />
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#f0b429" }}>Video Form Analysis</h2>
                    <p className="text-xs font-bold text-white">AI measures your biomechanics from a short clip</p>
                  </div>
                </div>

                {/* Position group */}
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#f0b429]/70">
                  1. Your position
                </label>
                <div className="mb-5 grid grid-cols-2 gap-2">
                  {Object.entries(VIDEO_TESTS).map(([id]) => {
                    const label = id.charAt(0).toUpperCase() + id.slice(1);
                    return (
                      <button
                        key={id}
                        onClick={() => { setVideoPosGroup(id); setVideoTest(null); setVideoFile(null); setVideoError(""); }}
                        className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                          videoPosGroup === id
                            ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                            : "border-[#f0b429]/15 bg-[#f0b429]/5 text-[#f0b429]/60 hover:border-[#f0b429]/30"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Test picker */}
                {videoPosGroup && (
                  <>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#f0b429]/70">
                      2. Select test
                    </label>
                    <div className="mb-5 space-y-2">
                      {(VIDEO_TESTS[videoPosGroup] ?? []).map((t) => (
                        <button
                          key={t.name}
                          onClick={() => { setVideoTest(t); setVideoFile(null); setVideoError(""); }}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                            videoTest?.name === t.name
                              ? "border-[#f0b429] bg-[#f0b429]/10"
                              : "border-[#f0b429]/15 bg-[#f0b429]/5 hover:border-[#f0b429]/30"
                          }`}
                        >
                          <p className="text-sm font-semibold text-[#f0b429]">{t.name}</p>
                          <p className="text-[11px] text-[#f0b429]/55 mt-0.5">{t.cameraGuide}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Upload zone */}
                {videoTest && (
                  <>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#f0b429]/70">
                      3. Upload your clip
                    </label>
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f0b429]/30 bg-[#f0b429]/5 py-8 hover:border-[#f0b429]/60 transition-colors"
                    >
                      {videoFile ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-400" />
                          <p className="text-sm font-semibold text-green-400">{videoFile.name}</p>
                          <p className="text-xs text-[#f0b429]/55">{(videoFile.size / 1e6).toFixed(1)} MB — tap to change</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-[#f0b429]/50" />
                          <p className="text-sm font-semibold text-[#f0b429]/70">Tap to select video</p>
                          <p className="text-xs text-[#f0b429]/40">MP4, MOV, WebM — under 30 seconds</p>
                        </>
                      )}
                    </div>

                    {videoError && (
                      <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-300">{videoError}</p>
                      </div>
                    )}

                    <button
                      onClick={() => { setVideoPhase("analyse"); runVideoTest(); }}
                      disabled={!videoFile || videoLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] px-4 py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-50 transition-colors"
                    >
                      <Zap className="h-4 w-4" />
                      Analyse with AI
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── PHASE: analyse ── */}
            {videoPhase === "analyse" && (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-8 text-center backdrop-blur-sm">
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#f0b429]" />
                <h2 className="mb-1 text-lg font-bold" style={{ color: "#f0b429" }}>Analysing your clip…</h2>
                <p className="mb-5 text-xs font-bold text-white">
                  {videoPct < 30 ? "Extracting frames…"
                    : videoPct < 65 ? "Detecting skeleton…"
                    : videoPct < 90 ? "Cross-checking pose data…"
                    : "Finalising results…"}
                </p>
                <div className="mx-auto max-w-xs">
                  <div className="h-2 w-full rounded-full bg-[#f0b429]/15">
                    <div
                      className="h-2 rounded-full bg-[#f0b429] transition-all duration-300"
                      style={{ width: `${videoPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-[#f0b429]/55">{videoPct}%</p>
                </div>
              </div>
            )}

            {/* ── PHASE: results ── */}
            {videoPhase === "results" && videoMeasure && videoTest && (
              <>
                {/* Score cards */}
                <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold" style={{ color: "#f0b429" }}>{videoTest.name}</h2>
                      <p className="text-xs text-[#f0b429]/55">
                        {videoMeasure.framesAnalysed ?? "–"} frames · {((videoMeasure.confidence ?? 0) * 100).toFixed(0)}% confidence
                        {videoMeasure.enginesUsed?.length ? ` · ${videoMeasure.enginesUsed.join(" + ")}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-bold text-green-400">
                      ✓ Done
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {vmToScores(videoMeasure, videoTest.testType).map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-4 text-center"
                      >
                        <p className={`text-2xl font-black ${scoreColor(s.value)}`}>{s.value}</p>
                        <p className="text-[11px] font-semibold text-[#f0b429] mt-0.5">{s.label}</p>
                        {s.hint && <p className="text-[10px] text-[#f0b429]/45 mt-0.5">{s.hint}</p>}
                        <p className={`text-[10px] font-bold mt-1 ${scoreColor(s.value)}`}>{scoreLabel(s.value)}</p>
                      </div>
                    ))}
                  </div>

                  {videoMeasure.warnings?.length ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-300">{videoMeasure.warnings.join(" · ")}</p>
                    </div>
                  ) : null}
                </div>

                {/* THUTO coaching note */}
                <div className="rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-[#f0b429]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]/70">THUTO Coaching Note</p>
                  </div>
                  {videoNoteLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#f0b429]/50" />
                      <p className="text-xs text-[#f0b429]/50">Generating feedback…</p>
                    </div>
                  ) : videoNote ? (
                    <p className="text-sm leading-relaxed text-white">{videoNote}</p>
                  ) : (
                    <p className="text-xs text-[#f0b429]/45">No coaching note available.</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setVideoPhase("pick");
                      setVideoFile(null);
                      setVideoMeasure(null);
                      setVideoNote("");
                      setVideoError("");
                      setVideoPct(0);
                    }}
                    className="flex-1 rounded-xl border border-[#f0b429]/30 py-2.5 text-sm font-semibold text-[#f0b429] hover:bg-[#f0b429]/10 transition-colors"
                  >
                    Try another test
                  </button>
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      setVideoMeasure(null);
                      setVideoNote("");
                      setVideoError("");
                      setVideoPct(0);
                      setVideoPhase("pick");
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-[#f0b429]/30 px-4 py-2.5 text-sm font-semibold text-[#f0b429]/60 hover:bg-[#f0b429]/10 transition-colors"
                  >
                    <X className="h-4 w-4" /> Reset
                  </button>
                </div>
              </>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
