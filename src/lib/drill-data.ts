// src/lib/drill-data.ts
// Enriched drill data — used by DrillCard component and drills page

export type PositionKey = "striker" | "midfielder" | "defender" | "goalkeeper" | "winger";
export type EquipmentTier = "zero" | "basic" | "gym";
export type DrillCategory = "Technical" | "Physical" | "Tactical";
export type AgeGroup = "u13" | "u16" | "u19" | "senior";

export interface AgeVariant {
  instructions: string[];
  coaching_notes?: string;
}

export interface DrillData {
  id: string;
  name: string;
  duration: string;
  description: string;
  category: DrillCategory;
  football_benefit: string;
  instructions: string[];
  success_feels_like: string;
  gemini_scores: string[];
  equipment_tier: EquipmentTier;
  position_tags: string[];
  muscles_targeted: string[];
  difficulty_level: 1 | 2 | 3;
  is_premium: boolean;
  // Context fields
  when_to_use?: string;   // The game situation or phase of play where this skill is needed
  where_on_pitch?: string; // The pitch zone or positional context where this drill applies
  // MediaPipe prescription — which AI flags this drill fixes
  // Used to auto-prescribe drills when MediaPipe detects specific issues
  mediapipe_fixes?: Array<
    | "knee_valgus"
    | "hip_drop"
    | "landing_stiffness"
    | "fatigue_degradation"
    | "trunk_lean_deficit"
    | "stride_asymmetry"
    | "hip_rotation_deficit"
    | "bilateral_asymmetry"
    | "ankle_dorsiflexion"
    | "arm_drive"
    | "knee_drive"
    | "com_instability"
  >;
  // Optional enhancement fields
  age_variants?: Partial<Record<AgeGroup, AgeVariant>>;
  gender_notes?: string;
  i18n?: {
    sn?: { name?: string; instructions?: string[] };
    nd?: { name?: string; instructions?: string[] };
  };
}

export interface PositionTrack {
  title: string;
  focus: string;
  drills: DrillData[];
}

