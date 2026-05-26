export interface StaffRoleConfig {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  focusCategories: string[];
  description: string;
}

export const COACHING_STAFF_ROLES: Record<string, StaffRoleConfig[]> = {
  football: [
    {
      id: "head_coach",
      title: "Head Coach",
      icon: "Shield",
      gradient: "from-emerald-800 to-green-900",
      focusCategories: ["tactics", "formations", "match_strategy", "set_pieces"],
      description: "Overall tactical philosophy, match-day systems, and selection workflows.",
    },
    {
      id: "assistant_coach",
      title: "Assistant Coach",
      icon: "Users",
      gradient: "from-green-700 to-emerald-800",
      focusCategories: ["rondos", "small_sided_games", "passing_networks"],
      description: "Squad handling, high-repetition technical drill structures, and discipline.",
    },
    {
      id: "attack_coach",
      title: "Attack Coach",
      icon: "Flame",
      gradient: "from-amber-600 to-amber-700",
      focusCategories: ["front_foot_passing", "finishing", "crossing", "counter_attacks"],
      description: "Breaking low blocks, positional interchanges, and efficiency inside the box.",
    },
    {
      id: "defence_coach",
      title: "Defense Coach",
      icon: "ShieldAlert",
      gradient: "from-blue-700 to-blue-900",
      focusCategories: ["pressing_triggers", "zonal_marking", "back_line_spacing"],
      description: "Defensive tracking, offside traps, compact units, and heading safety.",
    },
    {
      id: "gk_coach",
      title: "Goalkeeper Coach",
      icon: "Target",
      gradient: "from-purple-700 to-purple-900",
      focusCategories: ["reflexes", "shot_stopping", "cross_collection", "distribution"],
      description: "Handling dynamics, baseline positioning, and clean box aerial dominance.",
    },
    {
      id: "performance_analyst",
      title: "Performance Analyst",
      icon: "Activity",
      gradient: "from-cyan-700 to-cyan-900",
      focusCategories: ["xg_analysis", "pass_maps", "heatmaps", "match_video"],
      description: "Computer vision trackers, predictive xG modeling, and strategic analytics.",
    },
    {
      id: "fitness_coach",
      title: "Fitness & Conditioning",
      icon: "Dumbbell",
      gradient: "from-orange-600 to-orange-700",
      focusCategories: ["aerobic_capacity", "sprint_intervals", "agility_drills"],
      description: "Aerobic recovery loading, speed thresholds, and endurance tracking.",
    },
    {
      id: "team_physio",
      title: "Team Physiotherapist",
      icon: "HeartPulse",
      gradient: "from-red-700 to-red-900",
      focusCategories: ["injury_prevention", "rehab_protocols", "fatigue_tracking"],
      description: "XGBoost injury flags, wellness metrics, and baseline biomechanics checks.",
    },
    {
      id: "team_manager",
      title: "Team Manager",
      icon: "Briefcase",
      gradient: "from-slate-700 to-slate-900",
      focusCategories: ["logistics", "kit_management", "fixture_scheduling", "player_passports"],
      description: "NASH/NAPH registration filings, digital IDs, and general logistics management.",
    },
  ],
};

export function getRoleConfig(roleId: string, sport = "football"): StaffRoleConfig | null {
  const roles = COACHING_STAFF_ROLES[sport] ?? COACHING_STAFF_ROLES["football"];
  return roles.find((r) => r.id === roleId) ?? null;
}
