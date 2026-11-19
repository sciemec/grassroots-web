"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, ChevronLeft, RefreshCw,
  Users, AlertCircle, Building2,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const API       = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";

type JoinRequest = {
  id: string;
  club_id: string;
  club_name: string | null;
  player_id: string;
  player: {
    id: string;
    name: string;
    position: string | null;
    sport: string | null;
    province: string | null;
  } | null;
  note: string | null;
  status: "pending" | "approved" | "declined" | "withdrawn";
  responded_at: string | null;
  created_at: string;
};

type Status = "pending" | "approved" | "declined" | "withdrawn" | "all";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   bg: "#fef9c3", color: "#854d0e", icon: Clock },
  approved:  { label: "Approved",  bg: "#dcfce7", color: "#166534", icon: CheckCircle2 },
  declined:  { label: "Declined",  bg: "#fee2e2", color: "#991b1b", icon: XCircle },
  withdrawn: { label: "Withdrawn", bg: "#f3f4f6", color: "#6b7280", icon: AlertCircle },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminJoinRequestsPage() {
  const token = useAuthStore((s) => s.token);

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [filter, setFilter]     = useState<Status>("pending");
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [actionId, setActionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (p = 1) => {
    if (!token) return;
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`${API}/admin/join-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data ?? []);
        setTotal(json.total ?? 0);
        setPage(p);
      } else {
        const body = await res.json().catch(() => ({}));
        setLoadError(`HTTP ${res.status}: ${body.message ?? JSON.stringify(body)}`);
        setRequests([]);
      }
    } catch (e) {
      setLoadError(String(e));
      setRequests([]);
    }
    finally { setLoading(false); }
  }, [token, filter]);

  useEffect(() => { load(1); }, [load]);

  // Approve or decline a request directly from admin
  const handleRespond = async (id: string, action: "approve" | "decline") => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/arena/clubs/join-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const newStatus = action === "approve" ? "approved" : "declined";
        setRequests((prev) =>
          prev.map((r) => r.id === id ? { ...r, status: newStatus, responded_at: new Date().toISOString() } : r)
        );
      }
    } catch { /* silent */ }
    finally { setActionId(null); }
  };

  const counts = {
    pending:   requests.filter((r) => r.status === "pending").length,
    approved:  requests.filter((r) => r.status === "approved").length,
    declined:  requests.filter((r) => r.status === "declined").length,
    withdrawn: requests.filter((r) => r.status === "withdrawn").length,
  };

  const displayed = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/admin" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">Club Join Requests</p>
            <p className="text-xs text-gray-400">
              {total > 0 ? `${total} total requests` : "Player requests to join Arena clubs"}
            </p>
          </div>
          <button onClick={() => load(1)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Debug error banner */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-mono break-all">
            <strong>Load error:</strong> {loadError}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {(["pending", "approved", "declined", "withdrawn"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className="rounded-2xl p-3 text-left border transition-all"
                style={{
                  background:   filter === s ? cfg.bg : "white",
                  borderColor:  filter === s ? cfg.color : "#e5e7eb",
                }}>
                <div className="flex items-center justify-between mb-1">
                  <Icon size={14} style={{ color: cfg.color }} />
                  <span className="text-lg font-bold" style={{ color: cfg.color }}>{counts[s]}</span>
                </div>
                <p className="text-[11px] font-medium text-gray-600 capitalize">{s}</p>
              </button>
            );
          })}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["pending", "approved", "declined", "withdrawn", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize"
              style={{
                background:  filter === f ? GRS_GREEN : "white",
                color:       filter === f ? "white" : "#374151",
                borderColor: filter === f ? GRS_GREEN : "#e5e7eb",
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">No {filter !== "all" ? filter : ""} join requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((req) => {
              const cfg   = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
              const Icon  = cfg.icon;
              const isAct = actionId === req.id;

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-4">

                  {/* Top row: player + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ background: GRS_GREEN }}>
                        {(req.player?.name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {req.player?.name ?? "Unknown Player"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[req.player?.sport, req.player?.position, req.player?.province]
                            .filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>

                  {/* Club row */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                    <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium truncate">{req.club_name ?? req.club_id}</span>
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
                    <span>Submitted {timeAgo(req.created_at)}</span>
                    {req.responded_at && (
                      <span>Responded {timeAgo(req.responded_at)}</span>
                    )}
                  </div>

                  {/* Optional note */}
                  {req.note && (
                    <div className="mt-3 rounded-xl p-3 text-xs text-gray-700 bg-gray-50">
                      <span className="font-semibold text-gray-400 uppercase text-[10px] block mb-1">Player note</span>
                      {req.note}
                    </div>
                  )}

                  {/* Approve / Decline — pending only */}
                  {req.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleRespond(req.id, "approve")} disabled={isAct}
                        className="flex-1 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                        style={{ background: GRS_GREEN }}>
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button onClick={() => handleRespond(req.id, "decline")} disabled={isAct}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 flex items-center justify-center gap-1.5"
                        style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                        <XCircle size={13} /> Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button onClick={() => load(page - 1)} disabled={page <= 1}
              className="px-4 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: "#e5e7eb" }}>
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page} · {total} total</span>
            <button onClick={() => load(page + 1)} disabled={page * 50 >= total}
              className="px-4 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: "#e5e7eb" }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
