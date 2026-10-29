"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, AlertTriangle, UserCheck, Clock, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ScoutRow {
  id: string;
  name: string | null;
  email: string | null;
  province: string | null;
  created_at: string;
  scout_approved_at: string | null;
}

interface PagedResponse {
  data: ScoutRow[];
  meta: { total: number; last_page: number };
  // Laravel paginator also sends total at root level
  total?: number;
  last_page?: number;
}

const STATUS_TABS = ["pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const TAB_META: Record<StatusTab, { label: string; icon: React.ReactNode; empty: string }> = {
  pending:  { label: "Pending",  icon: <Clock     className="h-3.5 w-3.5" />, empty: "No scouts awaiting approval" },
  approved: { label: "Approved", icon: <UserCheck className="h-3.5 w-3.5" />, empty: "No approved scouts yet" },
  rejected: { label: "Rejected", icon: <XCircle   className="h-3.5 w-3.5" />, empty: "No rejected scouts" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function safeDisplay(val: string | null | undefined, fallback = "—"): string {
  return val?.trim() || fallback;
}

function ini(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const days  = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminScoutRequestsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const qc          = useQueryClient();

  const [statusTab, setStatusTab] = useState<StatusTab>("pending");

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  const { data, isLoading, isError } = useQuery<PagedResponse>({
    queryKey: ["admin-scout-approvals", statusTab],
    queryFn:  async () => {
      const res = await api.get("/admin/scout-approvals", { params: { status: statusTab, per_page: 25 } });
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/scout-approvals/${id}/approve`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-scout-approvals"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/scout-approvals/${id}/reject`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-scout-approvals"] }),
  });

  const scouts: ScoutRow[] = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

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
            Scout Account Approvals
          </h1>
          <p className="text-sm text-gray-500">
            Review and approve scout registrations — {total} total
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {STATUS_TABS.map((tab) => {
          const meta    = TAB_META[tab];
          const active  = statusTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: GRS_GREEN, color: "#fff" }
                  : { backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }
              }
            >
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {isLoading ? (
        <CardSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="font-medium text-red-700">Failed to load scout requests</p>
          <p className="mt-1 text-sm text-red-500">Check your connection and try again</p>
        </div>
      ) : scouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-600">{TAB_META[statusTab].empty}</p>
          <p className="mt-1 text-sm text-gray-400">Nothing to review here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scouts.map((scout) => {
            const approving = approveMutation.isPending && approveMutation.variables === scout.id;
            const rejecting = rejectMutation.isPending  && rejectMutation.variables  === scout.id;
            const busy      = approving || rejecting;

            return (
              <div key={scout.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">

                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: GRS_GREEN }}
                    >
                      {ini(scout.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {safeDisplay(scout.name, "Unnamed Scout")}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{safeDisplay(scout.email)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        {scout.province && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {scout.province}
                          </span>
                        )}
                        <span>Registered {timeAgo(scout.created_at)}</span>
                        {scout.scout_approved_at && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                            Approved {timeAgo(scout.scout_approved_at)}
                          </span>
                        )}
                        {statusTab === "rejected" && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions — only on pending tab */}
                  {statusTab === "pending" && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => approveMutation.mutate(scout.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                      >
                        {approving
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <UserCheck className="h-3 w-3" />
                        }
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(scout.id)}
                        disabled={busy}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                      >
                        {rejecting
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <XCircle className="h-3 w-3" />
                        }
                        Reject
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
