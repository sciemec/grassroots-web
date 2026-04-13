// THUTO Conditioning — TypeScript interfaces matching the exercise_cards DB schema

export type ExerciseCategory =
  | "fifa_warmup"
  | "aerobic"
  | "hiit"
  | "strength"
  | "agility"
  | "plyometrics";

export type EquipmentTier = "zero" | "basic" | "gym";

export type PhaseOfPlay =
  | "in_possession"
  | "out_of_possession"
  | "transition_attacking"
  | "transition_defending"
  | "general";

export type PositionTag =
  | "goalkeeper"
  | "winger"
  | "midfielder"
  | "defender"
  | "striker"
  | "fullback";

export type IntensityFelt = "easy" | "moderate" | "hard" | "max";

export type SessionType = ExerciseCategory | "full";

export interface ExerciseCard {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment_tier: EquipmentTier;
  difficulty_level: 1 | 2 | 3;
  duration_seconds: number | null;
  reps: string | null;
  instructions: string[];
  muscles_targeted: string[];
  football_benefit: string;
  phase_of_play: PhaseOfPlay;
  position_tags: PositionTag[];
  age_min: number;
  age_max: number;
  thuto_question: string;
  success_feels_like: string;
  is_fifa_11plus: boolean;
  is_active: boolean;
}

export interface ConditioningSession {
  id: string;
  session_type: SessionType;
  cards_used: string[];
  duration_actual: number; // minutes
  intensity_felt: IntensityFelt;
  joy_response: string | null;
  notes: string | null;
  logged_at: string; // ISO timestamp
}
