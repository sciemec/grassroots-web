"use client";

/**
 * THUTO Session — Innovation 03 (World First)
 *
 * Voice-guided training session using the Web Speech API.
 * THUTO speaks every drill instruction aloud through the phone speaker.
 * Zero cost. No app. Works in Chrome Android natively.
 *
 * Route:   /player/session
 * Toggle:  ↔ /player/pitch  (Silent Mode / Pitch Mode)
 *
 * Shares schedule data, offlineDB helpers, and phase structure
 * with Pitch Mode. Adds: speak(), mute, pause, repeat controls.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Volume2, VolumeX, Pause, Play, RefreshCw, Mic,
} from "lucide-react";
import api from "@/lib/api";
import {
  getSchedule, saveSchedule, savePendingSession,
  type CachedSchedule, type Drill, type ScheduleDay,
} from "@/lib/offlineDB";

// ─── Types ─────────────────────────────────────────────────────────────────

type Phase =
  | "loading"
  | "no_schedule"
  | "rest_day"
  | "ready"
  | "warmup"
  | "drill"
  | "rest"
  | "cooldown"
  | "done";

interface SessionState {
  day: ScheduleDay;
  drillIndex: number;
  scheduleId: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const REST_SEC = 45;

const MOTIVATION_LINES = [
  "Stay focused. Your body knows what to do.",
  "Every rep builds the player you are becoming.",
  "Chitungwiza to the world. Keep going.",
  "Push past the voice that says stop.",
  "This is where ordinary players quit. You do not.",
  "The pitch does not care how you feel. Perform anyway.",
  "Rest is part of the work. Breathe deep.",
  "You are not tired. You are becoming.",
];

// ─── Timer Ring ─────────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 88;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? seconds / total : 0;
  const offset = circ * (1 - progress);
  const color = progress > 0.3 ? "#4ade80" : progress > 0.1 ? "#fbbf24" : "#ef4444";
  return (
    <svg width="200" height="200" className="absolute inset-0 -rotate-90">
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle
        cx="100" cy="100" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.5s" }}
      />
    </svg>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ThutoSessionPage() {
  const router = useRouter();

  // ── State ──
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SessionState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"speaking" | "training" | "idle">("idle");
  const [offline, setOffline] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [currentInstruction, setCurrentInstruction] = useState("");

  // ── Refs ──
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<() => void>(() => {});
  const secondsLeftRef = useRef(0);          // live copy for pause capture
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isMutedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);

  // ── Wake Lock ──
  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator)
        wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const reacquire = () => {
      if (document.visibilityState === "visible" &&
          phase !== "loading" && phase !== "done" &&
          phase !== "rest_day" && phase !== "no_schedule")
        acquireWakeLock();
    };
    document.addEventListener("visibilitychange", reacquire);
    return () => document.removeEventListener("visibilitychange", reacquire);
  }, [acquireWakeLock, phase]);

  // ── Fullscreen ──
  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  // ── Speech Engine ──────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!("speechSynthesis" in window)) { onEnd?.(); return; }
    if (isMutedRef.current) { onEnd?.(); return; }

    window.speechSynthesis.cancel();
    setVoiceStatus("speaking");
    setCurrentInstruction(text);

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 0.88;
    utt.pitch  = 1.0;
    utt.volume = 1.0;

    // Prefer en-ZA → en-GB → any English
    const voices = window.speechSynthesis.getVoices();
    const voice  =
      voices.find((v) => v.lang === "en-ZA") ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (voice) utt.voice = voice;

    utt.onend  = () => { setVoiceStatus("training"); onEnd?.(); };
    utt.onerror = () => { setVoiceStatus("training"); onEnd?.(); };

    window.speechSynthesis.speak(utt);
  }, []);

  const repeatInstruction = useCallback(() => {
    if (currentInstruction) speak(currentInstruction);
  }, [currentInstruction, speak]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) window.speechSynthesis?.cancel();
      return !prev;
    });
  }, []);

  // ── Countdown Timer ────────────────────────────────────────────────────────
  const startCountdown = useCallback(
    (seconds: number, onComplete: () => void) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(seconds);
      setTotalSeconds(seconds);
      onCompleteRef.current = onComplete;

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          const next = prev - 1;
          if (next === 10) speak("Ten seconds.");
          if (next <= 0) {
            clearInterval(timerRef.current!);
            onCompleteRef.current();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [speak]
  );

  // ── Pause / Resume ─────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        // Pausing
        if (timerRef.current) clearInterval(timerRef.current);
        window.speechSynthesis?.pause?.();
      } else {
        // Resuming — restart countdown from where we left off
        window.speechSynthesis?.resume?.();
        const remaining = secondsLeftRef.current;
        const savedComplete = onCompleteRef.current;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setSecondsLeft((p) => {
            const n = p - 1;
            if (n === 10) speak("Ten seconds.");
            if (n <= 0) {
              clearInterval(timerRef.current!);
              savedComplete();
              return 0;
            }
            return n;
          });
        }, 1000);
        void remaining; // suppress unused warning
      }
      return !prev;
    });
  }, [speak]);

  // ── Load Schedule ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setSpeechSupported(false);
    } else {
      // Prime voice list — Chrome loads async
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.getVoices();
    }

    async function load() {
      let data: CachedSchedule | null = null;
      try {
        const res = await api.get("/training/schedule");
        const raw = res.data?.schedule;
        if (raw) {
          data = { ...raw, cached_at: Date.now() };
          await saveSchedule(data!);
        }
      } catch {
        setOffline(true);
        data = await getSchedule();
      }

      if (!data) { setPhase("no_schedule"); return; }

      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const todayData = data.schedule_json?.days?.find(
        (d: ScheduleDay) => d.day.toLowerCase() === today.toLowerCase()
      );

      if (!todayData)      { setPhase("no_schedule"); return; }
      if (todayData.is_rest) { setPhase("rest_day");    return; }

      setSession({ day: todayData, drillIndex: 0, scheduleId: data.id });
      setPhase("ready");
    }

    load();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel?.();
      releaseWakeLock();
      exitFullscreen();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Drill Flow ─────────────────────────────────────────────────────────────
  const startNextDrill = useCallback(
    (index: number) => {
      if (!session) return;
      const drills = session.day.drills ?? [];

      if (index >= drills.length) {
        // All drills done → cooldown
        setPhase("cooldown");
        const cooldownText = session.day.post_session_cooldown
          ? `Cool down. ${session.day.post_session_cooldown}`
          : "Cool down. Static stretches. Breathe slowly.";
        speak(cooldownText, () =>
          startCountdown(60 * 2, () =>
            speak(
              "Session complete. You showed up. That is everything. How did that feel?",
              () => setPhase("done")
            )
          )
        );
        return;
      }

      const drill  = drills[index];
      const motivation = MOTIVATION_LINES[Math.floor(Math.random() * MOTIVATION_LINES.length)];

      setSession((prev) => prev ? { ...prev, drillIndex: index } : prev);
      setPhase("drill");

      // Voice flow: name → instructions → "Begin." → timer
      speak(`Drill ${index + 1} of ${drills.length}. ${drill.name}.`, () =>
        speak(drill.instructions, () =>
          speak("Begin.", () => {
            setVoiceStatus("training");
            startCountdown(drill.duration_minutes * 60, () => {
              if (index + 1 < drills.length) {
                setPhase("rest");
                speak("Stop. Rest.", () =>
                  speak(motivation, () =>
                    speak("Next drill in three. Two. One.", () =>
                      startNextDrill(index + 1)
                    )
                  )
                );
                startCountdown(REST_SEC, () => {});
              } else {
                startNextDrill(index + 1); // → cooldown
              }
            });
          })
        )
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, speak, startCountdown]
  );

  const startSession = useCallback(() => {
    if (!session) return;
    enterFullscreen();
    acquireWakeLock();
    const drills = session.day.drills ?? [];
    speak(
      `Good. Let us begin your ${session.day.focus} session. ${drills.length} drills. Stay focused. I am with you.`,
      () => {
        setPhase("warmup");
        const warmupText = session.day.pre_session_warmup
          ? `Warm up. ${session.day.pre_session_warmup}`
          : "Three minutes. Warm up your body. Jog, stretch, prepare.";
        speak(warmupText);
        startCountdown(60 * 3, () => startNextDrill(0));
      }
    );
  }, [session, speak, startCountdown, startNextDrill, enterFullscreen, acquireWakeLock]);

  // ── Save Session ──────────────────────────────────────────────────────────
  const saveSession = async (feeling: "tough" | "amazing") => {
    if (!session) return;
    const drills = session.day.drills ?? [];
    const payload = {
      schedule_id:      session.scheduleId,
      day_name:         session.day.day,
      drills_completed: drills.length,
      total_drills:     drills.length,
      feeling,
      completed_at:     new Date().toISOString(),
    };
    try {
      await api.post("/training/sessions", payload);
    } catch {
      await savePendingSession({
        localId: `${Date.now()}-${Math.random()}`,
        synced:  false,
        ...payload,
      });
    }
    window.speechSynthesis?.cancel?.();
    releaseWakeLock();
    exitFullscreen();
    router.push("/player");
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentDrill: Drill | null =
    session && phase === "drill" && session.day.drills
      ? session.day.drills[session.drillIndex] ?? null
      : null;

  const drillsTotal  = session?.day.drills?.length ?? 0;
  const drillNumber  = (session?.drillIndex ?? 0) + 1;
  const progressPct  = drillsTotal > 0
    ? Math.max(0, ((drillNumber - 1) / drillsTotal) * 100)
    : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ── Shared UI Pieces ───────────────────────────────────────────────────────

  /** Mute / Pause / Repeat buttons — overlaid top-right during active phases */
  const Controls = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
      <button
        onClick={repeatInstruction}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-90"
        aria-label="Repeat instruction"
        title="Repeat"
      >
        <RefreshCw className="h-4 w-4 text-white" />
      </button>
      <button
        onClick={togglePause}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-90"
        aria-label={isPaused ? "Resume" : "Pause"}
      >
        {isPaused
          ? <Play  className="h-5 w-5 text-white" />
          : <Pause className="h-5 w-5 text-white" />}
      </button>
      <button
        onClick={toggleMute}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/25 active:scale-90"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted
          ? <VolumeX className="h-5 w-5 text-amber-300" />
          : <Volume2 className="h-5 w-5 text-white" />}
      </button>
    </div>
  );

  /** Small pill showing whether THUTO is speaking */
  const VoiceBadge = () => (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
      <Mic className={`h-3 w-3 ${
        isMuted            ? "text-white/30" :
        voiceStatus === "speaking" ? "text-green-300 animate-pulse" : "text-white/40"
      }`} />
      <span className="text-xs text-white/60">
        {isMuted ? "Muted" : voiceStatus === "speaking" ? "THUTO speaking…" : "Training…"}
      </span>
    </div>
  );

  /** Paused banner */
  const PausedBanner = () =>
    isPaused ? (
      <div className="mt-4 rounded-xl bg-black/30 px-5 py-2 text-sm font-medium text-white/70">
        Paused — tap ▶ to continue
      </div>
    ) : null;

  // ── Base styles ────────────────────────────────────────────────────────────
  const base = "fixed inset-0 flex flex-col items-center justify-center bg-[#0c4a30] text-white select-none overflow-hidden";

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER — one phase per return
  // ════════════════════════════════════════════════════════════════════════════

  if (phase === "loading") {
    return (
      <div className={base}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="mt-4 text-lg font-medium">Loading your session…</p>
      </div>
    );
  }

  if (!speechSupported) {
    return (
      <div className={base}>
        <div className="px-8 text-center">
          <p className="text-5xl">🔇</p>
          <h1 className="mt-4 text-2xl font-bold">Voice not supported</h1>
          <p className="mt-3 text-base text-white/70">
            Your browser does not support voice coaching.
            Use Pitch Mode instead — same session, no voice.
          </p>
          <button
            onClick={() => router.push("/player/pitch")}
            className="mt-8 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#0c4a30]"
          >
            Switch to Pitch Mode
          </button>
          <button
            onClick={() => router.push("/player")}
            className="mt-4 block w-full text-center text-sm text-white/50 underline"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (phase === "no_schedule") {
    return (
      <div className={base}>
        <div className="px-8 text-center">
          <p className="text-5xl">📋</p>
          <h1 className="mt-4 text-2xl font-bold">No session today</h1>
          <p className="mt-2 text-base text-white/70">
            Ask THUTO to create your 7-day schedule first.
          </p>
          <button
            onClick={() => router.push("/player/training")}
            className="mt-8 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#0c4a30]"
          >
            Go to Training Plan
          </button>
          <button
            onClick={() => router.push("/player")}
            className="mt-4 block w-full text-center text-sm text-white/50 underline"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (phase === "rest_day") {
    return (
      <div className={base}>
        <div className="px-8 text-center">
          <p className="text-6xl">😴</p>
          <h1 className="mt-4 text-3xl font-bold">Rest Day</h1>
          <p className="mt-3 text-lg text-white/80">
            Today is recovery. Eat well. Sleep. Come back stronger.
          </p>
          <button
            onClick={() => router.push("/player")}
            className="mt-10 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#0c4a30]"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready" && session) {
    const day = session.day;
    return (
      <div className={base}>
        {offline && (
          <div className="absolute top-4 left-0 right-0 mx-4 rounded-xl bg-yellow-500/20 border border-yellow-400/40 px-4 py-2 text-center text-sm text-yellow-200">
            Offline — using cached schedule
          </div>
        )}
        <div className="w-full max-w-sm px-6 text-center">
          {/* Voice mode badge */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Mic className="h-4 w-4 text-green-300" />
            <span className="text-sm font-semibold uppercase tracking-widest text-green-300">
              Voice Mode
            </span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            {day.day} · {day.intensity?.toUpperCase() ?? "MEDIUM"} INTENSITY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-balance">{day.focus}</h1>
          <p className="mt-1 text-white/70">
            {day.total_duration_minutes} min · {day.drills?.length ?? 0} drills
          </p>
          <p className="mt-2 text-sm text-white/40">
            Put your phone down. THUTO will guide you by voice.
          </p>

          <div className="mt-5 space-y-3 text-left">
            {day.drills?.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{d.name}</p>
                  <p className="text-sm text-white/60">{d.duration_minutes} min · {d.equipment_needed}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={startSession}
            className="mt-7 w-full rounded-2xl bg-white py-5 text-xl font-bold text-[#0c4a30] active:scale-95 transition-transform"
          >
            START WITH THUTO VOICE →
          </button>

          {/* Toggle to silent mode */}
          <button
            onClick={() => router.push("/player/pitch")}
            className="mt-3 w-full rounded-2xl border border-white/20 py-3 text-sm text-white/60 transition-colors hover:border-white/40 hover:text-white/80"
          >
            Switch to Silent Mode (Pitch Mode)
          </button>

          <button
            onClick={() => router.push("/player")}
            className="mt-3 text-sm text-white/40 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (phase === "warmup") {
    return (
      <div className={base}>
        <Controls />
        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <VoiceBadge />
        </div>

        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{fmt(secondsLeft)}</p>
          </div>
        </div>

        <p className="mt-6 text-xl font-bold uppercase tracking-widest">Warm Up</p>
        <p className="mt-2 max-w-xs px-6 text-center text-sm text-white/60">
          {session?.day.pre_session_warmup ?? "Jog, stretch, prepare your body."}
        </p>
        <PausedBanner />
      </div>
    );
  }

  if (phase === "drill" && currentDrill) {
    return (
      <div className={base}>
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-green-400 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <Controls />

        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <VoiceBadge />
        </div>

        <p className="absolute top-14 text-sm font-semibold uppercase tracking-widest text-white/50">
          Drill {drillNumber} of {drillsTotal}
        </p>

        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{fmt(secondsLeft)}</p>
          </div>
        </div>

        {/* Drill name — 36px as per spec */}
        <h2 className="mt-6 px-6 text-center font-bold leading-tight text-balance"
            style={{ fontSize: "36px" }}>
          {currentDrill.name}
        </h2>

        <p className="mt-3 max-w-xs px-6 text-center text-base text-white/70">
          {currentDrill.instructions}
        </p>

        {currentDrill.equipment_needed &&
          currentDrill.equipment_needed !== "none" && (
          <p className="mt-2 text-sm text-white/40">
            🎽 {currentDrill.equipment_needed}
          </p>
        )}

        <PausedBanner />
      </div>
    );
  }

  if (phase === "rest") {
    const nextDrill = session?.day.drills?.[session.drillIndex + 1];
    return (
      <div className={base}>
        <Controls />
        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <VoiceBadge />
        </div>

        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{secondsLeft}</p>
            <p className="text-sm text-white/60">REST</p>
          </div>
        </div>

        <p className="mt-6 text-xl font-semibold text-white/80">Catch your breath</p>
        {nextDrill && (
          <p className="mt-3 text-base text-white/50">
            Next: <span className="font-semibold text-white">{nextDrill.name}</span>
          </p>
        )}
        <PausedBanner />
      </div>
    );
  }

  if (phase === "cooldown") {
    return (
      <div className={base}>
        <Controls />
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{fmt(secondsLeft)}</p>
          </div>
        </div>
        <p className="mt-8 text-xl font-bold uppercase tracking-widest">Cool Down</p>
        <p className="mt-3 max-w-xs px-6 text-center text-base text-white/70 italic">
          {session?.day.post_session_cooldown ?? "Static stretches. Breathe slowly."}
        </p>
        <PausedBanner />
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className={base}>
        <div className="px-8 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-bold">Session Complete!</h1>
          <p className="mt-2 text-lg text-white/70">
            {drillsTotal} drill{drillsTotal !== 1 ? "s" : ""} done
            {session?.day.total_duration_minutes
              ? ` — ${session.day.total_duration_minutes} min`
              : ""}
          </p>
          <p className="mt-4 text-base italic text-white/60">
            &quot;Zvakanaka zvakaitwa — well done!&quot;
          </p>

          <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-white/60">
            How did it feel?
          </p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => saveSession("tough")}
              className="flex-1 rounded-2xl bg-white/15 border border-white/30 py-5 text-lg font-bold active:scale-95 transition-transform"
            >
              😤 Tough but done
            </button>
            <button
              onClick={() => saveSession("amazing")}
              className="flex-1 rounded-2xl bg-white py-5 text-lg font-bold text-[#0c4a30] active:scale-95 transition-transform"
            >
              🔥 Felt amazing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
