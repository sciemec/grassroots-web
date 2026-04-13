"use client";

/**
 * PITCH MODE — GrassRoots Sports
 * Full-screen on-pitch training companion.
 * Works offline. Keeps screen awake. Walks player through every drill.
 *
 * Tab 1: Training Drills — from weekly schedule (existing)
 * Tab 2: Conditioning   — exercise cards with timers (new)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  getSchedule,
  saveSchedule,
  savePendingSession,
  type CachedSchedule,
  type ScheduleDay,
  type Drill,
} from "@/lib/offlineDB";
import warmupKnowledge from "@/data/warmup-knowledge.json";
import type { ExerciseCard, ExerciseCategory, IntensityFelt } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";
import { saveSession as saveCondSession } from "@/lib/conditioning/storage";

// Lazy-load pose checker — loads MediaPipe (~8 MB) only when player taps "Check form"
const PitchPoseCheck = dynamic(
  () => import("@/components/video/PitchPoseCheck").then((m) => ({ default: m.PitchPoseCheck })),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "loading" | "rest_day" | "no_schedule" | "ready"
  | "warmup"  | "drill"    | "rest"        | "cooldown" | "done"
  | "cond_active" | "cond_question" | "cond_done";

type ModeTab = "drills" | "conditioning";

interface SessionState {
  day: ScheduleDay;
  drillIndex: number;
  scheduleId: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const THUTO_MESSAGES = [
  "Simba riri mukati mako — the strength is inside you!",
  "Harare, Bulawayo, Mutare — they are all watching. Go.",
  "Every rep makes the next scout visit worth it.",
  "Kushanda — hard work speaks louder than talent.",
  "Mberi — keep going. Rest is earned, not given.",
  "Zimbabwe's best trained like this before anyone knew their name.",
  "Your body remembers every session. Make it remember this one.",
  "Concentrate. Focus. This drill is your exam.",
  "Champions in Harare sweat before they shine.",
  "Ramba iwe — stay with it. Don't quit now.",
  "Feel your feet. Own the ground beneath you.",
  "The ball doesn't care how tired you are. Neither should you.",
  "This is where average players stop. Keep going.",
  "Musandirege — don't stop. One more rep.",
  "You chose this. Every second proves it.",
  "Dynamos didn't build their legacy by quitting at this point.",
  "Strength grows in the last 30 seconds. Stay.",
  "THUTO sees every rep. Every single one counts.",
  "Pain is temporary. The scout's memory of you is not.",
  "Zviri nani — it gets better. Push through.",
];

const CONDITIONING_CATEGORIES: { id: ExerciseCategory; label: string; emoji: string; color: string }[] = [
  { id: "fifa_warmup", label: "FIFA 11+",  emoji: "🏃", color: "border-teal-400/40 bg-teal-400/10 text-teal-300" },
  { id: "aerobic",     label: "Stamina",   emoji: "💨", color: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  { id: "hiit",        label: "HIIT",      emoji: "🔥", color: "border-red-400/40 bg-red-400/10 text-red-300" },
  { id: "strength",    label: "Strength",  emoji: "💪", color: "border-purple-400/40 bg-purple-400/10 text-purple-300" },
  { id: "agility",     label: "Agility",   emoji: "⚡", color: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300" },
  { id: "plyometrics", label: "Power",     emoji: "🚀", color: "border-indigo-400/40 bg-indigo-400/10 text-indigo-300" },
];

const INTENSITY_OPTIONS: { value: IntensityFelt; label: string; emoji: string }[] = [
  { value: "easy",     label: "Easy",     emoji: "😌" },
  { value: "moderate", label: "Moderate", emoji: "💪" },
  { value: "hard",     label: "Hard",     emoji: "🔥" },
  { value: "max",      label: "Max",      emoji: "💀" },
];

const REST_BETWEEN_DRILLS_SEC   = 45;
const REST_BETWEEN_COND_SEC     = 25; // shorter — conditioning uses its own question screen

// ─── Audio ────────────────────────────────────────────────────────────────────

function playBeep(type: "countdown" | "end"): void {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "countdown") {
      osc.frequency.value = 880;
      gain.gain.value     = 0.4;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.value = 440;
      gain.gain.value     = 0.5;
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch { /* Safari / blocked */ }
}

