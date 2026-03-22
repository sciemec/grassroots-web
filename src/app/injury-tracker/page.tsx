"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Activity, CheckCircle2, AlertTriangle, ShieldAlert, Loader2, Brain } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";

interface InjuryRecord {
  id: string;
  player_id: string;
  initials: string;
  injury_type: string;
  body_part: string;
  severity: "minor" | "moderate" | "serious";
  status: "injured" | "recovering" | "fit";
  injured_at: string;
  expected_return: string | null;
  notes: string | null;
}

interface SquadMember {
  id: string;
  player?: { id?: string; name?: string };
  shirt_no?: number;
  position?: string;
  status?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  minor:    "bg-green-500/15 text-green-700",
  moderate: "bg-amber-500/15 text-amber-700",
  serious:  "bg-red-500/15 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  injured:   "bg-red-500/15 text-red-700",
  recovering:"bg-amber-500/15 text-amber-700",
  fit:       "bg-green-500/15 text-green-700",
};

const SEVERITY_ICON: Record<string, React.ElementType> = {
  minor:    CheckCircle2,
  moderate: AlertTriangle,
  serious:  ShieldAlert,
};

const BODY_PARTS = ["Hamstring", "Knee", "Ankle", "Groin", "Shoulder", "Calf", "Hip", "Back", "Quadricep", "Shin", "Foot", "Other"];
const INJURY_TYPES = ["Muscle strain", "Ligament sprain", "Fracture", "Bruise / contusion", "Tendinitis", "Dislocation", "Concussion", "Overuse", "Other"];

