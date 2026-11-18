"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, Clock, CheckCircle2, XCircle,
  AlertCircle, Building2, MessageSquare, Trash2, Send,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API       = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";

type JoinRequest = {
  id: string;
  club_id: string;
  club_name?: string;
  note: string | null;
  status: "pending" | "approved" | "declined" | "withdrawn";
  responded_at: string | null;
  created_at: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "#fef9c3",
    color: "#854d0e",
    border: "#fde68a",
    icon: Clock,
    desc: "Waiting for the coach to respond.",
  },
  approved: {
    label: "Approved",
    bg: "#dcfce7",
    color: "#166534",
    border: "#86efac",
    icon: CheckCircle2,
    desc: "You are now a member of this club!",
  },
  declined: {
    label: "Declined",
    bg: "#fee2e2",
    color: "#991b1b",
    border: "#fca5a5",
    icon: XCircle,
    desc: "Your request was not accepted. You can re-apply.",
  },
  withdrawn: {
    label: "Withdrawn",
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "#d1d5db",
    icon: AlertCircle,
    desc: "You withdrew this request.",
  },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PlayerJoinRequestsPage() {
  const token = useAuthStore((s) => s.token);

  const [requests, setRequests]       = useState<JoinRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionId, setActionId]       = useState<string | null>(null);
  const [withdrawId, setWithdrawId]   = useState<string | null>(null); // confirm modal

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/player/join-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      }
    } catch { setRequests([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async (id: string) => {
    if (!token) return;
    setActionId(id);
    try {
      const res = await fetch(`${API}/arena/clubs/join-requests/${id}/withdraw`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => r.id === id ? { ...r, status: "withdrawn", responded_at: new Date().toISOString() } : r)
        );
      }
    } catch { /* silent */ }
    finally { setActionId(null); setWithdrawId(null); }
  };

  const pending   = requests.filter((r) => r.status === "pending");
  const active    = requests.filter((r) => r.status === "approved");
  const history   = requests.filter((r) => r.status === "declined" || r.status === "withdrawn");

  return (
    <div className="min-h-screen" style={{ background: "#f4f2ee" }}>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/player" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <p className="font-semibold text-sm text-gray-900">My Club Requests</p>
            <p className="text-xs text-gray-400">
              {pending.length > 0
                ? `${pending.length} pending · ${active.length} approved`
                : requests.length === 0 ? "No requests yet" : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={load} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "#f0fdf4" }}>
              <Send size={22} style={{ color: GRS_GREEN }} />
            </div>
            <p className="font-semibold text-gray-800 mb-1">No join requests yet</p>
            <p className="text-sm text-gray-500 mb-4">Browse clubs and tap &ldquo;Request to Join&rdquo; to get started.</p>
            <Link href="/arena/clubs"
              className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: GRS_GREEN }}>
              Browse Clubs
            </Link>
          </div>
        ) : (
          <>
            {/* ── Pending ──────────────────────────────────────────── */}
            {pending.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Awaiting Response · {pending.length}
                </p>
                <div className="space-y-3">
                  {pending.map((req) => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      onWithdraw={() => setWithdrawId(req.id)}
                      acting={actionId === req.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Approved / memberships ───────────────────────────── */}
            {active.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Active Memberships · {active.length}
                </p>
                <div className="space-y-3">
                  {active.map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </div>
              </section>
            )}

            {/* ── History ──────────────────────────────────────────── */}
            {history.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  History · {history.length}
                </p>
                <div className="space-y-3">
                  {history.map((req) => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </div>
              </section>
            )}

            {/* Browse more */}
            <div className="text-center pt-2">
              <Link href="/arena/clubs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
                <Building2 size={15} /> Browse More Clubs
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Withdraw confirm modal */}
      {withdrawId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <p className="font-bold text-gray-900 mb-1">Withdraw this request?</p>
            <p className="text-sm text-gray-500 mb-5">
              The club coach will no longer see your request. You can re-apply any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Keep It
              </button>
              <button onClick={() => handleWithdraw(withdrawId)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: "#ef4444" }}>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  req,
  onWithdraw,
  acting = false,
}: {
  req: JoinRequest;
  onWithdraw?: () => void;
  acting?: boolean;
}) {
  const cfg  = STATUS_CONFIG[req.status];
  const Icon = cfg.icon;

  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: cfg.border }}>

      {/* Club name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
            style={{ background: GRS_GREEN }}>
            {(req.club_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">
              {req.club_name ?? "Unknown Club"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Submitted {timeAgo(req.created_at)}</p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}>
          <Icon size={11} /> {cfg.label}
        </span>
      </div>

      {/* Status description */}
      <p className="mt-2 text-xs text-gray-500">{cfg.desc}</p>

      {/* Player note */}
      {req.note && (
        <div className="mt-3 rounded-xl p-3 bg-gray-50 flex gap-2">
          <MessageSquare size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">{req.note}</p>
        </div>
      )}

      {/* Responded at */}
      {req.responded_at && (
        <p className="mt-2 text-[11px] text-gray-400">
          Responded {timeAgo(req.responded_at)}
        </p>
      )}

      {/* Withdraw button — pending only */}
      {req.status === "pending" && onWithdraw && (
        <div className="mt-3 flex justify-end">
          <button onClick={onWithdraw} disabled={acting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border disabled:opacity-50"
            style={{ borderColor: "#fca5a5", color: "#ef4444" }}>
            <Trash2 size={12} /> Withdraw
          </button>
        </div>
      )}

      {/* View club link — approved */}
      {req.status === "approved" && (
        <div className="mt-3">
          <Link href={`/arena/clubs/${req.club_id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: GRS_GREEN }}>
            <Building2 size={12} /> View Club
          </Link>
        </div>
      )}
    </div>
  );
}
