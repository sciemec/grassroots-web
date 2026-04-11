"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, Save, Brain, Loader2, CheckCircle,
  Pencil, ArrowRight, Circle, Undo2, Trash2, BookOpen,
  X, ImageDown, FileText, Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import jsPDF from "jspdf";
import type { SquadMember } from "@/types";

type DrawTool = "none" | "freehand" | "arrow" | "circle";
type Annotation =
  | { id: string; type: "freehand"; points: number[][] }
  | { id: string; type: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { id: string; type: "circle"; cx: number; cy: number; r: number };

type SavedBoard = {
  id: string;
  name: string;
  formation: string;
  lineup: Record<string, string>;
  notes: string;
  annotations: Annotation[];
  savedAt: string;
};

const DRAW_COLOR = "#f0b429";
const LS_KEY = "gs_tactics_boards";

const FORMATIONS: Record<string, { label: string; positions: { id: string; role: string; x: number; y: number }[] }> = {
  "4-3-3": {
    label: "4-3-3",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rm",  role: "RM",  x: 75, y: 52 },
      { id: "cm",  role: "CM",  x: 50, y: 50 },
      { id: "lm",  role: "LM",  x: 25, y: 52 },
      { id: "rw",  role: "RW",  x: 78, y: 24 },
      { id: "st",  role: "ST",  x: 50, y: 18 },
      { id: "lw",  role: "LW",  x: 22, y: 24 },
    ],
  },
  "4-4-2": {
    label: "4-4-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rm",  role: "RM",  x: 82, y: 50 },
      { id: "rcm", role: "RCM", x: 60, y: 50 },
      { id: "lcm", role: "LCM", x: 40, y: 50 },
      { id: "lm",  role: "LM",  x: 18, y: 50 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
  "4-2-3-1": {
    label: "4-2-3-1",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rb",  role: "RB",  x: 82, y: 72 },
      { id: "rcb", role: "RCB", x: 62, y: 75 },
      { id: "lcb", role: "LCB", x: 38, y: 75 },
      { id: "lb",  role: "LB",  x: 18, y: 72 },
      { id: "rdm", role: "RDM", x: 62, y: 58 },
      { id: "ldm", role: "LDM", x: 38, y: 58 },
      { id: "ram", role: "RAM", x: 75, y: 38 },
      { id: "cam", role: "CAM", x: 50, y: 35 },
      { id: "lam", role: "LAM", x: 25, y: 38 },
      { id: "st",  role: "ST",  x: 50, y: 16 },
    ],
  },
  "3-5-2": {
    label: "3-5-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rcb", role: "RCB", x: 70, y: 75 },
      { id: "cb",  role: "CB",  x: 50, y: 78 },
      { id: "lcb", role: "LCB", x: 30, y: 75 },
      { id: "rwb", role: "RWB", x: 85, y: 55 },
      { id: "rm",  role: "RM",  x: 67, y: 50 },
      { id: "cm",  role: "CM",  x: 50, y: 48 },
      { id: "lm",  role: "LM",  x: 33, y: 50 },
      { id: "lwb", role: "LWB", x: 15, y: 55 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
  "5-3-2": {
    label: "5-3-2",
    positions: [
      { id: "gk",  role: "GK",  x: 50, y: 90 },
      { id: "rwb", role: "RWB", x: 88, y: 68 },
      { id: "rcb", role: "RCB", x: 72, y: 76 },
      { id: "cb",  role: "CB",  x: 50, y: 80 },
      { id: "lcb", role: "LCB", x: 28, y: 76 },
      { id: "lwb", role: "LWB", x: 12, y: 68 },
      { id: "rm",  role: "RM",  x: 68, y: 50 },
      { id: "cm",  role: "CM",  x: 50, y: 48 },
      { id: "lm",  role: "LM",  x: 32, y: 50 },
      { id: "rs",  role: "RS",  x: 65, y: 20 },
      { id: "ls",  role: "LS",  x: 35, y: 20 },
    ],
  },
};

const mirrorPos = (p: { id: string; role: string; x: number; y: number }) => ({
  ...p,
  x: 100 - p.x,
  y: 140 - p.y,
});

export default function TacticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [formation, setFormation] = useState("4-3-3");
  const [lineup, setLineup] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Drawing tool state
  const [activeTool, setActiveTool] = useState<DrawTool>("none");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [drawing, setDrawing] = useState<Annotation | null>(null);

  // Save/load state
  const [tacticsName, setTacticsName] = useState("");
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Mobile tap-select state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Opposition state
  const [showOpposition, setShowOpposition] = useState(false);
  const [oppFormation, setOppFormation] = useState("4-4-2");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSavedBoards(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const getSVGPoint = (e: React.PointerEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 140,
    };
  };

  const onOverlayPointerDown = (e: React.PointerEvent<SVGRectElement>) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const { x, y } = getSVGPoint(e);
    const id = Math.random().toString(36).slice(2);
    if (activeTool === "freehand") setDrawing({ id, type: "freehand", points: [[x, y]] });
    else if (activeTool === "arrow") setDrawing({ id, type: "arrow", x1: x, y1: y, x2: x, y2: y });
    else if (activeTool === "circle") setDrawing({ id, type: "circle", cx: x, cy: y, r: 0 });
  };

  const onOverlayPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = getSVGPoint(e);
    if (drawing.type === "freehand") setDrawing({ ...drawing, points: [...drawing.points, [x, y]] });
    else if (drawing.type === "arrow") setDrawing({ ...drawing, x2: x, y2: y });
    else if (drawing.type === "circle") {
      const r = Math.sqrt((x - drawing.cx) ** 2 + (y - drawing.cy) ** 2);
      setDrawing({ ...drawing, r });
    }
  };

  const onOverlayPointerUp = () => {
    if (!drawing) return;
    const valid =
      (drawing.type === "freehand" && drawing.points.length > 2) ||
      (drawing.type === "arrow" && Math.hypot(drawing.x2 - drawing.x1, drawing.y2 - drawing.y1) > 3) ||
      (drawing.type === "circle" && drawing.r > 1.5);
    if (valid) setAnnotations(prev => [...prev, drawing]);
    setDrawing(null);
  };

  const pointsToPath = (points: number[][]): string =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  useEffect(() => {
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, [user, router]);

  const positions = FORMATIONS[formation].positions;
  const oppPositions = FORMATIONS[oppFormation].positions.map(mirrorPos);

  const assign = (posId: string, memberId: string) => {
    setLineup((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (next[k] === memberId) delete next[k]; });
      if (memberId) next[posId] = memberId;
      else delete next[posId];
      return next;
    });
  };

  const getMember = (memberId: string) => squad.find((s) => s.id === memberId);
  const getMemberName = useCallback((memberId: string) => {
    const m = squad.find((s) => s.id === memberId);
    return m ? `#${m.shirt_no} ${m.player?.name?.split(" ")[0] ?? "—"}` : "";
  }, [squad]);

  const assignedIds = new Set(Object.values(lineup));

  const onDragStart = (e: React.DragEvent, memberId: string) => {
    e.dataTransfer.setData("memberId", memberId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropPosition = (e: React.DragEvent, posId: string) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData("memberId");
    if (memberId) assign(posId, memberId);
    setDragOver(null);
  };

  const onDragOverPosition = (e: React.DragEvent, posId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(posId);
  };

  const onPositionClick = (posId: string, isAssigned: boolean) => {
    if (selectedMemberId && !isAssigned) {
      assign(posId, selectedMemberId);
      setSelectedMemberId(null);
    } else if (isAssigned) {
      assign(posId, "");
    }
  };

  const saveTactics = () => {
    const name = tacticsName.trim() || `${formation} — ${new Date().toLocaleDateString()}`;
    const board: SavedBoard = {
      id: Math.random().toString(36).slice(2),
      name,
      formation,
      lineup,
      notes,
      annotations,
      savedAt: new Date().toISOString(),
    };
    const updated = [board, ...savedBoards].slice(0, 20);
    setSavedBoards(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setSaved(true);
    api.post("/coach/tactics/save", { formation, lineup, notes }).catch(() => {});
    setTimeout(() => setSaved(false), 2000);
  };

  const loadBoard = (board: SavedBoard) => {
    setFormation(board.formation);
    setLineup(board.lineup);
    setNotes(board.notes);
    setAnnotations(board.annotations);
    setTacticsName(board.name);
    setShowSaved(false);
  };

  const deleteBoard = (id: string) => {
    const updated = savedBoards.filter(b => b.id !== id);
    setSavedBoards(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  const exportPNG = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = 600 * scale;
      canvas.height = 840 * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#2d6a2d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `tactics-${formation}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [formation]);

  const exportPDF = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 840;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#2d6a2d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      doc.setFillColor(26, 92, 42);
      doc.rect(0, 0, pageW, 18, "F");
      doc.setTextColor(240, 180, 41);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("GrassRoots Sports — Tactics Board", pageW / 2, 12, { align: "center" });

      const displayName = tacticsName.trim() || `${formation} — ${new Date().toLocaleDateString()}`;
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(displayName, 14, 25);
      doc.text(`Formation: ${formation}`, pageW - 14, 25, { align: "right" });

      const pitchW = 75;
      const pitchH = pitchW * (840 / 600);
      const pitchX = (pageW - pitchW) / 2;
      doc.addImage(canvas.toDataURL("image/png"), "PNG", pitchX, 30, pitchW, pitchH);

      let cursorY = 32 + pitchH;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text("Lineup", 14, cursorY);
      cursorY += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const lineupText = positions
        .map(p => `${p.role}: ${getMemberName(lineup[p.id]) || "—"}`)
        .join("   ");
      const lineupLines = doc.splitTextToSize(lineupText, pageW - 28);
      doc.text(lineupLines, 14, cursorY);
      cursorY += lineupLines.length * 4 + 4;

      if (notes.trim()) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(26, 92, 42);
        doc.text("Tactical Notes", 14, cursorY);
        cursorY += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const noteLines = doc.splitTextToSize(notes, pageW - 28);
        doc.text(noteLines, 14, cursorY);
      }

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("GrassRoots Sports — grassrootssports.live — CONFIDENTIAL", pageW / 2, pageH - 8, { align: "center" });

      doc.save(`tactics-${formation}-${Date.now()}.pdf`);
    };
    img.src = url;
  }, [formation, lineup, notes, positions, getMemberName, tacticsName]);

  const getAiAdvice = async () => {
    setLoadingAi(true);
    setAiAdvice("");
    const lineupSummary = positions
      .map((p) => `${p.role}: ${getMemberName(lineup[p.id]) || "unassigned"}`)
      .join(", ");
    try {
      const reply = await queryAI(
        `Tactics analysis. Formation: ${formation}. Lineup: ${lineupSummary}. Notes: ${notes || "none"}. Give: 1) Assessment of this formation, 2) Key tactical instructions for 2-3 positions, 3) One set-piece recommendation.`,
        "coach"
      );
      setAiAdvice(reply);
    } catch { setAiAdvice("Unable to generate advice. Please try again."); }
    finally { setLoadingAi(false); }
  };

  // suppress unused warning — getMember used via getMemberName closure
  void getMember;

  const availableSquad = squad.filter((m) => m.status !== "injured");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Tactics Board</h1>
            <p className="text-sm text-muted-foreground">Drag or tap players onto the pitch · Draw runs and zones</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">

          {/* Pitch + controls */}
          <div className="lg:col-span-3 space-y-4">

            {/* Formation selector — home */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {Object.keys(FORMATIONS).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFormation(f); setLineup({}); }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      formation === f ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={() => setShowOpposition(v => !v)}
                  className={`ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    showOpposition ? "bg-red-600 text-white" : "border bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Opposition
                </button>
              </div>

              {/* Opposition formation selector */}
              {showOpposition && (
                <div className="flex flex-wrap gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-2">
                  <span className="self-center text-xs font-semibold text-red-400 mr-1">OPP:</span>
                  {Object.keys(FORMATIONS).map((f) => (
                    <button
                      key={f}
                      onClick={() => setOppFormation(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        oppFormation === f
                          ? "bg-red-600 text-white"
                          : "border border-red-500/30 hover:bg-red-500/10 text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drawing toolbar */}
            <div className="flex items-center gap-1 rounded-xl border bg-card p-2">
              <span className="mr-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Draw</span>
              {([
                { tool: "freehand" as DrawTool, icon: <Pencil className="h-4 w-4" />, label: "Freehand" },
                { tool: "arrow"    as DrawTool, icon: <ArrowRight className="h-4 w-4" />, label: "Arrow" },
                { tool: "circle"   as DrawTool, icon: <Circle className="h-4 w-4" />, label: "Circle" },
              ]).map(({ tool, icon, label }) => (
                <button
                  key={tool}
                  title={label}
                  onClick={() => setActiveTool(t => t === tool ? "none" : tool)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTool === tool
                      ? "bg-[#f0b429] text-black"
                      : "border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <button
                  title="Undo last annotation"
                  onClick={() => setAnnotations(prev => prev.slice(0, -1))}
                  disabled={annotations.length === 0}
                  className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1.5"
                >
                  <Undo2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
                <button
                  title="Clear all annotations"
                  onClick={() => setAnnotations([])}
                  disabled={annotations.length === 0}
                  className="rounded-lg border px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Football pitch SVG */}
            <div
              className="relative overflow-hidden rounded-xl border bg-green-900"
              style={{ paddingBottom: "140%" }}
            >
              <div className="absolute inset-0">
                <svg
                  ref={svgRef}
                  viewBox="0 0 100 140"
                  className="h-full w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
                      <polygon points="0 0, 6 2, 0 4" fill={DRAW_COLOR} />
                    </marker>
                  </defs>

                  {/* Grass */}
                  <rect width="100" height="140" fill="#2d6a2d" />
                  {/* Pitch markings */}
                  <rect x="5" y="5" width="90" height="130" fill="none" stroke="#4a9a4a" strokeWidth="0.8" />
                  <line x1="5" y1="70" x2="95" y2="70" stroke="#4a9a4a" strokeWidth="0.6" />
                  <circle cx="50" cy="70" r="12" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <circle cx="50" cy="70" r="0.8" fill="#4a9a4a" />
                  <rect x="24" y="5"   width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="24" y="115" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="36" y="5"   width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="36" y="125" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="42" y="2"   width="16" height="4"  fill="none" stroke="#fff" strokeWidth="0.8" />
                  <rect x="42" y="134" width="16" height="4"  fill="none" stroke="#fff" strokeWidth="0.8" />
                  <circle cx="50" cy="22"  r="0.8" fill="#4a9a4a" />
                  <circle cx="50" cy="118" r="0.8" fill="#4a9a4a" />

                  {/* Opposition positions (red) */}
                  {showOpposition && oppPositions.map((pos) => (
                    <g key={`opp-${pos.id}`}>
                      <circle cx={pos.x} cy={pos.y} r="5.5" fill="rgba(239,68,68,0.75)" stroke="#dc2626" strokeWidth="0.8" />
                      <text
                        x={pos.x} y={pos.y + 0.8}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="white" fontSize="3.2" fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {pos.role}
                      </text>
                    </g>
                  ))}

                  {/* Home player positions */}
                  {positions.map((pos) => {
                    const memberId = lineup[pos.id];
                    const memberName = memberId ? getMemberName(memberId) : null;
                    const isAssigned = !!memberId;
                    const isOver = dragOver === pos.id;
                    const canDrop = selectedMemberId && !isAssigned;
                    return (
                      <g
                        key={pos.id}
                        onDragOver={(e) => onDragOverPosition(e, pos.id)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => onDropPosition(e, pos.id)}
                        onClick={() => onPositionClick(pos.id, isAssigned)}
                        style={{ cursor: canDrop || isAssigned ? "pointer" : "default" }}
                      >
                        <circle cx={pos.x} cy={pos.y} r="9" fill="transparent" />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="5.5"
                          fill={
                            isOver    ? "#facc15"
                            : canDrop  ? "rgba(240,180,41,0.4)"
                            : isAssigned ? "#22c55e"
                            : "rgba(255,255,255,0.2)"
                          }
                          stroke={
                            isOver    ? "#ca8a04"
                            : isAssigned ? "#16a34a"
                            : canDrop  ? "#f0b429"
                            : "rgba(255,255,255,0.5)"
                          }
                          strokeWidth="0.8"
                        />
                        <text
                          x={pos.x} y={pos.y + 0.8}
                          textAnchor="middle" dominantBaseline="middle"
                          fill="white" fontSize="3.2" fontWeight="bold"
                          style={{ pointerEvents: "none" }}
                        >
                          {pos.role}
                        </text>
                        {memberName && (
                          <text
                            x={pos.x} y={pos.y + 7.5}
                            textAnchor="middle" fill="white" fontSize="2.8"
                            style={{ pointerEvents: "none" }}
                          >
                            {memberName.split(" ")[1] ?? memberName}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Saved annotations */}
                  {annotations.map(ann => (
                    ann.type === "freehand" ? (
                      <path key={ann.id} d={pointsToPath(ann.points)} fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }} />
                    ) : ann.type === "arrow" ? (
                      <line key={ann.id} x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2} stroke={DRAW_COLOR} strokeWidth="1.4" strokeLinecap="round" markerEnd="url(#arrowhead)" style={{ pointerEvents: "none" }} />
                    ) : (
                      <circle key={ann.id} cx={ann.cx} cy={ann.cy} r={ann.r} fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" strokeDasharray="2 1.5" style={{ pointerEvents: "none" }} />
                    )
                  ))}

                  {/* In-progress drawing */}
                  {drawing && (
                    drawing.type === "freehand" ? (
                      <path d={pointsToPath(drawing.points)} fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }} opacity="0.8" />
                    ) : drawing.type === "arrow" ? (
                      <line x1={drawing.x1} y1={drawing.y1} x2={drawing.x2} y2={drawing.y2} stroke={DRAW_COLOR} strokeWidth="1.4" strokeLinecap="round" markerEnd="url(#arrowhead)" style={{ pointerEvents: "none" }} opacity="0.8" />
                    ) : (
                      <circle cx={drawing.cx} cy={drawing.cy} r={drawing.r} fill="none" stroke={DRAW_COLOR} strokeWidth="1.2" strokeDasharray="2 1.5" style={{ pointerEvents: "none" }} opacity="0.8" />
                    )
                  )}

                  {activeTool !== "none" && (
                    <rect
                      x="0" y="0" width="100" height="140"
                      fill="transparent"
                      style={{ cursor: "crosshair" }}
                      onPointerDown={onOverlayPointerDown}
                      onPointerMove={onOverlayPointerMove}
                      onPointerUp={onOverlayPointerUp}
                    />
                  )}
                </svg>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Desktop: drag players onto circles · Mobile: tap a player then tap a position · Click filled circle to remove
            </p>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={saveTactics}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved!" : "Save"}
              </button>
              <button
                onClick={() => setLineup({})}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
              <button
                onClick={getAiAdvice}
                disabled={loadingAi}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                AI advice
              </button>
              <button
                onClick={exportPNG}
                className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <ImageDown className="h-4 w-4" /> PNG
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#f0b429]/90 transition-colors"
              >
                <FileText className="h-4 w-4" /> PDF
              </button>
            </div>

            {/* AI advice */}
            {aiAdvice && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <h3 className="font-semibold text-purple-700">AI Tactics Advice</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiAdvice}</p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Squad list */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold">Squad — drag or tap</h2>
              {selectedMemberId && (
                <div className="mb-2 rounded-lg bg-[#f0b429]/20 border border-[#f0b429]/40 px-3 py-1.5 text-xs font-medium text-[#f0b429]">
                  Player selected — tap a position on the pitch
                </div>
              )}
              <p className="mb-3 text-xs text-muted-foreground">{assignedIds.size} of {availableSquad.length} placed</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {availableSquad.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No squad members loaded.</p>
                ) : (
                  availableSquad.map((m) => {
                    const isPlaced = assignedIds.has(m.id);
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <div
                        key={m.id}
                        draggable={!isPlaced}
                        onDragStart={(e) => onDragStart(e, m.id)}
                        onClick={() => {
                          if (isPlaced) return;
                          setSelectedMemberId(prev => prev === m.id ? null : m.id);
                        }}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isPlaced
                            ? "bg-green-500/10 text-green-700 cursor-default opacity-60"
                            : isSelected
                            ? "bg-[#f0b429]/20 border border-[#f0b429]/50 cursor-pointer"
                            : "border bg-background hover:bg-muted cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold flex-shrink-0">
                          {m.shirt_no}
                        </span>
                        <span className="flex-1 truncate font-medium">{m.player?.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground capitalize">{m.position}</span>
                        {isPlaced && <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                        {isSelected && <span className="text-[#f0b429] text-xs font-bold">✓</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tactical notes + board name */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h2 className="font-semibold">Tactical notes</h2>
              <input
                value={tacticsName}
                onChange={(e) => setTacticsName(e.target.value)}
                placeholder={`Name this board (e.g. "vs Dynamos — High Press")`}
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="e.g. High press from kick-off. Right winger to track back. Watch their #10…"
                className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {/* Saved boards */}
            <div className="rounded-xl border bg-card p-5">
              <button
                onClick={() => setShowSaved(v => !v)}
                className="flex w-full items-center justify-between"
              >
                <h2 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  Saved Boards
                  {savedBoards.length > 0 && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      {savedBoards.length}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-muted-foreground">{showSaved ? "Hide" : "Show"}</span>
              </button>

              {showSaved && (
                <div className="mt-3 space-y-2">
                  {savedBoards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No saved boards yet. Give this board a name and click Save.</p>
                  ) : (
                    savedBoards.map((board) => (
                      <div key={board.id} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{board.name}</p>
                          <p className="text-xs text-muted-foreground">{board.formation} · {new Date(board.savedAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          onClick={() => loadBoard(board)}
                          className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteBoard(board.id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Bench / unavailable */}
            {squad.filter((m) => m.status === "injured").length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Unavailable (Injured)</h2>
                <div className="space-y-1.5">
                  {squad.filter((m) => m.status === "injured").map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{m.shirt_no}</span>
                      <span>{m.player?.name?.split(" ")[0] ?? "—"}</span>
                      <span className="ml-auto rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700">Injured</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
