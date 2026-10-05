"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, Users, Heart, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
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

interface ArenaSummary {
  total_posts: number; auto_posts: number; manual_posts: number;
  total_likes: number; total_comments: number;
  total_follows: number; total_connections: number; accepted_connections: number;
}
interface ArenaTypeRow    { post_type: string; count: number }
interface ArenaSportRow   { sport: string; count: number }
interface ArenaProvinceRow { province: string; count: number }
interface ArenaDayRow     { day: string; count: number }
interface ArenaTopPoster  {
  id: string; display_name: string; email: string; role: string;
  province: string | null; post_count: number;
  total_likes: number; total_comments: number; last_posted_at: string;
}
interface ArenaStats {
  summary:      ArenaSummary;
  by_type:      ArenaTypeRow[];
  by_sport:     ArenaSportRow[];
  by_province:  ArenaProvinceRow[];
  daily_posts:  ArenaDayRow[];
  top_posters:  ArenaTopPoster[];
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
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery<{ data: AnalyticsData }>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
    enabled: !!user,
  });

  const { data: arenaData, isLoading: arenaLoading } = useQuery<ArenaStats>({
    queryKey: ["admin-arena-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats/arena");
      return res.data;
    },
    enabled: !!user,
  });

  const analytics = data?.data;
  const arena     = arenaData;

  return (
    <main className="gs-watermark overflow-auto p-6">

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

        {/* ── Arena Stats ─────────────────────────────────────────────────── */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              The Arena
            </h2>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(
              [
                { label: "Total Posts",    value: arena?.summary.total_posts,        icon: BarChart2,      sub: `${arena?.summary.auto_posts ?? 0} auto · ${arena?.summary.manual_posts ?? 0} manual` },
                { label: "Reactions",      value: arena?.summary.total_likes,        icon: Heart,          sub: `${arena?.summary.total_comments ?? 0} comments` },
                { label: "Follows",        value: arena?.summary.total_follows,      icon: UserPlus,       sub: null },
                { label: "Connections",    value: arena?.summary.total_connections,  icon: Users,          sub: `${arena?.summary.accepted_connections ?? 0} accepted` },
              ] as { label: string; value: number | undefined; icon: React.ElementType; sub: string | null }[]
            ).map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                {arenaLoading ? (
                  <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Posts by type */}
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts by Type</p>
              {arenaLoading ? <SectionSkeleton /> : !arena?.by_type?.length ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-2">
                  {arena.by_type.map((row) => {
                    const max = arena.by_type[0]?.count ?? 1;
                    const pct = Math.round((row.count / max) * 100);
                    return (
                      <div key={row.post_type} className="flex items-center gap-3">
                        <span className="w-28 text-xs text-muted-foreground capitalize truncate">{row.post_type.replace(/_/g, " ")}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold text-white">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Posts by sport */}
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts by Sport</p>
              {arenaLoading ? <SectionSkeleton /> : !arena?.by_sport?.length ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-2">
                  {arena.by_sport.map((row) => {
                    const max = arena.by_sport[0]?.count ?? 1;
                    const pct = Math.round((row.count / max) * 100);
                    return (
                      <div key={row.sport} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-muted-foreground capitalize truncate">{row.sport}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold text-white">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily posts — last 14 days */}
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Daily Posts (last 30 days)</p>
              {arenaLoading ? <SectionSkeleton /> : !arena?.daily_posts?.length ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Day</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Posts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {arena.daily_posts.slice(0, 14).map((row) => (
                        <tr key={row.day} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(row.day).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-white">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Posts by province */}
            <div className="rounded-xl border bg-card p-5">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts by Province</p>
              {arenaLoading ? <SectionSkeleton /> : !arena?.by_province?.length ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-2">
                  {arena.by_province.map((row) => {
                    const max = arena.by_province[0]?.count ?? 1;
                    const pct = Math.round((row.count / max) * 100);
                    return (
                      <div key={row.province} className="flex items-center gap-3">
                        <span className="w-36 text-xs text-muted-foreground truncate">{row.province}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs font-semibold text-white">{row.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top posters */}
            <div className="rounded-xl border bg-card p-5 lg:col-span-2">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Posters</p>
              {arenaLoading ? <SectionSkeleton /> : !arena?.top_posters?.length ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">User</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Posts</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Reactions</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {arena.top_posters.slice(0, 15).map((p, i) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-white truncate max-w-[160px]">{p.display_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{p.email}</p>
                          </td>
                          <td className="px-3 py-2 capitalize text-muted-foreground text-xs">{p.role}</td>
                          <td className="px-3 py-2 text-right font-semibold text-white">{p.post_count}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{p.total_likes}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{p.total_comments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

    </main>
  );
}
