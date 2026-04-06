// Football Formats Knowledge Base
// Source: Football Knowledge Hub — grassroots coaching guide
// Used by: /coach/futurefit (FutureFit Junior Development Hub)

// ─── AGE GROUP FORMATS TABLE ──────────────────────────────────────────────────

export interface FormatRow {
  age: string;
  format: string;
  ball: string;
  recommended: string;
  min: string;
  max: string;
  goal: string;
}

export const FORMATS_TABLE: FormatRow[] = [
  { age: "Under 7 (Year 2)",  format: "3v3",   ball: "Size 3", recommended: "15 x 10", min: "15 x 10", max: "20 x 15",  goal: "4 x 2.5"  },
  { age: "Under 8 (Year 3)",  format: "5v5",   ball: "Size 3", recommended: "37 x 27", min: "27 x 18", max: "37 x 27",  goal: "12 x 6"   },
  { age: "Under 9 (Year 4)",  format: "5v5",   ball: "Size 3", recommended: "37 x 27", min: "27 x 18", max: "37 x 27",  goal: "12 x 6"   },
  { age: "Under 10 (Year 5)", format: "7v7",   ball: "Size 3", recommended: "55 x 37", min: "46 x 27", max: "55 x 37",  goal: "12 x 6"   },
  { age: "Under 11 (Year 6)", format: "7v7",   ball: "Size 3", recommended: "55 x 37", min: "46 x 27", max: "55 x 37",  goal: "12 x 6"   },
  { age: "Under 12 (Year 7)", format: "9v9",   ball: "Size 4", recommended: "73 x 46", min: "64 x 37", max: "73 x 46",  goal: "16 x 7"   },
  { age: "Under 13 (Year 8)", format: "9v9",   ball: "Size 4", recommended: "73 x 46", min: "64 x 37", max: "73 x 46",  goal: "16 x 7"   },
  { age: "Under 14 (Year 9)", format: "11v11", ball: "Size 5", recommended: "82 x 50", min: "82 x 46", max: "91 x 55",  goal: "21 x 7*"  },
  { age: "Under 15 (Year 10)",format: "11v11", ball: "Size 5", recommended: "91 x 55", min: "82 x 46", max: "100 x 64", goal: "24 x 8**" },
  { age: "Under 16 (Year 11)",format: "11v11", ball: "Size 5", recommended: "91 x 55", min: "82 x 46", max: "100 x 64", goal: "24 x 8"   },
  { age: "Under 17 (Year 12)",format: "11v11", ball: "Size 5", recommended: "100 x 64",min: "91 x 46", max: "118 x 91", goal: "24 x 8"   },
  { age: "Under 18 (Year 13)",format: "11v11", ball: "Size 5", recommended: "100 x 64",min: "91 x 46", max: "118 x 91", goal: "24 x 8"   },
  { age: "Open Age",          format: "11v11", ball: "Size 5", recommended: "100 x 64",min: "91 x 46", max: "118 x 91", goal: "24 x 8"   },
];

export const FORMAT_COLORS: Record<string, string> = {
  "3v3":   "#006400",
  "5v5":   "#B8860B",
  "7v7":   "#8B0000",
  "9v9":   "#1a5276",
  "11v11": "#6c3483",
};

// ─── TRAINING SESSION PLANS ───────────────────────────────────────────────────

export interface Drill {
  name: string;
  duration: string;
  players: string;
  setup: string;
  objective: string;
  cues: string[];
  progression: string;
}

export interface Warmup {
  name: string;
  duration: string;
  players: string;
  setup: string;
  cues: string[];
}

export interface TrainingFormat {
  id: string;
  format: string;
  ages: string;
  color: string;
  icon: string;
  priority: string;
  formation: string;
  sessionLength: string;
  frequency: string;
  overview: string;
  warmup: Warmup;
  drills: Drill[];
}

