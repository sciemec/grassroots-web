"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { ScoutContactRequest, PaginatedResponse } from "@/types";
import { CheckCircle, XCircle } from "lucide-react";

export default function ScoutRequestsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<ScoutContactRequest>>({
    queryKey: ["scout-requests", page],
    queryFn: async () => {
      const res = await api.get("/admin/contact-requests/pending", { params: { page } });
      return res.data;
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/contact-requests/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scout-requests"] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.post(`/admin/contact-requests/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scout-requests"] }),
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scout Contact Requests</h1>
        <p className="text-sm text-muted-foreground">Review and approve scout outreach to players</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.data.map((req) => (
            <div key={req.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="font-medium">{req.scout?.name ?? "Scout"}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {req.player?.initials} · {req.player?.region} · {req.player?.position}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => approve.mutate(req.id)}
                    disabled={approve.isPending}
                    className="flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3 w-3" /> Approve
                  </button>
                  <button
                    onClick={() => reject.mutate(req.id)}
                    disabled={reject.isPending}
                    className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!data?.data.length && (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              No pending scout requests
            </div>
          )}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.current_page} of {data.last_page}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Prev</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
