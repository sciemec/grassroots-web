// THUTO Success Engine — Coach goal type detection + action blueprints

export type CoachGoalType =
  | "team_performance"
  | "player_development"
  | "coaching_certification"
  | "match_performance"
  | "community_impact";

export interface CoachActionBlueprint {
  actions: [string, string, string];
  label: string;
}

export const COACH_ACTION_BLUEPRINTS: Record<CoachGoalType, CoachActionBlueprint> = {
  team_performance: {
    label: "Team Performance",
    actions: [
      "Watch 15 minutes of opponent or reference team footage and note one tactical pattern",
      "Give direct, specific feedback to at least 2 players after today's session",
      "Review your squad stats from the last match and identify one area to drill tomorrow",
    ],
  },
  player_development: {
    label: "Player Development",
    actions: [
      "Run one targeted individual skills drill with a player who needs it most",
      "Write brief session notes for at least one player — what you saw, what to work on",
      "Identify one strength and one specific improvement area per player you observed today",
    ],
  },
  coaching_certification: {
    label: "Coaching Certification",
    actions: [
      "Study 30 minutes of course material or coaching methodology content",
      "Watch one professional coaching session breakdown or tactical analysis video",
      "Apply one new concept or drill from your studies in today's training session",
    ],
  },
  match_performance: {
    label: "Match Performance",
    actions: [
      "Set one clear tactical focus for today's training and communicate it to the squad",
      "Review set-piece and defensive data from the last match — fix one specific issue",
      "Run the exact drill that addresses your team's biggest current weakness",
    ],
  },
  community_impact: {
    label: "Community Impact",
    actions: [
      "Contact one local school, parent, or community leader about the programme",
      "Run a session that prioritises fun and inclusion — every player gets equal time",
      "Share one post, photo, or update about the team to grow community awareness",
    ],
  },
};

export function detectCoachGoalType(goalText: string): CoachGoalType {
  const lower = goalText.toLowerCase();

  const certKeywords = [
    "caf", "uefa", "certificate", "certif", "qualify", "qualification",
    "badge", "license", "licence", "coaching course", "level 1", "level 2", "level 3",
  ];
  const devKeywords = [
    "develop", "improve player", "player progress", "individual", "talent",
    "potential", "youth", "grow my players", "player skills",
  ];
  const matchKeywords = [
    "clean sheet", "goal", "concede", "score", "shoot", "defend",
    "set piece", "corner", "free kick", "win matches", "unbeaten",
  ];
  const communityKeywords = [
    "school", "community", "grassroots", "kids", "children", "youth programme",
    "volunteer", "charity", "outreach", "free training",
  ];

  if (certKeywords.some((k) => lower.includes(k)))   return "coaching_certification";
  if (devKeywords.some((k) => lower.includes(k)))     return "player_development";
  if (matchKeywords.some((k) => lower.includes(k)))   return "match_performance";
  if (communityKeywords.some((k) => lower.includes(k))) return "community_impact";
  return "team_performance";
}

export function getCoachActionsForGoal(goalText: string): [string, string, string] {
  const type = detectCoachGoalType(goalText);
  return COACH_ACTION_BLUEPRINTS[type].actions;
}
