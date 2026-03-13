"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart, AlertTriangle, CheckCircle2, Loader2,
  Activity, ChevronRight, ShieldAlert, Info,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InjuryRiskResult {
  player_id?: string;
  risk_score: number;           // 0.0 – 1.0
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: string[];
  recommendation: string;
}

interface InjuryFormData {
  player_id: string;
  sessions_per_week: number;
  intensity: number;            // 1–10
  rest_days: number;
  match_minutes_this_week: number;
  previous_injuries: string;    // comma-separated body parts, or ""
  player_age: number;
  position: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW:      { color: "text-green-600",  bg: "bg-green-500/10",  border: "border-green-500/30",  bar: "bg-green-500",  label: "Low Risk",      icon: CheckCircle2 },
  MEDIUM:   { color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/30", bar: "bg-yellow-500", label: "Medium Risk",    icon: AlertTriangle },
  HIGH:     { color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/30", bar: "bg-orange-500", label: "High Risk",      icon: ShieldAlert },
  CRITICAL: { color: "text-red-600",    bg: "bg-red-500/10",    border: "border-red-500/30",    bar: "bg-red-500",    label: "Critical Risk",  icon: ShieldAlert },
};

const POSITIONS = [
  "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST",
  "Prop", "Flanker", "Scrum-half", "Fly-half", "Wing",
  "Sprinter", "Distance Runner", "Jumper", "Thrower",
  "Other",
];

const INJURY_SITES = [
  "Hamstring", "Knee", "Ankle", "Groin", "Shoulder",
  "Calf", "Hip", "Back", "Quadricep", "Shin splints",
];

// ─── Slider input ─────────────────────────────────────────────────────────────

function SliderField({
  label, hint, value, min, max, step = 1, onChange, displayValue,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  displayValue?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold text-primary">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

// ─── Risk gauge ───────────────────────────────────────────────────────────────

function RiskGauge({ score, level }: { score: number; level: InjuryRiskResult["risk_level"] }) {
  const pct = Math.round(score * 100);
  const cfg = RISK_CONFIG[level];
  const RiskIcon = cfg.icon;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const strokeColor = { LOW: "#22c55e", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444" }[level];

  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none"
          stroke={strokeColor} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="55" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold" fill="currentColor">
          {pct}%
        </text>
        <text x="55" y="65" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
          risk score
        </text>
      </svg>
      <div className={`mt-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${cfg.color} ${cfg.bg}`}>
        <RiskIcon className="h-4 w-4" />
        {cfg.label}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InjuryTrackerPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [form, setForm] = useState<InjuryFormData>({
    player_id: "",
    sessions_per_week: 4,
    intensity: 6,
    rest_days: 2,
    match_minutes_this_week: 90,
    previous_injuries: "",
    player_age: 18,
    position: "CM",
  });

  const [selectedInjuries, setSelectedInjuries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InjuryRiskResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    // Pre-fill player_id from logged-in player
    if (user.role === "player") {
      setForm((f) => ({ ...f, player_id: user.id }));
    }
  }, [user, router]);

  const setField = <K extends keyof InjuryFormData>(key: K, value: InjuryFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleInjury = (site: string) => {
    setSelectedInjuries((prev) => {
      const next = prev.includes(site) ? prev.filter((s) => s !== site) : [...prev, site];
      setField("previous_injuries", next.join(", "));
      return next;
    });
  };

  const submit = async () => {
    setLoading(true);
    setErrorMsg("");
    setResult(null);
    try {
      const payload = { ...form, previous_injuries: selectedInjuries };
      const endpoint = form.player_id
        ? `/players/${form.player_id}/injury-risk`
        : "/injury-risk";
      const res = await api.post(endpoint, payload);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? "Could not calculate risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const cfg = result ? RISK_CONFIG[result.risk_level] : null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">

        {/* Header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Injury Risk Engine</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered injury prevention — no physio needed
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl space-y-6 p-6">

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700">
              Enter the player&apos;s current training load and history. The AI calculates injury risk
              using XGBoost — the same model used by professional clubs.
            </p>
          </div>

          {/* ── Training Load ── */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Training Load This Week</h2>
            </div>
            <div className="space-y-5">
              <SliderField
                label="Sessions per week"
                hint="How many training sessions this week?"
                value={form.sessions_per_week}
                min={0} max={14}
                onChange={(v) => setField("sessions_per_week", v)}
              />
              <SliderField
                label="Training intensity"
                hint="1 = light warmup · 10 = max effort pre-match"
                value={form.intensity}
                min={1} max={10}
                onChange={(v) => setField("intensity", v)}
                displayValue={`${form.intensity}/10`}
              />
              <SliderField
                label="Rest days"
                hint="Full rest days with no training or matches"
                value={form.rest_days}
                min={0} max={7}
                onChange={(v) => setField("rest_days", v)}
              />
              <SliderField
                label="Match minutes this week"
                hint="Total competitive match minutes played"
                value={form.match_minutes_this_week}
                min={0} max={360} step={10}
                onChange={(v) => setField("match_minutes_this_week", v)}
                displayValue={`${form.match_minutes_this_week} min`}
              />
            </div>
          </div>

          {/* ── Player Info ── */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Player Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Age</label>
                <input
                  type="number"
                  min={10} max={50}
                  value={form.player_age}
                  onChange={(e) => setField("player_age", Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position</label>
                <select
                  value={form.position}
                  onChange={(e) => setField("position", e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Injury History ── */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-1.5 font-semibold">Previous Injury History</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Select any body parts previously injured (increases risk score)
            </p>
            <div className="flex flex-wrap gap-2">
              {INJURY_SITES.map((site) => (
                <button
                  key={site}
                  onClick={() => toggleInjury(site)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedInjuries.includes(site)
                      ? "bg-red-500/15 text-red-700 border border-red-500/30"
                      : "border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {site}
                </button>
              ))}
            </div>
            {selectedInjuries.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Selected: {selectedInjuries.join(", ")}
              </p>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors active:scale-[0.99]"
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Calculating risk…</> : <><Heart className="h-5 w-5" /> Calculate Injury Risk</>}
          </button>

          {/* ── Results ── */}
          {result && cfg && (
            <div className={`rounded-xl border p-6 ${cfg.bg} ${cfg.border}`}>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <RiskGauge score={result.risk_score} level={result.risk_level} />

                <div className="flex-1 text-center sm:text-left">
                  <h2 className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {result.recommendation}
                  </p>

                  {result.risk_factors.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Risk factors detected
                      </p>
                      <ul className="space-y-1.5">
                        {result.risk_factors.map((factor, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${cfg.color}`} />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* SHAP-style explanation bar */}
              <div className="mt-5 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Risk breakdown</p>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`}
                    style={{ width: `${Math.round(result.risk_score * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>0% — No risk</span>
                  <span>100% — Certain injury</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => { setResult(null); setErrorMsg(""); }}
                  className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-background/60 transition-colors"
                >
                  Recalculate
                </button>
                {user.role === "coach" && (
                  <Link
                    href="/coach/squad"
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    View Squad <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Empty first-time state */}
          {!result && !loading && (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium">Fill in the form above and tap Calculate</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The AI uses training load, rest, match minutes and injury history to predict risk
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
