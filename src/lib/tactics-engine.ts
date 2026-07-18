// src/lib/tactics-engine.ts

import { Formation, FormationData, SimulationState } from "@/types/tactics";

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
    this.state = this.buildInitialState(formation);
  }

  private buildInitialState(formation: Formation): SimulationState {
    const positions = FORMATIONS[formation].positions;
    const playerPositions: Record<string, { x: number; y: number }> = {};
    positions.forEach(p => {
      playerPositions[p.id] = { x: p.x, y: p.y };
    });
    return {
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

  // Reset to a new formation — keeps isPlaying and speed
  resetFormation(formation: Formation) {
    const wasPlaying = this.state.isPlaying;
    const speed = this.state.speed;
    const phase = this.state.currentPhase;
    this.state = this.buildInitialState(formation);
    this.state.isPlaying = wasPlaying;
    this.state.speed = speed;
    this.state.currentPhase = phase;
  }

  // Called every animation frame when isPlaying — moves ball along phase-specific path
  tick(delta: number) {
    if (!this.state.isPlaying) return;
    this.state.time += delta * this.state.speed;
    const t = this.state.time;

    switch (this.state.currentPhase) {
      case "attacking":
        this.state.ballPosition = {
          x: Math.max(10, Math.min(90, 50 + 20 * Math.sin(t * 0.7))),
          y: Math.max(10, Math.min(90, 28 + 14 * Math.cos(t * 1.1))),
        };
        break;
      case "defending":
        this.state.ballPosition = {
          x: Math.max(10, Math.min(90, 50 + 16 * Math.sin(t * 0.5))),
          y: Math.max(10, Math.min(90, 65 + 10 * Math.cos(t * 0.8))),
        };
        break;
      case "transition":
        this.state.ballPosition = {
          x: Math.max(10, Math.min(90, 50 + 22 * Math.sin(t * 0.6))),
          y: Math.max(10, Math.min(90, 50 + 18 * Math.cos(t * 0.9))),
        };
        break;
      case "set_piece":
        // Ball stays at delivery position, only slight wobble
        this.state.ballPosition = {
          x: Math.max(2, Math.min(98, this.state.ballPosition.x + Math.sin(t * 3) * 0.3)),
          y: Math.max(2, Math.min(98, this.state.ballPosition.y + Math.cos(t * 3) * 0.3)),
        };
        break;
    }
  }

  simulateAttack(phase: "build_up" | "final_third" | "shot") {
    const movements = this.generateAttackingMovement(phase);
    const passes = this.generatePassingLanes("attacking");
    const pressure = this.generatePressureZones("attacking");
    const effectiveness = this.calculateAttackEffectiveness();

    // Write results back into state so canvas renders them
    this.state.movementPaths = movements.map(m => ({
      id: m.id,
      points: [m.from, m.to],
    }));
    this.state.passingLanes = passes;
    this.state.pressureZones = pressure;
    this.state.ballPosition = {
      x: 50 + (Math.random() - 0.5) * 22,
      y: 20 + Math.random() * 18,
    };

    return { movements, passes, pressure, effectiveness };
  }

  simulateDefense(phase: "low_block" | "high_press" | "transition") {
    const movements = this.generateDefensiveMovement(phase);
    const coverage = this.generateDefensiveCoverage();
    const pressure = this.generatePressureZones("defending");
    const solidity = this.calculateDefensiveSolidity();

    this.state.movementPaths = movements.map(m => ({
      id: m.id,
      points: [m.from, m.to],
    }));
    this.state.pressureZones = pressure;
    this.state.passingLanes = [];
    this.state.ballPosition = {
      x: 50 + (Math.random() - 0.5) * 22,
      y: 62 + Math.random() * 18,
    };

    return { movements, coverage, pressure, solidity };
  }

  simulateMidfield(phase: "possession" | "counter" | "pressing") {
    const movements = this.generateMidfieldMovement(phase);
    const passing = this.generatePassingLanes("midfield");
    const control = this.calculateMidfieldControl();

    this.state.movementPaths = movements.map(m => ({
      id: m.id,
      points: [m.from, m.to],
    }));
    this.state.passingLanes = passing;
    this.state.pressureZones = [];
    this.state.ballPosition = { x: 50, y: 50 };

    return { movements, passing, control };
  }

  simulateSetPiece(type: "corner" | "free_kick" | "throw_in" | "penalty") {
    const setup = this.generateSetPieceSetup(type);
    const runs = this.generateSetPieceRuns(type);
    const targets = this.generateSetPieceTargets(type);
    const successRate = this.calculateSetPieceSuccess(type);

    // Reposition players for the set piece
    for (const [id, pos] of Object.entries(setup)) {
      if (this.state.playerPositions[id]) {
        this.state.playerPositions[id] = pos;
      }
    }
    this.state.movementPaths = runs.map(r => ({
      id: r.id,
      points: [r.from, r.to],
    }));
    this.state.passingLanes = [];
    this.state.pressureZones = [];

    const ballPositions: Record<string, { x: number; y: number }> = {
      corner:    { x: 2, y: 5 },
      free_kick: { x: 50, y: 28 },
      penalty:   { x: 50, y: 16 },
      throw_in:  { x: 5, y: 40 },
    };
    this.state.ballPosition = ballPositions[type] ?? { x: 50, y: 30 };

    return { setup, runs, targets, successRate };
  }

  private generateAttackingMovement(phase: string) {
    const movements = [];
    const positions = Object.keys(this.state.playerPositions);

    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      const dx = (Math.random() - 0.5) * 10;
      const dy = (Math.random() - 0.5) * 8;

      movements.push({
        id: pos,
        from: { ...current },
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
    const movements = [];
    const positions = Object.keys(this.state.playerPositions);

    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      const shift = phase === "low_block" ? 10 : -5;
      movements.push({
        id: pos,
        from: { ...current },
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
    const movements = [];
    const midfielders = ["RM", "RCM", "CM", "LCM", "LM", "CDM", "CAM", "RCDM", "LCDM"];

    for (const pos of midfielders) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      const rotate = phase === "possession" ? 0 : 8;
      movements.push({
        id: pos,
        from: { ...current },
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
    const setup: Record<string, { x: number; y: number }> = {};
    const positions = Object.keys(this.state.playerPositions);

    for (const pos of positions) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      if (type === "corner") {
        if (["ST", "RS", "LS"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 20, y: 25 + Math.random() * 15 };
        } else if (["CB", "RCB", "LCB"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 30, y: 30 + Math.random() * 20 };
        } else {
          setup[pos] = { x: current.x, y: Math.min(95, current.y + 10) };
        }
      } else if (type === "free_kick") {
        if (["ST", "RS", "LS", "RW", "LW"].includes(pos)) {
          setup[pos] = { x: 50 + (Math.random() - 0.5) * 15, y: 20 + Math.random() * 10 };
        } else {
          setup[pos] = {
            x: Math.max(5, Math.min(95, current.x + (Math.random() - 0.5) * 10)),
            y: Math.max(5, Math.min(95, current.y + (Math.random() - 0.5) * 10)),
          };
        }
      } else {
        setup[pos] = current;
      }
    }

    return setup;
  }

  private generateSetPieceRuns(type: string) {
    const runs = [];
    const attackers = ["ST", "RS", "LS", "RW", "LW", "CAM"];

    for (const pos of attackers) {
      const current = this.state.playerPositions[pos];
      if (!current) continue;

      runs.push({
        id: pos,
        from: { ...current },
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
      zones.push({
        x: 40 + Math.random() * 20,
        y: 15 + Math.random() * 20,
        radius: 10 + Math.random() * 10,
        intensity: 60 + Math.random() * 30,
      });
    } else if (context === "defending") {
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
