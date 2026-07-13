// src/lib/tactics-engine.ts

import { Formation, FormationData, SimulationState, Position } from "@/types/tactics";

export const FORMATIONS: Record<Formation, FormationData> = {
  "4-3-3": {
    name: "4-3-3",
    label: "4-3-3",
    description: "Balanced formation with width and attacking fluidity",
    strengths: ["Width", "Attacking options", "Pressing"],
    weaknesses: ["Central midfield gaps", "Counter-attack vulnerability"],
    positions: [
      { id: "GK", label: "GK", x: 50, y: 90, description: "Shot stopping, distribution", responsibilities: ["Organize defense", "Start attacks"] },
      { id: "RB", label: "RB", x: 82, y: 72, description: "Defend, overlap, cross", responsibilities: ["Track wingers", "Provide width"] },
      { id: "RCB", label: "RCB", x: 62, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover RB", "Defend crosses"] },
      { id: "LCB", label: "LCB", x: 38, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover LB", "Defend crosses"] },
      { id: "LB", label: "LB", x: 18, y: 72, description: "Defend, overlap, cross", responsibilities: ["Track wingers", "Provide width"] },
      { id: "CM", label: "CM", x: 50, y: 50, description: "Box-to-box, link play", responsibilities: ["Connect defense to attack", "Press"] },
      { id: "RM", label: "RM", x: 75, y: 52, description: "Width, crosses, tracking", responsibilities: ["Track back", "Provide width"] },
      { id: "LM", label: "LM", x: 25, y: 52, description: "Width, crosses, tracking", responsibilities: ["Track back", "Provide width"] },
      { id: "RW", label: "RW", x: 78, y: 24, description: "Pace, dribbling, goals", responsibilities: ["Stretch defense", "Cut inside"] },
      { id: "ST", label: "ST", x: 50, y: 18, description: "Goals, hold-up play", responsibilities: ["Score goals", "Bring others in"] },
      { id: "LW", label: "LW", x: 22, y: 24, description: "Pace, dribbling, goals", responsibilities: ["Stretch defense", "Cut inside"] },
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    label: "4-4-2",
    description: "Traditional balanced formation with two strikers",
    strengths: ["Defensive solidity", "Two strikers", "Direct play"],
    weaknesses: ["Central midfield overload", "Wide areas"],
    positions: [
      { id: "GK", label: "GK", x: 50, y: 90, description: "Shot stopping, distribution", responsibilities: ["Organize defense"] },
      { id: "RB", label: "RB", x: 82, y: 72, description: "Defend, overlap", responsibilities: ["Track wingers"] },
      { id: "RCB", label: "RCB", x: 62, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover RB"] },
      { id: "LCB", label: "LCB", x: 38, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover LB"] },
      { id: "LB", label: "LB", x: 18, y: 72, description: "Defend, overlap", responsibilities: ["Track wingers"] },
      { id: "RM", label: "RM", x: 82, y: 50, description: "Width, crosses, tracking", responsibilities: ["Track back"] },
      { id: "RCM", label: "RCM", x: 60, y: 50, description: "Box-to-box, link play", responsibilities: ["Connect play"] },
      { id: "LCM", label: "LCM", x: 40, y: 50, description: "Box-to-box, link play", responsibilities: ["Connect play"] },
      { id: "LM", label: "LM", x: 18, y: 50, description: "Width, crosses, tracking", responsibilities: ["Track back"] },
      { id: "RS", label: "RS", x: 65, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
      { id: "LS", label: "LS", x: 35, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    label: "4-2-3-1",
    description: "Defensive solidity with creative attacking midfield",
    strengths: ["Defensive cover", "Creative midfield", "Counter-attacks"],
    weaknesses: ["Isolated striker", "Wide protection"],
    positions: [
      { id: "GK", label: "GK", x: 50, y: 90, description: "Shot stopping, distribution", responsibilities: ["Organize defense"] },
      { id: "RB", label: "RB", x: 82, y: 72, description: "Defend, overlap", responsibilities: ["Track wingers"] },
      { id: "RCB", label: "RCB", x: 62, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover RB"] },
      { id: "LCB", label: "LCB", x: 38, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover LB"] },
      { id: "LB", label: "LB", x: 18, y: 72, description: "Defend, overlap", responsibilities: ["Track wingers"] },
      { id: "RCDM", label: "RCDM", x: 62, y: 60, description: "Protect defense, recycle", responsibilities: ["Screen defense", "Distribute"] },
      { id: "LCDM", label: "LCDM", x: 38, y: 60, description: "Protect defense, recycle", responsibilities: ["Screen defense", "Distribute"] },
      { id: "CAM", label: "CAM", x: 50, y: 40, description: "Creativity, goals, assists", responsibilities: ["Find passes", "Score"] },
      { id: "RW", label: "RW", x: 75, y: 28, description: "Pace, dribbling, goals", responsibilities: ["Stretch defense"] },
      { id: "LW", label: "LW", x: 25, y: 28, description: "Pace, dribbling, goals", responsibilities: ["Stretch defense"] },
      { id: "ST", label: "ST", x: 50, y: 16, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    label: "3-5-2",
    description: "Wing-back based formation with central dominance",
    strengths: ["Central control", "Wing-back width", "Two strikers"],
    weaknesses: ["Wing-back defensive work", "Central congestion"],
    positions: [
      { id: "GK", label: "GK", x: 50, y: 90, description: "Shot stopping, distribution", responsibilities: ["Organize defense"] },
      { id: "RCB", label: "RCB", x: 70, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover wing-back"] },
      { id: "CB", label: "CB", x: 50, y: 78, description: "Aerial dominance, organizing", responsibilities: ["Lead defense"] },
      { id: "LCB", label: "LCB", x: 30, y: 75, description: "Aerial dominance, tackling", responsibilities: ["Cover wing-back"] },
      { id: "RWB", label: "RWB", x: 88, y: 55, description: "Width, crosses, tracking", responsibilities: ["Attack wide", "Defend wide"] },
      { id: "RM", label: "RM", x: 67, y: 50, description: "Width, crosses, tracking", responsibilities: ["Support attack"] },
      { id: "CM", label: "CM", x: 50, y: 48, description: "Box-to-box, link play", responsibilities: ["Control midfield"] },
      { id: "LM", label: "LM", x: 33, y: 50, description: "Width, crosses, tracking", responsibilities: ["Support attack"] },
      { id: "LWB", label: "LWB", x: 12, y: 55, description: "Width, crosses, tracking", responsibilities: ["Attack wide", "Defend wide"] },
      { id: "RS", label: "RS", x: 65, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
      { id: "LS", label: "LS", x: 35, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    label: "5-3-2",
    description: "Defensive solidity with wing-backs and two strikers",
    strengths: ["Defensive strength", "Wing-back width", "Counter-attacks"],
    weaknesses: ["Midfield outnumbered", "Wing-back workload"],
    positions: [
      { id: "GK", label: "GK", x: 50, y: 90, description: "Shot stopping, distribution", responsibilities: ["Organize defense"] },
      { id: "RWB", label: "RWB", x: 88, y: 68, description: "Width, crosses, tracking", responsibilities: ["Attack wide", "Defend wide"] },
      { id: "RCB", label: "RCB", x: 72, y: 76, description: "Aerial dominance, tackling", responsibilities: ["Cover RWB"] },
      { id: "CB", label: "CB", x: 50, y: 80, description: "Aerial dominance, organizing", responsibilities: ["Lead defense"] },
      { id: "LCB", label: "LCB", x: 28, y: 76, description: "Aerial dominance, tackling", responsibilities: ["Cover LWB"] },
      { id: "LWB", label: "LWB", x: 12, y: 68, description: "Width, crosses, tracking", responsibilities: ["Attack wide", "Defend wide"] },
      { id: "RM", label: "RM", x: 68, y: 50, description: "Width, crosses, tracking", responsibilities: ["Support attack"] },
      { id: "CM", label: "CM", x: 50, y: 48, description: "Box-to-box, link play", responsibilities: ["Control midfield"] },
      { id: "LM", label: "LM", x: 32, y: 50, description: "Width, crosses, tracking", responsibilities: ["Support attack"] },
      { id: "RS", label: "RS", x: 65, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
      { id: "LS", label: "LS", x: 35, y: 20, description: "Goals, hold-up play", responsibilities: ["Score goals"] },
    ],
  },
};

// Simulation engine
export class TacticsSimulator {
  private state: SimulationState;

  constructor(formation: Formation) {
    const positions = FORMATIONS[formation].positions;
    const playerPositions: Record<string, { x: number; y: number }> = {};
    positions.forEach(p => {
      playerPositions[p.id] = { x: p.x, y: p.y };
    });

    this.state = {
      isPlaying: false,
      speed: 1,
      currentPhase: "attacking",
      time: 0,
      ballPosition: { x: 50, y: 50 },
      playerPositions,
      movementPaths: [],
      passingLanes: [],
      pressureZones: [],
    };
  }

  simulateAttack(phase: "build_up" | "final_third" | "shot") {
    // Attack simulation logic
    const movements = this.generateAttackingMovement(phase);
    const passes = this.generatePassingLanes("attacking");
    const pressure = this.generatePressureZones("attacking");

    return {
      movements,
      passes,
      pressure,
      effectiveness: this.calculateAttackEffectiveness(),
    };
  }

  simulateDefense(phase: "low_block" | "high_press" | "transition") {
    const movements = this.generateDefensiveMovement(phase);
    const coverage = this.generateDefensiveCoverage();
    const pressure = this.generatePressureZones("defending");

    return {
      movements,
      coverage,
      pressure,
      solidity: this.calculateDefensiveSolidity(),
    };
  }

  simulateMidfield(phase: "possession" | "counter" | "pressing") {
    const movements = this.generateMidfieldMovement(phase);
    const passing = this.generatePassingLanes("midfield");
    const control = this.calculateMidfieldControl();

    return {
      movements,
      passing,
      control,
    };
  }

  simulateSetPiece(type: "corner" | "free_kick" | "throw_in" | "penalty") {
    const setup = this.generateSetPieceSetup(type);
    const runs = this.generateSetPieceRuns(type);
    const targets = this.generateSetPieceTargets(type);

    return {
      setup,
      runs,
      targets,
      successRate: this.calculateSetPieceSuccess(type),
    };
  }

  private generateAttackingMovement(phase: string) {
    // Generate realistic attacking movement patterns
    const movements = [];
    const positions = Object.keys(this.state.playerPositions);
    
    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      // Movement based on position
      const dx = (Math.random() - 0.5) * 10;
      const dy = (Math.random() - 0.5) * 8;
      
      movements.push({
        id: pos,
        from: current,
        to: {
          x: Math.max(5, Math.min(95, current.x + dx)),
          y: Math.max(5, Math.min(95, current.y + dy)),
        },
        timing: Math.random() * 2,
        type: phase === "build_up" ? "support" : "penetrate",
      });
    }

    return movements;
  }

  private generateDefensiveMovement(phase: string) {
    // Generate defensive positioning
    const movements = [];
    const positions = Object.keys(this.state.playerPositions);
    
    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      // Defensive shift
      const shift = phase === "low_block" ? 10 : -5;
      movements.push({
        id: pos,
        from: current,
        to: {
          x: Math.max(5, Math.min(95, current.x + shift * 0.5)),
          y: Math.max(5, Math.min(95, current.y + shift * 0.3)),
        },
        timing: 0.5,
        type: "cover",
      });
    }

    return movements;
  }

  private generateMidfieldMovement(phase: string) {
    // Midfield positioning and passing
    const movements = [];
    const midfielders = ["RM", "RCM", "CM", "LCM", "LM", "CDM", "CAM"];
    
    for (const pos of midfielders) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      // Midfield rotation
      const rotate = phase === "possession" ? 0 : 8;
      movements.push({
        id: pos,
        from: current,
        to: {
          x: Math.max(5, Math.min(95, current.x + rotate)),
          y: Math.max(5, Math.min(95, current.y + (Math.random() - 0.5) * 6)),
        },
        timing: 0.3,
        type: "rotate",
      });
    }

    return movements;
  }

  private generateSetPieceSetup(type: string) {
    // Set piece positioning
    const setup: Record<string, { x: number; y: number }> = {};
    const positions = Object.keys(this.state.playerPositions);
    
    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      if (type === "corner") {
        // Corner kick setup
        if (["ST", "RS", "LS"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 20, y: 25 + Math.random() * 15 };
        } else if (["CB", "RCB", "LCB"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 30, y: 30 + Math.random() * 20 };
        } else {
          setup[pos] = { x: current.x, y: current.y + 10 };
        }
      } else if (type === "free_kick") {
        // Free kick setup
        if (["ST", "RS", "LS", "RW", "LW"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 15, y: 20 + Math.random() * 10 };
        } else {
          setup[pos] = { x: current.x + (Math.random() - 0.5) * 10, y: current.y + (Math.random() - 0.5) * 10 };
        }
      } else {
        setup[pos] = current;
      }
    }

    return setup;
  }

  private generateSetPieceRuns(type: string) {
    // Generate set piece runs
    const runs = [];
    const attackers = ["ST", "RS", "LS", "RW", "LW", "CAM"];
    
    for (const pos of attackers) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      runs.push({
        id: pos,
        from: current,
        to: {
          x: Math.max(5, Math.min(95, current.x + (Math.random() - 0.5) * 30)),
          y: Math.max(5, Math.min(95, current.y - 10 - Math.random() * 15)),
        },
        timing: 0.5 + Math.random() * 0.5,
        angle: Math.random() * 360,
        type: type === "corner" ? "near_post" : "wall",
      });
    }

    return runs;
  }

  private generateSetPieceTargets(_type: string) {
    // Target zones for set pieces
    const targets = [];
    const zones = [
      { x: 40, y: 30, label: "Near Post" },
      { x: 60, y: 30, label: "Far Post" },
      { x: 50, y: 20, label: "Central" },
      { x: 35, y: 40, label: "Six Yard Box" },
      { x: 65, y: 40, label: "Six Yard Box" },
    ];

    for (const zone of zones) {
      targets.push({
        ...zone,
        probability: Math.random() * 100,
        success: Math.random() > 0.3,
      });
    }

    return targets;
  }

  private calculateAttackEffectiveness(): number {
    return Math.round(50 + Math.random() * 40);
  }

  private calculateDefensiveSolidity(): number {
    return Math.round(50 + Math.random() * 40);
  }

  private generateDefensiveCoverage() {
    const coverage = [];
    const defenders = ["CB", "RCB", "LCB", "RB", "LB", "CDM", "RCDM", "LCDM"];

    for (const pos of defenders) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      coverage.push({
        id: pos,
        position: current,
        radius: 12 + Math.random() * 8,
        intensity: 60 + Math.random() * 35,
      });
    }

    return coverage;
  }

  private calculateMidfieldControl(): { possession: number; passingAccuracy: number; keyPasses: number } {
    return {
      possession: Math.round(45 + Math.random() * 30),
      passingAccuracy: Math.round(65 + Math.random() * 30),
      keyPasses: Math.round(2 + Math.random() * 8),
    };
  }

  private calculateSetPieceSuccess(_type: string): number {
    return Math.round(30 + Math.random() * 50);
  }

  private generatePassingLanes(_context: string) {
    const lanes = [];
    const positions = Object.keys(this.state.playerPositions);
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (Math.random() > 0.7) continue;
        const from = this.state.playerPositions[positions[i]];
        const to = this.state.playerPositions[positions[j]];
        if (!from || !to) continue;

        const distance = Math.sqrt(
          Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
        );
        
        lanes.push({
          from: positions[i],
          to: positions[j],
          active: distance < 30 && Math.random() > 0.3,
        });
      }
    }

    return lanes;
  }

  private generatePressureZones(context: string) {
    const zones = [];
    
    if (context === "attacking") {
      // Attacking pressure in final third
      zones.push({
        x: 40 + Math.random() * 20,
        y: 15 + Math.random() * 20,
        radius: 10 + Math.random() * 10,
        intensity: 60 + Math.random() * 30,
      });
    } else if (context === "defending") {
      // Defensive pressure
      zones.push({
        x: 40 + Math.random() * 20,
        y: 70 + Math.random() * 20,
        radius: 10 + Math.random() * 10,
        intensity: 50 + Math.random() * 40,
      });
    }

    return zones;
  }

  getState() {
    return this.state;
  }

  updateState(newState: Partial<SimulationState>) {
    this.state = { ...this.state, ...newState };
  }

  togglePlay() {
    this.state.isPlaying = !this.state.isPlaying;
  }

  setSpeed(speed: 0.5 | 1 | 1.5 | 2) {
    this.state.speed = speed;
  }

  setPhase(phase: "attacking" | "defending" | "transition" | "set_piece") {
    this.state.currentPhase = phase;
  }
}