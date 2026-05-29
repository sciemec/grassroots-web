export interface SessionPoint {
  source: string;
  points: string[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  tactics:           ["tactical", "system of play", "shape", "structural positioning", "formation"],
  formations:        ["3-2-1", "4-3-3", "4-4-2", "alignment", "structure"],
  match_strategy:    ["conditioned match", "11v11", "scoring condition", "game constraint"],
  set_pieces:        ["corner", "free kick", "set piece"],
  small_sided_games: ["small sided", "7v7", "4v2", "3v2", "8v7", "SSG"],
  passing_networks:  ["passing", "wall-pass", "switch play", "build up", "possession", "circulation"],
  rondos:            ["rondo", "possession", "passing grid", "overload"],
  front_foot_passing:["attacking", "penetrative pass", "forward pass", "combination", "third-man"],
  finishing:         ["finishing", "clinical", "first touch", "score", "shot", "goal"],
  crossing:          ["crossing", "cross", "flank", "wide", "winger", "overlapping fullback"],
  counter_attacks:   ["transition", "counter", "attacking transition", "sprint"],
  pressing_triggers: ["pressing", "press", "recovery", "counter-pressing", "seal"],
  zonal_marking:     ["defensive", "defenders", "block", "zonal", "marking"],
  back_line_spacing: ["backline", "back line", "defensive line", "center-back", "defensive shape"],
};

function scoreRelevance(text: string, categories: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  categories.forEach(cat => {
    const keywords = CATEGORY_KEYWORDS[cat] ?? [cat.replace(/_/g, " ")];
    keywords.forEach(kw => { if (lower.includes(kw.toLowerCase())) score++; });
  });
  return score;
}

interface RawSession { topic: string; name: string; points: string[]; }

function extractSessions(json: Record<string, unknown>): RawSession[] {
  const results: RawSession[] = [];

  // Format A: { session_practices: [{ name, coaching_points }] }
  const practices = json.session_practices as { name?: string; coaching_points?: string[] }[] | undefined;
  if (practices) {
    const topic = (json.document_info as { topic?: string })?.topic ?? "";
    practices.forEach(p => {
      if (p.coaching_points?.length) {
        results.push({ topic, name: p.name ?? "", points: p.coaching_points });
      }
    });
  }

  // Format B: { practices: [{ name, coaching_focus, tactical_objectives }] }
  const legacyPractices = json.practices as {
    name?: string;
    coaching_focus?: string[];
    tactical_objectives?: string[];
  }[] | undefined;
  if (legacyPractices) {
    const topic = (json.session_info as { format?: string })?.format ?? "";
    legacyPractices.forEach(p => {
      const points = [
        ...(p.coaching_focus ?? []),
        ...(p.tactical_objectives ?? []),
      ];
      if (points.length) results.push({ topic, name: p.name ?? "", points });
    });
  }

  return results;
}

const JSON_FILES: { path: string; label: string }[] = [
  { path: "/data/7v7_Tactical_.json",                                           label: "7v7 Tactical — Barcelona Academy" },
  { path: "/data/Attacking_Combinations__Creative_Receiving__and_Finishing_.json", label: "Attacking Combinations — Creative Finishing" },
  { path: "/data/Attacking_Combinations__Flank_Play__and_Crossing_.json",        label: "Flank Play & Crossing — France U17" },
  { path: "/data/Attacking_Intent__Positive_First_Touch__and_Clinical_Finishing_.json", label: "Attacking Intent — Clinical Finishing" },
];

export async function loadKnowledgeForRole(
  focusCategories: string[]
): Promise<SessionPoint[]> {
  const allSessions: (RawSession & { fileLabel: string })[] = [];

  await Promise.allSettled(
    JSON_FILES.map(async file => {
      try {
        const res = await fetch(file.path);
        const json = await res.json() as Record<string, unknown>;
        extractSessions(json).forEach(s =>
          allSessions.push({ ...s, fileLabel: file.label })
        );
      } catch {
        console.warn(`coaching-knowledge: could not load ${file.path}`);
      }
    })
  );

  // Score each session against this role's focusCategories
  const scored = allSessions
    .map(s => ({
      ...s,
      score: scoreRelevance(
        `${s.topic} ${s.name} ${s.points.join(" ")}`,
        focusCategories
      ),
    }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Deduplicate by file source, take top 2 files, max 3 points each
  const seen = new Set<string>();
  const result: SessionPoint[] = [];
  scored.forEach(s => {
    if (!seen.has(s.fileLabel) && result.length < 2) {
      seen.add(s.fileLabel);
      result.push({ source: s.fileLabel, points: s.points.slice(0, 3) });
    }
  });

  return result;
}