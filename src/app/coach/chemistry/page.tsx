"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Download, Sparkles, CheckCircle2, Circle,
  Target, History, TrendingUp, Info, ChevronDown, ChevronUp,
  FlaskConical, Dna, User, Users as UsersIcon, Search,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import ChemistryMatrix, { type PairScore, type SquadPlayer } from "@/components/chemistry/ChemistryMatrix";
import { safeArray } from "@/lib/safe-array";
import api from "@/lib/api";
import jsPDF from "jspdf";

// ── Types ──────────────────────────────────────────────────────────────────

type PositionFilter = "all" | "forward" | "midfielder" | "defender" | "goalkeeper";
type Tab = "matrix" | "fingerprint" | "lineup" | "targets" | "history";

interface ChemSnapshot {
  date:       string;
  avg:        number;
  high_count: number;
  squad_size: number;
}

interface PlayerFingerprint {
  player_id:   string;
  player_name: string;
  dimensions:  { dimension: string; label: string; value: number }[];
  computed_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const POSITION_GROUPS: Record<string, string[]> = {
  forward:    ["striker","centre_forward","left_winger","right_winger","second_striker","forward"],
  midfielder: ["central_midfielder","defensive_midfielder","attacking_midfielder","left_midfielder","right_midfielder","midfielder"],
  defender:   ["centre_back","left_back","right_back","sweeper","defender"],
  goalkeeper: ["goalkeeper"],
};

const ARCHETYPE_TRAITS: Record<string, { label: string; positions: string[]; desc: string }> = {
  pace:        { label: "Pace & Acceleration",  positions: ["Winger","Striker","Full Back"],               desc: "Fast players who stretch the defence and create space in behind." },
  pressing:    { label: "High Pressing",         positions: ["Striker","Winger","Central Midfielder"],      desc: "Energy-intensive presser to lead your defensive block from the front." },
  passing:     { label: "Technical Passer",      positions: ["Central Midfielder","Defensive Midfielder"],  desc: "Ball-playing midfielder who keeps possession under pressure." },
  physicality: { label: "Physical Presence",     positions: ["Centre Back","Defensive Midfielder","Striker"], desc: "Aerial duels, strength in the challenge, holds up play." },
  vision:      { label: "Vision & Creativity",   positions: ["Attacking Midfielder","Central Midfielder"],  desc: "Creates chances with key passes and through balls." },
  defending:   { label: "Defensive Solidity",    positions: ["Centre Back","Defensive Midfielder"],         desc: "Reduces defensive chemistry gaps with disciplined positional play." },
  goalscoring: { label: "Clinical Finishing",    positions: ["Striker","Second Striker"],                   desc: "Converts half-chances — addresses low scoring chemistry in your forward line." },
  "work rate": { label: "Work Rate & Stamina",   positions: ["Central Midfielder","Winger"],                desc: "High-energy players who cover ground and support both phases." },
};

const HISTORY_KEY = "gs_chemistry_history";

// ── Pure helpers ───────────────────────────────────────────────────────────

function getGroup(position: string): string {
  const p = (position ?? "").toLowerCase().trim();
  for (const [group, list] of Object.entries(POSITION_GROUPS)) {
    if (list.includes(p)) return group;
  }
  return "other";
}

function dimLabel(d: string | { dimension: string; label?: string }): string {
  if (typeof d === "string") return d;
  return d.label ?? d.dimension;
}

function buildScoreMap(pairs: PairScore[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of pairs) {
    map.set(`${p.player_a_id}|${p.player_b_id}`, p.chemistry_score);
    map.set(`${p.player_b_id}|${p.player_a_id}`, p.chemistry_score);
  }
  return map;
}

function totalChemistry(selected: string[], scoreMap: Map<string, number>): number {
  let total = 0;
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      total += scoreMap.get(`${selected[i]}|${selected[j]}`) ?? 0;
    }
  }
  return total;
}

