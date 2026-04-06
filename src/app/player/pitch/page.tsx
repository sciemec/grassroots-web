"use client";

/**
 * PITCH MODE — GrassRoots Sports
 * Full-screen on-pitch training companion.
 * Works offline. Keeps screen awake. Walks player through every drill.
 */

import { useEffect, useRef, useState, useCallback } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "loading" | "rest_day" | "no_schedule" | "ready" | "warmup" | "drill" | "rest" | "cooldown" | "done";

interface SessionState {
  day: ScheduleDay;
  drillIndex: number;
  scheduleId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const REST_BETWEEN_DRILLS_SEC = 45;

// ─── Audio ────────────────────────────────────────────────────────────────────

function playBeep(type: "countdown" | "end"): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "countdown") {
      osc.frequency.value = 880;
      gain.gain.value = 0.4;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.value = 440;
      gain.gain.value = 0.5;
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch {
    // Safari / blocked — silent fail
  }
}

// ─── SVG Timer Ring ───────────────────────────────────────────────────────────

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width="200" height="200" className="absolute inset-0 m-auto">
      {/* Track */}
      <circle
        cx="100" cy="100" r={radius}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8"
      />
      {/* Progress */}
      <circle
        cx="100" cy="100" r={radius}
        fill="none" stroke="white" strokeWidth="8"
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

  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<SessionState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [motivationMsg, setMotivationMsg] = useState("");
  const [offline, setOffline] = useState(false);

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<() => void>(() => {});

  // ─── Wake Lock ──────────────────────────────────────────────────────────────

  const acquireWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Not available — silent fail
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  // Re-acquire on tab visibility change (wake lock is released when tab hidden)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && phase !== "done" && phase !== "loading") {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase, acquireWakeLock]);

  // ─── Fullscreen ─────────────────────────────────────────────────────────────

  const enterFullscreen = () => {
    try {
      document.documentElement.requestFullscreen?.();
    } catch {
      // Not available — silent fail
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
    } catch {
      // silent fail
    }
  };

  // ─── Countdown Timer ────────────────────────────────────────────────────────

  const startCountdown = useCallback(
    (durationSec: number, onComplete: () => void) => {
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
    },
    []
  );

  // ─── Random motivation ──────────────────────────────────────────────────────

  const newMotivation = () => {
    const idx = Math.floor(Math.random() * THUTO_MESSAGES.length);
    setMotivationMsg(THUTO_MESSAGES[idx]);
  };

  // ─── Load schedule ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      let scheduleData: CachedSchedule | null = null;

      // Try API first
      try {
        const res = await api.get("/training/schedule");
        const raw = res.data?.schedule;
        if (raw) {
          scheduleData = { ...raw, cached_at: Date.now() };
          await saveSchedule(scheduleData!);
        }
      } catch {
        setOffline(true);
        // Fall back to IndexedDB
        scheduleData = await getSchedule();
      }

      if (!scheduleData) {
        setPhase("no_schedule");
        return;
      }

      // Find today's session
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" }); // "Monday"
      const todayData = scheduleData.schedule_json?.days?.find(
        (d) => d.day.toLowerCase() === today.toLowerCase()
      );

      if (!todayData) {
        setPhase("no_schedule");
        return;
      }

      if (todayData.is_rest) {
        setPhase("rest_day");
        return;
      }

      setSession({
        day: todayData,
        drillIndex: 0,
        scheduleId: scheduleData.id,
      });
      setPhase("ready");
    }

    load();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
      exitFullscreen();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Phase transitions ──────────────────────────────────────────────────────

  const startSession = () => {
    enterFullscreen();
    acquireWakeLock();
    newMotivation();

    const warmupSec = 60 * 3; // 3 min warmup prompt
    setPhase("warmup");
    startCountdown(warmupSec, () => startNextDrill(0));
  };

  const startNextDrill = useCallback(
    (index: number) => {
      if (!session) return;
      const drills = session.day.drills ?? [];

      if (index >= drills.length) {
        // All drills done — cooldown
        const cooldownSec = 60 * 2;
        setPhase("cooldown");
        startCountdown(cooldownSec, () => setPhase("done"));
        return;
      }

      const drill = drills[index];
      setSession((prev) => prev ? { ...prev, drillIndex: index } : prev);
      setPhase("drill");
      newMotivation();
      startCountdown(drill.duration_minutes * 60, () => {
        // Rest between drills (except after last)
        if (index + 1 < drills.length) {
          setPhase("rest");
          startCountdown(REST_BETWEEN_DRILLS_SEC, () => startNextDrill(index + 1));
        } else {
          startNextDrill(index + 1); // triggers cooldown
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session]
  );

  // ─── Save completed session ──────────────────────────────────────────────────

  const saveSession = async (feeling: "tough" | "amazing") => {
    if (!session) return;
    const drills = session.day.drills ?? [];
    const payload = {
      schedule_id: session.scheduleId,
      day_name: session.day.day,
      drills_completed: drills.length,
      total_drills: drills.length,
      feeling,
      completed_at: new Date().toISOString(),
    };

    // Try API
    try {
      await api.post("/training/sessions", payload);
    } catch {
      // Queue offline
      await savePendingSession({
        localId: `${Date.now()}-${Math.random()}`,
        synced: false,
        ...payload,
      });
    }

    releaseWakeLock();
    exitFullscreen();
    router.push("/player");
  };

  // ─── Computed display values ─────────────────────────────────────────────────

  const currentDrill: Drill | null =
    session && phase === "drill" && session.day.drills
      ? session.day.drills[session.drillIndex] ?? null
      : null;

  const drillsTotal = session?.day.drills?.length ?? 0;
  const drillNumber = (session?.drillIndex ?? 0) + 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const baseClass =
    "fixed inset-0 flex flex-col items-center justify-center bg-[#15803d] text-white select-none overflow-hidden";

  // ── Loading ──
  if (phase === "loading") {
    return (
      <div className={baseClass}>
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="mt-4 text-lg font-medium">Loading your session…</p>
      </div>
    );
  }

  // ── No schedule ──
  if (phase === "no_schedule") {
    return (
      <div className={baseClass}>
        <div className="px-8 text-center">
          <p className="text-5xl">📋</p>
          <h1 className="mt-4 text-2xl font-bold">No session today</h1>
          <p className="mt-2 text-base text-white/70">
            Ask THUTO to create your 7-day schedule first.
          </p>
          <button
            onClick={() => router.push("/player/training")}
            className="mt-8 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#15803d]"
          >
            Go to Training Plan
          </button>
          <button
            onClick={() => router.push("/player")}
            className="mt-4 block w-full text-center text-white/60 underline"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Rest day ──
  if (phase === "rest_day") {
    return (
      <div className={baseClass}>
        <div className="px-8 text-center">
          <p className="text-6xl">😴</p>
          <h1 className="mt-4 text-3xl font-bold">Rest Day</h1>
          <p className="mt-3 text-lg text-white/80">
            Today is recovery. Eat well. Sleep. Come back stronger.
          </p>
          <p className="mt-2 text-base italic text-white/60">
            "Zororo ndirwo ruzivo — rest is wisdom."
          </p>
          <button
            onClick={() => router.push("/player")}
            className="mt-10 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-[#15803d]"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Ready ──
  if (phase === "ready" && session) {
    const day = session.day;
    return (
      <div className={baseClass}>
        {offline && (
          <div className="absolute top-4 left-0 right-0 mx-4 rounded-xl bg-yellow-500/20 border border-yellow-400/40 px-4 py-2 text-center text-sm text-yellow-200">
            Offline — using cached schedule
          </div>
        )}
        <div className="w-full max-w-sm px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            {day.day} · {day.intensity?.toUpperCase() ?? "MEDIUM"} INTENSITY
          </p>
          <h1 className="mt-2 text-3xl font-bold">{day.focus}</h1>
          <p className="mt-1 text-white/70">{day.total_duration_minutes} min total</p>

          <div className="mt-6 space-y-3 text-left">
            {day.drills?.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-sm text-white/60">{d.duration_minutes} min · {d.equipment_needed}</p>
                </div>
              </div>
            ))}
          </div>

          {day.pre_session_warmup && (
            <p className="mt-4 text-sm italic text-white/60">
              Warmup: {day.pre_session_warmup}
            </p>
          )}

          <button
            onClick={startSession}
            className="mt-8 w-full rounded-2xl bg-white py-5 text-xl font-bold text-[#15803d] active:scale-95 transition-transform"
          >
            START SESSION →
          </button>
          <button
            onClick={() => router.push("/player")}
            className="mt-4 text-sm text-white/50 underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Warmup ──
  if (phase === "warmup") {
    return (
      <div className={baseClass}>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          </div>
        </div>
        <p className="mt-6 text-xl font-bold uppercase tracking-widest">Warm Up</p>

        {/* Show THUTO's generated warmup if specific, else show structured phases */}
        {session?.day.pre_session_warmup ? (
          <p className="mt-2 max-w-xs px-6 text-center text-sm text-white/70 italic">
            {session.day.pre_session_warmup}
          </p>
        ) : (
          <div className="mt-3 w-full max-w-xs space-y-1 px-6">
            {warmupKnowledge.warmup_phases.slice(0, 3).map((ph) => (
              <div key={ph.phase} className="flex items-start gap-2 text-xs text-white/60">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  {ph.phase}
                </span>
                <span><span className="font-semibold text-white/80">{ph.name}</span> · {ph.duration_minutes} min</span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 max-w-xs px-6 text-center text-sm italic text-white/60">
          "{motivationMsg}"
        </p>
      </div>
    );
  }

  // ── Drill ──
  if (phase === "drill" && currentDrill) {
    return (
      <div className={baseClass}>
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
        <p className="mt-2 max-w-xs px-6 text-center text-sm text-white/70">
          {currentDrill.instructions}
        </p>
        {currentDrill.equipment_needed && currentDrill.equipment_needed !== "none" && (
          <p className="mt-2 text-xs text-white/40">🎽 {currentDrill.equipment_needed}</p>
        )}

        <p className="absolute bottom-8 max-w-xs px-6 text-center text-sm italic text-white/60">
          "{motivationMsg}"
        </p>
      </div>
    );
  }

  // ── Rest between drills ──
  if (phase === "rest") {
    const nextDrill = session?.day.drills?.[session.drillIndex + 1];
    return (
      <div className={baseClass}>
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

  // ── Cooldown ──
  if (phase === "cooldown") {
    return (
      <div className={baseClass}>
        <div className="relative flex h-[200px] w-[200px] items-center justify-center">
          <TimerRing seconds={secondsLeft} total={totalSeconds} />
          <div className="text-center">
            <p className="text-5xl font-bold tabular-nums">{formatTime(secondsLeft)}</p>
          </div>
        </div>
        <p className="mt-8 text-xl font-bold uppercase tracking-widest">Cool Down</p>
        <p className="mt-3 max-w-xs px-6 text-center text-sm text-white/70 italic">
          {session?.day.post_session_cooldown ?? "Static stretches. Breathe slowly."}
        </p>
      </div>
    );
  }

  // ── Done ──
  if (phase === "done") {
    return (
      <div className={baseClass}>
        <div className="px-8 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-bold">Session Complete!</h1>
          <p className="mt-2 text-lg text-white/70">
            {drillsTotal} drill{drillsTotal !== 1 ? "s" : ""} done — {session?.day.total_duration_minutes} min
          </p>
          <p className="mt-4 text-base italic text-white/60">
            "Zvakanaka zvakaitwa — well done!"
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
              className="flex-1 rounded-2xl bg-white py-5 text-lg font-bold text-[#15803d] active:scale-95 transition-transform"
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
