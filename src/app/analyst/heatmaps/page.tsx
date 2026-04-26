"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Download, Brain, Camera } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import jsPDF from "jspdf";

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

  const importFromMatchEye = () => {
    try {
      const raw = localStorage.getItem("gs_match_eye_last");
      if (!raw) { alert("No Match Eye analysis found. Run a match video first."); return; }
      const me = JSON.parse(raw) as {
        homeTeam?: string; awayTeam?: string;
        trackingData?: {
          players?: Array<{ id: number; team: string; avg_x: number; avg_y: number; heatmap: number[][] }>;
        };
      };
      const players = me.trackingData?.players;
      if (!players?.length) { alert("No player tracking data in Match Eye session. Run the Player Tracking tab first."); return; }

      const newMaps: Record<number, number[]> = {};
      const newSquadLines: string[] = [];

      players.forEach((p, idx) => {
        // Downsample YOLOv8 13×20 heatmap → 6×10 tool grid
        const grid = Array(TOTAL).fill(0) as number[];
        if (p.heatmap?.length) {
          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              // Each tool cell covers ~2.17 YOLOv8 rows × ~3.33 cols
              const yStart = Math.round(row * 13 / ROWS);
              const yEnd   = Math.round((row + 1) * 13 / ROWS);
              const xStart = Math.round(col * 20 / COLS);
              const xEnd   = Math.round((col + 1) * 20 / COLS);
              let sum = 0;
              for (let r = yStart; r < yEnd; r++) {
                for (let c = xStart; c < xEnd; c++) {
                  sum += p.heatmap[r]?.[c] ?? 0;
                }
              }
              grid[row * COLS + col] = sum;
            }
          }
        } else {
          // Fallback: use avg_x/avg_y to place a single hot cell
          const col = Math.min(Math.floor(p.avg_x * COLS), COLS - 1);
          const row = Math.min(Math.floor(p.avg_y * ROWS), ROWS - 1);
          grid[row * COLS + col] = 10;
        }
        newMaps[idx] = grid;
        newSquadLines.push(`P${p.id} (${p.team})`);
      });

      setHeatmaps(newMaps);
      setSquadInput(newSquadLines.join("\n"));
      setSelectedPlayer(0);
    } catch {
      alert("Could not read Match Eye tracking data.");
    }
  };

  const importFromMatchBrain = () => {
    try {
      const raw = localStorage.getItem("gs_match_brain_events");
      if (!raw) { alert("No Match Brain session found. Run a match first."); return; }
      const session = JSON.parse(raw) as {
        homeTeam: string; awayTeam: string;
        events: Array<{ type: string; team: string; player?: number; pitchZone?: string; min: number }>;
      };
      if (!session.events?.length) { alert("Match Brain session has no events."); return; }

      // Zone name → list of grid cells that should light up (row*COLS + col)
      // Heatmap: row 0 = attack end (top), row 9 = defence end (bottom)
      const ZONE_CELLS: Record<string, number[]> = {
        "Opp Box":    [1,2,3,4,7,8,9,10,13,14,15,16],
        "Left Att":   [12,13,18,19,24,25],
        "Right Att":  [15,16,21,22,27,28],
        "Left Mid":   [24,25,30,31,36,37],
        "Centre Mid": [26,27,32,33,38,39],
        "Right Mid":  [27,28,33,34,39,40],
        "Left Def":   [36,37,42,43,48,49],
        "Right Def":  [39,40,45,46,51,52],
        "Own Box":    [49,50,51,52,55,56,57,58],
      };
      // Player shirt number → default grid cell from PLAYER_POS percentages
      // PLAYER_POS: { 1:[50,88], 2:[15,67], 3:[35,67], 4:[65,67], 5:[85,67],
      //               6:[20,44], 7:[50,44], 8:[80,44], 9:[25,20], 10:[50,20], 11:[75,20] }
      // row = floor(y/100 * ROWS), col = floor(x/100 * COLS)
      const PLAYER_DEFAULT_CELL: Record<number, number> = {
        1:  Math.floor(88/100*ROWS)*COLS + Math.floor(50/100*COLS),
        2:  Math.floor(67/100*ROWS)*COLS + Math.floor(15/100*COLS),
        3:  Math.floor(67/100*ROWS)*COLS + Math.floor(35/100*COLS),
        4:  Math.floor(67/100*ROWS)*COLS + Math.floor(65/100*COLS),
        5:  Math.floor(67/100*ROWS)*COLS + Math.floor(85/100*COLS),
        6:  Math.floor(44/100*ROWS)*COLS + Math.floor(20/100*COLS),
        7:  Math.floor(44/100*ROWS)*COLS + Math.floor(50/100*COLS),
        8:  Math.floor(44/100*ROWS)*COLS + Math.floor(80/100*COLS),
        9:  Math.floor(20/100*ROWS)*COLS + Math.floor(25/100*COLS),
        10: Math.floor(20/100*ROWS)*COLS + Math.floor(50/100*COLS),
        11: Math.floor(20/100*ROWS)*COLS + Math.floor(75/100*COLS),
      };

      // Build heatmap per player (0-based index = shirt number - 1)
      const newMaps: Record<number, number[]> = {};
      const newSquadLines: string[] = [];

      session.events.forEach(ev => {
        if (ev.type !== "touch" && ev.type !== "zone") return;
        if (!ev.player || ev.player < 1 || ev.player > 16) return;

        const playerIdx = ev.player - 1; // 0-based
        if (!newMaps[playerIdx]) newMaps[playerIdx] = Array(TOTAL).fill(0);

        if (ev.type === "zone" && ev.pitchZone) {
          const cells = ZONE_CELLS[ev.pitchZone] ?? [];
          cells.forEach(cell => {
            if (cell >= 0 && cell < TOTAL) newMaps[playerIdx][cell] = (newMaps[playerIdx][cell] ?? 0) + 1;
          });
        } else if (ev.type === "touch") {
          const cell = PLAYER_DEFAULT_CELL[ev.player] ?? 27;
          if (cell >= 0 && cell < TOTAL) newMaps[playerIdx][cell] = (newMaps[playerIdx][cell] ?? 0) + 1;
        }
      });

      if (Object.keys(newMaps).length === 0) { alert("No touch or zone events found in this Match Brain session."); return; }

      // Build squad name list
      const maxIdx = Math.max(...Object.keys(newMaps).map(Number));
      for (let i = 0; i <= maxIdx; i++) {
        newSquadLines.push(`Player ${i + 1} (${session.homeTeam})`);
      }

      setHeatmaps(newMaps);
      setSquadInput(newSquadLines.join("\n"));
      setSelectedPlayer(0);
    } catch {
      alert("Could not read Match Brain data. Run a match and try again.");
    }
  };

  const totalClicks = currentMap.reduce((s, v) => s + v, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;
    const margin = 14;

    // ── Header ────────────────────────────────────────────────────────────
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Grassroots Sport — Player Heatmaps", margin, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`,
      margin, 22
    );
    doc.text(`Squad size: ${players.length} players`, margin, 30);

    let yOffset = 46;

    // ── One section per player that has data ──────────────────────────────
    players.forEach((playerName, playerIdx) => {
      const map: number[] = heatmaps[playerIdx] ?? Array(TOTAL).fill(0);
      const totalMarks = map.reduce((s, v) => s + v, 0);
      if (totalMarks === 0) return; // skip players with no data

      if (yOffset > pageH - 80) { doc.addPage(); yOffset = 20; }

      const maxVal = Math.max(...map, 1);

      // Player name heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 100, 0);
      doc.text(`${playerName}  (${totalMarks} zone marks)`, margin, yOffset);
      yOffset += 5;

      // Draw pitch grid as coloured rectangles
      const cellW = 8;
      const cellH = 6;
      const pitchW = COLS * cellW;
      const pitchX = margin;

      // Pitch outline
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.rect(pitchX, yOffset, pitchW, ROWS * cellH);

      // "Attack" label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("ATTACK ↑", pitchX + pitchW + 2, yOffset + 4);
      doc.text("DEFENCE ↓", pitchX + pitchW + 2, yOffset + ROWS * cellH - 2);

      for (let i = 0; i < TOTAL; i++) {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = pitchX + col * cellW;
        const y = yOffset + row * cellH;
        const val = map[i] ?? 0;
        const ratio = val / maxVal;

        // Colour scale matching the UI: green → yellow → amber → orange → red
        if (ratio >= 0.8)       { doc.setFillColor(206, 17, 38); }   // red
        else if (ratio >= 0.6)  { doc.setFillColor(234, 88, 12); }   // orange
        else if (ratio >= 0.4)  { doc.setFillColor(240, 180, 41); }  // amber
        else if (ratio >= 0.2)  { doc.setFillColor(253, 224, 71); }  // yellow
        else if (ratio > 0)     { doc.setFillColor(134, 239, 172); } // light green
        else                    { doc.setFillColor(240, 255, 240); } // empty

        doc.rect(x, y, cellW, cellH, "F");
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.1);
        doc.rect(x, y, cellW, cellH, "S");

        // Show count if > 0
        if (val > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(5);
          doc.setTextColor(0, 0, 0);
          doc.text(String(val), x + cellW / 2 - 0.8, y + cellH / 2 + 1.5);
        }
      }

      yOffset += ROWS * cellH + 10;
    });

    // ── Legend ────────────────────────────────────────────────────────────
    if (yOffset > pageH - 30) { doc.addPage(); yOffset = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Intensity:", margin, yOffset);
    const legend = [
      { label: "Very High", r: 206, g: 17,  b: 38  },
      { label: "High",      r: 234, g: 88,  b: 12  },
      { label: "Medium",    r: 240, g: 180, b: 41  },
      { label: "Low",       r: 253, g: 224, b: 71  },
      { label: "Rare",      r: 134, g: 239, b: 172 },
    ];
    let lx = margin + 22;
    legend.forEach(({ label, r, g, b }) => {
      doc.setFillColor(r, g, b);
      doc.rect(lx, yOffset - 4, 5, 5, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(label, lx + 6, yOffset);
      lx += 28;
    });

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("grassrootssports.live  |  Zimbabwe's Sports Management Platform", margin, pageH - 8);

    doc.save(`heatmaps-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

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

            <div className="flex gap-2">
              <button onClick={clearPlayer}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                <Trash2 className="h-4 w-4" /> Clear Player
              </button>
              <button onClick={clearAll}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/30 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            </div>

            <button onClick={exportPDF}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-2.5 text-sm font-semibold text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors">
              <Download className="h-4 w-4" /> Export PDF Report
            </button>

            <button onClick={importFromMatchEye}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-2.5 text-sm font-semibold text-[#f0b429] hover:bg-[#f0b429]/20 transition-colors">
              <Camera className="h-4 w-4" /> Import from Match Eye
            </button>

            <button onClick={importFromMatchBrain}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 py-2.5 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors">
              <Brain className="h-4 w-4" /> Import from Match Brain
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