export const FOOTBALL_POSITION_DRILLS: Record<PositionKey, PositionTrack> = {
  striker: {
    title: "Striker & Attacking Forward Track",
    focus: "Attacking intent, positive first-touch control, creative blind turns, and clinical box execution.",
    drills: [
      {
        id: "eng_st_01",
        name: "Lions' Den Central Turning",
        duration: "15 mins",
        category: "Technical",
        description: "Receive a firm vertical entry pass inside a tight 8x8-yard square under physical contact. Protect the ball with your body, turn sharply on the half-turn, and play forward to a teammate.",
        football_benefit: "A striker who can hold up play under physical pressure keeps the whole team's attack alive. This drill builds the confidence and technique to receive with defenders on your back — the foundation of all link-up play in tight spaces.",
        instructions: [
          "Set up an 8×8 yard square using 4 cones",
          "Ask a partner to apply body-contact pressure from directly behind you inside the square",
          "Receive a firm ground pass from a third player outside the square",
          "Use your arms and body weight to shield the ball from your marker",
          "Turn sharply on the half-turn — Cruyff, drag-back, or outside hook",
          "Play the ball forward out of the square to a target player",
          "Reset and repeat — aim for 0 ball losses across 6 consecutive turns",
        ],
        success_feels_like: "The ball stays glued to your feet despite the pressure. Your body is between defender and ball throughout the entire turn. One fluid motion — receive, shield, spin, release — and the ball is forward before the defender can react.",
        gemini_scores: ["Body Shield Position", "Turn Sharpness", "Balance Under Contact", "Pass Accuracy After Turn"],
        equipment_tier: "basic",
        position_tags: ["Striker", "Number 10", "Winger"],
        muscles_targeted: ["Core", "Glutes", "Hip flexors", "Ankle stabilisers"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when your team is building through a striker dropping deep to link play — especially when the opposition are pressing high and your midfield needs an outlet. Also crucial whenever you receive with a defender already on your back.",
        where_on_pitch: "Between the opposition's midfield and defensive lines — the tight central corridor roughly 10–25 yards from goal. Any congested space where you must receive and turn under contact.",
        age_variants: {
          u13: {
            instructions: [
              "Set up a 6×6 yard square with 4 cones",
              "A partner stands beside you — shoulder contact only, no pushing",
              "Receive a soft pass from a third player outside the square",
              "Use your body to stay between the ball and your partner",
              "Turn slowly using a drag-back — take your time to get it right",
              "Play the ball out of the square to a target player",
            ],
            coaching_notes: "Focus on body shape, not speed. Reward correct technique even if slow.",
          },
          u16: {
            instructions: [
              "Set up a 7×7 yard square using 4 cones",
              "Partner applies shoulder-to-shoulder pressure from behind",
              "Receive a firm pass from outside the square",
              "Use your forearm (not elbow) to create space and shield",
              "Turn using a Cruyff or drag-back at moderate pace",
              "Play forward to a target — aim for 5 clean turns in a row",
            ],
            coaching_notes: "Introduce 'pre-turning' — deciding your direction before the ball arrives.",
          },
        },
        i18n: {
          sn: {
            name: "Kupotera Mumuzinda — Nzira dzeKupona",
            instructions: [
              "Isa mahombekombe mana kuti ugadzire nzvimbo yevasere 8×8",
              "Umwe wenzako anobva shure kuzokumanikidza nemuviri",
              "Gamuchira pasi rinouya kubva kunze kwenzvimbo",
              "Shandisa muviri wako kurinda bhora kubva kumukwikwidzi",
              "Tendeuka nekukurumidza — Cruyff, drag-back, kana hook yeninja",
              "Tuma bhora mberi kunze kwenzvimbo kumuteyi",
            ],
          },
        },
      },
      {
        id: "eng_st_02",
        name: "Tri-Third Elimination End Zones",
        duration: "20 mins",
        category: "Tactical",
        description: "Combine out of the defensive third to play an incisive line-breaking pass past the midfield layer. Time your forward run into the shaded end zone to collect and finish without running offside.",
        football_benefit: "Strikers lose their markers with movement, not just pace. This drill trains the timing and angle of your forward runs — arriving in dangerous space at exactly the right moment rather than sprinting and being tracked.",
        instructions: [
          "Mark a 40×25 pitch divided into three equal thirds with cones",
          "Start positioned in the middle third with a defender tracking you",
          "Two midfielders build play through the defensive third with short passes",
          "Watch the ball and the space behind the last defender simultaneously",
          "Time your diagonal run into the shaded end zone as the pass breaks through",
          "Collect the ball on the half-turn already facing goal",
          "Finish with your first or second touch — aim for near or far post in turn",
          "Rotate positions after every 3 runs",
        ],
        success_feels_like: "You arrive in the end zone just as the ball does — not early (defender tracks back) and not late (space has closed). Your body is already half-turned toward goal before the ball reaches your feet.",
        gemini_scores: ["Run Timing", "Body Shape on Arrival", "First Touch Direction", "Finish Technique"],
        equipment_tier: "basic",
        position_tags: ["Striker", "Winger"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Glutes", "Calves"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when your team regains possession deep and wants to launch a quick attack with a line-breaking pass behind the last defender. Train this during any shape that uses a striker as the furthest player up the pitch.",
        where_on_pitch: "The space behind the opposition's last defensive line — roughly from the halfway mark through to the final third. The run starts in the central or inside-left/right channels and arrives in the shaded zone level with or beyond the last defender.",
        age_variants: {
          u13: {
            instructions: [
              "Mark a 25×18 yard area divided into two halves (no thirds) with cones",
              "One defender tracks the striker from the centre line",
              "A coach or parent plays simple passes to feet",
              "Striker collects and dribbles to the end zone — no finishing required yet",
              "Award a point for reaching the end zone in control",
            ],
            coaching_notes: "Remove the finish for U13 — spatial awareness and run timing are the priority at this age.",
          },
          u16: {
            instructions: [
              "Mark a 35×22 yard pitch divided into three thirds",
              "Start in the middle third with one defender tracking you",
              "Two players build play short in the defensive third",
              "Time your diagonal run into the shaded end zone as the pass breaks through",
              "Control on the half-turn and finish — or square to a teammate",
              "Rotate every 4 runs",
            ],
            coaching_notes: "Emphasise timing over pace — arrive just before the ball does, not early.",
          },
        },
      },
      {
        id: "eng_st_03",
        name: "Three-Goal Endline Finale",
        duration: "15 mins",
        category: "Tactical",
        description: "Small-sided competitive match attacking a baseline with one large central goal and two corner mini-goals. Any regular goal is 1 point; a first-time finish is worth 2 points.",
        football_benefit: "Finishing is a decision as much as a skill. The three-goal format forces you to read which target is open in a split second and reward first-time finishes — the highest-value skill in a striker's toolkit.",
        instructions: [
          "Set up one large central goal and two small corner mini-goals on the baseline",
          "Play 3v3 or 4v4 in a 30×20 yard area attacking the baseline",
          "Regular goals count 1 point; any first-time finish counts 2 points",
          "Defending team can score on a single goal at the opposite end",
          "Rotate goalkeepers every 3 minutes if available",
          "Before receiving, scan all three targets so you already know the decision",
          "Play for 15 minutes — highest-scoring team wins",
        ],
        success_feels_like: "You scan for all three goals before the ball arrives. The decision is made before the touch. One contact, the right target, maximum power transferred cleanly — and you already know which goal was open.",
        gemini_scores: ["Pre-Touch Scan", "Decision Speed", "Shooting Technique", "Body Shape at Contact"],
        equipment_tier: "basic",
        position_tags: ["Striker", "Winger", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Core", "Ankle stabilisers"],
        difficulty_level: 1,
        is_premium: false,
        when_to_use: "Use as the finishing component of any session — when players need to practice making fast decisions under a real competitive constraint. Replaces flat shooting practice with a format that mirrors actual match decision-making.",
        where_on_pitch: "Inside and around the penalty box — anywhere a shooting opportunity arises in the final third. The three-goal layout recreates the split-second read of which target is available that strikers face on every chance.",
      },
      {
        id: "eng_st_04",
        name: "Double Trouble Combination",
        duration: "15 mins",
        category: "Tactical",
        description: "Attack a keeper and defender in pairs on a 35x25-yard pitch. Move and combine to open up space and score. If the defender wins it, recover to help your unit.",
        football_benefit: "Strikers rarely attack alone. Learning to combine — using wall passes, overlaps, and one-twos — is what separates a dangerous forward line from two isolated players waiting for the ball.",
        instructions: [
          "Set up a 35×25 yard pitch with a goal and goalkeeper at one end",
          "Two strikers start from the halfway line against one keeper and one defender",
          "Each combination must include at least one give-and-go before shooting",
          "Options: wall pass, diagonal run, dummy then return, overlap",
          "If the defender wins possession they break to a target at halfway — sprint to recover immediately",
          "Shoot when you have clear space — don't wait for a perfect moment",
          "Rotate the defender every 5 minutes",
        ],
        success_feels_like: "The combination feels like a conversation you've had a hundred times. You know where your partner is going before they move. The defender is left marking empty space while you finish at goal.",
        gemini_scores: ["Combination Timing", "Off-Ball Movement", "First Touch Under Pressure", "Finish Accuracy"],
        equipment_tier: "basic",
        position_tags: ["Striker", "Winger"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Core", "Calves"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when working on striker combinations during counter-attack drills or when developing a two-forward partnership. Perfect for sessions focused on attacking transition — moments just after winning the ball in midfield.",
        where_on_pitch: "The central corridor from the edge of the centre circle to the penalty spot — the attacking half of the pitch where two forwards can operate in tandem before defenders have time to recover.",
      },
      {
        id: "eng_st_05",
        name: "The Great Escape Funnel",
        duration: "20 mins",
        category: "Technical",
        description: "Start inside a cone funnel before breaking out into a 35x35-yard area against two central guards. Use feints and body movement to disguise your intentions and escape through perimeter gates.",
        football_benefit: "Strikers must be masters of disguise. Using feints, body shifts, and changes of direction to lose markers is an art — this drill teaches you to use your whole body to deceive and create space from nothing.",
        instructions: [
          "Place 4 cones to create a funnel: 6 yards wide at entry, 12 yards wide at exit",
          "Two guards stand at the funnel entrance — they stay within arm's length of each cone side",
          "Start inside the funnel and receive a pass from a server behind the guards",
          "Use a feint, step-over, or shoulder drop to commit one guard to a direction",
          "Accelerate past both guards through the wide end of the funnel",
          "Shoot at a goal positioned 15 yards past the funnel exit",
          "Score: 1 point for each clean escape, 2 points for a subsequent finish",
          "5 attempts per round — rotate guards every 2 rounds",
        ],
        success_feels_like: "The guard commits to one side based on your body movement — and you're already past them going the other way. Your feint shifted their weight. Now there is open space and you are accelerating through it.",
        gemini_scores: ["Feint Technique", "Change of Direction", "Acceleration Out of Feint", "Body Deception Quality"],
        equipment_tier: "basic",
        position_tags: ["Striker", "Winger", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Core", "Glutes"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use when a striker needs to create their own chance in tight spaces without a wall pass or overlap available — the solo escape. Key in sessions where the opposition press aggressively and isolate the forward.",
        where_on_pitch: "The half-space just outside the penalty area — the zone between the centre circle and the 18-yard box. Anywhere you face two defenders and must use deception alone to get through.",
      },
    ],
  },

  midfielder: {
    title: "Central Midfield & Pivot Track",
    focus: "Pre-receipt shoulder scanning, body shape openness, cover shadows drop, and tactical point switches.",
    drills: [
      {
        id: "cat_md_01",
        name: "Barcelona 3-2-1 Build Up Choices",
        duration: "15 mins",
        category: "Tactical",
        description: "7v7 positional small-sided game. Receive deep build-up passes from the center-back, scan before receiving, use your back foot to open your body shape, and decide whether to combine via a wall-pass or switch play wide.",
        football_benefit: "The best midfielders already know their next pass before the ball arrives. This drill trains the scanning habit and open body shape that turns a simple receive into an instant attacking threat — the hallmark of elite central midfielders.",
        instructions: [
          "Set up a 7v7 on a half-pitch positional game with fixed starting positions",
          "Midfielder's trigger: as the centre-back receives, check your shoulder immediately",
          "Open your body to face forward as you receive — use your back foot to point your hips outward",
          "Read the available options: wall-pass through the lines, wide switch, or recycle",
          "Play forward whenever you safely can — do not recycle as a default",
          "If pressed, protect and recycle — do not force a bad pass",
          "Coach calls 'SCAN' at random moments — freeze and state what you saw",
          "Play 15 minutes total with regular role rotations",
        ],
        success_feels_like: "When the ball is played to you, you already know where your next two passes are. Your body opens naturally and the ball never stops — it just changes direction through you, instantly and with purpose.",
        gemini_scores: ["Shoulder Scan Frequency", "Body Shape Openness", "Decision Speed", "Pass Weight and Direction"],
        equipment_tier: "basic",
        position_tags: ["Midfielder", "Defensive Midfielder"],
        muscles_targeted: ["Core", "Hip flexors", "Neck mobility", "Ankle stabilisers"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use in build-up play sessions — whenever your team starts from the back and needs midfielders to offer a reliable link between the defensive and attacking lines. Specifically in moments when the goalkeeper or centre-back has the ball.",
        where_on_pitch: "The central midfield area — roughly between your own penalty area and the halfway line. The midfielder must constantly find pockets between the opposition's midfield and defensive lines, scanning across a 30-yard band.",
      },
      {
        id: "eng_md_02",
        name: "Around the Clock Passing Ring",
        duration: "12 mins",
        category: "Technical",
        description: "Position symmetrically around a 20-yard diameter circle. Execute rapid one-touch and two-touch passing patterns through and across the clock structure to break blocks while central defenders chase interceptions.",
        football_benefit: "Clean, quick passing under pressure is the core skill of all great midfielders. The ring structure forces accurate play in all directions with no hiding spot — every mis-touch is visible and every clean pass reinforces the habit.",
        instructions: [
          "Place 8 cones in a circle 20 yards in diameter — like a clock face at each hour",
          "8 players stand on cones; 2 defenders roam freely inside the circle",
          "Begin with two-touch passing — progress to one-touch after 3 minutes",
          "If a defender intercepts, the player who lost the ball swaps in as a defender",
          "Progressions: call a number across the clock before receiving, then play to that position",
          "Play 4 minutes straight — then rotate two new defenders in",
          "Target: zero intercepted passes per 4-minute round",
        ],
        success_feels_like: "The ball never really stops — it deflects from foot to foot like a machine. You are always already pointing toward the next option before the ball reaches you. Defenders look stuck because the ball moves faster than they think.",
        gemini_scores: ["Pass Accuracy", "First Touch Quality", "Body Orientation", "Speed of Play"],
        equipment_tier: "zero",
        position_tags: ["Midfielder", "Defender", "Striker"],
        muscles_targeted: ["Core", "Hip flexors", "Ankle stabilisers"],
        difficulty_level: 1,
        is_premium: false,
        when_to_use: "Use as a warm-up or technical sharpener at the start of any possession-based session. Also ideal mid-session when players need to refresh passing habits before a more complex tactical exercise.",
        where_on_pitch: "The central third — anywhere tight passing triangles and circles naturally form in play. The rondo circle simulates the 5-10 yard passing lanes that appear constantly when a team holds possession in the middle of the pitch.",
      },
      {
        id: "eng_md_03",
        name: "Connect Four Corner Squares",
        duration: "20 mins",
        category: "Tactical",
        description: "A 35x20-yard directional transition game. Midfielders use quick horizontal circulation to pull the defensive block out of alignment, then launch a vertical through-ball into any of the 4 shaded corner target boxes.",
        football_benefit: "Midfielders who can switch play quickly stretch defences horizontally. This drill builds the vision and technique to circulate the ball under pressure before launching the decisive vertical pass that unlocks a defence.",
        instructions: [
          "Set up a 35×20 pitch with 4 shaded corner target boxes (5×5 yards) at each corner",
          "Play 5v5 or 6v6 in the central area — defenders cannot enter corner boxes",
          "Score a point by passing into a corner box with a teammate receiving inside it",
          "After scoring a corner point, build from the opposite end",
          "Progression: require two different corner targets before counting a goal",
          "Defenders must track the ball — draw them one way, then switch",
          "Play 20 minutes — the team with most corner points wins",
        ],
        success_feels_like: "You draw defenders toward you with short passes, then switch the ball before they can shift. The target box is empty for exactly two seconds — and the pass arrives flat and fast into that space.",
        gemini_scores: ["Decision Speed", "Pass Accuracy Under Pressure", "Body Shape", "Switch of Play Weight"],
        equipment_tier: "basic",
        position_tags: ["Midfielder", "Defensive Midfielder", "Winger"],
        muscles_targeted: ["Core", "Hip flexors", "Ankle stabilisers"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when training against a deep-block defence that packs the central areas. Develops the horizontal circulation and patience needed to stretch a compact defence before playing the decisive vertical pass.",
        where_on_pitch: "The central and wide midfield zone — from your own half through to the edge of the opposition's penalty area. The switches of play travel across the full width of the pitch, so the drill applies to every zone between the two touchlines.",
      },
      {
        id: "eng_md_04",
        name: "Table Football Tri-Thirds Match",
        duration: "25 mins",
        category: "Tactical",
        description: "Play a match inside a field split into thirds where outfielders are entirely locked into their areas to emphasize vertical lines. Work the ball dynamically through the thirds to feed your striker.",
        football_benefit: "Playing locked into a third teaches midfielders their role in the team's vertical structure. You cannot hide or drift — you must constantly make yourself available and play every ball with immediate purpose.",
        instructions: [
          "Divide a full pitch into three equal thirds with cone lines",
          "Each outfield player is locked strictly inside their designated third — no crossing the lines",
          "Only the ball can travel between thirds via pass or lofted ball",
          "Midfielders work in the middle third: receive from defence, play forward to attack",
          "Coach blows whistle if anyone crosses into another third — instant turnover of possession",
          "Midfielders must use the full width of their third to find forward options",
          "Play 25 minutes with normal scoring — switch roles at half time",
        ],
        success_feels_like: "You become a relay station between two worlds. Every ball that comes to you must go forward better than it arrived — with more pace, in a better direction, at a teammate who has more time than you did.",
        gemini_scores: ["Positioning in Middle Third", "Body Shape on Receive", "Pass into Final Third", "Decision Speed"],
        equipment_tier: "basic",
        position_tags: ["Midfielder", "Defensive Midfielder"],
        muscles_targeted: ["Core", "Ankle stabilisers", "Hip flexors"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when developing midfielders' positional discipline in a structured formation — especially in sessions that work on the vertical shape between defenders, midfielders, and attackers. Shows clearly when midfielders drift out of their zone.",
        where_on_pitch: "The middle third — locked between both penalty areas. The constraint forces midfielders to make every pass count within their zone rather than drifting freely, mirroring the positional demands of most tactical systems.",
      },
      {
        id: "eng_md_05",
        name: "Three-Channel Tight Turning",
        duration: "15 mins",
        category: "Technical",
        description: "Receive a pass inside a small central vertical channel under tight pressure. Keep a tight turning circle, use an outside hook or Cruyff turn to escape interference, and pass to create width.",
        football_benefit: "The central channel is the most congested area on any pitch. Midfielders who can receive and escape tight spaces in a split second give their team an instant advantage exactly where the game is decided.",
        instructions: [
          "Mark three parallel channels each 5 yards wide using cones — 15 yards long each",
          "Midfielder plays in the central channel; one defender mirrors them inside it",
          "Server plays a firm pass into the midfielder's feet from one end",
          "Midfielder must turn inside the channel: Cruyff, outside hook, or body feint — choose one",
          "After turning, pass to a target player at the far end of the channel",
          "5 turns in the central channel — then move to the wide channels",
          "Progress: add a second defender to make the channel more congested",
        ],
        success_feels_like: "The defender plants their foot expecting one direction — but you are already facing the other way and the ball is gone. The turn happens in one touch, in zero space, with zero hesitation.",
        gemini_scores: ["Turn Technique", "Touch Tightness", "Acceleration After Turn", "Disguise Quality"],
        equipment_tier: "zero",
        position_tags: ["Midfielder", "Winger", "Striker"],
        muscles_targeted: ["Hip flexors", "Core", "Ankle stabilisers", "Calves"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use when opposition pressing forces the ball into the central corridor and the midfielder must turn quickly under heavy pressure. Key in any session where the team is working on how to break a press without going long.",
        where_on_pitch: "The central channel of the pitch — the narrow lane between the two fullback positions, directly through the centre circle. This is the most congested zone in any compact defensive shape and where most ball losses occur.",
      },
    ],
  },

  defender: {
    title: "Defensive Unit & Fullback Track",
    focus: "Defensive approach angles, arm's-length pressure, deceleration braking, and line cover support.",
    drills: [
      {
        id: "eng_df_01",
        name: "Angled Pressing & Directional Dictation",
        duration: "15 mins",
        category: "Technical",
        description: "Approach a perimeter attacker at an angle rather than straight-on to limit their options. Get within arm's-length to apply high pressure and dictate their movement toward the wide sidelines.",
        football_benefit: "Defenders who run straight at attackers are easy to beat. An angled approach cuts off the dangerous inside option immediately — forcing attackers where YOU want them to go rather than where they want to be.",
        instructions: [
          "Place a wide attacker cone 20 yards from a full-back starting position on the touchline side",
          "Server plays a pass into the attacker who turns to face goal",
          "Defender sprints but angles the run to cut off the inside pass option first",
          "Get within arm's-length before the attacker has looked up",
          "Show the attacker outward toward the touchline — body angle blocks the inside",
          "Hold jockeying position — do NOT dive in unless attacker shows the ball forward too far",
          "10 reps per side — alternate left side and right side approach angles",
        ],
        success_feels_like: "You arrive at arm's-length before the attacker has made their decision. Your body angle has already removed one option entirely. You feel in control, not reactive — the attacker has no choice but to go where you want.",
        gemini_scores: ["Approach Angle", "Closing Speed", "Jockeying Stance", "Defensive Body Width"],
        equipment_tier: "zero",
        position_tags: ["Defender", "Fullback", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Glutes", "Core", "Ankle stabilisers"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use whenever an attacker receives a wide pass and turns to face your goal — the exact moment a defender must react. Key in sessions on high pressing or defensive organisation on the flanks.",
        where_on_pitch: "Wide defensive channels — the 15-yard strip between the touchline and the edge of the penalty area on each flank. Particularly the transition zone from your own half into the attacking third where wingers and full-backs duel.",
      },
      {
        id: "eng_df_02",
        name: "Cover and Recover Horizontal Channels",
        duration: "15 mins",
        category: "Tactical",
        description: "Work in tandem inside a pitch split horizontally into thirds. Establish optimal supporting distances between the pressing and covering players; if the primary presser is bypassed, the covering player steps out immediately.",
        football_benefit: "Defending is never a solo job. The communication and positioning between a presser and their cover is what makes a defence hard to break — two defenders working together are far more effective than two playing independently.",
        instructions: [
          "Divide a 40×25 pitch into three horizontal thirds using cones",
          "Work in defending pairs: one player presses the ball, the other provides cover 8–10 yards behind",
          "Server plays passes to 3 attackers who attempt to advance through the thirds",
          "When the pressing defender is bypassed, the covering defender steps up immediately",
          "The bypassed defender recovers to become the new cover player — no standing and watching",
          "Communicate constantly: 'Press!', 'Cover!', 'Step!', 'Hold!'",
          "Play 5-minute rounds — aim for 0 goals conceded per round",
        ],
        success_feels_like: "When your partner gets beaten you have already stepped up — because you read the play two passes early. The attackers feel like they're running into a second wall just when they thought they were free.",
        gemini_scores: ["Cover Distance", "Step-Up Timing", "Verbal Communication", "Recovery Run Angle"],
        equipment_tier: "zero",
        position_tags: ["Defender", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Glutes", "Core", "Hip flexors"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use in sessions focused on defensive shape and communication — when your team is working on how the pressing player and the covering player coordinate rather than both pressing or both sitting. Most valuable early in a defensive organisation block.",
        where_on_pitch: "The defensive half — from your own penalty area extending to the halfway line. Defenders operate in a horizontal band, shifting as one unit as the ball moves between the three attackers across the width of the pitch.",
      },
      {
        id: "eng_df_03",
        name: "Line Cover and Press 2v2",
        duration: "20 mins",
        category: "Tactical",
        description: "Small-sided area with mini-goals behind a baseline. One player presses the ball while the other provides deep covering support directly in front of the goal mouth.",
        football_benefit: "The hardest defensive situation is two vs two on goal. This drill builds the instinctive split-second decision between pressing and protecting — the choice that determines whether you concede or not.",
        instructions: [
          "Set up a 30×20 yard area with a full-size goal and keeper at one end",
          "Two defenders start from the goal line — two attackers start from the halfway mark",
          "Coach serves a ball to one attacker to begin each round",
          "Press player attacks the ball holder — cover player drops to protect space in front of goal",
          "When the ball is switched, roles reverse instantly — press follows ball, cover holds shape",
          "If attackers lose the ball, defenders immediately transition and can score on counter",
          "Rotate all roles every 4 minutes — play 20 minutes total",
        ],
        success_feels_like: "You and your partner feel like one unit. You talk constantly and respond instantly. Attackers are frustrated because as soon as they beat one of you, the other is already in position to cover the space.",
        gemini_scores: ["Press Decision Speed", "Cover Positioning Depth", "Role Transition Speed", "Communication Quality"],
        equipment_tier: "basic",
        position_tags: ["Defender", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Core", "Glutes", "Hip flexors"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use in sessions on defensive transition — specifically the moment a through-ball is played and two attackers are bearing down on two defenders. Also for counter-attack defence drills.",
        where_on_pitch: "From the edge of your penalty area back to the goal line — the defensive third where 2v2 situations are most dangerous. One defender presses the ball while the other protects the space directly in front of goal.",
      },
      {
        id: "eng_df_04",
        name: "Stadium Game 1v1 Marking",
        duration: "15 mins",
        category: "Technical",
        description: "Pair up with an opponent inside an isolated half of a 30x20-yard area. Stay close to prevent them from receiving easily, position goal-side, and use a side-on stance to steal possession.",
        football_benefit: "Every great attacker will find themselves 1v1 at some point. The difference between good and great defenders is the discipline to stay goal-side, use a side-on stance, and delay rather than dive — making those instincts automatic.",
        instructions: [
          "Pair up in a 30×20 yard area split into two halves with cones",
          "Maintain goal-side position of your attacker at all times — never let them between you and goal",
          "Use a side-on stance: shoulder to the attacker's shoulder, never square",
          "When the attacker receives from the server, shadow their movement — do NOT dive in",
          "Force them wide and away from central dangerous space — deny the turn",
          "Only attempt to win the ball when attacker shows it too far ahead or commits both feet",
          "5-minute rounds — aim: 0 goals conceded, 2+ possessions won",
        ],
        success_feels_like: "You are patient and controlled. You do not panic when the attacker feints. You stay on your feet, keep side-on, and force them toward the touchline. Then — the moment they show the ball — you take it.",
        gemini_scores: ["Goal-Side Positioning", "Side-On Stance", "Jockeying Patience", "Tackle Timing"],
        equipment_tier: "zero",
        position_tags: ["Defender", "Fullback"],
        muscles_targeted: ["Quadriceps", "Glutes", "Core", "Ankle stabilisers"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use in 1v1 defending sessions — any time a defender must track an attacker who receives in open space behind the midfield. Especially important before matches against teams who play fast wingers or isolated strikers.",
        where_on_pitch: "The defensive third and around the edge of the penalty area — from the 18-yard box out to about 30 yards from goal. The wide defensive channels on either flank where fullbacks most commonly face 1v1 situations.",
      },
      {
        id: "eng_df_05",
        name: "Five-Section Possession Grid",
        duration: "20 mins",
        category: "Tactical",
        description: "Engage in parallel 1v1 duels inside a 30x20-yard pitch split into five sections. Work together as a compact unit off the ball to mark, cover, and intercept passes.",
        football_benefit: "Defensive compactness is built in training, not in matches. This drill forces defenders to think as a unit — maintaining shape, closing gaps, and winning the ball together rather than chasing individually.",
        instructions: [
          "Divide a 30×20 pitch into 5 equal vertical sections using cones",
          "Defenders play in parallel 1v1 matchups — one defender per section",
          "Attackers pass the ball between sections; defenders cannot enter adjacent sections",
          "When ball is in your section, engage your attacker tightly and win the ball",
          "When ball leaves your section, immediately compact toward it — all five shift together",
          "First team to 5 interceptions wins the round",
          "Progress: allow attackers to switch positions to test defensive tracking",
        ],
        success_feels_like: "Your defensive line moves as one organism. When the ball goes left, you all shift left in unison — no gaps appear. Attackers can't find a free player because every time they pass, a defender is already waiting.",
        gemini_scores: ["Defensive Compactness", "Shift Timing", "1v1 Body Position", "Interception Timing"],
        equipment_tier: "zero",
        position_tags: ["Defender", "Midfielder"],
        muscles_targeted: ["Core", "Glutes", "Quadriceps", "Ankle stabilisers"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use when training defensive shape against a possession-heavy team that circulates the ball patiently. Key in sessions that work on the collective defensive block — how all five defenders shift together as one unit.",
        where_on_pitch: "A compact mid-block position — the five vertical sections span the full width of the pitch, roughly between your own penalty area edge and the halfway line. Defenders hold a narrow 30-yard deep defensive band and shift horizontally together.",
      },
    ],
  },

  goalkeeper: {
    title: "Goalkeeper Elite Protocol",
    focus: "Balls-of-feet readiness, handling holds ('W' and 'M' catch styles), low ground diving, and wide distribution.",
    drills: [
      {
        id: "so_gk_01",
        name: "Ground Side-Diving & Ball Recovery",
        duration: "15 mins",
        category: "Technical",
        description: "Crouch to lower your center of gravity before diving on the side of your body. Get both hands to the ball using the secure 'M' little-finger line for low shots, then immediately hug it into your chest.",
        football_benefit: "Most grassroots goals are scored low and to the side. A goalkeeper who dives confidently, secures with both hands, and instantly smothers the ball eliminates the most common scoring opportunity in every match.",
        instructions: [
          "Stand in ready position: balls of feet, slight knee bend, hands at waist height open",
          "Server kneels 5 yards away and rolls the ball firmly to your left or right",
          "Drop your body weight toward the ball — lead with your bottom hip, not your shoulder",
          "Reach both hands simultaneously: lead hand behind the ball, trailing hand on top",
          "Form the 'M' shape with little fingers meeting beneath low balls",
          "Smother the ball into your chest immediately on contact",
          "Recover to your feet as quickly as possible before the next ball",
          "10 dives each side with 20-second recovery — alternate left and right throughout",
        ],
        success_feels_like: "You hit the ground and the ball is already secured in your hands before you land fully. Both hands moved at the same time. Recovery is instant — you're back on your feet before the striker can react to the rebound.",
        gemini_scores: ["Dive Technique", "Hand Position (M grip)", "Body Shape", "Recovery Speed"],
        equipment_tier: "basic",
        position_tags: ["Goalkeeper"],
        muscles_targeted: ["Core", "Shoulders", "Hip flexors", "Wrists"],
        difficulty_level: 1,
        is_premium: false,
        when_to_use: "Use at the start of every goalkeeper session as fundamental technique work. Also essential before any match where the opposition are known to shoot low and hard from distance or inside the box.",
        where_on_pitch: "Anywhere inside and around the six-yard box — low shots arrive here from close range drives, deflections, and penalty area scrambles. The technique applies to any shot beneath knee height regardless of distance.",
      },
      {
        id: "so_gk_02",
        name: "The 'W' & 'M' Handling Fundamentals",
        duration: "10 mins",
        category: "Technical",
        description: "Practice forming a 'W' with your thumbs almost touching to secure incoming high balls, and an 'M' with little fingers touching to handle low balls. Stand lightly on the balls of your feet with hands open at waist height.",
        football_benefit: "Dropped catches lead directly to goals. The W and M hand positions are the technical foundation of every clean catch — high balls, low shots, everything. Ingraining these shapes means fewer spills under real match pressure.",
        instructions: [
          "Stand facing a server 8 yards away — start with hands in ready position",
          "Server varies delivery: high above the head, mid-height chest, low below the knee",
          "For HIGH balls: thumbs almost touch behind the top of the ball — 'W' shape",
          "For LOW balls: little fingers almost touch beneath the ball — 'M' shape",
          "Call out 'W!' or 'M!' out loud as you catch — builds the decision-making habit under pressure",
          "Do 5 high, 5 mid-height, 5 low balls per round — complete 3 rounds",
          "Progress: server adds a slight fake movement before delivering each ball",
        ],
        success_feels_like: "Your hands form the correct shape automatically before the ball arrives. High ball — thumbs meet. Low shot — little fingers meet. You never even think about it. The ball goes into your hands as if it was magnetised.",
        gemini_scores: ["W Grip Position", "M Grip Position", "Ready Stance", "Catch Security"],
        equipment_tier: "basic",
        position_tags: ["Goalkeeper"],
        muscles_targeted: ["Wrists", "Forearms", "Shoulders", "Core"],
        difficulty_level: 1,
        is_premium: false,
        when_to_use: "Use at the opening of every goalkeeper training session — this is the fundamental technical foundation before any other work. Especially important before matches featuring opponents known for varied delivery — high corners, driven shots, cutbacks.",
        where_on_pitch: "Anywhere in and around the goalkeeper's reach — from the six-yard line to the penalty spot for high deliveries, to the edge of the area for long-range shots. The two hand positions apply to every aerial and ground ball the keeper faces.",
      },
      {
        id: "eng_gk_03",
        name: "Circular Target-Gate Angle Coverage",
        duration: "15 mins",
        category: "Technical",
        description: "Position inside standalone square keeper boxes placed symmetrically within a circle layout. Move dynamically to adjust your positioning angle relative to passing pairs, making safe interceptions on first-time pass inputs.",
        football_benefit: "Goalkeepers who hold the correct angle between ball and far post give shooters far less space. This drill trains the automatic footwork and repositioning needed every time the ball moves around the final third.",
        instructions: [
          "Place 4 cone-goals (2×2 yard each) symmetrically in a circle 20 yards across",
          "Goalkeeper stands in the centre of the circle in ready position",
          "4 servers stand at each cone-goal — one holds the ball at all times",
          "Ball moves between servers via passes — goalkeeper continuously readjusts their angle",
          "Any server can shoot at any time — keeper must be on correct angle when ball arrives",
          "Coach counts goals conceded across 10 minutes",
          "Progression: increase passing speed so footwork must be faster",
        ],
        success_feels_like: "Your feet never stop moving. As the ball shifts around the circle, you are already repositioning — always halfway between the ball and the far post. Shooters find much less space than they expected.",
        gemini_scores: ["Angle Positioning", "Footwork Speed", "Ready Position", "Reaction Time"],
        equipment_tier: "basic",
        position_tags: ["Goalkeeper"],
        muscles_targeted: ["Calves", "Ankle stabilisers", "Core", "Hip flexors"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when the ball is moving quickly around the final third and the keeper must constantly reposition — for example, during wide ball circulation, crossing situations, or when attackers are playing one-twos around the penalty area.",
        where_on_pitch: "The penalty area and the zone directly in front of goal — roughly a 20-yard arc from post to post. The keeper must stay on the correct line between the ball and the far post at all times as the ball rotates around the circle.",
      },
      {
        id: "eng_gk_04",
        name: "Feeder-Attacker Isolation Guard",
        duration: "15 mins",
        category: "Tactical",
        description: "Manage angle coverage in a 20x15-yard pitch with a goal at one end. Direct your defender to mark the attacker tight, tracking the ball from the feeder, and be alert to make reflex saves.",
        football_benefit: "Most goals come from the combination of a pass plus a finish — not individual skill alone. This drill trains goalkeepers to read the ball, direct the defender, and react to the final shot as one connected sequence.",
        instructions: [
          "Set up a 20×15 yard pitch with a full-size goal at one end — goalkeeper, defender, attacker, feeder",
          "Feeder plays balls from outside the area: ground pass, lifted ball, ball to feet, ball over the top",
          "Goalkeeper calls 'Step!' (defender closes) or 'Hold!' (defender stays) based on the incoming ball",
          "When attacker receives, they go 1v1 on the keeper — defender cannot tackle from behind",
          "Keeper must stay on their toes and react to both the feeder and the attacker simultaneously",
          "Rotate all positions every 5 minutes — play 20 minutes total",
        ],
        success_feels_like: "You direct your defender like a conductor and they listen. When the feeder switches direction you've already called it. The attacker has nowhere to put the ball because your angle has left them no clear target.",
        gemini_scores: ["Communication Quality", "Angle Adjustment Speed", "Save Technique", "Defender Direction Clarity"],
        equipment_tier: "basic",
        position_tags: ["Goalkeeper"],
        muscles_targeted: ["Core", "Shoulders", "Hip flexors", "Ankle stabilisers"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use in sessions focused on goalkeeping communication — specifically when the team is working on how the keeper and last defender coordinate under pressure. Key before matches against teams that use a target forward and feeder combination.",
        where_on_pitch: "Inside the penalty box from the six-yard line out to the penalty spot — the killing zone where through-balls meet finishing runs. The keeper must read the feed, call the defender, and react to the 1v1 all within a 20×15 yard box.",
      },
      {
        id: "eng_gk_05",
        name: "Asymmetric Low Block Clearing",
        duration: "20 mins",
        category: "Tactical",
        description: "Defend a full-size goal with a backline of 8 outfielders against 7 attackers on half a pitch. Dominate your box, collect loose crosses, and quickly distribute wide after a rebound.",
        football_benefit: "Commanding crosses and distributing quickly turns defence into the first moment of attack. This drill builds the courage to come and claim, the communication to organise a backline, and the accuracy to distribute wide immediately.",
        instructions: [
          "Set up on half a pitch: 8 defenders behind the goalkeeper's line vs 8 attackers",
          "Attackers play crosses, through-balls, and combinations into the penalty area",
          "Goalkeeper must call 'KEEPER!' loud and early before attempting to claim or punch any cross",
          "After claiming, distribute immediately — throw wide to the nearest open player",
          "Goalkeeper organises the defensive shape constantly — no silent goalkeepers",
          "Score: +1 per clean claim with distribution, −1 per goal conceded",
          "Play 20 minutes — top scorer of the 'GK index' wins",
        ],
        success_feels_like: "The cross is still in the air and you are already moving forward to claim it. Your call is early and loud and it parts the defenders. You catch it cleanly and the ball is already thrown wide before the attack can reorganise.",
        gemini_scores: ["Cross Claiming Technique", "Claim Call Timing", "Distribution Accuracy", "Box Command"],
        equipment_tier: "basic",
        position_tags: ["Goalkeeper"],
        muscles_targeted: ["Shoulders", "Core", "Calves", "Hip flexors"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use when training against wide teams that deliver many crosses per match — particularly before cup games or against opponents with pace on the flanks. Also great as the final block of any session to build aerial dominance habits.",
        where_on_pitch: "The penalty area and six-yard box — the high-traffic aerial battleground. The keeper commands a zone stretching from post to post and out to approximately 12 yards, claiming anything that enters that space before attackers can reach it.",
      },
    ],
  },

  winger: {
    title: "Winger & Wide Forward Track",
    focus: "Explosive width, 1v1 isolation, low cross delivery, and recovery tracking.",
    drills: [
      {
        id: "grs_wn_01",
        name: "Wide Channel Sprint & Cross",
        duration: "15 mins",
        category: "Technical",
        description: "Sprint into the wide channel, receive a pass, and deliver a low driven cross before the defender closes. Vary between near-post and cutback deliveries.",
        football_benefit: "A winger who can reliably deliver dangerous low crosses is a coach's dream. The decision between a near-post drive, a cutback, or a far-post lofted ball decides whether a chance is created — this drill makes all three instinctive.",
        instructions: [
          "Mark a 40-yard channel 10 yards wide on one side of the pitch",
          "Server plays a pass into the channel from the edge of the centre circle",
          "Sprint to receive the ball in the wide channel — take at most 2 touches before the cross",
          "A cone 'defender' marks the edge of the penalty area — deliver before reaching it",
          "Vary each cross: near-post driven, cutback to the penalty spot, far-post lofted",
          "10 deliveries per side — coach scores 0 (off target), 1 (on target), 2 (scoring zone)",
          "Progress: add a live defender to close you down",
        ],
        success_feels_like: "Your first touch opens your body and sets up the cross in one motion. You decided near-post before the ball reached you. The delivery is low, flat, and fast — exactly where attackers want it and exactly where keepers hate it.",
        gemini_scores: ["First Touch Open Up", "Cross Technique", "Delivery Accuracy", "Decision (near/far/cutback)"],
        equipment_tier: "basic",
        position_tags: ["Winger", "Fullback"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Calves", "Core"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use when the team is working on wide attacking transitions — particularly in sessions on quick breaks and final-third delivery after winning the ball centrally. Also ideal when training the overlapping fullback to time their run into the channel.",
        where_on_pitch: "The wide attacking channel — the 10-yard strip between the touchline and the edge of the penalty area on either flank, from the halfway line down to the byline. The delivery must come before the cone/defender at the penalty area edge.",
      },
      {
        id: "grs_wn_02",
        name: "1v1 Isolation Wing Attack",
        duration: "15 mins",
        category: "Technical",
        description: "Start 15m from the full-back. Use a feint to commit them, then accelerate past. Finish by crossing or cutting inside. Best of 5 runs.",
        football_benefit: "The best wingers can beat their defender repeatedly — not just once. This drill builds the change of direction, body feint, and explosive first step that makes a fullback's afternoon miserable from the first minute.",
        instructions: [
          "Set up a 25-yard channel — winger starts 15m from the fullback position",
          "Server plays ball to winger's feet — winger takes one touch to set up the duel",
          "Use one feint or step-over to shift the defender's weight to one side",
          "Accelerate past the defender on the opposite side immediately",
          "If you go outside: deliver a cross; if you cut inside: shoot or play to a striker",
          "Best of 5 runs each side — alternate inside and outside every run",
          "Progress: add a live fullback allowed to foul to build match realism",
        ],
        success_feels_like: "The feint gets the defender's weight on the wrong foot. The acceleration out of the feint is explosive — by the time they have corrected, you have a yard on them. That is all a winger needs.",
        gemini_scores: ["Feint Technique", "Weight Transfer", "Acceleration First Step", "Final Ball Decision"],
        equipment_tier: "zero",
        position_tags: ["Winger", "Striker"],
        muscles_targeted: ["Hip flexors", "Quadriceps", "Glutes", "Calves"],
        difficulty_level: 2,
        is_premium: false,
        when_to_use: "Use as an isolation duel session — when the winger needs to improve their 1v1 ability without combining. Particularly valuable before matches where the opposition's fullback is physically strong and tends to double up with cover.",
        where_on_pitch: "The wide attacking flank — from approximately 25 yards out to the byline on either wing, within 15 yards of the touchline. The duel plays out along the channel where wingers and fullbacks regularly face each other in live match situations.",
      },
      {
        id: "grs_wn_03",
        name: "Recovery Run Tracking",
        duration: "12 mins",
        category: "Physical",
        description: "After losing possession in the final third, sprint back to get goal-side of the ball within 5 seconds. Coach rates effort with 1–3. Target average above 2.5.",
        football_benefit: "Modern wingers don't just attack — they defend too. A winger who tracks back consistently gives their fullback the confidence to overlap, which creates more attacking opportunities. Coaches at every level watch this closely.",
        instructions: [
          "Start at the opponent's corner flag — simulate having just delivered a cross",
          "Coach blows whistle to signal loss of possession",
          "Sprint immediately goal-side — target: level with the ball within 5 seconds",
          "Coach rates your recovery effort: 1 (slow start), 2 (good effort), 3 (outstanding)',",
          "Repeat 10 times alternating left and right touchlines",
          "Average score target: above 2.5 across the 10 reps",
          "Progress: add a live tracker you must beat in the recovery race",
        ],
        success_feels_like: "The moment possession is lost, your hips are already turning. Not a slow rotation — an instant burst of acceleration. By the time the ball is played forward, you are already goal-side and the danger is neutralised.",
        gemini_scores: ["Reaction to Loss", "Recovery Run Speed", "Body Turn Efficiency", "Final Position Accuracy"],
        equipment_tier: "zero",
        position_tags: ["Winger", "Midfielder"],
        muscles_targeted: ["Quadriceps", "Glutes", "Hip flexors", "Calves"],
        difficulty_level: 1,
        is_premium: false,
        when_to_use: "Use immediately after any attacking action where possession is lost — teaches the instant mental switch from attack to defence. Especially powerful mid-session as a consequence drill: miss a cross, immediately sprint back.",
        where_on_pitch: "Diagonally across the pitch — from the opponent's corner flag back to a goal-side position behind the ball, covering approximately 40 yards. The winger must track from the highest attacking position back to a central defensive shape.",
      },
      {
        id: "grs_wn_04",
        name: "Overlap Combination Triangle",
        duration: "20 mins",
        category: "Tactical",
        description: "3-player combination: winger, full-back, striker. Winger plays inside and then overlaps to receive in behind. Finish with a first-time cross or cut-back.",
        football_benefit: "The most dangerous attacking pattern in modern football is the winger-fullback-striker triangle. When all three connect at the right moment, defences collapse — this drill makes the timing feel natural and automatic.",
        instructions: [
          "Set up a triangle: winger wide, fullback behind, striker central — 20×15 yard working area",
          "Winger plays inside to the striker and IMMEDIATELY makes an overlapping run down the outside",
          "Do not wait — the overlap run starts the moment the ball leaves your foot",
          "Striker holds up play briefly then slips the ball into the overlapping winger's run",
          "Winger delivers a first-time cross or cutback for the striker's late run into the box",
          "Rotate positions after every 3 combinations — everyone plays every role",
          "Progress: add a defender to track the overlapping run",
        ],
        success_feels_like: "Your overlap run starts the moment the ball leaves your foot to the striker. You don't wait to see if they control it. By the time it's laid off, you are already in behind and the fullback hasn't even begun to track.",
        gemini_scores: ["Overlap Run Timing", "Pass Accuracy", "Cross Delivery", "Combination Flow"],
        equipment_tier: "zero",
        position_tags: ["Winger", "Fullback", "Striker"],
        muscles_targeted: ["Quadriceps", "Hip flexors", "Calves", "Core"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use in sessions building attacking width — when the fullback-winger-striker triangle is the main attacking pattern. Perfect for sessions where the team is learning to time overlapping runs and not just dribble wide.",
        where_on_pitch: "The wide corridor from your own half through to the attacking third — spanning about 30 yards diagonally from the centre circle to the byline. All three players in the triangle operate in different vertical zones of this wide channel simultaneously.",
      },
      {
        id: "grs_wn_05",
        name: "Cutback Decision Rondo",
        duration: "15 mins",
        category: "Tactical",
        description: "Reach the byline and choose between a near-post cutback, far-post driven cross, or pulling back to the penalty spot runner. Defenders rotate. 3 points for a first-time finish.",
        football_benefit: "Reaching the byline is only worth something if the delivery creates a chance. The cutback decision is the most valuable last-second choice a winger makes — scanning for the right target before getting there is what separates good wingers from great ones.",
        instructions: [
          "Set up a 20×10 yard rondo area adjacent to the byline",
          "Winger plays through the rondo until they find a channel and reach the byline",
          "Before reaching the byline, look up to identify: near-post runner, penalty spot runner, far-post",
          "Choose one delivery: near-post cutback, far-post driven cross, or penalty spot pullback",
          "Three target players rotate into each zone — score 1 point per accurate delivery, 3 for first-time finish",
          "Defending players rotate out every 3 minutes",
          "Play 15 minutes — highest delivery points total wins",
        ],
        success_feels_like: "You look up before you get to the byline — not at it. You see the penalty spot runner arriving late and the near post unmarked. One look, one decision, and you deliver it exactly where you planned before the ball even reached you.",
        gemini_scores: ["Pre-Delivery Scan", "Cutback Technique", "Cross Zone Accuracy", "Decision Quality"],
        equipment_tier: "basic",
        position_tags: ["Winger", "Striker"],
        muscles_targeted: ["Hip flexors", "Quadriceps", "Core", "Ankle stabilisers"],
        difficulty_level: 3,
        is_premium: true,
        when_to_use: "Use as the decision-making climax of any wide attacking session — after the winger has already worked on 1v1 isolation and crossing, add this to train the final read before the delivery. The payoff drill for any crossing session.",
        where_on_pitch: "The byline area — the last 5 yards before the goal line, from the corner flag in to the near post. The delivery decision is made here: near-post cutback, penalty spot pullback, or driven far-post cross — each going to a different zone.",
      },
    ],
  },
};


// =============================================================================
// MEDIAPIPE REMEDIATION DRILLS
//
// DESIGN PRINCIPLES:
// - Zero or near-zero cost equipment — uses rocks, sand bottles, sticks, walls
// - Plain English — short sentences, no jargon, easy to translate to Shona/Ndebele
// - Exact filming instructions — where to put the phone, what angle, who can hold it
// - Results explained simply — what the AI saw, why it matters, what will change
// - Progress markers the player can FEEL, not just measure
// =============================================================================

export interface RemediationDrill {
  id: string;
  name: string;
  // Plain English name with Shona translation
  name_shona?: string;
  duration: string;
  category: DrillCategory;

  // What the AI saw — explained simply, no jargon
  // e.g. "Your left knee bends inward when you land. This puts bad pressure on your knee."
  what_ai_detected: string;

  // Why this matters in football terms a player understands
  why_it_matters: string;

  // Exactly what equipment is needed — rural community version
  equipment_needed: string[];
  // How to make it if you do not have it
  equipment_diy: string[];

  // How to film this drill — exact instructions
  how_to_film: string[];

  // Step by step — short sentences, simple words
  instructions: string[];

  // What you should feel when doing it correctly
  success_feels_like: string;

  // What to watch for when reviewing your own video
  what_to_watch_in_video: string[];

  // How AI will score your video
  what_ai_measures: string[];

  // What your results mean — written for a player to understand
  results_explained: {
    excellent: string;
    good: string;
    needs_work: string;
    critical: string;
  };

  // Simple progress check — can you feel/see this yourself?
  progress_check: string;

  difficulty_level: 1 | 2 | 3;
  is_premium: boolean;
  mediapipe_fixes: string[];
  sets_reps: string;
  frequency: string;
  timeline_weeks: number;
  muscles_targeted: string[];
  equipment_tier: EquipmentTier;
}

export const MEDIAPIPE_REMEDIATION_DRILLS: RemediationDrill[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // KNEE VALGUS — Knee bending inward on landing (ACL injury risk)
  // Shona: Gumbo rinobenda mukati paunokwira pasi
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_kv_01",
    name: "Side Step with Resistance",
    name_shona: "Kufamba Kurutivi — Tsigiro",
    duration: "8 minutes",
    category: "Physical",

    what_ai_detected: "When you jumped and landed, your knee bent inward toward the middle of your body. This happened on most of your landings. It means the muscles on the outside of your hip are not strong enough to hold your knee in the correct position.",

    why_it_matters: "When your knee bends inward like this during a game — when you land from a header, change direction, or plant your foot to shoot — it puts very bad pressure on the inside of your knee. Many young players tear the ligament inside their knee this way. It is called an ACL tear and it stops you playing for 9 to 12 months. This drill fixes it.",

    equipment_needed: [
      "One resistance band OR a cut bicycle inner tube",
    ],
    equipment_diy: [
      "Cut a strip from an old bicycle inner tube — about 40cm long. Tie the two ends together to make a loop. This works exactly the same as a bought resistance band.",
      "If you cannot find a bicycle inner tube: use a thick rubber strip cut from an old car tyre inner tube, or tie together two long rubber bands.",
      "You do not need shoes. You do not need a flat surface. Grass is fine.",
    ],

    how_to_film: [
      "Ask a friend or family member to hold your phone. If no one is available, prop your phone against a rock, shoe, or stick pushed into the ground.",
      "Film from DIRECTLY IN FRONT of you — not from the side.",
      "The camera should be at knee height — not held high up or placed on the ground.",
      "Make sure your full body from feet to head is visible in the frame.",
      "Film in daylight — morning or late afternoon is best. Avoid filming when the sun is directly behind you.",
      "Record the full set without stopping the camera.",
    ],

    instructions: [
      "Place the rubber band or bicycle tube around your legs — just above both knees.",
      "Stand with your feet about as wide as your shoulders. Bend your knees a little — like you are about to sit down halfway.",
      "Now step to the RIGHT with your right foot — one big step.",
      "Bring your LEFT foot in to follow. Do not let your feet touch.",
      "Step right again. Then right again. Count 12 steps going right.",
      "Now do the same thing going LEFT — 12 steps to the left.",
      "The band will try to pull your knees together. You must push your knees OUTWARD against it the whole time. This is the exercise.",
      "If you feel nothing after 6 steps, the band is not tight enough — tie a knot to make it smaller.",
      "Rest for 30 seconds. Then do it again.",
      "Do this 3 times total.",
    ],

    success_feels_like: "After about 8 steps, you should feel a burning feeling on the outside of your hip and backside — not in your knee or your lower back. If you feel it in the wrong place, stop and check that your knees are pushing OUT against the band, not letting them cave in.",

    what_to_watch_in_video: [
      "Watch your knees in the video — they should stay directly above your feet, not falling toward each other.",
      "Your body should stay upright — not leaning sideways.",
      "Your hips should stay level — one hip should not be higher than the other.",
      "If your knees are falling inward in the video, shorten the band or step less wide.",
    ],

    what_ai_measures: [
      "How far your knees track over your toes versus collapsing inward",
      "Whether your hips stay level as you move",
      "The symmetry between your left and right side",
    ],

    results_explained: {
      excellent: "Your knees stayed directly over your feet the whole time. Your outer hip muscles are strong. Keep doing this 3 times a week to maintain it.",
      good: "Your knees mostly tracked well but collapsed slightly on some steps. You are improving. Do this every day for 3 more weeks and re-test.",
      needs_work: "Your knees still bend inward on many steps. This is normal at the start — your hip muscles are weak and need time to build. Do this every single day. Do not miss a day. Re-test in 3 weeks.",
      critical: "Your knees collapse strongly inward throughout the exercise. Do not play in competitive matches until this improves. Your knee is at serious injury risk during landing and turning. Focus only on this exercise for 2 weeks, twice a day.",
    },

    progress_check: "After 3 weeks, film yourself again doing the same exercise. Compare the two videos. Your knees should visibly track further outward over your toes. You should also feel the burning in your outer hip much faster — by step 5 instead of step 10. That burning means the muscle is getting stronger.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["knee_valgus", "hip_drop", "bilateral_asymmetry"],
    sets_reps: "3 sets of 12 steps in each direction",
    frequency: "Every day",
    timeline_weeks: 6,
    muscles_targeted: ["Outer hip muscle (gluteus medius)", "Hip abductors"],
    equipment_tier: "basic",
  },

  {
    id: "rem_kv_02",
    name: "Lying Side Leg Lift",
    name_shona: "Simudza Gumbo Uchiwanba Parutivi",
    duration: "6 minutes",
    category: "Physical",

    what_ai_detected: "Your knee collapses inward when you land. The muscle on the outside of your hip is not working hard enough to keep your knee over your foot.",

    why_it_matters: "This single muscle — the gluteus medius, on the side of your backside — is responsible for holding your knee in the safe position during every single step you take in a football match. When it is weak, your knee is in danger on every landing and every change of direction.",

    equipment_needed: [
      "No equipment needed at all",
    ],
    equipment_diy: [
      "Nothing required. You can do this on grass, on a mat, on a concrete floor — anywhere.",
      "To make it harder: tie a rubber band or bicycle tube above your knees while doing it.",
    ],

    how_to_film: [
      "Lie on your side on the ground.",
      "Ask someone to film from BEHIND you — so the camera can see both your legs clearly.",
      "If filming alone: prop the phone on a rock or shoe about 1 metre behind your feet, at ground level.",
      "Film the whole set without stopping.",
      "Do both sides — film the left side, then the right side.",
    ],

    instructions: [
      "Lie on your left side on the ground. Stack your right hip directly on top of your left hip — do not let your hips roll backward.",
      "Bend both knees slightly — about 45 degrees. Keep your feet together.",
      "Place your right hand on your right hip. This is to feel whether your hip is rolling. It must stay still.",
      "Keeping your feet together, lift your RIGHT knee upward as high as you can — like a clamshell opening.",
      "Hold it up for 2 seconds. Squeeze your outer backside muscle.",
      "Lower your knee slowly back down. Do not let it drop.",
      "Do this 20 times on your right side. Then roll over and do 20 times on your left side.",
      "Rest for 20 seconds. Do it again.",
      "Do 3 sets of 20 on each side.",
    ],

    success_feels_like: "You feel a strong burning on the SIDE of your backside — the outer part of your glute. Not in your lower back. Not in your hip flexor at the front. If you feel it in the wrong place, make sure your hips are not rolling backward — keep them stacked directly on top of each other.",

    what_to_watch_in_video: [
      "Your knee should lift to at least a 45-degree angle — ideally higher.",
      "Your bottom hip should not roll backward — it must stay still.",
      "The movement should be slow and controlled, not a fast swing.",
      "Both sides should look the same — if one side lifts much higher than the other, that is the stronger side.",
    ],

    what_ai_measures: [
      "Height your knee reaches on each rep",
      "Whether your hip stays still or rolls",
      "Difference between left and right side — symmetry score",
    ],

    results_explained: {
      excellent: "Your knee lifts high and your hip stays completely still on both sides. Both sides are equal. Your gluteus medius is strong and balanced.",
      good: "Your knee lifts well but your hip rolls slightly on some reps, or one side is noticeably higher than the other. Focus on the weaker side by doing 5 extra reps on that side each set.",
      needs_work: "Your knee cannot lift very high and your hip rolls significantly. This is expected if your hip muscles are very weak. Start with fewer reps — 10 instead of 20 — and build up slowly over 2 weeks.",
      critical: "One side cannot lift at all or only a few centimetres. This level of weakness requires you to do this exercise twice daily — morning and evening — for 2 weeks before re-testing.",
    },

    progress_check: "After 2 weeks, film yourself again. Your knee should lift visibly higher. You should feel the burning sooner — by rep 8 instead of rep 15. Compare the two videos side by side. The difference should be clear.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["knee_valgus", "hip_drop"],
    sets_reps: "3 sets of 20 reps each side",
    frequency: "Every day — no equipment, can be done anywhere",
    timeline_weeks: 4,
    muscles_targeted: ["Gluteus medius", "Gluteus minimus", "Outer hip"],
    equipment_tier: "zero",
  },

  {
    id: "rem_kv_03",
    name: "One-Leg Squat Against a Wall",
    name_shona: "Gara Pasi Negumbo Rimwe — Kumadziro",
    duration: "10 minutes",
    category: "Physical",

    what_ai_detected: "Your knee bends inward when you land or decelerate. This means your body has not yet learned to control your knee position when your full weight is on one leg.",

    why_it_matters: "In every sprint, every jump landing, every time you plant your foot to pass or shoot — you are briefly on one leg with your full bodyweight going through that knee. Your knee must be able to hold the correct position under your bodyweight. This drill trains exactly that.",

    equipment_needed: [
      "A wall, tree, or fence — anything solid you can face",
      "Your phone or a friend to watch your knees",
    ],
    equipment_diy: [
      "Any solid vertical surface works — the wall of a house, a large tree, a concrete post, a fence.",
      "If you cannot find a wall: do the exercise near a friend who watches your knees and calls out 'knee in!' if your knee falls inward.",
    ],

    how_to_film: [
      "Film from DIRECTLY IN FRONT of you — you need to see if your knee goes inward or stays over your toes.",
      "The camera should be at knee height — prop it on a rock, shoe, or bag.",
      "Make sure your whole body from feet to head is visible.",
      "Film in good light. Face the light source so your body is not in shadow.",
      "If you are doing it against a wall, the camera can be placed slightly to the side so it can see your knee clearly.",
    ],

    instructions: [
      "Stand facing a wall — about 30cm away from it.",
      "Lift your LEFT foot off the ground. You are now standing on your RIGHT leg only.",
      "Slowly bend your right knee and lower yourself down — as if sitting on a chair behind you.",
      "WATCH YOUR KNEE: it must stay directly above your middle toe. It must not fall inward toward the wall.",
      "Lower yourself until your knee is bent to about 60-70 degrees. Not all the way down — just halfway.",
      "Hold for 2 seconds at the bottom. Look at your knee — is it still over your toe?",
      "Push through your heel to stand back up.",
      "If your knee falls inward — stop. Come back up. Try again more slowly and less deeply.",
      "Do 10 reps on the right leg. Then switch to the left leg.",
      "Rest 30 seconds. Repeat.",
      "Do 3 sets of 10 reps each leg.",
    ],

    success_feels_like: "Your outer hip and thigh feel like they are working very hard to keep your knee from falling inward. Your knee stays over your toes the whole time. Your heel stays flat on the ground. This is hard — if it feels easy, you are probably letting your knee fall inward without noticing.",

    what_to_watch_in_video: [
      "Pause the video when your knee is at its most bent — at the bottom of the squat.",
      "Draw an imaginary straight line from your hip, through your knee, to your middle toe.",
      "Your knee should be on that line — not inside it (inward) and not outside it.",
      "If your knee is inside the line, your hip muscles are too weak. Do more Lying Side Leg Lifts first.",
      "Compare your left and right sides — they should look the same.",
    ],

    what_ai_measures: [
      "Knee position relative to your toes at the lowest point",
      "How far your knee travels inward during the movement",
      "Difference between left and right leg",
      "Hip stability during the squat",
    ],

    results_explained: {
      excellent: "Your knee tracked directly over your toes on every rep on both legs. Your hip muscles are doing their job correctly. This is a strong result.",
      good: "Your knee stayed mostly in line but drifted slightly inward on a few reps, especially toward the end of the set when you were tired. Reduce the depth of your squat slightly and focus on knee position before increasing depth again.",
      needs_work: "Your knee falls inward consistently. This is common and fixable. Do NOT try to go deeper. Focus entirely on keeping the knee over the toe at a shallow depth — even if that means only bending 30 degrees. Depth comes after the alignment is correct.",
      critical: "Your knee collapses strongly inward immediately. Do not progress to this exercise yet. Complete 2 weeks of Lying Side Leg Lifts and Side Step With Resistance first, then re-try this one.",
    },

    progress_check: "After 3 weeks, film yourself and check: can your knee reach parallel (thigh horizontal) while staying over your toes? Compare to your first video. The inward drift should be visibly reduced or gone.",

    difficulty_level: 2,
    is_premium: false,
    mediapipe_fixes: ["knee_valgus", "bilateral_asymmetry", "landing_stiffness"],
    sets_reps: "3 sets of 10 reps each leg",
    frequency: "Every other day — muscles need rest to grow",
    timeline_weeks: 8,
    muscles_targeted: ["Gluteus medius", "Vastus medialis", "Glutes", "Core", "Ankle"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HIP DROP — One hip lower than the other during movement
  // Shona: Chiuno chinowira kune rimwe divi
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_hd_01",
    name: "Hip Lift on a Step or Rock",
    name_shona: "Simudzira Chiuno Pachisidisi Kana Dombo",
    duration: "6 minutes",
    category: "Physical",

    what_ai_detected: "When you were standing on one leg, one side of your hip dropped lower than the other. This means the muscle on the outside of your standing hip is not strong enough to hold your pelvis level.",

    why_it_matters: "Every time you run, you are briefly standing on one leg. If your hip drops every time you lift one leg, it means the muscle responsible for holding your hip level is weak. Over a long match, this creates pain in your hip, your knee, and sometimes your lower back. It also slows you down because your body has to compensate on every step.",

    equipment_needed: [
      "A step, raised stone, concrete block, thick piece of wood, or a kerb",
      "Anything you can stand on one foot on where your other foot hangs off the edge",
    ],
    equipment_diy: [
      "A concrete block, a flat rock, a stack of 3-4 bricks, the bottom step of a staircase, or a thick piece of wood all work perfectly.",
      "The step needs to be at least 15-20cm high so your hanging foot can go below the level of your standing foot.",
      "You can hold a wall or tree for balance at first — gradually reduce how much you hold as you get stronger.",
    ],

    how_to_film: [
      "Film from DIRECTLY IN FRONT of you.",
      "The camera must be at hip height — not at the ground, not up high.",
      "You need to see your hips clearly in the video — wear clothes that show your hip level (not a baggy shirt that hides your waist).",
      "Film the whole set on one leg, then turn around and film the other leg.",
      "Good light is important for this one — film in daylight, not in shadow.",
    ],

    instructions: [
      "Find your step, block, or rock. Stand on it with your RIGHT foot. Your left foot hangs off the edge.",
      "Hold a wall or tree with one finger — just for safety, not to carry your weight.",
      "Let your LEFT hip DROP slowly downward below the level of your right hip. This should feel like your left side is sinking.",
      "Now use the muscle on the OUTSIDE of your right backside to lift your LEFT hip back up above level.",
      "Do not lean your whole body sideways. The movement is only in your hip.",
      "Hold the lifted position for 3 seconds. Then lower slowly.",
      "You should feel the muscle working on the OUTSIDE of the standing hip — not the lower back.",
      "Do 15 reps on the right leg. Then switch feet and do 15 reps on the left leg.",
      "Rest 30 seconds. Repeat 3 times total.",
    ],

    success_feels_like: "You feel a strong pulling and burning on the outer side of your standing hip and backside — not your lower back or the inside of your hip. If you feel it in your lower back, you are leaning your whole torso sideways — keep your chest upright and only move your hip.",

    what_to_watch_in_video: [
      "Pause the video when your hip is at the TOP position — lifted as high as possible.",
      "Your standing hip should be visibly HIGHER than your hanging side — not level, above level.",
      "Your chest and shoulders should stay upright — not tilting sideways.",
      "Compare your left leg and right leg videos — if one side lifts much higher, that side is stronger.",
      "Over time, both sides should look the same and both should lift equally high.",
    ],

    what_ai_measures: [
      "How high your hip lifts on each rep",
      "Whether your torso stays upright or tilts",
      "Difference between your left and right hip strength",
    ],

    results_explained: {
      excellent: "Your hip lifts clearly above level on both sides and your torso stays upright. Both sides are equal. This muscle is strong — keep this in your training to maintain it.",
      good: "Your hip lifts to level but not above, or one side lifts higher than the other. Continue daily until both sides lift equally above level.",
      needs_work: "Your hip barely lifts to level — it stays roughly flat even when you are trying to lift. This is a weak muscle. Reduce to 10 reps per set and do this exercise twice a day — morning and before training.",
      critical: "Your hip cannot lift above level at all and your torso tilts heavily sideways. Start by doing just the downward part — lower slowly and let gravity lift you back. Build from there.",
    },

    progress_check: "After 2 weeks of daily practice, film yourself again. Your hip should visibly lift higher than before. You should feel the burning faster. Compare the two videos — the difference will be visible.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["hip_drop", "knee_valgus", "bilateral_asymmetry"],
    sets_reps: "3 sets of 15 reps each side",
    frequency: "Every day",
    timeline_weeks: 4,
    muscles_targeted: ["Gluteus medius", "Gluteus minimus", "Hip abductors"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // LANDING STIFFNESS — Knees not bending enough on landing
  // Shona: Mabvi haabendi zvakakwana paunokwira pasi
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_ls_01",
    name: "Jump and Land Like a Cat",
    name_shona: "Tamba Wobuda Semhembwe",
    duration: "10 minutes",
    category: "Physical",

    what_ai_detected: "When you landed from a jump, your knees did not bend very much. Your landing was stiff and hard. This means the impact of landing is going straight through your joints instead of being absorbed by your muscles.",

    why_it_matters: "When a cat jumps down from a wall, it lands silently and softly — bending its legs deeply to absorb the impact. When you land stiffly with straight legs, all the force goes into your knee and ankle joints. Over time this damages the cartilage inside your joints. A soft, bent-knee landing protects your joints and also makes you faster because you can immediately jump or sprint from the bent position.",

    equipment_needed: [
      "A low step, stone, or raised surface — about 30-50cm high",
      "Flat grass or ground to land on",
    ],
    equipment_diy: [
      "Any step works — a doorstep, a concrete block, a flat rock, the kerb.",
      "If nothing is available, you can do this by jumping from a standing position — just jumping up and focusing on how you land.",
      "No shoes required but landing on flat ground is better than stony ground for this exercise.",
    ],

    how_to_film: [
      "Film from the SIDE — you need to see how much your knees bend when you land.",
      "The camera should be at hip height, placed on a rock or propped against a stick in the ground.",
      "Make sure your whole body is visible from head to toe.",
      "Film 5-10 landings without stopping the camera.",
      "After filming, watch the video and pause it at the moment your feet touch the ground — check how bent your knees are.",
    ],

    instructions: [
      "Stand on your low step or raised surface. Look ahead — not down at the ground.",
      "Step off the edge — do not jump hard, just step off.",
      "As soon as your feet touch the ground — BEND your knees as deeply and quickly as possible.",
      "Try to make no sound at all when you land. The softer the sound, the better your landing.",
      "Bend until your thighs are almost horizontal — like sitting on a low chair.",
      "Hold that position for 3 seconds. Check: are your knees over your toes? Is your weight on your whole foot?",
      "Stand up. Step back onto the surface. Do it again.",
      "IMPORTANT: if you make a slapping or thudding sound when you land, you are too stiff. Bend more.",
      "Do 8 landings. Rest 30 seconds. Repeat 4 times.",
    ],

    success_feels_like: "Your landing is completely silent. You feel your thigh muscles and backside working hard to catch your bodyweight. It feels like sitting down quickly into a very low chair. Your feet feel the ground but your joints do not feel the impact.",

    what_to_watch_in_video: [
      "Pause the video at the exact moment your feet touch the ground.",
      "Look at your knees — how much are they bent? They should be deeply bent, not nearly straight.",
      "Look at your hips — are they dropping low toward the ground? They should be.",
      "Are your knees tracking over your toes — or falling inward? They should stay over your toes.",
      "Compare your first video and your video after 3 weeks — the difference in knee bend should be very visible.",
    ],

    what_ai_measures: [
      "The angle of your knee at the moment of landing — smaller angle means more bend, which is better",
      "Whether your knees stay over your toes on landing",
      "The symmetry between your left and right knee bend",
      "How quickly your muscles absorb the landing force",
    ],

    results_explained: {
      excellent: "Your knees bent deeply on landing, your hips dropped low, and your landing was soft and quiet. Your joints are well protected. Keep this as part of your warm-up.",
      good: "Your knees bent reasonably well but you could go deeper. Focus on the silence — if your landing makes any sound, try to make it even quieter by bending more.",
      needs_work: "Your knees are still quite straight on landing. Focus only on the 'silent landing' cue — forget about everything else and just try to land with no sound. The bend will come naturally as you focus on silence.",
      critical: "Your landings are very stiff and loud on every rep. Start without the step — just stand still, bend your knees very deeply, then straighten. Repeat 20 times to teach your body the position. Then try the landing drill again.",
    },

    progress_check: "After 3 weeks, film yourself landing again. Pause the video at the landing moment. Compare your knee bend now versus your first video. The bend should be visibly deeper. You should also be landing much more quietly.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["landing_stiffness", "knee_valgus", "com_instability"],
    sets_reps: "4 sets of 8 landings",
    frequency: "3 times per week",
    timeline_weeks: 6,
    muscles_targeted: ["Quadriceps", "Glutes", "Hamstrings", "Calves", "Core"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // FATIGUE DEGRADATION — Technique breaking down when tired
  // Shona: Nzira yekutamba inoparara pauneta
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_fd_01",
    name: "Run Hard Then Do Your Drill",
    name_shona: "Mhanya Nekukurumidza Wobva Waita Drill Yako",
    duration: "20 minutes",
    category: "Physical",

    what_ai_detected: "Your body position changed significantly between the beginning and end of the drill clip. Your knees were in a better position at the start than at the end. This means when you get tired, your technique breaks down. This is when most injuries happen.",

    why_it_matters: "Most goals are scored and most injuries happen in the last 15-20 minutes of a match — because players are tired and their bodies stop moving correctly. If your technique breaks down when you are tired in training, it will break down even more in a match. This drill trains your body to hold its correct technique even when you are very tired.",

    equipment_needed: [
      "Open space — 30 to 40 metres of flat ground",
      "Any ball if doing ball drills",
    ],
    equipment_diy: [
      "You only need space. A road, a field, a school yard — anywhere you can run 30-40 metres.",
      "Measure 30 metres by counting steps — about 35 normal walking steps.",
    ],

    how_to_film: [
      "You need TWO video clips — one at the START and one at the END of the session.",
      "CLIP 1: Film yourself doing your technical drill BEFORE the running — when you are fresh.",
      "Do the running sets. Get very tired.",
      "CLIP 2: Film yourself doing the SAME drill immediately after the last run — when you are exhausted.",
      "The AI will compare these two clips to see how much your technique changed.",
      "Same camera position for both clips — same angle, same height.",
    ],

    instructions: [
      "Start by filming yourself doing your technical drill at normal pace for 1 minute. This is your 'fresh' baseline.",
      "Now run 30 metres as fast as you can. Walk back. That is 1 run.",
      "Do 6 runs total. Walk back between each run — do not rest longer than it takes to walk back.",
      "After your 6th run — immediately start your technical drill again. Do it for 1 minute.",
      "Film this second attempt. Your legs will feel heavy. Your breathing will be fast.",
      "FOCUS: try to do the drill exactly the same way as when you were fresh. Your brain knows the correct movement — trust it even when your body is tired.",
      "Rest for 3 minutes.",
      "Do the running and drill sequence one more time.",
    ],

    success_feels_like: "Your legs feel like heavy stones during the second drill. Your breathing is fast. But your body is doing the movements correctly even though it is hard. You finish the drill and think: 'I was tired but I did not change how I moved.' That feeling is the goal.",

    what_to_watch_in_video: [
      "Compare your fresh clip and your tired clip side by side.",
      "Look at your body position — is your back more bent when tired?",
      "Look at your knee position — are they still tracking correctly or falling inward?",
      "Look at your feet — are you still on the balls of your feet or are you flat-footed when tired?",
      "How big is the difference between the two clips? After 8 weeks it should be much smaller.",
    ],

    what_ai_measures: [
      "How much your knee position changes from first half to second half of the clip",
      "How much your trunk lean changes under fatigue",
      "The percentage change in your body mechanics — the fatigue index",
    ],

    results_explained: {
      excellent: "Less than 5% difference between your fresh and tired technique. Your body maintains excellent mechanics even under fatigue. You are ready for a full 90 minutes.",
      good: "5-12% difference. Minor breakdown — noticeable but not dangerous. Continue this training and the gap will close.",
      needs_work: "12-20% difference. Your technique breaks down significantly when tired. You are at higher injury risk in the final 20 minutes of matches. Prioritise this training twice a week.",
      critical: "More than 20% difference. Your technique changes dramatically when tired. Start matches but be substituted before the 70th minute until this improves. Train this specific drill twice a week, every week.",
    },

    progress_check: "Film the two-clip comparison every 3 weeks. The difference between your fresh and tired clips should get smaller over time. After 8 weeks, most players see their fatigue index drop from 20%+ to under 10%.",

    difficulty_level: 3,
    is_premium: true,
    mediapipe_fixes: ["fatigue_degradation", "trunk_lean_deficit"],
    sets_reps: "2 rounds of 6 sprints + 1 minute technique drill",
    frequency: "Twice a week",
    timeline_weeks: 8,
    muscles_targeted: ["Cardiovascular system", "Quadriceps", "Hamstrings", "Core", "Mental toughness"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // TRUNK LEAN DEFICIT — Not leaning forward enough when sprinting
  // Shona: Kutadza kupamha mberi paunomhanya
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_tl_01",
    name: "Wall Lean Sprint Position",
    name_shona: "Imba Kumadziro — Nzvimbo Yekumhanya",
    duration: "10 minutes",
    category: "Physical",

    what_ai_detected: "When you sprinted, your body was too upright. You were not leaning forward enough. This wastes energy — some of your sprinting power goes upward instead of forward.",

    why_it_matters: "Think of a bicycle — when you pedal standing straight up, you go slowly. When you lean forward, you go much faster with the same effort. Sprinting works the same way. The correct lean means your power goes directly forward. Standing too upright means you waste 10-15% of your sprinting energy going upward. This drill teaches your body the correct sprint position so it becomes automatic.",

    equipment_needed: [
      "A wall, tree, or fence",
    ],
    equipment_diy: [
      "Any solid vertical surface. The wall of a house, a large tree, a concrete post.",
      "You can also do this against a teammate's hands — they stand still and you lean into their palms.",
    ],

    how_to_film: [
      "Film from the SIDE — you need to see the angle of your whole body.",
      "The camera should be at hip height — on a rock or propped up.",
      "Make sure you can see from your head to your feet in the frame.",
      "Film both the wall exercise and a short sprint so the AI can compare your wall position to your actual sprint.",
    ],

    instructions: [
      "Stand 1 metre away from the wall. Put both hands flat against the wall at chest height.",
      "Walk your feet back until your whole body is in one straight line — from your heels to your head. Do not bend at the waist.",
      "You are now leaning at about 45 degrees. This is the sprint lean position.",
      "From this position, drive your right knee up toward your chest — then bring it back down.",
      "Then drive your left knee up — then bring it back down. Alternate, slowly at first.",
      "Build up until you are doing it quickly — like running in place against the wall.",
      "Keep your body in that straight-line lean the whole time. If your hips sag or bend, push them back to the straight line.",
      "Do this for 10 seconds. Rest 20 seconds. Repeat 6 times.",
      "After the wall exercise, immediately sprint 20 metres — carry the feeling of the lean into the sprint.",
    ],

    success_feels_like: "Against the wall, you feel like your whole body is one angled plank — no bends, no sags. When you then sprint, that same feeling of leaning forward should carry over. You should feel yourself driving more powerfully into the ground and moving forward faster.",

    what_to_watch_in_video: [
      "Look at the angle of your whole body during the wall exercise — is it one straight line or is your backside sticking out?",
      "When you watch your sprint, is your body at roughly the same forward angle as during the wall exercise?",
      "An upright sprinter looks like they are jogging. A correctly leaning sprinter looks like they are about to fall forward — the ground catches them with each step.",
    ],

    what_ai_measures: [
      "The angle of your trunk during peak acceleration",
      "Whether your lean is consistent across all 3 sprints",
      "How close your sprint lean is to the optimal 20-25 degrees forward",
    ],

    results_explained: {
      excellent: "Your trunk lean during sprinting is at a strong forward angle throughout your acceleration. You are directing your power efficiently forward.",
      good: "Your lean is present but not strong enough — you straighten up after the first few metres. Focus on holding the lean all the way through 10 metres, not just at the start.",
      needs_work: "You are running almost upright. Do the wall exercise every day for 2 weeks before filming your sprint again. Your body needs to learn the feeling of the correct angle.",
      critical: "You are running completely upright with no forward lean. This is completely fixable with practice. Do the wall exercise twice a day — morning and afternoon. Sprint the same day after each wall session.",
    },

    progress_check: "After 2 weeks, film your sprint again from the side. Compare it to your first sprint video. Your body should visibly lean further forward during the first 10 metres. You should also feel faster — because more of your power is now going forward.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["trunk_lean_deficit", "stride_asymmetry"],
    sets_reps: "6 x 10 seconds wall exercise then sprint 20 metres",
    frequency: "Every day",
    timeline_weeks: 3,
    muscles_targeted: ["Hip flexors", "Glutes", "Core", "Calves"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // STRIDE ASYMMETRY — One leg doing more work than the other
  // Shona: Gumbo rimwe rinoshanda kupfuura rimwe
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_sa_01",
    name: "One-Leg Jumping — Weaker Side",
    name_shona: "Tsvetuka Negumbo Rimwe — Divi Diri Pasi",
    duration: "12 minutes",
    category: "Physical",

    what_ai_detected: "Your left and right legs are not equal when you run. One leg pushes harder and covers more ground than the other. Over a full season, the stronger leg takes on too much work and risks injury from overuse. The weaker leg makes you slower because it is not contributing fully.",

    why_it_matters: "Imagine trying to paddle a canoe with one arm stronger than the other — you would go in circles. Running with asymmetric legs is similar — it reduces your speed and puts all the stress on one side. Over a season this leads to overuse injuries on the dominant side. This drill specifically strengthens the weaker leg to match the stronger one.",

    equipment_needed: [
      "Flat ground — about 10 metres",
      "Optional: a stick or small stone to mark your distances",
    ],
    equipment_diy: [
      "Any flat surface works — grass, a dirt road, a school yard.",
      "Use small stones or sticks to mark 10 metres — about 12 normal walking steps.",
    ],

    how_to_film: [
      "Film from the SIDE — you need to see the height and length of your jumps.",
      "Camera at hip height on a rock or stick.",
      "Film the full set of jumps without stopping.",
      "Film the WEAKER leg separately from the STRONGER leg.",
      "The AI will compare the height and distance of each jump to find the gap between your two legs.",
    ],

    instructions: [
      "First: identify which is your weaker leg. It is the leg that MediaPipe flagged. If you are unsure, it is usually your non-dominant leg — your left leg if you are right-footed.",
      "Stand on your WEAKER leg only. Lift your stronger leg off the ground.",
      "Jump forward from your weaker leg — push as hard as you can.",
      "Land on BOTH feet — soft landing, knees bent.",
      "Mark where you landed with a stick or stone.",
      "Walk back to the start. Jump again from your weaker leg. Try to match or beat your previous distance.",
      "Do 5 jumps from your weaker leg. Rest 30 seconds.",
      "Now do 3 jumps from your STRONGER leg — notice how much further or higher it goes.",
      "Do 5 sets — always doing more reps on the weaker leg.",
    ],

    success_feels_like: "At first, your weaker leg feels hesitant and lands short. After 3-4 weeks of daily practice, the jump from the weaker leg starts to feel more explosive and confident. The gap between the two legs gets smaller. When both legs feel equally strong and jump equally far, the asymmetry is fixed.",

    what_to_watch_in_video: [
      "Watch how high and far each jump goes from each leg.",
      "Look at the landing — does your knee stay over your toe or collapse inward?",
      "Compare the VIDEO of your weaker leg jumps in week 1 with week 4 — the jump should be visibly further.",
      "When both legs jump the same distance, you have fixed the asymmetry.",
    ],

    what_ai_measures: [
      "Jump distance from weaker leg versus stronger leg — the gap percentage",
      "Landing knee alignment on both legs",
      "Progress in the weaker leg jump distance over time",
    ],

    results_explained: {
      excellent: "Less than 5% difference between your two legs. Both legs are contributing equally. Your running efficiency is very high.",
      good: "5-10% difference. Minor asymmetry — common and fixable. Continue this training and the gap will close.",
      needs_work: "10-20% difference. Your weaker leg is significantly underperforming. Do this drill every day. Focus all your effort on the weaker leg and only do a few reps on the stronger leg.",
      critical: "More than 20% difference. One leg is doing significantly more work than the other. This is a serious efficiency issue and injury risk. Do this drill twice a day — morning and evening. Do not do equal reps — always 3x more reps on the weaker side.",
    },

    progress_check: "Every 2 weeks, film yourself doing 5 jumps from each leg. Measure the distance with a stick in the ground. The gap between the two legs should get smaller each time. When they are equal, you have fixed the asymmetry.",

    difficulty_level: 2,
    is_premium: false,
    mediapipe_fixes: ["stride_asymmetry", "bilateral_asymmetry", "knee_valgus"],
    sets_reps: "5 sets — 5 jumps weaker leg, 3 jumps stronger leg",
    frequency: "Every day",
    timeline_weeks: 6,
    muscles_targeted: ["Quadriceps", "Glutes", "Hip flexors", "Calves", "Core"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // HIP ROTATION DEFICIT — Hips not rotating enough when kicking
  // Shona: Chiuno hachitendereri zvakakwana pakurova bhora
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_hr_01",
    name: "Hip Opening Stretch Sequence",
    name_shona: "Kuvhura Chiuno — Ruka Dzemuviri",
    duration: "10 minutes",
    category: "Physical",

    what_ai_detected: "When you kicked or sprinted, your hips did not rotate as much as they should. This limited your power and your stride length. The muscles and joints around your hips are tight and need to be loosened and strengthened.",

    why_it_matters: "Hip rotation is what generates power when you kick a ball. The best kickers in the world rotate their hips fully before their leg swings — this creates a wind-up effect that multiplies the power of the kick. If your hips are tight and cannot rotate fully, you are leaving 20-30% of your kicking power behind. This sequence loosens the muscles around your hips so the rotation can happen freely.",

    equipment_needed: [
      "Flat ground or a mat",
      "Optional: a wall or tree for balance in some movements",
    ],
    equipment_diy: [
      "No equipment needed. Grass, a dirt surface, or a concrete floor all work.",
      "A thin cloth or sack on the ground can replace a mat for comfort.",
    ],

    how_to_film: [
      "Film from the SIDE and FRONT on different movements.",
      "This is a mobility sequence — film yourself doing each movement slowly.",
      "The AI will assess your range of movement in each position.",
      "Film in good light so your body position is clearly visible.",
    ],

    instructions: [
      "MOVEMENT 1 — Kneeling Hip Lunge (2 minutes):",
      "Kneel on your right knee, left foot forward. Push your hips forward slowly until you feel a stretch at the front of your right hip. Hold for 30 seconds. Switch sides. Do this twice on each side.",

      "MOVEMENT 2 — Figure Four Stretch (2 minutes):",
      "Sit on the ground, both knees bent, feet flat. Cross your right ankle over your left knee — like a figure 4. Gently push your right knee toward the ground. Hold 30 seconds. Switch sides.",

      "MOVEMENT 3 — Seated Hip Rotation (2 minutes):",
      "Sit with both knees bent at 90 degrees in front and to the side. Lean forward over your front leg gently. Hold 20 seconds. Switch sides.",

      "MOVEMENT 4 — Standing Hip Circles (2 minutes):",
      "Stand on one leg. Lift your other knee to waist height. Draw large slow circles with your knee — 10 circles going forward, 10 going backward. Switch legs.",

      "MOVEMENT 5 — Knee Drive to Hip Flexion (2 minutes):",
      "Standing, drive one knee up as high as possible toward your chest. Hold for 2 seconds. Lower slowly. Do 15 reps each leg.",
    ],

    success_feels_like: "After completing the full sequence, your hips should feel open and mobile. When you kick a ball immediately after, your leg should swing through more freely — like a door that was previously stiff is now swinging freely. This feeling will fade without daily practice.",

    what_to_watch_in_video: [
      "In Movement 1: can you push your hips far forward without your back arching? The further you can go, the better your hip flexor length.",
      "In Movement 4: how big are your circles? Are they smooth or do they catch and stop at certain points? Catching means tightness.",
      "Compare your circles in week 1 versus week 4 — they should be larger and smoother.",
    ],

    what_ai_measures: [
      "Range of hip movement in each position",
      "Symmetry between left and right hip mobility",
      "Improvement in range over multiple sessions",
    ],

    results_explained: {
      excellent: "Full range of movement in all positions. Your hips move freely with no catching or restriction. Your kicking power and sprint mechanics should be fully supported by your hip mobility.",
      good: "Good range on most movements but some tightness in specific positions. Note which movements feel most restricted — spend extra time on those.",
      needs_work: "Significant restriction in multiple movements. Do the full sequence every morning before training for 4 weeks. Tight hips take time to open — do not rush it.",
      critical: "Very restricted range across most movements. Your hips are very tight. Focus on Movements 1 and 2 only for the first 2 weeks — 3 sets of each, holding each position for 45 seconds. Add the other movements in week 3.",
    },

    progress_check: "Film yourself doing Movement 4 — the hip circles — in week 1 and week 4. Compare the size and smoothness of the circles. They should be visibly larger and flow more smoothly without catching.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["hip_rotation_deficit", "stride_asymmetry", "trunk_lean_deficit"],
    sets_reps: "Full sequence once daily — 10 minutes total",
    frequency: "Every day",
    timeline_weeks: 4,
    muscles_targeted: ["Hip flexors", "Iliopsoas", "Piriformis", "Hip rotators", "Glutes"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ARM DRIVE — Arms not swinging correctly during sprinting
  // Shona: Maoko haashandi zvakanaka paunomhanya
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_ad_01",
    name: "Sitting Arm Swing Practice",
    name_shona: "Sunungura Maoko Uchigara Pasi",
    duration: "8 minutes",
    category: "Physical",

    what_ai_detected: "When you sprinted, your arms were not swinging in the most efficient way. Your elbows may have been too straight, or your arms may have been crossing in front of your body, or swinging sideways instead of forward and back.",

    why_it_matters: "Your arms create balance and rhythm for your legs when you sprint. Correct arm drive contributes up to 10% of your sprinting speed. Arms that cross your body create a twisting force that fights against your forward movement — like trying to run with your body turning sideways. Arms at the correct angle and path make every stride more efficient and faster.",

    equipment_needed: [
      "No equipment — just a place to sit",
    ],
    equipment_diy: [
      "Sit on the ground, a chair, a stone, or a tree stump. Any seated position works.",
      "The reason for sitting is to remove all leg movement — you can focus entirely on your arms.",
    ],

    how_to_film: [
      "Film from DIRECTLY IN FRONT of you.",
      "The camera should be at chest height — propped on something.",
      "Film yourself doing the slow version, then the fast version.",
      "You need to see both arms clearly — make sure nothing is blocking the view of either arm.",
    ],

    instructions: [
      "Sit on the ground with your legs straight out in front of you.",
      "Bend BOTH elbows to 90 degrees. Check this: your forearm should be horizontal.",
      "Now hold your elbows at 90 degrees and do NOT let them change angle throughout the exercise.",
      "Drive your RIGHT arm FORWARD — your right hand goes to eye level.",
      "At the same time, drive your LEFT arm BACKWARD — your left hand goes to your left hip.",
      "Then switch: LEFT arm forward to eye level, RIGHT arm back to right hip.",
      "CRITICAL: Arms move FORWARD and BACKWARD only. They must not cross in front of your body.",
      "Start slowly. Count 10 slow reps.",
      "Build to maximum speed — as fast as your arms can go while staying in the correct path.",
      "Do 6 sets of 10 seconds with 20 seconds rest between sets.",
      "After each set, stand up and sprint 15 metres — carry the arm feeling into the sprint.",
    ],

    success_feels_like: "Your elbows stay bent at 90 degrees the entire time. Your arms feel like pistons going straight forward and straight back. When you sprint after the seated practice, your arms feel like they are helping to pull you forward — not fighting against you.",

    what_to_watch_in_video: [
      "Watch whether your arms cross in front of your body — they should stay on their own side.",
      "Watch whether your elbows stay bent — do they straighten as you go faster?",
      "Watch whether your hands go to eye level in front and hip level behind — or are they stopping short?",
      "After 3 weeks, compare to your first video — the arm path should be cleaner and faster.",
    ],

    what_ai_measures: [
      "Elbow angle during arm swing — should stay at 90 degrees",
      "Whether arms cross the body midline — they should not",
      "The speed and symmetry of arm movement",
    ],

    results_explained: {
      excellent: "Arms moving cleanly forward and back at 90 degrees with no crossing. Your arm drive is efficient and contributing well to your sprint mechanics.",
      good: "Arms mostly correct but elbows open slightly at higher speeds or arms cross slightly. Continue the drill at speed and focus on keeping the 90 degree bend.",
      needs_work: "Arms cross the body or elbows straighten significantly. Do only the slow version for the first week — perfect the form before adding speed. Speed will come naturally once the pattern is correct.",
      critical: "Arms crossing strongly or moving sideways. This is a common habit that takes 3-4 weeks to change. Be patient — do the slow version twice a day.",
    },

    progress_check: "After 2 weeks, film yourself doing a sprint from the side AND the front. The arm swing should be visibly cleaner — straight lines forward and back. You should also feel slightly faster in your sprints.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["arm_drive"],
    sets_reps: "6 x 10 seconds",
    frequency: "Every day — only takes 8 minutes",
    timeline_weeks: 3,
    muscles_targeted: ["Deltoids", "Triceps", "Biceps", "Core for anti-rotation"],
    equipment_tier: "zero",
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ANKLE DORSIFLEXION — Ankle too stiff during landing and running
  // Shona: Zvibhakera zvenyoka zvakasimba zvakadaro — haakanganwi kupinda
  // ════════════════════════════════════════════════════════════════════════════

  {
    id: "rem_af_01",
    name: "Ankle Flexibility Sequence",
    name_shona: "Ruka dzeChitsitsinho — Kunyambura Nesimba",
    duration: "8 minutes",
    category: "Physical",

    what_ai_detected: "Your ankles are not bending forward enough during landing and deceleration. When you land, your ankle should be able to flex forward (your shin moving toward your toes) to absorb the landing impact. Restricted ankle movement forces your knee and hip to compensate — increasing injury risk.",

    why_it_matters: "A flexible ankle is the first joint that absorbs impact when you land. If it cannot flex enough, that impact travels straight to your knee. Over time this causes knee pain and ankle sprains. Flexible ankles also improve your sprint mechanics because each toe-off is more powerful when the ankle can move through its full range.",

    equipment_needed: [
      "A wall or tree",
      "Optional: a rolled cloth or thin piece of wood to place under your toes",
    ],
    equipment_diy: [
      "Any wall or solid vertical surface.",
      "A rolled school jersey, a piece of wood, or a thick root on the ground can be placed under your toes for the stretches.",
      "No shoes during stretching gives you more feedback — do it barefoot on grass.",
    ],

    how_to_film: [
      "Film from the SIDE for most movements — you need to see how far your shin can travel over your toes.",
      "Camera at ankle height for the stretches.",
      "Film each movement for the full time.",
    ],

    instructions: [
      "MOVEMENT 1 — Knee to Wall (3 minutes):",
      "Stand facing a wall, toes touching the wall. Drive your knee forward toward the wall while keeping your heel flat on the floor.",
      "See how close you can get your toes to the wall while your knee JUST touches the wall.",
      "If your knee easily touches — move your foot further back. Find the distance where your knee can just barely reach.",
      "Hold when your knee touches the wall for 3 seconds. Release. Repeat 10 times each foot.",

      "MOVEMENT 2 — Heel Raise on a Step (2 minutes):",
      "Stand on a raised surface — a step, a rock — on the balls of your feet, heels hanging over the edge.",
      "Lower your heels slowly below the level of the step — as low as they go.",
      "Hold for 2 seconds at the bottom. Raise back up onto tiptoe. That is 1 rep.",
      "Do 15 reps. You will feel this in your calf and Achilles.",

      "MOVEMENT 3 — Ankle Circles (1 minute):",
      "Sit down. Pick up one foot. Draw large circles with your whole foot — 10 times going right, 10 times going left.",
      "Make the circles as big as possible. Do both feet.",

      "MOVEMENT 4 — Calf Stretch Against Wall (2 minutes):",
      "Stand facing a wall, hands on the wall. Step one foot back. Keep the back heel flat on the floor.",
      "Bend your front knee and lean toward the wall — you feel the stretch in the back of your calf.",
      "Hold for 30 seconds. Switch legs. Do twice each side.",
    ],

    success_feels_like: "After the full sequence, your ankle should feel looser and more mobile. When you run immediately after, your toe-off should feel springier and more powerful. Landing should feel more cushioned as your ankle absorbs more of the impact.",

    what_to_watch_in_video: [
      "In Movement 1: how far can you put your foot from the wall while still touching with your knee? The further back, the better your ankle flexibility.",
      "In Movement 2: how far below the step do your heels go? Are both heels going equally low?",
      "Compare week 1 and week 4 — the distance in Movement 1 should increase measurably.",
    ],

    what_ai_measures: [
      "Ankle flexion angle during landing",
      "Difference between left and right ankle mobility",
      "How much the ankle flexes at the toe-off phase of sprinting",
    ],

    results_explained: {
      excellent: "Good ankle mobility. Your ankles are absorbing landing impact well and contributing to powerful toe-off. Maintain this with 3 sessions per week.",
      good: "Moderate mobility. One or both ankles are slightly restricted. Focus on the morning stretch sequence daily.",
      needs_work: "Restricted ankle mobility. Both ankles are tight and limiting your landing mechanics. Do this sequence every morning, immediately after waking, for 4 weeks. Do not skip.",
      critical: "Very restricted. Ankles cannot flex much at all. This requires 6-8 weeks of daily stretching before meaningful improvement. Be consistent — tight ankles are slow to change but they will change.",
    },

    progress_check: "Test yourself every 2 weeks using Movement 1. Mark on the ground how far your foot is from the wall. Each time you test, the mark should be further from the wall — showing your ankle can flex more.",

    difficulty_level: 1,
    is_premium: false,
    mediapipe_fixes: ["ankle_dorsiflexion", "landing_stiffness", "com_instability"],
    sets_reps: "Full sequence once",
    frequency: "Every day — best done in the morning",
    timeline_weeks: 5,
    muscles_targeted: ["Gastrocnemius", "Soleus", "Achilles tendon", "Tibialis anterior"],
    equipment_tier: "zero",
  },

];

// =============================================================================
// MEDIAPIPE PRESCRIPTION LOOKUP FUNCTIONS
// =============================================================================

export type MediaPipeFlag =
  | "knee_valgus"
  | "hip_drop"
  | "landing_stiffness"
  | "fatigue_degradation"
  | "trunk_lean_deficit"
  | "stride_asymmetry"
  | "hip_rotation_deficit"
  | "bilateral_asymmetry"
  | "ankle_dorsiflexion"
  | "arm_drive"
  | "knee_drive"
  | "com_instability";

/**
 * Get remediation drills for a specific MediaPipe flag.
 * Returns up to 3 drills ordered easiest first.
 *
 * Usage in analyse-drill results:
 *   const drills = getDrillsForFlag("knee_valgus");
 *   // Returns [Side Step with Resistance, Lying Side Leg Lift, One-Leg Squat]
 */
export function getDrillsForFlag(flag: MediaPipeFlag, limit = 3): RemediationDrill[] {
  return MEDIAPIPE_REMEDIATION_DRILLS
    .filter(d => d.mediapipe_fixes.includes(flag))
    .sort((a, b) => a.difficulty_level - b.difficulty_level)
    .slice(0, limit);
}

/**
 * Get remediation drills for multiple flags at once.
 * Drills that fix multiple issues rank highest.
 *
 * Usage after coach analysis:
 *   const drills = getDrillsForFlags(["knee_valgus", "hip_drop"]);
 */
export function getDrillsForFlags(flags: MediaPipeFlag[], limit = 5): RemediationDrill[] {
  const drillScores = new Map<string, { drill: RemediationDrill; score: number }>();
  for (const flag of flags) {
    for (const drill of MEDIAPIPE_REMEDIATION_DRILLS) {
      if (drill.mediapipe_fixes.includes(flag)) {
        const existing = drillScores.get(drill.id);
        if (existing) { existing.score += 1; }
        else { drillScores.set(drill.id, { drill, score: 1 }); }
      }
    }
  }
  return Array.from(drillScores.values())
    .sort((a, b) => b.score - a.score || a.drill.difficulty_level - b.drill.difficulty_level)
    .slice(0, limit)
    .map(item => item.drill);
}

/**
 * Map raw MediaPipe measurement names to flag types.
 * Converts technical output to prescription flags.
 */
export const MEDIAPIPE_TO_FLAG: Record<string, MediaPipeFlag> = {
  left_knee_valgus_mm:   "knee_valgus",
  right_knee_valgus_mm:  "knee_valgus",
  hip_drop_mm:           "hip_drop",
  left_knee_flexion:     "landing_stiffness",
  right_knee_flexion:    "landing_stiffness",
  trunk_lean_deg:        "trunk_lean_deficit",
  left_elbow_flexion:    "arm_drive",
  right_elbow_flexion:   "arm_drive",
  left_hip_flexion:      "knee_drive",
  right_hip_flexion:     "knee_drive",
  com_height:            "com_instability",
  fatigue_index:         "fatigue_degradation",
  asymmetry_pct:         "bilateral_asymmetry",
};