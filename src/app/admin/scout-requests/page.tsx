"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface ScoutRequest {
  id: string;
  scout_id: string;
  scout_name: string;
  player_id: string;
  player_initials: string;
  player_position: string;
  player_province: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  message: string;
}

const STATUS_TABS = ["pending", "approved", "rejected"] as const;
type StatusTab = typeof STATUS_TABS[number];

const STATUS_COLORS: Record<StatusTab, string> = {
  pending:  "bg-amber-500/15 text-amber-700",
  approved: "bg-green-500/15 text-green-700",
  rejected: "bg-red-500/15 text-red-700",
};

function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AdminScoutRequestsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");

  const { data, isLoading } = useQuery<{ data: ScoutRequest[] }>({
    queryKey: ["admin-scout-requests", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/scout-requests", {
        params: { status: statusTab, per_page: 20 },
      });
      return res.data;
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/scout-requests/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-scout-requests"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/scout-requests/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-scout-requests"] }),
  });

  const requests = data?.data ?? [];

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
            <h1 className="text-2xl font-bold text-white">Scout Requests — Zviripo zveVaongorori</h1>
            <p className="text-sm text-muted-foreground">Approve or reject scout contact requests</p>
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

        {/* Cards */}
        {isLoading ? (
          <CardSkeleton />
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-white">No {statusTab} scout requests</p>
            <p className="mt-1 text-sm text-muted-foreground">Nothing to review here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-white">{req.scout_name}</p>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-white">
                        {req.player_initials}
                      </span>
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-700">
                        {req.player_position}
                      </span>
                      <span className="text-xs text-muted-foreground">{req.player_province}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                    {req.message && (
                      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                        {req.message}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Requested {new Date(req.requested_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {statusTab === "pending" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                      >
                        {approveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(req.id)}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {rejectMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
