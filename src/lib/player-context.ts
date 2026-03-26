/**
 * Player Context Builder
 *
 * Fetches data from multiple endpoints in parallel and compiles
 * a single rich PlayerContext object. Every AI call in the Player Hub
 * uses this context so the AI knows exactly who it is talking to.
 *
 * Failures are silent — the context is built from whatever is available.
 * The AI always gets the best possible picture, never crashes on missing data.
 */

import api from "@/lib/api";

export interface RecentStat {
  sport: string;
  match_type: string;
  date: string;
  opponent?: string;
  result?: string;
  goals?: number;
  assists?: number;
  pass_accuracy?: number;
  tackles?: number;
  minutes_played?: number;
  [key: string]: string | number | undefined;
}

export interface PlayerContext {
  // Identity
  name: string;
  sport: string;
  position: string;
  ageGroup: string;
  province: string;
  club: string;
  school: string;

  // Physical
  heightCm: string;
  weightKg: string;
  preferredFoot: string;

  // Skill assessment
  skillScore: number | null;       // 0–100 overall score
  skillLevel: string | null;       // Beginner / Developing / Advanced / Elite
  assessmentTopTests: string[];    // names of top-scoring tests

  // Showcase (AI-analysed clips)
  showcaseTopSkill: string | null; // e.g. "dribbling"
  showcaseTopRating: number | null;// e.g. 8.2
  showcaseClipCount: number;
  showcaseScoutNote: string | null;

  // Recent match stats
  recentStats: RecentStat[];
  statsSummary: string;            // human-readable summary for prompt

  // Training activity
  sessionsThisWeek: number;
  lastSessionType: string | null;
  totalSessions: number;
}

/** Skill score → label */
function scoreLabel(score: number): string {
  if (score >= 80) return "Elite";
  if (score >= 65) return "Advanced";
  if (score >= 45) return "Developing";
  return "Beginner";
}

/** Build a plain-English stats summary from recent matches */
function buildStatsSummary(stats: RecentStat[]): string {
  if (!stats.length) return "No match stats recorded yet.";

  const totals: Record<string, number> = {};
  const keys = ["goals", "assists", "pass_accuracy", "tackles", "minutes_played"];

  for (const s of stats) {
    for (const k of keys) {
      if (typeof s[k] === "number") {
        totals[k] = (totals[k] ?? 0) + (s[k] as number);
      }
    }
  }

  const n = stats.length;
  const parts: string[] = [`Last ${n} match${n > 1 ? "es" : ""}:`];

  if (totals.goals !== undefined)         parts.push(`${totals.goals} goal${totals.goals !== 1 ? "s" : ""}`);
  if (totals.assists !== undefined)       parts.push(`${totals.assists} assist${totals.assists !== 1 ? "s" : ""}`);
  if (totals.pass_accuracy !== undefined) parts.push(`${Math.round(totals.pass_accuracy / n)}% pass accuracy`);
  if (totals.tackles !== undefined)       parts.push(`${totals.tackles} tackle${totals.tackles !== 1 ? "s" : ""}`);
  if (totals.minutes_played !== undefined) parts.push(`${totals.minutes_played} minutes played`);

  return parts.join(" · ");
}

/**
 * loadPlayerContext — call once on page mount.
 * Runs all API calls in parallel. Returns the best context available.
 */
export async function loadPlayerContext(user: {
  name?: string;
  sport?: string;
  position?: string;
  age_group?: string;
  province?: string;
}): Promise<PlayerContext> {

  const [profileRes, statsRes, showcaseRes, sessionsRes] = await Promise.allSettled([
    api.get("/profile"),
    api.get("/player/stats"),
    api.get("/player/showcase"),
    api.get("/player/sessions"),
  ]);

  // ── Profile ──────────────────────────────────────────────────────
  const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;

  // ── Stats ─────────────────────────────────────────────────────────
  const rawStats: RecentStat[] = statsRes.status === "fulfilled"
    ? (statsRes.value.data?.data ?? statsRes.value.data ?? [])
    : [];
  const recentStats = rawStats.slice(0, 5);

  // ── Showcase clips ────────────────────────────────────────────────
  const rawClips: {
    skill_type: string;
    ai_rating: number;
    scout_note: string;
    open_for_scouting: boolean;
  }[] = showcaseRes.status === "fulfilled"
    ? (showcaseRes.value.data?.data ?? showcaseRes.value.data ?? [])
    : [];

  const topClip = rawClips.length
    ? rawClips.reduce((best, c) => c.ai_rating > best.ai_rating ? c : best, rawClips[0])
    : null;

  // ── Sessions ──────────────────────────────────────────────────────
  const rawSessions: { type?: string; created_at?: string }[] =
    sessionsRes.status === "fulfilled"
      ? (sessionsRes.value.data?.data ?? sessionsRes.value.data ?? [])
      : [];

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sessionsThisWeek = rawSessions.filter((s) => {
    if (!s.created_at) return false;
    return new Date(s.created_at) >= weekAgo;
  }).length;

  const lastSession = rawSessions[0];

  // ── Assessment (embedded in profile or separate) ──────────────────
  // Assessment score may come back on the profile or as a separate field
  const skillScore: number | null =
    profile?.skill_score ?? profile?.overall_score ?? null;

  return {
    // Identity — prefer live profile, fall back to auth store
    name:          user.name ?? profile?.name ?? "Player",
    sport:         profile?.sport ?? user.sport ?? "football",
    position:      profile?.position ?? user.position ?? "Unknown",
    ageGroup:      profile?.age_group ?? user.age_group ?? "Unknown",
    province:      profile?.province ?? user.province ?? "Zimbabwe",
    club:          profile?.club ?? "Unknown",
    school:        profile?.school ?? "",

    // Physical
    heightCm:      profile?.height_cm ?? "",
    weightKg:      profile?.weight_kg ?? "",
    preferredFoot: profile?.preferred_foot ?? "",

    // Skill assessment
    skillScore,
    skillLevel:    skillScore !== null ? scoreLabel(skillScore) : null,
    assessmentTopTests: [],

    // Showcase
    showcaseTopSkill:   topClip?.skill_type ?? null,
    showcaseTopRating:  topClip?.ai_rating ?? null,
    showcaseClipCount:  rawClips.length,
    showcaseScoutNote:  topClip?.scout_note ?? null,

    // Stats
    recentStats,
    statsSummary: buildStatsSummary(recentStats),

    // Sessions
    sessionsThisWeek,
    lastSessionType: lastSession?.type ?? null,
    totalSessions:   rawSessions.length,
  };
}
