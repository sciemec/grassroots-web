"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Brain, 
  Loader2, 
  Flag, 
  Target, 
  Sparkles, 
  Flame, 
  RefreshCw, 
  Shield, 
  Lightbulb, 
  Lock 
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

// 🔄 CONNECTOR INTERNALS: Import your upgraded positions blueprint registry
import { POSITION_FOCUS_MAP } from "@/config/positions";

type Tab = "corners" | "free-kicks" | "ai";

interface Corner {
  id: string;
  side: "For" | "Against";
  outcome: "Goal" | "Shot on target" | "Cleared" | "Other";
  delivery: "Inswinger" | "Outswinger" | "Short";
  zone: "Near post" | "Far post" | "Penalty spot";
}

interface FreeKick {
  id: string;
  side: "For" | "Against";
  outcome: "Goal" | "Shot on target" | "Blocked" | "Other";
  distance: "Inside box" | "Edge" | "Long range";
}

const CORNER_OUTCOMES = ["Goal", "Shot on target", "Cleared", "Other"] as const;
const CORNER_DELIVERIES = ["Inswinger", "Outswinger", "Short"] as const;
const CORNER_ZONES = ["Near post", "Far post", "Penalty spot"] as const;
const FK_OUTCOMES = ["Goal", "Shot on target", "Blocked", "Other"] as const;
const FK_DISTANCES = ["Inside box", "Edge", "Long range"] as const;

const uid = () => Math.random().toString(36).slice(2, 9);

// 📚 Dynamic role-based set piece playbook suggestions mapped to local conditions
const ROLE_SET_PIECE_GUIDES: Record<string, { roleTitle: string; icon: React.ElementType; color: string; focusText: string; routines: string[] }> = {
  striker: {
    roleTitle: "Attacking Specialization Track",
    icon: Flame,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    focusText: "Focus on box separation, blind-side runs, and first-touch redirect shots inside the 6-yard box.",
    routines: [
      "Near-Post Decoy Slip: Striker breaks early to the near post to flick or drag defensive markers out of center slots.",
      "The Wall Screen Break: Staged blocks on the edge of the box during direct free kicks to generate sightline blind spots for goalies."
    ]
  },
  midfielder: {
    roleTitle: "Engine Room Specialty Track",
    icon: RefreshCw,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    focusText: "Focus on whipped cross delivery trajectories, edge recycling positioning, and short combination sequences.",
    routines: [
      "2v1 Short Corner Trigger: Quickly draw out the wide marker with a short option, creating a 45-degree passing channel to cut inside.",
      "Phase-2 Recycling Loop: Midfield anchor deep-lying spacing mechanics to lock down clearances and reload the attacking wave."
    ]
  },
  defender: {
    roleTitle: "Defensive Wall Specialization Track",
    icon: Shield,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    focusText: "Focus on zonal box blocking boundaries, aggressive aerial clearances, and immediate offside tracking.",
    routines: [
      "Zonal Anchor Shielding: Defensive grouping configurations covering the near post and penalty spot zones uniformly.",
      "The Absolute Wall Structure: Lining up size profiles to block direct free kicks while maintaining clear counter-attack launch paths."
    ]
  }
};

