// src/app/coach/tactics/board/page.tsx
"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Target, Move, Brain, ChevronRight, Info, Pencil,
  RotateCcw, Share2, Users, X, Shield, GitBranch,
} from "lucide-react";
import { getRoleConfig } from "@/config/coaching-staff";
import { useAuthStore } from "@/lib/auth-store";

type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";
type Mode = "xg" | "manual" | "tactics" | "draw";
type ZoneView = "attack" | "midfield" | "defense";

interface Arrow { id: string; x1: number; y1: number; x2: number; y2: number; color: string; }
interface AssignedPlayer { playerId: string; name: string; initials: string; }
interface PlayerToken { id: string; x: number; y: number; label: string; assigned?: AssignedPlayer; }
interface SquadPlayer { id: string; first_name?: string; surname?: string; name?: string; position?: string; }
interface ZoneDetailProps { view: ZoneView; selectedZone: string | null; onDismiss: () => void; }

const W = 400;
const H = 260;
const FINAL_THIRD_END  = 87;
const MIDDLE_THIRD_END = 173;

const XG_ZONES_ATTACK = [
  { id: "six_yard",       label: "6-Yard Box",    xg: 0.76, x: 157, y: 2,   w: 86,  h: 22 },
  { id: "pen_area_c",     label: "Penalty Area",  xg: 0.45, x: 135, y: 24,  w: 130, h: 22 },
  { id: "central_box",    label: "Central Box",   xg: 0.35, x: 118, y: 46,  w: 164, h: 24 },
  { id: "wide_box_left",  label: "Left Channel",  xg: 0.12, x: 66,  y: 2,   w: 91,  h: 68 },
  { id: "wide_box_right", label: "Right Channel", xg: 0.12, x: 243, y: 2,   w: 91,  h: 68 },
  { id: "edge_centre",    label: "Edge of Box",   xg: 0.18, x: 118, y: 70,  w: 164, h: 17 },
  { id: "edge_left",      label: "Left Edge",     xg: 0.07, x: 30,  y: 70,  w: 88,  h: 17 },
  { id: "edge_right",     label: "Right Edge",    xg: 0.07, x: 282, y: 70,  w: 88,  h: 17 },
];

const XG_ZONES_MID = [
  { id: "mid_left_deep",    pass_pct: 0.84, x: 0,   y: 87,  w: 100, h: 43, label: "Left Deep",
    coaching: "High pass completion here. Use overlapping runs from full-back. Play simple triangles to maintain possession and draw pressure wide." },
  { id: "mid_centre_deep",  pass_pct: 0.78, x: 100, y: 87,  w: 200, h: 43, label: "Centre (Deep)",
    coaching: "78% pass completion. Your holding midfielder must control this space. Spread play early — avoid dwelling in the press trap." },
  { id: "mid_right_deep",   pass_pct: 0.84, x: 300, y: 87,  w: 100, h: 43, label: "Right Deep",
    coaching: "High pass completion here. Use overlapping runs from full-back. Play simple triangles to maintain possession and draw pressure wide." },
  { id: "mid_left_press",   pass_pct: 0.61, x: 0,   y: 130, w: 100, h: 43, label: "Left Press Zone",
    coaching: "Only 61% pass completion — heavy press area. Move the ball quickly, one or two touches maximum. Drive infield or switch to the far side." },
  { id: "mid_centre_press", pass_pct: 0.53, x: 100, y: 130, w: 200, h: 43, label: "Central Press",
    coaching: "53% completion — the most contested zone. Play through here only with confident feet. If under pressure: go wide or go long. Never force it." },
  { id: "mid_right_press",  pass_pct: 0.61, x: 300, y: 130, w: 100, h: 43, label: "Right Press Zone",
    coaching: "Only 61% pass completion — heavy press area. Move the ball quickly, one or two touches maximum. Drive infield or switch to the far side." },
];

const XG_ZONES_DEF = [
  { id: "def_left_wide",     label: "Left Wide",     alert_pct: 0.09, x: 0,   y: 173, w: 90,  h: 43 },
  { id: "def_centre_deep",   label: "Deep Centre",   alert_pct: 0.06, x: 90,  y: 173, w: 220, h: 43 },
  { id: "def_right_wide",    label: "Right Wide",    alert_pct: 0.09, x: 310, y: 173, w: 90,  h: 43 },
  { id: "def_left_channel",  label: "Left Channel",  alert_pct: 0.22, x: 0,   y: 216, w: 90,  h: 43 },
  { id: "def_pen_edge",      label: "Penalty Edge",  alert_pct: 0.35, x: 90,  y: 216, w: 220, h: 22 },
  { id: "def_right_channel", label: "Right Channel", alert_pct: 0.22, x: 310, y: 216, w: 90,  h: 43 },
  { id: "def_six_yard",      label: "Six-Yard Box",  alert_pct: 0.76, x: 157, y: 238, w: 86,  h: 22 },
  { id: "def_pen_area",      label: "Penalty Area",  alert_pct: 0.45, x: 118, y: 192, w: 164, h: 24 },
];

