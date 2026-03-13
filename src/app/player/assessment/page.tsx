"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Play, CheckCircle2, Brain, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

const POSITIONS_TESTS: Record<string, { label: string; tests: { name: string; desc: string; benchmark: string; unit: string }[] }> = {
  goalkeeper: {
    label: "Goalkeeper",
    tests: [
      { name: "Reaction save", desc: "Partner shoots from 7m. Record saves out of 10", benchmark: "6/10", unit: "saves/10" },
      { name: "Distribution accuracy", desc: "Throw accurately to target zones (10 throws)", benchmark: "7/10", unit: "accurate/10" },
      { name: "Dive reach (left)", desc: "Measure max reach on a diving save left side", benchmark: "2.3m", unit: "metres" },
      { name: "Dive reach (right)", desc: "Measure max reach on a diving save right side", benchmark: "2.3m", unit: "metres" },
    ],
  },
  defender: {
    label: "Defender",
    tests: [
      { name: "40m sprint", desc: "Sprint 40m from standing start", benchmark: "5.2s", unit: "seconds" },
      { name: "1v1 tackle success", desc: "10 1v1 defending attempts vs attacker", benchmark: "6/10", unit: "won/10" },
      { name: "Clearance distance", desc: "Head or kick clearance from penalty area", benchmark: "30m", unit: "metres" },
      { name: "Pass accuracy", desc: "5m, 15m, 30m passes (10 each). Count accurate", benchmark: "22/30", unit: "accurate/30" },
    ],
  },
  midfielder: {
    label: "Midfielder",
    tests: [
      { name: "20m sprint", desc: "Sprint 20m from standing start (acceleration)", benchmark: "3.0s", unit: "seconds" },
      { name: "Passing accuracy", desc: "Pass to targets at 5m, 15m, 30m. 10 per distance", benchmark: "24/30", unit: "accurate/30" },
      { name: "Ball retention (1v1)", desc: "Keep the ball vs defender for 20 seconds, 5 attempts", benchmark: "3/5", unit: "retained/5" },
      { name: "Yo-Yo endurance", desc: "Intermittent recovery test — record level reached", benchmark: "Level 14", unit: "level" },
    ],
  },
  forward: {
    label: "Forward",
    tests: [
      { name: "10m sprint", desc: "Pure acceleration over 10m", benchmark: "1.7s", unit: "seconds" },
      { name: "Shooting accuracy", desc: "Shoot from edge of box, 10 attempts (5 zones)", benchmark: "5/10", unit: "on target/10" },
      { name: "Dribble + finish", desc: "Cone dribble 20m then finish. Time to goal", benchmark: "8.5s", unit: "seconds" },
      { name: "Aerial duel wins", desc: "10 crosses from wide — win duel or score", benchmark: "4/10", unit: "won/10" },
    ],
  },
};


export default function AssessmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [positionGroup, setPositionGroup] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<Record<string, string>>({});
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  const currentTests = positionGroup ? POSITIONS_TESTS[positionGroup]?.tests ?? [] : [];

  const allFilled = currentTests.length > 0 && currentTests.every((t) => results[t.name]?.trim());

  const getReport = async () => {
    setLoadingReport(true);
    const summary = currentTests.map((t) => `${t.name}: ${results[t.name]} ${t.unit} (benchmark: ${t.benchmark})`).join(", ");
    try {
      const res = await api.post("/ai-coach/query", {
        message: `Position assessment results for ${positionGroup}: ${summary}.
Provide a brief analysis: overall rating out of 10, 2 key strengths, 2 areas to improve, and a 4-week training focus. Be specific and encouraging.`,
      });
      setAiReport(res.data?.response ?? "Unable to generate report. Please try again.");
    } catch {
      setAiReport("Unable to connect to AI Coach. Please check your connection and try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const compareToChampionship = (test: { benchmark: string; unit: string }, value: string): boolean => {
    const numVal = parseFloat(value);
    const numBench = parseFloat(test.benchmark);
    if (isNaN(numVal) || isNaN(numBench)) return false;
    // For time metrics — lower is better
    if (test.unit === "seconds") return numVal <= numBench;
    return numVal >= numBench;
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Position Assessment</h1>
            <p className="text-sm text-muted-foreground">Benchmark yourself against Zimbabwe U17/Senior standards</p>
          </div>
        </div>

        {!started ? (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-xl font-bold">Position Assessment Hub</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Run field tests with a partner and enter your results to get an AI-powered performance report.
              </p>
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-left">Select your position group</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(POSITIONS_TESTS).map(([id, { label }]) => (
                    <button key={id} onClick={() => setPositionGroup(id)}
                      className={`rounded-xl border p-4 text-sm font-medium transition-all ${
                        positionGroup === id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStarted(true)} disabled={!positionGroup}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Play className="h-4 w-4" /> Start Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold capitalize">{positionGroup} Tests</h2>
              <button onClick={() => { setStarted(false); setResults({}); setAiReport(""); }}
                className="text-xs text-muted-foreground hover:underline">← Change position</button>
            </div>

            <p className="mb-5 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Run each test on the field with a partner. Enter your result in the box provided.
              Compare to the Zimbabwe benchmark shown.
            </p>

            <div className="mb-6 space-y-4">
              {currentTests.map((test) => {
                const val = results[test.name] ?? "";
                const passed = val ? compareToChampionship(test, val) : null;
                return (
                  <div key={test.name} className={`rounded-xl border p-5 transition-all ${
                    passed === true ? "border-green-500/40 bg-green-500/5" :
                    passed === false ? "border-red-500/30 bg-red-500/5" : "bg-card"
                  }`}>
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-semibold">{test.name}</h3>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        Benchmark: {test.benchmark}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{test.desc}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.1"
                        placeholder={`Enter result (${test.unit})`}
                        value={val}
                        onChange={(e) => setResults((r) => ({ ...r, [test.name]: e.target.value }))}
                        className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">{test.unit}</span>
                      {passed === true && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                      {passed === false && <span className="text-xs text-red-500">Below benchmark</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {allFilled && !aiReport && (
              <button onClick={getReport} disabled={loadingReport}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                {loadingReport ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating AI report…</>
                ) : (
                  <><Brain className="h-4 w-4" /> Get AI performance report</>
                )}
              </button>
            )}

            {aiReport && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-purple-700">AI Performance Report</h3>
                </div>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{aiReport}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
