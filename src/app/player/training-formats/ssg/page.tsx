"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Brain, Loader2, Plus, Minus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

const FORMATS_SSG = ["3v3", "4v4", "5v5", "6v6", "7v7", "Attack vs Defence"];

export default function SSGPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [format, setFormat] = useState("5v5");
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [stats, setStats] = useState({
    team1Possession: 50, team2Possession: 50,
    team1Fouls: 0, team2Fouls: 0,
    corners: 0, offsides: 0,
  });
  const [half, setHalf] = useState(1);
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    // guests allowed — no login redirect
  }, [user, router]);

  const goal = (team: 1 | 2) => setScore((s) => ({ ...s, [`team${team}`]: s[`team${team}` as "team1" | "team2"] + 1 }));
  const foul = (team: 1 | 2) => setStats((s) => ({ ...s, [`team${team}Fouls`]: s[`team${team}Fouls` as "team1Fouls" | "team2Fouls"] + 1 }));

  const adjustPossession = (t1: number) => {
    setStats((s) => ({ ...s, team1Possession: Math.max(10, Math.min(90, t1)), team2Possession: 100 - Math.max(10, Math.min(90, t1)) }));
  };

  const getReport = async () => {
    setLoadingReport(true);
    try {
      const reply = await queryAI(`SSG (${format}) results: Score ${score.team1}-${score.team2}. Possession: Team1 ${stats.team1Possession}% vs Team2 ${stats.team2Possession}%. Fouls: Team1 ${stats.team1Fouls}, Team2 ${stats.team2Fouls}. Corners: ${stats.corners}, Offsides: ${stats.offsides}. ${half > 1 ? "2nd half played." : "1st half only."} Give tactical feedback and key learning points for both teams.`, "player");
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report."); }
    finally { setLoadingReport(false); }
  };


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/training-formats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Small-Sided Game</h1>
            <p className="text-sm text-muted-foreground">Live scoreboard · Possession · Fouls</p>
          </div>
        </div>

        {/* Format selector */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FORMATS_SSG.map((f) => (
            <button key={f} onClick={() => setFormat(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                format === f ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
              }`}>{f}</button>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="mb-6 rounded-2xl border-2 border-muted bg-card p-6">
          <div className="mb-2 text-center text-xs text-muted-foreground">Half {half} · {format}</div>
          <div className="flex items-center justify-around">
            {[1, 2].map((t) => (
              <div key={t} className="flex flex-col items-center gap-3">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-black ${t === 1 ? "bg-blue-500/20 text-blue-600" : "bg-red-500/20 text-red-600"}`}>
                  {score[`team${t}` as "team1" | "team2"]}
                </div>
                <p className="text-sm font-medium">Team {t}</p>
                <button onClick={() => goal(t as 1 | 2)}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors ${t === 1 ? "bg-blue-500 hover:bg-blue-400" : "bg-red-500 hover:bg-red-400"}`}>
                  + Goal
                </button>
              </div>
            ))}
            <div className="text-4xl font-black text-muted-foreground">vs</div>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button onClick={() => setHalf(1)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${half === 1 ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>1st Half</button>
            <button onClick={() => setHalf(2)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${half === 2 ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>2nd Half</button>
          </div>
        </div>

        {/* Possession slider */}
        <div className="mb-6 rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">Possession</h3>
          <div className="flex items-center gap-3">
            <span className="w-12 text-right text-sm font-bold text-blue-500">{stats.team1Possession}%</span>
            <input type="range" min={10} max={90} value={stats.team1Possession}
              onChange={(e) => adjustPossession(parseInt(e.target.value))}
              className="flex-1 accent-primary" />
            <span className="w-12 text-sm font-bold text-red-500">{stats.team2Possession}%</span>
          </div>
          <div className="mt-2 flex overflow-hidden rounded-full">
            <div className="h-3 bg-blue-500 transition-all" style={{ width: `${stats.team1Possession}%` }} />
            <div className="h-3 flex-1 bg-red-500" />
          </div>
        </div>

        {/* Fouls, corners, offsides */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {[
            { label: "Team 1 Fouls", k: "team1Fouls" as const, color: "text-blue-500" },
            { label: "Team 2 Fouls", k: "team2Fouls" as const, color: "text-red-500" },
          ].map(({ label, k, color }) => (
            <div key={k} className="rounded-xl border bg-card p-4">
              <p className="mb-2 text-sm text-muted-foreground">{label}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setStats((s) => ({ ...s, [k]: Math.max(0, s[k] - 1) }))}
                  className="rounded-lg border p-2 hover:bg-muted"><Minus className="h-4 w-4" /></button>
                <p className={`flex-1 text-center text-2xl font-bold ${color}`}>{stats[k]}</p>
                <button onClick={() => foul(k === "team1Fouls" ? 1 : 2)}
                  className="rounded-lg border p-2 hover:bg-muted"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { setScore({ team1: 0, team2: 0 }); setStats({ team1Possession: 50, team2Possession: 50, team1Fouls: 0, team2Fouls: 0, corners: 0, offsides: 0 }); setHalf(1); setAiReport(""); }}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button onClick={getReport} disabled={loadingReport}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
            {loadingReport ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : <><Brain className="h-4 w-4" /> Get AI analysis</>}
          </button>
        </div>

        {aiReport && (
          <div className="mt-5 rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-purple-700">AI Tactical Analysis</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
          </div>
        )}
      </main>
    </div>
  );
}
