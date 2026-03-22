"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Share2, Save, Loader2, DollarSign, Brain } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const LEAGUE_TIERS = ["Premier League", "Division One", "Division Two", "School/Amateur"];
const CONTRACT_STATUSES = ["Under contract", "Free agent", "Youth player"];

interface ValuationForm {
  age: string;
  position: string;
  appearances: string;
  goals: string;
  assists: string;
  league_tier: string;
  contract_status: string;
}

export default function ValuationPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState<ValuationForm>({
    age: "",
    position: "ST",
    appearances: "",
    goals: "",
    assists: "",
    league_tier: "Division One",
    contract_status: "Under contract",
  });
  const [aiResult, setAiResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleCalculate() {
    const { age, position, appearances, goals, assists, league_tier, contract_status } = form;
    if (!age || !appearances) {
      setError("Please fill in Age and Appearances at minimum.");
      return;
    }
    setLoading(true);
    setError("");
    setAiResult("");
    try {
      const message = `You are a football talent valuation AI for Zimbabwe grassroots sport.
Player profile: Age ${age}, Position ${position}, Appearances ${appearances}, Goals ${goals || 0}, Assists ${assists || 0}, League: ${league_tier}, Contract: ${contract_status}.

Provide:
1. ESTIMATED MARKET VALUE: USD $[amount] (give a specific number range)
2. PERCENTILE: "Top X% of ${position} players in Zimbabwe"
3. VALUE DRIVERS: 3 bullet points explaining what's driving the value
4. HOW TO INCREASE VALUE: 2 specific improvements to raise their value
5. COMPARABLE PLAYERS: Name 2 similar Zimbabwean grassroots players if possible, or describe the profile type

Base your valuation on Zimbabwe grassroots market realities (Division 1/2 transfer fees of $500-$5,000 USD, Premier League $2,000-$20,000 USD).`;

      const reply = await queryAI(message, "player");
      setAiResult(reply);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Valuation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!aiResult) return;
    setSaving(true);
    try {
      await api.post("/profile/valuation", { ...form, ai_result: aiResult });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — profile endpoint may not exist yet
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const text = `My football valuation from Grassroots Sports:\n\n${aiResult}\n\ngrassrootssports.live`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const field = (
    label: string,
    key: keyof ValuationForm,
    type: "number" | "select",
    options?: string[],
    min?: number,
    max?: number,
  ) => (
    <div key={key}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {type === "select" && options ? (
        <select
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="number"
          min={min}
          max={max}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          placeholder="0"
        />
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Market Value Estimator</h1>
            <p className="text-sm text-muted-foreground">
              First ever AI-powered player valuation for Zimbabwe grassroots football
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form card */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#f0b429]" />
              <h2 className="font-semibold">Your Player Profile</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Age", "age", "number", undefined, 14, 35)}
              {field("Position", "position", "select", POSITIONS)}
              {field("Appearances this season", "appearances", "number", undefined, 0)}
              {field("Goals this season", "goals", "number", undefined, 0)}
              {field("Assists this season", "assists", "number", undefined, 0)}
              {field("League Tier", "league_tier", "select", LEAGUE_TIERS)}
              <div className="sm:col-span-2">
                {field("Contract Status", "contract_status", "select", CONTRACT_STATUSES)}
              </div>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</>
              ) : (
                <><TrendingUp className="h-4 w-4" /> Calculate Valuation</>
              )}
            </button>
          </div>

          {/* Results card */}
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#f0b429]" />
              <h2 className="font-semibold">AI Valuation Result</h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]" />
                <p className="text-sm text-muted-foreground">Running valuation model…</p>
              </div>
            )}

            {!loading && !aiResult && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <DollarSign className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Fill in your profile and click &quot;Calculate Valuation&quot; to see your estimated market value
                </p>
              </div>
            )}

            {aiResult && !loading && (
              <>
                <div className="rounded-xl border border-[#1a5c2a]/30 bg-[#1a5c2a]/10 px-5 py-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
                    Valuation Report — {user?.name ?? "Player"}
                  </p>
                  <div className="space-y-1 text-sm leading-relaxed">
                    {aiResult.split("\n").map((line, i) => (
                      <p key={i} className={line.trim() === "" ? "mt-2" : ""}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-4 w-4" /> Copy Result
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a5c2a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a5c2a]/90 disabled:opacity-60 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saved ? "Saved!" : "Save to Profile"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-6 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-[#f0b429]">About this tool: </span>
            Valuations are AI estimates based on Zimbabwe grassroots market data. Division 1/2 transfer fees typically range $500–$5,000 USD. Premier League fees range $2,000–$20,000 USD. Use this as a guide for contract negotiations and scouting conversations.
          </p>
        </div>
      </main>
    </div>
  );
}
