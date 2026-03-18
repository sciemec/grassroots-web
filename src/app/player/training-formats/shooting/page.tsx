"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Brain, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

// 3x3 goal zone grid
const ZONES = [
  ["Top-Left", "Top-Center", "Top-Right"],
  ["Mid-Left", "Mid-Center", "Mid-Right"],
  ["Bot-Left", "Bot-Center", "Bot-Right"],
];

interface ZoneData { shots: number; goals: number }

export default function ShootingFormatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [zoneData, setZoneData] = useState<Record<string, ZoneData>>(() =>
    Object.fromEntries(ZONES.flat().map((z) => [z, { shots: 0, goals: 0 }]))
  );
  const [weakFoot, setWeakFoot] = useState({ shots: 0, goals: 0 });
  const [volleys, setVolleys] = useState({ shots: 0, goals: 0 });
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  const update = (zone: string, field: "shots" | "goals", delta: number) => {
    setZoneData((prev) => {
      const d = prev[zone];
      if (field === "shots") {
        return { ...prev, [zone]: { shots: Math.max(0, d.shots + delta), goals: d.goals } };
      }
      return { ...prev, [zone]: { shots: d.shots, goals: Math.max(0, Math.min(d.shots, d.goals + delta)) } };
    });
  };

  const totalShots = Object.values(zoneData).reduce((s, z) => s + z.shots, 0) + weakFoot.shots + volleys.shots;
  const totalGoals = Object.values(zoneData).reduce((s, z) => s + z.goals, 0) + weakFoot.goals + volleys.goals;
  const accuracy = totalShots > 0 ? Math.round((totalGoals / totalShots) * 100) : 0;

  const getReport = async () => {
    setLoadingReport(true);
    const zoneSummary = ZONES.flat().map((z) => {
      const d = zoneData[z];
      return `${z}: ${d.goals}/${d.shots}`;
    }).join(", ");
    try {
      const reply = await queryAI(`Shooting session results: Zone breakdown: ${zoneSummary}. Weak foot: ${weakFoot.goals}/${weakFoot.shots}. Volleys: ${volleys.goals}/${volleys.shots}. Overall: ${totalGoals}/${totalShots} (${accuracy}%). Provide specific coaching feedback on strongest/weakest zones and a 2-week improvement plan.`, "player");
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report."); }
    finally { setLoadingReport(false); }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/training-formats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Shooting Session</h1>
            <p className="text-sm text-muted-foreground">Track goals per zone · Weak foot · Volleys</p>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{totalShots}</p>
            <p className="text-xs text-muted-foreground">Total shots</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{totalGoals}</p>
            <p className="text-xs text-muted-foreground">Goals</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold">{accuracy}%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
        </div>

        {/* Goal zone grid */}
        <div className="mb-6 rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Goal Zone Map</h2>
          <div className="space-y-2">
            {ZONES.map((row, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-2">
                {row.map((zone) => {
                  const d = zoneData[zone];
                  const pct = d.shots > 0 ? Math.round((d.goals / d.shots) * 100) : 0;
                  return (
                    <div key={zone} className="rounded-xl border bg-muted/20 p-3">
                      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">{zone.replace("-", " ")}</p>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-lg font-bold">{d.goals}</p>
                          <p className="text-xs text-muted-foreground">Goals</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{pct}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{d.shots}</p>
                          <p className="text-xs text-muted-foreground">Shots</p>
                        </div>
                      </div>
                      <div className="flex justify-center gap-2">
                        <button onClick={() => update(zone, "shots", 1)}
                          className="rounded-lg bg-muted px-2 py-1 text-xs hover:bg-muted/80">+Shot</button>
                        <button onClick={() => update(zone, "goals", 1)}
                          className="rounded-lg bg-green-500/20 px-2 py-1 text-xs text-green-700 hover:bg-green-500/30">+Goal</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Weak foot + volleys */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {[
            { label: "Weak Foot", state: weakFoot, setState: setWeakFoot },
            { label: "Volleys", state: volleys, setState: setVolleys },
          ].map(({ label, state, setState }) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 font-semibold">{label}</h3>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold">{state.goals}</p>
                  <p className="text-xs text-muted-foreground">Goals</p>
                  <button onClick={() => setState((s) => ({ ...s, goals: Math.min(s.shots, s.goals + 1) }))}
                    className="mt-1 rounded-lg bg-green-500/20 px-3 py-1 text-xs text-green-700">+Goal</button>
                </div>
                <div className="text-2xl font-bold text-muted-foreground">/</div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{state.shots}</p>
                  <p className="text-xs text-muted-foreground">Shots</p>
                  <button onClick={() => setState((s) => ({ ...s, shots: s.shots + 1 }))}
                    className="mt-1 rounded-lg bg-muted px-3 py-1 text-xs">+Shot</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-3">
          <button onClick={() => {
            setZoneData(Object.fromEntries(ZONES.flat().map((z) => [z, { shots: 0, goals: 0 }])));
            setWeakFoot({ shots: 0, goals: 0 });
            setVolleys({ shots: 0, goals: 0 });
            setAiReport("");
          }}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          {totalShots > 0 && (
            <button onClick={getReport} disabled={loadingReport}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
              {loadingReport ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : <><Brain className="h-4 w-4" /> Get AI feedback</>}
            </button>
          )}
        </div>

        {aiReport && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <h3 className="font-semibold text-purple-700">AI Shooting Analysis</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
          </div>
        )}
      </main>
    </div>
  );
}