export const TRAINING_FORMATS: TrainingFormat[] = [
  {
    id: "5v5",
    format: "5v5",
    ages: "U8 – U9",
    color: "#B8860B",
    icon: "⚽",
    priority: "Individual Technique",
    formation: "No fixed formation — free roles",
    sessionLength: "60 minutes max",
    frequency: "1 session per week",
    overview:
      "At this age the focus is on developing love of the game, ball confidence, and basic 1v1 skills. Every drill should have lots of touches and feel like play, not work.",
    warmup: {
      name: "Passing Circle Warm-Up",
      duration: "10 min",
      players: "All",
      setup:
        "Players stand in a circle, 1 ball. Pass around the circle, then reverse direction. Progress to one-touch.",
      cues: [
        "Use the inside of your foot",
        "Call the name of who you're passing to",
        "Head up to see the next pass",
      ],
    },
    drills: [
      {
        name: "1v1 Battles",
        duration: "15 min",
        players: "Pairs",
        setup:
          "Two cones 10m apart as goals. Pairs play 1v1. First to 5 goals wins. Rotate pairs every 3 minutes.",
        objective:
          "Build confidence in 1v1 attacking and defending. Learn body positioning and deception.",
        cues: [
          "Attackers: use a fake before going past",
          "Defenders: stay on your feet, don't dive in",
          "Celebrate good defending too",
        ],
        progression:
          "Add a 3-second rule — attacker must attempt a move within 3 seconds of receiving.",
      },
      {
        name: "Pass & Move",
        duration: "15 min",
        players: "Groups of 4",
        setup:
          "20x15m grid. 4 players passing in sequence. After each pass, the passer must run to a new spot before receiving again.",
        objective:
          "Teach the fundamental habit of moving after passing — the basis of all team play.",
        cues: [
          "Pass then move — never stand still",
          "Make your run before the ball arrives",
          "Call for the ball when you're free",
        ],
        progression: "Add a defender in the middle — keep the ball away from them.",
      },
      {
        name: "Dribble & Shield",
        duration: "10 min",
        players: "All — solo",
        setup:
          "20x20m area. All players have a ball. Dribble freely. Coach calls 'freeze!' — players must shield their ball for 5 seconds.",
        objective: "Develop close ball control and body awareness when under pressure.",
        cues: [
          "Keep the ball close — small touches",
          "Body between the ball and the defender",
          "Head up to see where others are",
        ],
        progression: "Add 2 chasers who try to kick balls out of the area.",
      },
      {
        name: "5v5 Small Game",
        duration: "20 min",
        players: "Full squad — rotate",
        setup:
          "Play the actual 5v5 format on a 37x27m pitch. Use proper mini goals. Play 2 x 10 min halves.",
        objective: "Apply everything learned in the session in a real game environment.",
        cues: [
          "Encourage — never shout instructions during play",
          "Let them solve problems",
          "Praise effort and bravery on the ball",
        ],
        progression: "Challenge: can your team score using a pass before shooting?",
      },
    ],
  },
  {
    id: "7v7",
    format: "7v7",
    ages: "U10 – U11",
    color: "#8B0000",
    icon: "🏟️",
    priority: "Individual Technique + Basic Shape",
    formation: "2-3-1 (recommended)",
    sessionLength: "70–80 minutes",
    frequency: "1–2 sessions per week",
    overview:
      "Players now understand basic play. Introduce simple team shape using the 2-3-1. Focus on width, triangles, and basic defensive positioning. Rotate positions every session.",
    warmup: {
      name: "Triangle Passing Rondo",
      duration: "12 min",
      players: "Groups of 3",
      setup:
        "3 cones forming a triangle, 8m apart. Pass around the triangle, then reverse. Progress to one-touch. Add a defender in the middle.",
      cues: [
        "Form the triangle before the pass arrives",
        "Weight of pass must reach the target",
        "Move after every pass — no standing",
      ],
    },
    drills: [
      {
        name: "Width & Support Drill",
        duration: "15 min",
        players: "Groups of 5",
        setup:
          "40x30m grid with 2 wide channels (5m each side). 4v1 possession — attacking team must use the wide channels at least once before scoring through a gate.",
        objective: "Teach players to use width, find space, and not crowd around the ball.",
        cues: [
          "Get wide — pull the defender away",
          "Look for the player in the channel",
          "One touch in the channel, then quick pass inside",
        ],
        progression: "Make it 4v2, then 5v3.",
      },
      {
        name: "Shadow Defending",
        duration: "12 min",
        players: "Pairs",
        setup:
          "1 attacker dribbles slowly through a 20m channel. 1 defender follows WITHOUT tackling — they shadow, mirror movement, and control the attacker's direction.",
        objective:
          "Build patience, correct defensive body shape, and channel awareness before tackling is introduced.",
        cues: [
          "Stay on your toes — low and balanced",
          "Force them toward the touchline",
          "Don't dive in — wait for the mistake",
        ],
        progression: "After 5 rounds, allow the defender to make a tackle.",
      },
      {
        name: "2v1 Overload",
        duration: "12 min",
        players: "Groups of 3",
        setup:
          "15x10m channel with a small goal. 2 attackers vs 1 defender. Attackers start 5m back. Score in the goal.",
        objective:
          "Teach attackers to use numerical advantage. Teach the decision: dribble or pass?",
        cues: [
          "If defender comes to you — pass",
          "If defender drops — drive forward",
          "Support player: show for the ball, don't hide",
        ],
        progression: "Add a second defender joining after 3 seconds.",
      },
      {
        name: "7v7 Shape Game",
        duration: "25 min",
        players: "Full squad",
        setup:
          "Play 7v7 on a 55x37m pitch. Use the 2-3-1 formation. Play 2 x 12 min halves. Rotate positions at half time.",
        objective:
          "Apply the 2-3-1 shape in a real game. Don't over-coach — let them play.",
        cues: [
          "Remind players of their starting positions only",
          "Encourage wide play",
          "Rotate positions so everyone experiences different roles",
        ],
        progression: "Award bonus points for goals scored after a wide pass.",
      },
    ],
  },
  {
    id: "9v9",
    format: "9v9",
    ages: "U12 – U13",
    color: "#1a5276",
    icon: "📐",
    priority: "Technique at Speed + Team Organisation",
    formation: "3-3-2 or 3-2-3",
    sessionLength: "80–90 minutes",
    frequency: "2 sessions per week",
    overview:
      "This is the bridge to full football. Players are ready for tactical concepts: pressing, compactness, transitions, and offside. Train position-specific skills and introduce structured team defending.",
    warmup: {
      name: "Rondo 4v2",
      duration: "15 min",
      players: "Groups of 6",
      setup:
        "15x15m grid. 4 players keep the ball from 2 defenders. When defenders win it, the 2 who lost it become the new defenders.",
      cues: [
        "Quick one and two-touch play",
        "Play away from pressure — find the free player",
        "Defenders: press together, not one at a time",
      ],
    },
    drills: [
      {
        name: "Pressing Trigger Drill",
        duration: "15 min",
        players: "Full team — split into two groups",
        setup:
          "Half pitch. Attacking team tries to build from back. Defending team learns one press trigger: when the ball goes to the goalkeeper, the front 2 press immediately.",
        objective:
          "Teach a shared trigger for pressing — the start of organised team defending.",
        cues: [
          "Everyone moves together when the trigger happens",
          "Press with purpose — angle to close the pass",
          "If the press is beaten, drop and reset — don't chase",
        ],
        progression: "Add a second trigger: press when a defender turns their back.",
      },
      {
        name: "3v2 Finishing",
        duration: "15 min",
        players: "Groups of 5",
        setup:
          "Mark out an 18-yard box. 3 attackers vs 2 defenders + goalkeeper. First attacker passes into the box to start. Attackers can only shoot after receiving and controlling the ball.",
        objective:
          "Develop combination play in the final third and composed finishing under pressure.",
        cues: [
          "Control first — then look to shoot",
          "Draw the defender before the final pass",
          "Shot: low and across the goalkeeper",
        ],
        progression: "Reduce to 3v3 for more defensive challenge.",
      },
      {
        name: "4-Goal Scanning Game",
        duration: "15 min",
        players: "8–10 players",
        setup:
          "30x20m area with 4 small goals at the corners. Two teams of 4. Each team can score in EITHER of their two assigned goals. Forces constant scanning and defensive organisation.",
        objective: "Develop awareness, communication, and defensive compactness.",
        cues: [
          "Scan before you receive — know where both goals are",
          "Defend as a unit — compress when the ball is far",
          "Call out which goal they're threatening",
        ],
        progression: "Reduce the goal size to raise the accuracy demand.",
      },
      {
        name: "9v9 Tactical Game",
        duration: "30 min",
        players: "Full squad",
        setup:
          "Play 9v9 on a 73x46m pitch. Use the 3-3-2. Focus for the game: apply the press trigger drill from earlier.",
        objective: "Transfer the pressing concept into a full game environment.",
        cues: [
          "Praise when the press works collectively",
          "Pause and reset if shape collapses — brief freeze coaching",
          "Keep the game flowing — limit stoppages",
        ],
        progression: "Add offside line practice — defensive line steps up together.",
      },
    ],
  },
  {
    id: "11v11",
    format: "11v11",
    ages: "U14 – Open Age",
    color: "#6c3483",
    icon: "🏆",
    priority: "Decision Making & Awareness in All Situations",
    formation: "4-3-3 (recommended for development)",
    sessionLength: "90 minutes",
    frequency: "2 sessions per week",
    overview:
      "The full game. Technical training becomes position-specific. Tactical understanding deepens across all four phases: attacking, defending, transition to attack, transition to defend. Players also begin physical conditioning work.",
    warmup: {
      name: "Positional Rondo 6v3",
      duration: "15 min",
      players: "Groups of 9",
      setup:
        "25x25m grid. 6 keep the ball from 3 defenders. Positional awareness — each player has an assigned zone they must stay near.",
      cues: [
        "Play quickly — limit touches",
        "Find the player in space, not the closest one",
        "Defenders: press as a unit of 3, not individually",
      ],
    },
    drills: [
      {
        name: "Position-Specific Finishing",
        duration: "20 min",
        players: "Full squad in 3 groups",
        setup:
          "Three simultaneous stations: (1) Defenders — pass out from back under pressure. (2) Midfielders — receive to turn and play forward. (3) Strikers — receive and finish 1v1 vs goalkeeper.",
        objective:
          "Develop technical skills specific to each playing position at match speed.",
        cues: [
          "Defenders: composure and accuracy under pressure",
          "Midfielders: first touch away from pressure",
          "Strikers: choose placement over power",
        ],
        progression:
          "Combine stations into a full 11v11 pattern-of-play sequence.",
      },
      {
        name: "Organised Pressing Unit",
        duration: "20 min",
        players: "Full squad",
        setup:
          "Full pitch. Team A builds from back with goalkeeper. Team B defends with 3 press triggers agreed before the drill starts. Run 5-minute blocks, swap roles.",
        objective:
          "Develop a coordinated pressing system with shared triggers, direction, and cover.",
        cues: [
          "Trigger → Press direction → Cover shape — in that order",
          "When press is beaten: drop fast, don't chase",
          "Goalkeeper communicates — they see the whole picture",
        ],
        progression:
          "Add a rule: if the press wins the ball, immediate counterattack in 5 seconds.",
      },
      {
        name: "Transition Counterattack",
        duration: "15 min",
        players: "Full squad",
        setup:
          "Half pitch. Team A attacks with 7 players. Team B defends with 6. When Team B wins the ball, they counter with all 6 — Team A must recover. Target: score within 6 passes.",
        objective: "Train the explosive moment of transition from defence to attack.",
        cues: [
          "Win the ball — look up immediately",
          "First pass must go forward",
          "Recovering defenders: sprint to get goal-side, not ball-side",
        ],
        progression:
          "Restrict counterattack to 4 passes only — increases speed of decision.",
      },
      {
        name: "Set Piece Workshop",
        duration: "15 min",
        players: "Full squad",
        setup:
          "Corners and free kicks only. Each set piece has 3 assigned runs. Practice each one 5 times — attacking, then defending.",
        objective:
          "Build set piece routines where every player knows their position and run.",
        cues: [
          "Time your run — arrive as the ball does",
          "Defender: mark your zone, not just one person",
          "Goalkeeper: communicate and command",
        ],
        progression: "Run set pieces against a full defensive block.",
      },
    ],
  },
];

