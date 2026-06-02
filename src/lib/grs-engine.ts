export interface EngineInput {
  testType: "20m_sprint" | "vertical_leap" | "pro_agility";
  durationSeconds: number; // Input parsed directly via video timestamp frame tracking
  ageGroup: "U8" | "U13" | "U17" | "Senior";
}

export interface EngineOutput {
  rawScore: string;
  percentile: number;
  tier: "Elite (Class A)" | "Competitive (Class B)" | "Developmental";
  scoutNarrative: string;
  recommendedPositions: string[];
  suggestedDrills: string[];
}

export function evaluateBiometrics({ testType, durationSeconds, ageGroup }: EngineInput): EngineOutput {
  // Safe execution defaults
  let percentile = 50;
  let tier: EngineOutput["tier"] = "Developmental";
  let rawScore = "";
  let scoutNarrative = "";
  let recommendedPositions: string[] = [];
  let suggestedDrills: string[] = [];

  // =========================================================================
  // 👶 SPECIALIZED COHORT PARADIGM: U8 JUNIOR MOTOR SKILLS TRAJECTORY LAYER
  // =========================================================================
  if (ageGroup === "U8") {
    if (testType === "20m_sprint") {
      rawScore = `${durationSeconds.toFixed(2)}s Junior Dash`;
      if (durationSeconds <= 4.50) {
        tier = "Elite (Class A)";
        percentile = 96;
        scoutNarrative = "Displays fantastic early-stage stride cadence and high-energy motor drive. Excellent natural baseline coordination for their age bracket.";
        recommendedPositions = ["Dynamic Attacking Playmaker", "High-Energy Utility Track"];
        suggestedDrills = ["Fun Zig-Zag Tag Games", "Single-Leg Balance Hops (5 Seconds Each Side)"];
      } else {
        tier = "Competitive (Class B)";
        percentile = 65;
        scoutNarrative = "Functional stride mechanics. Developing basic linear movement stability. Focus should remain heavily on physical literacy and playful engagement.";
        recommendedPositions = ["Traditional Wide Playmaker", "Zonal Progress Track"];
        suggestedDrills = ["Shuttle Toy Runs", "Animal Movement Strides (Frog Hops/Bear Crawls)"];
      }
    } 
    
    else if (testType === "vertical_leap") {
      const computedCm = Math.round(122.6 * Math.pow(durationSeconds, 2));
      const finalLeap = computedCm > 5 ? computedCm : Math.round(20 + (1 / durationSeconds) * 2);
      rawScore = `${finalLeap}cm Junior Jump`;
      
      if (finalLeap >= 25) {
        tier = "Elite (Class A)";
        percentile = 95;
        scoutNarrative = "Outstanding relative lower-body explosive landing extension. Absorbs kinetic ground forces safely without dynamic posture collapse.";
        recommendedPositions = ["Agile Sweeper Guard", "Forward Target Selector"];
        suggestedDrills = ["Two-Foot Bench Landings", "Soft Foam Box Jumps"];
      } else {
        tier = "Competitive (Class B)";
        percentile = 60;
        scoutNarrative = "Functional vertical displacement. Core lower limb extension is on track. Working on learning steady bilateral landing balance checks.";
        recommendedPositions = ["Midfield Link Core", "General Outfield Roster"];
        suggestedDrills = ["Ankle Elastic Bounces", "Vertical Squat Reaches"];
      }
    } 
    
    else {
      rawScore = `${durationSeconds.toFixed(2)}s Agile Loop`;
      if (durationSeconds <= 5.80) {
        tier = "Elite (Class A)";
        percentile = 94;
        scoutNarrative = "Remarkable spatial awareness and cognitive directional switching capacity. Retains structural balance completely during sharp direction resets.";
        recommendedPositions = ["Creative Midfield Pivot (No. 10)", "Inverted Box Carrier"];
        suggestedDrills = ["Color Cone Reaction Snaps", "Mini T-Test Dribble Fun Tracks"];
      } else {
        tier = "Competitive (Class B)";
        percentile = 55;
        scoutNarrative = "Solid multi-directional mobility tracking profile. Displays minor kinetic lag when planting feet to rotate hips against momentum vectors.";
        recommendedPositions = ["Defensive Anchor Track", "Flank Support Track"];
        suggestedDrills = ["Line Touch Footwork Races", "Lateral Cross-Over Ladder Drills"];
      }
    }
    return { rawScore, percentile, tier, scoutNarrative, recommendedPositions, suggestedDrills };
  }

  // =========================================================================
  // 🏃 BRACKET PARADIGM 1: 20M LINEAR SPRINT VECTOR (U13, U17, SENIOR)
  // =========================================================================
  if (testType === "20m_sprint") {
    rawScore = `${durationSeconds.toFixed(2)}s Burst Line`;
    
    if (durationSeconds <= 2.90) {
      tier = "Elite (Class A)";
      percentile = ageGroup === "U13" ? 99 : ageGroup === "U17" ? 96 : 91;
      scoutNarrative = "Possesses explosive initial acceleration patterns. Displays exceptional hip extension mechanics and early stride-frequency separation from a dead stop.";
      recommendedPositions = ["Winger (Inverted Channeller)", "Striker (Advanced Poacher)"];
      suggestedDrills = ["10m Flying Start Sprints", "Resisted Banded Acceleration Explosions"];
    } else if (durationSeconds <= 3.30) {
      tier = "Competitive (Class B)";
      percentile = ageGroup === "U13" ? 85 : ageGroup === "U17" ? 72 : 64;
      scoutNarrative = "Solid baseline velocity framework. Shows steady build-up phase but requires systemic refinement in low-angle drive projection over the initial 5 meters.";
      recommendedPositions = ["Fullback / Wingback", "Box-to-Box Midfielder"];
      suggestedDrills = ["Wall Drill Drive Posturing", "Falling Starts (5-to-15m Focus)"];
    } else {
      tier = "Developmental";
      percentile = ageGroup === "U13" ? 45 : 30;
      scoutNarrative = "Requires dedicated lower-body strength load training to correct a high upright postural bias during the early acceleration block.";
      recommendedPositions = ["Target Man Center-Forward", "Central Defender (Zonal Guardian)"];
      suggestedDrills = ["Hill Sprints (High Resistance)", "Sled Drags / Heavy Bounds"];
    }
  }

  // =========================================================================
  // 🦘 BRACKET PARADIGM 2: VERTICAL LEAP EXPLOSIVENESS (U13, U17, SENIOR)
  // =========================================================================
  else if (testType === "vertical_leap") {
    // Kinematic translation approximation: h = 1.226 * t^2
    const computedCm = Math.round(122.6 * Math.pow(durationSeconds, 2));
    const finalLeap = computedCm > 20 ? computedCm : Math.round(45 + (1 / durationSeconds) * 4); 
    rawScore = `${finalLeap}cm Separation Height`;

    if (finalLeap >= 60) {
      tier = "Elite (Class A)";
      percentile = ageGroup === "U13" ? 99 : ageGroup === "U17" ? 95 : 88;
      scoutNarrative = "Outstanding elastic rebound metrics. Demonstrates high vertical deceleration conversion rate, translating directly to elite aerial box dominance.";
      recommendedPositions = ["Central Defender (Stopper)", "Target Striker", "Goalkeeper"];
      suggestedDrills = ["Box Jumps (Depth Rebounds)", "Weighted Dumbbell Squat Jumps"];
    } else if (finalLeap >= 42) {
      tier = "Competitive (Class B)";
      percentile = ageGroup === "U13" ? 80 : ageGroup === "U17" ? 68 : 58;
      scoutNarrative = "Moderate vertical leap capability. Core hip expansion power is functional but shows energy leaks at triple extension takeoff phases.";
      recommendedPositions = ["Central Midfield Anchor", "Holding Midfielder"];
      suggestedDrills = ["Kettlebell Swings", "Unweighted Counter-Movement Jumps"];
    } else {
      tier = "Developmental";
      percentile = 25;
      scoutNarrative = "Limited concentric power generation. Requires deep plyometric loading routines to improve eccentric rate of force development.";
      recommendedPositions = ["Traditional Fullback", "Defensive Wide Outfield"];
      suggestedDrills = ["Ankle Hops", "Trap Bar Deadlifts (Explosive Phase)"];
    }
  }

  // =========================================================================
  // 🌪️ BRACKET PARADIGM 3: 5-10-5 PRO AGILITY CIRCUITS (U13, U17, SENIOR)
  // =========================================================================
  else {
    rawScore = `${durationSeconds.toFixed(2)}s Turning Loop`;

    if (durationSeconds <= 4.50) {
      tier = "Elite (Class A)";
      percentile = ageGroup === "U13" ? 98 : ageGroup === "U17" ? 94 : 89;
      scoutNarrative = "Remarkable deceleration brake control. Plants cleanly inside high-impact vectors with zero lateral knee drift or energy loss on directional weight transfers.";
      recommendedPositions = ["Attacking Midfielder (No. 10 Engine)", "Interpreting Wide Playmaker"];
      suggestedDrills = ["Deconstructive Line Plant Drills", "Cone T-Test Variations"];
    } else if (durationSeconds <= 5.10) {
      tier = "Competitive (Class B)";
      percentile = ageGroup === "U13" ? 78 : 64;
      scoutNarrative = "Functional lateral transitional flexibility. Slight baseline speed penalty observed during foot plant rotation transitions.";
      recommendedPositions = ["Defensive Sweeper", "Traditional Safe Fullback"];
      suggestedDrills = ["Lateral Ladder Cross-Overs", "Shuttle Sprints with Ball Snaps"];
    } else {
      tier = "Developmental";
      percentile = 28;
      scoutNarrative = "Wide turn tracking footprint observed. Needs directional balance development to avoid losing momentum during low center-of-gravity shifts.";
      recommendedPositions = ["Deep Target Center-Forward", "Zonal Central Guard"];
      suggestedDrills = ["Micro Agility Cone Weaves", "Lateral Banded Walks"];
    }
  }

  return { rawScore, percentile, tier, scoutNarrative, recommendedPositions, suggestedDrills };
}