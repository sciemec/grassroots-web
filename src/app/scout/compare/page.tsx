"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Plus, X, TrendingUp, Award, Target, Zap } from "lucide-react";

interface ShortlistedPlayer {
  id: string;
  name?: string;
  initials: string;
  position?: string;
  province?: string;
  age_group?: string;
  sport?: string;
  talent_score?: number;
  overall_score?: number;
  speed_score?: number;
  technique_score?: number;
  physical_score?: number;
  tactical_score?: number;
  sessions_count?: number;
}

const METRICS: { key: keyof ShortlistedPlayer; label: string; icon: React.ElementType; color: string }[] = [
  { key: "overall_score",   label: "Overall",   icon: Award,     color: "text-blue-600" },
  { key: "talent_score",    label: "Talent ID", icon: Zap,       color: "text-amber-600" },
  { key: "technique_score", label: "Technique", icon: Target,    color: "text-green-600" },
  { key: "speed_score",     label: "Speed",     icon: TrendingUp, color: "text-purple-600" },
  { key: "physical_score",  label: "Physical",  icon: TrendingUp, color: "text-orange-600" },
  { key: "tactical_score",  label: "Tactical",  icon: Target,    color: "text-cyan-600" },
  { key: "sessions_count",  label: "Sessions",  icon: Award,     color: "text-pink-600" },
];

export default function ScoutComparePage() {
  const [selected, setSelected] = useState<ShortlistedPlayer[]>([]);

  const { data: shortlist = [], isLoading } = useQuery<ShortlistedPlayer[]>({
    queryKey: ["shortlist"],
    queryFn: async () => {
      const res = await api.get("/scout/shortlist");
      return res.data?.data ?? res.data ?? [];
    },
  });

  const addPlayer = (p: ShortlistedPlayer) => {
    if (selected.find((s) => s.id === p.id)) return;
    if (selected.length >= 4) return;
    setSelected((prev) => [...prev, p]);
  };

  const removePlayer = (id: string) => setSelected((prev) => prev.filter((p) => p.id !== id));

  const getWinner = (key: keyof ShortlistedPlayer): string | null => {
    if (selected.length < 2) return null;
    const vals = selected.map((p) => ({ id: p.id, val: Number(p[key] ?? 0) }));
    const max = Math.max(...vals.map((v) => v.val));
    if (max === 0) return null;
    const winners = vals.filter((v) => v.val === max);
    return winners.length === 1 ? winners[0].id : null;
  };

  const COLORS = [
    "border-blue-500/40 bg-blue-500/5",
    "border-green-500/40 bg-green-500/5",
    "border-purple-500/40 bg-purple-500/5",
    "border-amber-500/40 bg-amber-500/5",
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Compare Players</h1>
        <p className="text-sm text-muted-foreground">
          Select up to 4 players from your shortlist to compare side-by-side
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Shortlist picker */}
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Your Shortlist</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : shortlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players shortlisted yet.</p>
          ) : (
            <div className="space-y-2">
              {shortlist.map((p) => {
                const isSelected = !!selected.find((s) => s.id === p.id);
                const isFull = selected.length >= 4 && !isSelected;
                return (
                  <button
                    key={p.id}
                    onClick={() => isSelected ? removePlayer(p.id) : addPlayer(p)}
                    disabled={isFull}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted disabled:opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {p.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.position ?? "Player"}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.province} · {p.age_group?.toUpperCase()}</p>
                      </div>
                      {isSelected ? (
                        <X className="h-4 w-4 flex-shrink-0 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison table */}
        <div>
          {selected.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="text-center">
                <p className="font-medium text-muted-foreground">Select players to compare</p>
                <p className="mt-1 text-sm text-muted-foreground">Choose 2–4 players from your shortlist</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-32 pb-4 text-left text-xs font-medium text-muted-foreground">Metric</th>
                    {selected.map((p, i) => (
                      <th key={p.id} className="pb-4 text-center">
                        <div className={`relative inline-flex flex-col items-center rounded-xl border p-3 ${COLORS[i]}`}>
                          <button
                            onClick={() => removePlayer(p.id)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {p.initials}
                          </div>
                          <p className="mt-1.5 text-xs font-semibold">{p.position ?? "Player"}</p>
                          <p className="text-[10px] text-muted-foreground">{p.province}</p>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {METRICS.map(({ key, label, icon: Icon, color }) => {
                    const winnerId = getWinner(key);
                    const vals = selected.map((p) => Number(p[key] ?? 0));
                    const maxVal = Math.max(...vals);
                    return (
                      <tr key={key} className="hover:bg-muted/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${color}`} />
                            <span className="text-sm font-medium">{label}</span>
                          </div>
                        </td>
                        {selected.map((p) => {
                          const val = Number(p[key] ?? 0);
                          const isWinner = p.id === winnerId;
                          const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                          return (
                            <td key={p.id} className="py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm font-bold ${isWinner ? "text-primary" : ""}`}>
                                  {val > 0 ? (key === "sessions_count" ? val : `${val}`) : "—"}
                                  {isWinner && <span className="ml-1 text-xs">🏆</span>}
                                </span>
                                {val > 0 && (
                                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`h-full rounded-full transition-all ${isWinner ? "bg-primary" : "bg-muted-foreground/40"}`}
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {selected.length >= 2 && (
                <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ZIFA SAFEGUARDING NOTE</p>
                  <p className="text-xs text-muted-foreground">
                    Players are shown by initials and region only. Full identities are only accessible after
                    admin-approved contact requests. Scout reports respect child protection policies for U18 players.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
