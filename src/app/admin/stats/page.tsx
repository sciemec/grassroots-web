"use client";

import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface DayCount     { date: string; count: number }
interface SportCount   { sport: string; count: number }
interface ProvinceCount{ province: string; count: number }
interface DrillCount   { drill_name: string; count: number }

interface DetailedStats {
  registrations_by_day:  DayCount[];
  sessions_by_sport:     SportCount[];
  users_by_province:     ProvinceCount[];
  top_drills:            DrillCount[];
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export default function AdminStatsPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<{ data: DetailedStats }>({
    queryKey: ["admin-stats-detailed"],
    queryFn: async () => {
      const res = await api.get("/admin/stats/detailed");
      return res.data;
    },
    enabled: !!user,
  });

  const stats = data?.data;
  const maxProvince = stats?.users_by_province?.[0]?.count ?? 1;

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
            <h1 className="text-2xl font-bold text-white">Platform Stats — Ongorora Nhamba</h1>
            <p className="text-sm text-muted-foreground">System-wide analytics and usage data</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Registrations by day */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Registrations by Day
              </p>
            </div>
            {isLoading ? <SectionSkeleton /> : !stats?.registrations_by_day?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">New Users</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.registrations_by_day.map((row) => (
                      <tr key={row.date} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(row.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-white">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sessions by sport */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sessions by Sport
            </p>
            {isLoading ? <SectionSkeleton /> : !stats?.sessions_by_sport?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-2">
                {stats.sessions_by_sport.map((row) => (
                  <div key={row.sport} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors">
                    <p className="text-sm capitalize text-white">{row.sport}</p>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {row.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users by province — bar chart */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Users by Province
            </p>
            {isLoading ? <SectionSkeleton /> : !stats?.users_by_province?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-3">
                {stats.users_by_province.map((row, i) => (
                  <div key={row.province} className="flex items-center gap-3">
                    <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                    <span className="w-36 truncate text-sm font-medium text-white">{row.province}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(row.count / maxProvince) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs text-muted-foreground">
                      {row.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top drills */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Top Drills
            </p>
            {isLoading ? <SectionSkeleton /> : !stats?.top_drills?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-2">
                {stats.top_drills.map((row, i) => (
                  <div key={row.drill_name} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors">
                    <span className={`w-6 text-center text-sm font-bold ${
                      i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm text-white">{row.drill_name}</p>
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {row.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