/** Greedy O(N²) best-chemistry XI selector */
function greedyLineup(players: SquadPlayer[], scoreMap: Map<string, number>, size = 11): string[] {
  if (players.length <= size) return players.map((p) => p.id);

  // Seed with highest-scoring pair
  let best: [string, string] = [players[0].id, players[1]?.id ?? players[0].id];
  let bestScore = -1;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const s = scoreMap.get(`${players[i].id}|${players[j].id}`) ?? 0;
      if (s > bestScore) { bestScore = s; best = [players[i].id, players[j].id]; }
    }
  }

  const selected = [best[0], best[1]];

  while (selected.length < size) {
    const remaining = players.filter((p) => !selected.includes(p.id));
    if (!remaining.length) break;
    let bestId = "";
    let bestGain = -1;
    for (const p of remaining) {
      const gain = selected.reduce((s, id) => s + (scoreMap.get(`${p.id}|${id}`) ?? 0), 0);
      if (gain > bestGain) { bestGain = gain; bestId = p.id; }
    }
    if (bestId) selected.push(bestId); else break;
  }

  return selected;
}

function getTransferTargets(pairs: PairScore[]): { dim: string; count: number; archetype: typeof ARCHETYPE_TRAITS[string] | null }[] {
  const divCounts: Record<string, number> = {};
  for (const pair of pairs) {
    for (const d of pair.diverging_dims) {
      const lbl = dimLabel(d).toLowerCase();
      divCounts[lbl] = (divCounts[lbl] ?? 0) + 1;
    }
  }
  return Object.entries(divCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([dim, count]) => ({ dim, count, archetype: ARCHETYPE_TRAITS[dim] ?? null }));
}

function loadHistory(): ChemSnapshot[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as ChemSnapshot[]; }
  catch { return []; }
}

function saveSnapshot(avg: number, highCount: number, squadSize: number) {
  const today   = new Date().toISOString().slice(0, 10);
  const history = loadHistory().filter((h) => h.date !== today);
  history.push({ date: today, avg, high_count: highCount, squad_size: squadSize });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-30)));
}

