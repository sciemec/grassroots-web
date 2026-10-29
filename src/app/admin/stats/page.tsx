"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, Users, Heart, UserPlus, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  );
}

// ── Error banner ───────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-400" />
      <p className="font-medium text-red-700">{message}</p>
      <p className="mt-1 text-sm text-red-500">Check your connection and try again</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminStatsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  const { data, isLoading, isError } = useQuery<{ data: AnalyticsData }>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await api.get("/admin/analytics");
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const { data: arenaData, isLoading: arenaLoading, isError: arenaError } = useQuery<ArenaStats>({
    queryKey: ["admin-arena-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/stats/arena");
      return res.data;
    },
    enabled: !!user && user.role === "admin",
  });

  const analytics = data?.data;
  const arena     = arenaData;

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
            Platform Stats — Ongorora Nhamba
          </h1>
          <p className="text-sm text-gray-500">System-wide analytics and usage data</p>
        </div>
      </div>

      {/* Analytics error */}
      {isError && (
        <div className="mb-6">
          <ErrorBanner message="Failed to load analytics data" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Registrations by day */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: GRS_GREEN }} />
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Registrations by Day
            </p>
          </div>
          {isLoading ? <SectionSkeleton /> : !analytics?.registrations?.length ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">New Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.registrations.map((row) => (
                    <tr key={row.date} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">
                        {new Date(row.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sessions by day */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4" style={{ color: GRS_GREEN }} />
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Sessions by Day
            </p>
          </div>
          {isLoading ? <SectionSkeleton /> : !analytics?.sessions_by_day?.length ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.sessions_by_day.map((row) => (
                    <tr key={row.date} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">
                        {new Date(row.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verifications by status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Verifications by Status
          </p>
          {isLoading ? <SectionSkeleton /> : !analytics?.verifications?.length ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analytics.verifications.map((row) => (
                <span
                  key={row.status}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                    row.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : row.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Revenue by Month (USD)
          </p>
          {isLoading ? <SectionSkeleton /> : !analytics?.revenue_by_month?.length ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Month</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.revenue_by_month.map((row) => (
                    <tr key={row.month} className="transition-colors hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{row.month}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
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
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Subscriptions by Plan
          </p>
          {isLoading ? <SectionSkeleton /> : !analytics?.subscriptions?.length ? (
            <p className="text-sm text-gray-400">No data available</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analytics.subscriptions.map((row) => (
                <span
                  key={row.plan}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                    row.plan === "pro"
                      ? "bg-purple-100 text-purple-700"
                      : row.plan === "premium"
                      ? "bg-amber-100 text-amber-700"
                      : row.plan === "starter"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
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
          <BarChart2 className="h-4 w-4" style={{ color: GRS_GREEN }} />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            The Arena
          </h2>
        </div>

        {/* Arena error */}
        {arenaError && (
          <div className="mb-6">
            <ErrorBanner message="Failed to load Arena stats" />
          </div>
        )}

        {/* Summary tiles */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: "Total Posts",    value: arena?.summary.total_posts,        icon: BarChart2,      sub: `${arena?.summary.auto_posts ?? 0} auto · ${arena?.summary.manual_posts ?? 0} manual` },
              { label: "Reactions",      value: arena?.summary.total_likes,        icon: Heart,          sub: `${arena?.summary.total_comments ?? 0} comments` },
              { label: "Follows",        value: arena?.summary.total_follows,      icon: UserPlus,       sub: null },
              { label: "Connections",    value: arena?.summary.total_connections,  icon: Users,          sub: `${arena?.summary.accepted_connections ?? 0} accepted` },
            ] as { label: string; value: number | undefined; icon: React.ElementType; sub: string | null }[]
          ).map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-gray-400" />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              {arenaLoading ? (
                <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{(value ?? 0).toLocaleString()}</p>
                  {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Posts by type */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Posts by Type</p>
            {arenaLoading ? <SectionSkeleton /> : !arena?.by_type?.length ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-2">
                {arena.by_type.map((row) => {
                  const max = arena.by_type[0]?.count ?? 1;
                  const pct = Math.round((row.count / max) * 100);
                  return (
                    <div key={row.post_type} className="flex items-center gap-3">
                      <span className="w-28 truncate text-xs capitalize text-gray-500">{row.post_type.replace(/_/g, " ")}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GRS_GREEN }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-gray-900">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Posts by sport */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Posts by Sport</p>
            {arenaLoading ? <SectionSkeleton /> : !arena?.by_sport?.length ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-2">
                {arena.by_sport.map((row) => {
                  const max = arena.by_sport[0]?.count ?? 1;
                  const pct = Math.round((row.count / max) * 100);
                  return (
                    <div key={row.sport} className="flex items-center gap-3">
                      <span className="w-24 truncate text-xs capitalize text-gray-500">{row.sport}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-gray-900">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily posts — last 14 days */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Daily Posts (last 14 days)</p>
            {arenaLoading ? <SectionSkeleton /> : !arena?.daily_posts?.length ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Day</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Posts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {arena.daily_posts.slice(0, 14).map((row) => (
                      <tr key={row.day} className="transition-colors hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(row.day).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Posts by province */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Posts by Province</p>
            {arenaLoading ? <SectionSkeleton /> : !arena?.by_province?.length ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="space-y-2">
                {arena.by_province.map((row) => {
                  const max = arena.by_province[0]?.count ?? 1;
                  const pct = Math.round((row.count / max) * 100);
                  return (
                    <div key={row.province} className="flex items-center gap-3">
                      <span className="w-36 truncate text-xs text-gray-500">{row.province}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-gray-900">{row.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top posters */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Top Posters</p>
            {arenaLoading ? <SectionSkeleton /> : !arena?.top_posters?.length ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">User</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Role</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Posts</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Reactions</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {arena.top_posters.slice(0, 15).map((p, i) => (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <p className="max-w-[160px] truncate font-medium text-gray-900">{p.display_name}</p>
                          <p className="max-w-[160px] truncate text-xs text-gray-400">{p.email}</p>
                        </td>
                        <td className="px-3 py-2 text-xs capitalize text-gray-500">{p.role}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">{p.post_count}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{p.total_likes}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{p.total_comments}</td>
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
