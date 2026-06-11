// lib/department-drills.ts

export interface Drill {
  id: string;
  name: string;
  duration: string;
  description: string;
  coachingPoints: string[];
  equipment: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  department: string;
  phase: string;
  imageUrl?: string;
  videoUrl?: string;
}

// Complete department-specific drill library
export const DEPARTMENT_DRILLS: Record<string, Drill[]> = {
  // STRIKER / ATTACK COACH DRILLS
  striker: [
    { 
      id: "att_01", 
      name: "Lions' Den Central Turning", 
      duration: "15 mins", 
      description: "Receive a firm vertical entry pass inside a tight, heavily congested 8x8-yard embedded square under physical contact. Protect the ball with your body, turn sharply on the half-turn, and play forward to a teammate.",
      coachingPoints: [
        "Body between defender and ball",
        "Check shoulder before receiving",
        "Use furthest foot from defender to turn",
        "Accelerate away after turn"
      ],
      equipment: ["8x8 yard square", "Cones", "Football x2", "Bibs"],
      difficulty: "intermediate",
      department: "striker",
      phase: "Technical"
    },
    { 
      id: "att_02", 
      name: "Tri-Third Elimination End Zones", 
      duration: "20 mins", 
      description: "Combine out of the defensive third to play an incisive, firm line-breaking pass past the midfield layer. Time your forward run into the shaded end zone to collect and finish without running offside.",
      coachingPoints: [
        "Timing of run",
        "Body shape to receive",
        "First touch into space",
        "Finish with composure"
      ],
      equipment: ["30x40 yard pitch", "End zone markers", "Goals", "Cones"],
      difficulty: "advanced",
      department: "striker",
      phase: "Tactical"
    },
    { 
      id: "att_03", 
      name: "Three-Goal Endline Finale", 
      duration: "15 mins", 
      description: "Small-sided competitive match attacking a baseline equipped with one large central goal and two corner mini-goals. Any regular goal is 1 point; an instinctive first-time finish is worth 2 points.",
      coachingPoints: [
        "Scan before receiving",
        "First-time finishing technique",
        "Movement off the ball",
        "Awareness of defender position"
      ],
      equipment: ["1 large goal", "2 mini goals", "Bibs", "Football"],
      difficulty: "intermediate",
      department: "striker",
      phase: "Game"
    },
    { 
      id: "att_04", 
      name: "Double Trouble Combination", 
      duration: "15 mins", 
      description: "Attack a keeper and a defender in pairs on a 35x25-yard pitch. Move and combine to open up space and score.",
      coachingPoints: [
        "Wall passes",
        "Overlap runs",
        "Third-man runs",
        "Disguise your intentions"
      ],
      equipment: ["Goal", "Keeper gloves", "Cones", "Football"],
      difficulty: "advanced",
      department: "striker",
      phase: "Combination"
    }
  ],

  // DEFENDER / DEFENCE COACH DRILLS
  defender: [
    { 
      id: "def_01", 
      name: "Angled Pressing & Directional Dictation", 
      duration: "15 mins", 
      description: "Approach a perimeter attacker at an angle rather than straight-on to limit their options. Get within arm's-length to apply high pressure and dictate their movement toward the wide sidelines.",
      coachingPoints: [
        "Curved approach run",
        "Side-on body position",
        "Show to weaker side",
        "Arm's length distance"
      ],
      equipment: ["30x20 yard area", "Cones", "Football"],
      difficulty: "intermediate",
      department: "defender",
      phase: "Technical"
    },
    { 
      id: "def_02", 
      name: "Cover and Recover Horizontal Channels", 
      duration: "15 mins", 
      description: "Work in tandem inside a pitch split horizontally into thirds. Establish optimal supporting distances between the pressing and covering players.",
      coachingPoints: [
        "Distance management",
        "Communication",
        "Recovery runs",
        "Trigger to step out"
      ],
      equipment: ["Split pitch", "Cones", "Bibs", "Football"],
      difficulty: "intermediate",
      department: "defender",
      phase: "Tactical"
    },
    { 
      id: "def_03", 
      name: "Line Cover and Press 2v2", 
      duration: "20 mins", 
      description: "Small-sided area with mini-goals behind a baseline. The out-of-possession duo must work together: one player steps out to press while the other provides deep cover.",
      coachingPoints: [
        "Press/cover relationship",
        "Delay vs deny decision",
        "Compactness",
        "Communication"
      ],
      equipment: ["2 mini goals", "30x25 yard area", "Bibs", "Football"],
      difficulty: "advanced",
      department: "defender",
      phase: "Game"
    },
    { 
      id: "def_04", 
      name: "Stadium Game 1v1 Marking", 
      duration: "15 mins", 
      description: "Pair up with an opponent inside an isolated half of a 30x20-yard area. Stay close to prevent them from receiving the ball easily, position goal-side, and use a side-on stance.",
      coachingPoints: [
        "Goal-side positioning",
        "Side-on stance",
        "Watch the ball, not the player",
        "Interception timing"
      ],
      equipment: ["30x20 yard area", "Cones", "Football"],
      difficulty: "intermediate",
      department: "defender",
      phase: "1v1"
    }
  ],

  // MIDFIELDER / MIDFIELD COACH DRILLS
  midfielder: [
    { 
      id: "mid_01", 
      name: "Barcelona 3-2-1 Build Up Choices", 
      duration: "15 mins", 
      description: "7v7 positional small-sided game. Receive deep build-up passes, scan before receiving, use your back foot to open your body shape, and decide whether to combine or switch play.",
      coachingPoints: [
        "Open body shape",
        "Scan before receiving",
        "Play away from pressure",
        "Decision making"
      ],
      equipment: ["7v7 pitch", "Goals", "Bibs", "Football"],
      difficulty: "advanced",
      department: "midfielder",
      phase: "Tactical"
    },
    { 
      id: "mid_02", 
      name: "Around the Clock Passing Ring", 
      duration: "12 mins", 
      description: "Position symmetrically around a 20-yard diameter circle area. Execute rapid one-touch and two-touch passing patterns through and across the clock structure.",
      coachingPoints: [
        "Weight of pass",
        "One-touch technique",
        "Movement after pass",
        "Scan before receiving"
      ],
      equipment: ["20-yard circle", "Cones numbered 1-12", "Football"],
      difficulty: "intermediate",
      department: "midfielder",
      phase: "Technical"
    },
    { 
      id: "mid_03", 
      name: "Connect Four Corner Squares", 
      duration: "20 mins", 
      description: "A 35x20-yard directional transition game. Midfielders use quick horizontal circulation to pull the defensive block out of alignment, then launch a vertical through-ball.",
      coachingPoints: [
        "Horizontal circulation",
        "Disguise passes",
        "Through-ball timing",
        "Third-man combinations"
      ],
      equipment: ["35x20 yard pitch", "Corner flags", "Cones", "Football"],
      difficulty: "advanced",
      department: "midfielder",
      phase: "Transition"
    },
    { 
      id: "mid_04", 
      name: "Table Football Tri-Thirds Match", 
      duration: "25 mins", 
      description: "Play a match inside a field split into thirds where outfielders are entirely locked into their areas to emphasize vertical lines and movement between lines.",
      coachingPoints: [
        "Playing through lines",
        "Off-ball movement",
        "Tempo control",
        "Switch of play"
      ],
      equipment: ["Split pitch", "Goals", "Bibs", "Football"],
      difficulty: "intermediate",
      department: "midfielder",
      phase: "Positional"
    }
  ],

  // GOALKEEPER / GK COACH DRILLS
  goalkeeper: [
    { 
      id: "gk_01", 
      name: "Ground Side-Diving & Ball Recovery", 
      duration: "15 mins", 
      description: "Crouch to lower your center of gravity before diving on the side of your body. Get both hands to the ball using the secure 'M' technique, then immediately hug it into your chest.",
      coachingPoints: [
        "Low center of gravity",
        "Lead with hands",
        "Secure the ball",
        "Protect after save"
      ],
      equipment: ["Goal", "Football x6", "Diving mat", "Keeper gloves"],
      difficulty: "intermediate",
      department: "goalkeeper",
      phase: "Technical"
    },
    { 
      id: "gk_02", 
      name: "The 'W' & 'M' Handling Fundamentals", 
      duration: "10 mins", 
      description: "Practice forming a 'W' with your thumbs almost touching to secure incoming high balls, and an 'M' with little fingers touching to handle low balls.",
      coachingPoints: [
        "W-shape for high balls",
        "M-shape for low balls",
        "Soft hands",
        "Eyes on the ball"
      ],
      equipment: ["Goal", "Football x10", "Rebounder", "Keeper gloves"],
      difficulty: "beginner",
      department: "goalkeeper",
      phase: "Technical"
    },
    { 
      id: "gk_03", 
      name: "Circular Target-Gate Angle Coverage", 
      duration: "15 mins", 
      description: "Position inside standalone square keeper boxes placed symmetrically within a circle layout. Move dynamically to adjust your positioning angle relative to passing pairs.",
      coachingPoints: [
        "Angle positioning",
        "Set position",
        "Footwork",
        "Decision making"
      ],
      equipment: ["Goal", "Cones", "Football x8", "Keeper gloves"],
      difficulty: "advanced",
      department: "goalkeeper",
      phase: "Positional"
    },
    { 
      id: "gk_04", 
      name: "Feeder-Attacker Isolation Guard", 
      duration: "15 mins", 
      description: "Manage angle coverage in a 20x15-yard pitch with a goal at one end. Direct your defender to mark the attacker tight, tracking the ball from the feeder.",
      coachingPoints: [
        "Organize defenders",
        "Narrow the angle",
        "Set position timing",
        "Communication"
      ],
      equipment: ["Goal", "Cones", "Football", "Keeper gloves"],
      difficulty: "intermediate",
      department: "goalkeeper",
      phase: "Game"
    }
  ],

  // FITNESS / FITNESS COACH DRILLS
  fitness: [
    { 
      id: "fit_01", 
      name: "Yo-Yo Intermittent Recovery Test", 
      duration: "20 mins", 
      description: "Progressive shuttle runs measuring aerobic endurance with 10-second active recovery between shuttles. Standardized test for player fitness assessment.",
      coachingPoints: [
        "Pacing strategy",
        "Recovery technique",
        "Mental toughness",
        "Consistent turnover"
      ],
      equipment: ["Cones", "Audio track", "Flat surface", "Heart rate monitors"],
      difficulty: "advanced",
      department: "fitness",
      phase: "Testing"
    },
    { 
      id: "fit_02", 
      name: "Agility Ladder & Cone Drill Circuit", 
      duration: "15 mins", 
      description: "Multi-station agility circuit including ladder drills, cone weaves, and reaction gates. Improves foot speed, coordination, and change of direction.",
      coachingPoints: [
        "Light on feet",
        "Low center of gravity",
        "Quick feet",
        "Head up while moving"
      ],
      equipment: ["Agility ladder", "Cones x12", "Reaction gates", "Stopwatch"],
      difficulty: "intermediate",
      department: "fitness",
      phase: "Agility"
    },
    { 
      id: "fit_03", 
      name: "High-Intensity Interval Training (HIIT) Circuits", 
      duration: "20 mins", 
      description: "20 seconds max effort, 10 seconds rest repeated for 8 rounds. Combines sprints, bodyweight exercises, and sport-specific movements.",
      coachingPoints: [
        "Max effort during work intervals",
        "Active recovery",
        "Proper breathing technique",
        "Form under fatigue"
      ],
      equipment: ["Cones", "Stopwatch", "Heart rate monitors", "Water station"],
      difficulty: "advanced",
      department: "fitness",
      phase: "Conditioning"
    },
    { 
      id: "fit_04", 
      name: "Recovery & Regeneration Protocol", 
      duration: "20 mins", 
      description: "Post-match recovery session including light jogging, stretching, foam rolling, and hydration strategies.",
      coachingPoints: [
        "Active recovery pace",
        "Static stretching technique",
        "Hydration timing",
        "Sleep importance"
      ],
      equipment: ["Foam rollers", "Yoga mats", "Water bottles", "Protein shakes"],
      difficulty: "beginner",
      department: "fitness",
      phase: "Recovery"
    }
  ],

  // ANALYTICS / PERFORMANCE ANALYST DRILLS
  analytics: [
    { 
      id: "ana_01", 
      name: "Match Coding & Key Event Analysis", 
      duration: "45 mins", 
      description: "Code key match events: passes, shots, tackles, interceptions. Generate statistical reports for team review and opposition scouting.",
      coachingPoints: [
        "Event definition consistency",
        "Timing accuracy",
        "Data interpretation",
        "Report generation"
      ],
      equipment: ["Video analysis software", "Match footage", "Coding sheet", "Laptop"],
      difficulty: "advanced",
      department: "analytics",
      phase: "Analysis"
    },
    { 
      id: "ana_02", 
      name: "Heat Map & Positioning Analysis", 
      duration: "30 mins", 
      description: "Generate positional heat maps from match tracking data. Identify player zones, space utilization, and tactical shape maintenance.",
      coachingPoints: [
        "Data visualization",
        "Zone interpretation",
        "Shape analysis",
        "Player comparisons"
      ],
      equipment: ["Tracking data", "Analysis software", "Heat map tools"],
      difficulty: "intermediate",
      department: "analytics",
      phase: "Visualization"
    },
    { 
      id: "ana_03", 
      name: "xG (Expected Goals) Modeling Workshop", 
      duration: "60 mins", 
      description: "Introduction to xG models, shot quality assessment, and predictive analytics for attacking efficiency.",
      coachingPoints: [
        "xG calculation basics",
        "Shot quality factors",
        "Data interpretation",
        "Practical applications"
      ],
      equipment: ["Shot data", "Statistical software", "Training materials"],
      difficulty: "advanced",
      department: "analytics",
      phase: "Advanced Metrics"
    },
    { 
      id: "ana_04", 
      name: "Opposition Scouting Report", 
      duration: "45 mins", 
      description: "Analyze next opponent's formation, key players, set pieces, and tactical tendencies. Generate comprehensive scouting document.",
      coachingPoints: [
        "Pattern recognition",
        "Key player identification",
        "Set piece analysis",
        "Weakness exploitation"
      ],
      equipment: ["Opposition footage", "Analysis software", "Report template"],
      difficulty: "advanced",
      department: "analytics",
      phase: "Scouting"
    }
  ],

  // MEDICAL / TEAM PHYSIO DRILLS & PROTOCOLS
  medical: [
    { 
      id: "med_01", 
      name: "Concussion Recognition & Response Protocol", 
      duration: "30 mins", 
      description: "FA medical safeguard training: Recognize concussion symptoms, immediate response protocols, and graduated return-to-play timeline management.",
      coachingPoints: [
        "If in doubt, sit them out",
        "Symptom recognition",
        "Pocket SCAT5 tool use",
        "Return-to-play stages"
      ],
      equipment: ["SCAT5 forms", "First aid kit", "Training slides", "Assessment tools"],
      difficulty: "intermediate",
      department: "medical",
      phase: "Emergency"
    },
    { 
      id: "med_02", 
      name: "Injury Prevention: FIFA 11+ Program", 
      duration: "20 mins", 
      description: "Complete FIFA 11+ warm-up program proven to reduce injury rates by 30-50%. Includes running, strength, plyometrics, and balance exercises.",
      coachingPoints: [
        "Proper form on all exercises",
        "Progressive difficulty",
        "Consistent implementation",
        "Player monitoring"
      ],
      equipment: ["Cones", "Resistance bands", "Balance pads", "First aid kit"],
      difficulty: "intermediate",
      department: "medical",
      phase: "Prevention"
    },
    { 
      id: "med_03", 
      name: "Soft Tissue Injury Assessment & Taping", 
      duration: "45 mins", 
      description: "Practical session on assessing muscle strains, ligament sprains, and applying prophylactic taping for at-risk areas.",
      coachingPoints: [
        "Injury grading",
        "Taping techniques",
        "Return criteria",
        "Rehab progression"
      ],
      equipment: ["Athletic tape", "Scissors", "Pre-wrap", "Assessment forms"],
      difficulty: "advanced",
      department: "medical",
      phase: "Treatment"
    },
    { 
      id: "med_04", 
      name: "Hydration & Nutrition for Match Day", 
      duration: "20 mins", 
      description: "Player education session on pre-match, during-match, and post-match hydration and fueling strategies for optimal performance.",
      coachingPoints: [
        "Pre-match meal timing",
        "Hydration schedule",
        "Half-time refueling",
        "Recovery window"
      ],
      equipment: ["Hydration charts", "Sample meal plans", "Water bottles", "Nutrition guides"],
      difficulty: "beginner",
      department: "medical",
      phase: "Wellness"
    },
    { 
      id: "med_05", 
      name: "Recovery Monitoring & Fatigue Tracking", 
      duration: "25 mins", 
      description: "Implement daily wellness questionnaires, fatigue tracking, and load management protocols to prevent overtraining.",
      coachingPoints: [
        "Wellness scoring",
        "Load monitoring",
        "Recovery indicators",
        "Red flag recognition"
      ],
      equipment: ["Tracking sheets", "Wellness app", "Heart rate variability tools"],
      difficulty: "intermediate",
      department: "medical",
      phase: "Monitoring"
    }
  ],

  // ADMIN / TEAM MANAGER DRILLS & TASKS
  admin: [
    { 
      id: "adm_01", 
      name: "Player Registration & NASH Filing", 
      duration: "60 mins", 
      description: "Complete Zimbabwe football association registration process, NASH/NAPH filing requirements, and player passport documentation.",
      coachingPoints: [
        "Document collection",
        "Deadline management",
        "Compliance checking",
        "Digital filing systems"
      ],
      equipment: ["Registration forms", "ID documents", "Computer", "Scanner"],
      difficulty: "intermediate",
      department: "admin",
      phase: "Compliance"
    },
    { 
      id: "adm_02", 
      name: "Fixture Scheduling & Logistics Planning", 
      duration: "45 mins", 
      description: "Coordinate match fixtures, transportation, accommodation, and equipment logistics for away games and tournament travel.",
      coachingPoints: [
        "Calendar management",
        "Transport booking",
        "Accommodation planning",
        "Equipment inventory"
      ],
      equipment: ["Calendar software", "Booking platforms", "Inventory sheets"],
      difficulty: "intermediate",
      department: "admin",
      phase: "Logistics"
    },
    { 
      id: "adm_03", 
      name: "Kit Management & Equipment Inventory", 
      duration: "30 mins", 
      description: "Track training kit, match uniforms, and equipment. Manage laundry cycles, size exchanges, and end-of-season returns.",
      coachingPoints: [
        "Inventory tracking",
        "Size management",
        "Laundry rotation",
        "Lost equipment protocol"
      ],
      equipment: ["Inventory sheets", "Laundry tags", "Storage bins", "Kit bags"],
      difficulty: "beginner",
      department: "admin",
      phase: "Operations"
    },
    { 
      id: "adm_04", 
      name: "Player Talent Passport Management", 
      duration: "40 mins", 
      description: "Maintain digital player portfolios including completed drills, coaching points mastered, match stats, and scouting reports.",
      coachingPoints: [
        "Data entry standards",
        "Portfolio organization",
        "Progress tracking",
        "Scout accessibility"
      ],
      equipment: ["Digital platform", "Player data", "Drill completion logs"],
      difficulty: "intermediate",
      department: "admin",
      phase: "Documentation"
    },
    { 
      id: "adm_05", 
      name: "Budget Management & Grant Applications", 
      duration: "60 mins", 
      description: "Manage academy budget, track expenses, and prepare grant applications for equipment, facility, and development funding.",
      coachingPoints: [
        "Budget tracking",
        "Expense categorization",
        "Grant writing",
        "Financial reporting"
      ],
      equipment: ["Spreadsheet software", "Financial records", "Grant templates"],
      difficulty: "advanced",
      department: "admin",
      phase: "Finance"
    }
  ],

  // ALL DRILLS (for Head Coach & Assistant Coach)
  all: [] // This will be populated dynamically
};

