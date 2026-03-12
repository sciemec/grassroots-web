"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Plus, ChevronRight, ArrowLeft, Filter } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Session {
  id: string;
  focus_area: string;
  session_type: string;
  overall_score: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface PaginatedSessions {
  data: Session[];
  current_page: number;
  last_page: number;
  total: number;
}

const statusStyles: Record<string, string> = {
  completed: "bg-green-500/15 text-green-700",
  active: "bg-blue-500/15 text-blue-700",
  aborted: "bg-muted text-muted-foreground",
};

export default function SessionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [paged, setPaged] = useState<PaginatedSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: "15" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    api.get(`/sessions?${params}`)
      .then((res) => {
        if (res.data?.data) {
          setPaged(res.data);
        } else {
          setPaged({ data: res.data, current_page: 1, last_page: 1, total: res.data.length });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page, statusFilter]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Training Sessions</h1>
              {paged && <p className="text-sm text-muted-foreground">{paged.total} total sessions</p>}
            </div>
          </div>
          <Link
            href="/player/sessions/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New session
          </Link>
        </div>

        {/* Status filter */}
        <div className="mb-5 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "completed", "active", "aborted"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : !paged?.data.length ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No sessions yet</p>
            <Link
              href="/player/sessions/new"
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Start your first session <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paged.data.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium capitalize">{session.focus_area}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {session.session_type} · {new Date(session.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.overall_score !== null && (
                      <span className="text-sm font-bold">{session.overall_score}%</span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[session.status] ?? "bg-muted text-muted-foreground"}`}>
                      {session.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {paged.last_page > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">Page {page} of {paged.last_page}</span>
                <button
                  onClick={() => setPage((p) => Math.min(paged.last_page, p + 1))}
                  disabled={page === paged.last_page}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
