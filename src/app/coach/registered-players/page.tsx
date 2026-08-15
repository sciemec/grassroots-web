"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, CheckCircle2, Clock, X, UserCheck,
  Loader2, Trash2, ShieldCheck, AlertCircle, Download,
} from "lucide-react";
import api from "@/lib/api";
import jsPDF from "jspdf";
import { useAuthStore } from "@/lib/auth-store";

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
  match_status: "unmatched" | "pending_confirmation" | "confirmed" | "rejected" | "standalone_confirmed";
  match_flagged_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

const STATUS_CONFIG = {
  unmatched:            { label: "Not yet on platform",  color: "#6b7280", bg: "#f3f4f6",    icon: Clock },
  pending_confirmation: { label: "Match found — confirm?", color: "#d97706", bg: "#fef3c7", icon: AlertCircle },
  confirmed:            { label: "Linked to Passport",   color: "#16a34a", bg: "#dcfce7",    icon: CheckCircle2 },
  rejected:             { label: "Match rejected",       color: "#dc2626", bg: "#fee2e2",    icon: X },
  standalone_confirmed: { label: "Confirmed by academy", color: "#0369a1", bg: "#e0f2fe",    icon: ShieldCheck },
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

function generateCertificate(reg: Registration, coachName: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // ── Green header ──────────────────────────────────────────────────────────
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("GRASSROOTS SPORTS ZIMBABWE", W / 2, 13, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Zimbabwe's AI-Powered Sports Platform  ·  grassrootssports.live", W / 2, 21, { align: "center" });

  // Gold accent line
  doc.setFillColor(200, 150, 42);
  doc.rect(0, 32, W, 2, "F");

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER REGISTRATION CERTIFICATE", W / 2, 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Official Provenance Record — GrassRoots Sports Platform", W / 2, 57, { align: "center" });

  // ── Player details box ────────────────────────────────────────────────────
  let y = 67;
  doc.setFillColor(240, 247, 242);
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.3);
  doc.rect(15, y, W - 30, 50, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER DETAILS", 20, y + 8);

  const playerName = `${reg.first_name} ${reg.surname}`;
  const dob = new Date(reg.date_of_birth).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  const playerFields: [string, string][] = [
    ["Full Name",     playerName],
    ["Date of Birth", dob],
    ["Sport",         reg.sport ? reg.sport.charAt(0).toUpperCase() + reg.sport.slice(1) : "Not specified"],
    ["Position",      reg.position || "Not specified"],
  ];

  playerFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  // ── Registration details box ───────────────────────────────────────────────
  y = 126;
  doc.setFillColor(240, 247, 242);
  doc.rect(15, y, W - 30, 60, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text("REGISTRATION DETAILS", 20, y + 8);

  const registrationDate = new Date(reg.created_at).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";

  const confirmedDate = reg.confirmed_at
    ? new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const statusLabel =
    reg.match_status === "confirmed"
      ? `Linked to Talent Passport${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "standalone_confirmed"
      ? `Confirmed by Academy${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "pending_confirmation"
      ? "Pending Coach Confirmation"
      : "Awaiting Player Registration";

  const refShort = reg.id.toUpperCase().slice(0, 8);

  const regFields: [string, string][] = [
    ["Academy / Club",  reg.organisation_name],
    ["Registered by",   coachName],
    ["Date Registered", registrationDate],
    ["Status",          statusLabel],
    ["GRS Reference",   `GRS-${refShort}`],
  ];

  regFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  // ── Provenance statement ───────────────────────────────────────────────────
  y = 196;
  doc.setFillColor(255, 253, 235);
  doc.setDrawColor(200, 150, 42);
  doc.setLineWidth(0.4);
  doc.rect(15, y, W - 30, 46, "FD");

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 50, 0);
  const lines = [
    `This document certifies that ${playerName}, born ${dob},`,
    `was first registered and trained under ${reg.organisation_name}`,
    `on ${registrationDate}.`,
    "This timestamp is stored on GrassRoots Sports Zimbabwe servers",
    "and constitutes the official provenance record for this athlete.",
  ];
  lines.forEach((line, i) => {
    doc.text(line, W / 2, y + 10 + i * 7, { align: "center" });
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text(`Verify: grassrootssports.live/verify/${reg.id}`, W / 2, y + 41, { align: "center" });

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(200, 150, 42);
  doc.rect(0, 268, W, 1.5, "F");
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 269.5, W, 27.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("GrassRoots Sports Zimbabwe  ·  Empowering Athletes Across Zimbabwe", W / 2, 279, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 210, 175);
  const genDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Certificate generated: ${genDate}  ·  This is an official GrassRoots Sports document`, W / 2, 287, { align: "center" });

  doc.save(`GRS-Certificate-${reg.first_name}-${reg.surname}.pdf`);
}

export default function RegisteredPlayersPage() {
  const [regs, setRegs]         = useState<Registration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId]     = useState<string | null>(null);

  const user      = useAuthStore((s) => s.user);
  const coachName = (user as { name?: string } | null)?.name ?? "Coach";

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

  async function handleStandaloneConfirm(id: string) {
    setActionId(id);
    try {
      const res = await api.post(`/coach/registered-players/${id}/standalone-confirm`);
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
  const confirmed = regs.filter((r) => r.match_status === "confirmed" || r.match_status === "standalone_confirmed");
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
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
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
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
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
                  onStandaloneConfirm={handleStandaloneConfirm}
                  onCertificate={() => generateCertificate(r, coachName)}
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
  reg, actionId, onConfirm, onReject, onDelete, onStandaloneConfirm, onCertificate,
}: {
  reg: Registration;
  actionId: string | null;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onStandaloneConfirm: (id: string) => void;
  onCertificate: () => void;
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
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onCertificate}
            title="Download Provenance Certificate"
            className="rounded-lg p-1.5 text-gray-300 hover:bg-green-50 hover:text-green-600 transition-colors"
          >
            <Download size={13} />
          </button>
          {reg.match_status !== "confirmed" && (
            <button
              onClick={() => onDelete(reg.id)}
              disabled={busy}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
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

      {/* Confirmed — linked to platform */}
      {reg.match_status === "confirmed" && reg.confirmed_at && (
        <p className="mt-2 text-[10px] text-green-600">
          ✓ Passport linked on {new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      )}

      {/* Unmatched — offer standalone confirm */}
      {reg.match_status === "unmatched" && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <p className="text-[11px] text-gray-400 leading-snug">
            Player hasn&apos;t joined yet?{" "}
            <span className="text-gray-500">Mark as confirmed to close this record.</span>
          </p>
          <button
            onClick={() => onStandaloneConfirm(reg.id)}
            disabled={busy}
            className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 transition-colors"
          >
            {busy ? <Loader2 size={11} className="animate-spin" /> : <ShieldCheck size={11} />}
            Mark Confirmed
          </button>
        </div>
      )}

      {/* Standalone confirmed state */}
      {reg.match_status === "standalone_confirmed" && reg.confirmed_at && (
        <p className="mt-2 text-[10px] text-blue-600">
          ✓ Confirmed by academy on {new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · Certificate valid
        </p>
      )}
    </div>
  );
}