// ─── SVG Timer Ring ───────────────────────────────────────────────────────────

function TimerRing({
  seconds,
  total,
  color = "white",
}: {
  seconds: number;
  total: number;
  color?: string;
}) {
  const radius       = 80;
  const circumference = 2 * Math.PI * radius;
  const progress     = total > 0 ? seconds / total : 0;
  const offset       = circumference * (1 - progress);

  return (
    <svg width="200" height="200" className="absolute inset-0 m-auto">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
      <circle
        cx="100" cy="100" r={radius}
        fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PitchModePage() {
  const router = useRouter();

  // ── Existing training drill state ──────────────────────────────────────────
  const [phase, setPhase]               = useState<Phase>("loading");
  const [session, setSession]           = useState<SessionState | null>(null);
  const [secondsLeft, setSecondsLeft]   = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [motivationMsg, setMotivationMsg] = useState("");
  const [offline, setOffline]           = useState(false);
  const [showFormCheck, setShowFormCheck] = useState(false);
  const [warmupExerciseIdx, setWarmupExerciseIdx] = useState(0);

  // ── Mode tab ──────────────────────────────────────────────────────────────
  const [modeTab, setModeTab]           = useState<ModeTab>("drills");

  // ── Conditioning state ────────────────────────────────────────────────────
  const [allCondCards, setAllCondCards]         = useState<ExerciseCard[]>(SEED_CARDS);
  const [condCards, setCondCards]               = useState<ExerciseCard[]>([]);
  const [condCategory, setCondCategory]         = useState<ExerciseCategory | null>(null);
  const [condIndex, setCondIndex]               = useState(0);
  const [condCompleted, setCondCompleted]       = useState<string[]>([]);
  const [condJoy, setCondJoy]                   = useState("");
  const [condIntensity, setCondIntensity]       = useState<IntensityFelt | null>(null);
  const [condSaved, setCondSaved]               = useState(false);
  const [todayCondCards, setTodayCondCards]     = useState<ExerciseCard[]>([]);
  const [condTotalElapsed, setCondTotalElapsed] = useState(0); // seconds
  const condElapsedRef                          = useRef<ReturnType<typeof setInterval> | null>(null);

  const wakeLockRef    = useRef<WakeLockSentinel | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef  = useRef<() => void>(() => {});

  // ── Wake Lock ──────────────────────────────────────────────────────────────

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch { /* not available */ }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && phase !== "done" && phase !== "loading")
        acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, acquireWakeLock]);

  // ── Fullscreen ────────────────────────────────────────────────────────────

  const enterFullscreen = () => {
    try { document.documentElement.requestFullscreen?.(); } catch { /* silent */ }
  };
  const exitFullscreen = () => {
    try { if (document.fullscreenElement) document.exitFullscreen?.(); } catch { /* silent */ }
  };

  // ── Countdown Timer ───────────────────────────────────────────────────────

  const startCountdown = useCallback((durationSec: number, onComplete: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTotalSeconds(durationSec);
    setSecondsLeft(durationSec);
    onCompleteRef.current = onComplete;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if ([10, 5, 3, 2, 1].includes(next)) playBeep("countdown");
        if (next <= 0) {
          clearInterval(timerRef.current!);
          playBeep("end");
          onCompleteRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, []);

  // ── Random motivation ─────────────────────────────────────────────────────

  const newMotivation = () => {
    setMotivationMsg(THUTO_MESSAGES[Math.floor(Math.random() * THUTO_MESSAGES.length)]);
  };

  // ── Load training schedule ────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      let scheduleData: CachedSchedule | null = null;
      try {
        const res = await api.get("/training/schedule");
        const raw = res.data?.schedule;
        if (raw) {
          scheduleData = { ...raw, cached_at: Date.now() };
          await saveSchedule(scheduleData!);
        }
      } catch {
        setOffline(true);
        scheduleData = await getSchedule();
      }

      if (!scheduleData) { setPhase("no_schedule"); return; }

      const today    = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const todayData = scheduleData.schedule_json?.days?.find(
        (d) => d.day.toLowerCase() === today.toLowerCase()
      );

      if (!todayData)   { setPhase("no_schedule"); return; }
      if (todayData.is_rest) { setPhase("rest_day"); return; }

      setSession({ day: todayData, drillIndex: 0, scheduleId: scheduleData.id });
      setPhase("ready");
    }

    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (condElapsedRef.current) clearInterval(condElapsedRef.current);
      releaseWakeLock();
      exitFullscreen();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load exercise cards + today's conditioning plan ────────────────────────

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    if (API) {
      fetch(`${API}/exercise-cards?per_page=100`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const loaded: ExerciseCard[] = Array.isArray(data?.data) ? data.data : SEED_CARDS;
          setAllCondCards(loaded);

          // Load today's cards from week plan
          const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
          const planRaw =
            localStorage.getItem("gs_conditioning_plan") ??
            localStorage.getItem("gs_coach_week_template");
          if (planRaw) {
            const plan = JSON.parse(planRaw) as Record<string, string[]>;
            const ids  = plan[today] ?? [];
            const todays = ids.map((id) => loaded.find((c) => c.id === id)).filter(Boolean) as ExerciseCard[];
            setTodayCondCards(todays);
          }
        })
        .catch(() => {});
    } else {
      // No API — check localStorage plan against seeds
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const planRaw =
        localStorage.getItem("gs_conditioning_plan") ??
        localStorage.getItem("gs_coach_week_template");
      if (planRaw) {
        const plan = JSON.parse(planRaw) as Record<string, string[]>;
        const ids  = plan[today] ?? [];
        const todays = ids.map((id) => SEED_CARDS.find((c) => c.id === id)).filter(Boolean) as ExerciseCard[];
        setTodayCondCards(todays);
      }
    }
  }, []);

  // ── Conditioning category selection ───────────────────────────────────────

  function selectCondCategory(cat: ExerciseCategory) {
    setCondCategory(cat);
    const cards = allCondCards.filter((c) => c.category === cat);
    setCondCards(cards);
  }

  function selectTodayPlan() {
    setCondCategory(null);
    setCondCards(todayCondCards);
  }

  // ── Start conditioning session ────────────────────────────────────────────

  const startConditioning = useCallback(
    (cards: ExerciseCard[]) => {
      if (cards.length === 0) return;
      setCondCards(cards);
      setCondCompleted([]);
      setCondIndex(0);
      setCondTotalElapsed(0);
      setCondJoy("");
      setCondIntensity(null);
      setCondSaved(false);
      enterFullscreen();
      acquireWakeLock();
      newMotivation();

      // Elapsed time counter
      if (condElapsedRef.current) clearInterval(condElapsedRef.current);
      condElapsedRef.current = setInterval(() => {
        setCondTotalElapsed((t) => t + 1);
      }, 1000);

      runCondCard(cards, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acquireWakeLock]
  );

  // ── Run a conditioning card ───────────────────────────────────────────────

  const runCondCard = useCallback(
    (cards: ExerciseCard[], index: number) => {
      if (index >= cards.length) return;
      const card = cards[index];
      setCondIndex(index);
      setPhase("cond_active");
      newMotivation();

      // Timed card → auto-advance
      if (card.duration_seconds) {
        startCountdown(card.duration_seconds, () => {
          setCondCompleted((prev) => Array.from(new Set([...prev, card.id])));
          if (index + 1 >= cards.length) {
            clearInterval(condElapsedRef.current!);
            setPhase("cond_done");
          } else {
            setPhase("cond_question");
            startCountdown(REST_BETWEEN_COND_SEC, () => runCondCard(cards, index + 1));
          }
        });
      }
      // Reps-only card → wait for manual Done tap (no auto-advance)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startCountdown]
  );

  // Manual "Done" tap during a card
  const handleCondDone = useCallback(
    (cards: ExerciseCard[], index: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setCondCompleted((prev) => Array.from(new Set([...prev, cards[index].id])));
      if (index + 1 >= cards.length) {
        clearInterval(condElapsedRef.current!);
        setPhase("cond_done");
      } else {
        setPhase("cond_question");
        startCountdown(REST_BETWEEN_COND_SEC, () => runCondCard(cards, index + 1));
      }
    },
    [startCountdown, runCondCard]
  );

  // Skip THUTO question and go straight to next card
  const skipCondQuestion = useCallback(
    (cards: ExerciseCard[], nextIndex: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      runCondCard(cards, nextIndex);
    },
    [runCondCard]
  );

  // ── Save conditioning session ─────────────────────────────────────────────

  function saveAndFinishCond() {
    if (!condIntensity || condSaved) return;
    setCondSaved(true);

    saveCondSession({
      id:              `cond-${Date.now()}`,
      session_type:    condCategory ?? "full",
      cards_used:      condCompleted,
      duration_actual: Math.max(1, Math.round(condTotalElapsed / 60)),
      intensity_felt:  condIntensity,
      joy_response:    condJoy.trim() || null,
      notes:           null,
      logged_at:       new Date().toISOString(),
    });

    // Non-blocking API sync
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token && process.env.NEXT_PUBLIC_API_URL) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/conditioning/sessions`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          session_type:    condCategory ?? "full",
          cards_used:      condCompleted,
          duration_actual: Math.max(1, Math.round(condTotalElapsed / 60)),
          intensity_felt:  condIntensity,
          joy_response:    condJoy.trim() || null,
        }),
      }).catch(() => {});
    }

    releaseWakeLock();
    exitFullscreen();
    router.push("/player");
  }

  // ── Existing drill handlers ───────────────────────────────────────────────

  const startSession = () => {
    enterFullscreen();
    acquireWakeLock();
    newMotivation();
    setPhase("warmup");
    startCountdown(60 * 3, () => startNextDrill(0));
  };

  const startNextDrill = useCallback(
    (index: number) => {
      if (!session) return;
      const drills = session.day.drills ?? [];
      if (index >= drills.length) {
        setPhase("cooldown");
        startCountdown(60 * 2, () => setPhase("done"));
        return;
      }
      const drill = drills[index];
      setSession((prev) => (prev ? { ...prev, drillIndex: index } : prev));
      setPhase("drill");
      newMotivation();
      startCountdown(drill.duration_minutes * 60, () => {
        if (index + 1 < drills.length) {
          setPhase("rest");
          startCountdown(REST_BETWEEN_DRILLS_SEC, () => startNextDrill(index + 1));
        } else {
          startNextDrill(index + 1);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session]
  );

  const saveDrillSession = async (feeling: "tough" | "amazing") => {
    if (!session) return;
    const drills  = session.day.drills ?? [];
    const payload = {
      schedule_id:       session.scheduleId,
      day_name:          session.day.day,
      drills_completed:  drills.length,
      total_drills:      drills.length,
      feeling,
      completed_at:      new Date().toISOString(),
    };
    try { await api.post("/training/sessions", payload); }
    catch { await savePendingSession({ localId: `${Date.now()}-${Math.random()}`, synced: false, ...payload }); }

    releaseWakeLock();
    exitFullscreen();
    router.push("/player");
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const currentDrill: Drill | null =
    session && phase === "drill" && session.day.drills
      ? session.day.drills[session.drillIndex] ?? null : null;

  const drillsTotal  = session?.day.drills?.length ?? 0;
  const drillNumber  = (session?.drillIndex ?? 0) + 1;
  const currentCard  = condCards[condIndex] ?? null;
  const nextCard     = condCards[condIndex + 1] ?? null;

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const condEstMin = Math.round(
    condCards.reduce((t, c) => t + (c.duration_seconds ?? 120), 0) / 60
  );

  // ─── Base full-screen class ─────────────────────────────────────────────────

  const BASE = "fixed inset-0 flex flex-col items-center justify-center bg-[#15803d] text-white select-none overflow-hidden";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className={BASE}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="mt-4 text-lg font-medium">Loading your session…</p>
      </div>
    );
  }

  // ── No schedule ────────────────────────────────────────────────────────────
  if (phase === "no_schedule") {
    return (
      <div className={BASE}>
        <div className="w-full max-w-sm px-6 text-center">
          <p className="text-5xl">📋</p>
          <h1 className="mt-4 text-2xl font-bold">No session today</h1>
          <p className="mt-2 text-base text-white/70">Ask THUTO to create your 7-day schedule first.</p>
          <button
            onClick={() => router.push("/player/training")}
            className="mt-8 w-full rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#15803d]"
          >
            Go to Training Plan
          </button>

          {/* Conditioning alternative */}
          <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left">
            <p className="text-sm font-bold text-white">⚡ No schedule? Try Conditioning</p>
            <p className="mt-1 text-xs text-white/60">Pick a category and THUTO guides you through.</p>
            <button
              onClick={() => { setModeTab("conditioning"); setPhase("ready"); }}
              className="mt-3 w-full rounded-xl bg-[#f0b429] py-2.5 text-sm font-bold text-[#1a3a1a]"
            >
              Start Conditioning →
            </button>
          </div>

          <button onClick={() => router.push("/player")} className="mt-4 block text-center text-sm text-white/50 underline">
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Rest day ───────────────────────────────────────────────────────────────
  if (phase === "rest_day") {
    return (
      <div className={BASE}>
        <div className="w-full max-w-sm px-6 text-center">
          <p className="text-6xl">😴</p>
          <h1 className="mt-4 text-3xl font-bold">Rest Day</h1>
          <p className="mt-3 text-lg text-white/80">Today is recovery. Eat well. Sleep. Come back stronger.</p>
          <p className="mt-2 text-base italic text-white/60">&quot;Zororo ndirwo ruzivo — rest is wisdom.&quot;</p>

          {/* Conditioning alternative */}
          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-left">
            <p className="text-sm font-bold text-white">🏃 Light conditioning available</p>
            <p className="mt-1 text-xs text-white/60">FIFA 11+ warm-up or mobility work recommended on rest days.</p>
            <button
              onClick={() => {
                selectCondCategory("fifa_warmup");
                setModeTab("conditioning");
                setPhase("ready");
              }}
              className="mt-3 w-full rounded-xl bg-teal-400 py-2.5 text-sm font-bold text-[#1a3a1a]"
            >
              FIFA 11+ Warm-Up →
            </button>
          </div>

          <button
            onClick={() => router.push("/player")}
            className="mt-6 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#15803d]"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Ready (tabbed) ─────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <div className={BASE}>
        {offline && (
          <div className="absolute top-4 left-0 right-0 mx-4 rounded-xl border border-yellow-400/40 bg-yellow-500/20 px-4 py-2 text-center text-sm text-yellow-200">
            Offline — using cached schedule
          </div>
        )}

        <div className="w-full max-w-sm px-6">
          {/* Tab bar */}
          <div className="mb-5 flex gap-1 rounded-2xl border border-white/20 bg-white/10 p-1">
            <button
              onClick={() => setModeTab("drills")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                modeTab === "drills" ? "bg-white text-[#15803d]" : "text-white/60"
              }`}
            >
              🏋️ Training Drills
            </button>
            <button
              onClick={() => setModeTab("conditioning")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
                modeTab === "conditioning" ? "bg-[#f0b429] text-[#1a3a1a]" : "text-white/60"
              }`}
            >
              ⚡ Conditioning
            </button>
          </div>

          {/* ── Drills tab ─────────────────────────────────────────────── */}
          {modeTab === "drills" && (
            <>
              {session ? (
                <>
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
                    {session.day.day} · {session.day.intensity?.toUpperCase() ?? "MEDIUM"} INTENSITY
                  </p>
                  <h1 className="mt-2 text-3xl font-bold">{session.day.focus}</h1>
                  <p className="mt-1 text-white/70">{session.day.total_duration_minutes} min total</p>

                  <div className="mt-6 max-h-48 space-y-2 overflow-y-auto">
                    {session.day.drills?.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{d.name}</p>
                          <p className="text-sm text-white/60">{d.duration_minutes} min · {d.equipment_needed}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startSession}
                    className="mt-6 w-full rounded-2xl bg-white py-5 text-xl font-bold text-[#15803d] transition-transform active:scale-95"
                  >
                    START SESSION →
                  </button>
                  <button
                    onClick={() => router.push("/player/session")}
                    className="mt-3 w-full rounded-2xl border border-white/20 py-3 text-sm text-white/60 hover:text-white/80"
                  >
                    🎙 Switch to Voice Mode
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-white/70">No training session scheduled for today.</p>
                  <button
                    onClick={() => router.push("/player/training")}
                    className="mt-4 w-full rounded-2xl bg-white py-4 text-base font-bold text-[#15803d]"
                  >
                    Build a Schedule
                  </button>
                </>
              )}
            </>
          )}

          {/* ── Conditioning tab ───────────────────────────────────────── */}
          {modeTab === "conditioning" && (
            <div className="space-y-4">

              {/* Today's plan (if available) */}
              {todayCondCards.length > 0 && (
                <button
                  onClick={selectTodayPlan}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    condCategory === null && condCards.length > 0
                      ? "border-[#f0b429] bg-[#f0b429]/10"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <p className="text-sm font-bold text-white">📅 Today's conditioning plan</p>
                  <p className="mt-0.5 text-xs text-white/60">
                    {todayCondCards.length} exercises from your week plan
                  </p>
                </button>
              )}

              {/* Category picker */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                  Or pick a category
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONING_CATEGORIES.map(({ id, label, emoji, color }) => (
                    <button
                      key={id}
                      onClick={() => selectCondCategory(id)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                        condCategory === id
                          ? color
                          : "border-white/10 bg-white/5 text-white/70"
                      }`}
                    >
                      <span className="block text-xl">{emoji}</span>
                      <span className="mt-1 block text-sm font-bold">{label}</span>
                      <span className="text-[10px] text-white/40">
                        {allCondCards.filter((c) => c.category === id).length} exercises
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected count + Start */}
              {condCards.length > 0 && (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                  <p className="text-sm font-semibold text-white">
                    {condCards.length} exercise{condCards.length !== 1 ? "s" : ""} · ~{condEstMin} min
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {condCategory
                      ? CONDITIONING_CATEGORIES.find((c) => c.id === condCategory)?.label
                      : "Today's plan"}{" "}
                    · FIFA 11+ included
                  </p>
                  <button
                    onClick={() => startConditioning(condCards)}
                    className="mt-3 w-full rounded-2xl bg-[#f0b429] py-3.5 text-base font-bold text-[#1a3a1a] transition-transform active:scale-95"
                  >
                    START CONDITIONING →
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => router.push("/player")} className="mt-4 block w-full text-center text-sm text-white/40 underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Warmup (existing training drills) ──────────────────────────────────────
  if (phase === "warmup") {
    return (
      <div className={BASE}>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          </div>
        </div>
        <p className="mt-6 text-xl font-bold uppercase tracking-widest">Warm Up</p>

        <div className="mt-3 w-full max-w-xs space-y-1 px-6">
          {warmupKnowledge.warmup_phases[2].exercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setWarmupExerciseIdx(i); setShowFormCheck(true); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                warmupExerciseIdx === i && showFormCheck
                  ? "bg-white/25 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/15"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="font-medium">{(ex as { name: string }).name}</span>
              <span className="ml-auto text-[10px] text-white/40">tap to check form</span>
            </button>
          ))}
        </div>

        <p className="mt-4 max-w-xs px-6 text-center text-sm italic text-white/60">
          &quot;{motivationMsg}&quot;
        </p>

        {showFormCheck && (
          <PitchPoseCheck
            currentExercise={(warmupKnowledge.warmup_phases[2].exercises[warmupExerciseIdx] as { name: string }).name}
            onClose={() => setShowFormCheck(false)}
          />
        )}
      </div>
    );
  }

  // ── Drill (existing training drills) ──────────────────────────────────────
  if (phase === "drill" && currentDrill) {
    return (
      <div className={BASE}>
        <p className="absolute top-6 text-sm font-semibold uppercase tracking-widest text-white/50">
          Drill {drillNumber} of {drillsTotal}
        </p>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          </div>
        </div>
        <h2 className="mt-6 px-6 text-center text-2xl font-bold">{currentDrill.name}</h2>
        <p className="mt-2 max-w-xs px-6 text-center text-sm text-white/70">{currentDrill.instructions}</p>
        {currentDrill.equipment_needed && currentDrill.equipment_needed !== "none" && (
          <p className="mt-2 text-xs text-white/40">🎽 {currentDrill.equipment_needed}</p>
        )}
        <p className="absolute bottom-8 max-w-xs px-6 text-center text-sm italic text-white/60">
          &quot;{motivationMsg}&quot;
        </p>
      </div>
    );
  }

  // ── Rest between drills ────────────────────────────────────────────────────
  if (phase === "rest") {
    const nextDrill = session?.day.drills?.[session.drillIndex + 1];
    return (
      <div className={BASE}>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{secondsLeft}</p>
            <p className="text-sm text-white/60">REST</p>
          </div>
        </div>
        <p className="mt-6 text-xl font-semibold text-white/80">Catch your breath</p>
        {nextDrill && (
          <p className="mt-3 text-sm text-white/50">
            Next: <span className="font-semibold text-white">{nextDrill.name}</span>
          </p>
        )}
      </div>
    );
  }

  // ── Cooldown ───────────────────────────────────────────────────────────────
  if (phase === "cooldown") {
    return (
      <div className={BASE}>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          </div>
        </div>
        <p className="mt-8 text-xl font-bold uppercase tracking-widest">Cool Down</p>
        <p className="mt-3 max-w-xs px-6 text-center text-sm italic text-white/70">
          {session?.day.post_session_cooldown ?? "Static stretches. Breathe slowly."}
        </p>
      </div>
    );
  }

  // ── Done (training drills) ─────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className={BASE}>
        <div className="px-8 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-bold">Session Complete!</h1>
          <p className="mt-2 text-lg text-white/70">
            {drillsTotal} drill{drillsTotal !== 1 ? "s" : ""} done — {session?.day.total_duration_minutes} min
          </p>
          <p className="mt-4 text-base italic text-white/60">&quot;Zvakanaka zvakaitwa — well done!&quot;</p>
          <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-white/60">How did it feel?</p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => saveDrillSession("tough")}
              className="flex-1 rounded-2xl border border-white/30 bg-white/15 py-5 text-lg font-bold transition-transform active:scale-95"
            >
              😤 Tough but done
            </button>
            <button
              onClick={() => saveDrillSession("amazing")}
              className="flex-1 rounded-2xl bg-white py-5 text-lg font-bold text-[#15803d] transition-transform active:scale-95"
            >
              🔥 Felt amazing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONDITIONING PHASES
  // ══════════════════════════════════════════════════════════════════════════

  // ── Conditioning — Active card ─────────────────────────────────────────────
  if (phase === "cond_active" && currentCard) {
    const progress = condIndex + 1;
    const isTimed  = !!currentCard.duration_seconds;

    return (
      <div className={`${BASE} bg-[#1a3d26]`}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#f0b429] transition-all"
            style={{ width: `${(condIndex / condCards.length) * 100}%` }}
          />
        </div>

        <p className="absolute top-5 text-sm font-semibold uppercase tracking-widest text-white/40">
          Exercise {progress} of {condCards.length}
        </p>

        {/* Timer ring (timed) or reps display */}
        {isTimed ? (
          <div className="relative flex h-[200px] w-[200px] items-center justify-center">
            <TimerRing seconds={secondsLeft} total={totalSeconds} color="#f0b429" />
            <div className="text-center">
              <p className="text-5xl font-bold tabular-nums text-[#f0b429]">
                {formatTime(secondsLeft)}
              </p>
              <p className="text-xs text-white/50">remaining</p>
            </div>
          </div>
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-[#f0b429]">{currentCard.reps}</p>
              <p className="mt-1 text-sm text-white/50">target reps</p>
            </div>
          </div>
        )}

        <h2 className="mt-4 px-6 text-center text-2xl font-bold">{currentCard.name}</h2>

        {/* Instructions — show first 2 steps */}
        <div className="mt-3 w-full max-w-xs space-y-1.5 px-6">
          {currentCard.instructions.slice(0, 2).map((step, i) => (
            <div key={i} className="flex gap-2 rounded-xl bg-white/10 px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/30 text-[10px] font-bold text-[#f0b429]">
                {i + 1}
              </span>
              <p className="text-xs text-white/80">{step}</p>
            </div>
          ))}
        </div>

        {/* THUTO coaching cue */}
        <p className="mt-3 max-w-xs px-6 text-center text-xs italic text-[#f0b429]/80">
          &quot;{motivationMsg}&quot;
        </p>

        {/* Done / next button */}
        <button
          onClick={() => handleCondDone(condCards, condIndex)}
          className="absolute bottom-8 left-6 right-6 rounded-2xl bg-[#f0b429] py-4 text-base font-bold text-[#1a3a1a] transition-transform active:scale-95"
        >
          {condIndex + 1 >= condCards.length ? "Finish Session" : "Done — Next Exercise"}
        </button>
      </div>
    );
  }

  // ── Conditioning — THUTO question between exercises ────────────────────────
  if (phase === "cond_question" && currentCard) {
    return (
      <div className={`${BASE} bg-[#1a3d26]`}>
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-[#f0b429] transition-all"
            style={{ width: `${((condIndex + 1) / condCards.length) * 100}%` }}
          />
        </div>

        {/* Countdown ring — subtle */}
        <div className="relative flex h-[140px] w-[140px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} color="rgba(240,180,41,0.5)" />
          <p className="text-3xl font-bold tabular-nums text-white/60">{secondsLeft}</p>
        </div>

        {/* THUTO question */}
        <div className="mx-6 mt-5 max-w-xs rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-5 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]">
            THUTO asks
          </p>
          <p className="text-base italic leading-relaxed text-white">
            {currentCard.thuto_question}
          </p>
        </div>

        {/* What good feels like */}
        <p className="mt-4 max-w-xs px-6 text-center text-xs italic text-white/40">
          {currentCard.success_feels_like}
        </p>

        {/* Next card preview */}
        {nextCard && (
          <p className="mt-4 text-sm text-white/40">
            Next: <span className="font-semibold text-white">{nextCard.name}</span>
          </p>
        )}

        <button
          onClick={() => skipCondQuestion(condCards, condIndex + 1)}
          className="absolute bottom-8 left-6 right-6 rounded-2xl border border-white/30 bg-white/10 py-4 text-base font-bold text-white transition-transform active:scale-95"
        >
          Ready for next →
        </button>
      </div>
    );
  }

  // ── Conditioning — Done + Joy prompt ──────────────────────────────────────
  if (phase === "cond_done") {
    const totalMin = Math.max(1, Math.round(condTotalElapsed / 60));
    const lastCard = condCards[condCards.length - 1];

    return (
      <div className={`${BASE} bg-[#1a3d26] justify-start overflow-y-auto pt-12 pb-24`}>
        <div className="w-full max-w-sm px-6 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-bold">Conditioning Complete!</h1>
          <p className="mt-2 text-base text-white/70">
            {condCompleted.length} exercise{condCompleted.length !== 1 ? "s" : ""} · {totalMin} min
          </p>
          <p className="mt-3 text-sm italic text-white/50">
            &quot;Zvakanaka zvakaitwa — well done!&quot;
          </p>

          {/* Joy prompt */}
          {lastCard && (
            <div className="mt-6 rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-4 text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#f0b429]">
                THUTO's joy prompt
              </p>
              <p className="text-sm italic text-white/80">{lastCard.thuto_question}</p>
              <textarea
                value={condJoy}
                onChange={(e) => setCondJoy(e.target.value)}
                placeholder="Optional — how did your body feel? Any moment that surprised you?"
                rows={3}
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f0b429]/50 focus:outline-none"
              />
            </div>
          )}

          {/* Intensity rating */}
          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold text-white">How did it feel?</p>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITY_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setCondIntensity(value)}
                  className={`rounded-2xl border py-3.5 text-center transition-colors ${
                    condIntensity === value
                      ? "border-[#f0b429] bg-[#f0b429]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  <span className="block text-2xl">{emoji}</span>
                  <span className="mt-1 block text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveAndFinishCond}
            disabled={!condIntensity}
            className="mt-6 w-full rounded-2xl bg-[#f0b429] py-4 text-base font-bold text-[#1a3a1a] disabled:opacity-40 active:scale-95 transition-transform"
          >
            {condSaved ? "Saved ✓" : "Save & Finish"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
