"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserSearch, Search, Loader2, ChevronRight, Zap, Trophy, TrendingUp, Filter } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerSession {
  id: string;
  focus_area: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
  email: string;
  age_group: string;
  province: string;
  verified_at: string | null;
  sessions?: PlayerSession[];
  talent_score?: number;
  grade?: { label: string; color: string };
  top_skill?: string;
}

// ─── Scoring (mirrors talent-id page logic) ───────────────────────────────────

const GRADES = [
  { min: 90, label: "Elite",    color: "#f59e0b" },
  { min: 75, label: "Advanced", color: "#22c55e" },
  { min: 60, label: "Progress", color: "#3b82f6" },
  { min: 45, label: "Develop",  color: "#a855f7" },
  { min: 0,  label: "Building", color: "#6b7280" },
];

function getGrade(score: number) {
  return GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1];
}

function quickScore(sessions: PlayerSession[]): number {
  const done = sessions.filter((s) => s.status === "completed" && s.overall_score !== null);
  if (done.length === 0) return 0;
  const avg = done.reduce((s, x) => s + (x.overall_score ?? 0), 0) / done.length;
  const commitment = Math.min(100, (done.length / 50) * 100);
  return Math.round(avg * 0.6 + commitment * 0.4);
}

function topSkill(sessions: PlayerSession[]): string {
  const done = sessions.filter((s) => s.status === "completed" && s.overall_score !== null && s.focus_area);
  const map: Record<string, number[]> = {};
  done.forEach((s) => {
    map[s.focus_area] = map[s.focus_area] ?? [];
    map[s.focus_area].push(s.overall_score ?? 0);
  });
  const entries = Object.entries(map).map(([k, v]) => ({
    skill: k,
    avg: v.reduce((a, b) => a + b, 0) / v.length,
  }));
  entries.sort((a, b) => b.avg - a.avg);
  return entries[0]?.skill ?? "—";
}

// ─── Player card ──────────────────────────────────────────────────────────────

function PlayerCard({ player, onClick }: { player: Player; onClick: () => void }) {
  const score = player.talent_score ?? 0;
  const grade = player.grade ?? getGrade(score);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-white/10 bg-card/60 p-4 text-left transition-all hover:border-primary/40 hover:bg-white/5 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
          {player.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-white">{player.name}</p>
            {player.verified_at && (
              <span className="flex-shrink-0 rounded-full bg-green-500/20 px-1.5 py-0.5 text-[10px] font-bold text-green-400">✓ Verified</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize">
            {player.age_group?.replace("u", "U") ?? "—"} · {player.province ?? "Unknown"}
          </p>
          {player.top_skill && player.top_skill !== "—" && (
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">Top skill: <span className="text-white/70">{player.top_skill}</span></p>
          )}
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0 text-right">
          {score > 0 ? (
            <>
              <div className="text-lg font-black" style={{ color: grade.color }}>{score}</div>
              <div className="text-[10px] font-bold" style={{ color: grade.color }}>{grade.label}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">No data</div>
          )}
        </div>

        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </div>

      {/* Mini score bar */}
      {score > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: grade.color }}
          />
        </div>
      )}
    </button>
  );
}

// ─── Player detail drawer ──────────────────────────────────────────────────────

