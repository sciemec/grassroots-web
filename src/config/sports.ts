// Sport configuration for GrassRoots Sports — all 10 supported Zimbabwe sports.
// Every feature that is sport-aware must load from here.
// Exports: SPORTS, SPORT_MAP, SPORT_STATS, FIELD_META_LABELS, ANALYSIS_TYPES, getSportAnalysisPrompt

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
  color?: string;
  keyFocus?: string[];
  drills?: { title: string; desc: string; duration: string }[];
}

export const SPORTS: SportConfig[] = [
  {
    key: "football",
    label: "Football",
    emoji: "⚽",
    governingBody: "ZIFA",
    competitions: ["Premier League", "Division One", "Division Two", "Chibuku Super Cup"],
    positions: ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"],
    color: "#1d7a34",
    keyFocus: [
      "Pressing triggers and defensive shape",
      "Movement off the ball to create space",
      "Transition — attack to defence and back",
      "Set piece delivery and positioning",
    ],
    drills: [
      { title: "Rondo (5v2)", desc: "Keep possession in a small circle. Improves passing, movement, and pressing.", duration: "10 min" },
      { title: "Shadow Play", desc: "Move through your team shape without opponents. Rehearses patterns of play.", duration: "15 min" },
      { title: "Finishing on Goal", desc: "Strike from different angles and distances with both feet.", duration: "10 min" },
    ],
  },
  {
    key: "rugby",
    label: "Rugby",
    emoji: "🏉",
    governingBody: "ZRU",
    competitions: ["Zimbabwe Rugby Union League", "Schools Cup"],
    positions: ["Prop", "Hooker", "Lock", "Flanker", "No. 8", "Scrum-half", "Fly-half", "Centre", "Wing", "Fullback"],
    color: "#8B4513",
    keyFocus: [
      "Tackle technique — low body position, cheek to cheek",
      "Ruck body position and cleanout",
      "Set piece — lineout lifting and scrum binding",
      "Support lines — stay close to the ball carrier",
    ],
    drills: [
      { title: "Tackle Shield Circuit", desc: "Low entries, side entry, scramble tackle. Technique over power.", duration: "15 min" },
      { title: "Lineout Calls", desc: "Practice 3 lineout variations with lifting pods under pressure.", duration: "10 min" },
      { title: "Offload Drill", desc: "2v1 attack — draw the defender and offload to the support runner.", duration: "10 min" },
    ],
  },
  {
    key: "athletics",
    label: "Athletics",
    emoji: "🏃",
    governingBody: "AAZ",
    competitions: ["NASH Athletics", "ZAC Championships"],
    color: "#cc3300",
    keyFocus: [
      "Drive phase — push, don't pull, out of the blocks",
      "Arm mechanics — drive elbows back, hold 90°",
      "Stride frequency vs stride length balance",
      "Breathing rhythm and race distribution",
    ],
    drills: [
      { title: "Acceleration Runs", desc: "10m–20m–30m build-ups. Progressive acceleration, not top speed.", duration: "15 min" },
      { title: "High Knees", desc: "Drive knees to hip height with fast arm drive. Develops stride mechanics.", duration: "8 min" },
      { title: "Bounds", desc: "Exaggerated strides with maximum push-off. Builds power and stride length.", duration: "10 min" },
    ],
  },
  {
    key: "netball",
    label: "Netball",
    emoji: "🏐",
    governingBody: "ZNA",
    competitions: ["NASH Netball", "National League"],
    positions: ["GS", "GA", "WA", "C", "WD", "GD", "GK"],
    color: "#9b1b30",
    keyFocus: [
      "0.9m defensive discipline — hold your distance",
      "Centre pass patterns — create options from tip-off",
      "Circle feeding — timing and accuracy into the circle",
      "Footwork — land correctly, pivot cleanly",
    ],
    drills: [
      { title: "Lead and Catch", desc: "Change of direction leads to receive ball. Focus on explosive movement.", duration: "10 min" },
      { title: "1v1 Circle Work", desc: "GS vs GD in the goal circle. Create space and passing options.", duration: "10 min" },
      { title: "Centre Pass Patterns", desc: "Walk through 3 set plays from the centre circle.", duration: "12 min" },
    ],
  },
  {
    key: "basketball",
    label: "Basketball",
    emoji: "🏀",
    governingBody: "ZBFA",
    competitions: ["National Basketball League"],
    positions: ["PG", "SG", "SF", "PF", "C"],
    color: "#E55C17",
    keyFocus: [
      "Spacing — keep the floor spread to create driving lanes",
      "Pick and roll execution — timing of the screen",
      "Transition defence — get back before the offence",
      "Shot selection — take what the defence gives you",
    ],
    drills: [
      { title: "Mikan Drill", desc: "Alternating layups both sides without the ball touching the floor.", duration: "8 min" },
      { title: "3-Man Weave", desc: "Three players weave up the court passing until a layup. Builds passing rhythm.", duration: "10 min" },
      { title: "Free Throw Ritual", desc: "20 free throws with a consistent pre-shot routine. Build muscle memory.", duration: "10 min" },
    ],
  },
  {
    key: "cricket",
    label: "Cricket",
    emoji: "🏏",
    governingBody: "ZC",
    competitions: ["Logan Cup", "Metbank T20"],
    positions: ["Batter", "Bowler", "All-rounder", "Wicket-keeper"],
    color: "#1a3d6b",
    keyFocus: [
      "Batting stance — balanced, side-on, eyes level",
      "Weight transfer — move into the ball when driving",
      "Bowling action — sideways-on, high release point",
      "Reading the ball — watch the seam out of the hand",
    ],
    drills: [
      { title: "Catching Square", desc: "Four players throwing at different heights. Builds soft hands.", duration: "10 min" },
      { title: "Short Pitch Defence", desc: "Practice leaving and ducking balls outside off stump.", duration: "10 min" },
      { title: "Run-Up Rhythm", desc: "Bowl without a batsman — consistent run-up, gather, and release.", duration: "15 min" },
    ],
  },
  {
    key: "swimming",
    label: "Swimming",
    emoji: "🏊",
    governingBody: "ZSWF",
    competitions: ["National Championships", "NASH Swimming"],
    color: "#0077cc",
    keyFocus: [
      "Body position — keep hips high and streamlined",
      "Breathing — bilateral breathing for balance",
      "Turn efficiency — flip at the wall, streamline off",
      "Stroke count — fewer strokes = better efficiency",
    ],
    drills: [
      { title: "Catch-Up Drill", desc: "One arm waits at the front while the other completes a full stroke cycle.", duration: "8 min" },
      { title: "Kick Sets", desc: "Kick only with a board. Focus on ankle flexibility and steady rhythm.", duration: "10 min" },
      { title: "Race Pace Repeats", desc: "Short bursts at race speed with full rest recovery between reps.", duration: "15 min" },
    ],
  },
  {
    key: "tennis",
    label: "Tennis",
    emoji: "🎾",
    governingBody: "ZTA",
    competitions: ["National League", "Schools Championships"],
    color: "#c8a400",
    keyFocus: [
      "Serve toss — consistent height and placement",
      "Footwork — split step on every opponent shot",
      "Court position — recover to the baseline T after each shot",
      "Margin over the net — aim 0.5m over, not the line",
    ],
    drills: [
      { title: "Serve and Volley", desc: "Serve then rush the net. Practise approach shot and first volley.", duration: "10 min" },
      { title: "Crosscourt Rally", desc: "Sustained crosscourt groundstroke rally. Build consistency.", duration: "12 min" },
      { title: "Footwork Ladder", desc: "Agility ladder for split-step timing and lateral movement.", duration: "8 min" },
    ],
  },
  {
    key: "volleyball",
    label: "Volleyball",
    emoji: "🏐",
    governingBody: "ZVBF",
    competitions: ["National League", "NASH Volleyball"],
    positions: ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero"],
    color: "#0055aa",
    keyFocus: [
      "Ready position — knees bent, weight forward before every serve",
      "Platform passing — flat arms, contact below the wrist",
      "Approach timing — take off on the penultimate step",
      "Communication — call the ball before it arrives",
    ],
    drills: [
      { title: "Pepper Drill", desc: "Pass → set → attack → catch, repeat. Continuous ball control.", duration: "10 min" },
      { title: "Serving Targets", desc: "Serve to marked zones opposite. Accuracy before power.", duration: "10 min" },
      { title: "Block and Dig", desc: "One player attacks, one blocks, libero digs. Rotate after 5 reps.", duration: "12 min" },
    ],
  },
  {
    key: "hockey",
    label: "Hockey",
    emoji: "🏑",
    governingBody: "ZHF",
    competitions: ["National League", "Schools Hockey"],
    positions: ["GK", "Defender", "Midfielder", "Forward"],
    color: "#006600",
    keyFocus: [
      "Indian dribble — change ball side for evasion",
      "Press triggers — apply pressure on the back pass",
      "Receiving — get low, soft hands, absorb the ball",
      "D-zone positioning — cover the angles on the shooter",
    ],
    drills: [
      { title: "Slalom Dribble", desc: "Dribble through cones changing hands at each gate. Builds close control.", duration: "10 min" },
      { title: "Penalty Corner Routine", desc: "Rehearse set play: injector, stopper, drag-flick, deflection.", duration: "15 min" },
      { title: "1v1 to Goal", desc: "Attacker vs defender into the D. Focus on creating angle.", duration: "10 min" },
    ],
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
    shooter:  ["goals", "attempts", "goalAccuracy", "centerPassReceives", "rebounds", "minutesPlayed"],
    midcourt: ["centerPassReceives", "intercepts", "contacts", "feeds", "minutesPlayed"],
    defender: ["intercepts", "contacts", "rebounds", "deflections", "obstructions", "minutesPlayed"],
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

// Human-readable labels for every stat key — used by stats history page
export const FIELD_META_LABELS: Record<string, string> = {
  minutesPlayed:      "Minutes Played",
  goals:              "Goals",
  assists:            "Assists",
  passes:             "Passes",
  passAccuracy:       "Pass Accuracy (%)",
  tackles:            "Tackles",
  interceptions:      "Interceptions",
  distanceCovered:    "Distance (km)",
  saves:              "Saves",
  cleanSheets:        "Clean Sheet",
  goalsAllowed:       "Goals Allowed",
  distribution:       "Distribution (%)",
  tries:              "Tries",
  carries:            "Carries",
  metresGained:       "Metres Gained",
  lineoutsWon:        "Lineouts Won",
  scrumPenalties:     "Scrum Penalties",
  turnoversWon:       "Turnovers Won",
  conversions:        "Conversions",
  penaltyGoals:       "Penalty Goals",
  dropGoals:          "Drop Goals",
  kickingAccuracy:    "Kicking Accuracy (%)",
  eventType:          "Event",
  personalBest:       "Personal Best",
  seasonBest:         "Season Best",
  nationalRanking:    "National Ranking",
  reactionTime:       "Reaction Time",
  splits:             "Splits",
  attempts:           "Attempts",
  fouls:              "Fouls",
  goalAccuracy:       "Goal Accuracy (%)",
  centerPassReceives: "Centre Pass Receives",
  feeds:              "Feeds",
  rebounds:           "Rebounds",
  contacts:           "Contacts",
  deflections:        "Deflections",
  obstructions:       "Obstructions",
  intercepts:         "Intercepts",
  points:             "Points",
  steals:             "Steals",
  blocks:             "Blocks",
  turnovers:          "Turnovers",
  fieldGoalPct:       "Field Goal (%)",
  threePointPct:      "3-Point (%)",
  ftPct:              "Free Throw (%)",
  runs:               "Runs",
  balls:              "Balls Faced",
  fours:              "Fours",
  sixes:              "Sixes",
  strikeRate:         "Strike Rate",
  average:            "Average",
  highScore:          "High Score",
  wickets:            "Wickets",
  overs:              "Overs",
  economy:            "Economy",
  bestFigures:        "Best Figures",
  stroke:             "Stroke",
  distance:           "Distance",
  wins:               "Wins",
  losses:             "Losses",
  sets:               "Sets Won",
  serveAccuracy:      "Serve Accuracy (%)",
  breakPoints:        "Break Points",
  aces:               "Aces",
  doubleFaults:       "Double Faults",
  kills:              "Kills",
  digs:               "Digs",
  errors:             "Errors",
  shotsOnGoal:        "Shots on Goal",
};

export const ANALYSIS_TYPES = [
  { value: "full_match", label: "Full Match Analysis", desc: "Tactics, shape, team performance" },
  { value: "skill_review", label: "Individual Skill Review", desc: "Technique and personal improvement" },
  { value: "training_review", label: "Training Session Review", desc: "Drills, fitness, intensity" },
  { value: "question", label: "Ask a Question", desc: 'e.g. "Why do I keep losing the ball?"' },
] as const;

export type AnalysisType = typeof ANALYSIS_TYPES[number]["value"];

// Sport-specific video/session analysis system prompt
// Used by: /video-studio, /scout/reports, /player/sports/[sport]
export function getSportAnalysisPrompt(sport: SportKey, context: string, role?: string): string {
  // Netball is role-specific — different focus per position group
  const netballFocus: Record<string, string> = {
    shooter:  "shooting technique under pressure, goal accuracy, circle entry movement, GS/GA positioning and holding, rebounding",
    midcourt: "centre pass patterns, court width creation, timing of feeds into the circle, 0.9m defensive discipline, WA/C/WD decision-making",
    defender: "intercept timing, shot-reading, GK/GD communication, defensive rebounding, restricting GA and GS movement",
  };

  const focusMap: Record<SportKey, string> = {
    football:   "pressing triggers, defensive shape, transition moments, set pieces, individual technique",
    rugby:      "tackle technique, line speed, set piece execution, support lines, ruck body position",
    netball:    role && netballFocus[role] ? netballFocus[role] : "court movement, circle feeding, defensive footwork, centre pass patterns",
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
