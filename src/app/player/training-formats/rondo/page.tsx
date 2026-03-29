"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Brain, Loader2, Plus, Minus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

const SHAPES = ["4v1", "5v2", "6v2", "6v3", "Position rondo"];

export default function RondoPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shape, setShape] = useState("5v2");
  const [metrics, setMetrics] = useState({ passes: 0, turnovers: 0, pressureWins: 0, successfulSequences: 0 });
  const [maxSequence, setMaxSequence] = useState(0);
  const [current, setCurrent] = useState(0);
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    // guests allowed — no login redirect
  }, [user, router]);

  const inc = (k: keyof typeof metrics) => setMetrics((m) => ({ ...m, [k]: m[k] + 1 }));
  const dec = (k: keyof typeof metrics) => setMetrics((m) => ({ ...m, [k]: Math.max(0, m[k] - 1) }));

  const addPass = () => {
    const next = current + 1;
    setCurrent(next);
    setMaxSequence((ms) => Math.max(ms, next));
    inc("passes");
  };

  const turnover = () => {
    if (current > 0) inc("turnovers");
    setCurrent(0);
  };

  const getReport = async () => {
    setLoadingReport(true);
    try {
      const total = metrics.passes + metrics.turnovers;
      const retentionPct = total > 0 ? Math.round((metrics.passes / total) * 100) : 0;
      const reply = await queryAI(`Rondo session (${shape}): ${metrics.passes} passes, ${metrics.turnovers} turnovers, ${metrics.pressureWins} pressure wins, ${metrics.successfulSequences} sequences of 5+ passes. Retention rate: ${retentionPct}%. Max consecutive passes: ${maxSequence}. Give coaching feedback on ball retention, press resistance, and 3 specific drills to improve.`, "player");
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report."); }
    finally { setLoadingReport(false); }
  };

  const total = metrics.passes + metrics.turnovers;
  const retention = total > 0 ? Math.round((metrics.passes / total) * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/training-formats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Rondo / Possession</h1>
            <p className="text-sm text-muted-foreground">Track passes, turnovers, and ball retention</p>
          </div>
        </div>

        {/* Shape selector */}
        <div className="mb-5 flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <button key={s} onClick={() => setShape(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                shape === s ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}>{s}</button>
          ))}
        </div>

        {/* Live counter */}
        <div className="mb-6 rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 p-6 text-center">
          <p className="mb-1 text-sm text-muted-foreground">Current sequence</p>
          <p className="text-7xl font-black text-blue-500">{current}</p>
          <p className="text-sm text-muted-foreground">passes · max: {maxSequence}</p>
          <div className="mt-5 flex justify-center gap-4">
            <button onClick={addPass}
              className="rounded-2xl bg-blue-500 px-8 py-4 text-lg font-bold text-white hover:bg-blue-400 transition-colors">
              ✓ Pass
            </button>
            <button onClick={turnover}
              className="rounded-2xl bg-red-500/20 border-2 border-red-500/40 px-8 py-4 text-lg font-bold text-red-600 hover:bg-red-500/30 transition-colors">
              ✗ Turnover
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total passes", value: metrics.passes, color: "text-blue-500" },
            { label: "Turnovers", value: metrics.turnovers, color: "text-red-500" },
            { label: "Retention", value: `${retention}%`, color: "text-green-500" },
            { label: "Max sequence", value: maxSequence, color: "text-yellow-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Manual counters */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {[
            { k: "pressureWins" as const, label: "Pressure wins (defender)", color: "text-orange-500" },
            { k: "successfulSequences" as const, label: "5+ pass sequences", color: "text-purple-500" },
          ].map(({ k, label, color }) => (
            <div key={k} className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm text-muted-foreground">{label}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => dec(k)} className="rounded-lg border p-2 hover:bg-muted"><Minus className="h-4 w-4" /></button>
                <p className={`flex-1 text-center text-2xl font-bold ${color}`}>{metrics[k]}</p>
                <button onClick={() => inc(k)} className="rounded-lg border p-2 hover:bg-muted"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setMetrics({ passes: 0, turnovers: 0, pressureWins: 0, successfulSequences: 0 }); setCurrent(0); setMaxSequence(0); setAiReport(""); }}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          {total > 0 && (
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
              <h3 className="font-semibold text-purple-700">AI Rondo Analysis</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
          </div>
        )}
      </main>
    </div>
  );
}
