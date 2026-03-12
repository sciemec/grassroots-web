"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface SessionDetail {
  id: string;
  user: { player_id: string; email: string; phone: string };
  session_type: string;
  focus_area: string;
  overall_score: number | null;
  status: string;
  created_offline: boolean;
  created_at: string;
  completed_at: string | null;
  drill_sets: {
    id: string;
    drill: { name: string; category: string };
    reps: number;
    duration_seconds: number;
    score: number | null;
    created_at: string;
  }[];
  coaching_report: {
    summary: string;
    strengths: string[];
    improvements: string[];
    generated_at: string;
  } | null;
}

const statusColor: Record<string, string> = {
  completed: "text-green-600",
  active: "text-amber-600",
  aborted: "text-red-600",
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: session, isLoading } = useQuery<SessionDetail>({
    queryKey: ["session", id],
    queryFn: async () => {
      const res = await api.get(`/sessions/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!session) return null;

  return (
    <DashboardLayout>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Sessions
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Session Info</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["Player", session.user?.player_id ?? session.user?.email ?? "—"],
                ["Type", session.session_type],
                ["Focus Area", session.focus_area?.replace(/_/g, " ") ?? "—"],
                ["Status", session.status],
                ["Score", session.overall_score?.toString() ?? "—"],
                ["Offline", session.created_offline ? "Yes" : "No"],
                ["Started", new Date(session.created_at).toLocaleString()],
                ["Completed", session.completed_at ? new Date(session.completed_at).toLocaleString() : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground shrink-0">{label}</dt>
                  <dd className={`font-medium capitalize text-right ${label === "Status" ? statusColor[session.status] : ""}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* AI Coaching Report */}
          {session.coaching_report && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold">AI Coaching Report</h2>
              <p className="mb-3 text-sm text-muted-foreground">{session.coaching_report.summary}</p>
              {session.coaching_report.strengths?.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold text-green-700">Strengths</p>
                  <ul className="space-y-1">
                    {session.coaching_report.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-green-600">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {session.coaching_report.improvements?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-amber-700">To Improve</p>
                  <ul className="space-y-1">
                    {session.coaching_report.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-amber-600">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drill sets */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">Drill Sets ({session.drill_sets?.length ?? 0})</h2>
            {session.drill_sets?.length ? (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Drill</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Reps</th>
                    <th className="pb-2 font-medium">Duration</th>
                    <th className="pb-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {session.drill_sets.map((ds) => (
                    <tr key={ds.id} className="hover:bg-muted/30">
                      <td className="py-2 font-medium">{ds.drill?.name ?? "—"}</td>
                      <td className="py-2 capitalize text-muted-foreground">{ds.drill?.category ?? "—"}</td>
                      <td className="py-2">{ds.reps ?? "—"}</td>
                      <td className="py-2">{ds.duration_seconds ? `${ds.duration_seconds}s` : "—"}</td>
                      <td className="py-2 font-mono font-semibold">{ds.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No drill sets recorded for this session.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