// Populate the 'all' category with all drills
DEPARTMENT_DRILLS.all = [
  ...DEPARTMENT_DRILLS.striker,
  ...DEPARTMENT_DRILLS.defender,
  ...DEPARTMENT_DRILLS.midfielder,
  ...DEPARTMENT_DRILLS.goalkeeper,
  ...DEPARTMENT_DRILLS.fitness,
  ...DEPARTMENT_DRILLS.analytics,
  ...DEPARTMENT_DRILLS.medical,
  ...DEPARTMENT_DRILLS.admin
];

// Helper functions
export const getDrillsByDepartment = (department: string): Drill[] => {
  return DEPARTMENT_DRILLS[department] || [];
};

export const getDrillById = (drillId: string): Drill | undefined => {
  for (const department in DEPARTMENT_DRILLS) {
    const drill = DEPARTMENT_DRILLS[department].find(d => d.id === drillId);
    if (drill) return drill;
  }
  return undefined;
};

export const getDrillsByDifficulty = (difficulty: "beginner" | "intermediate" | "advanced"): Drill[] => {
  return DEPARTMENT_DRILLS.all.filter(drill => drill.difficulty === difficulty);
};

export const getDrillsByPhase = (phase: string): Drill[] => {
  return DEPARTMENT_DRILLS.all.filter(drill => drill.phase.toLowerCase() === phase.toLowerCase());
};

export const getDepartmentStats = () => {
  return {
    striker: DEPARTMENT_DRILLS.striker.length,
    defender: DEPARTMENT_DRILLS.defender.length,
    midfielder: DEPARTMENT_DRILLS.midfielder.length,
    goalkeeper: DEPARTMENT_DRILLS.goalkeeper.length,
    fitness: DEPARTMENT_DRILLS.fitness.length,
    analytics: DEPARTMENT_DRILLS.analytics.length,
    medical: DEPARTMENT_DRILLS.medical.length,
    admin: DEPARTMENT_DRILLS.admin.length,
    total: DEPARTMENT_DRILLS.all.length
  };
};