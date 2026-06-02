
import { 
  Flame, 
  RefreshCw, 
  ShieldAlert, 
  Target, 
  UserSquare,
  LucideIcon 
} from "lucide-react";

// 🛡️ SAFE ICON REGISTRY: Maps keys to real React SVG components without storing them as crash-prone strings
export const POSITION_ICON_REGISTRY: Record<string, LucideIcon> = {
  striker: Flame,
  midfielder: RefreshCw,
  defender: ShieldAlert,
  goalkeeper: Target,
  fallback: UserSquare
};

export interface PositionFocusDetail {
  title: string;
  badgeColor: string;
  accentColor: string;
  primaryAttributes: string[];
  physicalFocus: string[];
  targetDrillCategories: string[];
  thutoGreeting: string;
  thutoSystemPrompt: string;
  successMetrics: { label: string; target: string }[];
  quickPrompts: string[];
}

export type PositionFocusConfig = PositionFocusDetail;

// Static baseline data preserved exactly as you authored it
const STATIC_POSITION_MAP: Record<string, PositionFocusDetail> = {
  striker: {
    title: "Attacking Specialization",
    badgeColor: "bg-amber-50 text-[#c8962a] border-amber-200",
    accentColor: "#c8962a",
    primaryAttributes: ["Finishing", "Positioning", "Acceleration", "Composure"],
    physicalFocus: ["acceleration", "sprint_speed", "finishing", "positioning"],
    targetDrillCategories: ["shooting", "movement", "1v1", "finishing"],
    thutoGreeting: "Salibonani! I'm THUTO, your Attacking Agent. Ready to sharpen your positioning, turn defenders in the box, and boost your goal-conversion stats today?",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in attacking development for Zimbabwean grassroots strikers. Focus on high-intensity acceleration metrics, box movement (NASH tournament style), composure under pressure, and clinical finishing. Keep advice data-light, practical, and highly encouraging.",
    successMetrics: [
      { label: "Shot Conversion Rate", target: "> 25%" },
      { label: "xG Performance", target: "> 0.35/shot" },
      { label: "Box Touches per Game", target: "> 8" },
      { label: "Sprint Speed Burst (0-20m)", target: "< 3.0s" }
    ],
    quickPrompts: [
      "How do I improve my finishing inside the 18-yard box?",
      "Give me a drill to beat low-block defenders.",
      "Analyze my attacking positioning during transitions."
    ]
  },
  midfielder: {
    title: "Engine Room Specialization",
    badgeColor: "bg-emerald-50 text-[#1a5c2a] border-emerald-200",
    accentColor: "#1a5c2a",
    primaryAttributes: ["Passing", "Vision", "Stamina", "Pressing"],
    physicalFocus: ["stamina", "short_passing", "vision", "agility"],
    targetDrillCategories: ["passing", "rondo", "pressing", "transition"],
    thutoGreeting: "Maziwisa! THUTO here, managing the engine room with you. Let's work on maximizing your pass completion tracking, scanning velocity, and transitions today.",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in midfield transitions and playmaking mechanics. Your coaching parameters focus heavily on spatial awareness, short-passing accuracy under high counter-pressures, tactical scanning frequency, and stamina management tailored for local pitches.",
    successMetrics: [
      { label: "Pass Accuracy", target: "> 85%" },
      { label: "Key Passes per Game", target: "> 2" },
      { label: "Tackles & Interceptions", target: "> 4/game" },
      { label: "Distance Covered", target: "> 10 km/game" }
    ],
    quickPrompts: [
      "Show me a drill to increase my scanning frequency.",
      "How do I maintain possession under a heavy counter-press?",
      "What are the best ways to pick a defensive-splitting pass?"
    ]
  },
  defender: {
    title: "Defensive Wall Specialization",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    accentColor: "#1d4ed8",
    primaryAttributes: ["Tackling", "Heading", "Positioning", "Strength"],
    physicalFocus: ["strength", "interceptions", "sliding_tackle", "jumping_reach"],
    targetDrillCategories: ["defending", "1v1", "heading", "recovery"],
    thutoGreeting: "Greetings! THUTO here at the back. Ready to lock down the defensive line, optimize your body positioning during 1v1 duels, and improve your aerial clearance metrics?",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in defensive optimization and structure. Guide players on 1v1 tactical delay positioning, aerial clearance timing, structural interception paths, and recovery speed mechanics. Emphasize communication and tactical discipline.",
    successMetrics: [
      { label: "Duel Success Rate", target: "> 65%" },
      { label: "Interceptions per 90", target: "> 3" },
      { label: "Aerial Clearance Rate", target: "> 70%" },
      { label: "Recovery Sprint Speed", target: "< 4.2s (30m)" }
    ],
    quickPrompts: [
      "How do I improve my body positioning in a 1v1 defensive duel?",
      "Give me an agility drill for fast recovery runs.",
      "What is the best technique for structural interception lines?"
    ]
  },
  goalkeeper: {
    title: "Shot-Stopper Specialization",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    accentColor: "#7c3aed",
    primaryAttributes: ["Reflexes", "Handling", "Positioning", "Distribution"],
    physicalFocus: ["reflexes", "handling", "diving", "gk_positioning"],
    targetDrillCategories: ["goalkeeping", "reflexes", "distribution", "shot-stopping"],
    thutoGreeting: "Salibonani! THUTO here between the posts. Let's optimize your handling mechanics, target reactive reflex triggers, and command the 18-yard box like a pro today.",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in Goalkeeping mechanics and high-density shot-stopping analytics. Focus on handling distribution velocity, reactive reflexes, penalty area positioning guidelines, and cross-claim communication structures.",
    successMetrics: [
      { label: "Save Percentage", target: "> 70%" },
      { label: "Clean Sheets", target: "> 40% of games" },
      { label: "Cross Claim Success", target: "> 80%" },
      { label: "Distribution Accuracy", target: "> 75%" }
    ],
    quickPrompts: [
      "What drills can improve my reactive reflex speed?",
      "How do I position myself better for long-range shots?",
      "Show me the best technique for claiming crosses cleanly."
    ]
  },
  fallback: {
    title: "Grassroots Development Track",
    badgeColor: "bg-gray-50 text-gray-700 border-gray-200",
    accentColor: "#6b7280",
    primaryAttributes: ["Fitness", "Ball Control", "Consistency", "Teamwork"],
    physicalFocus: ["acceleration", "stamina", "ball_control", "agility"],
    targetDrillCategories: ["fitness", "skills", "small-sided", "conditioning"],
    thutoGreeting: "Welcome to your Player Dashboard! I am THUTO, your comprehensive AI Agent. Ready to design personalized performance circuits and supercharge your data visibility matrix?",
    thutoSystemPrompt: "You are THUTO, the master AI Sports Agent for GrassRoots Sports Zimbabwe. Provide holistic, cross-sport, data-light talent development coaching parameters. Maximize player retention, track profile data, and guide athletes onto clear scout-ready identification loops.",
    successMetrics: [
      { label: "Technical Consistency", target: "> 70 score" },
      { label: "Weekly Target Completion", target: "> 80%" },
      { label: "Fitness Aggregate", target: "Improving" },
      { label: "Scout Profile Views", target: "> 5/week" }
    ],
    quickPrompts: [
      "How do I optimize my weekly training schedule?",
      "What metrics do scouts look for on my talent passport?",
      "Give me a universal full-body conditioning drill."
    ]
  }
};

