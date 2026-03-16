"use client";

import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface DayCount       { date: string; count: number }
interface StatusCount    { status: string; count: number }
interface PlanCount      { plan: string; count: number }
interface MonthRevenue   { month: string; amount_usd: number }

interface AnalyticsData {
  registrations:    DayCount[];
  verifications:    StatusCount[];
  subscriptions:    PlanCount[];
  sessions_by_day:  DayCount[];
  revenue_by_month: MonthRevenue[];
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

  const { data, isLoading } = useQuery<{ data: AnalyticsData }>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
    enabled: !!user,
  });

  const analytics = data?.data;

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
            {isLoading ? <SectionSkeleton /> : !analytics?.registrations?.length ? (
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
                    {analytics.registrations.map((row) => (
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

          {/* Sessions by day */}
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Sessions by Day
              </p>
            </div>
            {isLoading ? <SectionSkeleton /> : !analytics?.sessions_by_day?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Sessions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics.sessions_by_day.map((row) => (
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

          {/* Verifications by status */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Verifications by Status
            </p>
            {isLoading ? <SectionSkeleton /> : !analytics?.verifications?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.verifications.map((row) => (
                  <span
                    key={row.status}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                      row.status === "approved"
                        ? "bg-green-500/15 text-green-700"
                        : row.status === "pending"
                        ? "bg-amber-500/15 text-amber-700"
                        : "bg-red-500/15 text-red-700"
                    }`}
                  >
                    {row.status}
                    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs font-bold">
                      {row.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by month */}
          <div className="rounded-xl border bg-card p-5">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Revenue by Month (USD)
            </p>
            {isLoading ? <SectionSkeleton /> : !analytics?.revenue_by_month?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Month</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analytics.revenue_by_month.map((row) => (
                      <tr key={row.month} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground">{row.month}</td>
                        <td className="px-3 py-2 text-right font-semibold text-white">
                          ${row.amount_usd.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Subscriptions by plan */}
          <div className="rounded-xl border bg-card p-5 lg:col-span-2">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Subscriptions by Plan
            </p>
            {isLoading ? <SectionSkeleton /> : !analytics?.subscriptions?.length ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analytics.subscriptions.map((row) => (
                  <span
                    key={row.plan}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                      row.plan === "pro"
                        ? "bg-purple-500/15 text-purple-700"
                        : row.plan === "premium"
                        ? "bg-amber-500/15 text-amber-700"
                        : row.plan === "starter"
                        ? "bg-blue-500/15 text-blue-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.plan}
                    <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs font-bold">
                      {row.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
