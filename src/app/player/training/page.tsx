"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Calendar, RefreshCw, Settings2, ChevronDown, ChevronUp,
  Moon, Zap, Clock, Dumbbell, Flame, Wind, CheckCircle2,
  MessageCircle, Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

const ThutoChat = dynamic(() => import("@/components/thuto/ThutoChat"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Drill {
  name: string;
  duration_minutes: number;
  instructions: string;
  equipment_needed: string;
}

interface ScheduleDay {
  day: string;
  is_rest: boolean;
  focus?: string;
  drills?: Drill[];
  total_duration_minutes?: number;
  intensity?: "low" | "medium" | "high";
  pre_session_warmup?: string;
  post_session_cooldown?: string;
}

interface Schedule {
  id: string;
  week_start: string;
  schedule_json: { week_start: string; days: ScheduleDay[] };
  ai_generated: boolean;
  is_active: boolean;
}

interface TrainingPrefs {
  time_preference: "morning" | "afternoon" | "evening";
  days: number;
}

const PREFS_KEY = "thuto_training_prefs";
const ORDERED_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadPrefs(): TrainingPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as TrainingPrefs;
  } catch { /* ignore */ }
  return { time_preference: "morning", days: 4 };
}

function savePrefs(p: TrainingPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

// ── Sub-components ────────────────────────────────────────────────────────────

const INTENSITY_STYLES: Record<string, string> = {
  low:    "bg-blue-500/20 text-blue-300 border-blue-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  high:   "bg-red-500/20 text-red-300 border-red-500/30",
};

const INTENSITY_ICON: Record<string, React.ReactNode> = {
  low:    <Wind className="h-3 w-3" />,
  medium: <Flame className="h-3 w-3" />,
  high:   <Zap className="h-3 w-3" />,
};

function IntensityBadge({ level }: { level: string }) {
  const style = INTENSITY_STYLES[level] ?? INTENSITY_STYLES.medium;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${style}`}>
      {INTENSITY_ICON[level] ?? <Flame className="h-3 w-3" />}
      {level}
    </span>
  );
}

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

  const drills = day.drills ?? [];
  const isLogging = loggingDay === day.day;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/60 transition-all">
      {/* Card header — always visible, click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between px-4 py-4 text-left"
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-white">{day.day}</p>
            {day.intensity && <IntensityBadge level={day.intensity} />}
          </div>
          {day.focus && (
            <p className="mt-1 text-sm text-teal-300">{day.focus}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-white/40">
            {day.total_duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {day.total_duration_minutes} min
              </span>
            )}
            {drills.length > 0 && (
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {drills.length} drill{drills.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {/* Drill name pills — collapsed preview */}
          {!expanded && drills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {drills.slice(0, 3).map((d) => (
                <span key={d.name} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
                  {d.name}
                </span>
              ))}
              {drills.length > 3 && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/30">
                  +{drills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 text-white/30">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-4">
          {/* Warmup */}
          {day.pre_session_warmup && (
            <div className="rounded-xl bg-green-900/20 border border-green-500/20 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-green-400">
                Pre-session warmup
              </p>
              <p className="text-sm text-white/70 leading-relaxed">{day.pre_session_warmup}</p>
            </div>
          )}

          {/* Drills */}
          {drills.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                Drills
              </p>
              {drills.map((drill, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{drill.name}</p>
                    <span className="flex-shrink-0 flex items-center gap-1 text-xs text-white/40">
                      <Clock className="h-3 w-3" />{drill.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{drill.instructions}</p>
                  {drill.equipment_needed && (
                    <p className="text-xs text-white/30">
                      Equipment: {drill.equipment_needed}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cooldown */}
          {day.post_session_cooldown && (
            <div className="rounded-xl bg-blue-900/20 border border-blue-500/20 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-400">
                Post-session cooldown
              </p>
              <p className="text-sm text-white/70 leading-relaxed">{day.post_session_cooldown}</p>
            </div>
          )}

          {/* Log session button */}
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
  const [schedule, setSchedule]       = useState<Schedule | null>(null);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs]             = useState<TrainingPrefs>({ time_preference: "morning", days: 4 });
  const [loggingDay, setLoggingDay]   = useState<string | null>(null);
  const [error, setError]             = useState("");

  // Load prefs from localStorage on mount
  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // Fetch active schedule on mount
  useEffect(() => {
    api.get("/training/schedule")
      .then((res) => setSchedule(res.data?.schedule ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updatePrefs = (patch: Partial<TrainingPrefs>) => {
    const updated = { ...prefs, ...patch };
    setPrefs(updated);
    savePrefs(updated);
  };

  const generateSchedule = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post("/training/schedule/generate", {
        days:             prefs.days,
        hours_per_session: 1,
        time_preference:  prefs.time_preference,
      });
      setSchedule(res.data?.schedule ?? null);
      setShowSettings(false);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Could not generate schedule. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const logSession = async (day: ScheduleDay) => {
    setLoggingDay(day.day);
    const summary = day.focus
      ? `${day.day} session: ${day.focus}. ${day.drills?.map((d) => d.name).join(", ") ?? ""}`
      : `${day.day} training session`;
    try {
      const res = await api.post("/thuto/reflect", { session_summary: summary });
      const question: string = res.data?.answer ?? res.data?.response ?? "";
      if (question) {
        localStorage.setItem("thuto_preload_message", question);
      }
    } catch {
      // Fallback preload message if API fails
      localStorage.setItem(
        "thuto_preload_message",
        `Zvakanaka on completing your ${day.day} session! 💪 How did the ${day.focus ?? "training"} feel today?`
      );
    } finally {
      localStorage.setItem("thuto_chat_open", "1");
      // Trigger ThutoChat to open by dispatching a storage event
      window.dispatchEvent(new StorageEvent("storage", {
        key: "thuto_chat_open",
        newValue: "1",
      }));
      setLoggingDay(null);
    }
  };

  // ── Ordered days from schedule ─────────────────────────────────────────────
  const days: ScheduleDay[] = (() => {
    if (!schedule?.schedule_json?.days) return [];
    const byName = new Map(schedule.schedule_json.days.map((d) => [d.day, d]));
    return ORDERED_DAYS.map(
      (name) => byName.get(name) ?? { day: name, is_rest: true }
    );
  })();

  const weekStart = schedule?.schedule_json?.week_start
    ? new Date(schedule.schedule_json.week_start).toLocaleDateString("en-ZW", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4 pb-24 sm:p-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#1A6B3C]">
              THUTO Training
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#0D2B1A]">My Schedule</h1>
            {weekStart && (
              <p className="mt-0.5 text-xs text-[#1A6B3C]/60">
                Week of {weekStart}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-card/60 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-card"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </button>
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl bg-[#f0b429] px-4 py-2 text-xs font-bold text-[#1a3a1a] transition-colors hover:bg-[#e0a420] disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {schedule ? "Regenerate" : "Generate schedule"}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-card/60 p-5 space-y-5">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-teal-400" />
              Training Preferences
            </p>

            {/* Preferred time */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                Preferred training time
              </p>
              <div className="flex gap-2">
                {(["morning", "afternoon", "evening"] as const).map((t) => (
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

            {/* Training days slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Training days per week
                </p>
                <span className="text-sm font-bold text-teal-300">{prefs.days} days</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={prefs.days}
                onChange={(e) => updatePrefs({ days: Number(e.target.value) })}
                className="w-full accent-teal-500"
              />
              <div className="flex justify-between text-xs text-white/25 mt-1">
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
              </div>
            </div>

            {/* Update schedule button */}
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-500 disabled:opacity-60"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Update schedule</>
              )}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
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
              THUTO will build a personalised 7-day plan for you
            </p>
            <button
              onClick={generateSchedule}
              disabled={generating}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-bold text-[#1a3a1a] transition-colors hover:bg-[#e0a420] disabled:opacity-60"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Building your plan...</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Generate my schedule</>
              )}
            </button>
          </div>
        )}

        {/* 7-day calendar grid */}
        {!loading && schedule && days.length > 0 && (
          <div className="space-y-3">
            {days.map((day) => (
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

      {/* THUTO chat widget — available on this page */}
      <ThutoChat />
    </div>
  );
}
