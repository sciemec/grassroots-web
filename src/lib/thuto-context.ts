// Shared utility — any page that runs AI analysis calls saveAnalysisEvent().
// ThutoChat reads the log and injects it into the system prompt so THUTO
// knows about the player's real performance history.

export interface ThutoAnalysisEvent {
  tool: "match-eye" | "gemini-drills" | "biomechanics" | "assessment";
  timestamp: string;   // ISO date string
  sport: string;
  position?: string;
  summary: string;     // 1–2 sentence summary THUTO can read
  score?: number;      // 0–100 if applicable
  strengths?: string[];
  improvements?: string[];
}

const KEY   = "thuto_analysis_log";
const LIMIT = 10;

const TOOL_LABELS: Record<string, string> = {
  "match-eye":    "Match Eye",
  "gemini-drills": "AI Drill Analysis",
  "biomechanics": "Biomechanics Scan",
  "assessment":   "Field Assessment",
};

export function saveAnalysisEvent(event: ThutoAnalysisEvent): void {
  try {
    const existing: ThutoAnalysisEvent[] = (() => {
      try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
    })();
    existing.push(event);
    localStorage.setItem(KEY, JSON.stringify(existing.slice(-LIMIT)));
  } catch { /* storage full or SSR */ }
}

export function getAnalysisLog(): ThutoAnalysisEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Returns a string block ready to inject into THUTO's system prompt. */
export function buildAnalysisContext(): string {
  const events = getAnalysisLog();
  if (events.length === 0) return "";

  const lines: string[] = [
    `\nPLAYER ANALYSIS HISTORY (${events.length} AI session${events.length !== 1 ? "s" : ""} on record):`,
  ];

  events.slice(-3).forEach((e) => {
    const label = TOOL_LABELS[e.tool] ?? e.tool;
    lines.push(
      `• [${fmtDate(e.timestamp)}] ${label} · ${e.sport}${e.position ? ` · ${e.position}` : ""}${e.score !== undefined ? ` · Score: ${e.score}/100` : ""}`
    );
    lines.push(`  ${e.summary}`);
    if (e.strengths?.length)    lines.push(`  Strengths: ${e.strengths.slice(0, 2).join("; ")}`);
    if (e.improvements?.length) lines.push(`  Improve: ${e.improvements.slice(0, 2).join("; ")}`);
  });

  const latest = events[events.length - 1];
  lines.push(
    `\nWhen the player asks about their performance, reference these real AI analysis results. Most recent: ${TOOL_LABELS[latest.tool] ?? latest.tool} on ${fmtDate(latest.timestamp)}.`
  );

  return lines.join("\n");
}