export default function SetPiecesPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("corners");

  // Localized state handling for custom chosen roles (Defaults to read standard coach settings)
  const [coachRoleFocus, setCoachRoleFocus] = useState<string>("striker");

  // Corner state
  const [corners, setCorners] = useState<Corner[]>([]);
  const [showCornerForm, setShowCornerForm] = useState(false);
  const [cornerForm, setCornerForm] = useState<Omit<Corner, "id">>({
    side: "For", outcome: "Cleared", delivery: "Inswinger", zone: "Near post",
  });

  // Free kick state
  const [freeKicks, setFreeKicks] = useState<FreeKick[]>([]);
  const [showFKForm, setShowFKForm] = useState(false);
  const [fkForm, setFkForm] = useState<Omit<FreeKick, "id">>({
    side: "For", outcome: "Blocked", distance: "Edge",
  });

  // AI state
  const [aiReport, setAiReport] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return; 
    if (user.role !== "coach" && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [_hasHydrated, user, router]);

  function addCorner() {
    setCorners((c) => [...c, { id: uid(), ...cornerForm }]);
    setShowCornerForm(false);
  }

  function addFreeKick() {
    setFreeKicks((f) => [...f, { id: uid(), ...fkForm }]);
    setShowFKForm(false);
  }

  const cornersFor = corners.filter((c) => c.side === "For");
  const cornersAgainst = corners.filter((c) => c.side === "Against");
  const cornerGoals = cornersFor.filter((c) => c.outcome === "Goal").length;
  const cornerConversion = cornersFor.length > 0
    ? Math.round((cornerGoals / cornersFor.length) * 100)
    : 0;

  const fksFor = freeKicks.filter((f) => f.side === "For");
  const fkGoals = fksFor.filter((f) => f.outcome === "Goal").length;
  const fkShots = fksFor.filter((f) => f.outcome === "Shot on target").length;

  async function runAIAnalysis() {
    setAiLoading(true);
    setAiError("");
    setAiReport("");
    try {
      const cornerSummary = corners.length > 0
        ? `Corners: ${corners.length} total (${cornersFor.length} for, ${cornersAgainst.length} against). Goals from corners: ${cornerGoals}. Conversion rate: ${cornerConversion}%.`
        : "No corner data logged yet.";
      const fkSummary = freeKicks.length > 0
        ? `Free kicks: ${freeKicks.length} total (${fksFor.length} for). Goals: ${fkGoals}. Shots on target: ${fkShots}.`
        : "No free kick data logged yet.";

      const message = `You are an elite football strategist instructing a grassroots team in Zimbabwe focusing on a ${coachRoleFocus} developmental lens.

Set Piece Overview:
${cornerSummary}
${fkSummary}

Provide a tactical playbook analysis addressing:
1. ROLE SPECIFIC DRILL BLUEPRINT: 2 highly tailored exercises matching the coach's specialty track.
2. CONVERSION STRATEGY: Clear instructions on dead-ball setups considering local clay or uneven grass pitches.`;

      const reply = await queryAI(message, "coach");
      setAiReport(reply);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Tactical core processing timeout. Try again.");
    } finally {
      setAiLoading(false);
    }
  }

  const currentGuide = ROLE_SET_PIECE_GUIDES[coachRoleFocus] || ROLE_SET_PIECE_GUIDES.striker;
  const GuideIconComponent = currentGuide.icon;

  if (!_hasHydrated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-[#f0b429]/5 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/coach/dashboard" className="rounded-lg p-1.5 bg-[#f0b429]/5 border border-[#f0b429]/10 text-white hover:bg-[#f0b429]/10 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Set Piece Analytics</h1>
              <p className="text-xs text-[#f0b429]/50 font-semibold">Track corner variables, direct free kicks, and strategic roles</p>
            </div>
          </div>
        </div>

        {/* 🛠️ SPECIFICATION SELECTION ROW: Switch coaching roles to change training priorities */}
        <div className="mb-6 bg-[#f0b429]/5 border border-[#f0b429]/10 rounded-2xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#f0b429]/40 mb-2">Select Your Active Tactical Specialty Focus</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ROLE_SET_PIECE_GUIDES).map((roleKey) => (
              <button
                key={roleKey}
                onClick={() => setCoachRoleFocus(roleKey)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  coachRoleFocus === roleKey
                    ? "bg-[#f0b429] text-[#1c3d22]"
                    : "bg-[#f0b429]/5 border border-[#f0b429]/10 text-[#f0b429]/60 hover:bg-[#f0b429]/10"
                }`}
              >
                {roleKey} Track
              </button>
            ))}
          </div>

          {/* Inline Active Playbook Drawer */}
          <div className={`mt-4 border p-4 rounded-xl flex items-start gap-4 transition-all ${currentGuide.color}`}>
            <div className="p-2 bg-[#f0b429]/10 rounded-lg shrink-0 mt-0.5">
              <GuideIconComponent size={18} />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">{currentGuide.roleTitle} — Playbook Context</h4>
              <p className="text-xs text-[#f0b429]/70 leading-relaxed font-medium">{currentGuide.focusText}</p>
              <div className="pt-1.5 space-y-1">
                {currentGuide.routines.map((routine, idx) => (
                  <div key={idx} className="flex gap-2 text-xs text-[#f0b429]/90 font-semibold">
                    <span className="text-[#f0b429]">»</span>
                    <p>{routine}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="mb-6 flex gap-2">
          {(["corners", "free-kicks", "ai"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-white text-black font-black"
                  : "border border-[#f0b429]/10 bg-card/60 text-[#f0b429]/60 hover:bg-[#f0b429]/10"
              }`}
            >
              {tab === "corners" && "Corners"}
              {tab === "free-kicks" && "Free Kicks"}
              {tab === "ai" && "AI Playbook Analyzer"}
            </button>
          ))}
        </div>

        {/* ── Corners Tab ── */}
        {activeTab === "corners" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{cornersFor.length}</p>
                <p className="text-xs text-muted-foreground">Corners (For)</p>
              </div>
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{cornerGoals}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-white">{cornerConversion}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>

            {corners.length > 0 && (
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4">
                <p className="mb-2 text-xs font-black uppercase text-[#f0b429]/40 tracking-wider">Your Corners vs Opposition</p>
                <div className="flex items-center gap-3 text-xs font-bold text-white">
                  <span className="w-20 text-right">{cornersFor.length} For</span>
                  <div className="flex-1 rounded-full bg-[#f0b429]/5 border h-3 overflow-hidden">
                    <div
                      className="h-3 bg-[#1a5c2a]"
                      style={{ width: corners.length ? `${(cornersFor.length / corners.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-20">{cornersAgainst.length} Against</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowCornerForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] text-[#1c3d22] px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-[#f5c542] transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Log Corner Data
            </button>

            {showCornerForm && (
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">For / Against</label>
                    <select value={cornerForm.side} onChange={(e) => setCornerForm((f) => ({ ...f, side: e.target.value as Corner["side"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      <option>For</option><option>Against</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">Outcome</label>
                    <select value={cornerForm.outcome} onChange={(e) => setCornerForm((f) => ({ ...f, outcome: e.target.value as Corner["outcome"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      {CORNER_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">Delivery Curve</label>
                    <select value={cornerForm.delivery} onChange={(e) => setCornerForm((f) => ({ ...f, delivery: e.target.value as Corner["delivery"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      {CORNER_DELIVERIES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">Target Landing Zone</label>
                    <select value={cornerForm.zone} onChange={(e) => setCornerForm((f) => ({ ...f, zone: e.target.value as Corner["zone"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      {CORNER_ZONES.map((z) => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addCorner}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#227537] transition-colors">
                  <Flag className="h-4 w-4" /> Save Set Piece Entry
                </button>
              </div>
            )}

            {corners.length > 0 && (
              <div className="space-y-2">
                {corners.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-[#f0b429]/10 bg-card/40 px-4 py-3 text-xs text-white">
                    <span className="text-[#f0b429]/40 font-bold w-6">#{i + 1}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${c.side === "For" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{c.side}</span>
                    <span className="font-bold">{c.outcome}</span>
                    <span className="text-[#f0b429]/50 font-medium ml-auto">{c.delivery} // {c.zone}</span>
                  </div>
                ))}
              </div>
            )}

            {corners.length === 0 && !showCornerForm && (
              <div className="rounded-xl border border-dashed border-[#f0b429]/10 p-10 text-center text-xs text-[#f0b429]/40 font-bold">
                No match corners logged in session yet. Click Log Corner Data to begin.
              </div>
            )}
          </div>
        )}

        {/* ── Free Kicks Tab ── */}
        {activeTab === "free-kicks" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{fksFor.length}</p>
                <p className="text-xs text-muted-foreground">FK Attempted</p>
              </div>
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{fkGoals}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-white">{fkShots}</p>
                <p className="text-xs text-muted-foreground">Shots on Target</p>
              </div>
            </div>

            <button
              onClick={() => setShowFKForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] text-[#1c3d22] px-4 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-[#f5c542] transition-colors"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Log Free Kick
            </button>

            {showFKForm && (
              <div className="rounded-xl border border-[#f0b429]/10 bg-card/60 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">For / Against</label>
                    <select value={fkForm.side} onChange={(e) => setFkForm((f) => ({ ...f, side: e.target.value as FreeKick["side"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      <option>For</option><option>Against</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">Outcome</label>
                    <select value={fkForm.outcome} onChange={(e) => setFkForm((f) => ({ ...f, outcome: e.target.value as FreeKick["outcome"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      {FK_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#f0b429]/60 uppercase">Distance Boundary</label>
                    <select value={fkForm.distance} onChange={(e) => setFkForm((f) => ({ ...f, distance: e.target.value as FreeKick["distance"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-bold text-white outline-none">
                      {FK_DISTANCES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addFreeKick}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#227537] transition-colors">
                  <Target className="h-4 w-4" /> Add Free Kick Entry
                </button>
              </div>
            )}

            {freeKicks.length > 0 && (
              <div className="space-y-2">
                {freeKicks.map((fk, i) => (
                  <div key={fk.id} className="flex items-center gap-3 rounded-xl border border-[#f0b429]/10 bg-card/40 px-4 py-3 text-xs text-white">
                    <span className="text-[#f0b429]/40 font-bold w-6">#{i + 1}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${fk.side === "For" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>{fk.side}</span>
                    <span className="font-bold">{fk.outcome}</span>
                    <span className="text-[#f0b429]/50 font-medium ml-auto">{fk.distance}</span>
                  </div>
                ))}
              </div>
            )}

            {freeKicks.length === 0 && !showFKForm && (
              <div className="rounded-xl border border-dashed border-[#f0b429]/10 p-10 text-center text-xs text-[#f0b429]/40 font-bold">
                No dead-ball free kicks logged in system yet.
              </div>
            )}
          </div>
        )}

        {/* ── AI Analysis Tab ── */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 backdrop-blur-md p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a5c2a]">
                  <Brain className="h-5 w-5 text-[#f0b429]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Target Role Analysis Engine</h2>
                  <p className="text-xs text-[#f0b429]/50 font-semibold">
                    Compiling advice calibrated specifically to your active <span className="text-amber-400 font-bold font-mono">{coachRoleFocus.toUpperCase()}</span> metrics
                  </p>
                </div>
              </div>

              <button
                onClick={runAIAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] text-[#1c3d22] px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-[#f5c542] disabled:opacity-40 transition-all"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                {aiLoading ? "Processing Matrix..." : `Analyze ${coachRoleFocus.toUpperCase()} Playbooks`}
              </button>

              {aiLoading && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f0b429]/5 border border-[#f0b429]/5 px-4 py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f0b429]" />
                  <p className="text-xs text-[#f0b429]/60 font-bold uppercase tracking-wider animate-pulse">Running advanced tactical computations...</p>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-bold text-red-400">{aiError}</div>
              )}

              {aiReport && !aiLoading && (
                <div className="mt-4 rounded-xl border border-[#1a5c2a]/30 bg-black/30 p-5">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#f0b429] flex items-center gap-1">
                    <Sparkles size={12} /> Live Strategy Output Blueprint
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm text-[#f0b429]/90 leading-relaxed whitespace-pre-line font-medium">
                    {aiReport}
                  </div>
                </div>
              )}

              {!aiReport && !aiLoading && !aiError && (
                <div className="mt-4 rounded-xl border border-dashed border-[#f0b429]/10 px-5 py-8 text-center">
                  <Brain className="mx-auto mb-2 h-7 w-7 text-[#f0b429]/20" />
                  <p className="text-xs font-bold uppercase text-[#f0b429]/40 tracking-wider">
                    Log data points across match configurations, then launch evaluation sweeps above.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}