export default function InjuryTrackerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [aiReport, setAiReport] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>("");
  const [form, setForm] = useState({
    player_id: "",
    injury_type: "Muscle strain",
    body_part: "Hamstring",
    severity: "minor" as "minor" | "moderate" | "serious",
    expected_return: "",
    notes: "",
  });

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [hydrated, user, router]);

  const { data: injuries = [], isLoading } = useQuery<InjuryRecord[]>({
    queryKey: ["coach-injuries"],
    queryFn: async () => {
      const res = await api.get("/coach/injuries");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: hydrated && !!user,
  });

  const { data: squad = [] } = useQuery<SquadMember[]>({
    queryKey: ["coach-squad"],
    queryFn: async () => {
      const res = await api.get("/coach/squad");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: hydrated && !!user,
  });

  const markFit = useMutation({
    mutationFn: (id: string) => api.put(`/coach/injuries/${id}`, { status: "fit" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach-injuries"] }),
  });

  const addInjury = useMutation({
    mutationFn: () => api.post("/coach/injuries", {
      ...form,
      expected_return: form.expected_return || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coach-injuries"] });
      setShowForm(false);
      setForm({ player_id: "", injury_type: "Muscle strain", body_part: "Hamstring", severity: "minor", expected_return: "", notes: "" });
    },
  });

  async function runAiRiskCheck() {
    setAiLoading(true);
    setAiError("");
    setAiReport("");
    try {
      const activeInjuries = injuries.filter((i) => i.status !== "fit");
      if (activeInjuries.length === 0) {
        setAiReport("No active injuries in the squad. All players appear fit. Maintain current training loads and monitor fatigue levels.");
        setAiLoading(false);
        return;
      }
      const injurySummary = activeInjuries
        .map((inj) => {
          const daysSince = Math.floor(
            (Date.now() - new Date(inj.injured_at).getTime()) / 86400000
          );
          return `- Player: ${inj.initials ?? "Unknown"}, Injury: ${inj.injury_type} (${inj.body_part}), Severity: ${inj.severity}, Status: ${inj.status}, Days injured: ${daysSince}${inj.notes ? `, Notes: ${inj.notes}` : ""}`;
        })
        .join("\n");
      const message = `You are a sports medicine AI for Zimbabwe grassroots sport. Given these squad injuries:\n${injurySummary}\n\nProvide:\n1. OVERALL SQUAD INJURY RISK LEVEL: Low / Medium / High (and why in one sentence)\n2. PLAYERS AT RISK: Which players risk aggravating their injuries and why\n3. TRAINING LOAD RECOMMENDATIONS: Specific advice for training sessions this week\n\nKeep it concise and practical for a grassroots coach with limited medical resources.`;
      const reply = await queryAI(message, "coach");
      setAiReport(reply);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "AI check failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  if (!hydrated || !user) return null;

  const totalInjured   = injuries.filter((i) => i.status === "injured").length;
  const totalRecovering = injuries.filter((i) => i.status === "recovering").length;
  const totalFit       = injuries.filter((i) => i.status === "fit").length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Injury Tracker — Kurwara kweVatambi</h1>
              <p className="text-sm text-muted-foreground">Monitor squad health and recovery</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Injury"}
          </button>
        </div>

        {/* Summary row */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Injured",    value: totalInjured,    color: "text-red-500",    icon: ShieldAlert },
            { label: "Recovering", value: totalRecovering, color: "text-amber-500",  icon: AlertTriangle },
            { label: "Fit / Cleared", value: totalFit,    color: "text-green-500",  icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-xl border bg-card p-5 text-center">
              <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Add injury form */}
        {showForm && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Log New Injury</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Player</label>
                <select
                  value={form.player_id}
                  onChange={(e) => setForm((f) => ({ ...f, player_id: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select player…</option>
                  {squad.map((m) => (
                    <option key={m.id} value={m.player?.id ?? m.id}>
                      {m.shirt_no ? `#${m.shirt_no} ` : ""}{m.player?.name ?? `Player ${m.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Injury Type</label>
                <select
                  value={form.injury_type}
                  onChange={(e) => setForm((f) => ({ ...f, injury_type: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {INJURY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Body Part</label>
                <select
                  value={form.body_part}
                  onChange={(e) => setForm((f) => ({ ...f, body_part: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {BODY_PARTS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as typeof form.severity }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="serious">Serious</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Expected Return <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input
                  type="date"
                  value={form.expected_return}
                  onChange={(e) => setForm((f) => ({ ...f, expected_return: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Grade 1 hamstring, avoid sprinting"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => addInjury.mutate()}
                disabled={!form.player_id || addInjury.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {addInjury.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                Log Injury
              </button>
            </div>
          </div>
        )}

        {/* Injuries list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : injuries.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No injury records</p>
            <p className="mt-1 text-sm text-muted-foreground">All players are fit — log an injury when needed</p>
          </div>
        ) : (
          <div className="space-y-2">
            {injuries.map((record) => {
              const SeverityIcon = SEVERITY_ICON[record.severity] ?? AlertTriangle;
              const isActive = record.status !== "fit";
              return (
                <div key={record.id} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                    {record.initials ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{record.injury_type}</p>
                      <span className="text-xs text-muted-foreground">— {record.body_part}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[record.severity]}`}>
                        <SeverityIcon className="h-3 w-3" />
                        {record.severity}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[record.status]}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Injured: {new Date(record.injured_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {record.expected_return && (
                        <span>Return: {new Date(record.expected_return).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                      {record.notes && <span className="truncate max-w-xs">{record.notes}</span>}
                    </div>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => markFit.mutate(record.id)}
                      disabled={markFit.isPending}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      {markFit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Mark Fit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── AI Risk Assessment ── */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-6">
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a5c2a]">
                <Brain className="h-5 w-5 text-[#f0b429]" />
              </div>
              <div>
                <h2 className="font-semibold">AI Risk Assessment</h2>
                <p className="text-xs text-muted-foreground">Powered by Grassroots AI — sports medicine analysis</p>
              </div>
            </div>
            <button
              onClick={runAiRiskCheck}
              disabled={aiLoading || isLoading}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {aiLoading ? "Analysing…" : "Run AI Risk Check"}
            </button>
          </div>

          {aiLoading && (
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-5 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#f0b429]" />
              <p className="text-sm text-muted-foreground">Analysing squad injury data…</p>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="rounded-xl bg-red-500/10 px-5 py-4 text-sm text-red-700">
              {aiError}
            </div>
          )}

          {aiReport && !aiLoading && (
            <div className="rounded-xl border border-[#1a5c2a]/30 bg-[#1a5c2a]/10 px-5 py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
                AI Risk Report
              </p>
              <div className="space-y-1 text-sm leading-relaxed">
                {aiReport.split("\n").map((line, i) => (
                  <p key={i} className={line.trim() === "" ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {!aiReport && !aiLoading && !aiError && (
            <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
              <Brain className="mx-auto mb-2 h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Click &quot;Run AI Risk Check&quot; to get an AI-powered squad injury analysis
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
