"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Copy, Check, Database, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { getMatch, extractShots } from "@/lib/analyst-api";
import { MatchLoader } from "@/components/analyst/match-loader";

const XG_ZONES = [
  { id: "six_yard",        label: "Six-Yard Box",        xg: 0.76 },
  { id: "penalty_spot",    label: "Penalty Spot",         xg: 0.45 },
  { id: "central_box",     label: "Central Box",          xg: 0.35 },
  { id: "wide_box_left",   label: "Wide Box Left",        xg: 0.12 },
  { id: "wide_box_right",  label: "Wide Box Right",       xg: 0.12 },
  { id: "edge_centre",     label: "Edge of Box (Centre)", xg: 0.18 },
  { id: "edge_wide_left",  label: "Edge Left",            xg: 0.07 },
  { id: "edge_wide_right", label: "Edge Right",           xg: 0.07 },
  { id: "long_range",      label: "Long Range",           xg: 0.04 },
];

interface Shot {
  id: string;
  team: "home" | "away";
  zone: string;
  xg: number;
  minute: number;
  isGoal: boolean;
}

function xgColor(xg: number) {
  if (xg >= 0.5) return "bg-red-500/80";
  if (xg >= 0.3) return "bg-orange-500/80";
  if (xg >= 0.15) return "bg-yellow-500/80";
  return "bg-zinc-500/60";
}

const LS_KEY = "gs_xg_shots";

function XgAnalysisInner() {
  const searchParams = useSearchParams();
  const [shots, setShots] = useState<Shot[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Shot[]; } catch { return []; }
  });
  const [team, setTeam]         = useState<"home" | "away">("home");
  const [zone, setZone]         = useState(XG_ZONES[0].id);
  const [minute, setMinute]     = useState(1);
  const [isGoal, setIsGoal]     = useState(false);
  const [copied, setCopied]     = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchLabel, setMatchLabel] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(shots)); } catch {} }, [shots]);

  // Auto-load if ?match_id= is in URL
  useEffect(() => {
    const mid = searchParams.get("match_id");
    if (!mid) return;
    setLoadingMatch(true);
    getMatch(mid).then((m) => {
      const loaded = extractShots(m.events);
      setShots(loaded);
      setMatchLabel(`${m.home_team} vs ${m.away_team}`);
    }).catch(() => {}).finally(() => setLoadingMatch(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addShot = () => {
    const zoneData = XG_ZONES.find((z) => z.id === zone);
    if (!zoneData) return;
    setShots((prev) => [...prev, {
      id: crypto.randomUUID(),
      team, zone: zoneData.label, xg: zoneData.xg, minute, isGoal,
    }]);
    setIsGoal(false);
  };

  const removeShot = (id: string) => setShots((prev) => prev.filter((s) => s.id !== id));

  const homeShots  = shots.filter((s) => s.team === "home");
  const awayShots  = shots.filter((s) => s.team === "away");
  const homeXg     = homeShots.reduce((s, x) => s + x.xg, 0);
  const awayXg     = awayShots.reduce((s, x) => s + x.xg, 0);
  const homeGoals  = homeShots.filter((s) => s.isGoal).length;
  const awayGoals  = awayShots.filter((s) => s.isGoal).length;

  const efficiency = (goals: number, xg: number) =>
    xg > 0 ? `${Math.round((goals / xg) * 100)}%` : "—";

  const exportText = () => {
    const lines = [
      "⚽ xG MATCH REPORT",
      `Home: ${homeGoals} goals / ${homeXg.toFixed(2)} xG (efficiency: ${efficiency(homeGoals, homeXg)})`,
      `Away: ${awayGoals} goals / ${awayXg.toFixed(2)} xG (efficiency: ${efficiency(awayGoals, awayXg)})`,
      "",
      "SHOTS:",
      ...shots.map((s) => `${s.minute}' [${s.team.toUpperCase()}] ${s.zone} — xG ${s.xg.toFixed(2)}${s.isGoal ? " ✅ GOAL" : ""}`),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {showLoader && (
        <MatchLoader
          title="Load Shots from Match"
          onClose={() => setShowLoader(false)}
          onSelect={(m) => {
            setShots(extractShots(m.events));
            setMatchLabel(`${m.home_team} vs ${m.away_team}`);
            setShowLoader(false);
          }}
        />
      )}
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">xG & Shot Analysis</h1>
            <p className="text-sm text-accent/80 italic">
              {matchLabel ? `Loaded: ${matchLabel}` : "Log shots, track expected goals"}
            </p>
          </div>
          <button
            onClick={() => setShowLoader(true)}
            disabled={loadingMatch}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-white"
          >
            {loadingMatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            Load Match
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add shot panel */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Log a Shot</h2>

              {/* Team toggle */}
              <div className="mb-4 flex rounded-xl border overflow-hidden">
                {(["home", "away"] as const).map((t) => (
                  <button key={t} onClick={() => setTeam(t)}
                    className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors ${team === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Zone */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Zone</label>
                <select value={zone} onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring">
                  {XG_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>{z.label} — xG {z.xg}</option>
                  ))}
                </select>
              </div>

              {/* Minute */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minute</label>
                <input type="number" min={1} max={120} value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </div>

              {/* Goal */}
              <label className="mb-4 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isGoal} onChange={(e) => setIsGoal(e.target.checked)}
                  className="h-4 w-4 rounded" />
                <span className="text-sm">Goal scored</span>
              </label>

              <button onClick={addShot}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Add Shot
              </button>
            </div>

            {/* Zone reference */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">xG Reference</p>
              <div className="space-y-1.5">
                {XG_ZONES.map((z) => (
                  <div key={z.id} className="flex items-center gap-2">
                    <div className={`h-3 w-3 flex-shrink-0 rounded-sm ${xgColor(z.xg)}`} />
                    <span className="flex-1 text-xs">{z.label}</span>
                    <span className="text-xs font-bold text-muted-foreground">{z.xg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats + log */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Home xG",    value: homeXg.toFixed(2),                    color: "text-blue-400" },
                { label: "Away xG",    value: awayXg.toFixed(2),                    color: "text-orange-400" },
                { label: "Home Goals", value: `${homeGoals} (${efficiency(homeGoals, homeXg)})`, color: "text-green-400" },
                { label: "Away Goals", value: `${awayGoals} (${efficiency(awayGoals, awayXg)})`, color: "text-green-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Shot log */}
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <p className="text-sm font-semibold">{shots.length} shot{shots.length !== 1 ? "s" : ""} logged</p>
                {shots.length > 0 && (
                  <button onClick={exportText}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Export</>}
                  </button>
                )}
              </div>
              {shots.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No shots logged yet. Use the form to add shots.</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {shots.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="w-8 text-center text-xs font-bold text-muted-foreground">{s.minute}&apos;</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${s.team === "home" ? "bg-blue-500/15 text-blue-700" : "bg-orange-500/15 text-orange-700"}`}>
                        {s.team}
                      </span>
                      <span className="flex-1 text-sm">{s.zone}</span>
                      <div className={`h-2.5 w-2.5 rounded-sm ${xgColor(s.xg)}`} />
                      <span className="w-10 text-right text-xs font-bold">{s.xg.toFixed(2)}</span>
                      {s.isGoal && <span className="text-green-500 text-xs font-bold">GOAL</span>}
                      <button onClick={() => removeShot(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function XgAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <XgAnalysisInner />
    </Suspense>
  );
}
