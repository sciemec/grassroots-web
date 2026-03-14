"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { IdentityVerification, PaginatedResponse } from "@/types";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckSquare,
  Square,
  X,
} from "lucide-react";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700",
  approved: "bg-green-500/15 text-green-700",
  rejected: "bg-red-500/15 text-red-700",
  flagged: "bg-orange-500/15 text-orange-700",
};

export default function VerificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<IdentityVerification>>({
    queryKey: ["verifications", page, status],
    queryFn: async () => {
      const res = await api.get("/admin/verifications", { params: { page, status } });
      return res.data;
    },
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verifications/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verifications"] }),
  });

  const reject = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verifications/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["verifications"] }),
  });

  const verifications = data?.data ?? [];
  const actionable = verifications.filter((v) => v.status === "pending" || v.status === "flagged");
  const allSelected = actionable.length > 0 && actionable.every((v) => selected.has(v.id));
  const someSelected = selected.size > 0;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set<string>(actionable.map((v) => v.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const bulkAction = async (action: "approve" | "reject") => {
    const ids = Array.from(selected);
    setBulkLoading(true);
    try {
      await api.post(`/admin/verifications/bulk-${action}`, { ids });
      qc.invalidateQueries({ queryKey: ["verifications"] });
      clearSelection();
    } catch {
      alert(`Bulk ${action} failed. Please try again.`);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Identity Verifications</h1>
          <p className="text-sm text-muted-foreground">Review player identity documents</p>
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); clearSelection(); }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkAction("approve")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Approve all
            </button>
            <button
              onClick={() => bulkAction("reject")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject all
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left text-muted-foreground">
                {(status === "pending" || status === "flagged") && (
                  <th className="w-10 px-4 py-3">
                    <button
                      onClick={toggleAll}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">AI Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {verifications.map((v) => {
                const isActionable = v.status === "pending" || v.status === "flagged";
                return (
                  <tr
                    key={v.id}
                    className={`hover:bg-muted/40 ${selected.has(v.id) ? "bg-primary/5" : ""}`}
                  >
                    {isActionable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(v.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selected.has(v.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {!isActionable && (status === "pending" || status === "flagged") && (
                      <td className="px-4 py-3" />
                    )}
                    <td className="px-4 py-3 font-medium">{v.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {v.document_type?.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      {v.ai_confidence_score != null ? (
                        <span
                          className={`font-mono ${
                            v.ai_confidence_score >= 85
                              ? "text-green-600"
                              : v.ai_confidence_score >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {v.ai_confidence_score}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[v.status]}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isActionable ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approve.mutate(v.id)}
                            className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button
                            onClick={() => reject.mutate(v.id)}
                            className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {verifications.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                    No {status} verifications
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page} — {data.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.last_page}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
