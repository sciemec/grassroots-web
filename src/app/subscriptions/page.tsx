"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { PlayerSubscription, PaginatedResponse } from "@/types";

const planBadge: Record<string, string> = {
  weekly: "bg-blue-500/15 text-blue-700",
  monthly: "bg-indigo-500/15 text-indigo-700",
  "3-month": "bg-purple-500/15 text-purple-700",
};
const statusBadge: Record<string, string> = {
  active: "bg-green-500/15 text-green-700",
  grace_period: "bg-amber-500/15 text-amber-700",
  cancelled: "bg-red-500/15 text-red-700",
};

export default function SubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<PlayerSubscription>>({
    queryKey: ["subscriptions", page, status],
    queryFn: async () => {
      const res = await api.get("/admin/subscriptions", { params: { page, status: status || undefined } });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Player payment plans and transaction history</p>
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="grace_period">Grace Period</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment Method</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{s.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planBadge[s.plan_type] ?? "bg-muted text-muted-foreground"}`}>
                      {s.plan_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[s.status] ?? "bg-muted text-muted-foreground"}`}>
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{s.payment_method}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(s.starts_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(s.ends_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page} — {data.total} total
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">Prev</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
