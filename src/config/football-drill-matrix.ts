// config/football-drill-matrix.ts
// GrassRoots Sports — Unified Football Drill Matrix v2
//
// Single source of truth: FOOTBALL_POSITION_DRILLS + coaching-staff alignment
//
// POSITIONS & PHASES
// ─────────────────────────────────────────────────────────────────────────────
//  striker     → spark(6-9) | build(10-12) | develop(13-15) | perform(16-18) | elite(18+)
//  midfielder  → spark(6-9) | build(10-12) | develop(13-15) | perform(16-18) | elite(18+)
//  defender    → spark(6-9) | build(10-12) | develop(13-15) | perform(16-18) | elite(18+)
//  goalkeeper  → spark(6-9) | build(10-12) | develop(13-15) | perform(16-18) | elite(18+)
//  winger      → spark(6-9) | build(10-12) | develop(13-15) | perform(16-18) | elite(18+)
//
// TOTAL: 5 positions × 5 phases × 5 drills = 125 drills
//
// ID FORMAT: {source}_{position}_{phase}_{seq}
//   eng_ = England Football Learning   cat_ = Catalan Academy
//   crc_ = Costa Rica U14 Tour         grs_ = GRS original
//   so_  = Shot-stopping / GK          eca_ = ECA Youth Academy
//
// COACH ROLE OWNERSHIP
//   attack_coach    → striker (all phases)
//   winger_coach    → winger (all phases)
//   midfield_coach  → midfielder (all phases)
//   defence_coach   → defender (all phases)
//   gk_coach        → goalkeeper (all phases)

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DrillPhase =
  | "striker_spark"    | "striker_build"    | "striker_develop"
  | "striker_perform"  | "striker_elite"
  | "midfielder_spark" | "midfielder_build"  | "midfielder_develop"
  | "midfielder_perform" | "midfielder_elite"
  | "defender_spark"   | "defender_build"   | "defender_develop"
  | "defender_perform" | "defender_elite"
  | "goalkeeper_spark" | "goalkeeper_build" | "goalkeeper_develop"
  | "goalkeeper_perform" | "goalkeeper_elite"
  | "winger_spark"     | "winger_build"     | "winger_develop"
  | "winger_perform"   | "winger_elite"
  | "fitness_all" | "analytics_all" | "all";

export type AgeGroup = "6-9" | "10-12" | "13-15" | "16-18" | "18+" | "all";

export type SessionSource =
  | "england_attacking_skills"   | "england_passing_to_attack"
  | "england_passing_to_score"   | "england_receiving_finishing"
  | "england_press_cover"        | "costa_rica_u14_session1"
  | "costa_rica_u14_session2"    | "catalan_7v7"
  | "eca_youth_academy"          | "grs_striker_pathway"
  | "grs_nutrition"              | "zim_grassroots";

export type PositionKey = "striker" | "midfielder" | "defender" | "goalkeeper" | "winger";

export interface Drill {
  id: string;
  name: string;
  duration: string;
  durationMinutes: number;
  description: string;
  coachRoleId: string;
  phase: DrillPhase;
  ageGroup: AgeGroup;
  source: SessionSource;
  focusCategories: string[];
  coachingPoints: string[];
  milestoneContribution?: string;
  requiresEquipment?: string[];
  playerCount?: string;
}

export interface PhaseConfig {
  phase: DrillPhase;
  label: string;
  ageGroup: AgeGroup;
  sessionDurationMinutes: number;
  sessionsPerWeek: number;
  themeWeeks: string[];
  drills: Drill[];
}

