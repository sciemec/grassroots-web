"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Brain, Loader2, Play, Square } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

const DRILLS = [
  { id: "t-cone", name: "T-Cone Agility", benchmark: "10.5s", unit: "s", desc: "Sprint forward, shuffle right, shuffle left, back-pedal to start" },
  { id: "box-dribble", name: "Box Dribble", benchmark: "8.0s", unit: "s", desc: "Dribble around 4 cones in a 5m box" },
  { id: "weave", name: "Weave Cones", benchmark: "7.5s", unit: "s", desc: "Slalom through 8 cones over 20m" },
  { id: "juggling", name: "Juggling Challenge", benchmark: "25", unit: "touches", desc: "Max consecutive juggles without the ball touching the ground" },
  { id: "ladder", name: "Ladder Speed", benchmark: "3.2s", unit: "s", desc: "10-rung agility ladder, both feet in each rung" },
];

export default function DrillsFormatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState(DRILLS[0].id);
  const [results, setResults] = useState<Record<string, number[]>>({});
  const [timerMs, setTimerMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const intervalRef = { current: null as ReturnType<typeof setInterval> | null };

  const currentDrill = DRILLS.find((d) => d.id === selected)!;

  useEffect(() => { // guests allowed — no login redirect }, [user, router]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  });

  const startTimer = () => {
    setTimerMs(0);
    setRunning(true);
    intervalRef.current = setInterval(() => setTimerMs((t) => t + 10), 10);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    const secs = timerMs / 1000;
    setResults((prev) => ({ ...prev, [selected]: [...(prev[selected] ?? []), secs] }));
  };

  const getReport = async () => {
    setLoadingReport(true);
    const summary = DRILLS.map((d) => {
      const runs = results[d.id] ?? [];
      if (!runs.length) return null;
      const best = d.unit === "s" ? Math.min(...runs).toFixed(2) : Math.max(...runs).toFixed(0);
      return `${d.name}: best ${best}${d.unit} (benchmark ${d.benchmark})`;
    }).filter(Boolean).join(", ");
    try {
      const reply = await queryAI(`Cone drill results: ${summary}. Give feedback on agility, speed, and technique. Identify weakness areas and recommend 3 specific improvements.`, "player");
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report."); }
    finally { setLoadingReport(false); }
  };

  const hasResults = Object.values(results).some((r) => r.length > 0);


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/training-formats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cone Drills</h1>
            <p className="text-sm text-muted-foreground">Stopwatch · Benchmark comparison · AI feedback</p>
          </div>
        </div>

        {/* Drill picker */}
        <div className="mb-5 flex flex-wrap gap-2">
          {DRILLS.map((d) => (
            <button key={d.id} onClick={() => setSelected(d.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selected === d.id ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}>{d.name}</button>
          ))}
        </div>

        {/* Current drill */}
        <div className="mb-6 rounded-2xl border-2 border-yellow-500/40 bg-yellow-500/5 p-6 text-center">
          <h2 className="mb-1 text-xl font-bold">{currentDrill.name}</h2>
          <p className="mb-1 text-sm text-muted-foreground">{currentDrill.desc}</p>
          <p className="mb-6 text-xs text-yellow-600">Benchmark: {currentDrill.benchmark} {currentDrill.unit}</p>

          {/* Timer */}
          <div className="mb-6">
            <p className="font-mono text-6xl font-black text-primary">
              {currentDrill.unit === "s" ? (timerMs / 1000).toFixed(2) : timerMs}
            </p>
            <p className="text-xs text-muted-foreground">{currentDrill.unit === "s" ? "seconds" : "touches"}</p>
          </div>

          <div className="flex justify-center gap-4">
            {!running ? (
              <button onClick={startTimer}
                className="flex items-center gap-2 rounded-2xl bg-green-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-green-400 transition-colors">
                <Play className="h-5 w-5" /> Start
              </button>
            ) : (
              <button onClick={stopTimer}
                className="flex items-center gap-2 rounded-2xl bg-red-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-red-400 transition-colors">
                <Square className="h-5 w-5" /> Stop
              </button>
            )}
            <button onClick={() => setTimerMs(0)}
              className="rounded-2xl border px-6 py-3.5 text-sm hover:bg-muted transition-colors">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results table */}
        <div className="mb-6 space-y-3">
          {DRILLS.map((d) => {
            const runs = results[d.id] ?? [];
            if (!runs.length) return null;
            const best = d.unit === "s" ? Math.min(...runs) : Math.max(...runs);
            const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
            const benchmark = parseFloat(d.benchmark);
            const passed = d.unit === "s" ? best <= benchmark : best >= benchmark;
            return (
              <div key={d.id} className={`rounded-xl border p-4 ${passed ? "border-green-500/30 bg-green-500/5" : "border-red-400/20 bg-red-500/5"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{d.name}</p>
                  <span className={`text-xs font-bold ${passed ? "text-green-600" : "text-red-500"}`}>
                    {passed ? "✓ Benchmark met" : "Below benchmark"}
                  </span>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>Runs: {runs.length}</span>
                  <span>Best: <b className="text-foreground">{best.toFixed(d.unit === "s" ? 2 : 0)}{d.unit}</b></span>
                  <span>Avg: {avg.toFixed(d.unit === "s" ? 2 : 0)}{d.unit}</span>
                  <span>Target: {d.benchmark}{d.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setResults({}); setTimerMs(0); setAiReport(""); }}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          {hasResults && (
            <button onClick={getReport} disabled={loadingReport}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
              {loadingReport ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : <><Brain className="h-4 w-4" /> Get AI feedback</>}
            </button>
          )}
        </div>

        {aiReport && (
          <div className="mt-5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-purple-700">AI Drill Analysis</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
          </div>
        )}
      </main>
    </div>
  );
}
