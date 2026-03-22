"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Brain, Loader2, Flag, Target } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

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

export default function SetPiecesPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("corners");

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
    if (!user) { router.push("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") router.push("/dashboard");
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
        ? `Corners: ${corners.length} total (${cornersFor.length} for, ${cornersAgainst.length} against). Goals from corners: ${cornerGoals}. Conversion rate: ${cornerConversion}%. Deliveries: ${cornerForm.delivery}.`
        : "No corner data logged yet.";
      const fkSummary = freeKicks.length > 0
        ? `Free kicks: ${freeKicks.length} total (${fksFor.length} for). Goals: ${fkGoals}. Shots on target: ${fkShots}.`
        : "No free kick data logged yet.";

      const message = `You are a tactical analyst for a Zimbabwe grassroots football coach. Here is the set piece data:

${cornerSummary}
${fkSummary}

Provide:
1. SET PIECE EFFICIENCY ANALYSIS: Overall rating and what the numbers show
2. PATTERNS SCOUTS WILL NOTICE: What stands out positively or negatively
3. 2 SPECIFIC RECOMMENDATIONS: Concrete drills or tactics to improve set piece conversion
4. OPPOSITION WEAKNESS PATTERNS: Based on set pieces conceded, what should the coach exploit

Keep analysis practical and relevant for grassroots level in Zimbabwe.`;

      const reply = await queryAI(message, "coach");
      setAiReport(reply);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  }

  if (!_hasHydrated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Set Piece Analytics</h1>
            <p className="text-sm text-muted-foreground">Track corner kicks, free kicks and opposition patterns</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {(["corners", "free-kicks", "ai"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "border border-white/10 bg-card/60 hover:bg-muted"
              }`}
            >
              {tab === "corners" && "Corners"}
              {tab === "free-kicks" && "Free Kicks"}
              {tab === "ai" && "AI Analysis"}
            </button>
          ))}
        </div>

        {/* ── Corners Tab ── */}
        {activeTab === "corners" && (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{cornersFor.length}</p>
                <p className="text-xs text-muted-foreground">Corners (For)</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{cornerGoals}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold">{cornerConversion}%</p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>

            {/* For vs Against bar */}
            {corners.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-card/60 p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Your Corners vs Opposition</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-right font-semibold">{cornersFor.length} For</span>
                  <div className="flex-1 rounded-full bg-muted h-3 overflow-hidden">
                    <div
                      className="h-3 bg-[#1a5c2a] rounded-full"
                      style={{ width: corners.length ? `${(cornersFor.length / corners.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-20 font-semibold">{cornersAgainst.length} Against</span>
                </div>
              </div>
            )}

            {/* Log Corner button */}
            <button
              onClick={() => setShowCornerForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Log Corner
            </button>

            {showCornerForm && (
              <div className="rounded-xl border border-white/10 bg-card/60 p-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">For / Against</label>
                    <select value={cornerForm.side} onChange={(e) => setCornerForm((f) => ({ ...f, side: e.target.value as Corner["side"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      <option>For</option><option>Against</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Outcome</label>
                    <select value={cornerForm.outcome} onChange={(e) => setCornerForm((f) => ({ ...f, outcome: e.target.value as Corner["outcome"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      {CORNER_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Delivery</label>
                    <select value={cornerForm.delivery} onChange={(e) => setCornerForm((f) => ({ ...f, delivery: e.target.value as Corner["delivery"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      {CORNER_DELIVERIES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Zone</label>
                    <select value={cornerForm.zone} onChange={(e) => setCornerForm((f) => ({ ...f, zone: e.target.value as Corner["zone"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      {CORNER_ZONES.map((z) => <option key={z}>{z}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addCorner}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5c2a]/90 transition-colors">
                  <Flag className="h-4 w-4" /> Add Corner
                </button>
              </div>
            )}

            {/* Corner list */}
            {corners.length > 0 && (
              <div className="space-y-2">
                {corners.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3 text-sm">
                    <span className="text-muted-foreground w-6">#{i + 1}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.side === "For" ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-700"}`}>{c.side}</span>
                    <span className="font-medium">{c.outcome}</span>
                    <span className="text-muted-foreground">{c.delivery} · {c.zone}</span>
                  </div>
                ))}
              </div>
            )}

            {corners.length === 0 && !showCornerForm && (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No corners logged yet — click &quot;Log Corner&quot; to start tracking
              </div>
            )}
          </div>
        )}

        {/* ── Free Kicks Tab ── */}
        {activeTab === "free-kicks" && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{fksFor.length}</p>
                <p className="text-xs text-muted-foreground">FK Attempted</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{fkGoals}</p>
                <p className="text-xs text-muted-foreground">Goals</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-card/60 p-4 text-center">
                <p className="text-2xl font-bold">{fkShots}</p>
                <p className="text-xs text-muted-foreground">Shots on Target</p>
              </div>
            </div>

            <button
              onClick={() => setShowFKForm((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Log Free Kick
            </button>

            {showFKForm && (
              <div className="rounded-xl border border-white/10 bg-card/60 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">For / Against</label>
                    <select value={fkForm.side} onChange={(e) => setFkForm((f) => ({ ...f, side: e.target.value as FreeKick["side"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      <option>For</option><option>Against</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Outcome</label>
                    <select value={fkForm.outcome} onChange={(e) => setFkForm((f) => ({ ...f, outcome: e.target.value as FreeKick["outcome"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      {FK_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Distance</label>
                    <select value={fkForm.distance} onChange={(e) => setFkForm((f) => ({ ...f, distance: e.target.value as FreeKick["distance"] }))}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
                      {FK_DISTANCES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={addFreeKick}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-[#1a5c2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a5c2a]/90 transition-colors">
                  <Target className="h-4 w-4" /> Add Free Kick
                </button>
              </div>
            )}

            {freeKicks.length > 0 && (
              <div className="space-y-2">
                {freeKicks.map((fk, i) => (
                  <div key={fk.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3 text-sm">
                    <span className="text-muted-foreground w-6">#{i + 1}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fk.side === "For" ? "bg-green-500/15 text-green-700" : "bg-red-500/15 text-red-700"}`}>{fk.side}</span>
                    <span className="font-medium">{fk.outcome}</span>
                    <span className="text-muted-foreground">{fk.distance}</span>
                  </div>
                ))}
              </div>
            )}

            {freeKicks.length === 0 && !showFKForm && (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No free kicks logged yet — click &quot;Log Free Kick&quot; to start tracking
              </div>
            )}
          </div>
        )}

        {/* ── AI Analysis Tab ── */}
        {activeTab === "ai" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a5c2a]">
                  <Brain className="h-5 w-5 text-[#f0b429]" />
                </div>
                <div>
                  <h2 className="font-semibold">Tactical AI Report</h2>
                  <p className="text-xs text-muted-foreground">
                    Analysis based on {corners.length} corners + {freeKicks.length} free kicks logged
                  </p>
                </div>
              </div>

              <button
                onClick={runAIAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {aiLoading ? "Analysing…" : "Get Tactical AI Report"}
              </button>

              {aiLoading && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted/40 px-5 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#f0b429]" />
                  <p className="text-sm text-muted-foreground">Running tactical analysis…</p>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="mt-4 rounded-xl bg-red-500/10 px-5 py-4 text-sm text-red-700">{aiError}</div>
              )}

              {aiReport && !aiLoading && (
                <div className="mt-4 rounded-xl border border-[#1a5c2a]/30 bg-[#1a5c2a]/10 px-5 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
                    Tactical Analysis Report
                  </p>
                  <div className="space-y-1 text-sm leading-relaxed">
                    {aiReport.split("\n").map((line, i) => (
                      <p key={i} className={line.trim() === "" ? "mt-2" : ""}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {!aiReport && !aiLoading && !aiError && (
                <div className="mt-4 rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
                  <Brain className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Log corners and free kicks in the other tabs, then click &quot;Get Tactical AI Report&quot; for a full analysis
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