function PlayerDrawer({ player, onClose }: { player: Player; onClose: () => void }) {
  const score = player.talent_score ?? 0;
  const grade = player.grade ?? getGrade(score);
  const sessions = player.sessions ?? [];
  const done = sessions.filter((s) => s.status === "completed");

  // Per-skill breakdown
  const map: Record<string, number[]> = {};
  done.forEach((s) => {
    if (!s.focus_area || s.overall_score === null) return;
    map[s.focus_area] = map[s.focus_area] ?? [];
    map[s.focus_area].push(s.overall_score);
  });
  const skills = Object.entries(map)
    .map(([k, v]) => ({ skill: k, avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 lg:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-black text-primary">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">{player.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {player.age_group?.replace("u", "U") ?? "—"} · {player.province ?? "—"}
            </p>
          </div>
          {score > 0 && (
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: grade.color }}>{score}</div>
              <div className="text-xs font-bold" style={{ color: grade.color }}>{grade.label}</div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Trophy, label: "Sessions", value: String(done.length) },
            { icon: TrendingUp, label: "Avg score", value: score > 0 ? `${score}%` : "—" },
            { icon: Zap, label: "Top skill", value: player.top_skill ?? "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-white capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Skill breakdown */}
        {skills.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill Breakdown</p>
            <div className="space-y-2">
              {skills.slice(0, 6).map(({ skill, avg }) => {
                const g = getGrade(avg);
                return (
                  <div key={skill}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-white/80">{skill}</span>
                      <span className="font-bold" style={{ color: g.color }}>{avg}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: g.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-white/10 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const GRADE_FILTERS = ["All", "Elite", "Advanced", "Progress", "Develop", "Building", "No data"];

export default function ScoutingDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"score" | "name" | "sessions">("score");
  const [selected, setSelected] = useState<Player | null>(null);

  useEffect(() => {
    if (!user) return; // guests allowed — shows empty scouting board
  }, [user, router]);

  useEffect(() => {
    // Fetch squad members with their session data
    api.get("/coach/squad")
      .then(async (res) => {
        const squad = res.data?.data ?? res.data ?? [];
        // Enrich each player with session data
        const enriched: Player[] = await Promise.all(
          squad.map(async (member: { player: Player; player_id: string }) => {
            const p: Player = member.player ?? member;
            try {
              const sRes = await api.get(`/sessions?player_id=${p.id}&per_page=100&status=completed`);
              const sessions: PlayerSession[] = sRes.data?.data ?? sRes.data ?? [];
              const score = quickScore(sessions);
              return {
                ...p,
                sessions,
                talent_score: score,
                grade: getGrade(score),
                top_skill: topSkill(sessions),
              };
            } catch {
              return { ...p, sessions: [], talent_score: 0, grade: getGrade(0), top_skill: "—" };
            }
          })
        );
        setPlayers(enriched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = players
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name.toLowerCase().includes(q) ||
        (p.province ?? "").toLowerCase().includes(q) ||
        (p.age_group ?? "").toLowerCase().includes(q);
      const score = p.talent_score ?? 0;
      const grade = p.grade?.label ?? "Building";
      const matchGrade =
        gradeFilter === "All" ||
        (gradeFilter === "No data" && score === 0) ||
        (gradeFilter !== "No data" && grade === gradeFilter);
      return matchSearch && matchGrade;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.talent_score ?? 0) - (a.talent_score ?? 0);
      if (sortBy === "sessions") return (b.sessions?.length ?? 0) - (a.sessions?.length ?? 0);
      return a.name.localeCompare(b.name);
    });

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserSearch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Scouting Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading players…" : `${filtered.length} of ${players.length} players`}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading squad data…
            </div>
          ) : players.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card/60 p-10 text-center">
              <UserSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-white">No squad members yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add players to your squad from the My Squad page first.</p>
            </div>
          ) : (
            <>
              {/* Search + sort */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search players…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-card/60 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="rounded-lg border border-white/10 bg-card/60 py-2.5 pl-7 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
                  >
                    <option value="score">Sort: Score</option>
                    <option value="sessions">Sort: Sessions</option>
                    <option value="name">Sort: Name</option>
                  </select>
                </div>
              </div>

              {/* Grade filter pills */}
              <div className="flex flex-wrap gap-2">
                {GRADE_FILTERS.map((g) => {
                  const gradeConf = GRADES.find((gr) => gr.label === g);
                  const count = g === "All"
                    ? players.length
                    : g === "No data"
                    ? players.filter((p) => !p.talent_score).length
                    : players.filter((p) => p.grade?.label === g).length;
                  return (
                    <button
                      key={g}
                      onClick={() => setGradeFilter(g)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        gradeFilter === g
                          ? "bg-primary text-primary-foreground"
                          : "border border-white/10 bg-card/60 text-muted-foreground hover:bg-white/10"
                      }`}
                      style={gradeFilter === g && gradeConf ? { backgroundColor: gradeConf.color, color: "#000" } : undefined}
                    >
                      {g} {count > 0 && <span className="opacity-70">({count})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Player list */}
              <div className="space-y-3">
                {filtered.map((p) => (
                  <PlayerCard key={p.id} player={p} onClick={() => setSelected(p)} />
                ))}
                {filtered.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">No players match your filters.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Player detail drawer */}
      {selected && <PlayerDrawer player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
