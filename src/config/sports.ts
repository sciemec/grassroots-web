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

// AI analysis prompt per sport — sent to Claude API via Laravel backend
export const getSportAnalysisPrompt = (sport: string, context: string): string => {
  const sportContexts: Record<string, string> = {
    football: `Analyse as a UEFA-qualified football coach. Focus on: positioning, movement off the ball, pressing triggers, transition play, defensive shape.`,
    rugby: `Analyse as an experienced rugby coach. Focus on: tackle technique, body position in contact, support lines, set piece execution, offload decisions.`,
    athletics: `Analyse as an athletics coach. Focus on: technique, stride pattern, arm mechanics, acceleration phase, finish, breathing rhythm.`,
    netball: `Analyse as a netball coach. Focus on: footwork, ball handling, court movement, defending, feeding the circle, positioning.`,
    basketball: `Analyse as a basketball coach. Focus on: shooting form, defensive positioning, court vision, transition, pick-and-roll execution.`,
    cricket: `Analyse as a cricket coach. Focus on: batting stance, shot selection, weight transfer, bowling action, field placement awareness.`,
    swimming: `Analyse as a swimming coach. Focus on: stroke technique, turn efficiency, kick pattern, breathing rhythm, stroke rate.`,
    tennis: `Analyse as a tennis coach. Focus on: serve mechanics, footwork, shot selection, court positioning, return of serve.`,
    volleyball: `Analyse as a volleyball coach. Focus on: spiking approach, blocking technique, serve mechanics, court coverage, setting accuracy.`,
    hockey: `Analyse as a hockey coach. Focus on: stick skills, receiving technique, movement into space, press triggers, penalty corner execution.`,
  };

  const base = sportContexts[sport] ?? "Analyse as an experienced sports coach.";

  return `${base}

Context provided: ${context}

Provide your feedback in exactly 3 sections:
1. STRENGTHS — what is working well (2-3 specific points)
2. AREAS TO IMPROVE — specific, actionable improvements (2-3 points)
3. DRILL RECOMMENDATIONS — practical exercises to fix the issues (2-3 drills with brief instructions)

Keep language simple and encouraging — the athlete may be young or new to analytics.
End with one short motivational sentence.`;
};

export const ANALYSIS_TYPES = [
  { value: "full_match", label: "Full Match Analysis", desc: "Tactics, shape, team performance" },
  { value: "skill_review", label: "Individual Skill Review", desc: "Technique and personal improvement" },
  { value: "training_review", label: "Training Session Review", desc: "Drills, fitness, intensity" },
  { value: "question", label: "Ask a Question", desc: 'e.g. "Why do I keep losing the ball?"' },
] as const;

export type AnalysisType = typeof ANALYSIS_TYPES[number]["value"];
