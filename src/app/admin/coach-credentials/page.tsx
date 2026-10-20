"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

interface CoachCredential {
  id: string;
  coach_user_id: string;
  coach_name: string;
  email: string;
  badge_type: string;
  badge_number: string;
  document_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  current_club: string | null;
  experience: number | null;
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function EmptyState({ status }: { status: StatusTab }) {
  return (
    <div className="rounded-xl border border-dashed p-14 text-center">
      <GraduationCap className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p className="font-medium text-white">No {status} requests</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {status === "pending" ? "All credential submissions have been reviewed." : "Nothing here yet."}
      </p>
    </div>
  );
}

export default function AdminCoachCredentialsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ data: CoachCredential[] }>({
    queryKey: ["admin-coach-credentials", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/coach-verifications", { params: { status: statusTab } });
      return res.data;
    },
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/coach-verifications/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coach-credentials"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.post(`/admin/coach-verifications/${id}/reject`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coach-credentials"] });
      setRejectOpen((prev) => ({ ...prev, [variables.id]: false }));
      setRejectNotes((prev) => ({ ...prev, [variables.id]: "" }));
    },
  });

  const rows = data?.data ?? [];

  const pendingCount = statusTab === "pending" ? rows.length : undefined;

  return (
    <main className="gs-watermark overflow-auto p-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent" />
            Coach Credentials
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and verify coaching badge submissions
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              statusTab === tab
                ? "bg-accent/80 text-accent-foreground"
                : "border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab}
            {tab === "pending" && pendingCount != null && pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState status={statusTab} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-4">

                {/* Left — coach info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{row.coach_name}</p>
                    <span className="rounded-full bg-[#f0b429]/15 px-2 py-0.5 text-xs font-semibold text-[#f0b429]">
                      {row.badge_type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[row.status]}`}>
                      {row.status}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.email}
                    {row.current_club ? ` · ${row.current_club}` : ""}
                    {row.experience != null ? ` · ${row.experience} yrs exp` : ""}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Badge #:{" "}
                    <span className="font-mono text-foreground">{row.badge_number}</span>
                  </p>

                  {row.document_url && (
                    <a
                      href={row.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      View certificate ↗
                    </a>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(row.created_at).toLocaleDateString("en-ZW", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {row.reviewed_at &&
                      ` · Reviewed ${new Date(row.reviewed_at).toLocaleDateString("en-ZW", {
                        day: "numeric", month: "short",
                      })}`}
                  </p>

                  {row.admin_notes && (
                    <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      Notes: {row.admin_notes}
                    </p>
                  )}
                </div>

                {/* Right — action buttons (pending only) */}
                {statusTab === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => approveMutation.mutate(row.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      {approveMutation.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        setRejectOpen((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Rejection notes inline */}
              {rejectOpen[row.id] && (
                <div className="mt-4 flex gap-2">
                  <input
                    value={rejectNotes[row.id] ?? ""}
                    onChange={(e) =>
                      setRejectNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    placeholder="Rejection reason (sent to coach)…"
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() =>
                      rejectMutation.mutate({ id: row.id, notes: rejectNotes[row.id] ?? "" })
                    }
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {rejectMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