// ─── DEVELOPMENT PATHWAY ─────────────────────────────────────────────────────

export interface PathwayStep {
  age: string;
  label: string;
  sub: string;
  color: string;
  icon: string;
  shona: string;
  isEcd: boolean;
}

export const PATHWAY_STEPS: PathwayStep[] = [
  { age: "3–4",   label: "ECD A",        sub: "Tiny Boots",   color: "#B8860B", icon: "🌱", shona: "Shangu Diki",           isEcd: true  },
  { age: "5–6",   label: "ECD B / Gr.1", sub: "First Kick",   color: "#8B0000", icon: "⚡", shona: "Kurova Kwekutanga",     isEcd: true  },
  { age: "7",     label: "Grade 2",      sub: "3v3 Ready",    color: "#006400", icon: "⚽", shona: "Kugadzirira 3v3",       isEcd: true  },
  { age: "8–9",   label: "Grade 3–4",    sub: "5v5",          color: "#B8860B", icon: "🏟️",shona: "5v5",                  isEcd: false },
  { age: "10–11", label: "Grade 5–6",    sub: "7v7",          color: "#8B0000", icon: "📐", shona: "7v7",                  isEcd: false },
  { age: "12–13", label: "Form 1–2",     sub: "9v9",          color: "#1a5276", icon: "🎽", shona: "9v9",                  isEcd: false },
  { age: "14+",   label: "Form 3+",      sub: "11v11",        color: "#6c3483", icon: "🏆", shona: "11v11 Yakazara",        isEcd: false },
];

