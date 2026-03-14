// Sport configuration for GrassRoots Sports — all 10 supported Zimbabwe sports.
// Every feature that is sport-aware must load from here.

export type SportKey =
  | "football" | "rugby" | "athletics" | "netball"
  | "basketball" | "cricket" | "swimming" | "tennis"
  | "volleyball" | "hockey";

export interface SportConfig {
  key: SportKey;
  label: string;
  emoji: string;
  governingBody: string;
  competitions: string[];
  positions?: string[];
}

export const SPORTS: SportConfig[] = [
  {
    key: "football",
    label: "Football",
    emoji: "⚽",
    governingBody: "ZIFA",
    competitions: ["Premier League", "Division One", "Division Two", "Chibuku Super Cup"],
    positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
  },
  {
    key: "rugby",
    label: "Rugby",
    emoji: "🏉",
    governingBody: "ZRU",
    competitions: ["Zimbabwe Rugby Union League", "Schools Cup"],
    positions: ["Prop", "Hooker", "Lock", "Flanker", "No. 8", "Scrum-half", "Fly-half", "Centre", "Wing", "Fullback"],
  },
  {
    key: "athletics",
    label: "Athletics",
    emoji: "🏃",
    governingBody: "AAZ",
    competitions: ["NASH Athletics", "ZAC Championships"],
  },
  {
    key: "netball",
    label: "Netball",
    emoji: "🏐",
    governingBody: "ZNA",
    competitions: ["NASH Netball", "National League"],
    positions: ["GS", "GA", "WA", "C", "WD", "GD", "GK"],
  },
  {
    key: "basketball",
    label: "Basketball",
    emoji: "🏀",
    governingBody: "ZBFA",
    competitions: ["National Basketball League"],
    positions: ["PG", "SG", "SF", "PF", "C"],
  },
  {
    key: "cricket",
    label: "Cricket",
    emoji: "🏏",
    governingBody: "ZC",
    competitions: ["Logan Cup", "Metbank T20"],
    positions: ["Batter", "Bowler", "All-rounder", "Wicket-keeper"],
  },
  {
    key: "swimming",
    label: "Swimming",
    emoji: "🏊",
    governingBody: "ZSWF",
    competitions: ["National Championships", "NASH Swimming"],
  },
  {
    key: "tennis",
    label: "Tennis",
    emoji: "🎾",
    governingBody: "ZTA",
    competitions: ["National League", "Schools Championships"],
  },
  {
    key: "volleyball",
    label: "Volleyball",
    emoji: "🏐",
    governingBody: "ZVBF",
    competitions: ["National League", "NASH Volleyball"],
    positions: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero"],
  },
  {
    key: "hockey",
    label: "Hockey",
    emoji: "🏑",
    governingBody: "ZHF",
    competitions: ["National League", "Schools Hockey"],
    positions: ["GK", "Defender", "Midfielder", "Forward"],
  },
];

export const SPORT_MAP: Record<SportKey, SportConfig> = Object.fromEntries(
  SPORTS.map((s) => [s.key, s])
) as Record<SportKey, SportConfig>;

// Sport-specific stat schemas
export const SPORT_STATS: Record<string, Record<string, string[]>> = {
  football: {
    outfield: ["goals", "assists", "passes", "passAccuracy", "tackles", "interceptions", "distanceCovered", "minutesPlayed"],
    goalkeeper: ["saves", "cleanSheets", "goalsAllowed", "distribution"],
  },
  rugby: {
    all: ["tries", "tackles", "carries", "metresGained", "lineoutsWon", "scrumPenalties", "turnoversWon", "minutesPlayed"],
    kicker: ["conversions", "penaltyGoals", "dropGoals", "kickingAccuracy"],
  },
  athletics: {
    track: ["eventType", "personalBest", "seasonBest", "nationalRanking", "reactionTime", "splits"],
    field: ["eventType", "personalBest", "seasonBest", "attempts", "fouls"],
  },
  netball: {
    all: ["goals", "attempts", "goalAccuracy", "intercepts", "contacts", "centerPassReceives", "rebounds"],
  },
  basketball: {
    all: ["points", "rebounds", "assists", "steals", "blocks", "turnovers", "fieldGoalPct", "threePointPct", "ftPct"],
  },
  cricket: {
    batting: ["runs", "balls", "fours", "sixes", "strikeRate", "average", "highScore"],
    bowling: ["wickets", "overs", "runs", "economy", "average", "bestFigures"],
  },
  swimming: {
    all: ["eventType", "stroke", "distance", "personalBest", "seasonBest", "nationalRanking", "splits"],
  },
  tennis: {
    all: ["wins", "losses", "sets", "serveAccuracy", "breakPoints", "aces", "doubleFaults"],
  },
  volleyball: {
    all: ["kills", "blocks", "aces", "digs", "assists", "errors"],
  },
  hockey: {
    outfield: ["goals", "assists", "tackles", "interceptions", "shotsOnGoal"],
    goalkeeper: ["saves", "cleanSheets", "goalsAllowed"],
  },
};

export const ANALYSIS_TYPES = [
  { value: "full_match", label: "Full Match Analysis", desc: "Tactics, shape, team performance" },
  { value: "skill_review", label: "Individual Skill Review", desc: "Technique and personal improvement" },
  { value: "training_review", label: "Training Session Review", desc: "Drills, fitness, intensity" },
  { value: "question", label: "Ask a Question", desc: 'e.g. "Why do I keep losing the ball?"' },
] as const;

export type AnalysisType = typeof ANALYSIS_TYPES[number]["value"];

// Sport-specific video/session analysis system prompt
// Used by: /video-studio
export function getSportAnalysisPrompt(sport: SportKey, context: string): string {
  const focusMap: Record<SportKey, string> = {
    football:   "pressing triggers, defensive shape, transition moments, set pieces, individual technique",
    rugby:      "tackle technique, line speed, set piece execution, support lines, ruck body position",
    netball:    "court movement, circle feeding, defensive footwork, centre pass patterns",
    basketball: "spacing, pick-and-roll execution, transition defence, shot selection, help defence",
    cricket:    "batting stance and weight transfer, bowling action, field placement, footwork",
    athletics:  "stride mechanics, arm drive, acceleration phase, body position at finish",
    swimming:   "stroke technique, turn efficiency, kick pattern, breathing rhythm",
    tennis:     "serve mechanics, footwork positioning, court coverage, return patterns",
    volleyball: "spiking approach, blocking technique, serve mechanics, positional coverage",
    hockey:     "stick skills, press triggers, receiving technique, set piece execution",
  };

  const focus = focusMap[sport] ?? "technique, tactics, fitness, and execution";

  return `You are a professional ${sport} analyst on the Grassroots Sport platform.

ANALYSIS CONTEXT:
${context}

Focus your analysis on: ${focus}

Structure your response as:
1. OVERALL ASSESSMENT — 2–3 sentence summary
2. KEY OBSERVATIONS — 3–5 specific technical or tactical points observed
3. STRENGTHS — what is working well
4. AREAS TO IMPROVE — 2–3 specific, actionable improvements
5. NEXT SESSION RECOMMENDATION — one concrete drill or exercise to address the main weakness

TONE: Professional analyst briefing a coaching staff. Concise, evidence-based, actionable. Under 400 words.`;
}
