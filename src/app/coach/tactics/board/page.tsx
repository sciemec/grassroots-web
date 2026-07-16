// src/app/coach/tactics/board/page.tsx
"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Target, Move, Brain, ChevronRight, Info, Pencil, Trash2, RotateCcw,
} from "lucide-react";
import { getRoleConfig } from "@/config/coaching-staff";

// ─── Types ──────────────────────────────────────────────────────────────────

type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";
type Mode = "xg" | "manual" | "tactics" | "draw";

interface Arrow {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

interface PlayerToken {
  id: string;
  x: number;
  y: number;
  label: string;
}

// ─── Pitch constants ─────────────────────────────────────────────────────────

const W = 400;
const H = 260;

// ─── XG Zones ────────────────────────────────────────────────────────────────
// Defined in full-pitch SVG coordinates (team attacks towards y=0 / top).
// These map to the attacking end of the pitch.

const XG_ZONES = [
  { id: "six_yard",       label: "6-Yard Box",    xg: 0.76, x: 157, y: 2,   w: 86,  h: 22 },
  { id: "pen_area_c",     label: "Penalty Area",  xg: 0.45, x: 135, y: 24,  w: 130, h: 22 },
  { id: "central_box",    label: "Central Box",   xg: 0.35, x: 118, y: 46,  w: 164, h: 24 },
  { id: "wide_box_left",  label: "Left Channel",  xg: 0.12, x: 66,  y: 2,   w: 91,  h: 68 },
  { id: "wide_box_right", label: "Right Channel", xg: 0.12, x: 243, y: 2,   w: 91,  h: 68 },
  { id: "edge_centre",    label: "Edge of Box",   xg: 0.18, x: 118, y: 70,  w: 164, h: 30 },
  { id: "edge_left",      label: "Left Edge",     xg: 0.07, x: 30,  y: 70,  w: 88,  h: 30 },
  { id: "edge_right",     label: "Right Edge",    xg: 0.07, x: 282, y: 70,  w: 88,  h: 30 },
  { id: "long_range",     label: "Long Range",    xg: 0.04, x: 0,   y: 100, w: 400, h: 30 },
];

function xgColor(xg: number): string {
  if (xg >= 0.50) return "#dc2626";
  if (xg >= 0.30) return "#ea580c";
  if (xg >= 0.15) return "#ca8a04";
  if (xg >= 0.08) return "#4b5563";
  return "#1f2937";
}

function xgCoachingTip(xg: number): string {
  if (xg >= 0.50)
    return "Maximum danger zone. Defenders must NEVER leave this space uncovered. Strikers: make your runs here early and hold position.";
  if (xg >= 0.30)
    return "High danger area. Block shooting angles fast. Strikers: hold your run and wait for the exact moment to shoot.";
  if (xg >= 0.15)
    return "Good shooting zone. Pressure the ball carrier immediately. Strikers: first-time shot if possible — do not take extra touches.";
  if (xg >= 0.08)
    return "Lower probability. Stay compact and do not overcommit wide. Force play back inside.";
  return "Long range — low chance of scoring but do not switch off. Keeper must be alert. Block any clear sights.";
}

// ─── Formation positions ──────────────────────────────────────────────────────
// Team plays UP (attacks towards y=0). Positions given in full-pitch SVG coords.

const FORMATIONS: Record<Formation, Omit<PlayerToken, "id">[]> = {
  "4-3-3": [
    { label: "GK",  x: 200, y: 242 },
    { label: "RB",  x: 324, y: 208 }, { label: "CB", x: 258, y: 200 },
    { label: "CB",  x: 142, y: 200 }, { label: "LB", x: 76,  y: 208 },
    { label: "CM",  x: 294, y: 160 }, { label: "CM", x: 200, y: 150 }, { label: "CM", x: 106, y: 160 },
    { label: "RW",  x: 330, y: 106 }, { label: "ST", x: 200, y: 95  }, { label: "LW", x: 70,  y: 106 },
  ],
  "4-4-2": [
    { label: "GK",  x: 200, y: 242 },
    { label: "RB",  x: 324, y: 208 }, { label: "CB", x: 258, y: 200 },
    { label: "CB",  x: 142, y: 200 }, { label: "LB", x: 76,  y: 208 },
    { label: "RM",  x: 334, y: 160 }, { label: "CM", x: 258, y: 152 },
    { label: "CM",  x: 142, y: 152 }, { label: "LM", x: 66,  y: 160 },
    { label: "ST",  x: 248, y: 100 }, { label: "ST", x: 152, y: 100 },
  ],
  "4-2-3-1": [
    { label: "GK",  x: 200, y: 242 },
    { label: "RB",  x: 324, y: 208 }, { label: "CB", x: 258, y: 200 },
    { label: "CB",  x: 142, y: 200 }, { label: "LB", x: 76,  y: 208 },
    { label: "DM",  x: 248, y: 166 }, { label: "DM", x: 152, y: 166 },
    { label: "RM",  x: 324, y: 128 }, { label: "AM", x: 200, y: 122 }, { label: "LM", x: 76, y: 128 },
    { label: "ST",  x: 200, y: 88  },
  ],
  "3-5-2": [
    { label: "GK",   x: 200, y: 242 },
    { label: "CB",   x: 274, y: 204 }, { label: "CB", x: 200, y: 198 }, { label: "CB", x: 126, y: 204 },
    { label: "RWB",  x: 350, y: 160 }, { label: "CM", x: 272, y: 152 },
    { label: "CM",   x: 200, y: 146 }, { label: "CM", x: 128, y: 152 }, { label: "LWB", x: 50, y: 160 },
    { label: "ST",   x: 248, y: 100 }, { label: "ST", x: 152, y: 100 },
  ],
  "5-3-2": [
    { label: "GK",  x: 200, y: 242 },
    { label: "RB",  x: 350, y: 208 }, { label: "CB", x: 286, y: 202 },
    { label: "CB",  x: 200, y: 200 }, { label: "CB", x: 114, y: 202 }, { label: "LB", x: 50, y: 208 },
    { label: "RM",  x: 294, y: 158 }, { label: "CM", x: 200, y: 150 }, { label: "LM", x: 106, y: 158 },
    { label: "ST",  x: 248, y: 100 }, { label: "ST", x: 152, y: 100 },
  ],
};

// Opponent positions — mirrored (attacks downward from y=0)
const OPPONENT_TOKENS: Omit<PlayerToken, "id">[] = [
  { label: "GK",  x: 200, y: 18  },
  { label: "RB",  x: 76,  y: 52  }, { label: "CB", x: 142, y: 60  },
  { label: "CB",  x: 258, y: 60  }, { label: "LB", x: 324, y: 52  },
  { label: "LM",  x: 66,  y: 100 }, { label: "CM", x: 142, y: 108 },
  { label: "CM",  x: 258, y: 108 }, { label: "RM", x: 334, y: 100 },
  { label: "ST",  x: 152, y: 160 }, { label: "ST", x: 248, y: 160 },
];

// Tactical connection lines per formation (pairs of player indices)
const FORMATION_LINES: Record<Formation, [number, number][]> = {
  "4-3-3":   [[1,2],[2,3],[3,4],[2,5],[3,7],[5,6],[6,7],[5,8],[6,9],[7,10]],
  "4-4-2":   [[1,2],[2,3],[3,4],[1,5],[4,8],[5,6],[6,7],[7,8],[9,10]],
  "4-2-3-1": [[1,2],[2,3],[3,4],[2,5],[3,6],[5,6],[5,7],[6,9],[7,8],[8,10]],
  "3-5-2":   [[1,2],[2,3],[1,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]],
  "5-3-2":   [[1,2],[2,3],[3,4],[4,5],[3,6],[4,8],[6,7],[7,8],[9,10]],
};

// ─── Pitch markings SVG ───────────────────────────────────────────────────────

function PitchMarkings() {
  const line = "rgba(255,255,255,0.72)";
  const lw = 0.8;
  return (
    <g>
      {/* Field */}
      <rect width={W} height={H} fill="#2d6a1f" />
      {/* Alternating stripe texture */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={i} x={0} y={i * 52} width={W} height={26} fill="rgba(0,0,0,0.03)" />
      ))}
      {/* Boundary */}
      <rect x={8} y={6} width={384} height={248} fill="none" stroke={line} strokeWidth={lw} />
      {/* Centre line */}
      <line x1={8} y1={130} x2={392} y2={130} stroke={line} strokeWidth={lw} />
      {/* Centre circle */}
      <circle cx={200} cy={130} r={35} fill="none" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={130} r={1.5} fill={line} />
      {/* ─ Top end (attacking, y near 0) ─ */}
      {/* Penalty area */}
      <rect x={118} y={6} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      {/* 6-yard box */}
      <rect x={157} y={6} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      {/* Goal */}
      <rect x={172} y={3} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      {/* Penalty spot */}
      <circle cx={200} cy={46} r={1.5} fill={line} />
      {/* Penalty arc */}
      <path d="M 162 68 A 34 34 0 0 1 238 68" fill="none" stroke={line} strokeWidth={lw} />
      {/* ─ Bottom end (defensive, y near 260) ─ */}
      <rect x={118} y={192} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={157} y={232} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={172} y={252} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={214} r={1.5} fill={line} />
      <path d="M 162 192 A 34 34 0 0 0 238 192" fill="none" stroke={line} strokeWidth={lw} />
    </g>
  );
}

