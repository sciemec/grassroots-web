"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { safeArray } from "@/lib/safe-array";
import {
  ArrowLeft, Flag, Loader2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Plus, X,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Flag {
  id: number;
  player_name: string;
  club_name: string;
  concern_type: string;
  description: string;
  status: "open" | "under_review" | "resolved";
  reported_at: string;
  resolved_at: string | null;
}

const CONCERN_TYPES = [
  "Bullying / Harassment",
  "Physical abuse concern",
  "Mental health concern",
  "Overtraining / Injury risk",
  "Inappropriate conduct by adult",
  "Player welfare — other",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:         { label: "Open",         color: "text-red-400" },
  under_review: { label: "Under Review", color: "text-amber-400" },
  resolved:     { label: "Resolved",     color: "text-green-400" },
};

export default function SafeguardingPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const [flags, setFlags]       = useState<Flag[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    player_name:  "",
    club_name:    "",
    concern_type: CONCERN_TYPES[0],
    description:  "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/safeguarding`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => setFlags(safeArray<Flag>(j)))
      .catch(() => setError("Failed to load safeguarding flags."))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.player_name.trim() || !form.description.trim()) {
      setFormError("Player name and description are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/province-admin/safeguarding`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setFlags((prev) => [json.data, ...prev]);
      setForm({ player_name: "", club_name: "", concern_type: CONCERN_TYPES[0], description: "" });
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit flag.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: Flag["status"]) => {
    try {
      const res = await fetch(`${API_URL}/province-admin/safeguarding/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      setFlags((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
    } catch { /* silent */ }
  };

  const open   = flags.filter((f) => f.status === "open").length;
  const review = flags.filter((f) => f.status === "under_review").length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Province Administration
            </p>
            <h1 className="text-2xl font-bold text-foreground">Safeguarding</h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Report Concern"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertTriangle className="h-5 w-5 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-foreground">{open}</p>
            <p className="text-xs text-muted-foreground">Open Flags</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <Flag className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold text-foreground">{review}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </div>
        </div>

        {/* New flag form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 mb-6 space-y-4">
            <p className="text-sm font-semibold text-red-300">Report a Welfare Concern</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Player Name *</label>
                <input
                  type="text"
                  value={form.player_name}
                  onChange={(e) => set("player_name", e.target.value)}
                  className="w-full bg-white/10 border border-[#f0b429]/20 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f0b429]"
                  placeholder="Player's name"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Club Name</label>
                <input
                  type="text"
                  value={form.club_name}
                  onChange={(e) => set("club_name", e.target.value)}
                  className="w-full bg-white/10 border border-[#f0b429]/20 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f0b429]"
                  placeholder="Club name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Concern Type *</label>
              <select
                value={form.concern_type}
                onChange={(e) => set("concern_type", e.target.value)}
                className="w-full bg-[#1a3d26] border border-[#f0b429]/20 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f0b429]"
              >
                {CONCERN_TYPES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="w-full bg-white/10 border border-[#f0b429]/20 rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f0b429] resize-none"
                placeholder="Describe the welfare concern in detail…"
              />
            </div>
            {formError && (
              <p className="text-xs text-red-300">{formError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Welfare Flag"}
            </button>
          </form>
        )}

        {/* Flags list */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading flags…</span>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : flags.length === 0 ? (
          <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No welfare concerns reported.</p>
            <p className="text-xs text-muted-foreground">All players are safe — report any concerns using the button above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((f) => {
              const st = STATUS_LABELS[f.status];
              const isOpen = expanded === f.id;
              return (
                <div key={f.id} className="rounded-2xl border border-[#f0b429]/10 bg-card/60 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : f.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{f.player_name}</span>
                        {f.club_name && (
                          <span className="text-xs text-muted-foreground">· {f.club_name}</span>
                        )}
                        <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.concern_type}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#f0b429]/5 pt-3 space-y-3">
                      <p className="text-sm text-foreground">{f.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Reported {new Date(f.reported_at).toLocaleDateString("en-ZW")}
                        {f.resolved_at && ` · Resolved ${new Date(f.resolved_at).toLocaleDateString("en-ZW")}`}
                      </p>
                      {f.status !== "resolved" && (
                        <div className="flex gap-2">
                          {f.status === "open" && (
                            <button
                              onClick={() => updateStatus(f.id, "under_review")}
                              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors"
                            >
                              Mark Under Review
                            </button>
                          )}
                          <button
                            onClick={() => updateStatus(f.id, "resolved")}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
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
