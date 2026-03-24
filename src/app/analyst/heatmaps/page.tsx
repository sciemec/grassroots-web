"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

const COLS = 6;
const ROWS = 10;
const TOTAL = COLS * ROWS;

function zoneColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return "bg-white/5";
  const ratio = count / maxCount;
  if (ratio >= 0.8) return "bg-[#ce1126]/80";
  if (ratio >= 0.6) return "bg-orange-500/70";
  if (ratio >= 0.4) return "bg-[#f0b429]/60";
  if (ratio >= 0.2) return "bg-yellow-300/40";
  return "bg-green-500/20";
}

const LS_KEY = "gs_heatmaps";
const DEFAULT_SQUAD = "Goalkeeper\nRight Back\nLeft Back\nCentre Back 1\nCentre Back 2\nCentral Midfield\nAttacking Midfield\nRight Wing\nLeft Wing\nStriker 1\nStriker 2";

export default function HeatmapsPage() {
  const [squadInput, setSquadInput] = useState(() => {
    try { return localStorage.getItem(LS_KEY + "_squad") ?? DEFAULT_SQUAD; } catch { return DEFAULT_SQUAD; }
  });
  const [selectedPlayer, setSelectedPlayer] = useState(0);
  const [heatmaps, setHeatmaps] = useState<Record<number, number[]>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY + "_data") ?? "{}") as Record<number, number[]>; } catch { return {}; }
  });

  useEffect(() => { try { localStorage.setItem(LS_KEY + "_squad", squadInput); } catch {} }, [squadInput]);
  useEffect(() => { try { localStorage.setItem(LS_KEY + "_data", JSON.stringify(heatmaps)); } catch {} }, [heatmaps]);

  const players = squadInput.split("\n").map((l) => l.trim()).filter(Boolean);

  const currentMap = heatmaps[selectedPlayer] ?? Array(TOTAL).fill(0);
  const maxCount   = Math.max(...currentMap, 1);

  const handleZoneClick = (idx: number) => {
    setHeatmaps((prev) => {
      const map = [...(prev[selectedPlayer] ?? Array(TOTAL).fill(0))];
      map[idx] = (map[idx] ?? 0) + 1;
      return { ...prev, [selectedPlayer]: map };
    });
  };

  const clearPlayer = () => {
    setHeatmaps((prev) => ({ ...prev, [selectedPlayer]: Array(TOTAL).fill(0) }));
  };

  const clearAll = () => {
    setHeatmaps({});
    try { localStorage.removeItem(LS_KEY + "_data"); } catch {}
  };

  const totalClicks = currentMap.reduce((s, v) => s + v, 0);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Player Heatmaps</h1>
            <p className="text-sm text-accent/80 italic">Click pitch zones to mark player positions</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Squad (one per line)
              </label>
              <textarea
                rows={6}
                value={squadInput}
                onChange={(e) => setSquadInput(e.target.value)}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring font-mono"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Selected Player
              </label>
              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {players.map((p, i) => <option key={i} value={i}>{p}</option>)}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">{totalClicks} zone marks</p>
            </div>

            <button onClick={clearPlayer}
              className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              <Trash2 className="h-4 w-4" /> Clear {players[selectedPlayer] ?? "player"}
            </button>

            {/* Legend */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intensity Legend</p>
              <div className="space-y-1.5">
                {[
                  { label: "Very High", cls: "bg-[#ce1126]/80" },
                  { label: "High",      cls: "bg-orange-500/70" },
                  { label: "Medium",    cls: "bg-[#f0b429]/60" },
                  { label: "Low",       cls: "bg-yellow-300/40" },
                  { label: "Rare",      cls: "bg-green-500/20" },
                  { label: "None",      cls: "bg-white/5 border border-white/10" },
                ].map(({ label, cls }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`h-4 w-6 rounded ${cls}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap pitch */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-white/20"
              style={{ background: "#2d6a2d" }}>
              {/* Attack label */}
              <div className="py-2 text-center text-xs font-semibold uppercase tracking-widest text-white/50">
                Attack ↑
              </div>
              {/* Grid */}
              <div className="grid px-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: "2px" }}>
                {Array.from({ length: TOTAL }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleZoneClick(i)}
                    className={`h-10 rounded transition-all hover:opacity-80 active:scale-95 ${zoneColor(currentMap[i] ?? 0, maxCount)}`}
                    title={`Zone ${i + 1}: ${currentMap[i] ?? 0} marks`}
                  >
                    {(currentMap[i] ?? 0) > 0 && (
                      <span className="text-[10px] font-bold text-white/80">{currentMap[i]}</span>
                    )}
                  </button>
                ))}
              </div>
              {/* Defence label */}
              <div className="py-2 text-center text-xs font-semibold uppercase tracking-widest text-white/50">
                Defence ↓
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Click zones to mark where <strong>{players[selectedPlayer] ?? "player"}</strong> operated
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
