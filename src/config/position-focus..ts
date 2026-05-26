export interface PositionFocusConfig {
  badgeColor: string;
  title: string;
  targetDrillCategories: string[];
  physicalFocus: string[];
}

export const POSITION_FOCUS_MAP: Record<string, PositionFocusConfig> = {
  striker: {
    title: "Striker / Center Forward",
    badgeColor: "bg-amber-50 border-amber-200 text-amber-800",
    targetDrillCategories: ["shooting", "front_foot_passing", "counter_attacks"],
    physicalFocus: ["explosive_speed", "vertical_leap", "shielding_strength"],
  },
  midfielder: {
    title: "Central / Attacking Midfielder",
    badgeColor: "bg-emerald-50 border-emerald-200 text-emerald-800",
    targetDrillCategories: ["rondos", "small_sided_games", "passing_networks"],
    physicalFocus: ["aerobic_capacity", "agility_drills", "spatial_awareness"],
  },
  defender: {
    title: "Center Back / Fullback",
    badgeColor: "bg-blue-50 border-blue-200 text-blue-800",
    targetDrillCategories: ["pressing_triggers", "zonal_marking", "back_line_spacing"],
    physicalFocus: ["upper_body_strength", "recovery_speed", "deceleration"],
  },
  goalkeeper: {
    title: "Goalkeeper",
    badgeColor: "bg-purple-50 border-purple-200 text-purple-800",
    targetDrillCategories: ["reflexes", "shot_stopping", "cross_collection"],
    physicalFocus: ["reactive_power", "lateral_footwork", "hand_eye_coordination"],
  },
};