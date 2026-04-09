"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target, ChevronLeft, CheckCircle2, Circle, Flame, Calendar,
  TrendingUp, AlertTriangle, Sparkles, RefreshCw, Lock,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GoalPhase {
  phase:          number;
  title:          string;
  focus:          string;
  duration_weeks: number;
  milestones:     string[];
  daily_mission:  string;
  start_date:     string;
  end_date:       string;
}

interface PlayerGoal {
  id:              string;
  goal_type:       string;
  goal_text:       string;
  timeline_months: number;
  sport:           string;
  position:        string;
  created_at:      string;
  target_date:     string;
  committed:       boolean;
  phases:          GoalPhase[];
}

interface MissionLog {
  [date: string]: "done" | "skip";
}

// ── Storage helpers ───────────────────────────────────────────────────────────

const GOAL_KEY    = "gs_player_goal";
const MISSION_KEY = "gs_goal_missions";

const loadGoal    = (): PlayerGoal | null => {
  try { return JSON.parse(localStorage.getItem(GOAL_KEY) ?? "null"); } catch { return null; }
};
const saveGoal    = (g: PlayerGoal) => {
  try { localStorage.setItem(GOAL_KEY, JSON.stringify(g)); } catch {}
};
const loadMissions = (): MissionLog => {
  try { return JSON.parse(localStorage.getItem(MISSION_KEY) ?? "{}"); } catch { return {}; }
};
const saveMissions = (m: MissionLog) => {
  try { localStorage.setItem(MISSION_KEY, JSON.stringify(m)); } catch {}
};

// ── Preset goal types ─────────────────────────────────────────────────────────

const GOAL_TYPES = [
  { id: "division1",   icon: "🏆", label: "Play for a higher team",    example: "I want to play Division 1 football in 12 months" },
  { id: "scouted",     icon: "🔍", label: "Get scouted",               example: "I want to be noticed by a scout in 6 months" },
  { id: "fitness",     icon: "💪", label: "Get fitter and faster",     example: "I want to improve my speed and stamina in 3 months" },
  { id: "school_team", icon: "🏫", label: "Make the school first team", example: "I want to make the first team next term" },
  { id: "skill",       icon: "⚡", label: "Master a specific skill",   example: "I want to improve my dribbling and weak foot in 3 months" },
  { id: "custom",      icon: "✏️", label: "My own goal",               example: "Describe your goal in your own words..." },
];

const TIMELINES = [
  { months: 3,  label: "3 months",  desc: "Short sprint" },
  { months: 6,  label: "6 months",  desc: "Half season" },
  { months: 12, label: "12 months", desc: "Full season" },
  { months: 18, label: "18 months", desc: "Long haul" },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10);

const addWeeks = (from: string, weeks: number): string => {
  const d = new Date(from);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
};

const addMonths = (from: string, months: number): string => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" });

const daysUntil = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

// ── Main Component ────────────────────────────────────────────────────────────