function attackColor(xg: number): string {
  if (xg >= 0.50) return "#dc2626";
  if (xg >= 0.30) return "#ea580c";
  if (xg >= 0.15) return "#ca8a04";
  if (xg >= 0.08) return "#4b5563";
  return "#1f2937";
}
function midColor(pct: number): string {
  if (pct >= 0.80) return "#1a5c2a";
  if (pct >= 0.65) return "#2d7a3a";
  if (pct >= 0.55) return "#ca8a04";
  return "#dc2626";
}
function defColor(pct: number): string {
  if (pct >= 0.50) return "#dc2626";
  if (pct >= 0.30) return "#ea580c";
  if (pct >= 0.18) return "#ca8a04";
  return "#374151";
}

function attackCoachingTip(xg: number): string {
  if (xg >= 0.50) return "Maximum danger zone. Defenders must NEVER leave this space uncovered. Strikers: make your runs here early and hold position.";
  if (xg >= 0.30) return "High danger area. Block shooting angles fast. Strikers: hold your run and wait for the exact moment to shoot.";
  if (xg >= 0.15) return "Good shooting zone. Pressure the ball carrier immediately. Strikers: first-time shot if possible — do not take extra touches.";
  if (xg >= 0.08) return "Lower probability. Stay compact and do not overcommit wide. Force play back inside.";
  return "Long range — low chance of scoring but do not switch off. Keeper must be alert. Block any clear sights.";
}
function midCoachingTip(pct: number): string {
  if (pct >= 0.80) return "High pass completion zone. Recycle possession here patiently. Use width and overlapping runs to open space in front.";
  if (pct >= 0.65) return "Above average completion. Move the ball with purpose — 2–3 touches maximum. Look to play forward when the opportunity arises.";
  if (pct >= 0.55) return "Contested zone. Limit touches and keep ball moving. Switching play to the opposite side relieves pressure quickly.";
  return "Heavy press zone. Expect to lose the ball here. Play quickly, use the goalkeeper or go long to relieve pressure.";
}
function defCoachingTip(pct: number): string {
  if (pct >= 0.50) return "Extreme danger — this is the most dangerous space in your defensive third. Never leave a striker here unmarked. Cover immediately.";
  if (pct >= 0.30) return "High danger zone. Keep a tight defensive line and communicate clearly. Any ball into this space must be attacked first.";
  if (pct >= 0.18) return "Moderate danger. Channel attackers away from central positions. Your full-back must stay goal-side at all times.";
  return "Low danger zone. Attackers here are away from goal — don't overcommit. Maintain your shape and force play backwards.";
}

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

const OPPONENT_TOKENS: Omit<PlayerToken, "id">[] = [
  { label: "GK",  x: 200, y: 18  },
  { label: "RB",  x: 76,  y: 52  }, { label: "CB", x: 142, y: 60  },
  { label: "CB",  x: 258, y: 60  }, { label: "LB", x: 324, y: 52  },
  { label: "LM",  x: 66,  y: 100 }, { label: "CM", x: 142, y: 108 },
  { label: "CM",  x: 258, y: 108 }, { label: "RM", x: 334, y: 100 },
  { label: "ST",  x: 152, y: 160 }, { label: "ST", x: 248, y: 160 },
];

const FORMATION_LINES: Record<Formation, [number, number][]> = {
  "4-3-3":   [[1,2],[2,3],[3,4],[2,5],[3,7],[5,6],[6,7],[5,8],[6,9],[7,10]],
  "4-4-2":   [[1,2],[2,3],[3,4],[1,5],[4,8],[5,6],[6,7],[7,8],[9,10]],
  "4-2-3-1": [[1,2],[2,3],[3,4],[2,5],[3,6],[5,6],[5,7],[6,9],[7,8],[8,10]],
  "3-5-2":   [[1,2],[2,3],[1,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10]],
  "5-3-2":   [[1,2],[2,3],[3,4],[4,5],[3,6],[4,8],[6,7],[7,8],[9,10]],
};