// ─── ECD STAGES ──────────────────────────────────────────────────────────────

export interface EcdActivity {
  name: string;
  shona: string;
  desc: string;
  shonaDesc: string;
  cues: string[];
  cuesShona: string[];
}

export interface EcdStage {
  id: string;
  stage: string;
  shona: string;
  age: string;
  ageShona: string;
  level: string;
  color: string;
  icon: string;
  goal: string;
  goalShona: string;
  equipment: string;
  equipmentShona: string;
  duration: string;
  activities: EcdActivity[];
}

export const ECD_STAGES: EcdStage[] = [
  {
    id: "tiny",
    stage: "Tiny Boots",
    shona: "Shangu Diki",
    age: "3 – 4 years",
    ageShona: "Makore 3 – 4",
    level: "ECD A",
    color: "#B8860B",
    icon: "🌱",
    goal: "Build a relationship with the ball. No rules, no pressure — just movement and joy.",
    goalShona: "Kuvaka ukama nebhora. Hapana mitemo — kungoita mafaro.",
    equipment: "1 ball per child, open space",
    equipmentShona: "Bhora rimwe nerimwe, nzvimbo yakavhurika",
    duration: "15 minutes",
    activities: [
      {
        name: "Chase the Ball",
        shona: "Tsvaga Bhora",
        desc: "Teacher rolls ball gently. Children run and stop it with their foot. No competition — everyone wins.",
        shonaDesc: "Mudzidzisi anobhinha bhora. Vana vanomhanya nokumisa nebiri. Hapana makwikwi.",
        cues: ["Use your foot, not your hands", "Stop it before it gets away", "Try the other foot too"],
        cuesShona: ["Shandisa tsoka, kwete maoko", "Misira usati waenda", "Edza tsoka imwe zvakare"],
      },
      {
        name: "Roll & Fetch",
        shona: "Bhinha Unotsvaga",
        desc: "Pairs: one rolls, one fetches and rolls back. Develops coordination and taking turns.",
        shonaDesc: "Vaviri: mumwe anobhinha, mumwe anotsvaga. Inodzidzisa kutevedzana.",
        cues: ["Aim at your partner", "Use inside of your foot", "Wait for your turn"],
        cuesShona: ["Tangira shamwari yako", "Shandisa mukati metsoka", "Mirira nguva yako"],
      },
      {
        name: "Kick the Wall",
        shona: "Rova Madziro",
        desc: "Each child kicks against a wall and controls the rebound. Solo ball mastery.",
        shonaDesc: "Mwana wega anorova bhora kumadziro. Zvinodzidzisa kuita bhora zvakanaka.",
        cues: ["Kick with your laces", "Watch the ball come back", "Try to stop it clean"],
        cuesShona: ["Rova nemazano eshoe", "Tarisa bhora richidzokerera", "Edza kurimisa zvakanaka"],
      },
    ],
  },
  {
    id: "firstkick",
    stage: "First Kick",
    shona: "Kurova Kwekutanga",
    age: "5 – 6 years",
    ageShona: "Makore 5 – 6",
    level: "ECD B / Grade 1",
    color: "#8B0000",
    icon: "⚡",
    goal: "Introduce dribbling, passing, and simple decision-making with the ball at their feet.",
    goalShona: "Kudzidzisa kutakura bhora, kupasa, uye kusarudza.",
    equipment: "1 ball per child, 4–6 cones",
    equipmentShona: "Bhora rimwe nerimwe, makoni 4–6",
    duration: "20 minutes",
    activities: [
      {
        name: "Cone Dribble",
        shona: "Takura Makoni",
        desc: "4 cones in a line. Dribble through, turn, come back. Time them for fun.",
        shonaDesc: "Makoni mana mumutsara. Ita bhora nepakati, vodzoka. Vatore nguva mufaro.",
        cues: ["Small touches, stay in control", "Look up sometimes", "Use both feet"],
        cuesShona: ["Kurova zvishoma", "Tarisa kumusoro", "Shandisa tsoka dzose"],
      },
      {
        name: "Pass & Move",
        shona: "Pasa Ufambe",
        desc: "In pairs, pass then run to a new spot. Teaches moving after a pass.",
        shonaDesc: "Mumwe nomumwe, pasa bhora umhanyire kuimwe nzvimbo.",
        cues: ["Pass then move — don't stand still", "Use the inside of your foot", "Call your partner's name"],
        cuesShona: ["Pasa wobva wafamba", "Shandisa mukati metsoka", "Daidza zita reshamwari yako"],
      },
      {
        name: "Mini Gates",
        shona: "Magedhi Madiki",
        desc: "6 pairs of cones as gates. Dribble through as many as possible in 60 seconds.",
        shonaDesc: "Makoni matanhatu semini magedhi. Ita bhora nepakati paanogona mu60 seconds.",
        cues: ["Head up to see the gates", "Change direction quickly", "Count how many you got"],
        cuesShona: ["Simudza musoro uone magedhi", "Shandura nzira", "Verenga wakaita mangani"],
      },
    ],
  },
  {
    id: "ready",
    stage: "Ready for 3v3",
    shona: "Kugadzirira 3v3",
    age: "7 years",
    ageShona: "Makore 7",
    level: "Grade 2 → Organised 3v3",
    color: "#006400",
    icon: "🏆",
    goal: "Transition into structured mini games. Ready for the 3v3 format with mini goals.",
    goalShona: "Kupinda mumitambo yakagadziridzwa. Vagadzirira 3v3 nemini magedhi.",
    equipment: "Size 3 ball, 4 cones as mini goals",
    equipmentShona: "Bhora Size 3, makoni 4 semini magedhi",
    duration: "30 minutes",
    activities: [
      {
        name: "1v1 Mini Game",
        shona: "Mutambo we1v1",
        desc: "Two children, two cones as a goal each end. First to 3 goals wins.",
        shonaDesc: "Vana vaviri, makoni maviri semusuwo. Anotanga 3 anokunda.",
        cues: ["Attack when you have the ball", "Defend your goal", "High five after"],
        cuesShona: ["Rova kana une bhora", "Dzivirira musuwo wako", "High five mushure"],
      },
      {
        name: "2v1 Overload",
        shona: "2v1 Kuwedzera",
        desc: "Two attackers vs one defender. Teaches passing when outnumbered.",
        shonaDesc: "Varwi vaviri nemumwe mudziviriri. Inodzidzisa kupasa.",
        cues: ["If they come to you — pass", "If you're free — call for it", "Work together"],
        cuesShona: ["Kana vauya kwauri — pasa", "Kana uri akasununguka — daidza", "Shanda pamwe"],
      },
      {
        name: "First 3v3 Game",
        shona: "Mutambo Wekutanga we3v3",
        desc: "3 players each side. Mini goals. 6–8 minutes. High five to start. Pure fun.",
        shonaDesc: "Vatambi vatatu kune imwe. Mini magedhi. Maminetsi 6–8. High five kutanga.",
        cues: ["Everyone attacks, everyone defends", "Score from the other half", "Shake hands after every game"],
        cuesShona: ["Vose vanorwisa, vose vanodzivirira", "Rova uri kumhiri kwehafu", "Sungana maoko mushure"],
      },
    ],
  },
];

