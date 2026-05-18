"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import ChemistryMatrix, { type PairScore, type SquadPlayer } from "@/components/chemistry/ChemistryMatrix";
import { safeArray } from "@/lib/safe-array";
import api from "@/lib/api";
import jsPDF from "jspdf";

type PositionFilter = "all" | "forward" | "midfielder" | "defender" | "goalkeeper";

const POSITION_GROUPS: Record<string, string[]> = {
  forward:    ["striker", "centre_forward", "left_winger", "right_winger", "second_striker", "forward"],
  midfielder: ["central_midfielder", "defensive_midfielder", "attacking_midfielder", "left_midfielder", "right_midfielder", "midfielder"],
  defender:   ["centre_back", "left_back", "right_back", "sweeper", "defender"],
  goalkeeper: ["goalkeeper"],
};

function getGroup(position: string): string {
  const p = (position ?? "").toLowerCase().trim();
  for (const [group, list] of Object.entries(POSITION_GROUPS)) {
    if (list.includes(p)) return group;
  }
  return "other";
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-4">
      <div className="text-2xl font-black text-[#f0b429]">{value}</div>
      <div className="text-sm font-semibold text-white mt-0.5">{label}</div>
      <div className="text-xs text-white/40 mt-0.5">{sub}</div>
    </div>
  );
}

export default function CoachChemistryPage() {
  const { user } = useAuthStore();
  const [pairs, setPairs]           = useState<PairScore[]>([]);
  const [players, setPlayers]       = useState<SquadPlayer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [posFilter, setPosFilter]   = useState<PositionFilter>("all");

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
    } catch {
      setError("Could not load chemistry data. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Filtered views
  const filteredPlayers = posFilter === "all"
    ? players
    : players.filter((p) => getGroup(p.position) === posFilter);

  const filteredIds   = new Set(filteredPlayers.map((p) => p.id));
  const filteredPairs = pairs.filter(
    (p) => filteredIds.has(p.player_a_id) && filteredIds.has(p.player_b_id)
  );

  // Stats
  const avgChemistry    = pairs.length > 0
    ? Math.round(pairs.reduce((s, p) => s + p.chemistry_score, 0) / pairs.length)
    : 0;
  const highChemCount   = pairs.filter((p) => p.chemistry_score >= 85).length;
  const topPairs        = [...pairs].sort((a, b) => b.chemistry_score - a.chemistry_score).slice(0, 5);

  const playerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? id.slice(0, 8) + "…";

  // PDF export
  const exportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 26, "F");
    doc.setTextColor(240, 180, 41);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Squad Chemistry Report", 14, 17);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${user?.name ?? "Coach"} · ${new Date().toLocaleDateString("en-GB")} · Formula v1`, 120, 17);

    // Stats row
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

    // Top pairs
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Top 5 Chemistry Pairs", 14, 82);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let y = 90;
    topPairs.forEach((pair, i) => {
      const aName = playerName(pair.player_a_id);
      const bName = playerName(pair.player_b_id);
      doc.text(`${i + 1}.  ${aName}  ×  ${bName}`, 18, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 92, 42);
      doc.text(`${Math.round(pair.chemistry_score)}%`, 172, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 9;
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("GrassRoots Sports · Confidential · grassrootssports.live", 14, 285);

    doc.save(`squad-chemistry-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/coach" className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs mb-2 transition-colors">
              <ArrowLeft size={12} /> Coach Hub
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Squad Chemistry</h1>
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">v1</span>
            </div>
            <p className="text-white/50 text-sm mt-0.5">
              Style Compatibility · 60% style · 25% demographic · 15% geographic · Full Chemistry Rating coming soon
            </p>
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
          <StatCard label="Squad Average"          value={`${avgChemistry}%`}     sub="overall chemistry" />
          <StatCard label="High-Chemistry Pairs"   value={String(highChemCount)}  sub="scored 85% or above" />
          <StatCard label="Pairs Calculated"        value={String(pairs.length)}  sub="eligible squad pairs" />
          <StatCard label="Squad Players"           value={String(players.length)} sub="with fingerprint data" />
        </div>

        {/* Position filter */}
        <div className="flex flex-wrap gap-2">
          {(["all", "forward", "midfielder", "defender", "goalkeeper"] as PositionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPosFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                posFilter === f
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {f === "all" ? "All Positions" : `${f}s`}
            </button>
          ))}
        </div>

        {/* Chemistry Matrix */}
        <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
          <h2 className="text-white font-bold mb-1">Style Compatibility Matrix</h2>
          <p className="text-white/40 text-xs mb-5">
            Each cell = style compatibility score between two players. Click any cell to see the full breakdown.
          </p>

          {loading && (
            <div className="text-white/50 text-sm py-8 text-center">Loading chemistry data…</div>
          )}
          {error && !loading && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && (
            <ChemistryMatrix pairs={filteredPairs} players={filteredPlayers} />
          )}
        </div>

        {/* Top pairs list */}
        {!loading && topPairs.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
            <h2 className="text-white font-bold mb-4">Top 5 Chemistry Pairs</h2>
            <div className="space-y-4">
              {topPairs.map((pair, i) => {
                const aName = playerName(pair.player_a_id);
                const bName = playerName(pair.player_b_id);
                return (
                  <Link
                    key={`${pair.player_a_id}${pair.player_b_id}`}
                    href={`/coach/chemistry/pair/${pair.player_a_id}/${pair.player_b_id}`}
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-white/30 text-sm w-5 text-right">{i + 1}</span>
                    <div className="flex-1">
                      <div className="text-white text-sm font-semibold group-hover:text-[#f0b429] transition-colors">
                        {aName} × {bName}
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
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
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && pairs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-10 text-center">
            <p className="text-white/40 text-sm max-w-md mx-auto">
              No chemistry data yet. Players need at least 8 drills across 3 sessions in the GrassRoots
              app to generate a style fingerprint. The nightly similarity job runs at 02:00 Harare time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