function PitchMarkings({ showThirds }: { showThirds?: boolean }) {
  const line = "rgba(255,255,255,0.72)"; const lw = 0.8;
  return (
    <g>
      <rect width={W} height={H} fill="#2d6a1f" />
      {[0,1,2,3,4].map(i => <rect key={i} x={0} y={i*52} width={W} height={26} fill="rgba(0,0,0,0.03)" />)}
      <rect x={8} y={6} width={384} height={248} fill="none" stroke={line} strokeWidth={lw} />
      <line x1={8} y1={130} x2={392} y2={130} stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={130} r={35} fill="none" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={130} r={1.5} fill={line} />
      <rect x={118} y={6} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={157} y={6} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={172} y={3} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={46} r={1.5} fill={line} />
      <path d="M 162 68 A 34 34 0 0 1 238 68" fill="none" stroke={line} strokeWidth={lw} />
      <rect x={118} y={192} width={164} height={62} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={157} y={232} width={86} height={22} fill="none" stroke={line} strokeWidth={lw} />
      <rect x={172} y={252} width={56} height={5} fill="rgba(255,255,255,0.15)" stroke={line} strokeWidth={lw} />
      <circle cx={200} cy={214} r={1.5} fill={line} />
      <path d="M 162 192 A 34 34 0 0 0 238 192" fill="none" stroke={line} strokeWidth={lw} />
      {showThirds && (
        <>
          <line x1={8} y1={FINAL_THIRD_END} x2={392} y2={FINAL_THIRD_END} stroke="rgba(255,255,255,0.35)" strokeWidth={0.7} strokeDasharray="6 4" />
          <line x1={8} y1={MIDDLE_THIRD_END} x2={392} y2={MIDDLE_THIRD_END} stroke="rgba(255,255,255,0.35)" strokeWidth={0.7} strokeDasharray="6 4" />
          <text x={12} y={FINAL_THIRD_END-3} fontSize={4.5} fill="rgba(255,255,255,0.40)" fontWeight="700" style={{ userSelect: "none" as const }}>FINAL THIRD — ATTACK</text>
          <text x={12} y={FINAL_THIRD_END+10} fontSize={4.5} fill="rgba(255,255,255,0.40)" fontWeight="700" style={{ userSelect: "none" as const }}>MIDDLE THIRD — MIDFIELD</text>
          <text x={12} y={MIDDLE_THIRD_END+10} fontSize={4.5} fill="rgba(255,255,255,0.40)" fontWeight="700" style={{ userSelect: "none" as const }}>DEFENSIVE THIRD</text>
        </>
      )}
    </g>
  );
}

const ARROW_COLORS = [
  { color: "#f0b429",              label: "Run",   markerId: "arr-gold"  },
  { color: "rgba(255,255,255,0.9)", label: "Pass",  markerId: "arr-white" },
  { color: "#ef4444",              label: "Press", markerId: "arr-red"   },
  { color: "#60a5fa",              label: "Shape", markerId: "arr-blue"  },
];
function colorToMarkerId(color: string): string {
  return ARROW_COLORS.find(a => a.color === color)?.markerId ?? "arr-gold";
}

function ZoneDetailPanel({ view, selectedZone, onDismiss }: ZoneDetailProps) {
  if (!selectedZone) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
        <p className="text-[10px] text-gray-400 leading-relaxed">Tap any zone on the pitch to see coaching instructions.</p>
      </div>
    );
  }
  if (view === "attack") {
    const zone = XG_ZONES_ATTACK.find(z => z.id === selectedZone);
    if (!zone) return null;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: attackColor(zone.xg) }} />
          <p className="text-xs font-black text-gray-900">{zone.label}</p>
        </div>
        <div className="text-2xl font-black mb-2" style={{ color: attackColor(zone.xg) }}>{Math.round(zone.xg*100)}% XG</div>
        <p className="text-[10px] text-gray-600 leading-relaxed">{attackCoachingTip(zone.xg)}</p>
        <button className="mt-2 text-[9px] font-bold text-gray-400 hover:text-gray-600" onClick={onDismiss}>Dismiss</button>
      </div>
    );
  }
  if (view === "midfield") {
    const zone = XG_ZONES_MID.find(z => z.id === selectedZone);
    if (!zone) return null;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: midColor(zone.pass_pct) }} />
          <p className="text-xs font-black text-gray-900">{zone.label}</p>
        </div>
        <div className="text-2xl font-black mb-2" style={{ color: midColor(zone.pass_pct) }}>{Math.round(zone.pass_pct*100)}% Pass %</div>
        <p className="text-[10px] text-gray-600 leading-relaxed">{zone.coaching}</p>
        <button className="mt-2 text-[9px] font-bold text-gray-400 hover:text-gray-600" onClick={onDismiss}>Dismiss</button>
      </div>
    );
  }
  const zone = XG_ZONES_DEF.find(z => z.id === selectedZone);
  if (!zone) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: defColor(zone.alert_pct) }} />
        <p className="text-xs font-black text-gray-900">{zone.label}</p>
      </div>
      <div className="text-2xl font-black mb-2" style={{ color: defColor(zone.alert_pct) }}>{Math.round(zone.alert_pct*100)}% Danger</div>
      <p className="text-[10px] text-gray-600 leading-relaxed">{defCoachingTip(zone.alert_pct)}</p>
      <button className="mt-2 text-[9px] font-bold text-gray-400 hover:text-gray-600" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