// ─── 3v3 RULES ────────────────────────────────────────────────────────────────

export interface ThreeVThreeRule {
  rule: string;
  detail: string;
}

export const THREE_V_THREE_RULES: ThreeVThreeRule[] = [
  { rule: "Game Start",    detail: "Begin every game with a high five. Rock-paper-scissors decides who kicks off." },
  { rule: "No Goalkeeper", detail: "Every player attacks and defends. Faster game, more ball touches for all." },
  { rule: "No Heading",    detail: "No heading or penalty kicks allowed. Safety first for young players." },
  { rule: "Free Kicks",    detail: "All free kicks must be at least 3m from the goal. Opposition must be 3m away." },
  { rule: "Restarts",      detail: "Players can dribble OR pass at all restarts — goal line, corners, sidelines, free kicks." },
  { rule: "Scoring",       detail: "A player must be in the opponent's half of the pitch for a goal to count." },
  { rule: "After a Goal",  detail: "The conceding team restarts from their goal line. Scoring team returns to their half." },
  { rule: "Goal Line",     detail: "On goal line restarts, opposition retreats to their own half before play resumes." },
];

export const THREE_V_THREE_COACHING_TIPS: string[] = [
  "Encourage both feet every session",
  "Praise decision-making, not just goals",
  "Rotate teams to maximise social development",
  "Keep instructions under 30 seconds",
  "Equal playing time for every child",
  "Learn every player's name from day one",
  "Use the game as the teacher",
  "Focus on enjoyment — skills follow",
];
