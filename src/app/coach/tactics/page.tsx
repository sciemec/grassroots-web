"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Save, Brain, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
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
  const [lineup, setLineup] = useState<Record<string, string>>({}); // positionId → squadMemberId
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, [user, router]);

  const positions = FORMATIONS[formation].positions;

  const assign = (posId: string, memberId: string) => {
    setLineup((prev) => {
      const next = { ...prev };
      // Remove any existing assignment for this member
      Object.keys(next).forEach((k) => { if (next[k] === memberId) delete next[k]; });
      if (memberId) next[posId] = memberId;
      else delete next[posId];
      return next;
    });
  };

  const getMemberName = (memberId: string) => {
    const m = squad.find((s) => s.id === memberId);
    return m ? `#${m.shirt_no} ${m.player?.name?.split(" ")[0] ?? "—"}` : "";
  };

  const assignedIds = new Set(Object.values(lineup));

  const saveLineup = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAiAdvice = async () => {
    setLoadingAi(true);
    setAiAdvice("");
    const lineupSummary = positions
      .map((p) => `${p.role}: ${getMemberName(lineup[p.id]) || "unassigned"}`)
      .join(", ");
    try {
      const res = await api.post("/ai-coach/query", {
        message: `Tactics analysis request. Formation: ${formation}. Lineup: ${lineupSummary}. Coach notes: ${notes || "none"}. Provide: 1) Assessment of this formation vs common opposition, 2) Key tactical instructions for 2-3 positions, 3) One set-piece recommendation.`,
      });
      setAiAdvice(res.data?.response ?? "");
    } catch { setAiAdvice("Unable to generate advice. Please try again."); }
    finally { setLoadingAi(false); }
  };

  if (!user) return null;

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
            <p className="text-sm text-muted-foreground">Set your formation and assign players</p>
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

            {/* Football pitch SVG */}
            <div className="relative overflow-hidden rounded-xl border bg-green-900" style={{ paddingBottom: "140%" }}>
              <div className="absolute inset-0">
                {/* Pitch markings */}
                <svg viewBox="0 0 100 140" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
                  {/* Grass */}
                  <rect width="100" height="140" fill="#2d6a2d" />
                  {/* Pitch outline */}
                  <rect x="5" y="5" width="90" height="130" fill="none" stroke="#4a9a4a" strokeWidth="0.8" />
                  {/* Centre line */}
                  <line x1="5" y1="70" x2="95" y2="70" stroke="#4a9a4a" strokeWidth="0.6" />
                  {/* Centre circle */}
                  <circle cx="50" cy="70" r="12" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <circle cx="50" cy="70" r="0.8" fill="#4a9a4a" />
                  {/* Penalty areas */}
                  <rect x="24" y="5" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="24" y="115" width="52" height="20" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  {/* Goal areas */}
                  <rect x="36" y="5" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  <rect x="36" y="125" width="28" height="10" fill="none" stroke="#4a9a4a" strokeWidth="0.6" />
                  {/* Goals */}
                  <rect x="42" y="2" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
                  <rect x="42" y="134" width="16" height="4" fill="none" stroke="#fff" strokeWidth="0.8" />
                  {/* Penalty spots */}
                  <circle cx="50" cy="22" r="0.8" fill="#4a9a4a" />
                  <circle cx="50" cy="118" r="0.8" fill="#4a9a4a" />

                  {/* Player positions */}
                  {positions.map((pos) => {
                    const memberId = lineup[pos.id];
                    const memberName = memberId ? getMemberName(memberId) : null;
                    const isAssigned = !!memberId;
                    return (
                      <g key={pos.id}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="5.5"
                          fill={isAssigned ? "#22c55e" : "rgba(255,255,255,0.2)"}
                          stroke={isAssigned ? "#16a34a" : "rgba(255,255,255,0.5)"}
                          strokeWidth="0.8"
                        />
                        <text x={pos.x} y={pos.y + 0.8} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.2" fontWeight="bold">
                          {pos.role}
                        </text>
                        {memberName && (
                          <text x={pos.x} y={pos.y + 7.5} textAnchor="middle" fill="white" fontSize="2.8">
                            {memberName.split(" ")[1] ?? memberName}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={saveLineup}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-4 w-4" />
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

          {/* Right panel: assign players + notes */}
          <div className="lg:col-span-2 space-y-4">

            {/* Assign players */}
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-4 font-semibold">Assign players</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {positions.map((pos) => (
                  <div key={pos.id} className="flex items-center gap-2">
                    <span className="w-10 flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-center text-xs font-bold">
                      {pos.role}
                    </span>
                    <select
                      value={lineup[pos.id] ?? ""}
                      onChange={(e) => assign(pos.id, e.target.value)}
                      className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">— Unassigned —</option>
                      {squad
                        .filter((m) => m.status !== "injured" && (!assignedIds.has(m.id) || lineup[pos.id] === m.id))
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            #{m.shirt_no} {m.player?.name ?? "—"}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Match notes */}
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
            {squad.filter((m) => !assignedIds.has(m.id)).length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Not in lineup</h2>
                <div className="space-y-1.5">
                  {squad.filter((m) => !assignedIds.has(m.id)).map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">{m.shirt_no}</span>
                      <span>{m.player?.name?.split(" ")[0] ?? "—"}</span>
                      <span className="text-xs capitalize">· {m.position}</span>
                      {m.status !== "fit" && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium capitalize ${m.status === "injured" ? "bg-red-500/15 text-red-700" : "bg-amber-500/15 text-amber-700"}`}>
                          {m.status}
                        </span>
                      )}
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
