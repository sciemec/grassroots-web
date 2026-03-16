"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Activity, CheckCircle2, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

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
      </main>
    </div>
  );
}
