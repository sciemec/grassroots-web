// config/coaching-staff.ts

export interface StaffRoleConfig {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  focusCategories: string[];
  description: string;
  department: string; // Maps to drill categories for the Nurture Lab
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
      department: "all", // Head coach sees all departments
    },
    {
      id: "assistant_coach",
      title: "Assistant Coach",
      icon: "Users",
      gradient: "from-green-700 to-emerald-800",
      focusCategories: ["rondos", "small_sided_games", "passing_networks"],
      description: "Squad handling, high-repetition technical drill structures, and discipline.",
      department: "all", // Assistant coach sees all departments
    },
    {
      id: "attack_coach",
      title: "Attack Coach",
      icon: "Flame",
      gradient: "from-amber-600 to-amber-700",
      focusCategories: ["front_foot_passing", "finishing", "crossing", "counter_attacks"],
      description: "Breaking low blocks, positional interchanges, and efficiency inside the box.",
      department: "striker", // Maps to striker drills
    },
    {
      id: "defence_coach",
      title: "Defense Coach",
      icon: "ShieldAlert",
      gradient: "from-blue-700 to-blue-900",
      focusCategories: ["pressing_triggers", "zonal_marking", "back_line_spacing"],
      description: "Defensive tracking, offside traps, compact units, and heading safety.",
      department: "defender", // Maps to defender drills
    },
    {
      id: "gk_coach",
      title: "Goalkeeper Coach",
      icon: "Target",
      gradient: "from-purple-700 to-purple-900",
      focusCategories: ["reflexes", "shot_stopping", "cross_collection", "distribution"],
      description: "Handling dynamics, baseline positioning, and clean box aerial dominance.",
      department: "goalkeeper", // Maps to goalkeeper drills
    },
    {
      id: "midfield_coach",
      title: "Midfield Coach",
      icon: "Activity", // Using Activity as fallback, you can change to a custom icon
      gradient: "from-teal-700 to-teal-900",
      focusCategories: ["transitions", "possession", "creative_passing", "build_up_play"],
      description: "Transition play, possession retention, and creative passing networks.",
      department: "midfielder", // Maps to midfielder drills
    },
    {
      id: "performance_analyst",
      title: "Performance Analyst",
      icon: "Activity",
      gradient: "from-cyan-700 to-cyan-900",
      focusCategories: ["xg_analysis", "pass_maps", "heatmaps", "match_video"],
      description: "Computer vision trackers, predictive xG modeling, and strategic analytics.",
      department: "analytics", // Maps to analytics drills
    },
    {
      id: "fitness_coach",
      title: "Fitness & Conditioning",
      icon: "Dumbbell",
      gradient: "from-orange-600 to-orange-700",
      focusCategories: ["aerobic_capacity", "sprint_intervals", "agility_drills"],
      description: "Aerobic recovery loading, speed thresholds, and endurance tracking.",
      department: "fitness", // Maps to fitness drills
    },
    {
      id: "team_physio",
      title: "Team Physiotherapist",
      icon: "HeartPulse",
      gradient: "from-red-700 to-red-900",
      focusCategories: ["injury_prevention", "rehab_protocols", "fatigue_tracking"],
      description: "XGBoost injury flags, wellness metrics, and baseline biomechanics checks.",
      department: "medical", // Maps to medical/recovery drills
    },
    {
      id: "team_manager",
      title: "Team Manager",
      icon: "Briefcase",
      gradient: "from-slate-700 to-slate-900",
      focusCategories: ["logistics", "kit_management", "fixture_scheduling", "player_passports"],
      description: "NASH/NAPH registration filings, digital IDs, and general logistics management.",
      department: "admin", // Maps to administrative content
    },
  ],
};

// Helper function to get role config with proper typing
export function getRoleConfig(roleId: string, sport: string = "football"): StaffRoleConfig | null {
  const roles = COACHING_STAFF_ROLES[sport] ?? COACHING_STAFF_ROLES.football;
  return roles.find((r) => r.id === roleId) ?? null;
}

// Helper function to get all roles for a sport
export function getRolesForSport(sport: string = "football"): StaffRoleConfig[] {
  return COACHING_STAFF_ROLES[sport] ?? COACHING_STAFF_ROLES.football;
}

// Helper function to get department for a role (useful for drill filtering)
export function getDepartmentForRole(roleId: string, sport: string = "football"): string | null {
  const role = getRoleConfig(roleId, sport);
  return role?.department ?? null;
}