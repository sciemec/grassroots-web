"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Loader2, User, GraduationCap, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

/* ── Player identity verification ── */
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

/* ── Coach credential verification ── */
interface CoachVerification {
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
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  );
}

/* ── Player verifications panel ── */
function PlayerVerificationsPanel({ statusTab }: { statusTab: StatusTab }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useQuery<{ data: Verification[] }>({
    queryKey: ["admin-verifications", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/verifications", { params: { status: statusTab, per_page: 20 } });
      return res.data;
    },
    enabled: !!user && user.role === "admin",
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

  if (isLoading) return <ListSkeleton />;

  if (isError) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
      <p className="font-medium text-red-700">Failed to load verifications</p>
      <p className="mt-1 text-sm text-red-500">Check your connection and try again</p>
    </div>
  );

  if (verifications.length === 0) return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="font-medium text-gray-600">No {statusTab} verifications</p>
      <p className="mt-1 text-sm text-gray-400">All caught up!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {verifications.map((v) => {
        const approving = approveMutation.isPending && approveMutation.variables === v.id;
        const rejecting = rejectMutation.isPending  && rejectMutation.variables?.id === v.id;
        const busy      = approving || rejecting;

        return (
          <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-gray-900">{v.user_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[v.status]}`}>
                    {v.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 capitalize">{v.document_type}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Submitted {new Date(v.submitted_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}`}
                </p>
                {v.reviewer_notes && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Notes: {v.reviewer_notes}</p>
                )}
              </div>
              {statusTab === "pending" && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(v.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                  >
                    {approving && <Loader2 className="h-3 w-3 animate-spin" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectOpen((prev) => ({ ...prev, [v.id]: !prev[v.id] }))}
                    disabled={busy}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                  >Reject</button>
                </div>
              )}
            </div>
            {rejectOpen[v.id] && (
              <div className="mt-4 flex gap-2">
                <input
                  value={rejectNotes[v.id] ?? ""}
                  onChange={(e) => setRejectNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  placeholder="Rejection reason…"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-green-700"
                />
                <button
                  onClick={() => rejectMutation.mutate({ id: v.id, notes: rejectNotes[v.id] ?? "" })}
                  disabled={rejecting}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejecting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Confirm
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Coach credential verifications panel ── */
function CoachVerificationsPanel({ statusTab }: { statusTab: StatusTab }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({});

  const { data, isLoading, isError } = useQuery<{ data: CoachVerification[] }>({
    queryKey: ["admin-coach-verifications", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/coach-verifications", { params: { status: statusTab } });
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/coach-verifications/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coach-verifications"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.post(`/admin/coach-verifications/${id}/reject`, { notes }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coach-verifications"] });
      setRejectOpen((prev) => ({ ...prev, [variables.id]: false }));
      setRejectNotes((prev) => ({ ...prev, [variables.id]: "" }));
    },
  });

  const rows = data?.data ?? [];

  if (isLoading) return <ListSkeleton />;

  if (isError) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
      <p className="font-medium text-red-700">Failed to load coach verifications</p>
      <p className="mt-1 text-sm text-red-500">Check your connection and try again</p>
    </div>
  );

  if (rows.length === 0) return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
      <GraduationCap className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="font-medium text-gray-600">No {statusTab} coach credential requests</p>
      <p className="mt-1 text-sm text-gray-400">All caught up!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {rows.map((v) => {
        const approving = approveMutation.isPending && approveMutation.variables === v.id;
        const rejecting = rejectMutation.isPending  && rejectMutation.variables?.id === v.id;
        const busy      = approving || rejecting;

        return (
          <div key={v.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-semibold text-gray-900">{v.coach_name}</p>
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                    {v.badge_type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[v.status]}`}>
                    {v.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {v.email}
                  {v.current_club ? ` · ${v.current_club}` : ""}
                  {v.experience != null ? ` · ${v.experience} yrs exp` : ""}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Badge #: <span className="font-mono text-gray-700">{v.badge_number}</span>
                </p>
                {v.document_url && (
                  <a
                    href={v.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs underline underline-offset-2"
                    style={{ color: GRS_GREEN }}
                  >
                    View certificate ↗
                  </a>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  Submitted {new Date(v.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}`}
                </p>
                {v.admin_notes && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Notes: {v.admin_notes}</p>
                )}
              </div>

              {statusTab === "pending" && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(v.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                  >
                    {approving && <Loader2 className="h-3 w-3 animate-spin" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectOpen((prev) => ({ ...prev, [v.id]: !prev[v.id] }))}
                    disabled={busy}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
                  >Reject</button>
                </div>
              )}
            </div>

            {rejectOpen[v.id] && (
              <div className="mt-4 flex gap-2">
                <input
                  value={rejectNotes[v.id] ?? ""}
                  onChange={(e) => setRejectNotes((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  placeholder="Rejection reason (sent to coach)…"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-green-700"
                />
                <button
                  onClick={() => rejectMutation.mutate({ id: v.id, notes: rejectNotes[v.id] ?? "" })}
                  disabled={rejecting}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejecting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Confirm
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ── */
export default function AdminVerificationsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [audienceTab, setAudienceTab] = useState<"players" | "coaches">("players");
  const [statusTab, setStatusTab]     = useState<StatusTab>("pending");

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

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
          <h1 className="text-2xl font-bold" style={{ color: GRS_GREEN }}>Verifications</h1>
          <p className="text-sm text-gray-500">Review identity and coaching credential submissions</p>
        </div>
      </div>

      {/* Audience tabs */}
      <div className="mb-4 flex gap-2">
        {(["players", "coaches"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAudienceTab(tab)}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
            style={audienceTab === tab
              ? { backgroundColor: GRS_GREEN, color: "#fff" }
              : { backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }
            }
          >
            {tab === "players" ? <User className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
            {tab === "players" ? "Players" : "Coach Credentials"}
          </button>
        ))}
      </div>

      {/* Status sub-tabs */}
      <div className="mb-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className="rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors"
            style={statusTab === tab
              ? { backgroundColor: GRS_GREEN, color: "#fff" }
              : { backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {audienceTab === "players"
        ? <PlayerVerificationsPanel statusTab={statusTab} />
        : <CoachVerificationsPanel statusTab={statusTab} />
      }

    </main>
  );
}
