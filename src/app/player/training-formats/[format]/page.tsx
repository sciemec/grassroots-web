"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Square, RotateCcw, Plus, Minus, Brain, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { sessionDrillRecommenderPrompt, expertCoachSystemPrompt } from "@/config/prompts";
import api from "@/lib/api";

// ─── Config per format ────────────────────────────────────────────────────────

const FORMAT_CONFIG = {
  rondo: {
    label: "Rondo / Possession",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    accent: "bg-blue-500",
    shapes: ["4v1", "5v2", "6v2", "Position rondo"],
  },
  ssg: {
    label: "Small-Sided Game",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    accent: "bg-green-500",
    shapes: ["3v3 with goals", "5v5 on half pitch", "7v7 with GKs", "Attack vs Defence"],
  },
  drills: {
    label: "Cone Drills",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    accent: "bg-yellow-500",
    shapes: ["T-cone agility", "Box dribble", "Weave cones", "Juggling challenge"],
  },
  shooting: {
    label: "Shooting Session",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    accent: "bg-red-500",
    shapes: ["Penalty practice", "Crossing & finishing", "Long-range shots", "1v1 vs GK"],
  },
};

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const fmt = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return { seconds, running, fmt, start, stop, reset };
}

// ─── Counter button ───────────────────────────────────────────────────────────

