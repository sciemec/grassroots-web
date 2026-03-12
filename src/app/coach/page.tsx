"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { SquadMember } from "@/types";
import { Trash2 } from "lucide-react";

const statusBadge: Record<string, string> = {
  fit: "bg-green-100 text-green-700",
  injured: "bg-red-100 text-red-700",
  caution: "bg-amber-100 text-amber-700",
};

export default function CoachSquadPage() {
  const qc = useQueryClient();
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const { data: squad, isLoading } = useQuery<SquadMember[]>({
    queryKey: ["squad"],
    queryFn: async () => {
      const res = await api.get("/coach/squad");
      return res.data;
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/coach/squad/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["squad"] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/coach/squad/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["squad"] }),
  });

  const fetchInsights = async () => {
    setInsightsLoading(true);
    setInsights(null);
    try {
      const res = await api.post("/coach/insights", { question: question || "Analyse my squad fitness and injury risk." });
      setInsights(res.data.insight ?? res.data.message ?? JSON.stringify(res.data));
    } catch {
      setInsights("Failed to load insights. Try again.");
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Squad</h1>
        <p className="text-sm text-muted-foreground">Manage players and get AI insights</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Squad table */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : (
            <div className="rounded-xl border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Position</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {squad?.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3 font-mono font-bold text-muted-foreground">{m.shirt_no}</td>
                      <td className="px-4 py-3 font-medium">{m.player?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.position}</td>
                      <td className="px-4 py-3">
                        <select
                          value={m.status}
                          onChange={(e) => updateStatus.mutate({ id: m.id, status: e.target.value })}
                          className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${statusBadge[m.status]}`}
                        >
                          <option value="fit">Fit</option>
                          <option value="injured">Injured</option>
                          <option value="caution">Caution</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => remove.mutate(m.id)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!squad?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No players in squad yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">AI Insights</h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your squad… e.g. Who is at injury risk?"
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={fetchInsights}
            disabled={insightsLoading}
            className="mt-2 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {insightsLoading ? "Analysing…" : "Get Insights"}
          </button>
          {insights && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{insights}</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
