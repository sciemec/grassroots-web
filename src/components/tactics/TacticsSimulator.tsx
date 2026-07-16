// src/components/tactics/TacticsSimulator.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Icons from "lucide-react";
import { TacticsSimulator as TacticsSimulatorEngine } from "@/lib/tactics-engine";
import { Formation, SimulationState, ChemistryIntegration } from "@/types/tactics";
import PitchView from "./PitchView";
import SimulationControls from "./SimulationControls";
import TacticalOverlay from "./TacticalOverlay";
import FormationSelector from "./FormationSelector";

interface TacticsSimulatorProps {
  mode: "player" | "coach";
  userId?: string;
  position?: string;
  chemistryData?: ChemistryIntegration;
  onSimulationComplete?: (result: Record<string, unknown>) => void;
}

// Normalized shape the overlay expects — one flat object regardless of phase
export interface AnalysisState {
  type: string;
  recommendation: string;
  successRate?: number;
  riskLevel?: number;
  possession?: number;
  passingAccuracy?: number;
  keyPasses?: number;
}

export default function TacticsSimulator({
  mode,
  position,
  chemistryData,
  onSimulationComplete,
}: TacticsSimulatorProps) {
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [phase, setPhase] = useState<"attacking" | "defending" | "transition" | "set_piece">("attacking");
  const [simulator] = useState(() => new TacticsSimulatorEngine(formation));
  const [state, setState] = useState<SimulationState>(simulator.getState());
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(position || null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPassingLanes, setShowPassingLanes] = useState(true);
  const [showPressure, setShowPressure] = useState(true);
  const animationRef = useRef<number | null>(null);

  // Run simulation — generates movements/lanes/zones AND syncs canvas state
  const runSimulation = useCallback((activePhase: "attacking" | "defending" | "transition" | "set_piece" = phase) => {
    let result: Record<string, unknown> = {};

    switch (activePhase) {
      case "attacking": {
        const r = simulator.simulateAttack("build_up");
        result = r;
        setAnalysis({
          type: "attacking",
          successRate: r.effectiveness,
          riskLevel: Math.round(100 - r.effectiveness),
          recommendation: "Focus on quick combination play and early runs into the final third.",
        });
        break;
      }
      case "defending": {
        const r = simulator.simulateDefense("low_block");
        result = r;
        setAnalysis({
          type: "defending",
          successRate: r.solidity,
          riskLevel: Math.round(100 - r.solidity),
          recommendation: "Maintain compact shape, delay the opposition, and force wide.",
        });
        break;
      }
      case "transition": {
        const r = simulator.simulateMidfield("possession");
        result = r;
        setAnalysis({
          type: "midfield",
          possession: r.control.possession,
          passingAccuracy: r.control.passingAccuracy,
          keyPasses: r.control.keyPasses,
          recommendation: "Look for vertical passes to break lines and exploit spaces.",
        });
        break;
      }
      case "set_piece": {
        const r = simulator.simulateSetPiece("corner");
        result = r;
        setAnalysis({
          type: "set_piece",
          successRate: r.successRate,
          recommendation: "Target the near post with a driven delivery and late runs.",
        });
        break;
      }
    }

    // Sync React state with engine state — this triggers canvas re-render
    setState({ ...simulator.getState() });

    if (onSimulationComplete) {
      onSimulationComplete(result);
    }
  }, [phase, simulator, onSimulationComplete]);

  // Animation loop — uses engine's tick() for smooth ball movement
  useEffect(() => {
    if (!state.isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05); // cap at 50ms
      lastTime = now;
      simulator.tick(delta);
      setState({ ...simulator.getState() });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [state.isPlaying, simulator]);

  // Formation change — re-initializes player positions
  useEffect(() => {
    simulator.resetFormation(formation);
    setState({ ...simulator.getState() });
    setAnalysis(null);
  }, [formation, simulator]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            mode === "player"
              ? "bg-blue-100 text-blue-700"
              : "bg-[#1a5c2a]/10 text-[#1a5c2a]"
          }`}>
            {mode === "player" ? "Player View" : "Coach View"}
          </div>
          <h2 className="text-lg font-black text-gray-900">Tactics Simulator</h2>
          {selectedPosition && (
            <span className="text-xs bg-[#f0b429] text-black px-2 py-0.5 rounded-full font-bold">
              {selectedPosition}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === "player" && chemistryData && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Icons.Zap size={12} />
              Fit: {chemistryData.styleFit?.[phase] || 75}%
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
        {/* Main pitch area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Formation selector */}
          <FormationSelector
            selected={formation}
            onChange={setFormation}
            mode={mode}
          />

          {/* Pitch */}
          <div className="relative">
            <PitchView
              formation={formation}
              simulationState={state}
              selectedPosition={selectedPosition}
              onPositionSelect={setSelectedPosition}
              showHeatmap={showHeatmap}
              showPassingLanes={showPassingLanes}
              showPressure={showPressure}
              phase={phase}
            />
          </div>

          {/* Controls */}
          <SimulationControls
            isPlaying={state.isPlaying}
            speed={state.speed}
            onPlayPause={() => {
              simulator.togglePlay();
              setState({ ...simulator.getState() });
            }}
            onSpeedChange={(speed) => {
              simulator.setSpeed(speed);
              setState({ ...simulator.getState() });
            }}
            onPhaseChange={(newPhase) => {
              setPhase(newPhase);
              simulator.setPhase(newPhase);
              runSimulation(newPhase);
            }}
            phase={phase}
            onRunSimulation={() => runSimulation()}
          />
        </div>

        {/* Analysis panel */}
        <div className="lg:col-span-2 space-y-4">
          <TacticalOverlay
            analysis={analysis}
            phase={phase}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            showPassingLanes={showPassingLanes}
            onTogglePassingLanes={() => setShowPassingLanes(!showPassingLanes)}
            showPressure={showPressure}
            onTogglePressure={() => setShowPressure(!showPressure)}
          />

          {/* Position-specific training */}
          {selectedPosition && mode === "player" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Icons.Target size={16} />
                {selectedPosition} Training
              </h4>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700">Focus:</span>
                  <span className="text-blue-900 font-medium">
                    {phase === "attacking" && "Attacking movement & finishing"}
                    {phase === "defending" && "Defensive positioning & tackling"}
                    {phase === "transition" && "Midfield control & distribution"}
                    {phase === "set_piece" && "Set piece execution & delivery"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700">Key drills:</span>
                  <span className="text-blue-900 font-medium">
                    {phase === "attacking" && "Finishing, 1v1, combination play"}
                    {phase === "defending" && "Tackling, 1v1 defending, positioning"}
                    {phase === "transition" && "Passing patterns, receiving, turning"}
                    {phase === "set_piece" && "Set piece delivery, timing runs"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chemistry integration */}
          {chemistryData && mode === "coach" && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                <Icons.Zap size={16} />
                Chemistry Insights
              </h4>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Overall Fit</span>
                  <span className={`text-sm font-bold ${
                    chemistryData.chemistryScore >= 70 ? "text-emerald-500" :
                    chemistryData.chemistryScore >= 50 ? "text-amber-500" :
                    "text-red-500"
                  }`}>
                    {chemistryData.chemistryScore}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-700">Attacking</span>
                    <span className="font-bold">{chemistryData.styleFit?.attacking || 70}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-700">Defending</span>
                    <span className="font-bold">{chemistryData.styleFit?.defending || 65}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-700">Transition</span>
                    <span className="font-bold">{chemistryData.styleFit?.transition || 60}%</span>
                  </div>
                </div>
                {chemistryData.recommendedFormation && (
                  <p className="text-xs text-purple-600 mt-2">
                    Recommended: {chemistryData.recommendedFormation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
