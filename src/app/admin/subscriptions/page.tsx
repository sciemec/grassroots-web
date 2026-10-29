"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
  amount_usd: number;
}

interface SubscriptionsResponse {
  data:               Subscription[];
  current_page:       number;
  last_page:          number;
  per_page:           number;
  total:              number;
  active_revenue_usd: number;
}

const PLAN_COLORS: Record<string, string> = {
  pro:     "bg-purple-100 text-purple-700",
  starter: "bg-blue-100 text-blue-700",
  free:    "bg-gray-100 text-gray-600",
  premium: "bg-amber-100 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  trialing:  "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  expired:   "bg-gray-100 text-gray-500",
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  const { data, isLoading, isError } = useQuery<SubscriptionsResponse>({
    queryKey: ["admin-subscriptions", page],
    queryFn: async () => {
      const res = await api.get("/admin/subscriptions", { params: { page } });
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/subscriptions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
  });

  const subs     = useMemo(() => data?.data ?? [], [data]);
  const lastPage = data?.last_page ?? 1;

  // Derive summary from the current page for status counts;
  // use server-provided active_revenue_usd for accurate cross-page revenue.
  const summary = useMemo(() => ({
    active:            subs.filter((s) => s.status === "active").length,
    trialing:          subs.filter((s) => s.status === "trialing").length,
    cancelled:         subs.filter((s) => s.status === "cancelled").length,
    active_revenue_usd: data?.active_revenue_usd ?? 0,
  }), [subs, data]);

  if (!hasHydrated || !user) return null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: BG }} className="overflow-auto p-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
          style={{ color: GRS_GREEN }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: GRS_GREEN }}>
            Subscriptions — Kubhadhara
          </h1>
          <p className="text-sm text-gray-500">Billing plans and subscription management</p>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="font-medium text-red-700">Failed to load subscriptions</p>
          <p className="mt-1 text-sm text-red-500">Check your connection and try again</p>
        </div>
      )}

      {/* Summary cards */}
      {!isError && (
        <div className="mb-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Active",        value: summary.active,                                    color: "text-green-600" },
                { label: "Trialing",      value: summary.trialing,                                  color: "text-blue-600"  },
                { label: "Cancelled",     value: summary.cancelled,                                 color: "text-red-500"   },
                { label: "Active Revenue", value: `$${summary.active_revenue_usd.toLocaleString()}`, color: "text-amber-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions table */}
      {!isError && (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            All Subscriptions
          </p>
          {isLoading ? (
            <TableSkeleton />
          ) : subs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="font-medium text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Started</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Expires</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subs.map((s) => {
                    const cancelling = cancelMutation.isPending && cancelMutation.variables === s.id;
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.user_name}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_COLORS[s.plan] ?? "bg-gray-100 text-gray-600"}`}>
                            {s.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(s.started_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(s.expires_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-gray-900">${s.amount_usd}</td>
                        <td className="px-4 py-3">
                          {s.status !== "cancelled" && (
                            <button
                              onClick={() => cancelMutation.mutate(s.id)}
                              disabled={cancelling}
                              className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                            >
                              {cancelling && <Loader2 className="h-3 w-3 animate-spin" />}
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= lastPage}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

    </main>
  );
}
