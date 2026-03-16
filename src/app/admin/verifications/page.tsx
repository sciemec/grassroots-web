"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Verification {
  id: string;
  user_id: string;
  user_name: string;
  document_type: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

const STATUS_TABS = ["pending", "approved", "rejected"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<StatusTab, string> = {
  pending:  "bg-amber-500/15 text-amber-700",
  approved: "bg-green-500/15 text-green-700",
  rejected: "bg-red-500/15 text-red-700",
};

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AdminVerificationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery<{ data: Verification[] }>({
    queryKey: ["admin-verifications", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/verifications", {
        params: { status: statusTab, per_page: 20 },
      });
      return res.data;
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verifications/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-verifications"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.post(`/admin/verifications/${id}/reject`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setRejectOpen((prev) => ({ ...prev, [variables.id]: false }));
      setRejectNotes((prev) => ({ ...prev, [variables.id]: "" }));
    },
  });

  const verifications = data?.data ?? [];

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
            <h1 className="text-2xl font-bold text-white">Verifications — Shanduro dzeMapepa</h1>
            <p className="text-sm text-muted-foreground">Review player document submissions</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="mb-6 flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <ListSkeleton />
        ) : verifications.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-white">No {statusTab} verifications</p>
            <p className="mt-1 text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">{v.user_name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[v.status]}`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground capitalize">{v.document_type}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Submitted {new Date(v.submitted_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                      {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}`}
                    </p>
                    {v.reviewer_notes && (
                      <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Notes: {v.reviewer_notes}
                      </p>
                    )}
                  </div>

                  {statusTab === "pending" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => approveMutation.mutate(v.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                      >
                        {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectOpen((prev) => ({ ...prev, [v.id]: !prev[v.id] }))}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Reject notes input */}
                {rejectOpen[v.id] && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={rejectNotes[v.id] ?? ""}
                      onChange={(e) => setRejectNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      placeholder="Rejection reason…"
                      className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      onClick={() => rejectMutation.mutate({ id: v.id, notes: rejectNotes[v.id] ?? "" })}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {rejectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