const ZONE_VIEWS: { key: ZoneView; icon: ElementType; label: string; color: string }[] = [
  { key: "attack",   icon: Target,    label: "Attack",   color: "#dc2626" },
  { key: "midfield", icon: GitBranch, label: "Midfield", color: "#ca8a04" },
  { key: "defense",  icon: Shield,    label: "Defence",  color: "#1a5c2a" },
];

const MODES: { key: Mode; icon: ElementType; label: string }[] = [
  { key: "xg",      icon: Target, label: "Zone Map"      },
  { key: "manual",  icon: Move,   label: "Set Positions" },
  { key: "tactics", icon: Brain,  label: "Tactics View"  },
  { key: "draw",    icon: Pencil, label: "Draw Drill"    },
];

function BoardPageInner() {
  const searchParams = useSearchParams();
  const deptId   = searchParams.get("dept");
  const deptRole = deptId ? getRoleConfig(deptId) : null;

  const [mode, setMode]           = useState<Mode>("xg");
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [players, setPlayers]     = useState<PlayerToken[]>(() => FORMATIONS["4-3-3"].map((p,i) => ({ id:`p${i}`, ...p })));
  const [zoneView, setZoneView]   = useState<ZoneView>("attack");
  const [showOpponents, setShowOpponents] = useState(false);
  const [opponents, setOpponents] = useState<PlayerToken[]>(() => OPPONENT_TOKENS.map((op,i) => ({ id:`opp-${i}`, ...op })));
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);

  const [arrows, setArrows]             = useState<Arrow[]>([]);
  const [drawColor, setDrawColor]       = useState(ARROW_COLORS[0].color);
  const [previewArrow, setPreviewArrow] = useState<{ x1:number; y1:number; x2:number; y2:number } | null>(null);
  const drawStartRef         = useRef<{ x:number; y:number } | null>(null);
  const pointerDownClientRef = useRef<{ x:number; y:number } | null>(null);

  const authToken = useAuthStore((s) => s.token);
  const [squad, setSquad]                 = useState<SquadPlayer[]>([]);
  const [pickerTokenId, setPickerTokenId] = useState<string | null>(null);
  const [shareNote, setShareNote]         = useState("");
  const [shareCopied, setShareCopied]     = useState(false);
  const [shareLink, setShareLink]         = useState<string | null>(null);
  const [linkCopied, setLinkCopied]       = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);


  const changeFormation = (f: Formation) => {
    setFormation(f);
    setPlayers(FORMATIONS[f].map((p,i) => ({ id:`p${i}`, ...p })));
    setSelectedZone(null);
  };

  useEffect(() => {
    if (!authToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/squad`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res) return;
        const list: SquadPlayer[] = Array.isArray(res) ? res : (res?.data ?? []);
        setSquad(list);
      })
      .catch(() => {});
  }, [authToken]);

  const assignPlayer = useCallback((tokenId: string, sp: SquadPlayer) => {
    const firstName = sp.first_name ?? sp.name?.split(" ")[0] ?? "";
    const surname   = sp.surname   ?? sp.name?.split(" ").slice(1).join(" ") ?? "";
    const fullName  = [firstName, surname].filter(Boolean).join(" ") || "Player";
    const initials  = [firstName[0], surname[0]].filter(Boolean).join("").toUpperCase() || "?";
    setPlayers(prev => prev.map(p => p.id === tokenId ? { ...p, assigned: { playerId: sp.id, name: fullName, initials } } : p));
    setPickerTokenId(null);
  }, []);

  const unassignPlayer = useCallback((tokenId: string) => {
    setPlayers(prev => prev.map(p => p.id === tokenId ? { ...p, assigned: undefined } : p));
  }, []);

  const generateShareLink = useCallback(() => {
    const boardState = {
      f: formation,
      p: players.map(p => ({
        id: p.id, x: Math.round(p.x), y: Math.round(p.y), l: p.label,
        ...(p.assigned ? { n: p.assigned.name, i: p.assigned.initials } : {}),
      })),
      o: showOpponents ? opponents.map(op => ({ x: Math.round(op.x), y: Math.round(op.y), l: op.label })) : null,
      a: arrows.map(a => ({ x1: Math.round(a.x1), y1: Math.round(a.y1), x2: Math.round(a.x2), y2: Math.round(a.y2), c: a.color })),
      note: shareNote,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(boardState))));
    const url = `${window.location.origin}/tactics/view?state=${encodeURIComponent(encoded)}`;
    setShareLink(url);
    return url;
  }, [formation, players, showOpponents, opponents, arrows, shareNote]);

  const getSvgPt = useCallback((e: React.PointerEvent) => {
    if (!svgRef.current) return null;
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.max(12, Math.min(388, ((e.clientX-r.left)/r.width)*W)),
      y: Math.max(12, Math.min(248, ((e.clientY-r.top)/r.height)*H)),
    };
  }, []);

  const onSvgDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    const pt = getSvgPt(e);
    if (pt) drawStartRef.current = pt;
  }, [mode, getSvgPt]);

  const onTokenDown = useCallback((e: React.PointerEvent, id: string) => {
    if (mode !== "manual") return;
    e.preventDefault(); e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingId(id);
    pointerDownClientRef.current = { x: e.clientX, y: e.clientY };
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
      const x1 = drawStartRef.current.x; const y1 = drawStartRef.current.y;
      drawStartRef.current = null; setPreviewArrow(null);
      if (pt) {
        const dx = pt.x-x1; const dy = pt.y-y1;
        if (Math.sqrt(dx*dx+dy*dy) > 10) {
          setArrows(prev => [...prev, { id:`arr-${Date.now()}`, x1, y1, x2: pt.x, y2: pt.y, color: drawColor }]);
        }
      }
      return;
    }
    if (draggingId && !draggingId.startsWith("opp-") && pointerDownClientRef.current) {
      const dx = e.clientX-pointerDownClientRef.current.x;
      const dy = e.clientY-pointerDownClientRef.current.y;
      if (Math.sqrt(dx*dx+dy*dy) < 8) {
        setPickerTokenId(draggingId);
        setDraggingId(null);
        pointerDownClientRef.current = null;
        return;
      }
    }
    pointerDownClientRef.current = null;
    setDraggingId(null);
  }, [mode, getSvgPt, drawColor, draggingId]);

  const showZones  = mode === "xg" || mode === "tactics";
  const zoneOpacity = mode === "xg" ? 0.42 : 0.28;


  const modeInstruction: Record<Mode, string> = {
    xg:      "Tap any colored zone to see coaching guidance. The pitch is split into three thirds: Attack (XG danger %), Midfield (pass completion %), Defence (danger % when uncovered). Switch between thirds using the tabs below.",
    manual:  "Drag tokens to reposition. Tap any green token to assign a squad player.",
    tactics: "Review how your formation covers the zone model. Lines show tactical connections. Toggle opposition to see match-ups and coverage gaps.",
    draw:    "Draw movement arrows directly on the pitch. Gold = player run. White = pass line. Red = pressing trigger. Blue = shape/hold. Drag from start to finish point.",
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href={deptId ? `/coach/technical-staff/${deptId}` : "/coach"} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-base leading-none">
              {deptRole ? `${deptRole.title} — Tactical Board` : "Tactical Intelligence Board"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Zone Map · Formation Builder · Draw Drills</div>
          </div>
        </div>
      </header>

      {deptRole && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-amber-800">{deptRole.title} focus:</span>
            {deptRole.focusCategories.map(cat => (
              <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {cat.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 pb-20">
        {/* Mode tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {MODES.map(tab => (
            <button key={tab.key} onClick={() => setMode(tab.key)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${mode === tab.key ? "bg-[#1a5c2a] text-white border-[#1a5c2a]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a5c2a]/40"}`}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {/* Zone view tabs (only in xg/tactics mode) */}
        {showZones && (
          <div className="flex gap-2 mb-4">
            {ZONE_VIEWS.map(v => (
              <button key={v.key} onClick={() => { setZoneView(v.key); setSelectedZone(null); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${zoneView === v.key ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                style={zoneView === v.key ? { backgroundColor: v.color, borderColor: v.color } : {}}>
                <v.icon size={11} />{v.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Pitch + info bar */}
          <div className="lg:col-span-3 space-y-3">
            <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-colors ${mode === "draw" ? "border-[#f0b429]/50 ring-1 ring-[#f0b429]/20" : "border-gray-200"}`}>
              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block"
                onPointerDown={onSvgDown} onPointerMove={onPMove} onPointerUp={onPUp}
                style={{ touchAction: "none", cursor: mode === "draw" ? "crosshair" : "default" }}>
                <defs>
                  {ARROW_COLORS.map(ac => (
                    <marker key={ac.markerId} id={ac.markerId} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
                      <path d="M0,0.5 L7,3.5 L0,6.5 Z" fill={ac.color} />
                    </marker>
                  ))}
                </defs>

                <PitchMarkings showThirds={showZones} />

                {/* Attack XG zones */}
                {showZones && zoneView === "attack" && XG_ZONES_ATTACK.map(z => (
                  <g key={z.id} style={{ cursor: "pointer" }} onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={attackColor(z.xg)}
                      fillOpacity={selectedZone === z.id ? 0.65 : zoneOpacity}
                      stroke={selectedZone === z.id ? "white" : "none"}
                      strokeWidth={0.8} />
                    {z.h >= 16 && (
                      <text x={z.x+z.w/2} y={z.y+z.h/2+3.5} textAnchor="middle" fontSize={6.5} fontWeight="800" fill="white" fillOpacity={0.9}
                        style={{ pointerEvents:"none", userSelect:"none" }}>
                        {Math.round(z.xg*100)}%
                      </text>
                    )}
                  </g>
                ))}

                {/* Midfield pass % zones */}
                {showZones && zoneView === "midfield" && XG_ZONES_MID.map(z => (
                  <g key={z.id} style={{ cursor: "pointer" }} onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={midColor(z.pass_pct)}
                      fillOpacity={selectedZone === z.id ? 0.65 : zoneOpacity}
                      stroke={selectedZone === z.id ? "white" : "none"}
                      strokeWidth={0.8} />
                    <text x={z.x+z.w/2} y={z.y+z.h/2+3.5} textAnchor="middle" fontSize={6.5} fontWeight="800" fill="white" fillOpacity={0.9}
                      style={{ pointerEvents:"none", userSelect:"none" }}>
                      {Math.round(z.pass_pct*100)}%
                    </text>
                  </g>
                ))}

                {/* Defence danger zones */}
                {showZones && zoneView === "defense" && XG_ZONES_DEF.map(z => (
                  <g key={z.id} style={{ cursor: "pointer" }} onClick={() => setSelectedZone(selectedZone === z.id ? null : z.id)}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h}
                      fill={defColor(z.alert_pct)}
                      fillOpacity={selectedZone === z.id ? 0.65 : zoneOpacity}
                      stroke={selectedZone === z.id ? "white" : "none"}
                      strokeWidth={0.8} />
                    {z.h >= 16 && (
                      <text x={z.x+z.w/2} y={z.y+z.h/2+3.5} textAnchor="middle" fontSize={6.5} fontWeight="800" fill="white" fillOpacity={0.9}
                        style={{ pointerEvents:"none", userSelect:"none" }}>
                        {Math.round(z.alert_pct*100)}%
                      </text>
                    )}
                  </g>
                ))}

                {/* Tactics formation lines */}
                {mode === "tactics" && FORMATION_LINES[formation].map(([a,b],i) => {
                  const pa = players[a]; const pb = players[b];
                  if (!pa || !pb) return null;
                  return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="rgba(240,180,41,0.45)" strokeWidth={1} strokeDasharray="4 3" />;
                })}

                {/* Committed arrows */}
                {arrows.map(a => (
                  <line key={a.id} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                    stroke={a.color} strokeWidth={2.5} strokeOpacity={0.92}
                    markerEnd={`url(#${colorToMarkerId(a.color)})`} />
                ))}

                {/* Live draw preview */}
                {previewArrow && (
                  <line x1={previewArrow.x1} y1={previewArrow.y1} x2={previewArrow.x2} y2={previewArrow.y2}
                    stroke={drawColor} strokeWidth={2} strokeOpacity={0.55} strokeDasharray="6 3"
                    markerEnd={`url(#${colorToMarkerId(drawColor)})`}
                    style={{ pointerEvents:"none" }} />
                )}

                {/* Opponent tokens */}
                {showOpponents && opponents.map(op => (
                  <g key={op.id} onPointerDown={e => onTokenDown(e, op.id)}
                    style={{ cursor: mode==="manual" ? (draggingId===op.id ? "grabbing" : "grab") : mode==="draw" ? "crosshair" : "default" }}>
                    <circle cx={op.x} cy={op.y} r={11} fill="#dc2626" stroke="white" strokeWidth={1.5} />
                    <text x={op.x} y={op.y+4} textAnchor="middle" fontSize={6} fontWeight="700" fill="white"
                      style={{ pointerEvents:"none", userSelect:"none" }}>{op.label}</text>
                  </g>
                ))}

                {/* Player tokens */}
                {players.map(p => (
                  <g key={p.id} transform={`translate(${p.x},${p.y})`} onPointerDown={e => onTokenDown(e, p.id)}
                    style={{ cursor: mode==="manual" ? (draggingId===p.id ? "grabbing" : "grab") : mode==="draw" ? "crosshair" : "default" }}>
                    {p.assigned && <circle r={16} fill="none" stroke="#f0b429" strokeWidth={2} strokeOpacity={0.9} />}
                    <circle r={13} fill="#1a5c2a" stroke="white" strokeWidth={2} />
                    <text textAnchor="middle" y={p.assigned ? -1.5 : 4}
                      fontSize={p.assigned ? 5.5 : 7} fontWeight="800" fill="white"
                      style={{ pointerEvents:"none", userSelect:"none" }}>{p.label}</text>
                    {p.assigned && (
                      <text textAnchor="middle" y={7} fontSize={5} fontWeight="900" fill="#f0b429"
                        style={{ pointerEvents:"none", userSelect:"none" }}>{p.assigned.initials}</text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Zone detail panel — mobile (below pitch) */}
            {showZones && (
              <div className="lg:hidden">
                <ZoneDetailPanel view={zoneView} selectedZone={selectedZone} onDismiss={() => setSelectedZone(null)} />
              </div>
            )}

            {/* Mode instruction bar */}
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3">
              <Info size={13} className="text-[#1a5c2a] mt-0.5 shrink-0" />
              <p className="text-[11px] text-gray-600 leading-relaxed">{modeInstruction[mode]}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Formation selector */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Formation</p>
              <div className="space-y-1">
                {(["4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2"] as Formation[]).map(f => (
                  <button key={f} onClick={() => changeFormation(f)}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors ${formation===f ? "bg-[#1a5c2a] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => setPlayers(FORMATIONS[formation].map((p,i) => ({ id:`p${i}`, ...p })))}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-green-100 text-[#1a5c2a] hover:bg-green-50 transition-all">
                  <RotateCcw size={10} /> Reset
                </button>
                <button onClick={() => setShowOpponents(v => !v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${showOpponents ? "border-red-200 text-red-500 bg-red-50 hover:bg-red-100" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Users size={10} />{showOpponents ? "Hide Opp" : "Show Opp"}
                </button>
              </div>
              {showOpponents && (
                <button onClick={() => setOpponents(OPPONENT_TOKENS.map((op,i) => ({ id:`opp-${i}`, ...op })))}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                  <RotateCcw size={9} /> Reset opponents
                </button>
              )}
            </div>

            {/* Zone detail panel — desktop sidebar */}
            {showZones && (
              <div className="hidden lg:block">
                <ZoneDetailPanel view={zoneView} selectedZone={selectedZone} onDismiss={() => setSelectedZone(null)} />
              </div>
            )}

            {/* Draw arrow controls */}
            {mode === "draw" && (
              <div className="bg-white rounded-2xl border border-[#f0b429]/40 p-4 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Arrow Type</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ARROW_COLORS.map(ac => (
                    <button key={ac.color} onClick={() => setDrawColor(ac.color)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold border transition-all ${drawColor===ac.color ? "border-gray-500 bg-gray-900 text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                      <span className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: ac.color }} />
                      {ac.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setArrows(prev => prev.slice(0,-1))} disabled={arrows.length===0}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">
                    <RotateCcw size={11} /> Undo
                  </button>
                  <button onClick={() => setArrows([])} disabled={arrows.length===0}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-30 transition-all">
                    <RotateCcw size={11} /> Reset
                  </button>
                </div>
                {arrows.length > 0 && (
                  <p className="text-[10px] text-gray-400 text-center">{arrows.length} arrow{arrows.length!==1?"s":""} on pitch</p>
                )}
              </div>
            )}

            {/* Squad picker */}
            {pickerTokenId && (() => {
              const pickedToken = players.find(p => p.id === pickerTokenId);
              return (
                <div className="bg-white rounded-2xl border border-[#f0b429]/60 p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Assign — {pickedToken?.label ?? "Position"}
                    </p>
                    <button onClick={() => setPickerTokenId(null)} className="text-gray-300 hover:text-gray-600 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                  {pickedToken?.assigned && (
                    <div className="flex items-center justify-between bg-[#f0fdf4] rounded-lg px-2.5 py-2 border border-green-100">
                      <span className="text-[11px] font-semibold text-[#1a5c2a] truncate">{pickedToken.assigned.name}</span>
                      <button onClick={() => unassignPlayer(pickerTokenId)} className="text-gray-400 hover:text-red-400 transition-colors ml-2 shrink-0">
                        <X size={11} />
                      </button>
                    </div>
                  )}
                  <div className="max-h-44 overflow-y-auto space-y-0.5">
                    {squad.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center py-4">
                        Squad not loaded. Make sure you are logged in as a coach.
                      </p>
                    ) : (
                      squad.map(sp => {
                        const firstName = sp.first_name ?? sp.name?.split(" ")[0] ?? "";
                        const surname   = sp.surname   ?? sp.name?.split(" ").slice(1).join(" ") ?? "";
                        const fullName  = [firstName, surname].filter(Boolean).join(" ") || "Player";
                        const initials  = [firstName[0], surname[0]].filter(Boolean).join("").toUpperCase() || "?";
                        return (
                          <button key={sp.id} onClick={() => assignPlayer(pickerTokenId, sp)}
                            className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-[#f0fdf4] hover:text-[#1a5c2a] transition-colors">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 text-white" style={{ backgroundColor: "#1a5c2a" }}>
                              {initials}
                            </span>
                            <span className="truncate">
                              {fullName}
                              {sp.position && <span className="text-gray-400 ml-1">· {sp.position}</span>}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Related tools */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Related Tools</p>
              {[
                { href:"/coach/tactics/simulator", label:"Tactics Simulator" },
                { href:"/analyst/xg-analysis",    label:"Full XG Analysis"  },
                { href:"/coach/set-pieces",        label:"Set Piece Lab"     },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center justify-between py-2 text-xs font-medium text-gray-600 hover:text-[#1a5c2a] transition-colors border-b border-gray-50 last:border-0">
                  {link.label}<ChevronRight size={12} className="text-gray-300" />
                </Link>
              ))}
            </div>

            {/* Share tactic */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Share Tactic</p>
                <Share2 size={12} className="text-gray-300" />
              </div>
              {players.some(p => p.assigned) ? (
                <>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {players.filter(p => p.assigned).map(p => (
                      <div key={p.id} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold w-8 shrink-0" style={{ color:"#1a5c2a" }}>{p.label}</span>
                        <span className="text-[10px] text-gray-600 truncate">{p.assigned!.name}</span>
                      </div>
                    ))}
                  </div>
                  <textarea value={shareNote} onChange={e => setShareNote(e.target.value)}
                    placeholder="Add coaching notes for players..."
                    className="w-full text-[11px] rounded-lg border border-gray-200 px-2.5 py-2 resize-none text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#1a5c2a] transition-colors"
                    rows={2} />
                  <button onClick={() => {
                    const assigned = players.filter(p => p.assigned);
                    const link = generateShareLink();
                    const lines = [
                      `⚽ TEAM TACTIC — ${formation}`, "",
                      "POSITIONS:",
                      ...assigned.map(p => `  ${p.label}: ${p.assigned!.name}`),
                      ...(shareNote.trim() ? ["", `📋 Coach Notes: ${shareNote.trim()}`] : []),
                      "", `📲 View on board: ${link}`,
                      "📱 GrassRoots Sports | grassrootssports.live",
                    ];
                    navigator.clipboard.writeText(lines.join("\n")).then(() => {
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2500);
                    }).catch(() => {});
                  }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-white transition-all"
                    style={{ backgroundColor: shareCopied ? "#16a34a" : "#1a5c2a" }}>
                    <Share2 size={11} />{shareCopied ? "Copied to clipboard!" : "Copy tactic to share"}
                  </button>
                  <p className="text-[9px] text-gray-400 text-center leading-relaxed">Paste into WhatsApp group · includes board link</p>
                  <div className="border-t border-gray-100 pt-2.5">
                    {shareLink ? (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Share link</p>
                        <div className="flex items-center gap-1.5">
                          <input readOnly value={shareLink}
                            className="flex-1 min-w-0 text-[9px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 truncate" />
                          <button onClick={() => {
                            navigator.clipboard.writeText(shareLink).then(() => {
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }).catch(() => {});
                          }}
                            className="shrink-0 text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors"
                            style={linkCopied
                              ? { backgroundColor:"#f0fdf4", color:"#16a34a", borderColor:"#bbf7d0" }
                              : { backgroundColor:"#f9fafb", color:"#374151", borderColor:"#e5e7eb" }}>
                            {linkCopied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <button onClick={() => {
                          const url = generateShareLink();
                          navigator.clipboard.writeText(url).then(() => {
                            setLinkCopied(true);
                            setTimeout(() => setLinkCopied(false), 2000);
                          }).catch(() => {});
                        }} className="text-[9px] text-gray-400 hover:text-[#1a5c2a] transition-colors">
                          Regenerate link
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => generateShareLink()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold border border-gray-200 text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition-colors">
                        <Share2 size={11} />Generate share link
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-3">
                  <Users size={22} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400 leading-snug">
                    Switch to <strong className="text-gray-600">Set Positions</strong> and tap a green token to assign squad players.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TacticalIntelligenceBoardPage() {
  return (
    <Suspense>
      <BoardPageInner />
    </Suspense>
  );
}