export default function GoalPage() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [goal,       setGoal]       = useState<PlayerGoal | null>(null);
  const [missions,   setMissions]   = useState<MissionLog>({});
  const [stage,      setStage]      = useState<"setup" | "review" | "active">("setup");

  // Setup form state
  const [goalType,   setGoalType]   = useState("");
  const [goalText,   setGoalText]   = useState("");
  const [timeline,   setTimeline]   = useState(12);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState("");

  // Load existing goal on mount
  useEffect(() => {
    const g = loadGoal();
    const m = loadMissions();
    setMissions(m);
    if (g) {
      setGoal(g);
      setStage(g.committed ? "active" : "review");
    }
    // Also try fetching from API
    api.get("/player/goal").then((res) => {
      const data = res.data?.data;
      if (data) {
        saveGoal(data);
        setGoal(data);
        setStage(data.committed ? "active" : "review");
      }
    }).catch(() => {});
  }, []);

  // ── Generate plan via THUTO ────────────────────────────────────────────────
  const generatePlan = useCallback(async () => {
    if (!goalText.trim()) return;
    setGenerating(true);
    setGenError("");

    const sport    = user?.sport    ?? "football";
    const position = user?.position ?? "player";
    const name     = user?.name     ?? "the player";

    const prompt = `You are THUTO, an AI coach on GrassRoots Sports Zimbabwe.
A player named ${name} (${sport}, ${position}) has set this goal:
"${goalText}"
Timeline: ${timeline} months.

Break this into exactly 3 phases. Return ONLY valid JSON — no markdown, no explanation.
Format:
{
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "focus": "One sentence describing the focus of this phase",
      "duration_weeks": 8,
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
      "daily_mission": "One specific daily action the player should take during this phase"
    }
  ]
}
Make milestones measurable and realistic for a grassroots player in Zimbabwe.
Total duration of all phases must equal ${timeline * 4} weeks.`;

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: "Return only valid JSON. No markdown fences." }),
      });
      const data = await res.json();
      const raw: string = data?.response ?? data?.answer ?? "";

      // Extract JSON from response (sometimes AI wraps it)
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI returned invalid format");

      const parsed = JSON.parse(jsonMatch[0]) as { phases: Omit<GoalPhase, "start_date" | "end_date">[] };

      // Build dates for each phase
      let cursor = today();
      const phases: GoalPhase[] = parsed.phases.map((p) => {
        const start = cursor;
        const end   = addWeeks(start, p.duration_weeks);
        cursor      = end;
        return { ...p, start_date: start, end_date: end };
      });

      const newGoal: PlayerGoal = {
        id:              crypto.randomUUID(),
        goal_type:       goalType,
        goal_text:       goalText,
        timeline_months: timeline,
        sport,
        position,
        created_at:      today(),
        target_date:     addMonths(today(), timeline),
        committed:       false,
        phases,
      };

      saveGoal(newGoal);
      setGoal(newGoal);
      setStage("review");

    } catch {
      setGenError("THUTO couldn't generate a plan right now. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [goalText, goalType, timeline, user]);

  // ── Commit to plan ─────────────────────────────────────────────────────────
  const commitPlan = () => {
    if (!goal) return;
    const committed = { ...goal, committed: true };
    saveGoal(committed);
    setGoal(committed);
    setStage("active");
    // Save to API (non-blocking)
    api.post("/player/goal", committed).catch(() => {});
  };

  // ── Mark today's mission ───────────────────────────────────────────────────
  const markMission = (status: "done" | "skip") => {
    const updated = { ...missions, [today()]: status };
    saveMissions(updated);
    setMissions(updated);
    api.post("/player/goal/mission", { date: today(), status }).catch(() => {});
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const adherencePct = (log: MissionLog, phases: GoalPhase[]): number => {
    if (!phases.length) return 0;
    const start   = phases[0].start_date;
    const daysSince = Math.ceil((Date.now() - new Date(start).getTime()) / 86400000);
    if (daysSince <= 0) return 100;
    const done = Object.values(log).filter((v) => v === "done").length;
    return Math.round((done / daysSince) * 100);
  };

  const currentPhase = (g: PlayerGoal): GoalPhase => {
    const t = today();
    return g.phases.find((p) => t >= p.start_date && t <= p.end_date) ?? g.phases[g.phases.length - 1];
  };

  const overallPct = (g: PlayerGoal): number => {
    const total = g.phases.reduce((sum, p) => sum + p.duration_weeks, 0);
    const done  = g.phases
      .filter((p) => today() > p.end_date)
      .reduce((sum, p) => sum + p.duration_weeks, 0);
    const active = g.phases.find((p) => today() >= p.start_date && today() <= p.end_date);
    if (active) {
      const elapsed = Math.ceil((Date.now() - new Date(active.start_date).getTime()) / 86400000);
      const phaseWeeksDone = elapsed / 7;
      return Math.min(99, Math.round(((done + phaseWeeksDone) / total) * 100));
    }
    return Math.min(100, Math.round((done / total) * 100));
  };

  // ── Reset goal ─────────────────────────────────────────────────────────────
  const resetGoal = () => {
    localStorage.removeItem(GOAL_KEY);
    localStorage.removeItem(MISSION_KEY);
    setGoal(null);
    setMissions({});
    setGoalType("");
    setGoalText("");
    setTimeline(12);
    setStage("setup");
  };

  // ── Render: SETUP ──────────────────────────────────────────────────────────
  if (stage === "setup") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-4 py-8">

            {/* Back */}
            <Link href="/player" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6">
              <ChevronLeft className="h-4 w-4" /> Player Hub
            </Link>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/30 mb-4">
                <Target className="h-8 w-8 text-[#f0b429]" />
              </div>
              <h1 className="text-2xl font-bold text-white">Mission Mode</h1>
              <p className="text-white/50 text-sm mt-1">Set your goal. Follow the plan. THUTO guarantees progress.</p>
            </div>

            {/* Step 1 — Goal type */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-white/70 mb-3">1. What is your goal?</p>
              <div className="grid grid-cols-2 gap-3">
                {GOAL_TYPES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setGoalType(g.id); setGoalText(g.id === "custom" ? "" : g.example); }}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      goalType === g.id
                        ? "border-[#f0b429]/60 bg-[#f0b429]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-sm font-medium text-white leading-tight">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Goal text */}
            {goalType && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-white/70 mb-2">2. Describe your goal in one sentence</p>
                <textarea
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder={GOAL_TYPES.find((g) => g.id === goalType)?.example}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-[#f0b429]/50 transition-colors resize-none"
                />
              </div>
            )}

            {/* Step 3 — Timeline */}
            {goalType && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-white/70 mb-3">3. How long do you have?</p>
                <div className="grid grid-cols-4 gap-2">
                  {TIMELINES.map((t) => (
                    <button
                      key={t.months}
                      onClick={() => setTimeline(t.months)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        timeline === t.months
                          ? "border-[#f0b429]/60 bg-[#f0b429]/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{t.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {genError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {genError}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generatePlan}
              disabled={!goalType || !goalText.trim() || generating}
              className="w-full py-4 rounded-xl font-bold text-sm bg-[#f0b429] text-[#0a1a0e] hover:bg-[#f5c542] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] animate-spin" />
                  THUTO is building your plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate My Plan
                </>
              )}
            </button>

          </div>
        </main>
      </div>
    );
  }

  // ── Render: REVIEW ─────────────────────────────────────────────────────────
  if (stage === "review" && goal) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-4 py-8">

            <button onClick={resetGoal} className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6">
              <ChevronLeft className="h-4 w-4" /> Change goal
            </button>

            <div className="mb-6">
              <h1 className="text-xl font-bold text-white">Your Plan is Ready</h1>
              <p className="text-white/50 text-sm mt-1">THUTO has broken your goal into {goal.phases.length} phases. Review and commit.</p>
            </div>

            {/* Goal summary */}
            <div className="mb-6 rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-5 py-4">
              <p className="text-xs text-[#f0b429] font-semibold uppercase tracking-wider mb-1">Your Goal</p>
              <p className="text-white font-medium">"{goal.goal_text}"</p>
              <p className="text-white/40 text-xs mt-1">Target date: {formatDate(goal.target_date)}</p>
            </div>

            {/* Phases */}
            <div className="space-y-4 mb-8">
              {goal.phases.map((phase) => (
                <div key={phase.phase} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0b429]/20 text-sm font-bold text-[#f0b429]">
                      {phase.phase}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{phase.title}</p>
                      <p className="text-xs text-white/40">{formatDate(phase.start_date)} → {formatDate(phase.end_date)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mb-3">{phase.focus}</p>

                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Milestones</p>
                    <ul className="space-y-1">
                      {phase.milestones.map((m, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                          <Circle className="h-3 w-3 mt-0.5 flex-shrink-0 text-white/30" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-teal-500/20 bg-teal-900/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider mb-0.5">Daily Mission</p>
                    <p className="text-xs text-white/80">{phase.daily_mission}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Commit */}
            <button
              onClick={commitPlan}
              className="w-full py-4 rounded-xl font-bold text-sm bg-[#f0b429] text-[#0a1a0e] hover:bg-[#f5c542] transition-all flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Commit to This Plan
            </button>
            <button onClick={resetGoal} className="w-full mt-3 py-3 rounded-xl text-sm text-white/40 hover:text-white transition-colors">
              Start over with a different goal
            </button>

          </div>
        </main>
      </div>
    );
  }

  // ── Render: ACTIVE DASHBOARD ───────────────────────────────────────────────
  if (stage === "active" && goal) {
    const phase     = currentPhase(goal);
    const overall   = overallPct(goal);
    const adherence = adherencePct(missions, goal.phases);
    const todayLog  = missions[today()];
    const daysLeft  = daysUntil(goal.target_date);
    const onTrack   = adherence >= 70;
    const missionsDone = Object.values(missions).filter((v) => v === "done").length;

    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto">
          <div className="mx-auto max-w-2xl px-4 py-8">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/player" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white">
                <ChevronLeft className="h-4 w-4" /> Player Hub
              </Link>
              <button onClick={resetGoal} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Reset goal
              </button>
            </div>

            {/* Goal card */}
            <div className="mb-6 rounded-2xl border border-[#f0b429]/20 bg-gradient-to-br from-[#f0b429]/10 to-transparent p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <p className="text-xs text-[#f0b429] font-semibold uppercase tracking-wider mb-1">Mission Mode</p>
                  <p className="font-bold text-white">"{goal.goal_text}"</p>
                  <p className="text-xs text-white/40 mt-1">{daysLeft} days remaining · {formatDate(goal.target_date)}</p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  onTrack ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {onTrack ? <TrendingUp className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {onTrack ? "On track" : "At risk"}
                </div>
              </div>

              {/* Overall progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/50">Overall progress</p>
                  <p className="text-xs font-bold text-[#f0b429]">{overall}%</p>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f0b429] transition-all duration-700"
                    style={{ width: `${overall}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Flame,      label: "Adherence",     value: `${adherence}%`,    color: "text-orange-400" },
                { icon: CheckCircle2,label: "Missions Done", value: String(missionsDone), color: "text-green-400" },
                { icon: Calendar,   label: "Days Left",     value: String(daysLeft),   color: "text-blue-400" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/40">{label}</p>
                </div>
              ))}
            </div>

            {/* Today's mission */}
            <div className={`mb-6 rounded-2xl border p-5 ${
              todayLog === "done"
                ? "border-green-500/30 bg-green-500/10"
                : "border-teal-500/20 bg-teal-900/20"
            }`}>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Today&apos;s Mission</p>
              <p className="text-white font-medium mb-1">{phase.daily_mission}</p>
              <p className="text-xs text-white/40 mb-4">Phase {phase.phase}: {phase.title}</p>

              {todayLog === "done" ? (
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5" /> Mission complete — great work!
                </div>
              ) : todayLog === "skip" ? (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Skipped today — make it up tomorrow.
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => markMission("done")}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark Complete
                  </button>
                  <button
                    onClick={() => markMission("skip")}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/60 transition-colors"
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>

            {/* Phase timeline */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Your Phases</p>
              <div className="space-y-4">
                {goal.phases.map((p) => {
                  const isDone   = today() > p.end_date;
                  const isActive = today() >= p.start_date && today() <= p.end_date;
                  return (
                    <div key={p.phase} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isDone   ? "bg-green-500/20 text-green-400" :
                        isActive ? "bg-[#f0b429]/20 text-[#f0b429]" :
                                   "bg-white/10 text-white/30"
                      }`}>
                        {isDone ? "✓" : p.phase}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${isActive ? "text-white" : isDone ? "text-white/60" : "text-white/30"}`}>
                            {p.title}
                          </p>
                          {isActive && (
                            <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">NOW</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isActive ? "text-white/50" : "text-white/25"}`}>
                          {formatDate(p.start_date)} → {formatDate(p.end_date)}
                        </p>
                        {isActive && (
                          <ul className="mt-2 space-y-1">
                            {p.milestones.map((m, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-white/50">
                                <Circle className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regenerate plan */}
            <button
              onClick={() => { setStage("review"); generatePlan(); }}
              className="w-full mt-4 py-3 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Ask THUTO to regenerate plan
            </button>

          </div>
        </main>
      </div>
    );
  }

  return null;
}
