"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

interface Agreement {
  id: string;
  status: "draft" | "confirmed";
  agreed_amount_cents: number | null;
  currency: string;
  payee_name: string | null;
  what_sponsor_provides: string | null;
  what_sponsor_receives: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  case_id: string;
  introduction_request_id: string;
  case_title: string;
  sponsor_name: string | null;
  sponsor_email: string;
  owner_name: string | null;
  owner_email: string;
}

interface PaginatedAgreements {
  data: Agreement[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function formatAmount(cents: number | null, currency: string): string {
  if (cents == null) return "—";
  return `${currency} ${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function AgreementRow({ ag }: { ag: Agreement }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px] truncate">
          <Link
            href={`/admin/sponsorships?search=${encodeURIComponent(ag.case_title)}`}
            className="text-[#1a5c2a] hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {ag.case_title}
          </Link>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          <div className="font-medium">{ag.sponsor_name ?? ag.sponsor_email}</div>
          {ag.sponsor_name && (
            <div className="text-xs text-gray-400">{ag.sponsor_email}</div>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          <div>{ag.owner_name ?? ag.owner_email}</div>
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
          {formatAmount(ag.agreed_amount_cents, ag.currency)}
        </td>
        <td className="px-4 py-3">
          {ag.status === "confirmed" ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              ✓ Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ◑ Draft
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {timeAgo(ag.updated_at)}
        </td>
        <td className="px-4 py-3 text-gray-400 text-sm">{open ? "▲" : "▼"}</td>
      </tr>

      {open && (
        <tr className="bg-gray-50 border-b border-gray-200">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {ag.payee_name && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Payee
                  </div>
                  <div className="text-gray-800">{ag.payee_name}</div>
                </div>
              )}
              {ag.agreed_amount_cents != null && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Amount
                  </div>
                  <div className="text-gray-800 font-semibold">
                    {formatAmount(ag.agreed_amount_cents, ag.currency)}
                  </div>
                </div>
              )}
              {ag.what_sponsor_provides && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Sponsor provides
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {ag.what_sponsor_provides}
                  </div>
                </div>
              )}
              {ag.what_sponsor_receives && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Sponsor receives
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {ag.what_sponsor_receives}
                  </div>
                </div>
              )}
              {ag.notes && (
                <div className="sm:col-span-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                    Notes
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {ag.notes}
                  </div>
                </div>
              )}
              {!ag.payee_name &&
                !ag.what_sponsor_provides &&
                !ag.what_sponsor_receives &&
                !ag.notes && (
                  <div className="sm:col-span-2 text-gray-400 italic text-xs">
                    No detailed terms entered yet.
                  </div>
                )}
              <div className="sm:col-span-2 pt-2 border-t border-gray-200 flex gap-4 text-xs text-gray-400">
                <span>Created {new Date(ag.created_at).toLocaleDateString()}</span>
                <span>Updated {new Date(ag.updated_at).toLocaleDateString()}</span>
                <span className="font-mono">ID: {ag.id.slice(0, 8)}…</span>
                <Link
                  href={`/sponsorships/${ag.case_id}/introductions/${ag.introduction_request_id}/agreement`}
                  className="ml-auto text-[#1a5c2a] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  View agreement page →
                </Link>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminAgreementsPage() {
  const router = useRouter();
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [data, setData]       = useState<PaginatedAgreements | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState<"" | "draft" | "confirmed">("");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/admin"); return; }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!token || !user || user.role !== "admin") return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set("status", status);

    setLoading(true);
    fetch(`${base}/admin/agreements?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, user, page, status]);

  if (!hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Admin
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="font-semibold text-gray-900">Sponsorship Agreements</h1>
        {data && (
          <span className="ml-auto text-xs text-gray-400">
            {data.total} total
          </span>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {(["", "draft", "confirmed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                status === s
                  ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                  : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a]"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Loading agreements…
            </div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-3">📋</div>
              <div className="font-semibold text-gray-700 text-sm mb-1">
                No agreements yet
              </div>
              <div className="text-xs text-gray-400">
                Agreements appear here once sponsors start drafting terms.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Case
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sponsor
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Case Owner
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Updated
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((ag) => (
                    <AgreementRow key={ag.id} ag={ag} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:border-[#1a5c2a]"
            >
              ← Prev
            </button>
            <span className="text-sm px-4 py-2 text-gray-500">
              {page} / {data.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-40 hover:border-[#1a5c2a]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