// 🔄 DYNAMIC ENGINE CONTEXT ENHANCER
// Updates metrics and rules based on real player metadata
export function getPositionConfig(positionKey: string, ageGroup?: string): PositionFocusDetail {
  // Normalize key to handle unexpected casing safely
  const lookupKey = positionKey?.toLowerCase() || "fallback";
  const baseConfig = STATIC_POSITION_MAP[lookupKey] || STATIC_POSITION_MAP.fallback;

  // Deep copy to prevent mutating the shared cache maps
  const adjustedConfig = JSON.parse(JSON.stringify(baseConfig)) as PositionFocusDetail;

  if (!ageGroup) return adjustedConfig;

  // 📐 Business Rule Logic: Scale back expectations for junior divisions (U13 - U15) 
  // matches local school sports structures where fields or durations are modified.
  const isJuniorMetricTrack = ageGroup === "U13" || ageGroup === "U14" || ageGroup === "U15";

  if (isJuniorMetricTrack) {
    adjustedConfig.successMetrics = adjustedConfig.successMetrics.map((metric) => {
      if (metric.label === "Distance Covered") {
        return { ...metric, target: "> 6.5 km/game" }; // Scaled down from 10km for smaller hearts/lungs
      }
      if (metric.label === "Sprint Speed Burst (0-20m)") {
        return { ...metric, target: "< 3.4s" }; // Reasonable developmental sprint target
      }
      return metric;
    });
  }

  return adjustedConfig;
}

export const POSITION_FOCUS_MAP = STATIC_POSITION_MAP;
export const POSITION_KEYS = Object.keys(STATIC_POSITION_MAP);