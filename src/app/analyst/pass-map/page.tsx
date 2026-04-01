"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Download } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import jsPDF from "jspdf";

interface PlayerDot {
  number: number;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

interface PassLink {
  id: string;
  from: number;
  to: number;
  count: number;
}

const LS_KEY = "gs_pass_map";

export default function PassMapPage() {
  const [players, setPlayers] = useState<PlayerDot[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY + "_players") ?? "[]") as PlayerDot[]; } catch { return []; }
  });
  const [links, setLinks] = useState<PassLink[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY + "_links") ?? "[]") as PassLink[]; } catch { return []; }
  });
  const [nextNumber, setNextNumber] = useState(() => {
    try { return Number(localStorage.getItem(LS_KEY + "_next") ?? "1"); } catch { return 1; }
  });
  const [linkForm, setLinkForm] = useState({ from: 1, to: 2, count: 10 });
  const pitchRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem(LS_KEY + "_players", JSON.stringify(players)); } catch {} }, [players]);
  useEffect(() => { try { localStorage.setItem(LS_KEY + "_links", JSON.stringify(links)); } catch {} }, [links]);
  useEffect(() => { try { localStorage.setItem(LS_KEY + "_next", String(nextNumber)); } catch {} }, [nextNumber]);

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (nextNumber > 11) return;
    const rect = pitchRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlayers((prev) => [...prev, { number: nextNumber, x, y }]);
    setNextNumber((n) => n + 1);
  };

  const addLink = () => {
    const from = players.find((p) => p.number === linkForm.from);
    const to   = players.find((p) => p.number === linkForm.to);
    if (!from || !to || from.number === to.number) return;
    setLinks((prev) => [...prev, { id: crypto.randomUUID(), ...linkForm }]);
  };

  const maxCount = Math.max(...links.map((l) => l.count), 1);

  const reset = () => {
    setPlayers([]);
    setLinks([]);
    setNextNumber(1);
    try { [LS_KEY + "_players", LS_KEY + "_links", LS_KEY + "_next"].forEach((k) => localStorage.removeItem(k)); } catch {}
  };

  const exportPDF = () => {
    if (players.length === 0) return;
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
    doc.text("Grassroots Sport — Pass Map Network", margin, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`,
      margin, 22
    );
    doc.text(`${players.length} players  |  ${links.length} connections`, margin, 30);

    // ── Pitch ──────────────────────────────────────────────────────────────
    const scale  = 1.75;
    const pitchW = 68  * scale;
    const pitchH = 105 * scale;
    const pitchX = (pageW - pitchW) / 2;
    const pitchY = 44;

    // Green field
    doc.setFillColor(45, 106, 45);
    doc.rect(pitchX, pitchY, pitchW, pitchH, "F");

    // Pitch markings
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.rect(pitchX, pitchY, pitchW, pitchH);
    doc.line(pitchX, pitchY + 52.5 * scale, pitchX + pitchW, pitchY + 52.5 * scale);
    doc.setLineWidth(0.3);
    doc.circle(pitchX + 34 * scale, pitchY + 52.5 * scale, 9.15 * scale);
    doc.setFillColor(255, 255, 255);
    doc.circle(pitchX + 34 * scale, pitchY + 52.5 * scale, 0.5 * scale, "F");
    // Penalty areas
    doc.setDrawColor(255, 255, 255);
    doc.rect(pitchX + 13.84 * scale, pitchY,             40.32 * scale, 16.5 * scale);
    doc.rect(pitchX + 13.84 * scale, pitchY + 88.5 * scale, 40.32 * scale, 16.5 * scale);
    // Goal areas
    doc.rect(pitchX + 24.84 * scale, pitchY,              18.32 * scale, 5.5 * scale);
    doc.rect(pitchX + 24.84 * scale, pitchY + 99.5 * scale, 18.32 * scale, 5.5 * scale);
    // Penalty spots
    doc.circle(pitchX + 34 * scale, pitchY + 11 * scale, 0.5 * scale, "F");
    doc.circle(pitchX + 34 * scale, pitchY + 94 * scale, 0.5 * scale, "F");

    // ── Pass links ────────────────────────────────────────────────────────
    links.forEach((l) => {
      const from = players.find((p) => p.number === l.from);
      const to   = players.find((p) => p.number === l.to);
      if (!from || !to) return;
      const ratio = l.count / maxCount;
      const x1 = pitchX + (from.x / 100) * pitchW;
      const y1 = pitchY + (from.y / 100) * pitchH;
      const x2 = pitchX + (to.x   / 100) * pitchW;
      const y2 = pitchY + (to.y   / 100) * pitchH;
      doc.setDrawColor(240, 180, Math.round(41 + (1 - ratio) * 100)); // gold → lighter
      doc.setLineWidth(0.4 + ratio * 2.2);
      doc.line(x1, y1, x2, y2);
      // Count label at midpoint
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor(255, 240, 100);
      doc.text(String(l.count), (x1 + x2) / 2, (y1 + y2) / 2 + 1.5, { align: "center" });
    });

    // ── Player dots ───────────────────────────────────────────────────────
    players.forEach((p) => {
      const cx = pitchX + (p.x / 100) * pitchW;
      const cy = pitchY + (p.y / 100) * pitchH;
      doc.setFillColor(26, 92, 42);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, 3.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(p.number), cx, cy + 1.8, { align: "center" });
    });

    // ── Connections table ─────────────────────────────────────────────────
    if (links.length > 0) {
      let ty = pitchY + pitchH + 10;
      if (ty > pageH - 40) { doc.addPage(); ty = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0, 100, 0);
      doc.text("Pass Connections (ranked by volume)", margin, ty);
      ty += 6;
      [...links].sort((a, b) => b.count - a.count).forEach((l) => {
        if (ty > pageH - 14) { doc.addPage(); ty = 20; }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const pct = Math.round((l.count / maxCount) * 100);
        doc.text(`#${l.from} → #${l.to}`, margin, ty);
        doc.text(`${l.count} passes`, margin + 36, ty);
        doc.text(`${pct}% of max`, margin + 66, ty);
        ty += 5.5;
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("grassrootssports.live  |  Zimbabwe's Sports Management Platform", margin, pageH - 8);

    doc.save(`pass-map-${new Date().toISOString().slice(0, 10)}.pdf`);
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
            <h1 className="text-2xl font-bold text-white">Pass Map Network</h1>
            <p className="text-sm text-accent/80 italic">Click pitch to place players, then add pass connections</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Controls */}
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 1 — Place Players
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Click anywhere on the pitch to place the next player. Up to 11 players.
              </p>
              <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                <span className="text-sm">Next player:</span>
                <span className="text-lg font-black text-primary">
                  {nextNumber <= 11 ? `#${nextNumber}` : "All placed"}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{players.length}/11 placed</p>
            </div>

            {players.length >= 2 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step 2 — Add Pass Connection
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">From #</label>
                      <select value={linkForm.from} onChange={(e) => setLinkForm((f) => ({ ...f, from: Number(e.target.value) }))}
                        className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none">
                        {players.map((p) => <option key={p.number} value={p.number}>{p.number}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">To #</label>
                      <select value={linkForm.to} onChange={(e) => setLinkForm((f) => ({ ...f, to: Number(e.target.value) }))}
                        className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none">
                        {players.map((p) => <option key={p.number} value={p.number}>{p.number}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Pass count</label>
                    <input type="number" min={1} value={linkForm.count}
                      onChange={(e) => setLinkForm((f) => ({ ...f, count: Number(e.target.value) }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <button onClick={addLink}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Plus className="h-4 w-4" /> Add Connection
                  </button>
                </div>
              </div>
            )}

            {links.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connections</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {links.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs">
                      <span>#{l.from} → #{l.to}</span>
                      <span className="font-bold text-primary">{l.count} passes</span>
                      <button onClick={() => setLinks((prev) => prev.filter((x) => x.id !== l.id))}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              <Trash2 className="h-4 w-4" /> Reset Map
            </button>

            <button onClick={exportPDF} disabled={players.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-2.5 text-sm font-semibold text-[#f0b429] hover:bg-[#f0b429]/20 disabled:opacity-40 transition-colors">
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>

          {/* Pitch */}
          <div className="lg:col-span-2">
            <div
              ref={pitchRef}
              onClick={handlePitchClick}
              className="relative w-full cursor-crosshair overflow-hidden rounded-2xl border-2 border-white/20"
              style={{ aspectRatio: "68/105", background: "#2d6a2d" }}
            >
              {/* Pitch markings */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="68" height="105" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Centre line */}
                <line x1="0" y1="52.5" x2="68" y2="52.5" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Centre circle */}
                <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Centre spot */}
                <circle cx="34" cy="52.5" r="0.5" fill="white" opacity="0.6" />
                {/* Top penalty area */}
                <rect x="13.84" y="0" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Bottom penalty area */}
                <rect x="13.84" y="88.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Top goal area */}
                <rect x="24.84" y="0" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Bottom goal area */}
                <rect x="24.84" y="99.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.6" />
                {/* Penalty spots */}
                <circle cx="34" cy="11" r="0.5" fill="white" opacity="0.6" />
                <circle cx="34" cy="94" r="0.5" fill="white" opacity="0.6" />

                {/* Pass links */}
                {links.map((l) => {
                  const from = players.find((p) => p.number === l.from);
                  const to   = players.find((p) => p.number === l.to);
                  if (!from || !to) return null;
                  const thickness = 0.3 + (l.count / maxCount) * 2.5;
                  const opacity   = 0.3 + (l.count / maxCount) * 0.5;
                  return (
                    <line key={l.id}
                      x1={from.x * 0.68} y1={from.y * 1.05}
                      x2={to.x   * 0.68} y2={to.y   * 1.05}
                      stroke="#f0b429" strokeWidth={thickness} opacity={opacity} strokeLinecap="round" />
                  );
                })}

                {/* Player dots */}
                {players.map((p) => (
                  <g key={p.number}>
                    <circle cx={p.x * 0.68} cy={p.y * 1.05} r="2.2" fill="#1a5c2a" stroke="white" strokeWidth="0.5" />
                    <text x={p.x * 0.68} y={p.y * 1.05 + 0.8} textAnchor="middle" fontSize="2.2" fill="white" fontWeight="bold">
                      {p.number}
                    </text>
                  </g>
                ))}
              </svg>

              {nextNumber <= 11 && players.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="rounded-xl bg-black/50 px-4 py-2 text-sm text-white/80 font-medium">
                    Click to place player #1
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
