"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Search, Activity, Zap, AlertTriangle,
  ShieldCheck, AlertCircle, Clock, RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

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

const STATUS_STYLES: Record<string, string> = {
  fit:     "bg-green-500/15 text-green-700",
  injured: "bg-red-500/15 text-red-700",
  caution: "bg-amber-500/15 text-amber-700",
};

function SquadPageInner() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const [squad, setSquad]                     = useState<SquadMemberFull[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [needsConfirmCount, setNeedsConfirmCount] = useState(0);
  const [showArchived, setShowArchived]       = useState(false);
  const [activeTab, setActiveTab]             = useState<"players" | "injuries" | "fatigue" | "chemistry">("players");
  const [page, setPage]                       = useState(1);

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
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }, [params, pathname, router]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const fetchSquad = useCallback((archived: boolean) => {
    setLoading(true);
    const url = archived ? "/coach/squad?include_archived=1" : "/coach/squad";
    api.get(url)
      .then((res) => {
        setSquad(Array.isArray(res.data?.data) ? res.data.data : []);
        if (!archived) setNeedsConfirmCount(res.data?.needs_confirmation_count ?? 0);
      })
      .catch((err) => {
        console.error("Squad fetch error:", err?.response?.status, err?.response?.data);
        setSquad([]);
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
    await api.post(`/coach/squad/${id}/restore`).catch(() => {});
    setSquad((prev) => prev.filter((m) => m.id !== id));
  };

  const filtered = squad.filter((m) => {
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
  });

  const hasFilters = !!(search || filterGender || filterAgeGroup || filterPosition || filterStatus || filterMatchStatus);

  const PER_PAGE  = 20;
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
    <div className="flex-1 overflow-auto p-6">
      <main className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#f0b429" }}>My Squad</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm" style={{ color: "#f0b429", opacity: 0.75 }}>
                  {squad.length} player{squad.length !== 1 ? "s" : ""}
                </p>
                {needsConfirmCount > 0 && !showArchived && (
                  <button
                    onClick={() => setParam("match_status", filterMatchStatus === "pending_confirmation" ? "" : "pending_confirmation")}
                    className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-500/25 transition-colors"
                  >
                    <Clock className="h-3 w-3" />
                    {needsConfirmCount} need{needsConfirmCount === 1 ? "s" : ""} confirmation
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                showArchived ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {showArchived ? "← Active" : "Archived"}
            </button>
            {!showArchived && activeTab === "players" && (
              <Link
                href="/coach/registered-players"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Register player
              </Link>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl border bg-muted/30 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                activeTab === id ? "bg-card shadow-sm" : "hover:text-foreground"
              }`}
              style={{ color: activeTab === id ? "#f0b429" : "rgba(240,180,41,0.55)" }}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── PLAYERS TAB ──────────────────────────────────────────── */}
        {activeTab === "players" && (<>

        {/* Filter bar */}
        <div className="mb-5 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setParam("search", e.target.value)}
              className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status pills */}
            {["all", "fit", "caution", "injured"].map((s) => (
              <button
                key={s}
                onClick={() => setParam("status", s === "all" ? "" : s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  (filterStatus === s || (s === "all" && !filterStatus))
                    ? "bg-primary text-primary-foreground"
                    : "border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}

            <span className="h-4 w-px bg-border mx-1" />

            {/* Gender select */}
            <select
              value={filterGender}
              onChange={(e) => setParam("gender", e.target.value)}
              className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground outline-none cursor-pointer hover:bg-muted"
            >
              <option value="">All genders</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            {/* Age group select */}
            <select
              value={filterAgeGroup}
              onChange={(e) => setParam("age_group", e.target.value)}
              className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground outline-none cursor-pointer hover:bg-muted"
            >
              <option value="">All ages</option>
              {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            {/* Position select */}
            <select
              value={filterPosition}
              onChange={(e) => setParam("position", e.target.value)}
              className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground outline-none cursor-pointer hover:bg-muted"
            >
              <option value="">All positions</option>
              {["goalkeeper","defender","midfielder","forward","striker","winger"].map((p) => (
                <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>

            {/* Needs-confirmation filter pill */}
            {needsConfirmCount > 0 && !showArchived && (
              <button
                onClick={() => setParam("match_status", filterMatchStatus === "pending_confirmation" ? "" : "pending_confirmation")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filterMatchStatus === "pending_confirmation"
                    ? "bg-amber-500 text-white"
                    : "bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500/25"
                }`}
              >
                <Clock className="h-3 w-3" />
                Needs confirmation
              </button>
            )}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Squad table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">
              {squad.length === 0
                ? showArchived ? "No archived players" : "No players yet"
                : "No players match your filters"}
            </p>
            {squad.length === 0 && !showArchived && (
              <div className="mt-4">
                <Link
                  href="/coach/registered-players"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Register a player
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Position</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Age group</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {m.shirt_no ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link href={`/coach/squad/${m.id}`} className="hover:text-primary transition-colors">
                            {m.name}
                          </Link>
                          {m.match_status === "pending_confirmation" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              <Clock className="h-2.5 w-2.5" /> Confirm
                            </span>
                          )}
                          {m.consent_status === "pending" && (
                            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                              Consent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-muted-foreground">{m.position}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground hidden sm:table-cell">{m.age_group}</td>
                      <td className="px-4 py-3.5">
                        {showArchived ? (
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Archived</span>
                        ) : (
                          <select
                            value={m.status}
                            onChange={(e) => updateStatus(m.id, e.target.value)}
                            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ${STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground"}`}
                          >
                            <option value="fit">Fit</option>
                            <option value="caution">Caution</option>
                            <option value="injured">Injured</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                        {m.joined_at
                          ? new Date(m.joined_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {showArchived ? (
                          <button
                            onClick={() => restorePlayer(m.id)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                        ) : (
                          <Link
                            href={`/coach/squad/${m.id}`}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
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
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {filtered.length} player{filtered.length !== 1 ? "s" : ""}
              {" · "}page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    n === safePage
                      ? "bg-primary text-primary-foreground"
                      : "border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        </>)} {/* end Players tab */}

        {/* ── INJURIES TAB ─────────────────────────────────────────── */}
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
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${colour}`}>
                <Icon className="h-4 w-4" />
                <span className="font-semibold text-sm">{title}</span>
                <span className="ml-auto text-xs opacity-70">{players.length}</span>
              </div>
              {players.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyMsg}</p>
              ) : (
                <ul className="divide-y">
                  {players.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {m.shirt_no ?? "—"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.position}</p>
                      </div>
                      <select
                        value={m.status}
                        onChange={(e) => updateStatus(m.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ${STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground"}`}
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
              <Group title="Injured"  icon={AlertCircle}   colour="bg-red-500/10 text-red-700"    players={injured} emptyMsg="No injured players" />
              <Group title="Caution"  icon={AlertTriangle} colour="bg-amber-500/10 text-amber-700" players={caution} emptyMsg="No players on caution" />
              <Group title="Fit"      icon={ShieldCheck}   colour="bg-green-500/10 text-green-700" players={fit}     emptyMsg="No players marked fit yet" />
            </div>
          );
        })()}

        {/* ── FATIGUE TAB ──────────────────────────────────────────── */}
        {activeTab === "fatigue" && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Activity className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="mb-1 text-lg font-bold">Fatigue Monitor</h2>
            <p className="mb-6 text-sm text-muted-foreground max-w-xs mx-auto">
              Track training load, recovery times, and overtraining risk for every player in your squad.
            </p>
            <Link href="/coach/fatigue" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Open Fatigue Monitor →
            </Link>
          </div>
        )}

        {/* ── CHEMISTRY TAB ────────────────────────────────────────── */}
        {activeTab === "chemistry" && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10">
              <Zap className="h-7 w-7 text-violet-600" />
            </div>
            <h2 className="mb-1 text-lg font-bold">Squad Chemistry</h2>
            <p className="mb-6 text-sm text-muted-foreground max-w-xs mx-auto">
              Analyse how well your players gel — playing style compatibility, positional chemistry, and combination scores.
            </p>
            <Link href="/coach/chemistry" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
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