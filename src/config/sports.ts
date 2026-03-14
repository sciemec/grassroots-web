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
