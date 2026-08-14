"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, CheckCircle2, Clock, X, UserCheck,
  Loader2, Trash2, ShieldCheck, AlertCircle,
} from "lucide-react";
import api from "@/lib/api";

interface Registration {
  id: string;
  organisation_name: string;
  first_name: string;
  surname: string;
  date_of_birth: string;
  sport: string | null;
  position: string | null;
  phone: string | null;
  notes: string | null;
  linked_user_id: string | null;
  match_status: "unmatched" | "pending_confirmation" | "confirmed" | "rejected";
  match_flagged_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  unmatched:            { label: "Not yet on platform", color: "#6b7280", bg: "#f3f4f6",    icon: Clock },
  pending_confirmation: { label: "Match found — confirm?", color: "#d97706", bg: "#fef3c7", icon: AlertCircle },
  confirmed:            { label: "Linked to Passport",  color: "#16a34a", bg: "#dcfce7",    icon: CheckCircle2 },
  rejected:             { label: "Match rejected",      color: "#dc2626", bg: "#fee2e2",     icon: X },
};

function StatusBadge({ status }: { status: Registration["match_status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

export default function RegisteredPlayersPage() {
  const [regs, setRegs]         = useState<Registration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId]     = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "", surname: "", date_of_birth: "",
    sport: "", position: "", phone: "", notes: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/coach/registered-players");
      setRegs(res.data?.data ?? []);
    } catch {
      setRegs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name || !form.surname || !form.date_of_birth) return;
    setSubmitting(true);
    try {
      const res = await api.post("/coach/registered-players", {
        ...form,
        sport:    form.sport    || undefined,
        position: form.position || undefined,
        phone:    form.phone    || undefined,
        notes:    form.notes    || undefined,
      });
      setRegs((prev) => [res.data.data, ...prev]);
      setForm({ first_name: "", surname: "", date_of_birth: "", sport: "", position: "", phone: "", notes: "" });
      setShowForm(false);
    } catch {
      // silent — keep form open
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(id: string) {
    setActionId(id);
    try {
      const res = await api.post(`/coach/registered-players/${id}/confirm`);
      setRegs((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      const res = await api.post(`/coach/registered-players/${id}/reject`);
      setRegs((prev) => prev.map((r) => (r.id === id ? res.data.data : r)));
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this registration record?")) return;
    setActionId(id);
    try {
      await api.delete(`/coach/registered-players/${id}`);
      setRegs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silent
    } finally {
      setActionId(null);
    }
  }

  const pending   = regs.filter((r) => r.match_status === "pending_confirmation");
  const confirmed = regs.filter((r) => r.match_status === "confirmed");
  const unmatched = regs.filter((r) => r.match_status === "unmatched");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/coach" style={{ display: "flex", alignItems: "center", color: "#6b7280", textDecoration: "none" }}>
                <ArrowLeft size={16} />
              </Link>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Player Registry</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>Register players before they join the platform</div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <Plus size={13} /> Register Player
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Explainer */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">How this works</p>
          <p className="mt-0.5 text-xs text-blue-600">
            Register a player now — even if they don&apos;t have a GrassRoots account yet.
            When they sign up with the same name and date of birth, you&apos;ll get a notification
            to confirm the match. Once confirmed, your academy&apos;s name appears permanently
            on their Talent Passport as a provenance record.
          </p>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Register a Player</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">First Name *</label>
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                    placeholder="Tino"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Surname *</label>
                  <input
                    value={form.surname}
                    onChange={(e) => setForm({ ...form, surname: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                    placeholder="Chikosi"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Date of Birth *</label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Sport</label>
                  <select
                    value={form.sport}
                    onChange={(e) => setForm({ ...form, sport: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"].map((s) => (
                      <option key={s} value={s.toLowerCase()}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Position</label>
                  <input
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                    placeholder="e.g. Striker"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Player / Guardian Phone (optional)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none"
                  placeholder="+263 77 123 4567"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Coach Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-none resize-none"
                  placeholder="e.g. Excellent pace, needs work on left foot"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {submitting ? "Registering..." : "Register Player"}
              </button>
            </form>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        )}

        {!loading && regs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <UserCheck size={40} className="mb-3 text-gray-200" />
            <p className="text-sm font-semibold text-gray-400">No players registered yet</p>
            <p className="mt-1 text-xs text-gray-300">Register players before they join — their Talent Passport will show your academy&apos;s name once they sign up.</p>
          </div>
        )}

        {/* Pending confirmation — most urgent, shown first */}
        {pending.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-amber-600">
              ⚡ Action Required — {pending.length} match{pending.length > 1 ? "es" : ""} to review
            </p>
            <div className="space-y-3">
              {pending.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Confirmed links */}
        {confirmed.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Confirmed — {confirmed.length} linked
            </p>
            <div className="space-y-3">
              {confirmed.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {/* Unmatched */}
        {unmatched.length > 0 && (
          <section className="mb-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Waiting for player — {unmatched.length}
            </p>
            <div className="space-y-3">
              {unmatched.map((r) => (
                <RegistrationCard
                  key={r.id}
                  reg={r}
                  actionId={actionId}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({
  reg, actionId, onConfirm, onReject, onDelete,
}: {
  reg: Registration;
  actionId: string | null;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const busy = actionId === reg.id;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-gray-900">
              {reg.first_name} {reg.surname}
            </p>
            <StatusBadge status={reg.match_status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            DOB: {reg.date_of_birth}
            {reg.sport ? ` · ${reg.sport}` : ""}
            {reg.position ? ` · ${reg.position}` : ""}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Registered under <span className="font-semibold">{reg.organisation_name}</span>
            {" "}on {new Date(reg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {reg.notes && (
            <p className="mt-1.5 text-[11px] italic text-gray-500">"{reg.notes}"</p>
          )}
        </div>
        {reg.match_status !== "confirmed" && (
          <button
            onClick={() => onDelete(reg.id)}
            disabled={busy}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Pending confirmation actions */}
      {reg.match_status === "pending_confirmation" && (
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-700">
              A player with this name and date of birth just joined. Is this the correct person?
            </p>
          </div>
          <button
            onClick={() => onReject(reg.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            Not them
          </button>
          <button
            onClick={() => onConfirm(reg.id)}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
            Confirm Link
          </button>
        </div>
      )}

      {/* Confirmed state */}
      {reg.match_status === "confirmed" && reg.confirmed_at && (
        <p className="mt-2 text-[10px] text-green-600">
          ✓ Passport linked on {new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}
    </div>
  );
}