// ─── Arrow colour palette ─────────────────────────────────────────────────────

const ARROW_COLORS = [
  { color: "#f0b429",              label: "Run",   markerId: "arr-gold"  },
  { color: "rgba(255,255,255,0.9)", label: "Pass",  markerId: "arr-white" },
  { color: "#ef4444",              label: "Press", markerId: "arr-red"   },
  { color: "#60a5fa",              label: "Shape", markerId: "arr-blue"  },
];

function colorToMarkerId(color: string): string {
  return ARROW_COLORS.find(a => a.color === color)?.markerId ?? "arr-gold";
}

// ─── Inner board component ────────────────────────────────────────────────────

function BoardPageInner() {
  const searchParams = useSearchParams();
  const deptId   = searchParams.get("dept");
  const deptRole = deptId ? getRoleConfig(deptId) : null;

  const [mode, setMode]           = useState<Mode>("xg");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [players, setPlayers]     = useState<PlayerToken[]>(() =>
    FORMATIONS["4-3-3"].map((p, i) => ({ id: `p${i}`, ...p }))
  );
  const [showXgOverlay, setShowXgOverlay] = useState(true);
  const [showOpponents, setShowOpponents] = useState(false);
  const [opponents, setOpponents]         = useState<PlayerToken[]>(() =>
    OPPONENT_TOKENS.map((op, i) => ({ id: `opp-${i}`, ...op }))
  );
  const [selectedZone, setSelectedZone]   = useState<string | null>(null);
  const [draggingId, setDraggingId]       = useState<string | null>(null);

  // Draw mode
  const [arrows, setArrows]         = useState<Arrow[]>([]);
  const [drawColor, setDrawColor]   = useState(ARROW_COLORS[0].color);
  const [previewArrow, setPreviewArrow] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const changeFormation = (f: Formation) => {
    setFormation(f);
    setPlayers(FORMATIONS[f].map((p, i) => ({ id: `p${i}`, ...p })));
    setSelectedZone(null);
  };

  const getSvgPt = useCallback((e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(12, Math.min(388, ((e.clientX - r.left) / r.width)  * W)),
      y: Math.max(12, Math.min(248, ((e.clientY - r.top)  / r.height) * H)),
    };
  }, []);

  // SVG background pointer down — used for draw mode
  const onSvgDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const pt = getSvgPt(e);
    if (pt) drawStartRef.current = pt;
  }, [mode, getSvgPt]);

  // Player / opponent token pointer down — used for manual mode
  const onTokenDown = useCallback((e: React.PointerEvent, id: string) => {
    if (mode !== "manual") return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
  }, [mode]);

  const onPMove = useCallback((e: React.PointerEvent) => {
    const pt = getSvgPt(e);
    if (!pt) return;
    if (mode === "draw" && drawStartRef.current) {
      setPreviewArrow({ x1: drawStartRef.current.x, y1: drawStartRef.current.y, x2: pt.x, y2: pt.y });
      return;
    }
    if (draggingId) {
      if (draggingId.startsWith("opp-")) {
        setOpponents(prev => prev.map(p => p.id === draggingId ? { ...p, ...pt } : p));
      } else {
        setPlayers(prev => prev.map(p => p.id === draggingId ? { ...p, ...pt } : p));
      }
    }
  }, [mode, draggingId, getSvgPt]);

  const onPUp = useCallback((e: React.PointerEvent) => {
    if (mode === "draw" && drawStartRef.current) {
      const pt = getSvgPt(e);
      const x1 = drawStartRef.current.x;
      const y1 = drawStartRef.current.y;
      drawStartRef.current = null;
      setPreviewArrow(null);
      if (pt) {
        const dx = pt.x - x1;
        const dy = pt.y - y1;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          setArrows(prev => [...prev, {
            id: `arr-${Date.now()}`,
            x1, y1,
            x2: pt.x,
            y2: pt.y,
            color: drawColor,
          }]);
        }
      }
      return;
    }
    setDraggingId(null);
  }, [mode, getSvgPt, drawColor]);

  const showZones = mode === "xg" || (mode !== "draw" && showXgOverlay);
  const zoneOpacity = mode === "xg" ? 0.42 : 0.28;
  const selectedZoneData = XG_ZONES.find(z => z.id === selectedZone) ?? null;

  const MODES: { key: Mode; icon: React.ElementType; label: string }[] = [
    { key: "xg",     icon: Target, label: "XG Map"       },
    { key: "manual", icon: Move,   label: "Set Positions" },
    { key: "tactics",icon: Brain,  label: "Tactics View"  },
    { key: "draw",   icon: Pencil, label: "Draw Drill"    },
  ];

  const modeInstruction: Record<Mode, string> = {
    xg:
      "Tap any colored zone to see how dangerous it is. Red = 50%+ chance of scoring. Use this to show strikers where to run and defenders what to protect.",
    manual:
      "Drag the green player tokens to set your team shape. Toggle opposition to place red tokens — these are also draggable. Perfect for set pieces and specific opponent prep.",
    tactics:
      "Review how your formation covers the XG danger zones. Lines show tactical connections. Toggle opposition (red) to see match-ups and coverage gaps.",
    draw:
      "Draw movement arrows directly on the pitch. Gold = player run. White = pass line. Red = pressing trigger. Blue = shape/hold. Drag from start to finish point.",
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href={deptId ? `/coach/technical-staff/${deptId}` : "/coach"}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-base leading-none">
              {deptRole ? `${deptRole.title} — Tactical Board` : "Tactical Intelligence Board"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              XG Danger Map · Formation Builder · Draw Drills
            </div>
          </div>
        </div>
      </header>

      {/* Department context banner */}
      {deptRole && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-amber-800">{deptRole.title} focus:</span>
            {deptRole.focusCategories.map(cat => (
              <span
                key={cat}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200"
              >
                {cat.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 pb-20">
        {/* Mode tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {MODES.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                mode === tab.key
                  ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1a5c2a]/40"
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ── Pitch ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-3">
            <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-colors ${
              mode === "draw" ? "border-[#f0b429]/50 ring-1 ring-[#f0b429]/20" : "border-gray-200"
            }`}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full block"
                onPointerDown={onSvgDown}
                onPointerMove={onPMove}
                onPointerUp={onPUp}
                style={{ touchAction: "none", cursor: mode === "draw" ? "crosshair" : "default" }}
              >
                {/* Arrowhead markers for draw mode */}
                <defs>
                  {ARROW_COLORS.map(ac => (
                    <marker
                      key={ac.markerId}
                      id={ac.markerId}
                      markerWidth="7" markerHeight="7"
                      refX="5.5" refY="3.5"
                      orient="auto"
                    >
                      <path d="M0,0.5 L7,3.5 L0,6.5 Z" fill={ac.color} />
                    </marker>
                  ))}
                </defs>

                <PitchMarkings />

                {/* XG zone overlays */}
                {showZones && XG_ZONES.map(z => (
                  <g
                    key={z.id}
                    style={{ cursor: mode !== "draw" ? "pointer" : "crosshair" }}
                    onClick={() => mode !== "draw" && setSelectedZone(selectedZone === z.id ? null : z.id)}
                  >
                    <rect
                      x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={xgColor(z.xg)}
                      fillOpacity={selectedZone === z.id ? 0.65 : zoneOpacity}
                      stroke={selectedZone === z.id ? "white" : "none"}
                      strokeWidth={0.8}
                    />
                    {z.h >= 20 && (
                      <text
                        x={z.x + z.w / 2} y={z.y + z.h / 2 + 3.5}
                        textAnchor="middle" fontSize={6.5} fontWeight="800"
                        fill="white" fillOpacity={0.9}
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {Math.round(z.xg * 100)}%
                      </text>
                    )}
                  </g>
                ))}

                {/* Direction labels in XG mode */}
                {mode === "xg" && (
                  <>
                    <text x={200} y={142} textAnchor="middle" fontSize={5.5}
                      fill="rgba(255,255,255,0.28)" fontWeight="700"
                      style={{ userSelect: "none" }}>
                      YOUR ATTACKING END  ↑
                    </text>
                    <text x={200} y={151} textAnchor="middle" fontSize={5.5}
                      fill="rgba(255,255,255,0.18)"
                      style={{ userSelect: "none" }}>
                      DEFENSIVE SHAPE  ↓
                    </text>
                  </>
                )}

                {/* Tactical formation lines */}
                {mode === "tactics" && FORMATION_LINES[formation].map(([a, b], i) => {
                  const pa = players[a];
                  const pb = players[b];
                  if (!pa || !pb) return null;
                  return (
                    <line
                      key={i}
                      x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                      stroke="rgba(240,180,41,0.45)" strokeWidth={1} strokeDasharray="4 3"
                    />
                  );
                })}

                {/* Drawn arrows */}
                {arrows.map(a => (
                  <line
                    key={a.id}
                    x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                    stroke={a.color}
                    strokeWidth={2.5}
                    strokeOpacity={0.92}
                    markerEnd={`url(#${colorToMarkerId(a.color)})`}
                  />
                ))}

                {/* Live preview arrow while drawing */}
                {previewArrow && (
                  <line
                    x1={previewArrow.x1} y1={previewArrow.y1}
                    x2={previewArrow.x2} y2={previewArrow.y2}
                    stroke={drawColor} strokeWidth={2} strokeOpacity={0.55}
                    strokeDasharray="6 3"
                    markerEnd={`url(#${colorToMarkerId(drawColor)})`}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Opponent tokens */}
                {showOpponents && opponents.map(op => (
                  <g
                    key={op.id}
                    onPointerDown={e => onTokenDown(e, op.id)}
                    style={{
                      cursor: mode === "manual"
                        ? (draggingId === op.id ? "grabbing" : "grab")
                        : mode === "draw" ? "crosshair" : "default",
                    }}
                  >
                    <circle cx={op.x} cy={op.y} r={11} fill="#dc2626" stroke="white" strokeWidth={1.5} />
                    <text
                      x={op.x} y={op.y + 4}
                      textAnchor="middle" fontSize={6} fontWeight="700" fill="white"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {op.label}
                    </text>
                  </g>
                ))}

                {/* Our player tokens */}
                {players.map(p => (
                  <g
                    key={p.id}
                    transform={`translate(${p.x},${p.y})`}
                    onPointerDown={e => onTokenDown(e, p.id)}
                    style={{
                      cursor: mode === "manual"
                        ? (draggingId === p.id ? "grabbing" : "grab")
                        : mode === "draw" ? "crosshair" : "default",
                    }}
                  >
                    <circle r={13} fill="#1a5c2a" stroke="white" strokeWidth={2} />
                    <text
                      textAnchor="middle" y={4}
                      fontSize={7} fontWeight="800" fill="white"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Mode instruction */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3">
              <Info size={13} className="text-[#1a5c2a] mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-600 leading-relaxed">{modeInstruction[mode]}</p>
            </div>
          </div>

          {/* ── Side panel ────────────────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Formation selector */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Formation</p>
              <div className="space-y-1">
                {(["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"] as Formation[]).map(f => (
                  <button
                    key={f}
                    onClick={() => changeFormation(f)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors ${
                      formation === f
                        ? "bg-[#1a5c2a] text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Draw controls — only in draw mode */}
            {mode === "draw" && (
              <div className="bg-white rounded-2xl border border-[#f0b429]/40 p-4 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Arrow Type</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ARROW_COLORS.map(ac => (
                    <button
                      key={ac.color}
                      onClick={() => setDrawColor(ac.color)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        drawColor === ac.color
                          ? "border-gray-500 bg-gray-900 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                        style={{ backgroundColor: ac.color }}
                      />
                      {ac.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setArrows(prev => prev.slice(0, -1))}
                    disabled={arrows.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all"
                  >
                    <RotateCcw size={11} /> Undo
                  </button>
                  <button
                    onClick={() => setArrows([])}
                    disabled={arrows.length === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all"
                  >
                    <Trash2 size={11} /> Clear
                  </button>
                </div>
                {arrows.length > 0 && (
                  <p className="text-[10px] text-gray-400 text-center">
                    {arrows.length} arrow{arrows.length !== 1 ? "s" : ""} on pitch
                  </p>
                )}
              </div>
            )}

            {/* Overlay toggles */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Overlays</p>
              {mode !== "xg" && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">XG Danger Zones</span>
                  <button
                    onClick={() => setShowXgOverlay(v => !v)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${
                      showXgOverlay ? "bg-[#1a5c2a]" : "bg-gray-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      showXgOverlay ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">Opposition (4-4-2)</span>
                <button
                  onClick={() => setShowOpponents(v => !v)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    showOpponents ? "bg-red-500" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                    showOpponents ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
              {showOpponents && (
                <button
                  onClick={() => setOpponents(OPPONENT_TOKENS.map((op, i) => ({ id: `opp-${i}`, ...op })))}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 transition-all"
                >
                  <RotateCcw size={10} /> Reset opponents
                </button>
              )}
            </div>

            {/* XG legend */}
            {showZones && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Danger Scale</p>
                <div className="space-y-2">
                  {[
                    { color: "#dc2626", range: "50%+",     label: "Extreme danger" },
                    { color: "#ea580c", range: "30–50%",   label: "High danger"    },
                    { color: "#ca8a04", range: "15–30%",   label: "Shooting zone"  },
                    { color: "#4b5563", range: "8–15%",    label: "Low chance"     },
                    { color: "#1f2937", range: "Under 8%", label: "Long range"     },
                  ].map(item => (
                    <div key={item.range} className="flex items-center gap-2">
                      <div
                        className="w-4 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: item.color, opacity: 0.75 }}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-gray-800">{item.range}</span>
                        <span className="text-[10px] text-gray-400 ml-1">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-3 leading-relaxed">
                  Tap any zone for coaching advice.
                </p>
              </div>
            )}

            {/* Selected zone coaching card */}
            {selectedZoneData && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: xgColor(selectedZoneData.xg) }}
                  />
                  <p className="text-xs font-black text-gray-900">{selectedZoneData.label}</p>
                </div>
                <div className="text-2xl font-black mb-2" style={{ color: xgColor(selectedZoneData.xg) }}>
                  {Math.round(selectedZoneData.xg * 100)}% XG
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  {xgCoachingTip(selectedZoneData.xg)}
                </p>
                <button
                  className="mt-2 text-[9px] font-bold text-gray-400 hover:text-gray-600"
                  onClick={() => setSelectedZone(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Related tools */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Related Tools</p>
              {[
                { href: "/coach/tactics/simulator", label: "Tactics Simulator" },
                { href: "/analyst/xg-analysis",    label: "Full XG Analysis"  },
                { href: "/coach/set-pieces",        label: "Set Piece Lab"     },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between py-2 text-xs font-medium text-gray-600 hover:text-[#1a5c2a] transition-colors border-b border-gray-50 last:border-0"
                >
                  {link.label}
                  <ChevronRight size={12} className="text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export (wrapped in Suspense for useSearchParams) ─────────────────────────

export default function TacticalIntelligenceBoardPage() {
  return (
    <Suspense>
      <BoardPageInner />
    </Suspense>
  );
}
