"use client";

import { useEffect, useState } from "react";
import {
  Calendar, RefreshCw, Settings2, ChevronDown, ChevronUp,
  Moon, Clock, Dumbbell, Loader2, MessageCircle, HelpCircle,
  Target, Play, Star, Zap,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { saveSchedule } from "@/lib/offlineDB";

// ── Types ──────────────────────────────────────────────────────────────────────

interface WarmUp {
  name: string;
  duration_minutes: number;
  instructions: string;
  coaching_question?: string;
}

interface MainDrill {
  name: string;
  duration_minutes: number;
  instructions: string;
  repetitions?: string;
  equipment_needed?: string;
  coaching_question?: string;
  success_looks_like?: string;
}

interface GameApplication {
  name: string;
  duration_minutes: number;
  setup?: string;
  instructions: string;
  thuto_observes?: string;
  coaching_intervention?: string;
}

interface ScheduleDay {
  day: string;
  is_rest: boolean;
  focus?: string;
  phase_of_play?: string;
  session_intention?: string;
  joy_prompt?: string;
  cooldown?: string;
  warm_up?: WarmUp;
  main_drill?: MainDrill;
  game_application?: GameApplication;
  // Legacy fallback support
  drills?: { name: string; duration_minutes: number; instructions: string; equipment_needed?: string }[];
  total_duration_minutes?: number;
  intensity?: string;
  pre_session_warmup?: string;
  post_session_cooldown?: string;
}

interface Schedule {
  id: string;
  week_start: string;
  schedule_json: { week_start: string; session_theme?: string; framework_used?: string; days: ScheduleDay[] };
  ai_generated: boolean;
  is_active: boolean;
}

interface TrainingPrefs {
  time_preference: "morning" | "afternoon" | "evening";
  days: number;
  hours: number;
  age: number;
  position: string;
}

interface PlayerDNA {
  has_ball: boolean;
  equipment: string;
  environment: string;
}

const PREFS_KEY   = "thuto_training_prefs";
const ORDERED_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ── Stage from age ─────────────────────────────────────────────────────────────

function stageFromAge(age: number): string {
  if (age <= 12) return "grassroots";
  if (age <= 15) return "development";
  if (age <= 18) return "advanced";
  return "semi_pro";
}

// ── localStorage helpers ───────────────────────────────────────────────────────

function loadPrefs(): TrainingPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { hours: 1, age: 15, position: "midfielder", ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { time_preference: "morning", days: 4, hours: 1, age: 15, position: "midfielder" };
}

function savePrefs(p: TrainingPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

function loadDNA(): PlayerDNA {
  try {
    const raw = localStorage.getItem("thuto_dna");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { has_ball: true, equipment: "football, cones", environment: "school field or open ground" };
}

// ── DayCard component ──────────────────────────────────────────────────────────

function DayCard({
  day,
  onLogSession,
  loggingDay,
}: {
  day: ScheduleDay;
  onLogSession: (day: ScheduleDay) => void;
  loggingDay: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (day.is_rest) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">{day.day}</p>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/40">
            <Moon className="h-3 w-3" /> Rest
          </span>
        </div>
        <p className="mt-2 text-xs text-white/30 italic">Recovery day — let your body adapt</p>
      </div>
    );
  }

  const isLogging = loggingDay === day.day;
  const hasRichStructure = !!(day.warm_up || day.main_drill || day.game_application);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/60 transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-start justify-between px-4 py-4 text-left"
      >
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-sm font-bold text-white">{day.day}</p>
          {day.focus && <p className="mt-0.5 text-sm text-teal-300">{day.focus}</p>}
          {day.session_intention && !expanded && (
            <p className="mt-1 text-xs text-white/40 italic line-clamp-1">{day.session_intention}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-white/40 flex-wrap">
            {day.total_duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{day.total_duration_minutes} min
              </span>
            )}
            {day.phase_of_play && (
              <span className="flex items-center gap-1 capitalize">
                <Zap className="h-3 w-3" />{day.phase_of_play.replace(/_/g, " ")}
              </span>
            )}
            {hasRichStructure && (
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />Warm-up · Drill · Game
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-white/30">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3">

          {/* THUTO opens with session intention */}
          {day.session_intention && (
            <div className="flex items-start gap-2 rounded-xl bg-teal-900/30 border border-teal-500/20 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">T</span>
              <p className="text-sm text-teal-200 italic leading-relaxed">"{day.session_intention}"</p>
            </div>
          )}

          {/* Rich structure */}
          {hasRichStructure ? (
            <>
              {/* Warm-up */}
              {day.warm_up && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-green-400">Warm-up</p>
                    <span className="ml-auto text-xs text-white/30 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{day.warm_up.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{day.warm_up.name}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{day.warm_up.instructions}</p>
                  {day.warm_up.coaching_question && (
                    <div className="flex items-start gap-2 rounded-lg bg-teal-900/20 border border-teal-500/15 px-3 py-2 mt-1">
                      <HelpCircle className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-teal-300 italic">"{day.warm_up.coaching_question}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Main drill */}
              {day.main_drill && (
                <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-[#f0b429] flex-shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]">Main Drill</p>
                    <span className="ml-auto text-xs text-white/30 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{day.main_drill.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{day.main_drill.name}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{day.main_drill.instructions}</p>
                  {day.main_drill.repetitions && (
                    <p className="text-xs text-white/40">Reps: {day.main_drill.repetitions}</p>
                  )}
                  {day.main_drill.equipment_needed && (
                    <p className="text-xs text-white/30">Equipment: {day.main_drill.equipment_needed}</p>
                  )}
                  {day.main_drill.coaching_question && (
                    <div className="flex items-start gap-2 rounded-lg bg-teal-900/20 border border-teal-500/15 px-3 py-2">
                      <HelpCircle className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-teal-300 italic">"{day.main_drill.coaching_question}"</p>
                    </div>
                  )}
                  {day.main_drill.success_looks_like && (
                    <div className="flex items-start gap-2 rounded-lg bg-green-900/20 border border-green-500/15 px-3 py-2">
                      <Star className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-green-300">Success: {day.main_drill.success_looks_like}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Game application */}
              {day.game_application && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-900/10 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Game Application</p>
                    <span className="ml-auto text-xs text-white/30 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{day.game_application.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">{day.game_application.name}</p>
                  {day.game_application.setup && (
                    <p className="text-xs text-white/40">Setup: {day.game_application.setup}</p>
                  )}
                  <p className="text-sm text-white/60 leading-relaxed">{day.game_application.instructions}</p>
                  {day.game_application.thuto_observes && (
                    <p className="text-xs text-purple-300/70 italic">
                      THUTO watches for: {day.game_application.thuto_observes}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Legacy drill list (fallback) */
            day.drills && day.drills.length > 0 && (
              <div className="space-y-2">
                {day.drills.map((drill, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{drill.name}</p>
                      <span className="flex-shrink-0 flex items-center gap-1 text-xs text-white/40">
                        <Clock className="h-3 w-3" />{drill.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">{drill.instructions}</p>
                    {drill.equipment_needed && (
                      <p className="text-xs text-white/30">Equipment: {drill.equipment_needed}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Cooldown */}
          {(day.cooldown || day.post_session_cooldown) && (
            <div className="rounded-xl bg-blue-900/20 border border-blue-500/20 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">Cooldown</p>
              <p className="text-sm text-white/70">{day.cooldown ?? day.post_session_cooldown}</p>
            </div>
          )}

          {/* THUTO joy prompt */}
          {day.joy_prompt && (
            <div className="flex items-start gap-2 rounded-xl bg-teal-900/20 border border-teal-500/15 p-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">T</span>
              <p className="text-sm text-teal-200 italic leading-relaxed">"{day.joy_prompt}"</p>
            </div>
          )}

          {/* Log session */}
          <button
            onClick={() => onLogSession(day)}
            disabled={isLogging}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-900/30 py-2.5 text-sm font-semibold text-teal-300 transition-colors hover:bg-teal-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLogging ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Asking THUTO...</>
            ) : (
              <><MessageCircle className="h-4 w-4" /> Log this session with THUTO</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { user } = useAuthStore();
  const [schedule, setSchedule]         = useState<Schedule | null>(null);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs]               = useState<TrainingPrefs>({ time_preference: "morning", days: 4, hours: 1, age: 15, position: "midfielder" });
  const [loggingDay, setLoggingDay]     = useState<string | null>(null);
  const [frameworkUsed, setFrameworkUsed] = useState("");

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  useEffect(() => {
    api.get("/training/schedule")
      .then((res) => setSchedule(res.data?.schedule ?? null))
      .catch(() => {
        try {
          const stored = localStorage.getItem("thuto_training_schedule");
          if (stored) setSchedule(JSON.parse(stored));
        } catch { /* ignore */ }
      })
      .finally(() => setLoading(false));
  }, []);

  const updatePrefs = (patch: Partial<TrainingPrefs>) => {
    const updated = { ...prefs, ...patch };
    setPrefs(updated);
    savePrefs(updated);
  };

  // ── Build FIFA prompt ────────────────────────────────────────────────────────

  const buildPrompt = async (): Promise<string> => {
    const dna = loadDNA();

    // Try to get profile data from API, fallback to auth store + prefs
    let name     = user?.name ?? "Player";
    let age      = prefs.age;
    let position = prefs.position;
    let province = "Harare";

    try {
      const res = await api.get("/profile");
      const p = res.data?.data ?? res.data ?? {};
      if (p.name || p.first_name)
        name = p.name ?? `${p.first_name ?? ""} ${p.surname ?? ""}`.trim();
      if (p.date_of_birth) {
        const dob = new Date(p.date_of_birth);
        age = new Date().getFullYear() - dob.getFullYear();
      }
      if (p.position) position = p.position;
      if (p.province) province = p.province;
    } catch { /* use defaults */ }

    const stage = stageFromAge(age);
    const weekStart = new Date().toISOString().split("T")[0];

    return `You are THUTO, generating a 7-day training schedule for ${name}, aged ${age}, position ${position}, development stage ${stage}, from ${province} Zimbabwe.

Equipment available: ${dna.equipment}
Training space: ${dna.environment}
Days available: ${prefs.days}
Session duration: ${prefs.hours} hour${prefs.hours !== 1 ? "s" : ""}
Preferred time: ${prefs.time_preference}

You must follow FIFA's age-appropriate session framework as follows:

IF player is aged 8–12:
Use the Global-Analytical-Global (GAG) model:
  GLOBAL 1 (warm-up + opening game): A small-sided game with the ball immediately. Fun, competitive, many touches. No explanation needed — just play. 10–15 minutes.
  ANALYTICAL (main skill): One primary technical focus only. Unopposed repetition — no defender pressure. Quality of movement before speed. High number of ball contacts. Can include light competition. 15–20 minutes.
  GLOBAL 2 (game application): Return to a small-sided game. Player applies the skill from analytical phase. No coaching intervention — let the game teach. 10–15 minutes.

IF player is aged 12–15:
Use the Progressive Methodology:
  TECHNICAL FOUNDATION (warm-up + foundation): Dynamic activation — gradually increase intensity. Unopposed technical repetition. Connect warm-up theme to main session theme. 10–15 minutes.
  TACTICAL INTRODUCTION (main activity): Introduce decision-making and game understanding. Ask leading questions — never just tell. Keep competition in the activity. 15–20 minutes.
  GAME APPLICATION (match-realistic): Minimal restriction. Minimal coaching. Player solves problems independently. Reflects real match demands. 10–15 minutes.

IF player is aged 15–18 or in semi_pro/trial_ready:
Use Play-Practice-Play with tactical demands:
  PLAY 1: Small-sided game, player-led, coach observes
  PRACTICE: Focused skill work, personalised feedback
  PLAY 2: Open game, apply learned skill freely

FOR ALL AGES — these six principles are non-negotiable:
1. FUN: Every drill must have an element of joy
2. SAFE: Age-appropriate intensity, proper warm-up
3. EFFECTIVE: One clear learning objective per session
4. INCLUSIVE: No player stands around — maximum touches
5. GAME-BASED: All drills resemble real match situations
6. PROGRESSIVE: Each drill builds on the previous one

SPATIAL AWARENESS (always include for under-15):
At least one activity per session must develop the player's ability to find space, scan, and make decisions with and without the ball.

EQUIPMENT ADAPTATION:
If has_ball = ${dna.has_ball ? "true" : "false (NO BALL)"}:
${!dna.has_ball ? `Replace all ball drills with:
  - Wall work using any round object
  - Body movement patterns (shadow dribbling)
  - Agility and spatial awareness games
  - Coordination work without equipment` : "Standard ball drills are fine."}

COACHING LANGUAGE RULE:
THUTO never says "do this drill."
THUTO asks leading questions in coaching_question fields.

Return ONLY valid JSON — no markdown, no explanation:
{
  "week_start": "${weekStart}",
  "session_theme": "theme for the whole week",
  "framework_used": "GAG | Progressive | PPP",
  "days": [
    {
      "day": "Monday",
      "is_rest": false,
      "focus": "one technical focus for this session",
      "phase_of_play": "in_possession | out_of_possession | transition_attacking | transition_defending",
      "warm_up": {
        "name": "...",
        "duration_minutes": 10,
        "instructions": "...",
        "coaching_question": "question THUTO asks player"
      },
      "main_drill": {
        "name": "...",
        "duration_minutes": 20,
        "instructions": "...",
        "repetitions": "...",
        "equipment_needed": "...",
        "coaching_question": "question THUTO asks player",
        "success_looks_like": "what good execution feels like"
      },
      "game_application": {
        "name": "...",
        "duration_minutes": 15,
        "setup": "...",
        "instructions": "...",
        "thuto_observes": "what THUTO watches for",
        "coaching_intervention": "minimal"
      },
      "cooldown": "2-3 minute recovery activity",
      "session_intention": "one sentence THUTO says to open this session",
      "joy_prompt": "question THUTO asks after session about how it felt"
    }
  ]
}

Include all 7 days. Set is_rest: true for ${7 - prefs.days} days. Adapt drills for Zimbabwe grassroots context.`;
  };

  // ── Generate schedule ────────────────────────────────────────────────────────

  const generateSchedule = async () => {
    setGenerating(true);
    const weekStart = new Date().toISOString().slice(0, 10);

    const buildFallback = (): ScheduleDay[] => {
      let count = 0;
      const focuses = ["Ball Control", "Fitness & Endurance", "Passing & Movement", "Shooting", "Defending", "Small-Sided Games"];
      return ORDERED_DAYS.map((day) => {
        if (count >= prefs.days) return { day, is_rest: true };
        const focus = focuses[count % focuses.length];
        count++;
        return {
          day, is_rest: false, focus,
          session_intention: `Today we work on ${focus}. Let's make it sharp.`,
          joy_prompt: `How did that ${focus.toLowerCase()} session feel? What surprised you?`,
          warm_up: {
            name: "Dynamic Activation",
            duration_minutes: 10,
            instructions: "5 min light jog + dynamic stretches — leg swings, hip circles, high knees. Gradually increase pace.",
            coaching_question: "As you warm up, what part of your body feels tightest today?",
          },
          main_drill: {
            name: `${focus} — Foundations`,
            duration_minutes: 20,
            instructions: "Work on core technique. Quality over speed. Repeat 10 times each side.",
            equipment_needed: "Ball, cones",
            coaching_question: "What does your body feel like when you do this well?",
            success_looks_like: "Movements feel automatic, no hesitation",
          },
          game_application: {
            name: "Free Play — Apply the Skill",
            duration_minutes: 15,
            instructions: "Small-sided game. Use what you just practised. No restrictions — just play.",
            thuto_observes: `How naturally the player applies ${focus.toLowerCase()} in the game`,
            coaching_intervention: "minimal",
          },
          cooldown: "5 min static stretch — quads, hamstrings, calves. Slow breathing.",
        };
      });
    };

    let days: ScheduleDay[] = [];
    let aiGenerated = false;
    let theme = "";
    let framework = "";

    try {
      const prompt = await buildPrompt();
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are THUTO, a grassroots football coach AI in Zimbabwe following FIFA methodology. Return ONLY valid JSON — no markdown fences, no explanation, no text before or after the JSON.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw: string = data?.response ?? data?.answer ?? "";
        const cleaned = raw.replace(/```json?\n?/gi, "").replace(/```\n?/gi, "").trim();
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) {
          try {
            const parsed = JSON.parse(m[0]) as { days?: ScheduleDay[]; session_theme?: string; framework_used?: string };
            if (Array.isArray(parsed.days) && parsed.days.length > 0) {
              days = parsed.days;
              theme = parsed.session_theme ?? "";
              framework = parsed.framework_used ?? "";
              aiGenerated = true;
            }
          } catch { /* JSON malformed — use fallback */ }
        }
      }
    } catch { /* network error — use fallback */ }

    if (days.length === 0) days = buildFallback();

    const built: Schedule = {
      id:            crypto.randomUUID(),
      week_start:    weekStart,
      schedule_json: { week_start: weekStart, session_theme: theme, framework_used: framework, days },
      ai_generated:  aiGenerated,
      is_active:     true,
    };

    setSchedule(built);
    setFrameworkUsed(framework);
    localStorage.setItem("thuto_training_schedule", JSON.stringify(built));
    saveSchedule({ ...built, cached_at: Date.now() }).catch(() => {});
    setShowSettings(false);
    setGenerating(false);
  };

  // ── Log session ──────────────────────────────────────────────────────────────

  const logSession = async (day: ScheduleDay) => {
    setLoggingDay(day.day);
    const summary = day.focus
      ? `${day.day} session: ${day.focus}. ${day.main_drill?.name ?? ""}`
      : `${day.day} training session`;
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `The player just completed this session: ${summary}. ${day.joy_prompt ? `Ask them: "${day.joy_prompt}"` : "Ask them one short encouraging reflection question."}`,
          system_prompt: "You are THUTO, a personal AI coach. Ask one warm, specific reflection question in 1-2 sentences. Use one Shona word naturally.",
        }),
      });
      const data = await res.json();
      const question: string = data?.response ?? data?.answer ?? "";
      if (question) localStorage.setItem("thuto_preload_message", question);
    } catch {
      localStorage.setItem("thuto_preload_message",
        `Zvakanaka on completing your ${day.day} session! 💪 ${day.joy_prompt ?? `How did the ${day.focus ?? "training"} feel today?`}`
      );
    } finally {
      localStorage.setItem("thuto_chat_open", "1");
      window.dispatchEvent(new StorageEvent("storage", { key: "thuto_chat_open", newValue: "1" }));
      setLoggingDay(null);
    }
  };

  // ── Ordered days ─────────────────────────────────────────────────────────────

  const days: ScheduleDay[] = (() => {
    if (!schedule?.schedule_json?.days) return [];
    const byName = new Map(schedule.schedule_json.days.map((d) => [d.day, d]));
    return ORDERED_DAYS.map(name => byName.get(name) ?? { day: name, is_rest: true });
  })();

  const weekStart = schedule?.schedule_json?.week_start
    ? new Date(schedule.schedule_json.week_start).toLocaleDateString("en-ZW", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const theme = schedule?.schedule_json?.session_theme ?? "";
  const fw    = (frameworkUsed || schedule?.schedule_json?.framework_used) ?? "";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4 pb-24 sm:p-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#1A6B3C]">THUTO Training</p>
            <h1 className="mt-1 text-2xl font-bold text-[#0D2B1A]">My Schedule</h1>
            {weekStart && <p className="mt-0.5 text-xs text-[#1A6B3C]/60">Week of {weekStart}</p>}
            {theme && <p className="mt-1 text-xs text-teal-600 font-medium italic">"{theme}"</p>}
            {fw && (
              <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
                {fw} Framework
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(v => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-card/60 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-card"
            >
              <Settings2 className="h-3.5 w-3.5" /> Settings
            </button>
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl bg-[#f0b429] px-4 py-2 text-xs font-bold text-[#1a3a1a] transition-colors hover:bg-[#e0a420] disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {schedule ? "Regenerate" : "Generate schedule"}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-card/60 p-5 space-y-5">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-teal-400" /> Training Preferences
            </p>

            {/* Preferred time */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Preferred time</p>
              <div className="flex gap-2">
                {(["morning", "afternoon", "evening"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => updatePrefs({ time_preference: t })}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-colors ${
                      prefs.time_preference === t
                        ? "border-teal-500/60 bg-teal-900/40 text-teal-300"
                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {t === "morning" ? "🌅" : t === "afternoon" ? "☀️" : "🌙"} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Training days */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Training days per week</p>
                <span className="text-sm font-bold text-teal-300">{prefs.days} days</span>
              </div>
              <input type="range" min={2} max={6} step={1} value={prefs.days}
                onChange={e => updatePrefs({ days: Number(e.target.value) })}
                className="w-full accent-teal-500" />
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
              </div>
            </div>

            {/* Session duration */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Session duration</p>
              <div className="flex gap-2">
                {[1, 1.5, 2].map(h => (
                  <button
                    key={h}
                    onClick={() => updatePrefs({ hours: h })}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${
                      prefs.hours === h
                        ? "border-teal-500/60 bg-teal-900/40 text-teal-300"
                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Your age</p>
                <span className="text-sm font-bold text-teal-300">{prefs.age} yrs · {stageFromAge(prefs.age)}</span>
              </div>
              <input type="range" min={8} max={35} step={1} value={prefs.age}
                onChange={e => updatePrefs({ age: Number(e.target.value) })}
                className="w-full accent-teal-500" />
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>8</span><span>12</span><span>15</span><span>18</span><span>35</span>
              </div>
            </div>

            {/* Position */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Position</p>
              <div className="flex flex-wrap gap-2">
                {["goalkeeper","defender","midfielder","winger","striker"].map(pos => (
                  <button
                    key={pos}
                    onClick={() => updatePrefs({ position: pos })}
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                      prefs.position === pos
                        ? "border-teal-500/60 bg-teal-900/40 text-teal-300"
                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateSchedule}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-500 disabled:opacity-60"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                : <><RefreshCw className="h-4 w-4" /> Build my schedule</>
              }
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !schedule && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 py-16 text-center">
            <Calendar className="mx-auto mb-4 h-10 w-10 text-white/20" />
            <p className="text-base font-semibold text-white">No schedule yet</p>
            <p className="mt-1 text-sm text-white/40">
              THUTO will build a personalised FIFA-framework plan for you
            </p>
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-bold text-[#1a3a1a] transition-colors hover:bg-[#e0a420] disabled:opacity-60"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan...</>
                : <><RefreshCw className="h-4 w-4" /> Generate my schedule</>
              }
            </button>
          </div>
        )}

        {/* Schedule */}
        {!loading && schedule && days.length > 0 && (
          <div className="space-y-3">
            {days.map(day => (
              <DayCard
                key={day.day}
                day={day}
                onLogSession={logSession}
                loggingDay={loggingDay}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
