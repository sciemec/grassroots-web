"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const TYPE_LABELS: Record<string, string> = {
  in_kind:          "In-kind",
  paid_to_supplier: "Paid to supplier",
  cash_to_payee:    "Cash to payee",
  agreement:        "Agreement",
};

interface ContribRow {
  id: string;
  case_id: string;
  case_title: string;
  type: string;
  description: string;
  value_cents: number;
  source_name: string | null;
  is_anonymous: boolean;
  evidence_url: string | null;
  need_item_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  owner_name: string | null;
  created_at: string;
}

interface PageData {
  data: ContribRow[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminContributionsPage() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const router      = useRouter();

  const [pageData,  setPageData]  = useState<PageData | null>(null);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || user.role !== "admin") { router.replace("/login"); return; }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BASE}/admin/contributions/verify-queue?page=${page}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setPageData(j))
      .finally(() => setLoading(false));
  }, [token, page]);

  const handleVerify = async (id: string) => {
    if (!token) return;
    setVerifying(id);
    try {
      const res = await fetch(`${BASE}/admin/contributions/${id}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        setPageData((prev) =>
          prev ? { ...prev, data: prev.data.filter((r) => r.id !== id) } : prev
        );
      }
    } finally {
      setVerifying(null);
    }
  };

  if (!hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link href="/admin" className="text-sm text-[#1a5c2a] hover:underline block mb-1">
              ← Admin
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Contribution Verify Queue</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Owner-reported contributions — verify to include in progress bar.
            </p>
          </div>
          {pageData && (
            <span className="text-sm text-gray-500">
              {pageData.total} pending
            </span>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-5">
          GRS records support. It does not handle money. Only verify after reviewing evidence.
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 size={16} className="animate-spin" />
            Loading verify queue…
          </div>
        )}

        {!loading && pageData && pageData.data.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
            No pending contributions to verify.
          </div>
        )}

        {!loading && pageData && pageData.data.length > 0 && (
          <div className="space-y-3">
            {pageData.data.map((row) => (
              <div key={row.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {TYPE_LABELS[row.type] ?? row.type}
                      </span>
                      <span className="text-sm font-bold text-[#1a5c2a]">{fmt(row.value_cents)}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{row.description}</p>
                    {row.source_name && (
                      <p className="text-xs text-gray-500">Source: {row.is_anonymous ? "(anonymous)" : row.source_name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Case:{" "}
                      <Link
                        href={`/account/cases/${row.case_id}`}
                        className="text-[#1a5c2a] hover:underline"
                        target="_blank"
                      >
                        {row.case_title}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400">
                      Reported by: {row.reporter_name ?? "—"} ({row.reporter_email ?? "—"})
                      {" · "}Owner: {row.owner_name ?? "—"}
                    </p>
                    {row.evidence_url && (
                      <a
                        href={row.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#1a5c2a] hover:underline mt-1"
                      >
                        <ExternalLink size={11} />
                        View evidence
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleVerify(row.id)}
                    disabled={verifying === row.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors flex-shrink-0"
                  >
                    {verifying === row.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCircle2 size={12} />
                    }
                    Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageData && pageData.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-gray-500">
              {page} / {pageData.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageData.last_page, p + 1))}
              disabled={page === pageData.last_page}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
