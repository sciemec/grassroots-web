'use client';

/**
 * Evaluates raw biomechanical kinematics and profiles the athlete's optimal role.
 * @param {Object} metrics - Processed frame tracking numbers from the biometric engine
 */
export function classifyAthleteProfile(metrics) {
  const { verticalTakeoffVelocity, decelerationFrames, tSpineRotationDeg, limbSymmetryIndex } = metrics;
  
  let recommendedSport = "General Athletics";
  let recommendedPosition = "Universal Development Tier";
  let primaryAttribute = "Balanced Mobility";

  // Case 1: Elite Vertical Power & Acceleration
  if (verticalTakeoffVelocity > 4.2 && decelerationFrames <= 15) {
    primaryAttribute = "Explosive Verticality & Reactive Elasticity";
    recommendedSport = "Football / Basketball";
    recommendedPosition = "Winger / Goalkeeper / Basketball Guard";
  }
  // Case 2: Multi-directional Agility & Dynamic Braking Force
  else if (decelerationFrames < 12 && tSpineRotationDeg > 40) {
    primaryAttribute = "Elite Change-of-Direction & Lateral Deceleration";
    recommendedSport = "Football / Rugby / Tennis";
    recommendedPosition = "Defensive Midfielder / Fullback / Rugby Sevens Back";
  }
  // Case 3: Deep Mobility, Flexibility, & Rotational Torque
  else if (tSpineRotationDeg >= 50 && limbSymmetryIndex > 90) {
    primaryAttribute = "Thoracic Rotational Torque & Kinetic Stability";
    recommendedSport = "Cricket / Football Playmaker / Combat Sports";
    recommendedPosition = "Central Box-to-Box Midfielder / Fast Bowler";
  }
  // Case 4: Power Distribution with Structural Stability
  else if (verticalTakeoffVelocity > 3.5 && limbSymmetryIndex > 92) {
    primaryAttribute = "Symmetric Power Distribution & Structural Strength";
    recommendedSport = "Football / Netball / Volleyball";
    recommendedPosition = "Center Back / Target Forward / Netball Shooter";
  }

  return {
    primaryAttribute,
    recommendedSport,
    recommendedPosition,
    scoutingConfidence: Math.round(75 + (limbSymmetryIndex / 10))
  };
}