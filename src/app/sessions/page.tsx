"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { TrainingSession, PaginatedResponse } from "@/types";

const typeBadge: Record<string, string> = {
  programme: "bg-blue-100 text-blue-700",
  free: "bg-gray-100 text-gray-700",
};
const statusBadge: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  active: "bg-amber-100 text-amber-700",
  aborted: "bg-red-100 text-red-700",
};

export default function SessionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<TrainingSession>>({
    queryKey: ["sessions", page, status],
    queryFn: async () => {
      const res = await api.get("/admin/sessions", { params: { page, status: status || undefined } });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Training Sessions</h1>
          <p className="text-sm text-muted-foreground">All recorded sessions across the platform</p>
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="aborted">Aborted</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[540px] text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Focus Area</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Offline?</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{s.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[s.session_type]}`}>
                      {s.session_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{s.focus_area?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-4 py-3">
                    {s.overall_score !== null ? (
                      <span className="font-mono font-semibold">{s.overall_score}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.created_offline ? "Yes" : "No"}
                  </td>
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
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Prev</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
