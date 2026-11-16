"use client";
import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, ChevronLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";

type Claim = {
  id: string;
  status: "pending" | "approved" | "rejected";
  coach_note: string | null;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  club: {
    id: string;
    name: string;
    sport: string;
    province: string;
    tier: string | null;
  };
  coach: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
};

const STATUS_CONFIG = {
  pending:  { label: "Pending",  bg: "#fef9c3", color: "#854d0e", icon: Clock },
  approved: { label: "Approved", bg: "#dcfce7", color: "#166534", icon: CheckCircle2 },
  rejected: { label: "Rejected", bg: "#fee2e2", color: "#991b1b", icon: XCircle },
};

export default function AdminClubClaimsPage() {
  const token = useAuthStore((s) => s.token);

  const [claims, setClaims]   = useState<Claim[]>([]);
  const [filter, setFilter]   = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`${API}/admin/club-claims${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setClaims(json.data ?? json ?? []);
      }
    } catch { setClaims([]); }
    finally { setLoading(false); }
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const openConfirm = (id: string, action: "approve" | "reject") => {
    setConfirmId(id);
    setConfirmAction(action);
    setAdminNote("");
  };

  const handleDecision = async () => {
    if (!confirmId || !confirmAction || !token) return;
    setActionId(confirmId);
    try {
      const res = await fetch(`${API}/admin/club-claims/${confirmId}/${confirmAction}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ admin_note: adminNote.trim() || undefined }),
      });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) =>
            c.id === confirmId
              ? { ...c, status: confirmAction === "approve" ? "approved" : "rejected", admin_note: adminNote.trim() || null }
              : c
          )
        );
      }
    } catch { /* silent */ }
    finally {
      setActionId(null);
      setConfirmId(null);
      setConfirmAction(null);
    }
  };

  const counts = {
    pending:  claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  };

  const displayed = filter === "all" ? claims : claims.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Club Claims</p>
            <p className="text-xs text-gray-400">Coaches claiming their clubs</p>
          </div>
          <button onClick={load} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {(["pending","approved","rejected"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className="rounded-2xl p-4 text-left border transition-all"
                style={{
                  background: filter === s ? cfg.bg : "white",
                  borderColor: filter === s ? cfg.color : "#e5e7eb",
                }}>
                <div className="flex items-center justify-between mb-1">
                  <Icon size={16} style={{ color: cfg.color }} />
                  <span className="text-xl font-bold" style={{ color: cfg.color }}>{counts[s]}</span>
                </div>
                <p className="text-xs font-medium text-gray-600 capitalize">{s}</p>
              </button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["pending","approved","rejected","all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize"
              style={{
                background: filter === f ? GRS_GREEN : "white",
                color: filter === f ? "white" : "#374151",
                borderColor: filter === f ? GRS_GREEN : "#e5e7eb",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Claims list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No {filter !== "all" ? filter : ""} claims</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((claim) => {
              const cfg = STATUS_CONFIG[claim.status];
              const Icon = cfg.icon;
              const isActing = actionId === claim.id;
              return (
                <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Club info */}
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: GRS_GREEN }}>
                        {claim.club.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{claim.club.name}</p>
                        <p className="text-xs text-gray-500">{claim.club.sport} · {claim.club.province}{claim.club.tier ? ` · ${claim.club.tier}` : ""}</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>

                  {/* Coach info */}
                  <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 uppercase font-semibold text-[10px]">Coach</span>
                      <p className="text-gray-800 font-medium mt-0.5">{claim.coach.name}</p>
                      {claim.coach.email && <p className="text-gray-500">{claim.coach.email}</p>}
                      {claim.coach.phone && <p className="text-gray-500">{claim.coach.phone}</p>}
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase font-semibold text-[10px]">Submitted</span>
                      <p className="text-gray-700 mt-0.5">{new Date(claim.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Coach note */}
                  {claim.coach_note && (
                    <div className="mt-3 rounded-xl p-3 text-xs text-gray-700 bg-gray-50">
                      <span className="font-semibold text-gray-500 uppercase text-[10px] block mb-1">Coach's note</span>
                      {claim.coach_note}
                    </div>
                  )}

                  {/* Admin note */}
                  {claim.admin_note && (
                    <div className="mt-2 rounded-xl p-3 text-xs text-gray-700" style={{ background: "#fef9c3" }}>
                      <span className="font-semibold text-[10px] block mb-1" style={{ color: "#854d0e" }}>ADMIN NOTE</span>
                      {claim.admin_note}
                    </div>
                  )}

                  {/* Actions — pending only */}
                  {claim.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => openConfirm(claim.id, "approve")} disabled={isActing}
                        className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                        style={{ background: GRS_GREEN }}>
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button onClick={() => openConfirm(claim.id, "reject")} disabled={isActing}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                        style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmId && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <p className="font-bold text-gray-900 mb-1 capitalize">{confirmAction} this claim?</p>
            <p className="text-xs text-gray-500 mb-4">
              {confirmAction === "approve"
                ? "The coach will be linked to this club and notified."
                : "The coach will be notified their claim was rejected."}
            </p>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
              Note (optional)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder={confirmAction === "approve" ? "Welcome note..." : "Reason for rejection..."}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none mb-4"
              maxLength={200}
            />
            <div className="flex gap-3">
              <button onClick={() => { setConfirmId(null); setConfirmAction(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button onClick={handleDecision}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: confirmAction === "approve" ? GRS_GREEN : "#ef4444" }}>
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
