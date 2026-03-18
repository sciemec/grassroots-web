/**
 * Offline AI Engine — Grassroots Sport
 *
 * Searches the local knowledge base JSON files (served from /data/) when both
 * the Laravel backend and the Claude proxy are unavailable (no internet).
 *
 * Architecture:
 *  1. Fetch JSON files from /data/ on first use — cached in module memory.
 *  2. Tokenise the user query and score every knowledge entry against it.
 *  3. Return the best-matching entries, formatted as a coaching response.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface Drill {
  id: string;
  name: string;
  category?: string;
  skill?: string;
  difficulty?: string;
  duration_minutes?: number;
  players?: string;
  equipment?: string[];
  setup?: string;
  instructions?: string[];
  coaching_points?: string[];
  when_to_use?: string;
  age_phase?: string[];
}

interface Technique {
  name: string;
  description?: string;
  steps?: string[];
}

interface SkillEntry {
  description?: string;
  key_words?: string[];
  techniques?: Technique[];
  faults_and_fixes?: { fault: string; fix: string; drill?: string }[];
}

interface Phase {
  id: string;
  name: string;
  label: string;
  age_range?: string;
  focus?: string;
  description?: string;
  training_guidelines?: {
    sessions_per_week?: number;
    session_duration_minutes?: number;
    session_structure?: { component: string; duration_minutes: number }[];
    ratio?: string;
    ball_size?: string;
  };
  physical_milestones?: string[];
  technical_milestones?: string[];
}

interface SessionProgramme {
  id?: string;
  name?: string;
  phase?: string;
  duration?: string;
  weeks?: unknown[];
  description?: string;
}

// ─── Module-level cache ─────────────────────────────────────────────────────

let _drills: Drill[] | null = null;
let _skills: Record<string, SkillEntry> | null = null;
let _phases: Phase[] | null = null;
let _nutrition: Record<string, unknown> | null = null;
let _sessions: SessionProgramme[] | null = null;
let _footballGuide: Record<string, unknown> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

async function ensureLoaded(): Promise<void> {
  const loads: Promise<void>[] = [];

  if (!_drills) {
    loads.push(
      fetchJson<{ drills: Drill[] }>("/data/drill_library.json")
        .then((d) => { _drills = d.drills ?? []; })
        .catch(() => { _drills = []; })
    );
  }

  if (!_skills) {
    loads.push(
      fetchJson<{ skills: Record<string, SkillEntry> }>("/data/coaching_knowledge.json")
        .then((d) => { _skills = d.skills ?? {}; })
        .catch(() => { _skills = {}; })
    );
  }

  if (!_phases) {
    loads.push(
      fetchJson<{ phases: Phase[] }>("/data/development_phases.json")
        .then((d) => { _phases = d.phases ?? []; })
        .catch(() => { _phases = []; })
    );
  }

  if (!_nutrition) {
    loads.push(
      fetchJson<Record<string, unknown>>("/data/nutrition_advice.json")
        .then((d) => { _nutrition = d; })
        .catch(() => { _nutrition = {}; })
    );
  }

  if (!_sessions) {
    loads.push(
      fetchJson<{ programmes?: SessionProgramme[] } | SessionProgramme[]>("/data/session_programmes.json")
        .then((d) => {
          _sessions = Array.isArray(d) ? d : (d as { programmes?: SessionProgramme[] }).programmes ?? [];
        })
        .catch(() => { _sessions = []; })
    );
  }

  if (!_footballGuide) {
    loads.push(
      fetchJson<Record<string, unknown>>("/data/football_guide.json")
        .then((d) => { _footballGuide = d; })
        .catch(() => { _footballGuide = {}; })
    );
  }

  await Promise.all(loads);
}

// ─── Tokeniser ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "i", "my", "me", "we", "our", "you", "your", "do", "how",
  "what", "give", "get", "need", "want", "can", "is", "are", "for", "to", "of",
  "and", "or", "in", "on", "at", "with", "should", "help", "tell", "some",
  "any", "this", "that", "it", "be", "have", "has", "am", "was", "were",
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function score(tokens: string[], text: string): number {
  const lower = text.toLowerCase();
  return tokens.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0);
}

function drillText(d: Drill): string {
  return [
    d.name, d.category, d.skill, d.when_to_use,
    ...(d.coaching_points ?? []),
    ...(d.instructions ?? []),
  ].join(" ");
}

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatDrill(d: Drill): string {
  const lines: string[] = [];
  lines.push(`**${d.name}**`);
  if (d.duration_minutes) lines.push(`⏱ ${d.duration_minutes} min · ${d.difficulty ?? "mixed"} · ${d.players ?? ""}`);
  if (d.setup) lines.push(`Setup: ${d.setup}`);
  if (d.instructions?.length) {
    lines.push("Instructions:");
    d.instructions.slice(0, 5).forEach((step, i) => lines.push(`  ${i + 1}. ${step}`));
  }
  if (d.coaching_points?.length) lines.push(`Key points: ${d.coaching_points.join(", ")}`);
  return lines.join("\n");
}

function formatSkill(key: string, skill: SkillEntry): string {
  const lines: string[] = [];
  const title = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  lines.push(`**${title}**`);
  if (skill.description) lines.push(skill.description);
  if (skill.techniques?.length) {
    lines.push("\nTechniques:");
    skill.techniques.slice(0, 3).forEach((t) => {
      lines.push(`• ${t.name}${t.description ? ": " + t.description : ""}`);
      if (t.steps?.length) {
        t.steps.slice(0, 3).forEach((s) => lines.push(`  - ${s}`));
      }
    });
  }
  if (skill.faults_and_fixes?.length) {
    lines.push("\nCommon fixes:");
    skill.faults_and_fixes.slice(0, 2).forEach((f) => {
      lines.push(`• Problem: ${f.fault}`);
      lines.push(`  Fix: ${f.fix}`);
    });
  }
  return lines.join("\n");
}

function formatPhase(p: Phase): string {
  const lines: string[] = [];
  lines.push(`**${p.label}** (${p.age_range ?? ""})`);
  if (p.focus) lines.push(`Focus: ${p.focus}`);
  if (p.description) lines.push(p.description);
  const tg = p.training_guidelines;
  if (tg) {
    lines.push(`\nTraining: ${tg.sessions_per_week ?? "?"} sessions/week · ${tg.session_duration_minutes ?? "?"} min · ${tg.ratio ?? ""}`);
    if (tg.session_structure?.length) {
      lines.push("Session structure:");
      tg.session_structure.forEach((c) => lines.push(`  • ${c.component} (${c.duration_minutes} min)`));
    }
  }
  if (p.technical_milestones?.length) {
    lines.push("\nKey milestones:");
    p.technical_milestones.slice(0, 4).forEach((m) => lines.push(`  ✓ ${m}`));
  }
  return lines.join("\n");
}

// ─── Query intent detection ──────────────────────────────────────────────────

const NUTRITION_KEYWORDS  = ["eat", "food", "meal", "nutrition", "diet", "sadza", "protein", "energy", "recover", "recovery", "pre", "post", "before", "after", "drink", "water"];
const PHASE_KEYWORDS      = ["phase", "foundation", "development", "performance", "elite", "u10", "u12", "u14", "u16", "u18", "under", "age", "group", "programme", "season", "plan"];
const DRILL_KEYWORDS      = ["drill", "exercise", "practice", "warm", "session", "improve", "train", "speed", "fitness", "dribble", "pass", "shoot", "tackle", "header", "control"];
const SKILL_KEYWORDS      = ["technique", "skill", "tips", "advice", "teach", "coach", "how", "why", "receiving", "dribbling", "shooting", "passing", "tackling", "heading", "goalkeeping", "fitness"];

function detectIntent(tokens: string[]): "nutrition" | "phase" | "drill" | "skill" | "general" {
  const joined = tokens.join(" ");
  const hit = (kws: string[]) => kws.some((k) => joined.includes(k));
  if (hit(NUTRITION_KEYWORDS)) return "nutrition";
  if (hit(PHASE_KEYWORDS))     return "phase";
  if (hit(DRILL_KEYWORDS))     return "drill";
  if (hit(SKILL_KEYWORDS))     return "skill";
  return "general";
}

// ─── Nutrition response ──────────────────────────────────────────────────────

function nutritionResponse(tokens: string[]): string {
  if (!_nutrition) return "";
  const joined = tokens.join(" ");

  // Determine timing (pre/post)
  const isPre  = ["before", "pre", "eat before", "training"].some((k) => joined.includes(k));
  const isPost = ["after", "post", "recover", "recovery"].some((k) => joined.includes(k));

  // Determine session type
  let sessionType = "physical";
  if (joined.includes("technical") || joined.includes("drill") || joined.includes("skill")) sessionType = "technical";
  else if (joined.includes("tactic") || joined.includes("formation"))                       sessionType = "tactical";
  else if (joined.includes("mental") || joined.includes("pressure"))                        sessionType = "mental";

  const timing = (isPost && !isPre) ? "post_training" : "pre_training";
  const section = (_nutrition as Record<string, Record<string, { english: string }>>)[timing];
  if (!section) return "";

  const entry = section[sessionType] ?? section["physical"];
  if (!entry?.english) return "";

  const label = timing === "pre_training" ? "Before training" : "After training";
  return `**Nutrition Advice — ${label}**\n\n${entry.english}\n\n💡 Zimbabwe-first foods: sadza, nyemba, mazai, mbambaira, huku yemumisha`;
}

// ─── Main search function ───────────────────────────────────────────────────

export interface OfflineResult {
  text: string;
  source: string;
}

export async function searchOffline(query: string): Promise<OfflineResult | null> {
  try {
    await ensureLoaded();
  } catch {
    return null;
  }

  const tokens = tokenise(query);
  if (tokens.length === 0) return null;

  const intent = detectIntent(tokens);

  // ── Nutrition ──
  if (intent === "nutrition") {
    const text = nutritionResponse(tokens);
    if (text) return { text, source: "Grassroots Sport Nutrition Guide" };
  }

  // ── Development phases ──
  if (intent === "phase" && _phases?.length) {
    const scored = _phases
      .map((p) => ({
        p,
        s: score(tokens, [p.name, p.focus ?? "", p.description ?? "", p.age_range ?? ""].join(" ")),
      }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (scored.length) {
      return {
        text: formatPhase(scored[0].p),
        source: "Zimbabwe Grassroots Football Development Framework",
      };
    }
  }

  // ── Drills ──
  if ((intent === "drill" || intent === "general") && _drills?.length) {
    const scored = _drills
      .map((d) => ({ d, s: score(tokens, drillText(d)) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);

    if (scored.length) {
      const parts = scored.map((x) => formatDrill(x.d));
      return {
        text: `Here are ${scored.length} drill${scored.length > 1 ? "s" : ""} for you:\n\n` + parts.join("\n\n---\n\n"),
        source: "Special Olympics Football Coaching Guide",
      };
    }
  }

  // ── Coaching skills / techniques ──
  if ((intent === "skill" || intent === "general") && _skills) {
    const scored = Object.entries(_skills)
      .map(([key, skill]) => ({
        key,
        skill,
        s: score(tokens, [
          key,
          skill.description ?? "",
          ...(skill.key_words ?? []),
          ...(skill.techniques?.map((t) => t.name + " " + (t.description ?? "")) ?? []),
        ].join(" ")),
      }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (scored.length) {
      return {
        text: formatSkill(scored[0].key, scored[0].skill),
        source: "Special Olympics Football Coaching Guide",
      };
    }
  }

  // ── Fallback: best drill match regardless of intent ──
  if (_drills?.length) {
    const scored = _drills
      .map((d) => ({ d, s: score(tokens, drillText(d)) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 2);

    if (scored.length) {
      return {
        text: scored.map((x) => formatDrill(x.d)).join("\n\n---\n\n"),
        source: "Special Olympics Football Coaching Guide",
      };
    }
  }

  return null;
}

/** Preload all knowledge base files in the background (call on app start). */
export function preloadOfflineAI(): void {
  ensureLoaded().catch(() => {});
}
