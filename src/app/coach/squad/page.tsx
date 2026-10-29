"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users, Search, Activity, Zap, AlertTriangle,
  ShieldCheck, AlertCircle, Clock, RotateCcw, Filter,
} from "lucide-react";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SquadMemberFull {
  id: string;
  name: string;
  position: string;
  shirt_no: number | null;
  age_phase: string | null;
  age_group: string;
  gender: string | null;
  status: "fit" | "injured" | "caution";
  status_note: string | null;
  player_user_id: string | null;
  registration_id: string | null;
  removed_at: string | null;
  joined_at: string;
  photo_url: string | null;
  consent_status: string | null;
  match_status: string;
  stats: { sessions_14d: number; avg_score: number | null; last_session: string | null };
}

const AGE_GROUPS = ["U11", "U13", "U15", "U17", "U20", "Senior", "Unknown"];
const GENDERS    = ["Male", "Female", "Unknown"];

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

const STATUS_SOLID: Record<string, { bg: string; text: string }> = {
  fit:     { bg: "#dcfce7", text: "#15803d" },
  injured: { bg: "#fee2e2", text: "#b91c1c" },
  caution: { bg: "#fef3c7", text: "#b45309" },
};

// Keep for the table status select (uses Tailwind classes)
const STATUS_STYLES: Record<string, string> = {
  fit:     "bg-green-500/15 text-green-700",
  injured: "bg-red-500/15 text-red-700",
  caution: "bg-amber-500/15 text-amber-700",
};