export interface PositionConfig {
  key: PositionKey;
  title: string;
  focus: string;
  coachRoleId: string;
  color: string;
  icon: string;
  phases: PhaseConfig[];
  milestones: Partial<Record<DrillPhase, string[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — builds empty milestone record for all 25 position-phases
// ─────────────────────────────────────────────────────────────────────────────
function emptyMilestones(): Partial<Record<DrillPhase, string[]>> {
  return {};
}


// ─────────────────────────────────────────────────────────────────────────────
// STRIKER — attack_coach — 5 phases × 5 drills
// ─────────────────────────────────────────────────────────────────────────────
const STRIKER_PHASES: PhaseConfig[] = [
  {
    phase: "striker_spark", label: "Spark — Ages 6–9", ageGroup: "6-9",
    sessionDurationMinutes: 45, sessionsPerWeek: 3,
    themeWeeks: ["First touches & scoring", "Passing & turning"],
    drills: [
      { id:"eng_st_sp_01", name:"Ball Tag Game", duration:"15 mins", durationMinutes:15,
        coachRoleId:"attack_coach", phase:"striker_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["ball_familiarity","agility","spatial_awareness"],
        description:"One player carries a ball and tries to tag others by touching them with it. Tagged players freeze until a teammate high-fives them to free them. Switch the tagger every 2 minutes.",
        coachingPoints:["Keep the ball close — big touches make you easy to catch","Look up to see where taggers are before moving","Encourage laughter — fun is the entire objective at this age"],
        milestoneContribution:"Ball familiarity and confidence in movement", requiresEquipment:["1 ball per tagger","cones for boundary"], playerCount:"6–16" },
      { id:"eng_st_sp_02", name:"Anticlockwise Diamond Flow", duration:"12 mins", durationMinutes:12,
        coachRoleId:"attack_coach", phase:"striker_spark", ageGroup:"6-9", source:"england_receiving_finishing",
        focusCategories:["first_touch","passing_pattern","body_shape"],
        description:"4 players on a small diamond. Pass anticlockwise — receive on the back foot outside the cone, pass on. After 10 reps, reverse direction. Two players rotate to the centre to receive and turn each round.",
        coachingPoints:["Receive on the foot furthest from the passer — that is the back foot","Face your passing direction BEFORE the ball arrives","Keep passes on the ground"],
        milestoneContribution:"Foundation of back-foot receiving", requiresEquipment:["4 cones","1–2 balls"], playerCount:"4" },
      { id:"eng_st_sp_03", name:"Three-Goal Endline Finale", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_spark", ageGroup:"6-9", source:"england_passing_to_score",
        focusCategories:["finishing_instinct","decision_making","creativity"],
        description:"Small pitch with 1 large central goal and 2 corner mini-goals at each end. Regular goal = 1 point. First-time finish = 2 points. Play 3v3 or 4v4. Coach only cheers.",
        coachingPoints:["Shoot when you get the chance — do not overthink it","Look for the mini-goals when the big goal is blocked","Celebrate every goal — scoring should feel special"],
        milestoneContribution:"Scoring instinct and goal-getting confidence", requiresEquipment:["1 full goal","4 mini-goals","boundary cones"], playerCount:"6–8" },
      { id:"eng_st_sp_04", name:"2v1 Overload to Goal", duration:"15 mins", durationMinutes:15,
        coachRoleId:"attack_coach", phase:"striker_spark", ageGroup:"6-9", source:"england_passing_to_score",
        focusCategories:["combination_play","finishing","two_player_moves"],
        description:"2 attackers vs 1 defender with a mini-goal at each end of a 20×15m area. Attackers combine to beat the defender and score. Defender scores at the other end if they win the ball. Rotate every 3 turns.",
        coachingPoints:["Pass to your teammate when the defender comes to you","Run past your teammate after passing — keep moving","Shoot low — aim for the corners"],
        milestoneContribution:"First introduction to combination play", requiresEquipment:["2 mini-goals","cones"], playerCount:"3" },
      { id:"grs_st_sp_05", name:"Mini Shooting Circuit", duration:"10 mins", durationMinutes:10,
        coachRoleId:"attack_coach", phase:"striker_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["finishing_mechanics","weaker_foot","confidence"],
        description:"3 shots each from 8m, 10m, and while moving. Count goals. Target: beat your own score each time. Every third shot must be the weaker foot.",
        coachingPoints:["Pick your spot before you shoot — aim for a corner","Head up to see the keeper before striking","Missing is fine — the goal is to shoot, not to score every time"],
        milestoneContribution:"Scoring instinct and weaker-foot introduction", requiresEquipment:["1 goal","6+ balls"], playerCount:"individual or pairs" },
    ],
  },
  {
    phase: "striker_build", label: "Build — Ages 10–12", ageGroup: "10-12",
    sessionDurationMinutes: 60, sessionsPerWeek: 3,
    themeWeeks: ["BOTS scanning & receiving", "Creating & exploiting space"],
    drills: [
      { id:"eng_st_bu_01", name:"Lions' Den Central Turning", duration:"15 mins", durationMinutes:15,
        coachRoleId:"attack_coach", phase:"striker_build", ageGroup:"10-12", source:"england_passing_to_attack",
        focusCategories:["receiving_under_pressure","half_turn","body_shape","scanning"],
        description:"25×25m outer grid with an embedded 8×8m inner den. Perimeter players feed the central attacker inside the den. Attacker controls under contact from a chasing defender, pivots on the half-turn, and plays a pass out to the opposite perimeter side.",
        coachingPoints:["Scan (BOTS) before entering the den","Receive with the foot furthest from the defender — shield with your body","First touch must be soft and directional","Play forward immediately — do not hold the ball in the den"],
        milestoneContribution:"Core receiving-under-pressure competency", requiresEquipment:["tall cones for inner box","bibs"], playerCount:"8–12" },
      { id:"eng_st_bu_02", name:"Around the Clock Passing Ring", duration:"12 mins", durationMinutes:12,
        coachRoleId:"attack_coach", phase:"striker_build", ageGroup:"10-12", source:"england_passing_to_attack",
        focusCategories:["passing_patterns","scanning","decision_making","possession"],
        description:"Players around a 20-yard diameter circle. Rapid 1-touch and 2-touch passing clockwise, anti-clockwise, and across. Two defenders inside try to intercept. Passer who gives ball away swaps into the centre.",
        coachingPoints:["Pass to the receiver's back foot","Adjust your support angle as the ball moves","1-touch is the target — two acceptable, three is an error"],
        milestoneContribution:"Technical passing speed and scanning habits", requiresEquipment:["boundary cones"], playerCount:"8–10 + 2 defenders" },
      { id:"eng_st_bu_03", name:"Connect Four Corner Squares", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_build", ageGroup:"10-12", source:"england_passing_to_score",
        focusCategories:["movement_off_ball","timing_of_runs","penetrative_passing"],
        description:"35×20m area with a shaded square in each corner. Attackers score by passing to a teammate inside a corner square. Must score in a different corner each time. Defenders win ball and attack the squares instead.",
        coachingPoints:["Move to create the angle before the pass — the square is useless if you wait in it","Make the defender think you are going one way before cutting to the opposite corner","The passer must delay until the receiver is inside the square"],
        milestoneContribution:"Off-ball movement timing and run coordination", requiresEquipment:["4 corner squares cones","boundary cones"], playerCount:"6–10" },
      { id:"eng_st_bu_04", name:"Tri-Third Elimination End Zones", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_build", ageGroup:"10-12", source:"england_passing_to_attack",
        focusCategories:["run_timing","line_breaking_passes","offside_awareness","forward_movement"],
        description:"40×25m pitch in 3 horizontal zones. Teams build from their defensive third and play a firm pass through the midfield layer into the far end zone. Attackers enter ONLY after the pass is made. Defenders cannot enter the end zone.",
        coachingPoints:["Do not enter the end zone before the ball is played — that is offside in a real match","Time your run so you reach the end zone as the ball arrives","The pass must be firm — a slow pass lets the defender slide across"],
        milestoneContribution:"Run timing off the penetrative pass", requiresEquipment:["zone line cones","end zone cones","2 goals"], playerCount:"8–12" },
      { id:"cat_st_bu_05", name:"Barcelona 7v7 Striker Role", duration:"35 mins", durationMinutes:35,
        coachRoleId:"attack_coach", phase:"striker_build", ageGroup:"10-12", source:"catalan_7v7",
        focusCategories:["positional_awareness","movement_choices","link_play","runs_in_behind"],
        description:"7v7 in the Catalan 3-2-1 formation. Striker plays the lone forward role. Objective: alternate between dropping short to link play and making runs in behind. Coach asks after every possession: 'Why did you move there?' Rotate positions every 10 minutes.",
        coachingPoints:["Drop short when the defensive midfield line is compact","Run in behind when defenders push up — exploit the space they leave","Communicate with your midfielders — call your run early"],
        milestoneContribution:"Positional intelligence — the drop-short vs run-behind decision", requiresEquipment:["2 goals","bibs"], playerCount:"14" },
    ],
  },
  {
    phase: "striker_develop", label: "Develop — Ages 13–15", ageGroup: "13-15",
    sessionDurationMinutes: 75, sessionsPerWeek: 4,
    themeWeeks: ["Receiving under pressure", "Width, crossing & blind turns"],
    drills: [
      { id:"eng_st_dv_01", name:"High-Tempo Combination Turn & Move", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_develop", ageGroup:"13-15", source:"costa_rica_u14_session2",
        focusCategories:["turning_mechanics","cruyff_turn","combination_play","body_shape"],
        description:"25×25m grid with a 4×4m central box. A passes firmly diagonally to B inside the box. B executes an inside hook, outside flick, or Cruyff turn and plays to C. Follow your pass and rotate. Two balls run simultaneously.",
        coachingPoints:["Passes into the central box must be hit with pace — simulate breaking a midfield line","Check your shoulder before entering the box","First touch inside the box must be soft and directional","The turn choice depends on where the pressure comes from — not pre-planned"],
        milestoneContribution:"Turning mechanics under physical pressure", requiresEquipment:["tall cones for central box","2 balls"], playerCount:"8–12" },
      { id:"eng_st_dv_02", name:"Blind Turn & Finish", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_develop", ageGroup:"13-15", source:"england_receiving_finishing",
        focusCategories:["blind_turns","finishing_mechanics","first_touch_quality","back_to_goal"],
        description:"3 mannequins 20m from goal as a defensive backline. Two passing lines at 30m. Attacker starts back to goal against the central mannequin. Receive a firm vertical pass, use a blind turn to escape into the penalty box, shoot in 2 touches maximum.",
        coachingPoints:["Check away from the mannequin before receiving — simulate creating separation","First touch must take the ball directly into open space","Head up to check the keeper's position before striking","If the turn is blocked, protect and play back — do not force it"],
        milestoneContribution:"Blind turn under passive pressure — core Develop milestone", requiresEquipment:["3 mannequins","1 full goal","goalkeeper"], playerCount:"pairs in two lines" },
      { id:"crc_st_dv_03", name:"3v1 to 3v2 Rondo: Overload & Penetrate", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_develop", ageGroup:"13-15", source:"costa_rica_u14_session2",
        focusCategories:["possession_under_pressure","overload_exploitation","transition_speed"],
        description:"30×15m grid split into two halves. 3 attackers keep possession vs 1 defender. After 4 passes, penetrate into the far half through a mini-gate or by dribbling. Resting defender activates — creating a live 3v2. Defenders score by passing back across the centre line.",
        coachingPoints:["Exploit the 3v1 quickly — 4 passes is the maximum, not the target","Split wide immediately on crossing the line to establish maximum width","The striker must finish within 6 seconds of entering the attacking half"],
        milestoneContribution:"Transition speed and overload exploitation", requiresEquipment:["cones for grid and mini-gates","bibs"], playerCount:"5" },
      { id:"eng_st_dv_04", name:"Phase of Play: Creative Central Combinations 5v4", duration:"30 mins", durationMinutes:30,
        coachRoleId:"attack_coach", phase:"striker_develop", ageGroup:"13-15", source:"costa_rica_u14_session2",
        focusCategories:["zone_14_combinations","blind_side_runs","striker_partnership","disguised_passes"],
        description:"Two-thirds pitch restricted to a wide central corridor. 5 attackers in a 3-2 shape face 4 defenders + goalkeeper. Midfield trio circulates laterally. One striker drops into the pocket; the other makes an explosive blind-side run behind the center-backs.",
        coachingPoints:["Strikers must coordinate on different vertical lines — one drops short, one runs deep, never both the same","Midfield uses disguised passes: look wide, play central","Receiving striker adopts a half-turned body shape to spin-and-strike or lay off in one touch","If the first run is tracked, reset — the second run off the defender's back foot scores"],
        milestoneContribution:"Zone 14 entry and two-striker partnership", requiresEquipment:["corridor cones","1 goal","goalkeeper","bibs"], playerCount:"9 + GK" },
      { id:"eng_st_dv_05", name:"11v11 Zone 14 Scoring Incentives", duration:"75 mins", durationMinutes:75,
        coachRoleId:"attack_coach", phase:"striker_develop", ageGroup:"13-15", source:"costa_rica_u14_session2",
        focusCategories:["zone_14","combination_play","match_application","forward_passes"],
        description:"Full 11v11 match. Condition: any goal = 1 point. If a team plays a pass into an attacker inside Zone 14 (20×15m directly outside the box) and that attacker combines to score within 3 touches, the goal = 3 points.",
        coachingPoints:["Midfielders: look forward early — prioritise vertical passes into Zone 14","Strikers in Zone 14: maximum 3 touches — technical composure under pressure","Defenders: compress the vertical gap between midfield and backline to deny Zone 14 space"],
        milestoneContribution:"Match application of all Develop phase skills", requiresEquipment:["full pitch","2 goals","Zone 14 cones"], playerCount:"22" },
    ],
  },
  {
    phase: "striker_perform", label: "Perform — Ages 16–18", ageGroup: "16-18",
    sessionDurationMinutes: 85, sessionsPerWeek: 4,
    themeWeeks: ["Phase of play & pressing", "Tactical disguise & attacking units"],
    drills: [
      { id:"eng_st_pf_01", name:"Table Football Tri-Thirds Match", duration:"25 mins", durationMinutes:25,
        coachRoleId:"attack_coach", phase:"striker_perform", ageGroup:"16-18", source:"england_passing_to_score",
        focusCategories:["positional_discipline","first_touch_quality","finishing_under_pressure","link_play"],
        description:"Full pitch in thirds. Each player locked in their assigned third. Build from GK through midfield to the striker locked in the final third. Striker only receives service that makes it through the midfield layer. Finish in 2 touches maximum.",
        coachingPoints:["Create space by dragging your marker before checking back to receive","First touch sets the shot or lay-off — not a settling touch","If the service is not good enough, play back and reset","Communicate: call 'feet' or 'turn' to guide the pass weight from the midfielder"],
        milestoneContribution:"Finishing under positional restriction at match intensity", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"11–16" },
      { id:"eng_st_pf_02", name:"Asymmetric Pivot Entry 3v2", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_perform", ageGroup:"16-18", source:"england_receiving_finishing",
        focusCategories:["pivot_play","combination_play","transition_speed","finishing"],
        description:"40×30m area, goal at one end. 2 attackers on the far end line, 1 in the middle. Pass to the middle player triggers the game. Defenders activate — creating live 3v2. Middle attacker pivots and combines with the two runners. Score within 8 seconds.",
        coachingPoints:["Pivot's first touch must always face forward — sideways touches lose the 3v2 advantage","Runners: delay your box entry, then explode on the pivot's touch","If the pivot is under pressure, play back and reset — a lost ball kills the overload"],
        milestoneContribution:"Pivot play and exploitation of attacking overloads", requiresEquipment:["goal","bibs","cones"], playerCount:"5 + GK" },
      { id:"eng_st_pf_03", name:"Double Trouble Combination", duration:"15 mins", durationMinutes:15,
        coachRoleId:"attack_coach", phase:"striker_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["two_player_combinations","attacking_partnerships","finishing"],
        description:"35×25m pitch. 2 attackers vs 1 defender + GK. No individual dribbling runs — every attack must involve both players touching the ball. Use wall pass, overlap, or dummy run to open space and score.",
        coachingPoints:["Use the wall pass to play around the defender rather than dribbling past","The dummy run is as valuable as the actual run — create space for your partner","The final pass into the box must be perfect weight — not too hard for the finish"],
        milestoneContribution:"Two-player attacking combination at match speed", requiresEquipment:["1 goal","2 mini-goals","bibs"], playerCount:"4 + GK" },
      { id:"eng_st_pf_04", name:"Press for Success: Striker as First Defender", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_perform", ageGroup:"16-18", source:"england_press_cover",
        focusCategories:["pressing_triggers","counter_attack","defensive_work_rate","transition"],
        description:"Full pitch in thirds. Condition: winning the ball in the attacking third and scoring = 3 goals. Middle third = 2 goals. Own defensive third = 1 goal. Striker leads the press from the front. Coach tracks and announces the point value of every goal.",
        coachingPoints:["Striker's press dictates the angle the defender passes — force them backwards or sideways","Pressing trigger: defender faces own goal, takes a heavy touch, or receives a slow pass","After pressing, recover your central position immediately — do not ball-watch"],
        milestoneContribution:"Pressing intelligence and defensive work rate", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"14–16" },
      { id:"eng_st_pf_05", name:"11v11 3-Touch Box Rule + Crossing Bonus", duration:"85 mins", durationMinutes:85,
        coachRoleId:"attack_coach", phase:"striker_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["box_positioning","crossing_runs","first_touch_finish","match_application"],
        description:"Full 11v11 match. Two conditions: any goal inside the box on 1 or 2 touches = 3 points. Any goal from a cross delivered by an overlapping fullback = 3 points. All other goals = 1 point.",
        coachingPoints:["Position inside the box before the cross is delivered — do not track the ball to the wing","Attack near post with pace, or delay and attack back post on a late cross","Stay on your toes — anticipate rebounds, deflections, and loose balls"],
        milestoneContribution:"Full match application of all Perform phase skills", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"22" },
    ],
  },
  {
    phase: "striker_elite", label: "Elite — Ages 18+", ageGroup: "18+",
    sessionDurationMinutes: 90, sessionsPerWeek: 5,
    themeWeeks: ["Professional daily structure"],
    drills: [
      { id:"crc_st_el_01", name:"High-Tempo Central Combinations (Match Speed)", duration:"20 mins", durationMinutes:20,
        coachRoleId:"attack_coach", phase:"striker_elite", ageGroup:"18+", source:"costa_rica_u14_session2",
        focusCategories:["match_speed_execution","technical_precision","combination_play"],
        description:"Costa Rica U14 25×25m central box drill at absolute match speed. Zero tolerance for hesitation. Any miscontrol = press-up. Two balls running simultaneously. Coach does not pause — errors are self-corrected.",
        coachingPoints:["Every touch and pass is executed as if it is the 89th minute","Self-accountability: own your errors without waiting for the coach","Passes must simulate breaking a midfield line — soft passes are unacceptable"],
        milestoneContribution:"Professional technical standard baseline", requiresEquipment:["tall cones for central box","2 balls"], playerCount:"8–12" },
      { id:"crc_st_el_02", name:"Phase of Play 5v4 at Match Intensity", duration:"35 mins", durationMinutes:35,
        coachRoleId:"attack_coach", phase:"striker_elite", ageGroup:"18+", source:"costa_rica_u14_session2",
        focusCategories:["match_speed_execution","striker_partnership","zone_14","phase_of_play"],
        description:"Two-thirds pitch. 5v4 + GK. Run as 45-second bursts with 90 seconds rest. Coach times how quickly the striker makes the correct run. Target: under 4 seconds from receipt of a line-breaking pass to a shot on goal.",
        coachingPoints:["The movement must happen BEFORE the ball is played — reading, not reacting","Target under 4 seconds from line-breaking pass to shot — if you need more, the positioning was wrong","Self-coach after every burst: was the run correct?"],
        milestoneContribution:"Pro-level reaction speed and movement intelligence", requiresEquipment:["corridor cones","1 goal","goalkeeper","bibs","stopwatch"], playerCount:"9 + GK" },
      { id:"eng_st_el_03", name:"The Great Escape Funnel", duration:"15 mins", durationMinutes:15,
        coachRoleId:"attack_coach", phase:"striker_elite", ageGroup:"18+", source:"grs_striker_pathway",
        focusCategories:["dribbling_under_pressure","body_deception","finishing","1v1_skills"],
        description:"Cone funnel (wide entry, narrow exit) at the edge of the penalty area. Feeder passes to the striker's feet inside the funnel. Striker must use feints and direction changes to escape through the narrow exit against two pressing defenders before finishing on goal.",
        coachingPoints:["Use a shoulder drop or Cruyff turn to unbalance the first defender before the funnel exit","Disguise your intentions — do not telegraph your direction with your hips","Finish with conviction — the shot after escaping must be placed, not blasted"],
        milestoneContribution:"Dribbling and deception under maximum defensive pressure", requiresEquipment:["funnel cones","goal","goalkeeper"], playerCount:"individual + 2 defenders" },
      { id:"eng_st_el_04", name:"Numbered Perimeter Outlets 4v4+4", duration:"25 mins", durationMinutes:25,
        coachRoleId:"attack_coach", phase:"striker_elite", ageGroup:"18+", source:"england_receiving_finishing",
        focusCategories:["unpredictability","overload_exploitation","quick_decisions","finishing"],
        description:"4v4 in a 20×40m area plus 4 numbered outside players. Coach calls a number — that player passes in and joins the attack, creating a temporary 5v4. Striker reads the overload and exploits it within 6 seconds. Coach rotates calls unpredictably.",
        coachingPoints:["Read the overload the instant it appears — react before the defender adjusts","Striker's movement must create space for the incoming player, not compete with them","If the overload is not exploited in 6 seconds, the moment has passed — reset"],
        milestoneContribution:"Unpredictable match-scenario decision-making", requiresEquipment:["boundary cones","bibs","numbered bibs"], playerCount:"12" },
      { id:"eng_st_el_05", name:"11v11 All Conditions Active", duration:"90 mins", durationMinutes:90,
        coachRoleId:"attack_coach", phase:"striker_elite", ageGroup:"18+", source:"grs_striker_pathway",
        focusCategories:["full_match_application","all_principles","self_coaching","professional_standard"],
        description:"Full 11v11 match. All conditions simultaneously: Zone 14 goal = 3 points. Winning ball in attacking third and scoring = 3 points. Cross from overlapping fullback goal = 3 points. All other goals = 1 point.",
        coachingPoints:["Post-match: write down one chance you should have scored and one movement you executed well","Review both before next session — at this level, you are your own coach","Fitness output in the final 15 minutes must match the first 15"],
        milestoneContribution:"Full professional standard match application", requiresEquipment:["full pitch","2 goals","Zone 14 cones"], playerCount:"22" },
    ],
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// DEFENDER — defence_coach — 5 phases × 5 drills = 25 drills
//
// Sources:
//   crc_def = Costa Rica U14 Tour Session 10 (Medium Block & Compactness)
//   fra_def = France U17 Training Session (High Block & Collective Aggression)
//   eng_def = England Football Learning Press & Cover to Defend
//   sun_def = Mamelodi Sundowns U15 Academy (Pressing & Transition Systems)
//   wnt_def = Costa Rica WNT Training Camp Day 2 (Pressing as a Unit)
//   grs_def = GRS original defender drills
// ─────────────────────────────────────────────────────────────────────────────
const DEFENDER_PHASES: PhaseConfig[] = [

  // ── SPARK ─ Ages 6–9 ─────────────────────────────────────────────────────
  {
    phase: "defender_spark", label: "Spark — Ages 6–9", ageGroup: "6-9",
    sessionDurationMinutes: 45, sessionsPerWeek: 3,
    themeWeeks: ["Body shape & chasing", "Basic 1v1 & recovery"],
    drills: [
      {
        id: "grs_df_sp_01",
        name: "Shadow Chasing",
        duration: "10 mins", durationMinutes: 10,
        coachRoleId: "defence_coach", phase: "defender_spark", ageGroup: "6-9",
        source: "england_press_cover",
        focusCategories: ["agility","defensive_movement","body_shape"],
        description: "One player leads, one player shadows them from 1 metre behind, mirroring every movement. Switch roles every 90 seconds. Progress: the leader tries to lose the shadower with quick direction changes. The shadower must stay within arm's length without fouling.",
        coachingPoints: [
          "Stay low with knees slightly bent — upright defenders are easy to beat",
          "Watch the ball (or leader's hips) — not their feet, not their eyes",
          "Small quick steps when close, big recovery strides when behind",
        ],
        milestoneContribution: "Defensive body shape and mirroring movement",
        requiresEquipment: ["flat cones for boundary"], playerCount: "pairs",
      },
      {
        id: "grs_df_sp_02",
        name: "Gate Tag",
        duration: "12 mins", durationMinutes: 12,
        coachRoleId: "defence_coach", phase: "defender_spark", ageGroup: "6-9",
        source: "england_press_cover",
        focusCategories: ["agility","closing_space","defensive_recovery"],
        description: "Set up 8–10 small two-cone gates scattered around a 20×20m area. Attackers try to dribble through as many gates as possible in 60 seconds. Defenders try to intercept balls or block gates with their body. Rotate roles. Count gates scored vs gates defended.",
        coachingPoints: [
          "Sprint to the nearest threat first — do not stand in the middle watching",
          "Approach the ball carrier at an angle to cut off the nearest gate",
          "Recover immediately after being beaten — never stop defending",
        ],
        milestoneContribution: "Closing space and reactive defending instincts",
        requiresEquipment: ["10 mini cone gates","balls"], playerCount: "6–12",
      },
      {
        id: "grs_df_sp_03",
        name: "1v1 Shepherding Gates",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_spark", ageGroup: "6-9",
        source: "england_press_cover",
        focusCategories: ["1v1_defending","shepherding","side_on_stance"],
        description: "2 small gates placed 5m apart. Attacker tries to dribble through either gate. Defender stands between the gates and tries to shepherd the attacker away from the gate they are heading toward. No tackling yet — only positioning and body shape. Rotate every 3 turns.",
        coachingPoints: [
          "Stand between the attacker and the gate they want — cut off the easy option",
          "Side-on stance: one shoulder toward the attacker, one toward the open space",
          "Walk backwards with the attacker — do not lunge forward",
        ],
        milestoneContribution: "Introductory 1v1 body shape and shepherding",
        requiresEquipment: ["4 cones for 2 gates"], playerCount: "pairs",
      },
      {
        id: "grs_df_sp_04",
        name: "Protect the Castle",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_spark", ageGroup: "6-9",
        source: "england_press_cover",
        focusCategories: ["goal_protection","positioning","team_defending"],
        description: "A 2m square of cones is the 'castle'. One defender guards it. 3–4 attackers pass the ball around the outside and try to kick the ball into the castle to knock it over. Defender must move to block the line of fire. Swap defender every 2 minutes.",
        coachingPoints: [
          "Always position yourself between the ball and the castle",
          "Move sideways quickly — do not cross your feet",
          "When blocked, the attacker will try to go around — read where they are moving the ball",
        ],
        milestoneContribution: "Goal protection instinct and reading movement",
        requiresEquipment: ["4 cones for castle","balls"], playerCount: "4–5",
      },
      {
        id: "grs_df_sp_05",
        name: "3v3 Mini-Goal Defending Game",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_spark", ageGroup: "6-9",
        source: "england_press_cover",
        focusCategories: ["defensive_shape","team_coordination","recovery_runs"],
        description: "3v3 on a small pitch with mini-goals at each end. When a team loses the ball, all three players must sprint back behind the ball before the opposition can shoot. A goal only counts if the defending team does not have at least one player goal-side of the ball. Coach counts 'recovery runs' as a positive stat.",
        coachingPoints: [
          "First rule of defending: get back behind the ball immediately — do not admire your mistake",
          "Spread out across the pitch when defending — do not all chase the ball",
          "The nearest player presses, the other two cover behind",
        ],
        milestoneContribution: "Recovery running discipline and basic defensive shape",
        requiresEquipment: ["2 mini-goals","boundary cones"], playerCount: "6",
      },
    ],
  },

  // ── BUILD ─ Ages 10–12 ────────────────────────────────────────────────────
  {
    phase: "defender_build", label: "Build — Ages 10–12", ageGroup: "10-12",
    sessionDurationMinutes: 60, sessionsPerWeek: 3,
    themeWeeks: ["Pressing angles & approach", "Cover shadows & block shifting"],
    drills: [
      {
        id: "eng_df_bu_01",
        name: "Angled Pressing & Directional Dictation",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_build", ageGroup: "10-12",
        source: "england_press_cover",
        focusCategories: ["pressing_angles","directional_dictation","deceleration"],
        description: "Defender starts 5m away from the ball carrier in a 20×15m area. On 'go', defender closes the ball carrier using an angled approach — never straight on. Get within arm's-length before decelerating. Use body angle to force the attacker toward the wide sideline or weaker side. Rotate every 3 turns.",
        coachingPoints: [
          "Approach at an angle — straight on gives the attacker two directions, angled gives them one",
          "Decelerate as you get close — do not sprint past the ball carrier",
          "Stay on your feet: do not dive in until the attacker exposes the ball on a heavy touch",
        ],
        milestoneContribution: "Pressing angle fundamentals — the single most important defensive technique",
        requiresEquipment: ["boundary cones"], playerCount: "pairs",
      },
      {
        id: "eng_df_bu_02",
        name: "Cover and Recover Horizontal Channels",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_build", ageGroup: "10-12",
        source: "england_press_cover",
        focusCategories: ["cover_and_recover","defensive_partnership","support_angles"],
        description: "Pitch split horizontally into thirds. Two defenders work in tandem against 2 attackers. Defender 1 presses the ball carrier. Defender 2 drops to the optimal supporting distance and angle. If Defender 1 is beaten, Defender 2 steps out as the new presser immediately while Defender 1 recovers underneath.",
        coachingPoints: [
          "The covering defender must see both the ball and any runner at all times — position at a 45-degree angle",
          "If the presser is beaten, STEP OUT immediately — do not wait for verbal instruction",
          "The recovering presser drops beneath the covering line — never alongside it",
        ],
        milestoneContribution: "Cover-recover structure — core defensive unit skill",
        requiresEquipment: ["zone line cones"], playerCount: "2v2",
      },
      {
        id: "eng_df_bu_03",
        name: "Coordinated Press & Cover Warm-Up",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_build", ageGroup: "10-12",
        source: "england_press_cover",
        focusCategories: ["pressing_mechanics","cover_shadows","45_degree_angle"],
        description: "20×20m square with 2 tall cones 3m apart in the centre (the passing gate). Ball is passed around the perimeter of the square. As the ball travels from Corner A to Corner B, the nearest defender sprints out to press the ball carrier while their partner drops back at 45 degrees to cover the central gate. Once the pass moves to the next corner, the pair swap roles dynamically.",
        coachingPoints: [
          "Sprint at maximum speed to close down, then shorten your steps to brake safely",
          "The pressing player must adopt a low, side-on stance to force a predictable pass direction",
          "The covering player positions at a 45-degree angle behind the presser to intercept split passes",
        ],
        milestoneContribution: "Two-defender press-and-cover coordination",
        requiresEquipment: ["20×20m boundary cones","2 tall central cones"], playerCount: "4–6",
      },
      {
        id: "eng_df_bu_04",
        name: "1v1 Pressing Duel Grids",
        duration: "15 mins", durationMinutes: 15,
        coachRoleId: "defence_coach", phase: "defender_build", ageGroup: "10-12",
        source: "england_press_cover",
        focusCategories: ["1v1_containment","timing_the_tackle","foot_positioning"],
        description: "Parallel 15×15m areas. Attacker dribbles directly at the defender standing between two mini-goals. Defender's job: delay, contain, and force the attacker to one side. If the defender wins the ball, they pass to a mini-goal at the other end. If the attacker passes a defender, the roles swap immediately.",
        coachingPoints: [
          "Stay on your feet as long as possible — avoid sliding or diving early",
          "Use your front foot to jab at the ball when the attacker exposes it on a heavy touch",
          "Win the ball cleanly and counter-attack immediately — the transition is as important as the tackle",
        ],
        milestoneContribution: "1v1 containment and safe tackling timing",
        requiresEquipment: ["4 mini-goals","boundary cones"], playerCount: "pairs in parallel",
      },
      {
        id: "eng_df_bu_05",
        name: "Press for Success Small-Sided Game",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_build", ageGroup: "10-12",
        source: "england_press_cover",
        focusCategories: ["collective_pressing","counter_attack_transition","pressing_triggers"],
        description: "Small pitch split into thirds, goal at each end. Scoring system: winning the ball in the attacking third and scoring = 3 goals. Middle third = 2 goals. Own defensive third = 1 goal. This incentive structure forces defenders to recognise pressing triggers and act as a unit.",
        coachingPoints: [
          "Pressing triggers: opponent faces own goal, takes a heavy touch, receives a slow pass",
          "When one defender presses, the others must react immediately — collective, not individual",
          "Win the ball cleanly and drive forward — a slow transition wastes the turnover",
        ],
        milestoneContribution: "Collective pressing intelligence and transition speed",
        requiresEquipment: ["2 goals","boundary cones","bibs"], playerCount: "6–10",
      },
    ],
  },

  // ── DEVELOP ─ Ages 13–15 ──────────────────────────────────────────────────
  {
    phase: "defender_develop", label: "Develop — Ages 13–15", ageGroup: "13-15",
    sessionDurationMinutes: 75, sessionsPerWeek: 4,
    themeWeeks: ["1v1 isolation & block shifting", "Possession transition & zonal defending"],
    drills: [
      {
        id: "sun_df_dv_01",
        name: "Defending in 1v1 Situations (Dual Channel Gates)",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_develop", ageGroup: "13-15",
        source: "england_press_cover",
        focusCategories: ["1v1_defending","shepherding","side_on_stance","delay_and_contain"],
        description: "Two identical 50×25m grids set up in parallel. In the centre of each grid, two 5m-wide gates are placed 10m apart. Attacker dribbles directly toward the defender who stands 5m in front of the gates. Attacker tries to dribble through either gate. Defender delays, shepherds, and forces the attacker away from their preferred gate. Source: Mamelodi Sundowns Academy U15.",
        coachingPoints: [
          "Initiate the press from the centre, then decide where to shepherd based on the attacker's dominant foot",
          "Open, side-on stance — use your body to show the attacker where you want them to go",
          "Increase defensive pressure gradually — do not commit immediately on the first touch",
          "If beaten: recover at an angle behind the attacker, not alongside them",
        ],
        milestoneContribution: "Advanced 1v1 with directional shepherding at match intensity",
        requiresEquipment: ["4 gate cones per grid","boundary cones"], playerCount: "pairs in parallel grids",
      },
      {
        id: "crc_df_dv_02",
        name: "Shifting Shuttles & Block Alignment",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_develop", ageGroup: "13-15",
        source: "costa_rica_u14_session1",
        focusCategories: ["block_shifting","defensive_unit_movement","compact_shape"],
        description: "20×25m grid with three 4m-wide yellow cone gates across the middle line. 6 attackers circulate the ball along the endlines trying to pass through any of the three central gates to the opposite side. A defensive trio shifts as a cohesive unit: nearest defender applies pressure in line with the ball, other two tuck inside to cover the adjacent gates. Source: Costa Rica U14 Session 10.",
        coachingPoints: [
          "Shift as a unit — maintain strict 4–5m distance between each defender",
          "The pressing defender must approach with a low, side-on body shape to block forward passing lanes",
          "Covering defenders stay slightly deeper than the presser, eyes on both ball carrier and receivers behind",
        ],
        milestoneContribution: "Defensive unit shifting — foundational block alignment skill",
        requiresEquipment: ["3 gate cones sets","boundary cones"], playerCount: "3 defenders + 6 attackers",
      },
      {
        id: "sun_df_dv_03",
        name: "4v4 Plus 4 Possession Transition Game",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_develop", ageGroup: "13-15",
        source: "england_press_cover",
        focusCategories: ["pressing_transitions","immediate_defensive_reaction","zonal_shifts"],
        description: "Grid divided into two halves. Two neutral players at the far ends act as target outlets. Blues start in possession 4v4 with the green neutrals. Oranges press to win the ball. Once oranges win possession, they immediately transfer to the neutral player in the opposite half and follow the ball — turning the defence into attack. Blues must instantly become the new pressing unit. Source: Mamelodi Sundowns U15.",
        coachingPoints: [
          "Immediate transition from attacking to defending upon losing possession — no standing and watching",
          "Aggressive pressing angles to cut off the escape pass to the opposite half",
          "Use neutral players to create numerical overloads and maintain possession structure when in possession",
        ],
        milestoneContribution: "Mental and physical defensive transition speed",
        requiresEquipment: ["boundary cones","bibs"], playerCount: "10 + 2 neutrals",
      },
      {
        id: "crc_df_dv_04",
        name: "4v4 Plus 2: Mid-Block Possession Game",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_develop", ageGroup: "13-15",
        source: "costa_rica_u14_session1",
        focusCategories: ["mid_block_structure","compact_defending","wide_trapping"],
        description: "30×20m central grid with two narrow 5m flank corridors along the touchlines. 4 blues keep possession in the central grid supported by 2 neutral wide players in the corridors. Orange defenders drop into a compact medium block to screen central penetration. When oranges win the ball, they must pass to a wide neutral before transitioning. Source: Costa Rica U14 Session 10.",
        coachingPoints: [
          "Prioritise protection of the central corridor — do not chase wide options early",
          "Force play into the flank tracks, then slide the block over to trap the ball carrier against the touchline",
          "The moment possession is secured, transition vertically and immediately — no time wasted",
        ],
        milestoneContribution: "Medium block structure and wide trapping coordination",
        requiresEquipment: ["central grid cones","flank corridor cones","bibs"], playerCount: "8 + 2 neutrals",
      },
      {
        id: "sun_df_dv_05",
        name: "11v11 Zonal Overload & Direct Attack",
        duration: "75 mins", durationMinutes: 75,
        coachRoleId: "defence_coach", phase: "defender_develop", ageGroup: "13-15",
        source: "england_press_cover",
        focusCategories: ["zonal_defending","direct_counter_attack","possession_recycling"],
        description: "70×50m area with a large 50×40m central box divided into 4 equal quadrants. Three scoring gates at each endline. Both teams in 4-4-2. If a team wins possession in the opponent's half, they launch a direct vertical attack to dribble through a gate. If won in their own half, they must recycle through the goalkeeper first. Source: Mamelodi Sundowns U15.",
        coachingPoints: [
          "If an opponent moves into another zone to receive, communicate immediately to ensure they are picked up",
          "If a teammate presses the ball carrier, all covering players step up in unison — never step up alone",
          "When defending, stay compact and within 10m of a teammate to block all central passing channels",
        ],
        milestoneContribution: "Zonal defending and collective step-up discipline in full match context",
        requiresEquipment: ["full pitch area","6 gate poles","bibs"], playerCount: "22 + 2 neutrals",
      },
    ],
  },

  // ── PERFORM ─ Ages 16–18 ──────────────────────────────────────────────────
  {
    phase: "defender_perform", label: "Perform — Ages 16–18", ageGroup: "16-18",
    sessionDurationMinutes: 85, sessionsPerWeek: 4,
    themeWeeks: ["High block & cover shadows", "Phase of play: collective containment"],
    drills: [
      {
        id: "fra_df_pf_01",
        name: "Technical Pressing & Body Shape Warm-Up (Diamond Grids)",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_perform", ageGroup: "16-18",
        source: "england_press_cover",
        focusCategories: ["pressing_mechanics","cover_shadows","curved_approach_run","deceleration"],
        description: "Multiple 15×15m diamond-shaped grids. Ball circulates around the diamond on 1–2 touches. As the ball reaches a wide player, the central player sprints out to close down, adopting a curved recovery run. They stall 1–2m short of the receiver, anchor body shape side-on to force the pass back inside, then reset. Source: France U17 Training Session.",
        coachingPoints: [
          "Sprint speed to close down must be maximum — but deceleration must be controlled to avoid being bypassed",
          "Adopt a low, side-on stance with knees bent, using the lead foot to guide the next pass direction",
          "Check shoulders and maintain spatial awareness of passing lanes hiding behind your cover shadow",
        ],
        milestoneContribution: "Curved approach and cover shadow mechanics at high intensity",
        requiresEquipment: ["diamond grid cones","mannequins at apex points"], playerCount: "groups of 5–6",
      },
      {
        id: "fra_df_pf_02",
        name: "6v4 Rondo: Pressing Trigger & Cover Shadows",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_perform", ageGroup: "16-18",
        source: "england_press_cover",
        focusCategories: ["cover_shadows","pressing_triggers","compact_block","interceptions"],
        description: "25×20m grid split into two halves by a dotted line. 6 attackers keep possession and try to pass across the dividing line to the opposite side. 4 defenders work as a compact block. When a trigger occurs (poor touch, slow lofted ball, backward pass), the nearest defender presses hard while the other 3 slide over to cover all passing lanes. If defenders win the ball, they score by passing into mini-nets on the edge. Source: France U17.",
        coachingPoints: [
          "The first defender forces the attacker's head down — eliminating their vision is the priority, not winning the ball",
          "Supporting defenders read the pressing trigger in unison — jump aggressively to tight-mark the closest options",
          "Use cover shadows effectively: position between the ball and the central pivot player to block that passing lane",
        ],
        milestoneContribution: "Cover shadow discipline and collective pressing trigger execution",
        requiresEquipment: ["grid cones","mini-nets","bibs"], playerCount: "10",
      },
      {
        id: "fra_df_pf_03",
        name: "Phase of Play: Midfield High Block 9v8",
        duration: "30 mins", durationMinutes: 30,
        coachRoleId: "defence_coach", phase: "defender_perform", ageGroup: "16-18",
        source: "england_press_cover",
        focusCategories: ["high_block","engagement_line","trap_and_tackle","backline_push"],
        description: "Two-thirds pitch. Full goal with keeper at baseline defended by a back 4 and 4 midfielders (8 defenders). Pressing team sets up a high 3-4-2 block, pushing their backline to the halfway line. Play starts from the opposing GK. The possession team tries to play through or over the high block. The pressing unit sets a high engagement line, traps the carrier against the touchline, and seeks high turnovers into immediate counter-attacks. Sources: France U17 + England Football Learning.",
        coachingPoints: [
          "Front three must coordinate angling runs to cut the pitch completely in half — force play to one predictable side",
          "The defensive backline must push to the halfway line to eliminate the vertical gap between midfield and defence",
          "Use the touchline as an extra defender — once the ball carrier is trapped wide, commit fully to winning the ball",
        ],
        milestoneContribution: "High block structure and coordinated pressing as a tactical unit",
        requiresEquipment: ["two-thirds pitch","1 full goal","goalkeeper","bibs"], playerCount: "17",
      },
      {
        id: "crc_df_pf_04",
        name: "8v7 Mid-Block Collective Containment",
        duration: "30 mins", durationMinutes: 30,
        coachRoleId: "defence_coach", phase: "defender_perform", ageGroup: "16-18",
        source: "costa_rica_u14_session1",
        focusCategories: ["mid_block","line_of_restraint","vertical_compactness","communication"],
        description: "Two-thirds pitch. Full goal at baseline defended by a back 4 and 3 midfielders (7 defenders plus GK). 8 attackers in a 3-3-2 shape build from halfway line. The defending unit drops off to a 30m line of restraint and remains compact. Only when a bad touch or slow lateral pass occurs does the block step up together to compress space. Source: Costa Rica U14 Session 10.",
        coachingPoints: [
          "Midfield trio protects the centre circle — move laterally together to prevent line-breaking passes into forwards' feet",
          "Backline coordinates with the midfield line — step up or drop off in unison, maximum 10–12m vertical gap between lines",
          "Midfielders must pass on dropping runners to center-backs verbally — do not break the horizontal defensive chain",
        ],
        milestoneContribution: "Disciplined mid-block with correct line of restraint and compact vertical spacing",
        requiresEquipment: ["two-thirds pitch","1 full goal","goalkeeper","bibs"], playerCount: "15",
      },
      {
        id: "sun_df_pf_05",
        name: "11v11 Pressing the Goal Kick",
        duration: "85 mins", durationMinutes: 85,
        coachRoleId: "defence_coach", phase: "defender_perform", ageGroup: "16-18",
        source: "england_press_cover",
        focusCategories: ["high_press_from_goal_kick","backline_hold","sweeper_keeper","transition_after_win"],
        description: "Full 11v11. Ball starts with the building team's goalkeeper. The pressing team holds their backline strictly on the halfway line with forwards pushed into the opposition's defensive third. The building team must play out from the back under pressure. When the pressing team wins the ball in the attacking third, they score directly — no recycling. Source: Mamelodi Sundowns U15.",
        coachingPoints: [
          "Build play in a defined structure — do not panic under the goal kick press, use the goalkeeper and center-backs calmly",
          "The pressing team cuts off short passing lanes with coordinated angled runs — never press straight",
          "When defending, stay within 10m of a teammate at all times to block all central passing channels",
        ],
        milestoneContribution: "Full match application of high press from goal kicks at match intensity",
        requiresEquipment: ["full pitch","2 goals","bibs"], playerCount: "22",
      },
    ],
  },

  // ── ELITE ─ Ages 18+ ──────────────────────────────────────────────────────
  {
    phase: "defender_elite", label: "Elite — Ages 18+", ageGroup: "18+",
    sessionDurationMinutes: 90, sessionsPerWeek: 5,
    themeWeeks: ["Pro defensive structure: all systems live"],
    drills: [
      {
        id: "fra_df_el_01",
        name: "High-Intensity Shadow Shifting & Pressing Trigger (Spain U23 Method)",
        duration: "20 mins", durationMinutes: 20,
        coachRoleId: "defence_coach", phase: "defender_elite", ageGroup: "18+",
        source: "england_press_cover",
        focusCategories: ["defensive_synchronisation","cover_shadows","curved_approach","pressing_trigger"],
        description: "25×25m square with a 5×5m target box in the exact centre. 4 perimeter attackers pass rapidly around the outside trying to thread a pass through the central box. 4 central defenders shift dynamically as a block: nearest defender presses with a curved approach, two slide to support the flanks, the deepest drops to protect the central box. Roles switch every 4 minutes at full intensity. Source: Spain U23 Training Camp methodology.",
        coachingPoints: [
          "Shift in perfect synchronisation — compact horizontal lines that move as one unit, not four individuals",
          "Pressing player must apply a curved approach run to force the pass wide — not straight which gives two options",
          "Remaining 3 defenders tuck inside instantly, using cover shadows to seal off the central target box",
        ],
        milestoneContribution: "Professional defensive synchronisation — the foundation of elite defensive units",
        requiresEquipment: ["25×25m boundary cones","5×5m central box flat markers"], playerCount: "8",
      },
      {
        id: "fra_df_el_02",
        name: "11v11 Coordinated High Press (Double Points on Turnover)",
        duration: "45 mins", durationMinutes: 45,
        coachRoleId: "defence_coach", phase: "defender_elite", ageGroup: "18+",
        source: "england_press_cover",
        focusCategories: ["coordinated_high_press","sweeper_keeper","backline_line_management","collective_aggression"],
        description: "Full 11v11. Scoring condition: any goal scored within 8 seconds of winning a turnover inside the opponent's 35m defensive threshold counts double. If the building team bypasses the high block cleanly and scores, they receive an extra point. This forces maximum collective pressing aggression while testing build-up composure under pressure. Source: France U17 Training Session.",
        coachingPoints: [
          "Collective aggression is non-negotiable — if one player fails to press or lags behind, the entire high-block structure collapses",
          "Goalkeeper maintains a high starting position as a sweeper-keeper — must clear long balls over the top, not retreat to the goal line",
          "Absolute communication from back to front — midfielders pass on runners as the block shifts dynamically",
        ],
        milestoneContribution: "Full collective pressing aggression at professional match intensity",
        requiresEquipment: ["full pitch","35m threshold cones","2 goals","bibs"], playerCount: "22",
      },
      {
        id: "crc_df_el_03",
        name: "11v11 Medium Block Conditioned Match (Zone Turnover Bonus)",
        duration: "45 mins", durationMinutes: 45,
        coachRoleId: "defence_coach", phase: "defender_elite", ageGroup: "18+",
        source: "costa_rica_u14_session1",
        focusCategories: ["mid_block","defensive_patience","wide_trapping","sweeper_keeper_positioning"],
        description: "Full 11v11. Tactical condition: when the opponent builds from the back, the defending team must drop all outfield players inside the 20m central Mid-Block Zone before applying pressure. If the defending team wins a turnover inside this zone and scores within 10 seconds, the goal = 3 points. Source: Costa Rica U14 Session 10.",
        coachingPoints: [
          "Defensive patience — do not break the mid-block by chasing the opponent's center-backs high up the pitch",
          "When the ball is forced wide, the entire team slides over rapidly to create a localised overload around the ball carrier",
          "Goalkeeper stays connected to the backline on the edge of the penalty area — positioned to sweep long balls over the top",
        ],
        milestoneContribution: "Medium block patience and rapid wide-trapping as a professional unit",
        requiresEquipment: ["full pitch","mid-block zone cones","2 goals","bibs"], playerCount: "22",
      },
      {
        id: "fra_df_el_04",
        name: "5v5 Plus 2: Immediate Counter-Pressing Transition",
        duration: "25 mins", durationMinutes: 25,
        coachRoleId: "defence_coach", phase: "defender_elite", ageGroup: "18+",
        source: "england_press_cover",
        focusCategories: ["gegenpressing","immediate_counter_press","transition_defending","ball_recovery_speed"],
        description: "5v5 in a compact area plus 2 neutral players to help the team in possession. When a team loses the ball, they must win it back within 5 seconds — this is the gegenpressing window. If they fail, the opposing team uses the neutrals to build into a larger phase of play. Track how quickly each team wins the ball back and announce the time after every turnover. Source: Spain U23 Training Camp methodology.",
        coachingPoints: [
          "The instant possession is lost, the closest player presses the ball carrier with maximum aggression — no reset, no organisation first",
          "Two nearest players press and cover — the other three hold shape behind to protect against a quick forward ball",
          "The 5-second window is non-negotiable at elite level — if the ball is not won back within 5 seconds, the moment has passed",
        ],
        milestoneContribution: "Gegenpressing — the professional standard for immediate ball recovery after losing possession",
        requiresEquipment: ["compact area cones","bibs"], playerCount: "12",
      },
      {
        id: "grs_df_el_05",
        name: "Full Defensive Review: All Systems Match",
        duration: "90 mins", durationMinutes: 90,
        coachRoleId: "defence_coach", phase: "defender_elite", ageGroup: "18+",
        source: "england_press_cover",
        focusCategories: ["full_match_application","all_defensive_systems","self_coaching","professional_standard"],
        description: "Full 11v11 competitive match. All defensive conditions are active simultaneously: winning ball inside 35m pressing threshold and scoring within 8 seconds = 3 points. Winning ball in mid-block zone and scoring within 10 seconds = 3 points. All other goals = 1 point. Post-match: each defender writes down one defensive mistake and one correct decision they made. Review before next session.",
        coachingPoints: [
          "All three defensive block systems — high press, mid-block, and low block — are deployed in the same match based on tactical triggers",
          "Goalkeepers act as the 11th defender: communicate line height, claim crosses, and distribute immediately to launch counter-attacks",
          "Post-match self-analysis is the professional standard — identify the specific moment you could have made a better defensive decision",
        ],
        milestoneContribution: "Full professional standard match application across all defensive systems",
        requiresEquipment: ["full pitch","zone threshold cones","2 goals","bibs"], playerCount: "22",
      },
    ],
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// MIDFIELDER — midfield_coach — 5 phases × 5 drills = 25 drills
// Sources: England Football Learning, Catalan Academy, Costa Rica U14,
//          Mamelodi Sundowns, France U17, England Press & Cover
// ─────────────────────────────────────────────────────────────────────────────
const MIDFIELDER_PHASES: PhaseConfig[] = [

  // ── SPARK ─ Ages 6–9 ──────────────────────────────────────────────────────
  // Sources: Moving with the Ball and Turning to Attack (EFL),
  //          Passing and Receiving to Score (EFL)
  {
    phase: "midfielder_spark", label: "Spark — Ages 6–9", ageGroup: "6-9",
    sessionDurationMinutes: 45, sessionsPerWeek: 3,
    themeWeeks: ["Finding space & moving with ball", "Passing & looking up"],
    drills: [
      {
        id:"eng_md_sp_01",
        name:"Bib Steal",
        duration:"10 mins", durationMinutes:10,
        coachRoleId:"midfield_coach", phase:"midfielder_spark", ageGroup:"6-9",
        source:"england_attacking_skills",
        focusCategories:["spatial_awareness","dribbling","scanning","change_of_direction"],
        description:"Set up a 20×15m area. Each player has a bib tucked into their shorts in line with their hip. All players try to steal other players' bibs while protecting their own. When a bib is stolen, that player tries to get it back. Play for 60-second rounds. Count how many bibs each player has at the end.",
        coachingPoints:[
          "Look around constantly — you cannot protect your own bib if you do not know where everyone else is",
          "Use changes of speed and direction to escape — do not just run in a straight line",
          "Keep your body between opponents and your own bib — this is the same skill as shielding the ball",
        ],
        milestoneContribution:"Spatial awareness, scanning habit formation, and close movement control",
        requiresEquipment:["bibs","boundary cones"], playerCount:"6–16",
      },
      {
        id:"eng_md_sp_02",
        name:"Double Trouble Attacking Pairs",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_spark", ageGroup:"6-9",
        source:"england_attacking_skills",
        focusCategories:["two_player_combinations","finding_space","passing_forward"],
        description:"35×25m pitch with a goal at each end. Keeper and defender at one end, pairs of attackers at the other. Attacking pair combines to beat the defender and score. The pair who scores the most goals across 5 turns wins. Focus: the player without the ball must find space so their partner always has a passing option.",
        coachingPoints:[
          "If you give the ball to your partner, move immediately — do not stand still",
          "Look for the space before you receive the ball — where is the defender?",
          "The player without the ball creates the goal — their movement makes space for their partner",
        ],
        milestoneContribution:"Pass-and-move instinct and finding space without the ball",
        requiresEquipment:["goal","boundary cones"], playerCount:"pairs vs keeper + defender",
      },
      {
        id:"eng_md_sp_03",
        name:"End Zone Target Game",
        duration:"12 mins", durationMinutes:12,
        coachRoleId:"midfield_coach", phase:"midfielder_spark", ageGroup:"6-9",
        source:"england_attacking_skills",
        focusCategories:["passing_forward","finding_target_players","movement_off_ball"],
        description:"35×25m pitch with a shaded end zone at each end and a neutral target player locked inside each end zone. Teams work together to get the ball to the target player in the opposition's end zone for a point. The target player returns the ball and play restarts. Focus: creating passing angles so your team can always play forward.",
        coachingPoints:[
          "Look for the target player before you get the ball — know where you want to pass before it arrives",
          "If the direct pass is blocked, move sideways to create a new angle",
          "Help your teammate by running to a space they can pass to — your run makes their decision easier",
        ],
        milestoneContribution:"Forward passing intent and supporting movement in front of the target",
        requiresEquipment:["end zone cones","boundary cones"], playerCount:"6–10 + 2 targets",
      },
      {
        id:"eng_md_sp_04",
        name:"3v3 Keep-Ball Points Game",
        duration:"12 mins", durationMinutes:12,
        coachRoleId:"midfield_coach", phase:"midfielder_spark", ageGroup:"6-9",
        source:"england_passing_to_score",
        focusCategories:["possession","movement_to_receive","supporting_angles"],
        description:"3v3 in a 20×15m area with no goals. Teams score a point for completing 5 consecutive passes. Coach counts every completed pass out loud. If the ball goes out or is intercepted, the other team restarts. Entire focus is on keeping the ball — not shooting.",
        coachingPoints:[
          "Move to create a passing angle — the ball carrier needs two options, not one",
          "Look at your teammate's feet before passing — are they ready? Are they moving?",
          "When you pass, immediately move to a new position — never stand still",
        ],
        milestoneContribution:"Possession mentality and continuous support movement",
        requiresEquipment:["boundary cones"], playerCount:"6",
      },
      {
        id:"eng_md_sp_05",
        name:"Small-Sided Game with 3-Touch Rule",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_spark", ageGroup:"6-9",
        source:"england_attacking_skills",
        focusCategories:["free_play","passing_before_shooting","teamwork"],
        description:"5v5 on a small pitch. One rule added: a goal only counts if at least 3 different players touched the ball in that attacking move. Forces team play and movement rather than individual dribbling runs. Coach does not instruct — only counts team touches before goals.",
        coachingPoints:[
          "Look for a teammate before dribbling — passing is almost always faster",
          "Move after passing so the next player has a support option",
          "Scan before your first touch — know your next pass before the ball arrives",
        ],
        milestoneContribution:"Team play instinct and scan-before-receive introduction",
        requiresEquipment:["2 mini-goals","boundary cones"], playerCount:"10",
      },
    ],
  },

  // ── BUILD ─ Ages 10–12 ────────────────────────────────────────────────────
  // Sources: Moving with the Ball and Turning to Attack (EFL),
  //          Passing and Receiving to Attack (EFL), Catalan Academy
  {
    phase: "midfielder_build", label: "Build — Ages 10–12", ageGroup: "10-12",
    sessionDurationMinutes: 60, sessionsPerWeek: 3,
    themeWeeks: ["Turning to play forward", "Scanning & body shape"],
    drills: [
      {
        id:"eng_md_bu_01",
        name:"Twist and Turn Perimeter Passing",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_build", ageGroup:"10-12",
        source:"england_attacking_skills",
        focusCategories:["turning_to_play_forward","open_body_shape","passing_after_turn"],
        description:"Split a 30×30m area into two groups: one on the outside of the area, one on the inside. The outside players pass the ball to a player on the inside. The inside player must receive, use a turn to face a different direction, and pass to a different outside player. Progress: add a passive defender shadowing the inside player to simulate pressure.",
        coachingPoints:[
          "Before receiving, adopt an open body shape so you can see both the passer and the next outside player",
          "Use a turn that faces you forward — the direction of your first touch decides your next pass options",
          "The turn must be crisp and purposeful — not a shuffle: receive, turn, pass in three distinct movements",
        ],
        milestoneContribution:"Turning to play forward — the foundational midfield technical skill",
        requiresEquipment:["boundary cones"], playerCount:"8–12",
      },
      {
        id:"eng_md_bu_02",
        name:"Twist and Turn via Gates (Cruyff & Hook)",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_build", ageGroup:"10-12",
        source:"england_attacking_skills",
        focusCategories:["cruyff_turn","inside_hook","turning_mechanics","scanning"],
        description:"Progress the perimeter passing drill by placing different-sized gates inside the area using cones. Inside players receive the pass, turn using a Cruyff turn or inside hook, and dribble through the nearest gate before passing out. Each gate is a different point value (smaller gates = more points). Teaches disguised turning under spatial pressure.",
        coachingPoints:[
          "Scan the gates before receiving the ball — decide which gate you are targeting before your first touch",
          "Cruyff turn: push the ball behind your planted foot with the inside of your kicking foot — deceptively simple",
          "Inside hook: drag the ball behind you with the outside of your foot — use this when the nearest pressure is from behind",
        ],
        milestoneContribution:"Cruyff and inside hook turns under spatial pressure",
        requiresEquipment:["multiple gate cones of different sizes","boundary cones"], playerCount:"8–12",
      },
      {
        id:"cat_md_bu_03",
        name:"Barcelona 3-2-1 Build-Up Choices",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_build", ageGroup:"10-12",
        source:"catalan_7v7",
        focusCategories:["scanning","body_shape","pass_selection","build_up_play"],
        description:"7v7 in the Catalan 3-2-1 formation. The two central midfielders receive build-up passes from the centre-back. Before every receipt, they scan (BOTS: ball, opponents, teammates, space) and decide: wall pass centrally, or switch play wide to the advancing fullback. Coach asks after every possession: 'What were your options? Which did you choose?'",
        coachingPoints:[
          "Scan before the ball arrives — know both options before you receive",
          "Open body shape on receipt: back foot, half-turned, so you can see both options immediately",
          "If both options are closed, play back — never force a pass into a covered lane",
        ],
        milestoneContribution:"Core scanning and pass-selection competency",
        requiresEquipment:["2 goals","bibs"], playerCount:"14",
      },
      {
        id:"eng_md_bu_04",
        name:"Three-Channel Restricted Match",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_build", ageGroup:"10-12",
        source:"england_attacking_skills",
        focusCategories:["channel_awareness","turning_in_channels","positional_discipline","scanning"],
        description:"40×35m pitch split into 3 vertical channels — make the middle one narrower (about 8m wide). Small-sided game with goals at each end. Players can move into any channel but the narrow middle channel forces them to play with closer control, quicker turns, and sharper passing decisions. Focus is on what players do when they enter the tight middle channel.",
        coachingPoints:[
          "When entering the middle channel, take smaller touches — big touches in tight spaces give possession away",
          "Scan before entering the channel — know whether you will turn or pass before you step in",
          "The middle channel is not just for holding the ball — use it to penetrate, then release wide",
        ],
        milestoneContribution:"Channel discipline and tight-space turning",
        requiresEquipment:["channel cones","2 goals"], playerCount:"8–10",
      },
      {
        id:"eng_md_bu_05",
        name:"Around the Clock Passing Ring",
        duration:"12 mins", durationMinutes:12,
        coachRoleId:"midfield_coach", phase:"midfielder_build", ageGroup:"10-12",
        source:"england_passing_to_attack",
        focusCategories:["passing_speed","scanning","support_angles","possession"],
        description:"Players symmetrically around a 20-yard diameter circle. Rapid 1-touch and 2-touch passing clockwise, anti-clockwise, and directly across. Two defenders in the centre try to intercept. Roles rotate immediately on an interception.",
        coachingPoints:[
          "Pass to the receiver's back foot every time",
          "Adjust your support angle continuously as the ball moves",
          "1-touch is the target — 2 touches acceptable, 3 is an error",
        ],
        milestoneContribution:"Passing speed and continuous scanning under pressure",
        requiresEquipment:["circle boundary cones"], playerCount:"8–10 + 2 defenders",
      },
    ],
  },

  // ── DEVELOP ─ Ages 13–15 ──────────────────────────────────────────────────
  // Sources: Marking and Intercepting to Defend (EFL),
  //          Pressing and Covering to Stop Goals (EFL),
  //          Marking and Intercepting to Stop Goals (EFL)
  {
    phase: "midfielder_develop", label: "Develop — Ages 13–15", ageGroup: "13-15",
    sessionDurationMinutes: 75, sessionsPerWeek: 4,
    themeWeeks: ["Marking & intercepting", "Pressing triggers & cover shadows"],
    drills: [
      {
        id:"eng_md_dv_01",
        name:"Stadium Marking Game",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_develop", ageGroup:"13-15",
        source:"england_press_cover",
        focusCategories:["marking","goal_side_positioning","scanning","body_position"],
        description:"30×20m area with a halfway line. Players are paired up — each pair has one player in each half. Teams score by dribbling the ball to their partner in the other half. The partner's direct rival must prevent them from receiving the ball. Progress: add a 'Directional Stadium' variant with end zones or goals so the marking becomes positionally crucial.",
        coachingPoints:[
          "Be goal-side of your opponent at all times — never let them get between you and the goal",
          "Use a side-on body position: you must see both the ball and your rival simultaneously",
          "Anticipate where your rival wants to move — not just where they are moving now",
        ],
        milestoneContribution:"Goal-side marking position and scanning-while-marking habit",
        requiresEquipment:["boundary cones","halfway line cones"], playerCount:"8–12",
      },
      {
        id:"eng_md_dv_02",
        name:"Five-Section Possession Grid (Marking under Pressure)",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_develop", ageGroup:"13-15",
        source:"england_press_cover",
        focusCategories:["marking_in_possession","5_section_grid","interception","compact_defending"],
        description:"30×20m area split into 5 vertical sections with a 1v1 locked into each section. One team starts with the ball and must pass between their locked players to complete 5 passes. The opposition marks their direct rival in each section to intercept. If the ball is intercepted, the intercepting team starts their 5-pass sequence. Source: Marking and Intercepting to Defend.",
        coachingPoints:[
          "Position yourself between the ball and your rival — not just close to your rival",
          "Look at the ball carrier and your rival simultaneously — side-on stance, never full frontal",
          "Anticipate the pass: read the body shape of the passer, not the ball",
        ],
        milestoneContribution:"Intercepting in locked zones — core defensive midfielder skill",
        requiresEquipment:["5 section divider cones","boundary cones"], playerCount:"10",
      },
      {
        id:"eng_md_dv_03",
        name:"Tri-Zone Interception Box",
        duration:"20 mins", durationMinutes:20,
        coachRoleId:"midfield_coach", phase:"midfielder_develop", ageGroup:"13-15",
        source:"england_press_cover",
        focusCategories:["interception_timing","middle_zone_defending","anticipation","counter_attack"],
        description:"20×10m area with end zones and a middle zone. Two interceptors are locked in the middle zone. Two passers are in one end zone, one passer in the other. The passers in the end zone must pass through the middle zone to their teammate at the other end. The two interceptors try to intercept or block every pass. If an interceptor makes contact, they score a point. If they fully intercept, they can break out for a free shot on a mini-goal. Source: Marking and Intercepting to Stop Goals.",
        coachingPoints:[
          "Judge whether an interception is possible before committing — a wrong guess gives the attacker a free pass",
          "Use the best surface for first contact: inside of the foot for accuracy, instep for reach",
          "After intercepting: positive first touch to leave attackers behind, then counter immediately",
        ],
        milestoneContribution:"Interception decision-making and post-interception counter-attack",
        requiresEquipment:["zone divider cones","1 mini-goal"], playerCount:"5",
      },
      {
        id:"eng_md_dv_04",
        name:"Diamond Tag Pressing Speed",
        duration:"15 mins", durationMinutes:15,
        coachRoleId:"midfield_coach", phase:"midfielder_develop", ageGroup:"13-15",
        source:"england_press_cover",
        focusCategories:["pressing_speed","deceleration","side_on_stance","1v1_containment"],
        description:"10×10m diamond area for a 1v1 game. Attacker starts on one cone, defender on the opposite cone. Attacker tries to dribble to any of the other three cones. Defender must close quickly, decelerate, adopt a side-on stance, and contain. Progress: time the defender — target is to get within arm's-length of the attacker within 2 seconds of the drill starting. Source: Pressing and Covering to Stop Goals — Speed of the Press.",
        coachingPoints:[
          "Look for signs to apply pressure: opponent looking down, taking a heavy touch, or slowing down",
          "Increase speed to close, then decrease speed at the last moment to stay on balance — do not run past",
          "Side-on and lowered position helps you react to the attacker's movements in any direction",
        ],
        milestoneContribution:"Pressing speed and deceleration mechanics — closing a midfielder down quickly",
        requiresEquipment:["diamond cones"], playerCount:"pairs",
      },
      {
        id:"eng_md_dv_05",
        name:"Table Football Tri-Thirds Positional Match",
        duration:"75 mins", durationMinutes:75,
        coachRoleId:"midfield_coach", phase:"midfielder_develop", ageGroup:"13-15",
        source:"england_press_cover",
        focusCategories:["positional_discipline","vertical_lines","marking_in_thirds","intercepting_as_a_unit"],
        description:"Full pitch split into thirds. Players assigned to thirds and locked in. Midfielders are locked in the middle third. They must: mark opponents locked in the same third, intercept passes coming through, and then play line-breaking passes forward to the locked strikers. If they intercept, they can break out for one pass before returning. Source: Marking and Intercepting to Defend — Table Football theme.",
        coachingPoints:[
          "Scan the pitch constantly — know the positions of both opponent and teammates before the ball arrives in your third",
          "Position between the ball and your direct rival — not beside them",
          "The timing of movement to intercept is vital: move too early and the passer plays around you; too late and the pass is through",
        ],
        milestoneContribution:"Positional marking in a locked zone at match-context intensity",
        requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"12–16",
      },
    ],
  },

  // ── PERFORM ─ Ages 16–18 ──────────────────────────────────────────────────
  // Sources: Costa Rica U14 Session 7 (Overloads in the Attacking Third),
  //          Pressing and Covering to Stop Goals (EFL),
  //          Press and Cover to Defend (EFL)
  {
    phase: "midfielder_perform", label: "Perform — Ages 16–18", ageGroup: "16-18",
    sessionDurationMinutes: 85, sessionsPerWeek: 4,
    themeWeeks: ["Creating & exploiting overloads", "Cover shadows & transition pressing"],
    drills: [
      {
        id:"crc_md_pf_01",
        name:"Overlapping Overloads & Dynamic Crossing (Midfield Trigger)",
        duration:"20 mins", durationMinutes:20,
        coachRoleId:"midfield_coach", phase:"midfielder_perform", ageGroup:"16-18",
        source:"costa_rica_u14_session1",
        focusCategories:["overlapping_trigger","third_man_run","flank_combination","crossing_delivery"],
        description:"Half pitch wide channel. Station A (deep central midfielder), Station B (wide winger), Station C (overlapping fullback). A triggers the pattern by passing wide to B. B takes a positive touch inside to drive at the central mannequin — drawing the defender. This inside drive is the visual trigger for C to break forward and overlap aggressively down the touchline. B slips the pass into C's path. C delivers a driven cross for A, who has made a timed forward run to finish. Source: Costa Rica U14 Tour Session 7.",
        coachingPoints:[
          "The central midfielder (A) must time their box run to arrive as the cross is delivered — not when the ball goes wide",
          "Player B's inside drive must be committed with real intent — a half-hearted move does not trigger C's overlap run",
          "Deliver the cross into the corridor of uncertainty between the goalkeeper and the recovering defensive line",
        ],
        milestoneContribution:"Third-man run timing off the overlapping combination — the midfielder as a finishing threat",
        requiresEquipment:["3 mannequins","half pitch cones","full goal","goalkeeper"], playerCount:"3 per group",
      },
      {
        id:"crc_md_pf_02",
        name:"3v2 to 4v3 Transition Rondo: Overload or Isolate",
        duration:"20 mins", durationMinutes:20,
        coachRoleId:"midfield_coach", phase:"midfielder_perform", ageGroup:"16-18",
        source:"costa_rica_u14_session1",
        focusCategories:["overload_exploitation","transition_decision","ball_speed","wide_release"],
        description:"30×20m box split in two by a dashed centre line. Mini-gates on the baseline. 3 blues vs 2 orange defenders in the primary half. 1 wide attacking outlet tracks the perimeter touchline. After completing 4 quick passes, blues choose: pass to the wide outlet, or drive across the centre line. As soon as the ball enters the far half, the resting defender activates — creating a live 4v3. Blues combine to score through mini-gates. Source: Costa Rica U14 Tour Session 7.",
        coachingPoints:[
          "Use 1-touch and 2-touch ball speed to exploit the 3v2 — do not use 3 touches when 1 will create the overload",
          "The player driving across the centre line must read the shifting defender: commit them, then release the wide outlet at the right moment",
          "Defenders must drop and compress the central space together — show the ball wide to buy recovery time",
        ],
        milestoneContribution:"Overload exploitation and the commit-or-release decision in transition",
        requiresEquipment:["grid cones","mini-gates","bibs"], playerCount:"7 + 1 wide outlet",
      },
      {
        id:"crc_md_pf_03",
        name:"Phase of Play: 4v3 Wide Overloads vs Low Block",
        duration:"30 mins", durationMinutes:30,
        coachRoleId:"midfield_coach", phase:"midfielder_perform", ageGroup:"16-18",
        source:"costa_rica_u14_session1",
        focusCategories:["wide_overloads","triangular_passing_structure","decoy_runs","recycling"],
        description:"Final third phase. Full goal with keeper, protected by a back 4 and 2 defensive midfielders. 7 attackers: midfield trio, 2 wingers, overlapping fullback, deep pivot. Central midfielder's job: maintain a triangular passing structure on the targeted flank, make decoy runs to pin the centre-backs, and recycle to the pivot when the flank is overloaded. Source: Costa Rica U14 Tour Session 7.",
        coachingPoints:[
          "Attacking midfielder and striker make decoy runs to pin the centre-backs — preventing them from sliding over to help their fullback",
          "Maintain a fluid triangle on the wing: ball carrier always has an inside option, an outside option, and a backward option",
          "If the flank is completely blocked, recycle quickly through the deep pivot to attack the opposite, underloaded side",
        ],
        milestoneContribution:"Wide overload structure and the recycling decision when blocked",
        requiresEquipment:["final third cones","full goal","goalkeeper","bibs"], playerCount:"13 + GK",
      },
      {
        id:"eng_md_pf_04",
        name:"Line Cover and Press 2v2 (Swift Support)",
        duration:"20 mins", durationMinutes:20,
        coachRoleId:"midfield_coach", phase:"midfielder_perform", ageGroup:"16-18",
        source:"england_press_cover",
        focusCategories:["pressing_and_covering","swift_support","cover_shadow","scanning_while_pressing"],
        description:"Set up a 2v2 area with a mini-goal behind a line at each end. Both teams: one player presses the ball carrier while the other covers the line in front of the mini-goal. The pressing midfielder scans to identify who covers, then presses immediately. If the press is beaten, the covering player steps out while the presser drops behind the line. Progress to a 4v4 Screened Match by extending the pitch and adding a screening midfielder. Source: Pressing and Covering to Stop Goals — Swift Support.",
        coachingPoints:[
          "The closest midfielder to the ball presses — the partner immediately scans and covers the line",
          "As the ball moves, the pressing and covering roles may swap — communicate who is pressing before committing",
          "The covering midfielder scans the pitch for the position of their partner, the opponents, and the goal — all at once",
        ],
        milestoneContribution:"Swift covering support and the press-cover role swap as a midfield pair",
        requiresEquipment:["cover line cones","2 mini-goals"], playerCount:"4 + progression to 8",
      },
      {
        id:"eng_md_pf_05",
        name:"11v11 Overload Reward Match",
        duration:"85 mins", durationMinutes:85,
        coachRoleId:"midfield_coach", phase:"midfielder_perform", ageGroup:"16-18",
        source:"costa_rica_u14_session1",
        focusCategories:["wide_overload_match","half_space_occupation","back_post_runs","defensive_tracking"],
        description:"Full 11v11. 8m-wide Overload Corridors marked along both flanks from halfway line to the penalty box. A goal scored from a cross delivered inside the corridor = 3 goals. If a team creates a 3v2 or 2v1 overload inside the corridor before crossing = 1 bonus point regardless of outcome. Midfielders: track back rapidly to support fullbacks, preventing the opponent from sealing the corridor. Source: Costa Rica U14 Tour Session 7.",
        coachingPoints:[
          "Winger tucks into the half-space to drag the fullback inside and clear the corridor for the overlapping run",
          "Weak-side midfielder makes a hard run to attack the back post whenever a cross is delivered from the opposite corridor",
          "Defensively: midfielders must track back to support their fullback — do not allow the opponent to establish a 2v1 in the corridor",
        ],
        milestoneContribution:"Full match application of overload creation and wide tracking at perform-phase intensity",
        requiresEquipment:["full pitch","2 goals","8m overload corridor cones"], playerCount:"22",
      },
    ],
  },

  // ── ELITE ─ Ages 18+ ──────────────────────────────────────────────────────
  // Sources: Catalan Academy, France U17, Mamelodi Sundowns, ECA Youth Academy,
  //          Costa Rica U14 Session 7, Moving with the Ball (EFL)
  {
    phase: "midfielder_elite", label: "Elite — Ages 18+", ageGroup: "18+",
    sessionDurationMinutes: 90, sessionsPerWeek: 5,
    themeWeeks: ["Professional midfield: all systems at match intensity"],
    drills: [
      {
        id:"cat_md_el_01",
        name:"Barcelona Build-Up at Match Speed (No Hesitation)",
        duration:"20 mins", durationMinutes:20,
        coachRoleId:"midfield_coach", phase:"midfielder_elite", ageGroup:"18+",
        source:"catalan_7v7",
        focusCategories:["match_speed_execution","three_option_scanning","body_shape","pass_selection"],
        description:"7v7 in the 3-2-1 formation at absolute match speed. Zero tolerance for a settled touch or a pause before passing. Midfielder scans before receipt, receives on the back foot, and plays immediately. If more than 2 touches are taken, the player does a press-up. Coach asks after every possession: 'What was your pass? What were your other two options?' Answers must be immediate — any delay means the scan was too late.",
        coachingPoints:[
          "Three-option scan before receipt: forward pass, wide pass, recycle — know all three before the ball arrives",
          "If the answer to 'what were your options?' takes more than 3 seconds, the scan was not early enough",
          "Every receive is executed as if it is the 89th minute of a high-stakes match",
        ],
        milestoneContribution:"Professional technical standard for central midfield receipt and pass selection",
        requiresEquipment:["2 goals","bibs"], playerCount:"14",
      },
      {
        id:"eng_md_el_02",
        name:"Transition Freedom Match: All Pressing & Marking Systems",
        duration:"35 mins", durationMinutes:35,
        coachRoleId:"midfield_coach", phase:"midfielder_elite", ageGroup:"18+",
        source:"england_press_cover",
        focusCategories:["all_defensive_systems","transition_freedom","gegenpressing","marking_in_match"],
        description:"3v3 or 4v4 match on a pitch with a goal at each end and a halfway line. The side on the ball can move anywhere. The team without the ball is locked in the half they were in when they lost possession — until they win it back. When they win the ball, they can go anywhere and attack immediately. This forces constant spatial awareness, marking decisions, and immediate gegenpressing on losing the ball. Source: Pressing and Covering to Stop Goals — Festival week Transition Freedom Match.",
        coachingPoints:[
          "When you lose the ball, your first action is to press — not to organise, not to retreat, to press",
          "When locked in your half, your pressing and marking must be compact enough to win the ball back quickly",
          "The moment possession is won, the transition to attack must be immediate — no hesitation, no reset",
        ],
        milestoneContribution:"Seamless transition between all pressing and marking systems in match context",
        requiresEquipment:["pitch with halfway line","2 goals","bibs"], playerCount:"6–8",
      },
      {
        id:"eng_md_el_03",
        name:"Phase of Play: All-Systems Midfield Roles (3 Blocks)",
        duration:"35 mins", durationMinutes:35,
        coachRoleId:"midfield_coach", phase:"midfielder_elite", ageGroup:"18+",
        source:"england_press_cover",
        focusCategories:["high_block","mid_block","low_block","all_systems","positional_adaptability"],
        description:"Two-thirds pitch. Three separate 10-minute blocks, each with a different defensive system. Block 1: high press — midfielders hold engagement line at the halfway line and press immediately. Block 2: mid-block — midfielders hold the 30m line of restraint, shift laterally, protect the centre circle. Block 3: low block — midfielders drop to 15m from goal, compact and deny all central penetration. Midfielders must adapt their positioning, passing patterns, and pressing triggers for each system within a single session.",
        coachingPoints:[
          "High press: push to the halfway line and engage the first pass immediately — no sitting off",
          "Mid-block: hold the 30m line, protect the centre circle, shift laterally as a unit",
          "Low block: drop to 15m from goal, compact, priority is denying the central corridor completely",
        ],
        milestoneContribution:"Adaptability across all three defensive systems — the professional complete midfielder standard",
        requiresEquipment:["two-thirds pitch","1 full goal","goalkeeper","bibs"], playerCount:"15",
      },
      {
        id:"crc_md_el_04",
        name:"4v3 Wide Overloads at Full Professional Intensity (No Stoppages)",
        duration:"35 mins", durationMinutes:35,
        coachRoleId:"midfield_coach", phase:"midfielder_elite", ageGroup:"18+",
        source:"costa_rica_u14_session1",
        focusCategories:["wide_overloads","no_stoppages","match_speed_phase","recycling_decision"],
        description:"Final third phase of play from the Costa Rica U14 Session 7 — run at absolute professional match intensity with no coaching stoppages. Both the attacking and defending units work simultaneously. The attacking midfielder's contribution is measured: triangular support structure maintained, decoy runs to pin centre-backs, and correct recycling decision when the flank is blocked. Coach observes — no pauses — and gives feedback only after each attacking phase is complete.",
        coachingPoints:[
          "No stoppages means you must correct your own position in real time — if the triangle breaks down, reset it without being told",
          "The recycling decision must be made within 2 seconds of the flank being blocked — slow recycling lets the block reset",
          "After the session: identify one phase where your decoy run pinned a centre-back, and one where it did not",
        ],
        milestoneContribution:"Wide overload phase of play at professional intensity — no coaching stoppages",
        requiresEquipment:["final third cones","full goal","goalkeeper","bibs"], playerCount:"13 + GK",
      },
      {
        id:"cat_md_el_05",
        name:"Video Analysis + Midfield Decision-Tree Mental Rehearsal",
        duration:"30 mins", durationMinutes:30,
        coachRoleId:"midfield_coach", phase:"midfielder_elite", ageGroup:"18+",
        source:"eca_youth_academy",
        focusCategories:["video_analysis","mental_rehearsal","self_coaching","decision_tree"],
        description:"Player watches 3–5 clips of professional central midfielders in positional situations: receiving under pressing, executing a line-breaking pass, intercepting a through-ball, and initiating a gegenpressing action. After each clip, player verbalises: 'What did they see before receipt? What three options did they have? What did they choose?' Then player mentally rehearses executing each movement 10 times before the next training session.",
        coachingPoints:[
          "Watch the midfielder's head position before receipt — that is the scan, not the touch",
          "The best midfielders make the pass look simple because they saw it before the ball arrived — replicate that process",
          "Mental rehearsal: close your eyes and walk through the exact footwork, body shape, and pass selection 10 times",
        ],
        milestoneContribution:"Self-directed professional development through video analysis and mental rehearsal",
        requiresEquipment:["video access","whiteboard or notebook"], playerCount:"individual",
      },
    ],
  },
];



const GOALKEEPER_PHASES: PhaseConfig[] = [
  {
    phase: "goalkeeper_spark", label: "Spark — Ages 6–9", ageGroup: "6-9",
    sessionDurationMinutes: 45, sessionsPerWeek: 3,
    themeWeeks: ["Catching & throwing", "Stopping shots & confidence"],
    drills: [
      { id:"grs_gk_sp_01", name:"Two-Handed Catch Relay", duration:"10 mins", durationMinutes:10,
        coachRoleId:"gk_coach", phase:"goalkeeper_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["catching","hand_eye_coordination","confidence"],
        description:"In pairs, 5m apart. Roll the ball along the ground, partner picks it up with both hands and rolls back. Progress: bounce pass, then chest pass, then lofted throw. Focus entirely on two-handed secure catches — no one-handed attempts. Count successful catches in a row. Target: beat your own record.",
        coachingPoints:["Always use two hands — one hand is not strong enough yet","Look at the ball all the way into your hands — do not look away early","Hug the ball into your chest the moment you catch it — hold it tight"],
        milestoneContribution:"Two-handed catching confidence and eye-on-ball habit", requiresEquipment:["balls"], playerCount:"pairs" },
      { id:"grs_gk_sp_02", name:"Set Position Practice", duration:"8 mins", durationMinutes:8,
        coachRoleId:"gk_coach", phase:"goalkeeper_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["set_position","footwork","readiness"],
        description:"Coach calls 'ready position' — player jumps to the set position: feet shoulder-width apart, weight on the balls of the feet, knees slightly bent, hands open at waist height. Then coach throws the ball to the left, right, high, or low — player moves to catch. Start slow, speed up. Reset to set position after every catch.",
        coachingPoints:["Balls of your feet — heels off the ground so you can move in any direction instantly","Hands open at waist height — not behind your back, not in your pockets","Reset to ready position after every single catch — never relax until the ball is dead"],
        milestoneContribution:"Set position as an instinctive habit", requiresEquipment:["balls"], playerCount:"individual + coach" },
      { id:"grs_gk_sp_03", name:"Mini-Goal Shot Stopping Game", duration:"15 mins", durationMinutes:15,
        coachRoleId:"gk_coach", phase:"goalkeeper_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["shot_stopping","reaction","confidence","enjoyment"],
        description:"Goalkeeper in a mini-goal. Shooters take turns shooting from 6m — only rolling or low shots, nothing above knee height at this age. Goalkeeper tries to stop every shot. Count saves. After 5 shots, swap the goalkeeper. Focus on effort and enthusiasm — every dive attempt is praised, even a miss.",
        coachingPoints:["Dive toward the ball — it is always better to dive at it than to let it roll past","Get your body behind the ball if you can — two hands plus body is the most secure","Never let a goal in without trying — dive, sprawl, block with any part of your body"],
        milestoneContribution:"Shot-stopping instinct and diving confidence at age-appropriate level", requiresEquipment:["mini-goal","balls"], playerCount:"1 GK + 3–5 shooters" },
      { id:"grs_gk_sp_04", name:"Rolling Distribution Game", duration:"10 mins", durationMinutes:10,
        coachRoleId:"gk_coach", phase:"goalkeeper_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["distribution","rolling","accuracy"],
        description:"Goalkeeper stands in the goal, 4 targets (cones) placed 10m away in a line. Goalkeeper must roll the ball to knock over each cone in order. Overarm throws are not allowed yet — only rolling. Count how many cones they knock over in 5 rolls. Distribution is as important as shot-stopping — teach it from day one.",
        coachingPoints:["Roll with the whole arm — from the shoulder, not just the wrist","Aim for the bottom of the cone — low rolls are harder to miss","Look at the target, then release — not the other way around"],
        milestoneContribution:"Distribution accuracy introduction — rolling along the ground", requiresEquipment:["mini-goal","4 cone targets","balls"], playerCount:"individual" },
      { id:"grs_gk_sp_05", name:"3v3 Goalkeeper in Action", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_spark", ageGroup:"6-9", source:"grs_striker_pathway",
        focusCategories:["game_experience","distribution","shot_stopping","communication"],
        description:"3v3 on a small pitch. Goalkeeper plays in a full-size (relative) goal. After every save or collection, they must distribute by rolling to a teammate immediately. Coach counts how many times the goalkeeper touches the ball and how quickly they distribute. Keep it fun — celebrate every save loudly.",
        coachingPoints:["After every catch or save, look for a teammate immediately — do not hold the ball","Roll or throw accurately to a teammate in space, not to the feet of a marked player","Call 'keeper' when you are coming for a ball — let your defenders know you are coming"],
        milestoneContribution:"Game experience and distribution-under-pressure introduction", requiresEquipment:["goals","boundary cones"], playerCount:"7 (3v3 + 2 GKs)" },
    ],
  },
  {
    phase: "goalkeeper_build", label: "Build — Ages 10–12", ageGroup: "10-12",
    sessionDurationMinutes: 60, sessionsPerWeek: 3,
    themeWeeks: ["W & M hand shapes", "Angle coverage & distribution"],
    drills: [
      { id:"so_gk_bu_01", name:"W & M Handling Fundamentals", duration:"10 mins", durationMinutes:10,
        coachRoleId:"gk_coach", phase:"goalkeeper_build", ageGroup:"10-12", source:"grs_striker_pathway",
        focusCategories:["w_shape_handling","m_shape_handling","set_position"],
        description:"Feeder serves at varying heights from 5m. Goalkeeper practices W-shape (thumbs almost touching) for any ball above the waist, and M-shape (little fingers almost touching) for any ball below the waist. Stand on balls of feet with hands open at waist height before every serve. 20 serves per goalkeeper.",
        coachingPoints:["W-shape: thumbs almost touching — this is for every ball above the waist","M-shape: little fingers almost touching — this is for every ball below the waist","Do not reach for the ball — move your feet to get behind it, then use the correct hand shape"],
        milestoneContribution:"W and M hand shapes as instinctive habits", requiresEquipment:["balls","feeder"], playerCount:"individual + feeder" },
      { id:"so_gk_bu_02", name:"Ground Side-Diving & Ball Recovery", duration:"15 mins", durationMinutes:15,
        coachRoleId:"gk_coach", phase:"goalkeeper_build", ageGroup:"10-12", source:"grs_striker_pathway",
        focusCategories:["ground_diving","m_shape_handling","ball_recovery","side_of_body"],
        description:"Feeder rolls balls progressively wider to force the goalkeeper to dive. Goalkeeper must dive on the SIDE of their body (not stomach). Apply M-shape to secure the ball on low shots. Immediately hug the ball into the chest after contact. Build from easy reaches to full dives over 15 minutes.",
        coachingPoints:["Dive on the side of your body — stomach diving loses control and leads to injury","M-shape for low balls — little fingers almost touching creates a secure grip","Pull the ball into your chest the instant both hands are on it"],
        milestoneContribution:"Ground diving mechanics and M-shape security", requiresEquipment:["goals","balls","feeder"], playerCount:"individual" },
      { id:"eng_gk_bu_03", name:"Circular Target-Gate Angle Coverage", duration:"15 mins", durationMinutes:15,
        coachRoleId:"gk_coach", phase:"goalkeeper_build", ageGroup:"10-12", source:"england_passing_to_attack",
        focusCategories:["angle_coverage","positioning_relative_to_ball","anticipation"],
        description:"Goalkeeper stands inside a small keeper box placed inside a circular layout of outfield players passing around the outside. As the ball moves around the circle, the goalkeeper adjusts their position within the keeper box relative to the ball's position. When the pass enters the keeper box, the goalkeeper intercepts on the first touch.",
        coachingPoints:["Always face the ball — rotate your set position as the ball moves around the circle","Stay on your toes so you can move quickly in any direction","Anticipate the pass into your zone — read the passer's body shape before the ball is released"],
        milestoneContribution:"Dynamic angle adjustment and anticipation of ball direction", requiresEquipment:["small keeper box cones","circle layout cones"], playerCount:"1 GK + 8–10 outfielders" },
      { id:"grs_gk_bu_04", name:"Goalkeeper Distribution: Three Zones", duration:"15 mins", durationMinutes:15,
        coachRoleId:"gk_coach", phase:"goalkeeper_build", ageGroup:"10-12", source:"grs_striker_pathway",
        focusCategories:["distribution","accuracy","distribution_timing","wide_distribution"],
        description:"Three coloured target zones are placed across the width of the pitch at 20m. Zone 1 (centre), Zone 2 (left flank), Zone 3 (right flank). Coach calls a zone number after the goalkeeper catches or picks up the ball. Goalkeeper must distribute to the correct zone within 3 seconds. Progress: add a defender who presses the goalkeeper as they distribute.",
        coachingPoints:["Look at the target zone BEFORE you catch the ball — not after","Distribute within 3 seconds — every second you hold the ball allows the opponent to organise","Rolling is accurate for short distances; overarm throw for 20m+; punt kick only for very long distribution"],
        milestoneContribution:"Distribution accuracy across three zones under time pressure", requiresEquipment:["3 target zones","goal","balls"], playerCount:"1 GK + targets" },
      { id:"grs_gk_bu_05", name:"Feeder-Attacker Isolation Guard", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_build", ageGroup:"10-12", source:"england_receiving_finishing",
        focusCategories:["command_of_area","communication","1v1_vs_striker","reflexes"],
        description:"20×15m pitch with a goal at one end. A feeder stands wide with the ball. An attacker with a tight-marking defender occupies the central area. Goalkeeper must direct the defender to mark the attacker correctly, read the feeder's pass, and make the save. Teaches the goalkeeper to command the area — not just the goal.",
        coachingPoints:["Command your area loudly: tell your defender where to be — not just what to do","Read the feeder's body shape to predict the pass direction before it is played","Come off your line to narrow the angle on the 1v1 — do not stay rooted to the goal line"],
        milestoneContribution:"Commanding the area and reflex saves from a feeder", requiresEquipment:["goal","boundary cones"], playerCount:"GK + 1 feeder + 1 attacker + 1 defender" },
    ],
  },
  {
    phase: "goalkeeper_develop", label: "Develop — Ages 13–15", ageGroup: "13-15",
    sessionDurationMinutes: 75, sessionsPerWeek: 4,
    themeWeeks: ["Diving & reaction saves", "Commanding the box"],
    drills: [
      { id:"grs_gk_dv_01", name:"High Ball Collection & Distribution", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_develop", ageGroup:"13-15", source:"grs_striker_pathway",
        focusCategories:["cross_collection","commanding_the_box","distribution","w_shape"],
        description:"Server crosses the ball from various angles and heights. Goalkeeper must call 'KEEPER' loudly, come off the line, collect with W-shape hands at the highest point of their jump, then distribute wide within 3 seconds. Progress: add 2 attackers who challenge for the cross — goalkeeper must still claim confidently.",
        coachingPoints:["Call 'KEEPER' every single time you are coming — let defenders clear the space","Attack the ball at its highest point — do not wait for it to come to you","W-shape: thumbs almost touching — a goalkeeper who drops a cross loses confidence for the rest of the match"],
        milestoneContribution:"High ball dominance and post-collection distribution", requiresEquipment:["full goal","server with multiple balls"], playerCount:"1 GK + server + 2 challengers" },
      { id:"grs_gk_dv_02", name:"1v1 Shot-Stopping: Narrowing the Angle", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_develop", ageGroup:"13-15", source:"grs_striker_pathway",
        focusCategories:["angle_play","1v1_positioning","coming_off_line","spreading"],
        description:"Attacker starts 25m from goal and dribbles at pace toward the goalkeeper. Goalkeeper must advance off their line to narrow the angle — the correct stopping point is approximately 6–8m from goal when the attacker is 15m out. Goalkeeper must not stand on the goal line. Teaches correct 1v1 angle management.",
        coachingPoints:["Come off your line when the attacker is 15m away — not at 5m when it is too late","The correct position in a 1v1 is 6–8m from goal — this narrows the scoring angle significantly","Stay big: spread your arms and legs wide to fill the angle — make yourself as large as possible"],
        milestoneContribution:"1v1 angle management and correct position off the goal line", requiresEquipment:["full goal","cones for reference positions"], playerCount:"1 GK + attackers" },
      { id:"grs_gk_dv_03", name:"Reaction Reflex Saves (Two-Goal Setup)", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_develop", ageGroup:"13-15", source:"grs_striker_pathway",
        focusCategories:["reflexes","reaction_saves","set_position","second_save"],
        description:"Two small goals placed 2m apart. Goalkeeper stands between them. Feeder shoots at either goal unpredictably from 8m. Goalkeeper must dive to save in whichever goal the ball is aimed at. After every save, recover to the centre position before the next shot comes — no rest between shots. 10 shots per sequence, 3-minute rest, repeat.",
        coachingPoints:["Reset to set position after every save — the second shot comes before you think it will","Do not guess which goal — wait for the ball to be struck, then react","A half-save that lands in front of you is not a save — smother the rebound immediately"],
        milestoneContribution:"Reflex save speed and second-save readiness", requiresEquipment:["2 small goals","multiple balls","feeder"], playerCount:"1 GK + feeder" },
      { id:"grs_gk_dv_04", name:"Penalty Area Domination: Box Clearing", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_develop", ageGroup:"13-15", source:"grs_striker_pathway",
        focusCategories:["box_domination","aerial_clearances","command","distribution_after_clear"],
        description:"Defend a full-size goal with 3 defenders against 4–5 attackers crossing from both flanks simultaneously. Goalkeeper must claim every ball they can reach, punch crossed balls they cannot catch safely, and communicate the backline position after every clearance. Target: zero unchallenged headers in the box.",
        coachingPoints:["If you cannot catch cleanly, punch the ball with two fists — punch to the corners, not back into the danger area","After every clearance, immediately shout the backline position: 'hold' or 'push up'","A goalkeeper who claims the box confidently gives defenders confidence — it is a leadership role, not just a physical one"],
        milestoneContribution:"Box domination through claiming, punching, and backline communication", requiresEquipment:["full goal","bibs"], playerCount:"GK + 3 defenders vs 4–5 attackers" },
      { id:"grs_gk_dv_05", name:"Goalkeeper in 11v11 Phase of Play", duration:"75 mins", durationMinutes:75,
        coachRoleId:"gk_coach", phase:"goalkeeper_develop", ageGroup:"13-15", source:"grs_striker_pathway",
        focusCategories:["match_experience","distribution","communication","backline_management"],
        description:"Full 11v11 match. Goalkeeper has two specific conditions: every distribution after a save or collection must reach a teammate within 3 seconds. Any instruction shouted to a defender must be specific — not 'mark him' but 'mark number 9 on your left shoulder'. Coach counts accurate distributions and specific verbal instructions.",
        coachingPoints:["Distribute in 3 seconds or less — the team loses momentum every second the ball stays in your hands","Specific communication: name a player and give them an instruction — vague shouting does not help anyone","Your starting position adjusts with the backline — do not stand on the goal line when your defenders are at the halfway line"],
        milestoneContribution:"Full match GK performance: distribution, communication, and position management", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"22" },
    ],
  },
  {
    phase: "goalkeeper_perform", label: "Perform — Ages 16–18", ageGroup: "16-18",
    sessionDurationMinutes: 85, sessionsPerWeek: 4,
    themeWeeks: ["Sweeper-keeper positioning", "Distribution as a tactical weapon"],
    drills: [
      { id:"grs_gk_pf_01", name:"Sweeper-Keeper Positioning & High Backline Game", duration:"25 mins", durationMinutes:25,
        coachRoleId:"gk_coach", phase:"goalkeeper_perform", ageGroup:"16-18", source:"england_press_cover",
        focusCategories:["sweeper_keeper","high_backline_positioning","long_ball_sweeping","off_line_positioning"],
        description:"8v7 phase of play with the goalkeeper instructed to hold a position 10–15m off the goal line when the team's backline is above the halfway line. When the opponent plays a long ball over the backline, the goalkeeper must sprint out and clear before the striker can reach it. This is the sweeper-keeper role that all modern high-pressing teams require.",
        coachingPoints:["Start position: when backline is at the halfway line, you are 15m from goal — not on the goal line","Read the ball in flight: if it is dropping short of the backline, you own it — come and get it at full speed","If the striker reaches it before you, get your body low and wide to block — do not lunge feet-first"],
        milestoneContribution:"Sweeper-keeper positioning and long ball sweeping behind a high defensive line", requiresEquipment:["two-thirds pitch","1 full goal","bibs"], playerCount:"15" },
      { id:"grs_gk_pf_02", name:"Distribution to Launch Counter-Attacks", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["distribution_accuracy","counter_attack_launch","quick_release","long_kick_accuracy"],
        description:"Goalkeeper receives a cross or shot, secures the ball, and must immediately identify and distribute to a teammate in space to launch a counter-attack. Three options at increasing range: roll to a nearby defender (10m), overarm throw to a midfielder (25m), or long kick to a striker running in behind (40m+). Coach calls which option before each repetition. All distributions must be completed within 3 seconds.",
        coachingPoints:["Scan the pitch before the ball arrives — know your distribution option before you have secured the ball","Match the distribution method to the distance and the receiver's movement — do not kick when rolling is safer","3 seconds from catch to release — every second you hold allows the opponent to press and organise"],
        milestoneContribution:"Distribution as a tactical weapon to launch immediate counter-attacks", requiresEquipment:["full goal","multiple balls","3 target targets at varying distances"], playerCount:"1 GK + 3 receiver targets" },
      { id:"grs_gk_pf_03", name:"Asymmetric Low Block Clearing", duration:"25 mins", durationMinutes:25,
        coachRoleId:"gk_coach", phase:"goalkeeper_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["cross_collection","clearing","command_under_pressure","distribution_under_pressure"],
        description:"Full-size goal with 4 defenders defending against 6–7 attackers on half a pitch. Heavy crossing volume from both flanks simultaneously. Goalkeeper must dominate the box: claim any cross within their range, punch what they cannot catch, command the backline on every attack. After every clearance, immediately distribute wide to restart the counter. Target: under 3 seconds from claim to distribution.",
        coachingPoints:["Claim every cross you can reach — a keeper who claims dominates their box; one who hesitates gives up set pieces","Punch with two fists, not one — two-fisted punch goes further and is more controlled","Communicate the line height after every clearance: 'hold' or 'push up' — the backline depends on your voice"],
        milestoneContribution:"Cross collection, rapid wide distribution, and backline leadership under sustained pressure", requiresEquipment:["full goal","bibs"], playerCount:"GK + 4 defenders vs 6–7 attackers" },
      { id:"grs_gk_pf_04", name:"Penalty & Set Piece Scenarios", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["penalty_saving","set_piece_positioning","wall_management","anticipation"],
        description:"Three scenarios in sequence: (1) Penalty saving — goalkeeper studies the shooter's run-up and plant foot to predict direction. 10 penalties. (2) Free kick wall management — goalkeeper positions the wall correctly and tells them where to stand. (3) Corner kick positioning — goalkeeper marks their zone and commands 'mine' or 'away'.",
        coachingPoints:["Penalty: watch the plant foot and non-kicking shoulder — not the eyes, not the run-up misdirection","Free kick wall: the goalkeeper controls the wall, not the captain — stand at the post and direct using the angle you need","Corner: commit to your decision before the ball is served — change your mind and you arrive late"],
        milestoneContribution:"Set piece decision-making, wall management, and penalty anticipation", requiresEquipment:["full goal","balls"], playerCount:"1 GK + shooters" },
      { id:"grs_gk_pf_05", name:"11v11 Goalkeeper All-Conditions Match", duration:"85 mins", durationMinutes:85,
        coachRoleId:"gk_coach", phase:"goalkeeper_perform", ageGroup:"16-18", source:"grs_striker_pathway",
        focusCategories:["full_match_performance","sweeper_keeper","distribution","leadership"],
        description:"Full 11v11 competitive match. Goalkeeper has two specific performance conditions: every distribution after securing the ball must be completed within 3 seconds. The goalkeeper must call a specific instruction to a specific defender at least once every 3 minutes of match time. Coach tracks both metrics. Any unclaimed cross within the goalkeeper's range = a coaching point.",
        coachingPoints:["Your distribution starts the next attack — every second you hold the ball kills momentum","Your voice controls your backline — specific, loud, and early — your defenders cannot see what you can see","When you make a save, scan immediately — the distribution option is already available before you have the ball"],
        milestoneContribution:"Full match GK performance at Perform-phase intensity: all roles measured", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"22" },
    ],
  },
  {
    phase: "goalkeeper_elite", label: "Elite — Ages 18+", ageGroup: "18+",
    sessionDurationMinutes: 90, sessionsPerWeek: 5,
    themeWeeks: ["Professional GK: all roles at match intensity"],
    drills: [
      { id:"grs_gk_el_01", name:"High-Intensity Shot-Stopping Circuit (No Reset)", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_elite", ageGroup:"18+", source:"grs_striker_pathway",
        focusCategories:["shot_stopping","reaction","physical_conditioning","mental_resilience"],
        description:"Three feeders positioned at different angles and ranges around the penalty box. Shots come in sequence with 4-second intervals — no recovery time. Goalkeeper must return to set position within 2 seconds of each save before the next shot. 15-shot sequences, 3-minute rest, repeat 4 times. This simulates the physical and mental demands of a professional match.",
        coachingPoints:["Set position within 2 seconds — if you are not ready, the next shot has already beaten you","Every dive, every save, every recovery is executed at professional speed and intensity — no exceptions","After the 15th shot: analyse your own performance — which saves were secure? Which were reactive? Which were lucky?"],
        milestoneContribution:"Professional shot-stopping endurance and mental resilience under fatigue", requiresEquipment:["full goal","3 feeders with multiple balls each"], playerCount:"1 GK + 3 feeders" },
      { id:"grs_gk_el_02", name:"Sweeper-Keeper High Press: Live 11v11 Scenarios", duration:"35 mins", durationMinutes:35,
        coachRoleId:"gk_coach", phase:"goalkeeper_elite", ageGroup:"18+", source:"england_press_cover",
        focusCategories:["sweeper_keeper","high_press_support","long_ball_sweeping","distribution_under_pressure"],
        description:"Two-thirds pitch. Pressing team in a high block — goalkeeper holds 12–15m off the goal line. Opponent plays long balls over the backline regularly. Goalkeeper must sweep every long ball that drops behind the backline before the attacker reaches it. Condition: if the goalkeeper fails to claim a long ball they could have reached, they do a shuttle sprint as a physical accountability measure.",
        coachingPoints:["Read the flight of the ball in the first half-second — decide to come or stay before it peaks","Sprint at full pace to the ball — a hesitant sweeper-keeper is worse than a traditional keeper who stays on the line","After sweeping, distribute immediately — do not take a touch, do not look down: scan, distribute, recover"],
        milestoneContribution:"Sweeper-keeper long ball sweeping at professional high-press match intensity", requiresEquipment:["two-thirds pitch","full goal","bibs"], playerCount:"15" },
      { id:"fra_gk_el_03", name:"Coordinated High Press Match: Goalkeeper as 11th Defender", duration:"45 mins", durationMinutes:45,
        coachRoleId:"gk_coach", phase:"goalkeeper_elite", ageGroup:"18+", source:"england_press_cover",
        focusCategories:["high_press_gk_role","communication","backline_management","distribution_speed"],
        description:"Full 11v11 with high-press conditions. Scoring condition: any goal scored within 8 seconds of a turnover inside the opponent's 35m threshold counts double. The goalkeeper is the last line of the high press — they must maintain a starting position 15m+ off the goal line and provide the verbal command for the entire defensive line.",
        coachingPoints:["You are the 11th defender — your starting position tells your backline how high to hold their line","Every verbal instruction is a tactical command: 'step' means the whole line steps, 'hold' means hold — your voice is your most important tool","After every save or claim, distribute within 3 seconds to launch the counter-attack that earns the 3-point bonus"],
        milestoneContribution:"Full professional GK performance as the 11th field player in a high-press system", requiresEquipment:["full pitch","35m threshold cones","2 goals","bibs"], playerCount:"22" },
      { id:"grs_gk_el_04", name:"Distribution Accuracy Under Fatigue", duration:"20 mins", durationMinutes:20,
        coachRoleId:"gk_coach", phase:"goalkeeper_elite", ageGroup:"18+", source:"grs_striker_pathway",
        focusCategories:["distribution_accuracy","physical_conditioning","technical_consistency","fatigue_management"],
        description:"Goalkeeper completes a 200m sprint at 85% pace, then must immediately distribute accurately to three moving targets (roll to 10m, overarm throw to 25m, kicked pass to 40m+) within 5 seconds of finishing the sprint. Repeat 8 times. This replicates the distribution demand after a keeper has sprinted to sweep — one of the most physically demanding moments for a modern goalkeeper.",
        coachingPoints:["Your distribution accuracy must not drop under physical fatigue — this is what professional training builds","Breathe after the sprint before you distribute — 1 second to compose, 4 seconds to deliver","Your targets are moving: scan before your distribution, not after you have decided where to kick"],
        milestoneContribution:"Distribution accuracy maintained at full physical exertion — the professional standard", requiresEquipment:["200m sprint track","full goal","3 moving target receivers","multiple balls"], playerCount:"1 GK + 3 receivers" },
      { id:"grs_gk_el_05", name:"Full Match GK Review: All Conditions Active", duration:"90 mins", durationMinutes:90,
        coachRoleId:"gk_coach", phase:"goalkeeper_elite", ageGroup:"18+", source:"grs_striker_pathway",
        focusCategories:["full_match_performance","self_coaching","all_gk_roles","professional_standard"],
        description:"Full 11v11 competitive match. All conditions active: goalkeeper distribution must be completed within 3 seconds. Goalkeeper must call a specific instruction to a specific defender at least once every 3 minutes. Sweeper-keeper protocol active — goalkeeper must come for every long ball that drops behind the backline. Post-match: goalkeeper writes down one save they should have claimed more securely, and one distribution decision that could have been better.",
        coachingPoints:["All goalkeeper roles — shot-stopper, sweeper, distributor, and leader — are active simultaneously in every match at professional level","Post-match review is non-negotiable at this level: identify the specific moment and the specific decision that could have been better","Physical and mental output in the final 15 minutes must match the first 15 — if it does not, the conditioning programme needs adjusting"],
        milestoneContribution:"Full professional standard GK performance across all roles", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"22" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// WINGER — winger_coach — 5 phases × 5 drills = 25 drills
// Sources: Costa Rica U14 Tour (Sessions 1 & 9), England Football Learning,
//          Catalan Academy, GRS original
// ─────────────────────────────────────────────────────────────────────────────
const WINGER_PHASES: PhaseConfig[] = [
  {
    phase: "winger_spark", label: "Spark — Ages 6–9", ageGroup: "6-9",
    sessionDurationMinutes: 45, sessionsPerWeek: 3,
    themeWeeks: ["Dribbling with the ball", "Running with the ball wide"],
    drills: [
      { id:"grs_wg_sp_01", name:"Cone Dribbling Circuit", duration:"12 mins", durationMinutes:12,
        coachRoleId:"winger_coach", phase:"winger_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["dribbling","ball_control","close_control","change_of_direction"],
        description:"8 cones set in a zigzag 2m apart. Dribble through the cones using the outside of the foot as much as possible. On the return, dribble using only the inside of the foot. Time yourself and try to beat your time each round. Keep the ball close — no more than 1 step away from the ball at any time.",
        coachingPoints:["Keep the ball within 1 step — touch it every other stride","Use the outside of the foot going one way, inside of the foot coming back","Head up: look at the cones ahead, not down at the ball"],
        milestoneContribution:"Close ball control and change of direction dribbling", requiresEquipment:["8 cones","ball"], playerCount:"individual" },
      { id:"grs_wg_sp_02", name:"Width Running with the Ball", duration:"12 mins", durationMinutes:12,
        coachRoleId:"winger_coach", phase:"winger_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["running_with_ball","wide_play","speed_with_ball"],
        description:"Two cone lines mark a 5m wide channel down the touchline. Player starts at one end with a ball and runs the full length of the channel as fast as possible while keeping the ball in the channel. Progress: add a soft defender who jogs alongside and tries to touch the ball. Winger must keep the ball between them and the sideline.",
        coachingPoints:["Push the ball forward with the outside of the foot — big touches when there is space, small touches when tight","The ball always stays between you and the sideline — not between you and the defender","Running speed with the ball should be close to your sprinting speed — if you slow down, the defender catches you"],
        milestoneContribution:"Running at pace with the ball in a wide channel", requiresEquipment:["channel cones"], playerCount:"individual or pairs" },
      { id:"grs_wg_sp_03", name:"1v1 Dribbling Tunnel Game", duration:"15 mins", durationMinutes:15,
        coachRoleId:"winger_coach", phase:"winger_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["1v1_dribbling","feinting","ball_mastery","confidence"],
        description:"A 10×5m tunnel. Attacker starts at one end with the ball, defender at the other end. Attacker must dribble to the other end of the tunnel without the defender touching the ball. No tackling — defender uses positioning only. Rotate every 3 turns. Focus is entirely on ball mastery and creative movement.",
        coachingPoints:["Use a feint before you move — drop a shoulder or use a step-over to make the defender react","Accelerate AFTER the feint — the space is only open for a moment","If blocked, try a different move — experiment freely at this age"],
        milestoneContribution:"1v1 dribbling confidence and feinting introduction", requiresEquipment:["tunnel cones"], playerCount:"pairs" },
      { id:"grs_wg_sp_04", name:"Crossing into Goal Game", duration:"15 mins", durationMinutes:15,
        coachRoleId:"winger_coach", phase:"winger_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["crossing","delivery","instinctive_finishing","wide_play"],
        description:"Winger starts wide with the ball, a target player stands in the penalty area. Winger dribbles to the byline and rolls the ball across the goal face for the target to tap in. No shooting from the winger — only the cross matters. Count successful crosses that reach the target player's feet. Progress: winger crosses first time from a pass rather than carrying the ball.",
        coachingPoints:["Roll the ball across the goal face — not into the keeper's hands","Aim for the penalty spot — that is the best area to cross into","Look at the target player before you cross — make sure they are ready and in position"],
        milestoneContribution:"Crossing into the goal area — the winger's primary attacking skill", requiresEquipment:["mini-goal","boundary cones"], playerCount:"pairs" },
      { id:"grs_wg_sp_05", name:"4v4 Wide Play Game", duration:"20 mins", durationMinutes:20,
        coachRoleId:"winger_coach", phase:"winger_spark", ageGroup:"6-9", source:"england_attacking_skills",
        focusCategories:["wide_play","game_context","crossing","direct_dribbling"],
        description:"4v4 on a wide pitch with flank channels marked 5m in from the touchline. A goal that comes from a cross out of the flank channel = 2 points. Any other goal = 1 point. This incentive encourages players to use the wide areas and deliver crosses naturally. Coach only cheers wide play.",
        coachingPoints:["If the central area is blocked, go wide — it is the easiest space to find at this age","Look for the channel: as soon as you receive the ball, check if the wide channel is available","Cross low and hard across the goal face — it is harder for the goalkeeper and easier for the striker to finish"],
        milestoneContribution:"Using width as an attacking option in game context", requiresEquipment:["2 mini-goals","flank channel cones"], playerCount:"8" },
    ],
  },
  {
    phase: "winger_build", label: "Build — Ages 10–12", ageGroup: "10-12",
    sessionDurationMinutes: 60, sessionsPerWeek: 3,
    themeWeeks: ["Inside cut & wide release", "Crossing technique & delivery types"],
    drills: [
      { id:"eng_wg_bu_01", name:"4v4 Wide Channels with Flank Outlets", duration:"20 mins", durationMinutes:20,
        coachRoleId:"winger_coach", phase:"winger_build", ageGroup:"10-12", source:"england_attacking_skills",
        focusCategories:["wide_channels","crossing_from_channel","timing_of_cross","delivery_types"],
        description:"Wide 4v4 pitch with marked flank corridors. Two neutral wide outlet players locked in the side channels. Central team of 4 makes 4 passes before using the wide channels. When the ball reaches the wide player in the channel, they must deliver a cross into the box within 2 touches. The goal = 1 point; goal from a cross = 2 points.",
        coachingPoints:["When the ball comes wide, make your crossing decision before your first touch — low driven or high back post?","Cross low across the face of the goal when the defensive line is deep; cross high to the back post when the front post is blocked","The timing of the central runner into the box must match your cross — not before it, not after it"],
        milestoneContribution:"Crossing decision-making and delivery type selection", requiresEquipment:["wide pitch cones","flank channel cones","2 goals"], playerCount:"8 + 2 neutral wide players" },
      { id:"eng_wg_bu_02", name:"Inside Cut & Combination (Width for Deception)", duration:"15 mins", durationMinutes:15,
        coachRoleId:"winger_coach", phase:"winger_build", ageGroup:"10-12", source:"england_attacking_skills",
        focusCategories:["inside_cut","overlapping_trigger","wide_play_combination","deception"],
        description:"Winger (B) receives the ball wide and cuts inside diagonally, pulling the opposing fullback with them. This is the cue for the overlapping fullback (C) to sprint into the vacated wide channel. Winger slips a pass into C's run. C crosses for A who has timed a run into the box. Run on both sides alternately.",
        coachingPoints:["The inside cut must be committed — a half-hearted cut does not pull the fullback","When C starts their overlap run, play the pass immediately — do not hold it","A's box run must be timed to arrive as C is about to cross — delay, then explode"],
        milestoneContribution:"Inside-cut trigger for the overlapping fullback — the foundational winger combination", requiresEquipment:["flank cones","goal"], playerCount:"3 per side" },
      { id:"crc_wg_bu_03", name:"Flank Combinations Technical Warm-Up (Both Sides)", duration:"15 mins", durationMinutes:15,
        coachRoleId:"winger_coach", phase:"winger_build", ageGroup:"10-12", source:"costa_rica_u14_session1",
        focusCategories:["flank_combinations","overlapping_runs","first_time_crossing","bilateral_development"],
        description:"35×25m wide channel. Station A (deep central), Station B (wide winger), Station C (fullback). A passes to B. B lays off first-time to A. A plays a penetrative ball into the channel behind the defensive mannequins for C's overlapping run. C crosses first-time. A runs to finish. Mirror on the left side — equal time on both. Source: Costa Rica U14 Tour Session 9.",
        coachingPoints:["B's lay-off must be weighted into A's stride — not stationary","C's overlap run must hit the channel at full speed — not a jog into the cross position","Cross must be delivered first time — a second touch gives the defender time to recover"],
        milestoneContribution:"Three-player flank combination at technical training speed", requiresEquipment:["4 mannequins","channel cones","goal"], playerCount:"3 per group per flank" },
      { id:"eng_wg_bu_04", name:"Crossing Technique: Three Types", duration:"15 mins", durationMinutes:15,
        coachRoleId:"winger_coach", phase:"winger_build", ageGroup:"10-12", source:"england_attacking_skills",
        focusCategories:["crossing_types","driven_low_cross","back_post_cross","cut_back"],
        description:"Three crossing target zones are placed in the penalty area: zone 1 = near post (6m), zone 2 = penalty spot (11m), zone 3 = back post (17m). Winger practices each cross type in sequence: (1) low driven across the face to the near post zone, (2) whipped ball to the penalty spot zone, (3) floated high ball to the back post zone. 10 repetitions of each type from each flank.",
        coachingPoints:["Low driven cross: hit through the bottom half of the ball with a firm, locked ankle","Penalty spot cross: whip through the ball with a bent trajectory — the ball should arrive at waist height","Back post cross: open your hips and clip the top half of the ball — it should arc over the near defender"],
        milestoneContribution:"Three cross types with correct technique from both flanks", requiresEquipment:["3 target zone cones","goal","balls"], playerCount:"individual + crossing targets" },
      { id:"grs_wg_bu_05", name:"7v7 Winger Role: Inside or Outside Decision", duration:"35 mins", durationMinutes:35,
        coachRoleId:"winger_coach", phase:"winger_build", ageGroup:"10-12", source:"catalan_7v7",
        focusCategories:["positional_decision","inside_vs_outside","reading_the_fullback","wide_play_in_game"],
        description:"7v7 in the Catalan 3-2-1 formation. The winger plays in the '1' wide position. On every possession, the winger must decide: go inside to become a goal threat, or stay wide to stretch the defence and provide the crossing option. Coach pauses after every move and asks: 'Did you go inside or outside? Why? What was the fullback's position when you decided?'",
        coachingPoints:["If the opposing fullback is narrow, go outside — the wide channel is free","If the opposing fullback is wide, cut inside — you have their weight going the wrong way","Never do the same thing twice in a row — if you cut inside once, the fullback anticipates it next time — go outside"],
        milestoneContribution:"Inside vs outside decision intelligence based on reading the opposing fullback", requiresEquipment:["2 goals","bibs"], playerCount:"14" },
    ],
  },
  {
    phase: "winger_develop", label: "Develop — Ages 13–15", ageGroup: "13-15",
    sessionDurationMinutes: 75, sessionsPerWeek: 4,
    themeWeeks: ["3v2 wide overloads", "Phase of play: wide attacks"],
    drills: [
      { id:"crc_wg_dv_01", name:"3v2 Wide Overload & Crossing Game", duration:"25 mins", durationMinutes:25,
        coachRoleId:"winger_coach", phase:"winger_develop", ageGroup:"13-15", source:"costa_rica_u14_session1",
        focusCategories:["wide_overloads","crossing_delivery","box_entry_runs","2v1_exploitation"],
        description:"Area from the halfway line to the penalty box plus one full flank channel. Full goal with keeper. 3 central attackers and 1 wide midfielder against 2 central defenders. Central players draw defenders inward. Ball shifts to the winger. As ball goes wide, fullback overlaps to create a 2v1. Winger crosses. 3 attackers attack front post, back post, and penalty spot.",
        coachingPoints:["Central attackers make decoy runs to pin defenders — do not all drift wide when the ball goes wide","Cross must target specific zones: front post, back post, or cut-back to the penalty spot depending on defender positions","The 2v1 on the flank must be exploited quickly — slow build-up allows the recovering defender to make it a 2v2"],
        milestoneContribution:"2v1 wide overload execution and coordinated crossing into a box attack", requiresEquipment:["goal","goalkeeper","bibs","flank channel cones"], playerCount:"7 + GK" },
      { id:"crc_wg_dv_02", name:"3v2 to 4v3 Transition Crossing Game", duration:"25 mins", durationMinutes:25,
        coachRoleId:"winger_coach", phase:"winger_develop", ageGroup:"13-15", source:"costa_rica_u14_session1",
        focusCategories:["crossing_into_box","box_runs_coordination","transition_crossing","first_time_cross"],
        description:"35×25m box appended to the penalty area, split by a dashed line. Wide flank lane included. 3 blues build play against 2 defenders. Once they cross the line, ball must shift to the winger in the flank lane. As ball goes wide, resting defender activates — creating a live 4v3. Winger crosses for the 3 central attackers who must cross paths to confuse defenders. Source: Costa Rica U14 Tour Session 9.",
        coachingPoints:["Circulate the ball quickly in the 3v2 to commit the defenders before releasing wide","As soon as the ball moves wide, central attackers must explode into the box — crossing paths to confuse tracking defenders","Defenders must match runner speeds and maintain body contact inside the penalty box"],
        milestoneContribution:"Wide transition into crossing and coordinated box entry runs", requiresEquipment:["flank lane cones","goal","goalkeeper","bibs"], playerCount:"7 + GK" },
      { id:"crc_wg_dv_03", name:"Synchronized Flank Attacks 6v5", duration:"30 mins", durationMinutes:30,
        coachRoleId:"winger_coach", phase:"winger_develop", ageGroup:"13-15", source:"costa_rica_u14_session1",
        focusCategories:["phase_of_play_wide","ball_circulation","wide_release","opposite_winger_tuck"],
        description:"Two-thirds pitch with isolated flank corridors. 6 attackers in a 3-3 shape vs 5 defenders + GK. Midfield trio circulates horizontally to shift the block. When the block shifts, ball released wide into the flank corridor. Nearest fullback underlaps or overlaps for a 2v1. Cross into the box: near post runner, far post runner, and penalty spot runner. Opposite winger tucks inside as a frame-finishing option.",
        coachingPoints:["Circulation speed is critical — slow circulation allows the block to slide and cover","Fullback visual cue: when the winger cuts inside, that is the overlap trigger — not a verbal signal","Opposite winger tucks inside to attack the back post — they are not standing watching the action"],
        milestoneContribution:"Phase-of-play wide attack with all crossing zones occupied", requiresEquipment:["two-thirds pitch","flank corridor cones","goal","goalkeeper","bibs"], playerCount:"11 + GK" },
      { id:"crc_wg_dv_04", name:"8v7 Attacking from Wide Areas", duration:"30 mins", durationMinutes:30,
        coachRoleId:"winger_coach", phase:"winger_develop", ageGroup:"13-15", source:"costa_rica_u14_session1",
        focusCategories:["wide_play_phase","circulation_into_wide_release","fullback_balance","crossing_selection"],
        description:"Two-thirds pitch. 8 attackers in a 2-3-3 shape (representing a 4-3-3 build-up phase) vs a 4-2 defensive block + GK. Midfield circulates horizontally until an opening to release a fullback down either flank appears. Opposite fullback tucks inside for defensive balance. If defenders win the ball, they pass into two mini-goals on the halfway line.",
        coachingPoints:["The speed of ball circulation is critical — if the ball moves too slowly, the block slides to cover every wide space","Fullbacks must recognise the visual cue to overlap: when the wide winger cuts inside diagonally, that opens the flank","The opposite fullback tucks inside — the team must maintain defensive balance when one fullback goes forward"],
        milestoneContribution:"Wide attacks from an organised build-up structure at tactical phase intensity", requiresEquipment:["two-thirds pitch","isolated flank cones","goal","goalkeeper","bibs"], playerCount:"15 + GK" },
      { id:"crc_wg_dv_05", name:"11v11 Flank Assist Incentives", duration:"75 mins", durationMinutes:75,
        coachRoleId:"winger_coach", phase:"winger_develop", ageGroup:"13-15", source:"costa_rica_u14_session1",
        focusCategories:["full_match_wide_play","crossing_corridors","wide_incentives","match_application"],
        description:"Full 11v11 match. 8m-wide crossing corridors on both flanks. Normal goal = 1 point. A goal from a cross delivered by an overlapping fullback who entered the corridor = 3 points. Teams must widen the pitch, utilise flank overloads, and maximise crossing volume.",
        coachingPoints:["Switch the point of attack quickly to catch the block before it can slide over to cover","Attacking players inside the box must stay moving — static players are easy to mark","Fullback presses inside the corridor while midfielders drop into the box to track central runners"],
        milestoneContribution:"Full match wide play application with crossing incentives", requiresEquipment:["full pitch","2 goals","crossing corridor cones"], playerCount:"22" },
    ],
  },
  {
    phase: "winger_perform", label: "Perform — Ages 16–18", ageGroup: "16-18",
    sessionDurationMinutes: 85, sessionsPerWeek: 4,
    themeWeeks: ["High-tempo flank combinations", "Match-speed crossing & pressing"],
    drills: [
      { id:"crc_wg_pf_01", name:"Flank Combinations & Unopposed Crossing (Match Speed)", duration:"20 mins", durationMinutes:20,
        coachRoleId:"winger_coach", phase:"winger_perform", ageGroup:"16-18", source:"costa_rica_u14_session1",
        focusCategories:["flank_combinations","overlapping_runs","first_time_crossing","match_speed_execution"],
        description:"Half pitch, one flank channel. A passes wide to B (winger). B cuts inside diagonally — pulling the simulated fullback mannequin. C (fullback) breaks from deep into the vacated wide channel at full sprint. B slips the pass into C's path. C delivers a first-time cross for A, who has timed a box run. All movements are at match speed — no jogging. Mirror on both flanks. Source: Costa Rica U14 Tour Session 9.",
        coachingPoints:["The overlap run must hit the wide zone at full speed — any hesitation and the defensive line closes","The cross must be delivered first time — a second touch eliminates the timing advantage","A's box run must be timed to arrive as C's foot strikes the ball — not when C receives it"],
        milestoneContribution:"Flank combination execution at full match speed", requiresEquipment:["mannequins","crossing channel cones","goal","goalkeeper"], playerCount:"3 per group per flank" },
      { id:"crc_wg_pf_02", name:"3v2 to 4v3 Crossing at Match Intensity", duration:"25 mins", durationMinutes:25,
        coachRoleId:"winger_coach", phase:"winger_perform", ageGroup:"16-18", source:"costa_rica_u14_session1",
        focusCategories:["transition_crossing","match_intensity","box_entry_coordination","crossing_decision"],
        description:"35×25m box appended to the penalty area plus one wide flank lane. 3 blues build play against 2 defenders at match speed. Ball must shift wide the moment they cross the halfway line. Resting defender activates creating a live 4v3. Winger crosses. Central attackers cross paths inside the box. Target: a quality cross and a shot within 5 seconds of the ball reaching the winger.",
        coachingPoints:["5-second target from ball wide to shot — if it takes longer, the defence has recovered","Winger's crossing decision must be made before the ball arrives — read the box runners first","Attackers crossing paths inside the box must be at full sprint — a slow crossing run is easy for defenders to track"],
        milestoneContribution:"Wide transition into crossing at match intensity with time pressure", requiresEquipment:["grid cones","flank lane cones","goal","goalkeeper","bibs"], playerCount:"7 + GK" },
      { id:"crc_wg_pf_03", name:"8v7 Wide Play Phase at Full Tactical Speed", duration:"30 mins", durationMinutes:30,
        coachRoleId:"winger_coach", phase:"winger_perform", ageGroup:"16-18", source:"costa_rica_u14_session1",
        focusCategories:["tactical_wide_play","high_tempo_circulation","full_tactical_speed","phase_of_play"],
        description:"Two-thirds pitch. 8 attackers vs a 4-2 defensive block + GK. Entire session run at match intensity with no coaching stoppages. Winger must read the circulation, recognise the overlap trigger, and time the release pass with precision. After every turnover, both teams transition immediately — no reset.",
        coachingPoints:["Winger: your job is to make the overlap possible — cut inside early to clear the flank before the fullback runs","If the overlap is not triggered naturally in 10 seconds of circulation, force it — fake the inside cut then go outside","When you win the ball back, look wide immediately — the winger is the fastest counter-attack outlet"],
        milestoneContribution:"Full tactical wide play at match intensity — no coaching stoppages", requiresEquipment:["two-thirds pitch","flank corridors","goal","goalkeeper","bibs"], playerCount:"15 + GK" },
      { id:"crc_wg_pf_04", name:"11v11 Crossing Corridor Conditioned Match", duration:"85 mins", durationMinutes:85,
        coachRoleId:"winger_coach", phase:"winger_perform", ageGroup:"16-18", source:"costa_rica_u14_session1",
        focusCategories:["full_match_wide_play","crossing_bonus","flank_overloads","winger_leadership"],
        description:"Full 11v11. Two conditions: a goal from a cross delivered inside the 8m crossing corridor by an overlapping fullback = 3 points. If a team creates a 2v1 inside the corridor but fails to score, they retain a possession bonus worth 1 point. Normal goal = 1 point. Forces winger leadership and wide tactical focus.",
        coachingPoints:["Wingers: you make the overlapping fullback possible — your inside cut is the trigger for every 3-point goal","Defensively: the fullback presses in the corridor while midfielders drop into the box — do not leave the crossing lane open","Post-match: identify one delivery you should have made earlier and one crossing decision that was correct"],
        milestoneContribution:"Full match wide play at Perform-phase intensity with crossing incentives", requiresEquipment:["full pitch","2 goals","8m crossing corridor cones","bibs"], playerCount:"22" },
      { id:"eng_wg_pf_05", name:"Press for Success: Winger as First Presser", duration:"20 mins", durationMinutes:20,
        coachRoleId:"winger_coach", phase:"winger_perform", ageGroup:"16-18", source:"england_press_cover",
        focusCategories:["pressing_from_wide","defensive_work_rate","pressing_triggers","wide_press_trap"],
        description:"Full pitch in thirds. Condition: winning the ball in the attacking third and scoring = 3 goals. Winger must lead the press from the wide position — cutting the fullback off from playing backward, forcing the ball into the touchline. Winger's press angle is as important as the striker's — both cut off the same side of the pitch.",
        coachingPoints:["Press at an angle to cut off the backward pass — force the ball forward into pressure, not backward into space","When you press, your striker must cover the central option — coordinate with them before pressing","After winning the ball, burst forward immediately — you are already in a wide attacking position, use it"],
        milestoneContribution:"Winger pressing intelligence and defensive work rate in the attacking third", requiresEquipment:["full pitch","2 goals","bibs"], playerCount:"16–18" },
    ],
  },
  {
    phase: "winger_elite", label: "Elite — Ages 18+", ageGroup: "18+",
    sessionDurationMinutes: 90, sessionsPerWeek: 5,
    themeWeeks: ["Professional wide play: attack and press"],
    drills: [
      { id:"crc_wg_el_01", name:"Bilateral Flank Combinations at Maximum Speed", duration:"20 mins", durationMinutes:20,
        coachRoleId:"winger_coach", phase:"winger_elite", ageGroup:"18+", source:"costa_rica_u14_session1",
        focusCategories:["bilateral_development","match_speed","first_time_cross","precision_under_fatigue"],
        description:"Full flank combination — A to B, B lays off to A, A penetrates for C's overlap, C crosses first-time for A's box run — run continuously on BOTH flanks with no break between repetitions. 10 reps per side, 90 seconds rest, 4 sets. No jog-throughs allowed — every rep is at sprint pace. This replicates the endurance demand of a professional winger who delivers multiple crosses per half.",
        coachingPoints:["Execution quality must not drop from rep 1 to rep 40 — if it does, the physical conditioning requires attention","Cross delivery first time on every rep — any second touch in a professional match loses the timing advantage","Mental reset after every rep: forget the last cross immediately, focus entirely on the next one"],
        milestoneContribution:"Professional bilateral crossing endurance at full sprint — 40 reps per session", requiresEquipment:["mannequins","channel cones","full goal","goalkeeper"], playerCount:"3 per side" },
      { id:"crc_wg_el_02", name:"Phase of Play 6v5 Synchronized Wide Attacks (All Conditions)", duration:"35 mins", durationMinutes:35,
        coachRoleId:"winger_coach", phase:"winger_elite", ageGroup:"18+", source:"costa_rica_u14_session1",
        focusCategories:["match_speed_phase_of_play","wide_synchronisation","crossing_selection","all_crossing_zones"],
        description:"Two-thirds pitch. 6 attackers vs 5 defenders + GK at match intensity. No coaching stoppages. Both wingers play simultaneously — left winger and right winger both active. The attacking trio circulates to release either flank. Crossing selection must be correct on every delivery: low driven = deep defensive line, back post = near post covered, cut-back = box overcrowded.",
        coachingPoints:["Target under 4 seconds from wide release to quality cross delivery — if you need longer, the circulation took too long","Crossing selection is a decision, not a habit — read the defensive line position before your first touch on the ball wide","Opposite winger attacks the back post on every cross — their run is as important as the cross itself"],
        milestoneContribution:"Professional phase-of-play wide attack with crossing selection accuracy", requiresEquipment:["two-thirds pitch","flank corridor cones","goal","goalkeeper","bibs"], playerCount:"11 + GK" },
      { id:"crc_wg_el_03", name:"11v11 All Wide Conditions Active", duration:"90 mins", durationMinutes:90,
        coachRoleId:"winger_coach", phase:"winger_elite", ageGroup:"18+", source:"costa_rica_u14_session1",
        focusCategories:["full_match_application","all_wide_principles","self_coaching","professional_standard"],
        description:"Full 11v11 competitive match. All conditions active simultaneously: goal from a cross delivered inside the crossing corridor = 3 points. A turnover won by the winger pressing in the attacking third that leads to a goal within 8 seconds = 3 points. Normal goal = 1 point. Post-match: winger identifies one cross they should have delivered earlier and one inside-cut trigger they missed.",
        coachingPoints:["All wide play principles — inside cut, overlap trigger, crossing selection, wide pressing — are deployed simultaneously","Post-match self-analysis: identify the specific moment a better wide decision could have created a 3-point goal","Bilateral delivery: both flanks must be equally threatening — a winger who can only go one way becomes easy to defend"],
        milestoneContribution:"Full professional standard match application across all wide play roles", requiresEquipment:["full pitch","2 goals","crossing corridor cones","bibs"], playerCount:"22" },
      { id:"fra_wg_el_04", name:"Gegenpressing from Wide: 5-Second Recovery Sprint", duration:"25 mins", durationMinutes:25,
        coachRoleId:"winger_coach", phase:"winger_elite", ageGroup:"18+", source:"england_press_cover",
        focusCategories:["wide_gegenpressing","5_second_window","counter_press_from_wide","defensive_transition"],
        description:"5v5 compact match. When the winger loses the ball, they must win it back within 5 seconds by pressing at an angle that cuts off the backward pass to the fullback. Coach announces the time from loss to recovery after every turnover. Wingers who take longer than 5 seconds are rotated immediately — no exceptions.",
        coachingPoints:["The moment you lose the ball, press immediately at an angle to cut off the backward pass — not straight at the ball carrier","If you are the furthest player from the ball when it is lost, sprint to get between the ball and the goal — do not sprint to the ball","5-second window: if it is not won back, drop into shape — the moment has passed"],
        milestoneContribution:"Wide gegenpressing leadership — the professional standard for a complete attacking winger", requiresEquipment:["compact area cones","bibs","stopwatch"], playerCount:"10" },
      { id:"eng_wg_el_05", name:"Video Analysis + Wide Play Mental Rehearsal", duration:"30 mins", durationMinutes:30,
        coachRoleId:"winger_coach", phase:"winger_elite", ageGroup:"18+", source:"eca_youth_academy",
        focusCategories:["video_analysis","mental_rehearsal","self_coaching","professional_development"],
        description:"Player watches 3–5 clips of professional wingers executing: (1) the inside cut that triggers an overlap, (2) the first-time cross from a wide run, (3) the wide gegenpressing press. After each clip, player verbalises: 'What position was the fullback in when they cut inside? What crossing zone did they target? How quickly did they press after losing the ball?' Then mentally rehearse each movement 10 times.",
        coachingPoints:["Watch the winger's scan before they receive the ball wide — that is when the decision is being made, not when they act on it","The best wide players make the crossing decision before they touch the ball wide — their body shape tells you what they are going to do","Mental rehearsal: close your eyes and walk through the exact footwork, inside cut, and cross release motion 10 times"],
        milestoneContribution:"Self-directed professional development through video and mental rehearsal", requiresEquipment:["video access","notebook"], playerCount:"individual" },
    ],
  },
];



// ─────────────────────────────────────────────────────────────────────────────
// THE UNIFIED DRILL MATRIX
// 5 positions × 5 phases × 5 drills = 125 total drills
// ─────────────────────────────────────────────────────────────────────────────

export const FOOTBALL_POSITION_DRILLS: Record<PositionKey, PositionConfig> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // STRIKER — attack_coach
  // ═══════════════════════════════════════════════════════════════════════════
  striker: {
    key: "striker",
    title: "Striker & Attacking Forward Track",
    focus: "Attacking intent, positive first-touch control, creative blind turns, and clinical box execution.",
    coachRoleId: "attack_coach",
    color: "#c8962a",
    icon: "🔥",
    phases: STRIKER_PHASES,
    milestones: {
      striker_spark: ["Can stop a rolling ball with either foot cleanly","Scores at least once per session from 8m","Comfortable passing to a moving partner in a game","Genuinely enjoys training — the only non-negotiable"],
      striker_build: ["Scans (BOTS) before every receive in drills","Consistently receives on back foot with open body shape","Executes wall-pass and overlap combination with a partner","Understands when to drop short vs. run behind","Weaker foot can place a shot from 10m"],
      striker_develop: ["Executes blind turn past a passive defender at match speed","Scores consistently when played in behind the defensive line","Can identify Zone 14 and make the correct timed run","First-time finish from a cross is rehearsed and reliable","Can play 80 minutes competitively without physical drop-off"],
      striker_perform: ["Leads the team press from the front — knows triggers and angles","Blind turn and disguised lay-off under live defensive pressure","Scores from crosses: front post, back post, and cut-back","Sprint times, jump height, and finishing % tracked every 2 weeks","Turns 1v1 situations into goals more than 40% of the time"],
      striker_elite: ["Sprint times and finishing % improving across 8-week blocks","Post-session self-analysis is a habit — not a coach requirement","Scores from every chance type: blind turn, first-time cross, 1v1 vs keeper","Fitness output in final 15 mins matches the first 15","Can diagnose own tactical errors from video within 2 minutes"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIDFIELDER — midfield_coach
  // ═══════════════════════════════════════════════════════════════════════════
  midfielder: {
    key: "midfielder",
    title: "Central Midfield & Pivot Track",
    focus: "Pre-receipt shoulder scanning, open body shape, cover shadows, line-breaking passes, and tactical point switches.",
    coachRoleId: "midfield_coach",
    color: "#283593",
    icon: "🔄",
    phases: MIDFIELDER_PHASES,
    milestones: {
      midfielder_spark: ["Passes and immediately moves to a new position","Scans before receiving — head up before the ball arrives","Completes 5 consecutive passes in a keep-ball game","Enjoys playing in tight spaces with the ball"],
      midfielder_build: ["Scans (BOTS) before every receipt without prompting","Body shape is consistently open on the half-turn","Correctly identifies wall-pass vs. switch-of-play decision","Delivers penetrative passes with correct weight","Can sustain possession under pressure for 5+ passes"],
      midfielder_develop: ["Three-option scan (forward, wide, recycle) before every receive","Turns under pressure in the central channel without losing the ball","Transitions immediately from possession to pressing upon losing the ball","Line-breaking pass weight is correct — not too slow, not too fast","Reads the defensive block and adjusts circulation speed accordingly"],
      midfielder_perform: ["Leads the gegenpressing trigger from central areas","Cover shadow discipline is consistent — blocks central pivot players reliably","High block midfield engagement line is maintained without coaching reminders","Zone 14 penetrative passes are deliberately targeted in match context","Post-match: identifies one pressing trigger missed and one pass that should have been forward"],
      midfielder_elite: ["Three-option scan before receipt takes under 1 second","Gegenpressing window: ball won back within 5 seconds in 60%+ of turnovers","Deploys all three defensive systems (high, mid, low block) correctly in a single match","Self-analysis after every match is a habit","Physical and tactical output in the final 15 minutes matches the first 15"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFENDER — defence_coach
  // ═══════════════════════════════════════════════════════════════════════════
  defender: {
    key: "defender",
    title: "Defensive Unit & Fullback Track",
    focus: "Angled pressing approach, arm's-length pressure, deceleration braking, cover-recover structure, and 1v1 containment.",
    coachRoleId: "defence_coach",
    color: "#424242",
    icon: "🛡️",
    phases: DEFENDER_PHASES,
    milestones: {
      defender_spark: ["Positions between the ball and the goal instinctively","Recovers sprinting immediately after being beaten","Understands side-on stance for shepherding","Enjoys defending — making a save is as rewarding as scoring"],
      defender_build: ["Approaches at an angle — never straight on","Decelerates before contact — does not sprint past the ball carrier","Cover-recover: when the presser is beaten, the covering player steps out immediately","Reads pressing triggers: heavy touch, backward pass, body facing own goal","Wins the ball and counter-attacks immediately"],
      defender_develop: ["1v1 shepherding with directional dictation — forces attacker to weaker foot","Block shifts as a unit — correct 4–5m distances maintained","Transition speed: pressing to defending instantly on losing the ball","Mid-block structure: holds the 30m line of restraint without stepping early","Zonal defending: communicates zone changes verbally to teammates"],
      defender_perform: ["High block midfield engagement: pushes to the halfway line without coaching","Cover shadow discipline: positions between ball and central option consistently","9v8 phase of play: maintains backline-midfield vertical gap under 12m","Reads and reacts to pressing triggers collectively as a unit","Gegenpressing from wide: pressing angles cut off backward passes correctly"],
      defender_elite: ["All three defensive systems (high press, mid-block, low block) deployed correctly in one match","Post-match self-analysis: identifies one defensive mistake and one correct decision","Backline communication: calls line height, marks, and covering instructions vocally throughout","Physical output in the final 15 minutes of a match equals the first 15","Sweeper-keeper coordination: works with the goalkeeper to manage the line height in real time"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GOALKEEPER — gk_coach
  // ═══════════════════════════════════════════════════════════════════════════
  goalkeeper: {
    key: "goalkeeper",
    title: "Goalkeeper Elite Protocol",
    focus: "Balls-of-feet readiness, W and M hand shapes, side-of-body diving, angle coverage, sweeper-keeper positioning, and wide distribution.",
    coachRoleId: "gk_coach",
    color: "#1a237e",
    icon: "🥅",
    phases: GOALKEEPER_PHASES,
    milestones: {
      goalkeeper_spark: ["Two-handed catches are instinctive — never one-handed","Set position is correct before every shot attempt","Dives toward the ball rather than away from it","Distributes by rolling to a teammate after every save","Genuinely enjoys being in goal"],
      goalkeeper_build: ["W-shape and M-shape hand positions are instinctive — no prompting needed","Dives on the side of the body — not the stomach","Distributes wide within 3 seconds of securing the ball","Dynamic angle adjustment: rotates set position as the ball moves around the circle","Communicates verbally with defenders before every shot"],
      goalkeeper_develop: ["Claims high balls at the highest point with W-shape hands — calls 'KEEPER' every time","1v1 positioning: advances 6–8m off the goal line on 1v1 — does not stay on the line","Reflex saves: recovers to set position within 2 seconds of every save","Communicates the backline position after every clearance: 'hold' or 'push up'","Distribution is specific: method matches distance and receiver's movement"],
      goalkeeper_perform: ["Sweeper-keeper positioning: starts 12–15m off goal line when backline is at the halfway line","Distribution within 3 seconds launches counter-attacks consistently","Penalty anticipation: reads plant foot and non-kicking shoulder correctly","Wall management: positions the wall correctly before every free kick — independently of the captain","3-touch box dominance: claims every cross within their range, punches the rest"],
      goalkeeper_elite: ["Shot-stopping quality maintained through a 15-shot sequence without recovery time","Sweeper-keeper long ball sweeping: wins every long ball that drops behind a high backline","Distribution under physical fatigue: accuracy maintained after 200m sprint","Post-match self-analysis: identifies one save to improve and one distribution decision that was correct","Physical and mental output in the 90th minute matches the 1st minute"],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WINGER — winger_coach
  // ═══════════════════════════════════════════════════════════════════════════
  winger: {
    key: "winger",
    title: "Winger & Wide Play Track",
    focus: "Flank combination patterns, crossing delivery selection, overlapping fullback timing, inside-cut deception, and 2v1 wide overloads.",
    coachRoleId: "winger_coach",
    color: "#0d47a1",
    icon: "⚡",
    phases: WINGER_PHASES,
    milestones: {
      winger_spark: ["Dribbles through a zigzag with close ball control","Runs at pace with the ball staying within 1 step","Rolls a cross across the goal face to a target player","Scores from wide play in the small-sided game","Enjoys having the ball in 1v1 situations — does not shy away"],
      winger_build: ["Inside cut consistently pulls the opposing fullback out of position","Delivers all three cross types correctly: low driven, whipped to the spot, floated back post","Recognises when to go inside vs. outside based on the fullback's position","Triggers the overlapping fullback combination from memory — no coaching prompt needed","Bilateral: equal quality from both the left and right flank"],
      winger_develop: ["2v1 on the flank is converted into a cross or a shot more than 50% of the time","Crossing decision is made before the first touch wide — body shape tells the story","Opposite winger attacks the back post on every cross — not watching","Flank combination (A-B-C overlap pattern) is executed at match speed from memory","Reads the block circulation: knows when the flank has opened before the pass is played"],
      winger_perform: ["Bilateral crossing: delivers a quality cross from both flanks within a single session","Crossing selection is correct: reads the defensive line position to choose the right zone","Wide gegenpressing: cuts off the backward pass at an angle — not straight at the ball carrier","Pressing work rate in the attacking third earns turnovers that lead directly to goals","Post-match: identifies one inside-cut trigger missed and one crossing decision that was correct"],
      winger_elite: ["40 combined crossing repetitions (20 per flank) at sprint pace — quality maintained across all reps","First-time crosses are delivered with correct weight and direction in match conditions","Wide gegenpressing: ball won back within 5 seconds in 60%+ of wide turnovers","Post-match self-analysis: identifies one cross to improve and one pressing trigger missed","Physical output — sprint speed and crossing accuracy — in the 90th minute matches the 1st minute"],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE HELPER — keeps page.tsx working without changes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the flat drill list for a position + phase combination.
 * This is the drop-in replacement for `FOOTBALL_POSITION_DRILLS[position].drills`
 * used throughout page.tsx.
 *
 * If no phase is provided, returns all drills for the position (legacy behaviour).
 */
export function getPositionDrills(
  position: PositionKey,
  phase?: DrillPhase
): Drill[] {
  const positionConfig = FOOTBALL_POSITION_DRILLS[position];
  if (!positionConfig) return [];

  if (!phase) {
    return positionConfig.phases.flatMap((p) => p.drills);
  }

  const phaseConfig = positionConfig.phases.find((p) => p.phase === phase);
  return phaseConfig?.drills ?? [];
}

/**
 * Returns the PositionConfig for a given position — including title, focus,
 * coach role, and all phase data. This replaces the direct `FOOTBALL_POSITION_DRILLS[key]`
 * access pattern in page.tsx.
 */
export function getPositionConfig(position: PositionKey): PositionConfig | undefined {
  return FOOTBALL_POSITION_DRILLS[position];
}

/**
 * Returns the correct DrillPhase for a striker based on their age.
 * Used to auto-select the phase when a player loads the Talent Nurture Lab.
 */
export function getStrikerPhaseForAge(age: number): DrillPhase {
  if (age <= 9)  return "striker_spark";
  if (age <= 12) return "striker_build";
  if (age <= 15) return "striker_develop";
  if (age <= 18) return "striker_perform";
  return "striker_elite";
}

/**
 * Returns the correct DrillPhase for ANY position based on age.
 * Used to auto-select the phase when a player loads the Talent Nurture Lab.
 */
export function getPhaseForPosition(position: PositionKey, age: number): DrillPhase {
  const suffix = age <= 9 ? "spark" : age <= 12 ? "build" : age <= 15 ? "develop" : age <= 18 ? "perform" : "elite";
  if (position === "goalkeeper") return `goalkeeper_${suffix}` as DrillPhase;
  if (position === "defender")   return `defender_${suffix}` as DrillPhase;
  if (position === "midfielder") return `midfielder_${suffix}` as DrillPhase;
  if (position === "winger")     return `winger_${suffix}` as DrillPhase;
  return `striker_${suffix}` as DrillPhase;
}

/**
 * Maps a user's position string (from the player profile) to a PositionKey.
 * Replaces the `mapUserPositionToDrillPosition` function in page.tsx.
 */
export function mapPositionStringToKey(positionString: string): PositionKey {
  const p = positionString.toLowerCase();
  if (p.includes("strik") || p.includes("forward") || p.includes("cf") || p.includes("st"))
    return "striker";
  if (p.includes("wing") || p.includes("winger") || p.includes("lw") || p.includes("rw"))
    return "winger";
  if (p.includes("mid") || p.includes("cm") || p.includes("dm") || p.includes("am"))
    return "midfielder";
  if (p.includes("def") || p.includes("back") || p.includes("cb") || p.includes("lb") || p.includes("rb"))
    return "defender";
  if (p.includes("keep") || p.includes("goal") || p.includes("gk"))
    return "goalkeeper";
  return "striker"; // default
}

/**
 * Generates the Talent Passport report object.
 * Replaces the inline `generateTalentPassport` logic in page.tsx.
 */
export function generateTalentPassportReport(params: {
  playerName: string;
  position: PositionKey;
  phase: DrillPhase;
  completedDrillIds: string[];
}): {
  playerName: string;
  position: PositionKey;
  phase: DrillPhase;
  totalDrillsCompleted: number;
  totalAvailable: number;
  completionPercentage: number;
  totalPracticeMinutes: number;
  completedDrillsList: Drill[];
  milestones: string[];
  generatedDate: string;
} {
  const { playerName, position, phase, completedDrillIds } = params;
  const drills = getPositionDrills(position, phase);

  const completedDrills = drills.filter((d) => completedDrillIds.includes(d.id));
  const totalPracticeMinutes = completedDrills.reduce(
    (acc, d) => acc + d.durationMinutes,
    0
  );
  const positionConfig = FOOTBALL_POSITION_DRILLS[position];
  const milestones = positionConfig?.milestones[phase] ?? [];

  return {
    playerName,
    position,
    phase,
    totalDrillsCompleted: completedDrills.length,
    totalAvailable: drills.length,
    completionPercentage:
      drills.length > 0
        ? Math.round((completedDrills.length / drills.length) * 100)
        : 0,
    totalPracticeMinutes,
    completedDrillsList: completedDrills,
    milestones,
    generatedDate: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// THUTO PROMPT BUILDER (re-exported from coaching-staff context)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the THUTO system prompt fragment for a given drill.
 * Call this when a player taps "Start Drill" and opens a THUTO coaching session
 * for that specific drill.
 */
export function buildDrillThutoPrompt(drillId: string): string {
  // Find the drill across all positions and phases
  for (const positionKey of Object.keys(FOOTBALL_POSITION_DRILLS) as PositionKey[]) {
    const position = FOOTBALL_POSITION_DRILLS[positionKey];
    for (const phase of position.phases) {
      const drill = phase.drills.find((d) => d.id === drillId);
      if (drill) {
        return [
          `You are THUTO, the AI coaching assistant for GrassRoots Sports.`,
          `The player is currently working on the drill: "${drill.name}".`,
          `Phase: ${drill.phase} (${drill.ageGroup}).`,
          `Source: ${drill.source}.`,
          `Drill description: ${drill.description}`,
          `Coaching points for this drill:`,
          ...drill.coachingPoints.map((p, i) => `${i + 1}. ${p}`),
          `Focus categories: ${drill.focusCategories.join(", ")}.`,
          `Answer questions about this drill in detail. If the player asks about a different drill or topic, you may answer but always bring the conversation back to "${drill.name}" and how to execute it correctly.`,
          drill.milestoneContribution
            ? `This drill contributes to the following phase milestone: "${drill.milestoneContribution}".`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      }
    }
  }
  return "You are THUTO, the AI coaching assistant for GrassRoots Sports.";
}

/**
 * Returns all drills that belong to a specific coaching role.
 * Used by the Coach Hub to show a role's complete drill library.
 */
export function getDrillsByCoachRole(coachRoleId: string): Drill[] {
  const drills: Drill[] = [];
  for (const positionKey of Object.keys(FOOTBALL_POSITION_DRILLS) as PositionKey[]) {
    const position = FOOTBALL_POSITION_DRILLS[positionKey];
    for (const phase of position.phases) {
      drills.push(...phase.drills.filter((d) => d.coachRoleId === coachRoleId));
    }
  }
  return drills;
}