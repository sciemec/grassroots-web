"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Download, Play, Pause, SkipBack } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import jsPDF from "jspdf";

/* ─── Manual-map types ──────────────────────────────────────────────────── */
interface PlayerDot { number: number; x: number; y: number }
interface PassLink   { id: string; from: number; to: number; count: number }

/* ─── Match Brain types ─────────────────────────────────────────────────── */
type PassType = "pass" | "long" | "cross" | "corner" | "throw-in" | "intercept" | "penalty";
type Team     = "home" | "away";

interface TouchEv { id: string; type: "touch";  team: Team; player: number; min: number; sec: number }
interface ShotEv  { id: string; type: "shot";   team: Team; zone: string; xg: number; isGoal: boolean; min: number }
interface PassEv  { id: string; type: "pass";   team: Team; fromPlayer: number; toPlayer: number; passType: PassType; min: number }
interface ZoneEv  { id: string; type: "zone";   team: Team; player: number; pitchZone: string; min: number }
type MatchEvent = TouchEv | ShotEv | PassEv | ZoneEv;

interface MBSession {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  formation: string;
  date: string;
  events: MatchEvent[];
}

/* ─── Coordinate helpers ────────────────────────────────────────────────── */
// Standard 4-3-3 approximate positions in SVG viewBox(0 0 68 105)
// Home attacks toward y=0 (top), Away attacks toward y=105 (bottom)
const PLAYER_POS: Record<number, [number, number]> = {
  1:  [34, 97],
  2:  [10, 72], 3: [24, 72], 4: [44, 72], 5: [58, 72],
  6:  [14, 50], 7: [34, 50], 8: [54, 50],
  9:  [17, 22], 10: [34, 18], 11: [51, 22],
};

const ZONE_POS_TOP: Record<string, [number, number]> = {
  "Six-Yard Box": [34, 3],
  "Penalty Spot": [34, 11],
  "Central Box":  [34, 7],
  "Wide Box L":   [14, 7],
  "Wide Box R":   [54, 7],
  "Edge Centre":  [34, 17],
  "Edge Left":    [19, 19],
  "Edge Right":   [49, 19],
  "Long Range":   [34, 30],
};

const playerSVG = (n: number, team: Team): [number, number] => {
  const [px, py] = PLAYER_POS[n] ?? [34, 52];
  // Away team mirrors vertically
  return team === "home" ? [px, py] : [68 - px, 105 - py];
};

const zoneSVG = (zone: string, team: Team): [number, number] => {
  const pos = ZONE_POS_TOP[zone] ?? [34, 15];
  return team === "home" ? [pos[0], pos[1]] : [68 - pos[0], 105 - pos[1]];
};

// Perpendicular control point for bezier curve (cross / corner)
const perpCP = (x1: number, y1: number, x2: number, y2: number, f = 9): [number, number] => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [mx + (-dy / len) * f, my + (dx / len) * f];
};

/* ─── Event visual config ───────────────────────────────────────────────── */
const PASS_STYLE: Record<PassType | "shot", { stroke: string; label: string; dash?: string; width?: number; curve?: boolean; arrow?: boolean }> = {
  pass:       { stroke: "white",   label: "Pass",        dash: "1.5 1.5", width: 0.55 },
  long:       { stroke: "#FFD700", label: "Long Ball",   dash: "3 2",     width: 0.70 },
  cross:      { stroke: "#22d3ee", label: "Cross",       width: 0.65, curve: true },
  corner:     { stroke: "#f0b429", label: "Corner",      width: 0.65, curve: true },
  "throw-in": { stroke: "#60a5fa", label: "Throw-in",    dash: "1 2",  width: 0.55 },
  intercept:  { stroke: "#ef4444", label: "Intercept",   width: 0.90 },
  penalty:    { stroke: "#f0b429", label: "Penalty",     width: 0.80, arrow: true },
  shot:       { stroke: "#f97316", label: "Shot",        width: 0.80, arrow: true },
};

