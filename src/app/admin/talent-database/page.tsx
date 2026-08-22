"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Eye, EyeOff, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

function fmtAgeGroup(ag: string | null): string {
  if (!ag) return "—";
  const map: Record<string, string> = {
    under_13: "U13",
    "13_17":  "U17",
    "18_25":  "18-25",
    "26_plus": "26+",
  };
  return map[ag] ?? ag;
}

interface TalentPlayer {
  id: string;
  player_id: string | null;
  name: string;
  email: string;
  age_group: string | null;
  province: string | null;
  position: string | null;
  scout_visible: boolean;
  profile_complete_pct: number;
  last_active_at: string | null;
  created_at: string;
  is_suspended: boolean;
}

interface PageMeta {
  total: number;
  last_page: number;
}

const COMPLETION_OPTIONS = [
  { label: "Any", value: "" },
  { label: "25%+", value: "25" },
  { label: "50%+", value: "50" },
  { label: "75%+", value: "75" },
  { label: "100%", value: "100" },
];

const SCOUT_VIS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Visible", value: "true" },
  { label: "Hidden", value: "false" },
];

export default function AdminTalentDatabasePage() {
  const token = useAuthStore((s) => s.token);

  const [search, setSearch]           = useState("");
  const [province, setProvince]       = useState("");
  const [position, setPosition]       = useState("");
  const [scoutVis, setScoutVis]       = useState("");
  const [completionMin, setCompletionMin] = useState("");
  const [page, setPage]               = useState(1);

  // Build active query params
  const params = new URLSearchParams({ page: String(page), per_page: "25" });
  if (search)       params.set("search", search);
  if (province)     params.set("province", province);
  if (position)     params.set("position", position);
  if (scoutVis)     params.set("scout_visible", scoutVis);
  if (completionMin) params.set("completion_min", completionMin);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-talent-db", search, province, position, scoutVis, completionMin, page],
    queryFn: async () => {
      const res = await api.get(`/admin/talent-database?${params}`);
      return res.data as { data: TalentPlayer[]; total: number; last_page: number };
    },
    enabled: !!token,
    staleTime: 30_000,
  });

  const players: TalentPlayer[] = Array.isArray(data?.data) ? data.data : [];
  const meta: PageMeta          = { total: data?.total ?? 0, last_page: data?.last_page ?? 1 };

  function resetFilters() {
    setSearch(""); setProvince(""); setPosition("");
    setScoutVis(""); setCompletionMin(""); setPage(1);
  }

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleFilter<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <nav className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900">Talent Database</span>
        <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          Players only
        </span>
      </nav>

      <div className="mx-auto max-w-7xl p-4">

        {/* Filters row */}
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, player ID…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm focus:border-[#1a5c2a] focus:outline-none"
            />
          </div>

          {/* Province */}
          <input
            type="text"
            placeholder="Province"
            value={province}
            onChange={(e) => handleFilter(setProvince)(e.target.value)}
            className="h-9 w-36 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-[#1a5c2a] focus:outline-none"
          />

          {/* Position */}
          <input
            type="text"
            placeholder="Position"
            value={position}
            onChange={(e) => handleFilter(setPosition)(e.target.value)}
            className="h-9 w-36 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-[#1a5c2a] focus:outline-none"
          />

          {/* Scout Visible */}
          <select
            value={scoutVis}
            onChange={(e) => handleFilter(setScoutVis)(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-[#1a5c2a] focus:outline-none"
          >
            {SCOUT_VIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Scout: {o.label}</option>
            ))}
          </select>

          {/* Completion */}
          <select
            value={completionMin}
            onChange={(e) => handleFilter(setCompletionMin)(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-[#1a5c2a] focus:outline-none"
          >
            {COMPLETION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Profile: {o.label}</option>
            ))}
          </select>

          {/* Reset */}
          {(search || province || position || scoutVis || completionMin) && (
            <button
              onClick={resetFilters}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Summary row */}
        <p className="mb-3 text-xs text-gray-500">
          {isFetching ? (
            <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</span>
          ) : (
            <>{meta.total.toLocaleString()} player{meta.total !== 1 ? "s" : ""} found</>
          )}
        </p>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Scout</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No players match your filters.
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-gray-50 ${p.is_suspended ? "opacity-60" : ""}`}
                  >
                    {/* Player */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.player_id ?? p.email}</p>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{p.province ?? "—"}</p>
                      <p className="text-xs text-gray-400">{fmtAgeGroup(p.age_group)}</p>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 text-gray-700">
                      {p.position ?? <span className="text-gray-300">—</span>}
                    </td>

                    {/* Profile % */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${p.profile_complete_pct}%`,
                              backgroundColor:
                                p.profile_complete_pct >= 75 ? "#16a34a"
                                : p.profile_complete_pct >= 40 ? "#ca8a04"
                                : "#dc2626",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {p.profile_complete_pct}%
                        </span>
                      </div>
                    </td>

                    {/* Scout visible */}
                    <td className="px-4 py-3">
                      {p.scout_visible ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <Eye className="h-3 w-3" /> Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                    </td>

                    {/* Last Active */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {timeAgo(p.last_active_at)}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <span className="block text-sm font-medium text-gray-700">
                        {new Date(p.created_at).toLocaleDateString("en-ZW", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      <span className="block text-xs text-gray-400">{timeAgo(p.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {meta.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page >= meta.last_page}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
