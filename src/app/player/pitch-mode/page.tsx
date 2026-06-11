"use client";

/**
 * Pitch Mode — Solo Training Sessions
 *
 * Player selects a focus area and duration.
 * AI generates a structured solo drill session (warm-up → drills → cooldown).
 * Timer counts down for each exercise.
 * Session logged to backend on completion.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, SkipForward, CheckCircle2,
  Timer, Zap, Target, Shield, Wind, Dumbbell, RotateCcw,
  ChevronRight, Loader2, Trophy,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Drill {
  name: string;
  duration: number; // seconds
  instruction: string;
  tip: string;
}

interface Session {
  focus: string;
  totalMinutes: number;
  warmup: Drill[];
  main: Drill[];
  cooldown: Drill[];
}

type Phase = "setup" | "active" | "done";
type DrillPhase = "warmup" | "main" | "cooldown";

// ── Focus Areas ───────────────────────────────────────────────────────────────

const FOCUS_AREAS = [
  { id: "dribbling",  label: "Dribbling",  icon: Zap,      color: "from-yellow-600 to-amber-700",   desc: "Ball control, close touches, change of direction" },
  { id: "shooting",   label: "Shooting",   icon: Target,   color: "from-red-600 to-rose-700",       desc: "Strike technique, accuracy, first touch finish" },
  { id: "passing",    label: "Passing",    icon: Wind,     color: "from-blue-600 to-cyan-700",      desc: "Short passes, weight of pass, vision drills" },
  { id: "defending",  label: "Defending",  icon: Shield,   color: "from-green-700 to-emerald-800",  desc: "Positioning, jockeying, tackle timing" },
  { id: "fitness",    label: "Fitness",    icon: Dumbbell, color: "from-purple-600 to-violet-700",  desc: "Speed, stamina, agility ladder work" },
] as const;

const DURATIONS = [15, 30, 45, 60];

// ── Default session templates (used when AI is unavailable) ──────────────────

const DEFAULT_SESSIONS: Record<string, Session> = {
  dribbling: {
    focus: "Dribbling", totalMinutes: 30,
    warmup: [
      { name: "Jogging + Arm Circles", duration: 120, instruction: "Jog in a square, swing arms in big circles.", tip: "Stay light on your feet." },
      { name: "Dynamic Leg Swings", duration: 60, instruction: "Hold a wall or tree, swing each leg forward and back 10 times.", tip: "Keep your core tight." },
    ],
    main: [
      { name: "Cone Slalom (or stones)", duration: 180, instruction: "Set out 5 markers 1 metre apart. Dribble through left foot only, then right foot only.", tip: "Keep the ball within 30cm of your foot." },
      { name: "V-Pull Turns", duration: 150, instruction: "Push ball forward, drag back with sole, turn 180°. Repeat on the spot.", tip: "Head up as much as possible." },
      { name: "Figure-8 Dribble", duration: 150, instruction: "Dribble in a figure-8 around two markers. Speed up each lap.", tip: "Use the outside of your foot on bends." },
      { name: "Fast Feet Box", duration: 120, instruction: "Mark a 2m square. Dribble inside touching every side, change direction on whistle or self-count.", tip: "Stay on your toes." },
    ],
    cooldown: [
      { name: "Hip Flexor Stretch", duration: 60, instruction: "Lunge forward, hold 30 seconds each side.", tip: "Breathe slowly and relax into the stretch." },
      { name: "Calf Stretch + Reflection", duration: 60, instruction: "Press heel down against a wall or raised surface, hold 30 seconds each side.", tip: "Think about one thing you improved today." },
    ],
  },
  shooting: {
    focus: "Shooting", totalMinutes: 30,
    warmup: [
      { name: "Jogging + High Knees", duration: 120, instruction: "2 laps of jogging, then 20 high knees.", tip: "Drive your knees up to hip height." },
      { name: "Ankle Circles", duration: 60, instruction: "Rotate each ankle 10 times each direction.", tip: "Shooting power starts at the ankle." },
    ],
    main: [
      { name: "Instep Drive (standing ball)", duration: 180, instruction: "Place ball on a stone or flat surface. Strike with laces through the centre of the ball, 10 reps each foot.", tip: "Non-kicking foot beside the ball, eyes down." },
      { name: "First Touch & Shoot", duration: 180, instruction: "Throw ball up, let it drop, control with one touch, shoot on the second.", tip: "Imagine a goalkeeper — pick a corner." },
      { name: "Run-up & Shoot", duration: 150, instruction: "Place a marker 10 metres from goal (or target). Run up at an angle and strike.", tip: "Plant foot firmly, lean over the ball." },
      { name: "Rapid-fire Volleys", duration: 120, instruction: "Throw ball up and volley 8 times. Count how many hit the target.", tip: "Keep your knee over the ball." },
    ],
    cooldown: [
      { name: "Quad Stretch", duration: 60, instruction: "Stand on one leg, pull opposite ankle to glutes. Hold 30s each side.", tip: "Find a wall to balance if needed." },
      { name: "Hamstring Stretch", duration: 60, instruction: "Sit on the ground, legs straight, reach for your toes.", tip: "Don't bounce — hold the stretch." },
    ],
  },
  passing: {
    focus: "Passing", totalMinutes: 30,
    warmup: [
      { name: "Jog + Side Shuffle", duration: 120, instruction: "Jog forward 10m, shuffle sideways back.", tip: "Stay facing forward during the shuffle." },
      { name: "Wrist & Shoulder Rolls", duration: 60, instruction: "Roll shoulders back 10 times, forward 10 times.", tip: "Relax your upper body — tension kills passing." },
    ],
    main: [
      { name: "Wall Passes (or fence)", duration: 180, instruction: "Stand 3 metres from a wall. Pass and receive, alternate feet.", tip: "Cushion the return with the inside of your foot." },
      { name: "Triangle Pass (solo)", duration: 150, instruction: "Set 3 markers in a triangle 4m apart. Dribble to each and pass to the next marker (simulate).", tip: "Look to where you're passing before you receive." },
      { name: "Outside-of-foot Pass", duration: 120, instruction: "Pass to the wall using only the outside of each foot, 10 reps.", tip: "Wrap your foot around the ball." },
      { name: "Long Pass & Control", duration: 150, instruction: "Kick ball 15+ metres, chase it down, control with one touch, repeat.", tip: "Follow through toward your target." },
    ],
    cooldown: [
      { name: "Groin Stretch", duration: 60, instruction: "Sit with soles of feet together, gently press knees toward the ground.", tip: "Breathe into the stretch." },
      { name: "Lower Back Roll", duration: 60, instruction: "Lie on back, pull both knees to chest, rock gently side to side.", tip: "Passing lots puts stress on your lower back — look after it." },
    ],
  },
  defending: {
    focus: "Defending", totalMinutes: 30,
    warmup: [
      { name: "Lateral Shuffles", duration: 120, instruction: "Shuffle left 5m, right 5m, 10 reps. Stay low.", tip: "Never cross your feet." },
      { name: "Backpedal Sprints", duration: 60, instruction: "Backpedal 10m, sprint back forward. 5 reps.", tip: "Keep hips low, head up." },
    ],
    main: [
      { name: "Jockeying Drill", duration: 180, instruction: "Imagine an attacker — backpedal slowly, stay side-on, never let them past. Mirror their movement.", tip: "Wait for the attacker to commit — patience is key." },
      { name: "Recovery Sprint", duration: 150, instruction: "Sprint 10m forward, turn 180° in one step, sprint back. Repeat 8 times.", tip: "The turn should be explosive — pivot off your outside foot." },
      { name: "Block & Win (simulate)", duration: 120, instruction: "Kick a ball against a wall, then race to win the rebound before it crosses a line you mark.", tip: "Read the bounce — anticipate, don't react." },
      { name: "Aerial Challenge Sim", duration: 150, instruction: "Throw ball up, jump to head it back. Focus on timing your jump.", tip: "Use your arms for balance, not pushing." },
    ],
    cooldown: [
      { name: "IT Band Stretch", duration: 60, instruction: "Cross right foot over left, lean to the left. Hold 30s. Switch.", tip: "Defenders who skip stretching pick up knee injuries." },
      { name: "Neck & Shoulder Release", duration: 60, instruction: "Tilt head to each side, roll it slowly forward. Don't roll it back.", tip: "Heading puts strain on your neck — stretch it out." },
    ],
  },
  fitness: {
    focus: "Fitness", totalMinutes: 30,
    warmup: [
      { name: "Skip Rope or Skip in Place", duration: 120, instruction: "Skip continuously for 2 minutes. Start slow.", tip: "Land on the balls of your feet." },
      { name: "Arm Swings + Leg Swings", duration: 60, instruction: "10 forward leg swings each leg, 10 big arm circles each direction.", tip: "Loosen up joints before high intensity work." },
    ],
    main: [
      { name: "Sprint Intervals", duration: 180, instruction: "Sprint 30m, walk back, repeat 6 times. Max effort on each sprint.", tip: "Drive your arms — they power your legs." },
      { name: "Burpees", duration: 120, instruction: "10 burpees. Down to ground, push up, jump up with arms raised.", tip: "Full extension at the top of each jump." },
      { name: "Agility Ladder (or drawn squares)", duration: 150, instruction: "Draw 10 squares in the dirt. Two feet in, two feet out, down the ladder.", tip: "Stay on your toes, eyes forward." },
      { name: "Shuttle Runs", duration: 150, instruction: "Set markers at 5m, 10m, 15m. Sprint to 5m, back, 10m, back, 15m, back. 4 sets.", tip: "Touch each marker with your hand." },
    ],
    cooldown: [
      { name: "Walk + Deep Breathing", duration: 90, instruction: "Walk slowly in a circle for 90 seconds. Breathe in for 4 counts, out for 6.", tip: "Your body needs this after high intensity work." },
      { name: "Full Body Stretch", duration: 90, instruction: "Quads, hamstrings, calves, shoulders, chest — hold each 20 seconds.", tip: "Stretching after fitness reduces soreness by 30%." },
    ],
  },
};

// ── Timer utility ─────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PitchModePage() {
  const { user } = useAuthStore();

  // Setup
  const [phase, setPhase] = useState<Phase>("setup");
  const [focusId, setFocusId] = useState<string>("");
  const [duration, setDuration] = useState(30);
  const [loadingSession, setLoadingSession] = useState(false);

  // Active session
  const [session, setSession] = useState<Session | null>(null);
  const [drillPhase, setDrillPhase] = useState<DrillPhase>("warmup");
  const [drillIndex, setDrillIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [completedDrills, setCompletedDrills] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Done
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);

  // ── Current drill ──────────────────────────────────────────────────────────

  const currentDrills = useCallback((s: Session, dp: DrillPhase): Drill[] => {
    if (dp === "warmup") return s.warmup;
    if (dp === "main") return s.main;
    return s.cooldown;
  }, []);

  const currentDrill = session ? currentDrills(session, drillPhase)[drillIndex] : null;

  const totalDrills = session
    ? session.warmup.length + session.main.length + session.cooldown.length
    : 0;

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (running && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, timeLeft]);

  // ── Advance to next drill ─────────────────────────────────────────────────

  const nextDrill = useCallback(() => {
    if (!session) return;
    const drills = currentDrills(session, drillPhase);
    setCompletedDrills((n) => n + 1);

    if (drillIndex < drills.length - 1) {
      const next = drills[drillIndex + 1];
      setDrillIndex(drillIndex + 1);
      setTimeLeft(next.duration);
      setRunning(false);
    } else if (drillPhase === "warmup") {
      setDrillPhase("main");
      setDrillIndex(0);
      setTimeLeft(session.main[0].duration);
      setRunning(false);
    } else if (drillPhase === "main") {
      setDrillPhase("cooldown");
      setDrillIndex(0);
      setTimeLeft(session.cooldown[0].duration);
      setRunning(false);
    } else {
      setPhase("done");
    }
  }, [session, drillPhase, drillIndex, currentDrills]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && phase === "active" && session) {
      const timer = setTimeout(nextDrill, 1500);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, phase, session, nextDrill]);

  // ── Build session ─────────────────────────────────────────────────────────

  const buildSession = async () => {
    if (!focusId) return;
    setLoadingSession(true);

    // Try AI-generated session, fall back to template
    try {
      const focus = FOCUS_AREAS.find((f) => f.id === focusId)!;
      const prompt =
        `Create a ${duration}-minute solo football training session focused on ${focus.label}. ` +
        `The player trains alone in Zimbabwe — they may only have a ball, some stones as markers, and a wall or fence. ` +
        `Return JSON only in this exact shape: ` +
        `{"focus":"${focus.label}","totalMinutes":${duration},"warmup":[{"name":"...","duration":90,"instruction":"...","tip":"..."}],"main":[...],"cooldown":[...]} ` +
        `warmup: 2 drills. main: 4 drills. cooldown: 2 drills. duration is in seconds (60–300). ` +
        `All drills must be doable completely alone with minimal equipment.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: "You are a football coach. Return only valid JSON. No markdown." }),
      });

      if (res.ok) {
        const data = await res.json() as { response?: string };
        const raw = data.response ?? "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Session;
          if (parsed.warmup && parsed.main && parsed.cooldown) {
            setSession(parsed);
            setDrillPhase("warmup");
            setDrillIndex(0);
            setTimeLeft(parsed.warmup[0].duration);
            setRunning(false);
            setPhase("active");
            setLoadingSession(false);
            return;
          }
        }
      }
    } catch { /* fall through to template */ }

    // Use built-in template
    const template = { ...DEFAULT_SESSIONS[focusId] };
    // Scale drill durations to match selected duration
    const scale = duration / template.totalMinutes;
    const scaleDrills = (drills: Drill[]) =>
      drills.map((d) => ({ ...d, duration: Math.round(d.duration * scale) }));
    const scaled: Session = {
      ...template,
      totalMinutes: duration,
      warmup: scaleDrills(template.warmup),
      main: scaleDrills(template.main),
      cooldown: scaleDrills(template.cooldown),
    };

    setSession(scaled);
    setDrillPhase("warmup");
    setDrillIndex(0);
    setTimeLeft(scaled.warmup[0].duration);
    setRunning(false);
    setPhase("active");
    setLoadingSession(false);
  };

  // ── Log session on completion ─────────────────────────────────────────────

  const logSession = async () => {
    if (!session || logged) return;
    setLogging(true);
    try {
      await api.post("/player/sessions", {
        session_date: new Date().toISOString().split("T")[0],
        duration: session.totalMinutes,
        type: "training",
        intensity: "medium",
        notes: `Pitch Mode — ${session.focus} focus. ${completedDrills}/${totalDrills} drills completed.`,
      });
      setLogged(true);
    } catch { /* non-critical */ }
    setLogging(false);
  };

  // ── Progress bar ──────────────────────────────────────────────────────────

  const progressPct = totalDrills > 0 ? Math.round((completedDrills / totalDrills) * 100) : 0;

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl">

            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Pitch Mode</h1>
                <p className="text-sm text-muted-foreground">Solo training · AI-powered drill session</p>
              </div>
            </div>

            {/* Focus area */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Choose your focus</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FOCUS_AREAS.map((f) => {
                  const Icon = f.icon;
                  const selected = focusId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFocusId(f.id)}
                      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#f0b429] bg-[#f0b429]/10 shadow-md"
                          : "border-[#f0b429]/10 bg-card hover:border-[#f0b429]/20 hover:bg-card/80"
                      }`}
                    >
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold ${selected ? "text-[#f0b429]" : "text-white"}`}>{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                      {selected && <CheckCircle2 className="ml-auto h-5 w-5 flex-shrink-0 text-[#f0b429]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Session length</p>
              <div className="flex flex-wrap gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all ${
                      duration === d
                        ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                        : "border-[#f0b429]/10 bg-card text-white hover:border-[#f0b429]/20"
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Start */}
            <button
              onClick={buildSession}
              disabled={!focusId || loadingSession}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f0b429] py-4 text-base font-bold text-[#1a3a1a] transition-all hover:bg-[#f0b429]/90 disabled:opacity-40"
            >
              {loadingSession ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Building your session…</>
              ) : (
                <><Play className="h-5 w-5" /> Start Pitch Mode</>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Works with just a ball and stones as markers · No equipment needed
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── DONE SCREEN ───────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="gs-watermark flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-md pt-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#f0b429]/40 bg-[#f0b429]/10">
              <Trophy className="h-10 w-10 text-[#f0b429]" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Session Complete!</h2>
            <p className="mt-2 text-muted-foreground">
              {session?.focus} · {session?.totalMinutes} minutes · {completedDrills} drills
            </p>

            <div className="mt-6 rounded-2xl border border-[#f0b429]/10 bg-card p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Session Summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Focus</span>
                  <span className="font-medium text-white">{session?.focus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-white">{session?.totalMinutes} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Drills Completed</span>
                  <span className="font-medium text-[#f0b429]">{completedDrills} / {totalDrills}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                onClick={logSession}
                disabled={logging || logged}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 font-semibold text-[#1a3a1a] disabled:opacity-60"
              >
                {logged ? (
                  <><CheckCircle2 className="h-4 w-4" /> Logged to your sessions</>
                ) : logging ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Log this session</>
                )}
              </button>
              <button
                onClick={() => { setPhase("setup"); setFocusId(""); setSession(null); setCompletedDrills(0); setLogged(false); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#f0b429]/10 py-3 text-sm text-white hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" /> Train Again
              </button>
              <Link href="/player" className="text-sm text-muted-foreground hover:text-white text-center py-2">
                Back to Player Hub
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── ACTIVE SESSION ────────────────────────────────────────────────────────

  if (!session || !currentDrill) return null;

  const drills = currentDrills(session, drillPhase);
  const phaseLabel = drillPhase === "warmup" ? "Warm-Up" : drillPhase === "main" ? "Main Session" : "Cool-Down";
  const phaseColor = drillPhase === "warmup" ? "text-amber-400" : drillPhase === "main" ? "text-emerald-400" : "text-blue-400";
  const timerPct = currentDrill ? Math.round((1 - timeLeft / currentDrill.duration) * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-xl">

          {/* Progress bar */}
          <div className="mb-4 flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pitch Mode — {session.focus}</span>
                <span>{completedDrills}/{totalDrills} drills</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#f0b429] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Phase label */}
          <div className="mb-4 flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-widest ${phaseColor}`}>{phaseLabel}</span>
            <span className="text-xs text-muted-foreground">· {drillIndex + 1} of {drills.length}</span>
          </div>

          {/* Main drill card */}
          <div className="rounded-3xl border border-[#f0b429]/10 bg-card overflow-hidden mb-4">
            {/* Timer ring */}
            <div className="flex flex-col items-center bg-gradient-to-b from-[#1a3d26] to-card py-8">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke={timeLeft === 0 ? "#22c55e" : "#f0b429"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={`${2 * Math.PI * 54 * (1 - timerPct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-3xl font-extrabold text-white">{formatTime(timeLeft)}</p>
                  {timeLeft === 0 && <p className="text-xs text-emerald-400 font-semibold">Done!</p>}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0b429] text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
                >
                  {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  onClick={nextDrill}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f0b429]/20 text-white hover:bg-white/10 transition-colors"
                  title="Skip drill"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Drill info */}
            <div className="px-6 py-5">
              <h2 className="text-lg font-bold text-white mb-3">{currentDrill.name}</h2>

              <div className="mb-4 rounded-xl bg-white/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f0b429] mb-1">What to do</p>
                <p className="text-sm text-white/80 leading-relaxed">{currentDrill.instruction}</p>
              </div>

              <div className="rounded-xl bg-emerald-900/20 border border-emerald-500/20 px-4 py-3 flex gap-2">
                <Timer className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-400">Coach Tip</p>
                  <p className="text-sm text-white/70">{currentDrill.tip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming drills */}
          {drills.slice(drillIndex + 1, drillIndex + 3).length > 0 && (
            <div className="rounded-2xl border border-[#f0b429]/10 bg-card/50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</p>
              <div className="space-y-2">
                {drills.slice(drillIndex + 1, drillIndex + 3).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-white/70">{d.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(d.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
