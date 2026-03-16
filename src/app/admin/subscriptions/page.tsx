"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface SubSummary {
  active: number;
  trialing: number;
  cancelled: number;
  total_revenue_usd: number;
}

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

const PLAN_COLORS: Record<string, string> = {
  pro:       "bg-purple-500/15 text-purple-700",
  starter:   "bg-blue-500/15 text-blue-700",
  free:      "bg-muted text-muted-foreground",
  premium:   "bg-amber-500/15 text-amber-700",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-500/15 text-green-700",
  trialing:  "bg-blue-500/15 text-blue-700",
  cancelled: "bg-red-500/15 text-red-700",
  expired:   "bg-muted text-muted-foreground",
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: summaryData, isLoading: summaryLoading } = useQuery<{ data: SubSummary }>({
    queryKey: ["admin-subscriptions-summary"],
    queryFn: async () => {
      const res = await api.get("/admin/subscriptions/summary");
      return res.data;
    },
    enabled: !!user,
  });

  const { data, isLoading } = useQuery<{ data: Subscription[] }>({
    queryKey: ["admin-subscriptions", page],
    queryFn: async () => {
      const res = await api.get("/admin/subscriptions", { params: { per_page: 20, page } });
      return res.data;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/subscriptions/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-subscriptions-summary"] });
    },
  });

  const summary = summaryData?.data;
  const subs = data?.data ?? [];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Subscriptions — Kubhadhara</h1>
            <p className="text-sm text-muted-foreground">Billing plans and subscription management</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6">
          {summaryLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Active",         value: summary.active,       color: "text-green-500" },
                { label: "Trialing",       value: summary.trialing,     color: "text-blue-400" },
                { label: "Cancelled",      value: summary.cancelled,    color: "text-red-400" },
                { label: "Revenue (USD)",  value: `$${summary.total_revenue_usd?.toLocaleString() ?? 0}`, color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Subscriptions table */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">All Subscriptions</p>
        {isLoading ? (
          <TableSkeleton />
        ) : subs.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <CreditCard className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-white">No subscriptions found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Started</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{s.user_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_COLORS[s.plan] ?? "bg-muted text-muted-foreground"}`}>
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.expires_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-white">${s.amount_usd}</td>
                    <td className="px-4 py-3">
                      {s.status !== "cancelled" && (
                        <button
                          onClick={() => cancelMutation.mutate(s.id)}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          {cancelMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-xs text-muted-foreground">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={subs.length < 20}
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>

      </main>
    </div>
  );
}