function Counter({ label, value, onInc, onDec, color = "bg-primary" }: {
  label: string; value: number; onInc: () => void; onDec: () => void; color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>
      <p className="text-3xl font-black">{value}</p>
      <div className="flex gap-2">
        <button onClick={onDec} className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button onClick={onInc} className={`flex h-8 w-8 items-center justify-center rounded-lg ${color} text-white hover:opacity-90 transition-colors`}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Shooting grid ────────────────────────────────────────────────────────────

const ZONES = ["TL", "TM", "TR", "ML", "MM", "MR", "BL", "BM", "BR"] as const;
type Zone = typeof ZONES[number];

function ShootingGrid({ shots, onShot }: {
  shots: Record<Zone, { on: number; off: number }>;
  onShot: (zone: Zone, on: boolean) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">Goal grid — tap zone: first tap = ON TARGET, second tap = MISSED</p>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-1.5 rounded-xl border-2 border-border p-2">
        {ZONES.map((zone) => {
          const { on, off } = shots[zone];
          return (
            <button
              key={zone}
              onClick={() => onShot(zone, true)}
              onContextMenu={(e) => { e.preventDefault(); onShot(zone, false); }}
              className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted transition-colors min-h-[64px]"
            >
              {on > 0 && <span className="text-sm font-bold text-green-600">{on}✓</span>}
              {off > 0 && <span className="text-xs text-red-500">{off}✗</span>}
              {on === 0 && off === 0 && <span className="text-xs text-muted-foreground/40">{zone}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">Left-click = on target · Right-click = missed</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrainingFormatSessionPage() {
  const { format } = useParams<{ format: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const cfg = FORMAT_CONFIG[format as keyof typeof FORMAT_CONFIG];
  const timer = useTimer();

  // Shared state
  const [shape, setShape] = useState(cfg?.shapes[0] ?? "");
  const [notes, setNotes] = useState("");
  const [sessionDone, setSessionDone] = useState(false);
  const [ai, setAi] = useState({ text: "", loading: false, error: "" });

  // Rondo state
  const [touches, setTouches] = useState(0);
  const [passes, setPasses] = useState(0);
  const [pressureWins, setPressureWins] = useState(0);

  // SSG state
  const [ourGoals, setOurGoals] = useState(0);
  const [theirGoals, setTheirGoals] = useState(0);
  const [fouls, setFouls] = useState(0);
  const [possession, setPossession] = useState(50);

  // Drills state
  const [reps, setReps] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [pb, setPb] = useState("");

  // Shooting state
  const emptyShots = () => Object.fromEntries(ZONES.map((z) => [z, { on: 0, off: 0 }])) as Record<Zone, { on: number; off: number }>;
  const [shots, setShots] = useState(emptyShots);
  const [weakFoot, setWeakFoot] = useState(0);
  const [volleys, setVolleys] = useState(0);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (!cfg) { router.push("/player/training-formats"); return; }
  }, [user, router, cfg]);

  if (!user || !cfg) return null;

  const handleShot = (zone: Zone, onTarget: boolean) => {
    setShots((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [onTarget ? "on" : "off"]: prev[zone][onTarget ? "on" : "off"] + 1 },
    }));
  };

  const totalShots = Object.values(shots).reduce((s, z) => s + z.on + z.off, 0);
  const shotsOnTarget = Object.values(shots).reduce((s, z) => s + z.on, 0);

  const buildStatsSummary = () => {
    if (format === "rondo") return `Shape: ${shape}. Duration: ${timer.fmt}. Touches: ${touches}, Successful passes: ${passes}, Pressure wins: ${pressureWins}.`;
    if (format === "ssg") return `Shape: ${shape}. Duration: ${timer.fmt}. Score: ${ourGoals}–${theirGoals}. Possession: ${possession}%. Fouls: ${fouls}.`;
    if (format === "drills") return `Drill: ${shape}. Duration: ${timer.fmt}. Reps: ${reps}. Accuracy: ${accuracy}%. PB: ${pb || "not set"}.`;
    if (format === "shooting") return `Type: ${shape}. Shots: ${totalShots}. On target: ${shotsOnTarget} (${totalShots ? Math.round((shotsOnTarget / totalShots) * 100) : 0}%). Weak foot: ${weakFoot}. Volleys: ${volleys}.`;
    return "";
  };

  const finishSession = () => {
    timer.stop();
    setSessionDone(true);
    const entry = { format, shape, duration: timer.seconds, stats: buildStatsSummary(), notes, date: new Date().toISOString() };
    const saved = JSON.parse(localStorage.getItem("training_sessions") ?? "[]");
    localStorage.setItem("training_sessions", JSON.stringify([entry, ...saved].slice(0, 50)));
  };

  const getAiFeedback = async () => {
    setAi({ text: "", loading: true, error: "" });
    const statsSummary = buildStatsSummary();
    try {
      const system = expertCoachSystemPrompt({
        playerName: user.name ?? "Player",
        age: 17,
        position: user.position ?? "midfielder",
        skillLevel: "intermediate",
      });
      const message = sessionDrillRecommenderPrompt({
        weakAreas: [`${cfg.label} performance`],
        strongAreas: [],
        sessionHistory: `${shape} session — ${statsSummary}`,
      });
      const res = await api.post("/ai-coach/query", { message, system_prompt: system, history: [] }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAi({ text: res.data.reply ?? res.data.response ?? res.data.message ?? "", loading: false, error: "" });
    } catch {
      setAi({ text: "", loading: false, error: "Could not get AI feedback. Please try again." });
    }
  };

  const resetSession = () => {
    timer.reset();
    setSessionDone(false);
    setTouches(0); setPasses(0); setPressureWins(0);
    setOurGoals(0); setTheirGoals(0); setFouls(0); setPossession(50);
    setReps(0); setAccuracy(0); setPb("");
    setShots(emptyShots());
    setWeakFoot(0); setVolleys(0);
    setNotes("");
    setAi({ text: "", loading: false, error: "" });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/player/training-formats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</h1>
              <p className="text-sm text-muted-foreground">Live session tracker</p>
            </div>
          </div>

          {/* Shape selector */}
          <div className="mb-5 rounded-xl border bg-card p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Session type</p>
            <div className="flex flex-wrap gap-2">
              {cfg.shapes.map((s) => (
                <button key={s} onClick={() => setShape(s)} disabled={timer.running || sessionDone}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${shape === s ? `${cfg.accent} text-white` : "border bg-muted/30 text-muted-foreground hover:bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className={`mb-5 rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5 text-center`}>
            <p className={`text-5xl font-black tabular-nums ${cfg.color}`}>{timer.fmt}</p>
            <div className="mt-4 flex justify-center gap-3">
              {!timer.running && !sessionDone && (
                <button onClick={timer.start} className={`flex items-center gap-2 rounded-xl ${cfg.accent} px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-colors`}>
                  <Play className="h-4 w-4" /> Start
                </button>
              )}
              {timer.running && (
                <button onClick={finishSession} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background hover:opacity-90 transition-colors">
                  <Square className="h-4 w-4" /> Finish session
                </button>
              )}
              {sessionDone && (
                <button onClick={resetSession} className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                  <RotateCcw className="h-4 w-4" /> New session
                </button>
              )}
            </div>
          </div>

          {/* Format-specific trackers */}
          {format === "rondo" && (
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Counter label="Touches" value={touches} onInc={() => setTouches(t => t + 1)} onDec={() => setTouches(t => Math.max(0, t - 1))} color={cfg.accent} />
              <Counter label="Passes ✓" value={passes} onInc={() => setPasses(p => p + 1)} onDec={() => setPasses(p => Math.max(0, p - 1))} color={cfg.accent} />
              <Counter label="Pressure wins" value={pressureWins} onInc={() => setPressureWins(p => p + 1)} onDec={() => setPressureWins(p => Math.max(0, p - 1))} color={cfg.accent} />
            </div>
          )}

          {format === "ssg" && (
            <div className="mb-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Counter label="Our goals" value={ourGoals} onInc={() => setOurGoals(g => g + 1)} onDec={() => setOurGoals(g => Math.max(0, g - 1))} color={cfg.accent} />
                <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">Score</p>
                  <p className="text-3xl font-black">{ourGoals}–{theirGoals}</p>
                </div>
                <Counter label="Their goals" value={theirGoals} onInc={() => setTheirGoals(g => g + 1)} onDec={() => setTheirGoals(g => Math.max(0, g - 1))} color="bg-red-500" />
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Possession %</label>
                  <span className="text-sm font-bold text-green-600">{possession}%</span>
                </div>
                <input type="range" min={0} max={100} value={possession} onChange={(e) => setPossession(Number(e.target.value))} className="w-full accent-green-500" />
              </div>
              <Counter label="Fouls" value={fouls} onInc={() => setFouls(f => f + 1)} onDec={() => setFouls(f => Math.max(0, f - 1))} color="bg-yellow-500" />
            </div>
          )}

          {format === "drills" && (
            <div className="mb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Reps completed" value={reps} onInc={() => setReps(r => r + 1)} onDec={() => setReps(r => Math.max(0, r - 1))} color={cfg.accent} />
                <Counter label="Accuracy %" value={accuracy} onInc={() => setAccuracy(a => Math.min(100, a + 5))} onDec={() => setAccuracy(a => Math.max(0, a - 5))} color={cfg.accent} />
              </div>
              <div className="rounded-xl border bg-card p-4">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Personal best (optional — e.g. 14.2s)</label>
                <input type="text" placeholder="e.g. 14.2s or 8/10 reps" value={pb} onChange={(e) => setPb(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
          )}

          {format === "shooting" && (
            <div className="mb-5 space-y-4">
              <ShootingGrid shots={shots} onShot={handleShot} />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-2xl font-black">{totalShots}</p>
                  <p className="text-xs text-muted-foreground">Total shots</p>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-2xl font-black text-green-600">{shotsOnTarget}</p>
                  <p className="text-xs text-muted-foreground">On target</p>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-2xl font-black">{totalShots ? Math.round((shotsOnTarget / totalShots) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Counter label="Weak foot goals" value={weakFoot} onInc={() => setWeakFoot(w => w + 1)} onDec={() => setWeakFoot(w => Math.max(0, w - 1))} color={cfg.accent} />
                <Counter label="Volleys" value={volleys} onInc={() => setVolleys(v => v + 1)} onDec={() => setVolleys(v => Math.max(0, v - 1))} color={cfg.accent} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-5 rounded-xl border bg-card p-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Session notes (optional)</label>
            <textarea rows={2} placeholder="What worked? What needs improvement?"
              value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
          </div>

          {/* Session done — AI feedback */}
          {sessionDone && (
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${cfg.color}`} />
                <p className="text-sm font-semibold">Session logged</p>
              </div>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {buildStatsSummary()}
              </div>
              <button onClick={getAiFeedback} disabled={ai.loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors">
                {ai.loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : <><Brain className="h-4 w-4" /> Get AI drill recommendations</>}
              </button>
              {ai.error && <p className="text-xs text-destructive">{ai.error}</p>}
              {ai.text && (
                <div className="rounded-xl bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">{ai.text}</div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