// ── Small UI components ────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-2xl font-black text-[#f0b429]">{value}</div>
      <div className="text-sm font-bold text-black mt-0.5">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CoachChemistryPage() {
  const user = useAuthStore((s) => s.user);

  const [pairs,   setPairs]   = useState<PairScore[]>([]);
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [posFilter,  setPosFilter]  = useState<PositionFilter>("all");
  const [activeTab,  setActiveTab]  = useState<Tab>("matrix");
  const [selectedXI, setSelectedXI] = useState<string[]>([]);
  const [history,    setHistory]    = useState<ChemSnapshot[]>([]);
  const [snapSaved,  setSnapSaved]  = useState(false);

  const [showScience,       setShowScience]       = useState(false);
  const [selectedFpPlayer,  setSelectedFpPlayer]  = useState<string>("");
  const [playerFingerprint, setPlayerFingerprint] = useState<PlayerFingerprint | null>(null);
  const [fpLoading,         setFpLoading]         = useState(false);

  // ── Data loading ─────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [squadRes, matrixRes] = await Promise.all([
        api.get("/coach/squad"),
        api.get(`/chemistry/squad/${user.id}`),
      ]);

      const rawSquad  = safeArray<Record<string, unknown>>(squadRes.data);
      const rawMatrix = safeArray<PairScore>(matrixRes.data);

      const mapped: SquadPlayer[] = rawSquad.map((p) => ({
        id:       String(p.user_id ?? p.id ?? ""),
        name:     `${p.first_name ?? ""} ${p.surname ?? ""}`.trim() || String(p.name ?? "Unknown"),
        position: String(p.position ?? ""),
      })).filter((p) => p.id);

      setPlayers(mapped);
      setPairs(rawMatrix);

      // Auto-snapshot once per day
      if (rawMatrix.length > 0) {
        const avg      = Math.round(rawMatrix.reduce((s, p) => s + p.chemistry_score, 0) / rawMatrix.length);
        const highCnt  = rawMatrix.filter((p) => p.chemistry_score >= 85).length;
        saveSnapshot(avg, highCnt, mapped.length);
      }
      setHistory(loadHistory());
    } catch {
      setError("Could not load chemistry data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedFpPlayer || activeTab !== "fingerprint") return;
    setFpLoading(true);
    setPlayerFingerprint(null);
    const token = localStorage.getItem("auth_token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chemistry/fingerprint/${selectedFpPlayer}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        const raw = (res.data ?? res) as Record<string, unknown>;
        // dimension_labels is a string[] of 32 key names; fingerprint_vector is float[] (0–1)
        const keys: string[]   = Array.isArray(raw.dimension_labels) ? (raw.dimension_labels as string[]) : [];
        const vector: number[] = Array.isArray(raw.fingerprint_vector) ? (raw.fingerprint_vector as number[]) : [];
        const dimensions = keys.map((key, idx) => ({
          dimension: key,
          label:     key.replace(/_/g, " "),
          value:     Math.round((vector[idx] ?? 0) * 100),
        }));
        const playerName = players.find((p) => p.id === selectedFpPlayer)?.name ?? "Player";
        setPlayerFingerprint({
          player_id:   selectedFpPlayer,
          player_name: playerName,
          dimensions,
          computed_at: (raw.generated_at as string) ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setFpLoading(false));
  }, [selectedFpPlayer, activeTab, players]);

  // ── Derived values ────────────────────────────────────────────────────────

  const avgChemistry  = pairs.length > 0
    ? Math.round(pairs.reduce((s, p) => s + p.chemistry_score, 0) / pairs.length)
    : 0;
  const highChemCount = pairs.filter((p) => p.chemistry_score >= 85).length;
  const topPairs      = [...pairs].sort((a, b) => b.chemistry_score - a.chemistry_score).slice(0, 5);

  const filteredPlayers = posFilter === "all"
    ? players
    : players.filter((p) => getGroup(p.position) === posFilter);
  const filteredIds   = new Set(filteredPlayers.map((p) => p.id));
  const filteredPairs = pairs.filter(
    (p) => filteredIds.has(p.player_a_id) && filteredIds.has(p.player_b_id)
  );

  const scoreMap = useMemo(() => buildScoreMap(pairs), [pairs]);

  const xiChemistry = useMemo(() => totalChemistry(selectedXI, scoreMap), [selectedXI, scoreMap]);
  const xiPairCount = (selectedXI.length * (selectedXI.length - 1)) / 2;
  const xiAvg       = xiPairCount > 0 ? Math.round(xiChemistry / xiPairCount) : 0;

  const clubFingerprint = useMemo(() => {
    const matchCounts: Record<string, number> = {};
    const divCounts:   Record<string, number> = {};
    for (const pair of pairs) {
      for (const d of pair.matching_dims)  { const l = dimLabel(d); matchCounts[l] = (matchCounts[l] ?? 0) + 1; }
      for (const d of pair.diverging_dims) { const l = dimLabel(d); divCounts[l]   = (divCounts[l]   ?? 0) + 1; }
    }
    return {
      strengths: Object.entries(matchCounts).sort(([, a], [, b]) => b - a).slice(0, 8),
      conflicts: Object.entries(divCounts).sort(([, a], [, b]) => b - a).slice(0, 5),
    };
  }, [pairs]);

  const transferTargets = useMemo(() => getTransferTargets(pairs), [pairs]);

  const weakestGroup = useMemo(() => {
    const groupAvg: Record<string, { sum: number; count: number }> = {};
    for (const p of players) {
      const g = getGroup(p.position);
      if (!groupAvg[g]) groupAvg[g] = { sum: 0, count: 0 };
      const pp = pairs.filter((pr) => pr.player_a_id === p.id || pr.player_b_id === p.id);
      if (pp.length) {
        groupAvg[g].sum += pp.reduce((s, pr) => s + pr.chemistry_score, 0) / pp.length;
        groupAvg[g].count++;
      }
    }
    return Object.entries(groupAvg)
      .filter(([, v]) => v.count > 0)
      .map(([g, v]) => ({ group: g, avg: Math.round(v.sum / v.count) }))
      .sort((a, b) => a.avg - b.avg)[0] ?? null;
  }, [players, pairs]);

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? id.slice(0, 8) + "…";

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOptimise = () => setSelectedXI(greedyLineup(players, scoreMap, 11));

  const togglePlayer = (id: string) =>
    setSelectedXI((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id)
        : prev.length < 11 ? [...prev, id]
        : prev
    );

  const handleManualSnapshot = () => {
    if (!pairs.length) return;
    saveSnapshot(avgChemistry, highChemCount, players.length);
    setHistory(loadHistory());
    setSnapSaved(true);
    setTimeout(() => setSnapSaved(false), 2000);
  };

  // ── PDF export ────────────────────────────────────────────────────────────

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 26, "F");
    doc.setTextColor(240, 180, 41);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Squad Chemistry Report", 14, 17);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${user?.name ?? "Coach"} · ${new Date().toLocaleDateString("en-GB")} · Formula v1`, 120, 17);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Squad Overview", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Average chemistry: ${avgChemistry}%`, 14, 46);
    doc.text(`High-chemistry pairs (85+): ${highChemCount}`, 14, 53);
    doc.text(`Total pairs calculated: ${pairs.length}`, 14, 60);
    doc.text(`Squad size: ${players.length} players`, 14, 67);

    let y = 80;
    if (clubFingerprint.strengths.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Club Style Fingerprint (Top 5)", 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      y += 8;
      clubFingerprint.strengths.slice(0, 5).forEach(([dim, count]) => {
        doc.text(`  · ${dim} (${count} pairs)`, 14, y);
        y += 7;
      });
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Top 5 Chemistry Pairs", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 8;
    topPairs.forEach((pair, i) => {
      doc.text(`${i + 1}.  ${playerName(pair.player_a_id)}  ×  ${playerName(pair.player_b_id)}`, 18, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text(`${Math.round(pair.chemistry_score)}%`, 172, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 9;
    });

    if (selectedXI.length === 11) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Suggested XI (avg chemistry: ${xiAvg}%)`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      y += 8;
      selectedXI.forEach((id, i) => {
        doc.text(`${i + 1}. ${playerName(id)}`, 18, y);
        y += 7;
      });
    }

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("GrassRoots Sports · Confidential · grassrootssports.live", 14, 285);
    doc.save(`squad-chemistry-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ── Tab config ────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: "matrix",      label: "Matrix" },
    { id: "fingerprint", label: "Club Fingerprint" },
    { id: "lineup",      label: "Lineup Builder" },
    { id: "targets",     label: "Transfer Targets" },
    { id: "history",     label: "History" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/coach" className="flex items-center gap-1.5 text-gray-500 hover:text-black text-xs mb-2 transition-colors">
              <ArrowLeft size={12} /> Coach Hub
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">Squad Chemistry</h1>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">v1</span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">Measurable · Trackable · Predictable</p>
          </div>
          <button
            onClick={exportPDF}
            disabled={pairs.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f0b429] text-[#1a3a1a] font-bold text-sm disabled:opacity-40 flex-shrink-0"
          >
            <Download size={14} /> PDF
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Squad Average"        value={`${avgChemistry}%`}     sub="overall chemistry" />
          <StatCard label="High-Chemistry Pairs" value={String(highChemCount)}  sub="scored 85% or above" />
          <StatCard label="Pairs Calculated"     value={String(pairs.length)}   sub="eligible squad pairs" />
          <StatCard label="Squad Size"           value={String(players.length)} sub="players with data" />
        </div>

        {/* How It Works — collapsible science card */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50 overflow-hidden">
          <button
            onClick={() => setShowScience((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          >
            <div className="flex items-center gap-2">
              <FlaskConical size={15} className="text-purple-600" />
              <span className="text-sm font-bold text-purple-800">How It Works — The Science</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">v1</span>
            </div>
            {showScience
              ? <ChevronUp size={14} className="text-purple-500" />
              : <ChevronDown size={14} className="text-purple-500" />}
          </button>

          {showScience && (
            <div className="px-5 pb-5 space-y-4 border-t border-purple-200">

              {/* Formula */}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical size={13} className="text-purple-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700">The Formula</span>
                </div>
                <div className="bg-white rounded-xl border border-purple-200 p-4 text-sm text-center font-mono">
                  <span className="text-gray-800 font-bold">Total Chemistry</span>
                  <span className="text-gray-400"> = </span>
                  <span className="text-[#1a5c2a] font-bold">(Style × 60%)</span>
                  <span className="text-gray-400"> + </span>
                  <span className="text-purple-600 font-bold">(Demographic × 25%)</span>
                  <span className="text-gray-400"> + </span>
                  <span className="text-blue-600 font-bold">(Geographic × 15%)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { pct: "60%", label: "Style Score", color: "#1a5c2a", desc: "Playing style, tempo, positioning, pressing, possession tendency" },
                    { pct: "25%", label: "Demographic", color: "#7c3aed", desc: "Age group, experience level, position group, physical tier" },
                    { pct: "15%", label: "Geographic",  color: "#2563eb", desc: "Province, club tier, urban/rural background, league level" },
                  ].map(({ pct, label, color, desc }) => (
                    <div key={label} className="bg-white rounded-xl border border-purple-100 p-3 text-center">
                      <div className="text-lg font-black" style={{ color }}>{pct}</div>
                      <div className="text-[10px] font-bold text-gray-700 mt-0.5">{label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 32-dim fingerprint */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Dna size={13} className="text-purple-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700">32-Dimension Fingerprint</span>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed mb-3">
                  Every player gets a 128-value vector built from drill performance across 32 dimensions.
                  When two players&apos; vectors are compared, the cosine similarity of each dimension produces the style score.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { group: "Technical",  dims: ["passing_accuracy","dribble_success","first_touch","shot_conversion"],     color: "#1a5c2a" },
                    { group: "Physical",   dims: ["sprint_speed","stamina_index","aerial_win_rate","strength_index"],         color: "#7c3aed" },
                    { group: "Tactical",   dims: ["pressing_intensity","defensive_shape","off_ball_movement","transition_speed"], color: "#2563eb" },
                    { group: "Mental",     dims: ["decision_speed","composure_score","work_rate","adaptability"],             color: "#d97706" },
                  ].map(({ group, dims, color }) => (
                    <div key={group} className="bg-white rounded-xl border border-purple-100 p-3">
                      <div className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color }}>{group}</div>
                      {dims.map((d) => (
                        <div key={d} className="text-[9px] text-gray-500 py-0.5 border-b border-gray-50 last:border-0 capitalize">
                          {d.replace(/_/g, " ")}
                        </div>
                      ))}
                      <div className="text-[8px] text-gray-300 mt-1">+ 4 more dims</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User flows */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon size={13} className="text-purple-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700">User Flows</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      role: "Coach", color: "#1a5c2a",
                      icon: <User size={12} />,
                      steps: [
                        "Open Chemistry → Matrix tab",
                        "Tap any cell to see pair breakdown",
                        "Lineup Builder → Optimise XI",
                        "Transfer Targets → scout profile gaps",
                        "History → show board the trend",
                      ],
                    },
                    {
                      role: "Player", color: "#7c3aed",
                      icon: <Dna size={12} />,
                      steps: [
                        "Complete 8+ drills across 3 sessions",
                        "Nightly job builds your fingerprint",
                        "Chemistry tab shows your scores",
                        "High-chemistry partners = best combos",
                        "Improve dimensions to lift your score",
                      ],
                    },
                    {
                      role: "Scout", color: "#2563eb",
                      icon: <Search size={12} />,
                      steps: [
                        "View club fingerprint on player page",
                        "Compare candidate vs squad style",
                        "Chemistry fit score shown on profile",
                        "Filter talent DB by style match",
                        "Download PDF with fit analysis",
                      ],
                    },
                  ].map(({ role, color, icon, steps }) => (
                    <div key={role} className="bg-white rounded-xl border border-purple-100 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span style={{ color }}>{icon}</span>
                        <span className="text-xs font-bold text-gray-800">{role}</span>
                      </div>
                      <ol className="space-y-1">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-1.5 text-[9px] text-gray-500">
                            <span className="font-bold flex-shrink-0" style={{ color }}>{i + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data requirement note */}
              <div className="flex items-start gap-2 bg-white rounded-xl border border-purple-100 p-3">
                <Info size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Data requirements:</strong> Each player needs ≥ 8 drill completions
                  across ≥ 3 separate sessions to generate a fingerprint. The nightly similarity job (02:00 Harare time)
                  then calculates all pair scores. New players appear within 24 hours of meeting the threshold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? "bg-[#1a5c2a] text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Loading / error */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 text-sm">
            Loading chemistry data…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB — MATRIX
        ════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === "matrix" && (
          <>
            <div className="flex flex-wrap gap-2">
              {(["all","forward","midfielder","defender","goalkeeper"] as PositionFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setPosFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    posFilter === f
                      ? "bg-[#1a5c2a] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "All Positions" : `${f}s`}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-gray-900 font-bold mb-1">Style Compatibility Matrix</h2>
              <p className="text-gray-500 text-xs mb-5">
                Each cell = style compatibility score. Click any cell for full breakdown.
              </p>
              <ChemistryMatrix pairs={filteredPairs} players={filteredPlayers} />
            </div>

            {topPairs.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-gray-900 font-bold mb-4">Top 5 Chemistry Pairs</h2>
                <div className="space-y-4">
                  {topPairs.map((pair, i) => (
                    <Link
                      key={`${pair.player_a_id}${pair.player_b_id}`}
                      href={`/coach/chemistry/pair/${pair.player_a_id}/${pair.player_b_id}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-gray-400 text-sm w-5 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="text-gray-900 font-bold text-sm group-hover:text-[#1a5c2a] transition-colors">
                          {playerName(pair.player_a_id)} × {playerName(pair.player_b_id)}
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, pair.chemistry_score)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[#f0b429] font-black text-sm flex-shrink-0">
                        {Math.round(pair.chemistry_score)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pairs.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  No chemistry data yet. Players need at least 8 drills across 3 sessions to generate
                  a style fingerprint. The nightly similarity job runs at 02:00 Harare time.
                </p>
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB — CLUB FINGERPRINT
        ════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === "fingerprint" && (
          <div className="space-y-4">

            {/* Individual player fingerprint */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Dna size={16} className="text-purple-600" />
                <div>
                  <h2 className="text-gray-900 font-bold leading-none">Individual Fingerprint</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Select a player to view their 32-dimension style vector</p>
                </div>
              </div>

              {/* Player dropdown */}
              <div className="relative mb-4">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedFpPlayer}
                  onChange={(e) => setSelectedFpPlayer(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none"
                >
                  <option value="">— Select a player —</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.position || "unknown"})</option>
                  ))}
                </select>
              </div>

              {/* Loading */}
              {fpLoading && (
                <div className="py-8 text-center text-gray-400 text-sm">Loading fingerprint…</div>
              )}

              {/* Fingerprint bars */}
              {!fpLoading && playerFingerprint && playerFingerprint.dimensions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">
                    {playerFingerprint.player_name} — {playerFingerprint.dimensions.length} dimensions
                    <span className="ml-2 font-normal normal-case text-gray-300">
                      · computed {new Date(playerFingerprint.computed_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  {playerFingerprint.dimensions.map(({ dimension, label, value }) => {
                    const pct = Math.min(100, Math.max(0, Math.round(value)));
                    const barColor = pct >= 80 ? "#1a5c2a" : pct >= 60 ? "#f0b429" : pct >= 40 ? "#f97316" : "#d1d5db";
                    return (
                      <div key={dimension}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-medium text-gray-700 capitalize">{label || dimension.replace(/_/g, " ")}</span>
                          <span className="font-bold" style={{ color: barColor }}>{pct}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty — player selected but no fingerprint */}
              {!fpLoading && selectedFpPlayer && !playerFingerprint && (
                <div className="py-8 text-center">
                  <Dna size={28} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400 text-sm">No fingerprint yet for this player.</p>
                  <p className="text-gray-300 text-xs mt-1">
                    They need ≥ 8 drills across ≥ 3 sessions.
                  </p>
                </div>
              )}

              {/* No selection state */}
              {!selectedFpPlayer && (
                <div className="py-6 text-center">
                  <p className="text-gray-300 text-sm">Select a player above to view their fingerprint</p>
                </div>
              )}
            </div>

            {/* Club aggregate fingerprint */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-gray-900 font-bold mb-1">Club Style Identity</h2>
              <p className="text-gray-500 text-xs mb-5">
                Traits that appear most consistently across all squad pair scores — this is how YOUR club plays.
              </p>

              {clubFingerprint.strengths.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No fingerprint yet — need chemistry pair data.</p>
              ) : (
                <div className="space-y-3">
                  {clubFingerprint.strengths.map(([dim, count], i) => {
                    const maxCount = clubFingerprint.strengths[0][1];
                    const pct = Math.round((count / maxCount) * 100);
                    const barColor =
                      i === 0 ? "#1a5c2a" : i === 1 ? "#2d8a47" : i < 4 ? "#f0b429" : "#d1d5db";
                    return (
                      <div key={dim}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-800 capitalize">{dim}</span>
                          <span className="text-gray-400">{count} pair{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {clubFingerprint.conflicts.length > 0 && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
                <h2 className="text-orange-800 font-bold mb-1">Style Conflicts</h2>
                <p className="text-orange-600 text-xs mb-4">
                  Dimensions appearing most as mismatches — where squad style is fragmented.
                </p>
                <div className="flex flex-wrap gap-2">
                  {clubFingerprint.conflicts.map(([dim, count]) => (
                    <span
                      key={dim}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-semibold capitalize"
                    >
                      {dim}
                      <span className="bg-orange-200 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {clubFingerprint.strengths.length > 0 && (
              <div className="rounded-2xl border border-green-200 bg-[#f0fdf4] p-6">
                <h2 className="text-green-800 font-bold mb-2">Your Club DNA</h2>
                <p className="text-green-700 text-sm leading-relaxed">
                  Based on {pairs.length} pair scores, your squad&apos;s strongest shared traits are{" "}
                  <strong>{clubFingerprint.strengths.slice(0, 3).map(([d]) => d).join(", ")}</strong>.
                  {clubFingerprint.conflicts.length > 0 && (
                    <> The main style tension is <strong>{clubFingerprint.conflicts[0][0]}</strong> — players approach this dimension differently, which disrupts cohesion.</>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB — LINEUP BUILDER
        ════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === "lineup" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-gray-900 font-bold">Lineup Builder</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Pick your XI manually, or let the algorithm find the highest-chemistry combination.
                  </p>
                </div>
                <button
                  onClick={handleOptimise}
                  disabled={players.length < 2}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a5c2a] text-white font-bold text-sm disabled:opacity-40"
                >
                  <Sparkles size={14} /> Optimise XI
                </button>
              </div>

              {/* XI chemistry summary bar */}
              {selectedXI.length > 1 && (
                <div className={`rounded-xl p-4 mb-4 flex items-center gap-4 ${
                  xiAvg >= 85 ? "bg-green-50 border border-green-200" :
                  xiAvg >= 70 ? "bg-blue-50 border border-blue-200" :
                  xiAvg >= 55 ? "bg-yellow-50 border border-yellow-200" :
                  "bg-gray-50 border border-gray-200"
                }`}>
                  <div className={`text-4xl font-black ${
                    xiAvg >= 85 ? "text-green-600" :
                    xiAvg >= 70 ? "text-blue-600" :
                    xiAvg >= 55 ? "text-yellow-600" : "text-gray-500"
                  }`}>{xiAvg}%</div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {selectedXI.length}/11 selected
                    </div>
                    <div className="text-gray-500 text-xs">
                      Avg chemistry across {xiPairCount} pair{xiPairCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {selectedXI.length === 11 && (
                    <span className="ml-auto text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                      Full XI
                    </span>
                  )}
                </div>
              )}

              {/* Player picker */}
              {players.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No squad players with chemistry data.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                  {players.map((p) => {
                    const inXI   = selectedXI.includes(p.id);
                    const canAdd = !inXI && selectedXI.length < 11;
                    const pPairs = pairs.filter((pr) => pr.player_a_id === p.id || pr.player_b_id === p.id);
                    const pAvg   = pPairs.length > 0
                      ? Math.round(pPairs.reduce((s, pr) => s + pr.chemistry_score, 0) / pPairs.length)
                      : null;

                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlayer(p.id)}
                        disabled={!inXI && !canAdd}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          inXI    ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                          : canAdd ? "bg-white border-gray-200 text-gray-900 hover:border-[#1a5c2a]"
                          : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${inXI ? "bg-white/20" : "bg-gray-100"}`}>
                          {inXI
                            ? <CheckCircle2 size={14} className="text-white" />
                            : <Circle      size={14} className="text-gray-400" />
                          }
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs truncate">{p.name}</div>
                          <div className={`text-[10px] capitalize ${inXI ? "text-white/60" : "text-gray-400"}`}>
                            {p.position || "Unknown"}
                          </div>
                        </div>
                        {pAvg !== null && (
                          <span className={`text-xs font-bold flex-shrink-0 ${inXI ? "text-white/80" : "text-gray-500"}`}>
                            {pAvg}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedXI.length > 0 && (
                <button
                  onClick={() => setSelectedXI([])}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Selected XI list */}
            {selectedXI.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  Selected XI {selectedXI.length === 11 && <span className="text-green-600 text-sm">· {xiAvg}% avg chemistry</span>}
                </h3>
                <div className="space-y-1.5">
                  {selectedXI.map((id, i) => {
                    const p = players.find((pl) => pl.id === id);
                    return (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 w-5 text-right text-xs">{i + 1}</span>
                        <span className="font-semibold text-gray-900">{p?.name ?? id.slice(0, 8)}</span>
                        <span className="text-gray-400 text-xs capitalize">{p?.position}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB — TRANSFER TARGETS
        ════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === "targets" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-gray-900 font-bold mb-1">Transfer Targets</h2>
              <p className="text-gray-500 text-xs mb-5">
                Based on your squad&apos;s most frequent style conflicts — these profiles would increase overall chemistry.
              </p>

              {transferTargets.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  Need chemistry pair data to generate recommendations.
                </p>
              ) : (
                <div className="space-y-4">
                  {transferTargets.map(({ dim, count, archetype }, i) => (
                    <div
                      key={dim}
                      className={`rounded-2xl border p-5 ${
                        i === 0
                          ? "border-[#1a5c2a] bg-[#f0fdf4]"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${i === 0 ? "text-[#1a5c2a]" : "text-gray-400"}`}>
                            {i === 0 ? "Priority Target" : `Target ${i + 1}`}
                          </span>
                          <h3 className="font-black text-gray-900 text-base capitalize mt-0.5">
                            {archetype?.label ?? dim}
                          </h3>
                        </div>
                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full flex-shrink-0">
                          {count} conflict{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {archetype && (
                        <>
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{archetype.desc}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {archetype.positions.map((pos) => (
                              <span key={pos} className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-medium">
                                {pos}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weakest position group */}
            {weakestGroup && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Target size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-amber-800 font-bold capitalize">
                      Weakest Group: {weakestGroup.group}s ({weakestGroup.avg}% avg)
                    </h3>
                    <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                      Your {weakestGroup.group} group has the lowest internal chemistry. Signing a{" "}
                      {weakestGroup.group} who scores highly on{" "}
                      <strong>{clubFingerprint.strengths[0]?.[0] ?? "your top style trait"}</strong>{" "}
                      would raise this group&apos;s cohesion immediately.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB — HISTORY
        ════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === "history" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-gray-900 font-bold">Chemistry Over Time</h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Daily snapshots saved automatically. Prove improvement to players and board.
                  </p>
                </div>
                <button
                  onClick={handleManualSnapshot}
                  disabled={pairs.length === 0}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-40 ${
                    snapSaved
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {snapSaved ? "Saved ✓" : "Save snapshot"}
                </button>
              </div>

              {history.length < 2 ? (
                <div className="py-10 text-center text-gray-400">
                  <TrendingUp size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">
                    {history.length === 0
                      ? "No history yet. Snapshots are saved automatically each day you open this page."
                      : "Need at least 2 snapshots to show a trend. Come back tomorrow."}
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                      }
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Avg Chemistry"]}
                      labelFormatter={(l: string) =>
                        new Date(l).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#1a5c2a"
                      strokeWidth={2.5}
                      dot={{ fill: "#1a5c2a", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Snapshot log table */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-bold text-gray-900 mb-4">Snapshot Log</h3>
                <div className="space-y-3">
                  {[...history].reverse().map((snap, i, arr) => {
                    const prev  = arr[i + 1];
                    const delta = prev ? snap.avg - prev.avg : null;
                    return (
                      <div key={snap.date} className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs w-20 flex-shrink-0">
                          {new Date(snap.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a5c2a] rounded-full transition-all duration-500"
                            style={{ width: `${snap.avg}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 text-sm w-10 text-right">{snap.avg}%</span>
                        {delta !== null && (
                          <span className={`text-xs font-semibold w-10 text-right ${
                            delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400"
                          }`}>
                            {delta > 0 ? "+" : ""}{delta}
                          </span>
                        )}
                        <span className="text-gray-300 text-xs w-16 text-right">{snap.squad_size}pl</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
