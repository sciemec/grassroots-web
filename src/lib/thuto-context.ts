// Shared utility — any page that runs AI analysis calls saveAnalysisEvent().
// ThutoChat reads the log and injects it into the system prompt so THUTO
// knows about the player's real performance history — across all devices.
//
// Storage strategy:
//   Primary:  POST/GET /player/analysis-events (Laravel backend — persists across devices/logins)
//   Fallback: localStorage key "thuto_analysis_log" (offline / cold start / unauthenticated)

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
const LS_KEY   = "thuto_analysis_log";
const LS_LIMIT = 10;

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

const TOOL_LABELS: Record<string, string> = {
  "match-eye":     "Match Eye",
  "gemini-drills": "AI Drill Analysis",
  "biomechanics":  "Biomechanics Scan",
  "assessment":    "Field Assessment",
};

// ─── localStorage helpers ────────────────────────────────────────────────────

function lsRead(): ThutoAnalysisEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function lsWrite(events: ThutoAnalysisEvent[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(events.slice(-LS_LIMIT)));
  } catch { /* storage full or SSR */ }
}

function lsAppend(event: ThutoAnalysisEvent): void {
  const existing = lsRead();
  existing.push(event);
  lsWrite(existing);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Save an analysis event.
 * Tries the backend first; always writes to localStorage as well
 * so data is available immediately and offline.
 */
export async function saveAnalysisEvent(event: ThutoAnalysisEvent): Promise<void> {
  // Always persist locally for immediate availability
  lsAppend(event);

  // Fire-and-forget to backend — failure is silent (offline, cold start, etc.)
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
    if (!token || token === "dev-token") return;

    await fetch(`${API_BASE}/player/analysis-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        tool:         event.tool,
        sport:        event.sport,
        position:     event.position ?? null,
        summary:      event.summary,
        score:        event.score ?? null,
        strengths:    event.strengths ?? [],
        improvements: event.improvements ?? [],
        analysed_at:  event.timestamp,
      }),
    });
  } catch { /* offline or server error — localStorage already has it */ }
}

/**
 * Retrieve the full analysis log.
 * Tries the backend first (all devices, all history);
 * falls back to localStorage (current device, last 10 events).
 */
export async function getAnalysisLog(): Promise<ThutoAnalysisEvent[]> {
  try {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
    if (!token || token === "dev-token") return lsRead();

    const res = await fetch(`${API_BASE}/player/analysis-events`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) return lsRead();

    const json = await res.json();
    const events: ThutoAnalysisEvent[] = (json.data ?? []).map((e: Record<string, unknown>) => ({
      tool:         e.tool         as ThutoAnalysisEvent["tool"],
      timestamp:    (e.analysed_at ?? e.timestamp) as string,
      sport:        e.sport        as string,
      position:     e.position     as string | undefined,
      summary:      e.summary      as string,
      score:        e.score        as number | undefined,
      strengths:    (e.strengths    as string[] | null) ?? [],
      improvements: (e.improvements as string[] | null) ?? [],
    }));

    // Keep localStorage in sync with backend data so offline access stays fresh
    lsWrite(events);
    return events;
  } catch {
    return lsRead();
  }
}

/**
 * Synchronous version — reads from localStorage only.
 * Use this inside synchronous contexts (e.g. ThutoChat buildContext).
 */
export function getAnalysisLogSync(): ThutoAnalysisEvent[] {
  return lsRead();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Returns a string block ready to inject into THUTO's system prompt.
 * Reads from localStorage (synchronous — called inside buildContext).
 * ThutoChat also triggers a background refresh via getAnalysisLog() on mount.
 */
export function buildAnalysisContext(): string {
  const events = lsRead();
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
