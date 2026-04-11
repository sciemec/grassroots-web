// THUTO Success Engine — Goal type detection + action blueprints

export type GoalType =
  | "football_selection"
  | "football_fitness"
  | "general_athlete"
  | "strength_conditioning"
  | "mental_performance";

export interface ActionBlueprint {
  actions: [string, string, string]; // exactly 3
  label: string;
}

export const ACTION_BLUEPRINTS: Record<GoalType, ActionBlueprint> = {
  football_selection: {
    label: "Football Selection",
    actions: [
      "Complete 20 minutes of technical ball work (dribbling / passing / shooting)",
      "Watch 15 minutes of footage from a professional player in your position",
      "Do your post-training recovery (stretching + hydration)",
    ],
  },
  football_fitness: {
    label: "Football Fitness",
    actions: [
      "Complete your scheduled fitness session (runs / intervals / circuits)",
      "Log your session: distance, time, and how your body felt",
      "Sleep 8 hours and eat a proper recovery meal after training",
    ],
  },
  general_athlete: {
    label: "General Athlete",
    actions: [
      "Complete your main training session for today",
      "Review one thing you want to improve and practise it deliberately for 10 minutes",
      "Log your session and rate your effort honestly (1–10)",
    ],
  },
  strength_conditioning: {
    label: "Strength & Conditioning",
    actions: [
      "Complete your scheduled gym or bodyweight strength session",
      "Track your key lifts or reps and compare to last week",
      "Prioritise sleep (8 hrs) — strength is built during rest, not in the gym",
    ],
  },
  mental_performance: {
    label: "Mental Performance",
    actions: [
      "Complete 5 minutes of breathing or visualisation before your session",
      "Set one specific focus goal before you train — write it down",
      "After training, write 3 things you did well (not what went wrong)",
    ],
  },
};

// Keyword-based goal type detection
export function detectGoalType(goalText: string): GoalType {
  const lower = goalText.toLowerCase();

  const footballSelectionKeywords = [
    "selection", "trial", "selected", "make the team", "first team",
    "national team", "represent", "squad", "picked",
  ];
  const footballFitnessKeywords = [
    "football", "soccer", "dribble", "shoot", "pass", "match",
    "fixture", "league", "tournament",
  ];
  const strengthKeywords = [
    "gym", "lift", "strength", "muscle", "weight", "bench", "squat",
    "deadlift", "bulk", "power",
  ];
  const mentalKeywords = [
    "mental", "confidence", "anxiety", "focus", "mindset", "pressure",
    "nerves", "fear", "motivation",
  ];

  if (footballSelectionKeywords.some((k) => lower.includes(k)))
    return "football_selection";
  if (strengthKeywords.some((k) => lower.includes(k)))
    return "strength_conditioning";
  if (mentalKeywords.some((k) => lower.includes(k)))
    return "mental_performance";
  if (footballFitnessKeywords.some((k) => lower.includes(k)))
    return "football_fitness";

  return "general_athlete";
}

export function getActionsForGoal(goalText: string): [string, string, string] {
  const type = detectGoalType(goalText);
  return ACTION_BLUEPRINTS[type].actions;
}
