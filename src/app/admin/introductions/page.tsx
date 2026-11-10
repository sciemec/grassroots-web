"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

interface IntroRequest {
  id: string;
  case_id: string;
  sponsor_user_id: string;
  message: string | null;
  offer_cents: number | null;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  responded_at: string | null;
  response_note: string | null;
  intro_sent: boolean;
  intro_sent_at: string | null;
  created_at: string;
  case: { id: string; title: string; category: string; sport: string } | null;
  sponsor: { id: string; name: string; email: string } | null;
}

interface ApiResponse {
  data: IntroRequest[];
  meta?: { current_page: number; last_page: number; total: number };
  current_page?: number;
  last_page?: number;
  total?: number;
}

const STATUSES = ["all", "accepted", "pending", "declined", "withdrawn"] as const;
type StatusFilter = (typeof STATUSES)[number];

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  pending:   { dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-800 border-amber-200" },
  accepted:  { dot: "bg-green-500",  badge: "bg-green-50 text-green-800 border-green-200" },
  declined:  { dot: "bg-red-400",    badge: "bg-red-50 text-red-700 border-red-200" },
  withdrawn: { dot: "bg-gray-400",   badge: "bg-gray-50 text-gray-600 border-gray-200" },
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function dateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function AdminIntroductionsPage() {
  const token = useAuthStore((s) => s.token);

  const [intros, setIntros] = useState<IntroRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("accepted");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  useEffect(() => { setPage(1); }, [statusFilter]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`${base}/admin/introductions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<ApiResponse>; })
      .then((json) => {
        setIntros(json.data ?? []);
        const lp = json.meta?.last_page ?? json.last_page ?? 1;
        const tot = json.meta?.total ?? json.total ?? 0;
        setLastPage(lp);
        setTotal(tot);
      })
      .catch(() => setError("Failed to load introduction requests."))
      .finally(() => setLoading(false));
  }, [statusFilter, page, token, base]);

  const markSent = async (introId: string) => {
    setMarkingId(introId);
    try {
      const res = await fetch(`${base}/admin/introductions/${introId}/mark-sent`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message ?? "Failed");
      }
      const { data } = await res.json() as { data: IntroRequest };
      setIntros((prev) => prev.map((i) => i.id === introId ? data : i));
    } catch (err: unknown) {
      alert((err as Error).message || "Could not mark as sent.");
    } finally {
      setMarkingId(null);
    }
  };

  const pendingMarkCount = intros.filter((i) => i.status === "accepted" && !i.intro_sent).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Introduction Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} request{total !== 1 ? "s" : ""}
            {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
            {pendingMarkCount > 0 && statusFilter === "accepted" && (
              <span className="ml-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingMarkCount} to send
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/sponsorships"
          className="text-sm font-medium text-[#1a5c2a] border border-[#1a5c2a] rounded-lg px-4 py-2 hover:bg-[#1a5c2a]/5 transition-colors"
        >
          ← Sponsorship Cases
        </Link>
      </div>

      {/* Accepted-but-unsent alert banner */}
      {statusFilter === "accepted" && pendingMarkCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5 flex items-center gap-2">
          <span className="text-lg">📬</span>
          <span>
            <strong>{pendingMarkCount} introduction{pendingMarkCount > 1 ? "s" : ""}</strong> accepted but not yet physically sent.
            Contact the case owner and sponsor, then click <strong>Mark Sent</strong>.
          </span>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              statusFilter === s
                ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : intros.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔗</div>
          <p className="font-medium text-gray-500">No {statusFilter !== "all" ? statusFilter : ""} introduction requests</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {intros.map((intro) => {
              const isExpanded = expandedId === intro.id;
              const needsSending = intro.status === "accepted" && !intro.intro_sent;

              return (
                <div key={intro.id} className={needsSending ? "bg-amber-50/40" : ""}>
                  {/* Main row */}
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Left: sponsor + case */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {intro.sponsor?.name ?? "Unknown sponsor"}
                        </span>
                        <span className="text-gray-400 text-xs hidden sm:inline">→</span>
                        <Link
                          href={`/sponsorships/${intro.case_id}`}
                          className="text-xs text-[#1a5c2a] hover:underline truncate hidden sm:inline"
                        >
                          {intro.case?.title ?? intro.case_id}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{intro.sponsor?.email}</span>
                        {intro.offer_cents && (
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded px-1.5 py-0.5 font-medium">
                            {fmt(intro.offer_cents)}
                          </span>
                        )}
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 capitalize">{intro.case?.sport}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{dateShort(intro.created_at)}</span>
                      </div>
                      {/* Case title on mobile */}
                      <Link
                        href={`/sponsorships/${intro.case_id}`}
                        className="text-xs text-[#1a5c2a] hover:underline mt-0.5 block sm:hidden truncate"
                      >
                        {intro.case?.title ?? intro.case_id}
                      </Link>
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={intro.status} />

                      {intro.status === "accepted" && (
                        intro.intro_sent ? (
                          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                            ✓ Sent {intro.intro_sent_at ? dateShort(intro.intro_sent_at) : ""}
                          </span>
                        ) : (
                          <button
                            onClick={() => markSent(intro.id)}
                            disabled={markingId === intro.id}
                            className="text-xs bg-[#1a5c2a] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#145222] transition-colors disabled:opacity-60 whitespace-nowrap"
                          >
                            {markingId === intro.id ? "Saving…" : "Mark Sent"}
                          </button>
                        )
                      )}

                      {/* Expand toggle */}
                      {(intro.message || intro.response_note) && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : intro.id)}
                          className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-1"
                          title={isExpanded ? "Collapse" : "Show message"}
                        >
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded message / response */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {intro.message && (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sponsor message</div>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{intro.message}</p>
                        </div>
                      )}
                      {intro.response_note && (
                        <div className="bg-green-50 rounded-xl border border-green-200 px-4 py-3">
                          <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                            Athlete response · {intro.responded_at ? dateShort(intro.responded_at) : ""}
                          </div>
                          <p className="text-sm text-green-800 whitespace-pre-line">{intro.response_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