function ini(name: string): string {
  return name.split(/\s+/).map((w) => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "?";
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-14 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ── Squad card (mobile / tablet) ───────────────────────────────────────────────

function SquadCard({
  m,
  showArchived,
  onRestore,
  restoreError,
}: {
  m: SquadMemberFull;
  showArchived: boolean;
  onRestore: (id: string) => void;
  restoreError: string | null;
}) {
  const pill = STATUS_SOLID[m.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  const ab   = ini(m.name);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      {/* Avatar + name + status */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
          style={{ background: GRS_GREEN }}
        >
          {m.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.photo_url} alt={ab} className="w-12 h-12 object-cover object-top" />
          ) : ab}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/coach/squad/${m.id}`}
            className="font-semibold text-gray-900 hover:underline truncate block"
          >
            {m.name}
          </Link>
          <p className="text-xs text-gray-500 truncate">
            {[m.position, m.age_group].filter(Boolean).join(" · ")}
          </p>
        </div>
        {showArchived ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 shrink-0">
            Archived
          </span>
        ) : (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize shrink-0"
            style={{ background: pill.bg, color: pill.text }}
          >
            {m.status}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {m.gender && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
            {m.gender === "Male" ? "♂" : "♀"} {m.gender}
          </span>
        )}
        {m.match_status === "pending_confirmation" && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Clock className="h-2.5 w-2.5" /> Confirm
          </span>
        )}
        {m.consent_status === "pending" && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
            Consent
          </span>
        )}
      </div>

      {/* Joined date + action */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Joined{" "}
          {m.joined_at
            ? new Date(m.joined_at).toLocaleDateString("en-ZW", {
                day: "numeric", month: "short", year: "numeric",
              })
            : "—"}
        </p>
        {showArchived ? (
          <div className="flex flex-col items-end gap-0.5">
            <button
              onClick={() => onRestore(m.id)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Restore
            </button>
            {restoreError === m.id && (
              <span className="text-[10px] text-red-600">Restore failed — try again</span>
            )}
          </div>
        ) : (
          <Link
            href={`/coach/squad/${m.id}`}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function SquadPageInner() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams() ?? new URLSearchParams();

  const [squad, setSquad]                         = useState<SquadMemberFull[]>([]);
  const [loading, setLoading]                     = useState(true);
  const [needsConfirmCount, setNeedsConfirmCount] = useState(0);
  const [showArchived, setShowArchived]           = useState(false);
  const [showFilters, setShowFilters]             = useState(false);
  const [activeTab, setActiveTab]                 = useState<"players" | "injuries" | "fatigue" | "chemistry">("players");
  const [page, setPage]                           = useState(1);
  const [fetchError, setFetchError]               = useState(false);
  const [restoreError, setRestoreError]           = useState<string | null>(null);

  // Filters live in URL query string
  const search            = params.get("search") ?? "";
  const filterGender      = params.get("gender") ?? "";
  const filterAgeGroup    = params.get("age_group") ?? "";
  const filterPosition    = params.get("position") ?? "";
  const filterStatus      = params.get("status") ?? "";
  const filterMatchStatus = params.get("match_status") ?? "";

  const setParam = useCallback((key: string, value: string) => {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value); else sp.delete(key);
    setPage(1);
    router.replace(`${pathname ?? "/coach/squad"}?${sp.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const clearFilters = useCallback(() => {
    setPage(1);
    router.replace(pathname ?? "/coach/squad", { scroll: false });
  }, [pathname, router]);

  const fetchSquad = useCallback((archived: boolean) => {
    setLoading(true);
    setFetchError(false);
    const url = archived ? "/coach/squad?include_archived=1" : "/coach/squad";
    api.get(url)
      .then((res) => {
        setSquad(Array.isArray(res.data?.data) ? res.data.data : []);
        if (!archived) setNeedsConfirmCount(res.data?.needs_confirmation_count ?? 0);
      })
      .catch((err) => {
        console.error("Squad fetch error:", err?.response?.status, err?.response?.data);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSquad(showArchived); }, [showArchived, fetchSquad]);

  const updateStatus = async (id: string, status: string) => {
    const prevStatus = squad.find((m) => m.id === id)?.status;
    setSquad((prev) => prev.map((m) => m.id === id ? { ...m, status: status as SquadMemberFull["status"] } : m));
    try {
      await api.patch(`/coach/squad/${id}`, { status });
    } catch {
      setSquad((prev) => prev.map((m) => m.id === id ? { ...m, status: (prevStatus ?? "fit") as SquadMemberFull["status"] } : m));
    }
  };

  const restorePlayer = async (id: string) => {
    setRestoreError(null);
    try {
      await api.post(`/coach/squad/${id}/restore`);
      setSquad((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setRestoreError(id);
    }
  };

  const filtered = useMemo(() => squad.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.position.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGender) {
      const g = m.gender ?? "Unknown";
      if (g !== filterGender) return false;
    }
    if (filterAgeGroup && m.age_group !== filterAgeGroup) return false;
    if (filterPosition && m.position.toLowerCase() !== filterPosition.toLowerCase()) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterMatchStatus && m.match_status !== filterMatchStatus) return false;
    return true;
  }), [squad, search, filterGender, filterAgeGroup, filterPosition, filterStatus, filterMatchStatus]);

  const counts = useMemo(() => ({
    total:   squad.length,
    fit:     squad.filter((m) => m.status === "fit").length,
    caution: squad.filter((m) => m.status === "caution").length,
    injured: squad.filter((m) => m.status === "injured").length,
  }), [squad]);

  const hasFilters       = !!(search || filterGender || filterAgeGroup || filterPosition || filterStatus || filterMatchStatus);
  const otherFiltersCount = [filterGender, filterAgeGroup, filterPosition, filterMatchStatus].filter(Boolean).length;

  const PER_PAGE   = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const TABS = [
    { id: "players"   as const, label: "Players",   icon: Users },
    { id: "injuries"  as const, label: "Injuries",  icon: AlertTriangle },
    { id: "fatigue"   as const, label: "Fatigue",   icon: Activity },
    { id: "chemistry" as const, label: "Chemistry", icon: Zap },
  ];

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6" style={{ backgroundColor: BG }}>
      <main className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: GRS_GREEN }}>My Squad</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {squad.length} player{squad.length !== 1 ? "s" : ""}
              {needsConfirmCount > 0 && !showArchived && (
                <button
                  onClick={() => setParam("match_status", filterMatchStatus === "pending_confirmation" ? "" : "pending_confirmation")}
                  className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-200 transition-colors"
                >
                  <Clock className="h-3 w-3" />
                  {needsConfirmCount} need{needsConfirmCount === 1 ? "s" : ""} confirmation
                </button>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                showArchived
                  ? { background: "#e5e7eb", color: "#111827", borderColor: "#d1d5db" }
                  : { background: "white",   color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {showArchived ? "← Active" : "Archived"}
            </button>
            {!showArchived && activeTab === "players" && (
              <Link
                href="/coach/registered-players"
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: GRS_GREEN }}
              >
                Register player
              </Link>
            )}
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === id ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
              style={activeTab === id ? { color: GRS_GREEN } : {}}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════ PLAYERS TAB ══════════════════════════════ */}
        {activeTab === "players" && (<>

          {/* Summary row — tappable status filters */}
          {!loading && !fetchError && !showArchived && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setParam("status", "")}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold border transition-colors"
                style={
                  !filterStatus
                    ? { background: GRS_GREEN, color: "white",   borderColor: GRS_GREEN }
                    : { background: "white",   color: "#6b7280", borderColor: "#e5e7eb" }
                }
              >
                {counts.total} total
              </button>
              {(["fit", "caution", "injured"] as const).map((s) => {
                const active = filterStatus === s;
                const st     = STATUS_SOLID[s];
                return (
                  <button
                    key={s}
                    onClick={() => setParam("status", active ? "" : s)}
                    className="rounded-full px-3.5 py-1.5 text-sm font-semibold border capitalize transition-colors"
                    style={{
                      background:  active ? st.bg    : "white",
                      color:       active ? st.text  : "#6b7280",
                      borderColor: active ? st.bg    : "#e5e7eb",
                    }}
                  >
                    {counts[s]} {s}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search + Filters button */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={(e) => setParam("search", e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-9 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setParam("search", "")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors shrink-0"
              style={{
                borderColor: otherFiltersCount > 0 ? GOLD    : "#d1d5db",
                color:       otherFiltersCount > 0 ? GOLD    : "#6b7280",
                background:  otherFiltersCount > 0 ? "#fffbeb" : "white",
              }}
            >
              <Filter size={15} />
              Filters
              {otherFiltersCount > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-semibold"
                  style={{ background: GOLD }}
                >
                  {otherFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-4">

              {/* Gender */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Gender</p>
                <div className="flex flex-wrap gap-2">
                  {["", ...GENDERS].map((g) => {
                    const label  = g === "" ? "All" : g;
                    const active = filterGender === g;
                    return (
                      <button
                        key={label}
                        onClick={() => setParam("gender", g)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={{
                          background:  active ? GRS_GREEN : "white",
                          color:       active ? "white"   : "#374151",
                          borderColor: active ? GRS_GREEN : "#d1d5db",
                        }}
                      >
                        {g === "Male" ? "♂ Male" : g === "Female" ? "♀ Female" : label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age group */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Age group</p>
                <div className="flex flex-wrap gap-2">
                  {["", ...AGE_GROUPS].map((ag) => {
                    const label  = ag === "" ? "All" : ag;
                    const active = filterAgeGroup === ag;
                    return (
                      <button
                        key={label}
                        onClick={() => setParam("age_group", ag)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={{
                          background:  active ? GRS_GREEN : "white",
                          color:       active ? "white"   : "#374151",
                          borderColor: active ? GRS_GREEN : "#d1d5db",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Position */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Position</p>
                <div className="flex flex-wrap gap-2">
                  {["", "goalkeeper", "defender", "midfielder", "forward", "striker", "winger"].map((p) => {
                    const label  = p === "" ? "All" : p.charAt(0).toUpperCase() + p.slice(1);
                    const active = filterPosition === p;
                    return (
                      <button
                        key={label}
                        onClick={() => setParam("position", p)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                        style={{
                          background:  active ? GRS_GREEN : "white",
                          color:       active ? "white"   : "#374151",
                          borderColor: active ? GRS_GREEN : "#d1d5db",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Needs confirmation */}
              {needsConfirmCount > 0 && !showArchived && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Registration</p>
                  <button
                    onClick={() => setParam("match_status", filterMatchStatus === "pending_confirmation" ? "" : "pending_confirmation")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    style={
                      filterMatchStatus === "pending_confirmation"
                        ? { background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }
                        : { background: "white",   color: "#6b7280", borderColor: "#d1d5db" }
                    }
                  >
                    <Clock className="h-3 w-3" />
                    Needs confirmation ({needsConfirmCount})
                  </button>
                </div>
              )}

              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:underline">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>

          ) : fetchError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-medium text-red-700 mb-3">Could not load your squad</p>
              <button
                onClick={() => fetchSquad(showArchived)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: GRS_GREEN }}
              >
                Retry
              </button>
            </div>

          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="font-medium text-gray-700">
                {squad.length === 0
                  ? showArchived ? "No archived players" : "No players yet"
                  : "No players match your filters"}
              </p>
              {squad.length === 0 && !showArchived && (
                <div className="mt-4">
                  <Link
                    href="/coach/registered-players"
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: GRS_GREEN }}
                  >
                    Register a player
                  </Link>
                </div>
              )}
            </div>

          ) : (<>

            {/* Mobile / tablet card grid — hidden on lg+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
              {paginated.map((m) => (
                <SquadCard
                  key={m.id}
                  m={m}
                  showArchived={showArchived}
                  onRestore={restorePlayer}
                  restoreError={restoreError}
                />
              ))}
            </div>

            {/* Wide-screen table — hidden below lg */}
            <div className="hidden lg:block overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Player</th>
                      <th className="px-4 py-3 font-medium">Position</th>
                      <th className="px-4 py-3 font-medium">Age group</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: GRS_GREEN }}
                          >
                            {m.shirt_no ?? ini(m.name).slice(0, 1)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          <div className="flex flex-wrap items-center gap-1">
                            <Link
                              href={`/coach/squad/${m.id}`}
                              className="hover:underline"
                              style={{ color: GRS_GREEN }}
                            >
                              {m.name}
                            </Link>
                            {m.match_status === "pending_confirmation" && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                <Clock className="h-2.5 w-2.5" /> Confirm
                              </span>
                            )}
                            {m.consent_status === "pending" && (
                              <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                                Consent
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 capitalize text-gray-500">{m.position}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{m.age_group}</td>
                        <td className="px-4 py-3.5">
                          {showArchived ? (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                              Archived
                            </span>
                          ) : (
                            <select
                              value={m.status}
                              onChange={(e) => updateStatus(m.id, e.target.value)}
                              className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ${STATUS_STYLES[m.status] ?? "bg-gray-100 text-gray-500"}`}
                            >
                              <option value="fit">Fit</option>
                              <option value="caution">Caution</option>
                              <option value="injured">Injured</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {m.joined_at
                            ? new Date(m.joined_at).toLocaleDateString("en-ZW", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {showArchived ? (
                            <div className="flex flex-col items-start gap-1">
                              <button
                                onClick={() => restorePlayer(m.id)}
                                className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Restore
                              </button>
                              {restoreError === m.id && (
                                <span className="text-[10px] text-red-600">Restore failed — try again</span>
                              )}
                            </div>
                          ) : (
                            <Link
                              href={`/coach/squad/${m.id}`}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            >
                              View →
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>)}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400">{safePage} / {totalPages}</span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          )}

        </>)} {/* end Players tab */}

        {/* ══════════════════════ INJURIES TAB ═════════════════════════════ */}
        {activeTab === "injuries" && (() => {
          const injured = squad.filter((m) => m.status === "injured");
          const caution = squad.filter((m) => m.status === "caution");
          const fit     = squad.filter((m) => m.status === "fit");

          const Group = ({
            title, icon: Icon, colour, players, emptyMsg,
          }: {
            title: string; icon: React.ElementType; colour: string;
            players: SquadMemberFull[]; emptyMsg: string;
          }) => (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${colour}`}>
                <Icon className="h-4 w-4" />
                <span className="font-semibold text-sm">{title}</span>
                <span className="ml-auto text-xs opacity-70">{players.length}</span>
              </div>
              {players.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">{emptyMsg}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {players.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: GRS_GREEN }}
                      >
                        {m.shirt_no ?? ini(m.name).slice(0, 1)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{m.position}</p>
                      </div>
                      <select
                        value={m.status}
                        onChange={(e) => updateStatus(m.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ${STATUS_STYLES[m.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        <option value="fit">Fit</option>
                        <option value="caution">Caution</option>
                        <option value="injured">Injured</option>
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );

          return (
            <div className="grid gap-4 sm:grid-cols-3">
              <Group title="Injured"  icon={AlertCircle}   colour="bg-red-50 text-red-700"     players={injured} emptyMsg="No injured players" />
              <Group title="Caution"  icon={AlertTriangle} colour="bg-amber-50 text-amber-700" players={caution} emptyMsg="No players on caution" />
              <Group title="Fit"      icon={ShieldCheck}   colour="bg-green-50 text-green-700" players={fit}     emptyMsg="No players marked fit yet" />
            </div>
          );
        })()}

        {/* ══════════════════════ FATIGUE TAB ══════════════════════════════ */}
        {activeTab === "fatigue" && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Activity className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-gray-900">Fatigue Monitor</h2>
            <p className="mb-6 text-sm text-gray-500 max-w-xs mx-auto">
              Track training load, recovery times, and overtraining risk for every player in your squad.
            </p>
            <Link
              href="/coach/fatigue"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: GRS_GREEN }}
            >
              Open Fatigue Monitor →
            </Link>
          </div>
        )}

        {/* ══════════════════════ CHEMISTRY TAB ════════════════════════════ */}
        {activeTab === "chemistry" && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
              <Zap className="h-7 w-7 text-violet-600" />
            </div>
            <h2 className="mb-1 text-lg font-bold text-gray-900">Squad Chemistry</h2>
            <p className="mb-6 text-sm text-gray-500 max-w-xs mx-auto">
              Analyse how well your players gel — playing style compatibility, positional chemistry, and combination scores.
            </p>
            <Link
              href="/coach/chemistry"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: GRS_GREEN }}
            >
              Open Chemistry →
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}

export default function CoachSquadPage() {
  return (
    <Suspense>
      <SquadPageInner />
    </Suspense>
  );
}
