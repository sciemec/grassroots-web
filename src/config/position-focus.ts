export interface PositionFocus {
  title: string;
  badgeColor: string;
  targetDrillCategories: string[];
  physicalFocus: string[];
}

export const POSITION_FOCUS_MAP: Record<string, PositionFocus> = {
  striker: {
    title: "Striker",
    badgeColor: "border-red-400 text-red-700 bg-red-50",
    targetDrillCategories: ["finishing", "movement", "shooting", "1v1"],
    physicalFocus: ["Sprint Speed", "Explosive Power", "First Touch", "Aerial Ability"],
  },
  forward: {
    title: "Forward",
    badgeColor: "border-red-400 text-red-700 bg-red-50",
    targetDrillCategories: ["finishing", "movement", "shooting", "1v1"],
    physicalFocus: ["Sprint Speed", "Explosive Power", "First Touch", "Aerial Ability"],
  },
  winger: {
    title: "Winger",
    badgeColor: "border-orange-400 text-orange-700 bg-orange-50",
    targetDrillCategories: ["dribbling", "crossing", "pace", "1v1"],
    physicalFocus: ["Pace", "Agility", "Stamina", "Ball Control"],
  },
  midfielder: {
    title: "Midfielder",
    badgeColor: "border-blue-400 text-blue-700 bg-blue-50",
    targetDrillCategories: ["passing", "vision", "pressing", "rondo"],
    physicalFocus: ["Stamina", "Passing Accuracy", "Work Rate", "Decision Making"],
  },
  "central midfielder": {
    title: "Central Midfielder",
    badgeColor: "border-blue-400 text-blue-700 bg-blue-50",
    targetDrillCategories: ["passing", "vision", "pressing", "rondo"],
    physicalFocus: ["Stamina", "Passing Accuracy", "Work Rate", "Decision Making"],
  },
  "defensive midfielder": {
    title: "Defensive Midfielder",
    badgeColor: "border-indigo-400 text-indigo-700 bg-indigo-50",
    targetDrillCategories: ["pressing", "tackling", "positioning", "rondo"],
    physicalFocus: ["Strength", "Interceptions", "Work Rate", "Positioning"],
  },
  defender: {
    title: "Defender",
    badgeColor: "border-green-600 text-green-800 bg-green-50",
    targetDrillCategories: ["defending", "heading", "positioning", "tackling"],
    physicalFocus: ["Strength", "Aerial Ability", "Positioning", "Tackling"],
  },
  "centre back": {
    title: "Centre Back",
    badgeColor: "border-green-600 text-green-800 bg-green-50",
    targetDrillCategories: ["defending", "heading", "positioning", "tackling"],
    physicalFocus: ["Strength", "Aerial Ability", "Positioning", "Tackling"],
  },
  "full back": {
    title: "Full Back",
    badgeColor: "border-teal-400 text-teal-700 bg-teal-50",
    targetDrillCategories: ["defending", "crossing", "pace", "positioning"],
    physicalFocus: ["Stamina", "Pace", "Crossing", "Tackling"],
  },
  goalkeeper: {
    title: "Goalkeeper",
    badgeColor: "border-yellow-500 text-yellow-800 bg-yellow-50",
    targetDrillCategories: ["goalkeeping", "distribution", "positioning", "reflexes"],
    physicalFocus: ["Reflexes", "Positioning", "Shot Stopping", "Distribution"],
  },
};
