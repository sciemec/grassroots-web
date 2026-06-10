export interface BiomechanicalAssessment {
  player_id: string;
  assessment_type: "BIOMECHANICS";
  metrics: {
    mode: "SPRINT_KNEE_DRIVE" | "JUGGLING_CUSHION";
    score: number; // 1-100 Rating
    level: "Elite" | "Good" | "Raw";
    kinematics: {
      estimated_angle: number;
      asymmetry_detected: boolean;
      asymmetry_variance_pct: number;
      dominant_weak_side_gap: "none" | "left" | "right";
    };
    scouting_flags: {
      explosiveness_rating: "High" | "Medium" | "Low";
      injury_risk_profile: string;
    };
  };
  source_video_provider: "CLOUDFLARE_R2";
}