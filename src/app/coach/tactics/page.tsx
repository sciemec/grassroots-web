"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Save, Brain, Loader2, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import type { SquadMember } from "@/types";

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

  useEffect(() => {
    // guests allowed — no login redirect
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, [user, router]);

  const positions = FORMATIONS[formation].positions;

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
  const getMemberName = (memberId: string) => {
    const m = getMember(memberId);
    return m ? `#${m.shirt_no} ${m.player?.name?.split(" ")[0] ?? "—"}` : "";
  };

  const assignedIds = new Set(Object.values(lineup));

  // Drag handlers
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

  const saveLineup = () => {
    setSaved(true);
    api.post("/coach/tactics/save", { formation, lineup, notes }).catch(() => {});
    setTimeout(() => setSaved(false), 2000);
  };

  const getAiAdvice = async () => {
    setLoadingAi(true);
    setAiAdvice("");
    const lineupSummary = positions
      .map((p) => `${p.role}: ${getMemberName(lineup[p.id]) || "unassigned"}`)
      .join(", ");
    try {
      const reply = await queryAI(`Tactics analysis. Formation: ${formation}. Lineup: ${lineupSummary}. Notes: ${notes || "none"}. Give: 1) Assessment of this formation, 2) Key tactical instructions for 2-3 positions, 3) One set-piece recommendation.`, "coach");
      setAiAdvice(reply);
    } catch { setAiAdvice("Unable to generate advice. Please try again."); }
    finally { setLoadingAi(false); }
  };


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
            <p className="text-sm text-muted-foreground">Drag players from the squad list onto the pitch</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">

          {/* Pitch + controls */}
          <div className="lg:col-span-3 space-y-4">

            {/* Formation selector */}
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
            </div>

            {/* Football pitch SVG — drop targets */}
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
                  {/* Grass */}
                  <rect width="100" height="140" fill="#2d6a2d" />
                  {/* Pitch markings */}
                  <rect x="5" y="5" width="90" height="130" fill="none" stroke="#4a9a4a" strokeWidth="0.8" />
                  <line x1="5" y1="70" x2="95" y2="70" stroke="#4a9a4a" strokeWidth="0.6" />
                  <circle cx="50" cy="70" r="12" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <circle cx="50" cy="70" r="0.8" fill="#4a9a4a" />
                  <rect x="24" y="5" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="24" y="115" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="36" y="5" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="36" y="125" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="42" y="2" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
                  <rect x="42" y="134" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
                  <circle cx="50" cy="22" r="0.8" fill="#4a9a4a" />
                  <circle cx="50" cy="118" r="0.8" fill="#4a9a4a" />

                  {/* Player positions — drag targets */}
                  {positions.map((pos) => {
                    const memberId = lineup[pos.id];
                    const memberName = memberId ? getMemberName(memberId) : null;
                    const isAssigned = !!memberId;
                    const isOver = dragOver === pos.id;
                    return (
                      <g
                        key={pos.id}
                        onDragOver={(e) => onDragOverPosition(e, pos.id)}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => onDropPosition(e, pos.id)}
                        onClick={() => { if (isAssigned) assign(pos.id, ""); }}
                        style={{ cursor: isAssigned ? "pointer" : "default" }}
                      >
                        {/* Larger invisible hit area for easy drop */}
                        <circle cx={pos.x} cy={pos.y} r="9" fill="transparent" />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="5.5"
                          fill={isOver ? "#facc15" : isAssigned ? "#22c55e" : "rgba(255,255,255,0.2)"}
                          stroke={isOver ? "#ca8a04" : isAssigned ? "#16a34a" : "rgba(255,255,255,0.5)"}
                          strokeWidth="0.8"
                        />
                        <text x={pos.x} y={pos.y + 0.8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.2" fontWeight="bold" style={{ pointerEvents: "none" }}>
                          {pos.role}
                        </text>
                        {memberName && (
                          <text x={pos.x} y={pos.y + 7.5} textAnchor="middle" fill="white" fontSize="2.8" style={{ pointerEvents: "none" }}>
                            {memberName.split(" ")[1] ?? memberName}
                          </text>
                        )}
                        {isAssigned && (
                          <title>Click to remove {memberName}</title>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Drag hint */}
            <p className="text-xs text-muted-foreground text-center">
              Drag players from the squad onto position circles · Click a filled circle to remove
            </p>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={saveLineup}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved!" : "Save lineup"}
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

            {/* Draggable squad list */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold">Squad — drag onto pitch</h2>
              <p className="mb-3 text-xs text-muted-foreground">{assignedIds.size} of {availableSquad.length} placed</p>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {availableSquad.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No squad members loaded.</p>
                ) : (
                  availableSquad.map((m) => {
                    const isPlaced = assignedIds.has(m.id);
                    return (
                      <div
                        key={m.id}
                        draggable={!isPlaced}
                        onDragStart={(e) => onDragStart(e, m.id)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isPlaced
                            ? "bg-green-500/10 text-green-700 cursor-default opacity-60"
                            : "border bg-background hover:bg-muted cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold flex-shrink-0">
                          {m.shirt_no}
                        </span>
                        <span className="flex-1 truncate font-medium">{m.player?.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground capitalize">{m.position}</span>
                        {isPlaced && <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tactical notes */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold">Tactical notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="e.g. High press from kick-off. Right winger to track back. Watch their #10…"
                className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
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
