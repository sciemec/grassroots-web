// src/types/tactics.ts

export type Position = 
  | "GK" | "RB" | "RCB" | "CB" | "LCB" | "LB"
  | "RWB" | "LWB" | "CDM" | "RM" | "RCM" | "CM" | "LCM" | "LM"
  | "RAM" | "CAM" | "LAM" | "RW" | "RS" | "ST" | "LS" | "LW";

export type Formation = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";

export interface PositionRole {
  id: Position;
  label: string;
  x: number;
  y: number;
  description: string;
  responsibilities: string[];
}

export interface FormationData {
  name: Formation;
  label: string;
  positions: PositionRole[];
  description: string;
  strengths: string[];
  weaknesses: string[];
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 0.5 | 1 | 1.5 | 2;
  currentPhase: "attacking" | "defending" | "transition" | "set_piece";
  time: number;
  ballPosition: { x: number; y: number };
  playerPositions: Record<string, { x: number; y: number }>;
  movementPaths: Array<{ id: string; points: { x: number; y: number }[] }>;
  passingLanes: Array<{ from: string; to: string; active: boolean }>;
  pressureZones: Array<{ x: number; y: number; radius: number; intensity: number }>;
}

export interface SimulationResult {
  attackingAnalysis: {
    effectiveness: number;
    keyPlayers: string[];
    patterns: string[];
    recommendations: string[];
  };
  defensiveAnalysis: {
    solidity: number;
    vulnerabilities: string[];
    recommendations: string[];
  };
  midfieldControl: {
    possession: number;
    passingAccuracy: number;
    keyPasses: number;
  };
}

export interface PositionTraining {
  position: Position;
  drills: Array<{
    id: string;
    name: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    focus: string[];
    animation?: unknown;
  }>;
}

export interface ChemistryIntegration {
  playerId: string;
  position: Position;
  chemistryScore: number;
  compatiblePlayers: string[];
  recommendedFormation: Formation;
  styleFit: {
    attacking: number;
    defending: number;
    transition: number;
    set_piece: number;
  };
}