const LS_KEY = "gs_pass_map";
const uid = () => Math.random().toString(36).slice(2, 10);

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function PassMapPage() {
  const [mapMode, setMapMode] = useState<"manual" | "movement">("manual");

  /* ── Manual Map state ── */
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
  useEffect(() => { try { localStorage.setItem(LS_KEY + "_links",   JSON.stringify(links));   } catch {} }, [links]);
  useEffect(() => { try { localStorage.setItem(LS_KEY + "_next",    String(nextNumber));       } catch {} }, [nextNumber]);

  /* ── Match Brain state ── */
  const [mbSession,      setMbSession]      = useState<MBSession | null>(null);
  const [currentMinute,  setCurrentMinute]  = useState(0);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load Match Brain session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gs_match_brain_events");
      if (raw) {
        const parsed = JSON.parse(raw) as MBSession;
        setMbSession(parsed);
        setMapMode("movement");  // auto-switch if data exists
      }
    } catch { /* no session */ }
  }, []);

  const maxMinute = mbSession
    ? Math.max(0, ...mbSession.events.map(e => e.min))
    : 90;

  const visibleEvents = mbSession
    ? mbSession.events.filter(e => e.min <= currentMinute)
    : [];

  // Playback animation
  useEffect(() => {
    if (!isPlaying) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setCurrentMinute(m => {
        if (m >= maxMinute) { setIsPlaying(false); return m; }
        return m + 1;
      });
    }, 600);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, maxMinute]);

  /* ── Manual map helpers ── */
  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mapMode !== "manual" || nextNumber > 11) return;
    const rect = pitchRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    setPlayers(prev => [...prev, { number: nextNumber, x, y }]);
    setNextNumber(n => n + 1);
  };

  const addLink = () => {
    const from = players.find(p => p.number === linkForm.from);
    const to   = players.find(p => p.number === linkForm.to);
    if (!from || !to || from.number === to.number) return;
    setLinks(prev => [...prev, { id: uid(), ...linkForm }]);
  };

  const maxCount = Math.max(...links.map(l => l.count), 1);

  const reset = () => {
    setPlayers([]); setLinks([]); setNextNumber(1);
    try { [LS_KEY+"_players", LS_KEY+"_links", LS_KEY+"_next"].forEach(k => localStorage.removeItem(k)); } catch {}
  };

  /* ── SVG rendering for Match Movement ── */
  const renderMBEvent = useCallback((ev: MatchEvent, idx: number) => {
    if (ev.type === "touch" || ev.type === "zone") return null;

    if (ev.type === "pass") {
      const [x1, y1] = playerSVG(ev.fromPlayer, ev.team);
      const [x2, y2] = playerSVG(ev.toPlayer,   ev.team);
      const style = PASS_STYLE[ev.passType];
      const key = `ev-${idx}`;

      if (ev.passType === "cross" || ev.passType === "corner") {
        const [cx, cy] = perpCP(x1, y1, x2, y2, ev.passType === "corner" ? 12 : 8);
        return (
          <path key={key}
            d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
            fill="none" stroke={style.stroke} strokeWidth={style.width ?? 0.65} strokeLinecap="round" opacity="0.85" />
        );
      }
      if (ev.passType === "penalty") {
        return (
          <line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={style.stroke} strokeWidth={style.width} strokeLinecap="round"
            markerEnd="url(#arrow-gold)" opacity="0.9" />
        );
      }
      if (ev.passType === "intercept") {
        return (
          <line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={style.stroke} strokeWidth={style.width} strokeLinecap="round" opacity="0.9" />
        );
      }
      return (
        <line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={style.stroke} strokeWidth={style.width ?? 0.6}
          strokeDasharray={style.dash} strokeLinecap="round" opacity="0.75" />
      );
    }

    if (ev.type === "shot") {
      const [x1, y1] = zoneSVG(ev.zone, ev.team);
      // Goal mouth: home shoots to y=0 (top), away shoots to y=105 (bottom)
      const [x2, y2]: [number, number] = ev.team === "home" ? [34, 2] : [34, 103];
      return (
        <g key={`shot-${idx}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={ev.isGoal ? "#22c55e" : "#f97316"} strokeWidth="0.9" strokeLinecap="round"
            markerEnd={ev.isGoal ? "url(#arrow-green)" : "url(#arrow-orange)"} opacity="0.9" />
          <circle cx={x1} cy={y1} r="1.4" fill={ev.isGoal ? "#22c55e" : "#f97316"} opacity="0.7" />
        </g>
      );
    }

    return null;
  }, []);

  /* ── PDF export (manual mode) ── */
  const exportPDF = () => {
    if (players.length === 0) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;
    const margin = 14;
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, pageW, 36, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("Grassroots Sport — Pass Map Network", margin, 14);
    doc.setFontSize(9);  doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`, margin, 22);
    doc.text(`${players.length} players  |  ${links.length} connections`, margin, 30);

    const scale = 1.75;
    const pitchW = 68  * scale;
    const pitchH = 105 * scale;
    const pitchX = (pageW - pitchW) / 2;
    const pitchY = 44;
    doc.setFillColor(45, 106, 45);
    doc.rect(pitchX, pitchY, pitchW, pitchH, "F");
    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.4);
    doc.rect(pitchX, pitchY, pitchW, pitchH);
    doc.line(pitchX, pitchY + 52.5 * scale, pitchX + pitchW, pitchY + 52.5 * scale);
    doc.setLineWidth(0.3);
    doc.circle(pitchX + 34 * scale, pitchY + 52.5 * scale, 9.15 * scale);
    doc.setFillColor(255, 255, 255);
    doc.circle(pitchX + 34 * scale, pitchY + 52.5 * scale, 0.5 * scale, "F");
    doc.rect(pitchX + 13.84 * scale, pitchY,              40.32 * scale, 16.5 * scale);
    doc.rect(pitchX + 13.84 * scale, pitchY + 88.5 * scale, 40.32 * scale, 16.5 * scale);
    doc.rect(pitchX + 24.84 * scale, pitchY,              18.32 * scale, 5.5 * scale);
    doc.rect(pitchX + 24.84 * scale, pitchY + 99.5 * scale, 18.32 * scale, 5.5 * scale);
    doc.circle(pitchX + 34 * scale, pitchY + 11 * scale, 0.5 * scale, "F");
    doc.circle(pitchX + 34 * scale, pitchY + 94 * scale, 0.5 * scale, "F");

    links.forEach(l => {
      const from = players.find(p => p.number === l.from);
      const to   = players.find(p => p.number === l.to);
      if (!from || !to) return;
      const ratio = l.count / maxCount;
      const x1 = pitchX + (from.x / 100) * pitchW, y1 = pitchY + (from.y / 100) * pitchH;
      const x2 = pitchX + (to.x   / 100) * pitchW, y2 = pitchY + (to.y   / 100) * pitchH;
      doc.setDrawColor(240, 180, Math.round(41 + (1 - ratio) * 100));
      doc.setLineWidth(0.4 + ratio * 2.2);
      doc.line(x1, y1, x2, y2);
      doc.setFont("helvetica", "bold"); doc.setFontSize(5); doc.setTextColor(255, 240, 100);
      doc.text(String(l.count), (x1 + x2) / 2, (y1 + y2) / 2 + 1.5, { align: "center" });
    });

    players.forEach(p => {
      const cx = pitchX + (p.x / 100) * pitchW, cy = pitchY + (p.y / 100) * pitchH;
      doc.setFillColor(26, 92, 42); doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5);
      doc.circle(cx, cy, 3.5, "FD");
      doc.setFont("helvetica", "bold"); doc.setFontSize(5.5); doc.setTextColor(255, 255, 255);
      doc.text(String(p.number), cx, cy + 1.8, { align: "center" });
    });

    if (links.length > 0) {
      let ty = pitchY + pitchH + 10;
      if (ty > pageH - 40) { doc.addPage(); ty = 20; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0, 100, 0);
      doc.text("Pass Connections (ranked by volume)", margin, ty); ty += 6;
      [...links].sort((a, b) => b.count - a.count).forEach(l => {
        if (ty > pageH - 14) { doc.addPage(); ty = 20; }
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
        doc.text(`#${l.from} → #${l.to}`, margin, ty);
        doc.text(`${l.count} passes`, margin + 36, ty);
        doc.text(`${Math.round((l.count / maxCount) * 100)}% of max`, margin + 66, ty);
        ty += 5.5;
      });
    }

    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text("grassrootssports.live  |  Zimbabwe's Sports Management Platform", margin, pageH - 8);
    doc.save(`pass-map-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* ─── Shared SVG pitch markings ─────────────────────────────────────────── */
  const PitchMarkings = () => (
    <>
      <rect x="0" y="0" width="68" height="105" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="52.5" x2="68" y2="52.5" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
      <circle cx="34" cy="52.5" r="0.5" fill="white" opacity="0.5" />
      <rect x="13.84" y="0"    width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.4" opacity="0.5" />
      <rect x="13.84" y="88.5" width="40.32" height="16.5" fill="none" stroke="white" strokeWidth="0.4" opacity="0.5" />
      <rect x="24.84" y="0"    width="18.32" height="5.5"  fill="none" stroke="white" strokeWidth="0.4" opacity="0.5" />
      <rect x="24.84" y="99.5" width="18.32" height="5.5"  fill="none" stroke="white" strokeWidth="0.4" opacity="0.5" />
      <circle cx="34" cy="11"  r="0.5" fill="white" opacity="0.5" />
      <circle cx="34" cy="94"  r="0.5" fill="white" opacity="0.5" />
    </>
  );

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Pass Map Network</h1>
            <p className="text-sm text-accent/80 italic">Visualise ball movement from your match data</p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mb-5 flex gap-2">
          <button onClick={() => setMapMode("manual")}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mapMode === "manual" ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}>
            Manual Map
          </button>
          <button onClick={() => setMapMode("movement")}
            className={`relative rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              mapMode === "movement" ? "bg-cyan-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}>
            Match Movement
            {mbSession && (
              <span className="ml-2 rounded-full bg-green-400/20 px-1.5 py-0.5 text-[9px] font-black text-green-400">
                DATA LOADED
              </span>
            )}
          </button>
        </div>

        {/* ══ MANUAL MAP MODE ══════════════════════════════════════════════════ */}
        {mapMode === "manual" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Controls */}
            <div className="space-y-4 lg:col-span-1">
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 — Place Players</p>
                <p className="mb-3 text-xs text-muted-foreground">Click anywhere on the pitch to place the next player. Up to 11 players.</p>
                <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                  <span className="text-sm">Next player:</span>
                  <span className="text-lg font-black text-primary">{nextNumber <= 11 ? `#${nextNumber}` : "All placed"}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{players.length}/11 placed</p>
              </div>

              {players.length >= 2 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 — Add Pass Connection</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">From #</label>
                        <select value={linkForm.from} onChange={e => setLinkForm(f => ({ ...f, from: Number(e.target.value) }))}
                          className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none">
                          {players.map(p => <option key={p.number} value={p.number}>{p.number}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">To #</label>
                        <select value={linkForm.to} onChange={e => setLinkForm(f => ({ ...f, to: Number(e.target.value) }))}
                          className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none">
                          {players.map(p => <option key={p.number} value={p.number}>{p.number}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Pass count</label>
                      <input type="number" min={1} value={linkForm.count}
                        onChange={e => setLinkForm(f => ({ ...f, count: Number(e.target.value) }))}
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
                  <div className="max-h-40 space-y-1.5 overflow-y-auto">
                    {links.map(l => (
                      <div key={l.id} className="flex items-center justify-between text-xs">
                        <span>#{l.from} → #{l.to}</span>
                        <span className="font-bold text-primary">{l.count} passes</span>
                        <button onClick={() => setLinks(prev => prev.filter(x => x.id !== l.id))}
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
              <div ref={pitchRef} onClick={handlePitchClick}
                className="relative w-full cursor-crosshair overflow-hidden rounded-2xl border-2 border-white/20"
                style={{ aspectRatio: "68/105", background: "#2d6a2d" }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 105">
                  <PitchMarkings />
                  {links.map(l => {
                    const from = players.find(p => p.number === l.from);
                    const to   = players.find(p => p.number === l.to);
                    if (!from || !to) return null;
                    const ratio = l.count / maxCount;
                    return (
                      <line key={l.id}
                        x1={from.x * 0.68} y1={from.y * 1.05}
                        x2={to.x   * 0.68} y2={to.y   * 1.05}
                        stroke="#f0b429" strokeWidth={0.3 + ratio * 2.5}
                        opacity={0.3 + ratio * 0.5} strokeLinecap="round" />
                    );
                  })}
                  {players.map(p => (
                    <g key={p.number}>
                      <circle cx={p.x * 0.68} cy={p.y * 1.05} r="2.2" fill="#1a5c2a" stroke="white" strokeWidth="0.5" />
                      <text x={p.x * 0.68} y={p.y * 1.05 + 0.8} textAnchor="middle" fontSize="2.2" fill="white" fontWeight="bold">
                        {p.number}
                      </text>
                    </g>
                  ))}
                </svg>
                {nextNumber <= 11 && players.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="rounded-xl bg-black/50 px-4 py-2 text-sm font-medium text-white/80">Click to place player #1</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ MATCH MOVEMENT MODE ═══════════════════════════════════════════════ */}
        {mapMode === "movement" && (
          <div>
            {!mbSession ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
                <p className="text-lg font-bold text-white/60">No Match Brain session found</p>
                <p className="mt-2 text-sm text-white/30">Complete a match in Match Brain, then click "Match Movement" to see it here.</p>
                <Link href="/analyst/match-brain"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4a1a8a] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#5a2a9a] transition-colors">
                  Go to Match Brain
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {/* Left panel: controls + legend */}
                <div className="space-y-4 lg:col-span-1">
                  {/* Session info */}
                  <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session</p>
                    <p className="mt-1 font-bold text-white">{mbSession.homeTeam} vs {mbSession.awayTeam}</p>
                    <p className="text-xs text-muted-foreground">{mbSession.sport} · {mbSession.formation}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(mbSession.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="mt-2 text-xs font-medium text-accent">{mbSession.events.length} events recorded</p>
                  </div>

                  {/* Timeline controls */}
                  <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
                    <div className="mb-3 flex items-center gap-2">
                      <button onClick={() => { setCurrentMinute(0); setIsPlaying(false); }}
                        className="rounded-lg border border-white/10 p-1.5 hover:bg-white/10 transition-colors">
                        <SkipBack className="h-3.5 w-3.5 text-white/60" />
                      </button>
                      <button onClick={() => setIsPlaying(p => !p)}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          isPlaying ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                        }`}>
                        {isPlaying ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Play</>}
                      </button>
                      <span className="ml-auto font-mono text-xs font-bold text-white">{currentMinute}′</span>
                    </div>
                    <input type="range" min={0} max={maxMinute} value={currentMinute}
                      onChange={e => { setCurrentMinute(Number(e.target.value)); setIsPlaying(false); }}
                      className="w-full accent-cyan-400" />
                    <div className="mt-1 flex justify-between text-[9px] text-white/30">
                      <span>0′</span><span>HT</span><span>{maxMinute}′</span>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Showing {visibleEvents.filter(e => e.type !== "touch" && e.type !== "zone").length} events up to minute {currentMinute}
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</p>
                    <div className="space-y-2">
                      {[
                        { color: "white",   dash: "4 3",  label: "Pass",        desc: "Short / regular" },
                        { color: "#FFD700", dash: "6 3",  label: "Long Ball",   desc: "Long pass" },
                        { color: "#22d3ee", dash: null,   label: "Cross",       desc: "Curved cross" },
                        { color: "#f0b429", dash: null,   label: "Corner",      desc: "Curved corner" },
                        { color: "#60a5fa", dash: "2 4",  label: "Throw-in",    desc: "Throw-in" },
                        { color: "#ef4444", dash: null,   label: "Intercept",   desc: "Ball won" },
                        { color: "#f0b429", dash: null,   label: "Penalty",     desc: "→ arrow" },
                        { color: "#f97316", dash: null,   label: "Shot",        desc: "→ arrow" },
                        { color: "#22c55e", dash: null,   label: "Goal",        desc: "Green shot" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2.5">
                          <svg width="28" height="8" viewBox="0 0 28 8">
                            <line x1="2" y1="4" x2="26" y2="4"
                              stroke={item.color} strokeWidth="1.8"
                              strokeDasharray={item.dash ?? undefined} strokeLinecap="round" />
                          </svg>
                          <span className="text-[10px] font-semibold text-white/80">{item.label}</span>
                          <span className="text-[9px] text-white/30">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team key */}
                  <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Teams</p>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1.5 text-xs"><span className="h-3 w-3 rounded-full bg-blue-500 inline-block" />{mbSession.homeTeam} (home)</span>
                    </div>
                    <div className="mt-1 flex gap-3">
                      <span className="flex items-center gap-1.5 text-xs"><span className="h-3 w-3 rounded-full bg-orange-500 inline-block" />{mbSession.awayTeam} (away)</span>
                    </div>
                    <p className="mt-2 text-[9px] text-white/30">Home attacks upward (↑). Away attacks downward (↓).</p>
                  </div>
                </div>

                {/* Pitch */}
                <div className="lg:col-span-2">
                  <div className="relative w-full overflow-hidden rounded-2xl border-2 border-white/20"
                    style={{ aspectRatio: "68/105", background: "#2d6a2d" }}>
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 68 105">
                      {/* Arrowhead markers */}
                      <defs>
                        <marker id="arrow-orange" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                          <polygon points="0 0, 4 2, 0 4" fill="#f97316" />
                        </marker>
                        <marker id="arrow-green" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                          <polygon points="0 0, 4 2, 0 4" fill="#22c55e" />
                        </marker>
                        <marker id="arrow-gold" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                          <polygon points="0 0, 4 2, 0 4" fill="#f0b429" />
                        </marker>
                      </defs>

                      <PitchMarkings />

                      {/* Direction labels */}
                      <text x="34" y="6"   textAnchor="middle" fontSize="2.5" fill="white" opacity="0.35" fontWeight="bold">↑ {mbSession.homeTeam} attacks</text>
                      <text x="34" y="102" textAnchor="middle" fontSize="2.5" fill="white" opacity="0.35" fontWeight="bold">↓ {mbSession.awayTeam} attacks</text>

                      {/* Render visible events */}
                      {visibleEvents.map((ev, idx) => renderMBEvent(ev, idx))}

                      {/* Player position dots (standard 4-3-3 home, mirrored away) */}
                      {[1,2,3,4,5,6,7,8,9,10,11].map(n => {
                        const [hx, hy] = playerSVG(n, "home");
                        const [ax, ay] = playerSVG(n, "away");
                        return (
                          <g key={n}>
                            <circle cx={hx} cy={hy} r="2" fill="#1e40af" stroke="white" strokeWidth="0.4" opacity="0.7" />
                            <text x={hx} y={hy + 0.7} textAnchor="middle" fontSize="1.8" fill="white" fontWeight="bold">{n}</text>
                            <circle cx={ax} cy={ay} r="2" fill="#c2410c" stroke="white" strokeWidth="0.4" opacity="0.7" />
                            <text x={ax} y={ay + 0.7} textAnchor="middle" fontSize="1.8" fill="white" fontWeight="bold">{n}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
