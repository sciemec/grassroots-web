export interface PositionFocusDetail {
  title: string;
  badgeColor: string;
  physicalFocus: string[];
  thutoGreeting: string;
  thutoSystemPrompt: string;
  successMetrics: string[];
  quickPrompts: string[];
}

export const POSITION_FOCUS_MAP: Record<string, PositionFocusDetail> = {
  striker: {
    title: "Attacking Specialization",
    badgeColor: "bg-amber-50 text-[#c8962a] border-amber-200",
    physicalFocus: ["acceleration", "sprint_speed", "finishing", "positioning"],
    thutoGreeting: "Salibonani! I'm THUTO, your Attacking Agent. Ready to sharpen your positioning, turn defenders in the box, and boost your goal-conversion stats today?",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in attacking development for Zimbabwean grassroots strikers. Focus on high-intensity acceleration metrics, box movement (NASH tournament style), composure under pressure, and clinical finishing. Keep advice data-light, practical, and highly encouraging.",
    successMetrics: [
      "Shot Conversion Rate (Goals/Shots Ratio)",
      "Expected Goals (xG) Performance",
      "Box Touches & Attacking Third Penetration",
      "Sprint Speed Burst Acceleration (0-20m)"
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
    physicalFocus: ["stamina", "short_passing", "vision", "agility"],
    thutoGreeting: "Maziwisa! THUTO here, managing the engine room with you. Let's work on maximizing your pass completion tracking, scanning velocity, and transitions today.",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in midfield transitions and playmaking mechanics. Your coaching parameters focus heavily on spatial awareness, short-passing accuracy under high counter-pressures, tactical scanning frequency, and stamina management tailored for local pitches.",
    successMetrics: [
      "Passing Accuracy & Key Pass Completion",
      "Scanning Frequency (Beats Per Minute before receiving)",
      "Recovery Tackles & Interceptions",
      "Aerobic Endurance Engine Load (Total KM covered)"
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
    physicalFocus: ["strength", "interceptions", "sliding_tackle", "jumping_reach"],
    thutoGreeting: "Greetings! THUTO here at the back. Ready to lock down the defensive line, optimize your body positioning during 1v1 duels, and improve your aerial clearance metrics?",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in defensive optimization and structure. Guide players on 1v1 tactical delay positioning, aerial clearance timing, structural interception paths, and recovery speed mechanics. Emphasize communication and tactical discipline.",
    successMetrics: [
      "1v1 Defensive Duel Success Rate",
      "Interceptions per 90 Minutes",
      "Aerial Aerial Clearance Efficiency",
      "Defensive Line Cohesion & Recovery Speed"
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
    physicalFocus: ["reflexes", "handling", "diving", "gk_positioning"],
    thutoGreeting: "Salibonani! THUTO here between the posts. Let's optimize your handling mechanics, target reactive reflex triggers, and command the 18-yard box like a pro today.",
    thutoSystemPrompt: "You are THUTO, an elite AI Football Agent specializing in Goalkeeping mechanics and high-density shot-stopping analytics. Focus on handling distribution velocity, reactive reflexes, penalty area positioning guidelines, and cross-claim communication structures.",
    successMetrics: [
      "Save Percentage & Clean Sheet Counts",
      "Reactive Reflex Stop Velocity",
      "Cross Claiming & High-Ball Catch Efficiency",
      "Distribution Accuracy (Passes/Throws completed)"
    ],
    quickPrompts: [
      "What drills can improve my reactive reflex speed?",
      "How do I position myself better for long-range shots?",
      "Show me the best technique for claiming crosses cleanly."
    ]
  },
  // Generic fallback configuration to completely safeguard against profile data inconsistencies
  fallback: {
    title: "Grassroots Development Track",
    badgeColor: "bg-gray-50 text-gray-700 border-gray-200",
    physicalFocus: ["acceleration", "stamina", "ball_control", "agility"],
    thutoGreeting: "Welcome to your Player Dashboard! I am THUTO, your comprehensive AI Agent. Ready to design personalized performance circuits and supercharge your data visibility matrix?",
    thutoSystemPrompt: "You are THUTO, the master AI Sports Agent for GrassRoots Sports Zimbabwe. Provide holistic, cross-sport, data-light talent development coaching parameters. Maximize player retention, track profile data, and guide athletes onto clear scout-ready identification loops.",
    successMetrics: [
      "Overall Technical Consistency Rating",
      "Weekly Target Completion Velocity",
      "Physical Fitness Metric Aggregates",
      "Talent Hub Scout View Activity Tracker"
    ],
    quickPrompts: [
      "How do I optimize my weekly training schedule?",
      "What metrics do scouts look for on my talent passport?",
      "Give me a universal full-body conditioning drill."
    ]
  }
};