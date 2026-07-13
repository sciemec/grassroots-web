// src/types/tactical.ts

export interface TacticalMovement {
  id: string;
  playerId: string;
  position: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  path: Array<{ x: number; y: number }>;
  timing: {
    startTime: number;      // seconds from start
    duration: number;       // seconds
    delay: number;          // seconds before movement starts
  };
  type: "run" | "pass" | "dribble" | "cross" | "shot" | "press" | "cover";
  description: string;
  color: string;
  arrow: boolean;
  label?: string;
}

export interface TacticalLesson {
  id: string;
  title: string;
  description: string;
  coachId: string;
  coachName: string;
  formation: string;
  phase: "attacking" | "defending" | "transition" | "set_piece";
  duration: number;           // total simulation time in seconds
  movements: TacticalMovement[];
  notes: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  updatedAt: string;
  shared: boolean;
}

export interface LessonAssignment {
  id: string;
  lessonId: string;
  playerId: string;
  playerName: string;
  assignedAt: string;
  dueDate?: string;
  status: "pending" | "viewed" | "learning" | "completed" | "needs_review";
  progress: number;           // 0-100
  comprehensionScore?: number;
  attempts: number;
  lastViewed?: string;
  notes?: string;
  feedback?: string;
}

export interface PlayerProgress {
  playerId: string;
  totalLessons: number;
  completedLessons: number;
  inProgress: number;
  averageScore: number;
  strengths: string[];
  weaknesses: string[];
  recentLessons: LessonAssignment[];
}

export interface TacticalSimulation {
  id: string;
  lessonId: string;
  state: "idle" | "playing" | "paused" | "complete";
  currentTime: number;
  speed: 0.5 | 1 | 1.5 | 2;
  movements: TacticalMovement[];
  completedMovements: string[];
  activeMovements: string[];
  playback: {
    progress: number;   // 0-100 percentage through total duration
    timestamp: number;  // wall-clock ms when last play/pause occurred
  };
}