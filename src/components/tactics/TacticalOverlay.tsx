// src/components/tactics/TacticalOverlay.tsx
"use client";

import * as Icons from "lucide-react";
import type { AnalysisState } from "@/components/tactics/TacticsSimulator";

interface TacticalOverlayProps {
  analysis: AnalysisState | null;
  phase: "attacking" | "defending" | "transition" | "set_piece";
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showPassingLanes: boolean;
  onTogglePassingLanes: () => void;
  showPressure: boolean;
  onTogglePressure: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  attacking: "Attacking Phase",
  defending: "Defending Phase",
  transition: "Midfield / Transition",
  set_piece: "Set Piece",
};

const PHASE_COLORS: Record<string, string> = {
  attacking: "text-orange-600 bg-orange-50 border-orange-200",
  defending: "text-blue-700 bg-blue-50 border-blue-200",
  transition: "text-purple-700 bg-purple-50 border-purple-200",
  set_piece: "text-emerald-700 bg-emerald-50 border-emerald-200",
};

interface OverlayToggleProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onToggle: () => void;
  activeClass?: string;
}

function OverlayToggle({ label, icon: Icon, active, onToggle, activeClass = "bg-[#1a5c2a] text-white" }: OverlayToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors w-full ${
        active
          ? `${activeClass} border-transparent`
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon size={13} />
      {label}
      <span className={`ml-auto text-[10px] font-bold ${active ? "opacity-80" : "text-gray-400"}`}>
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export default function TacticalOverlay({
  analysis,
  phase,
  showHeatmap,
  onToggleHeatmap,
  showPassingLanes,
  onTogglePassingLanes,
  showPressure,
  onTogglePressure,
}: TacticalOverlayProps) {
  return (
    <div className="space-y-4">
      {/* Overlay toggles */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Pitch Overlays
        </h4>
        <div className="space-y-2">
          <OverlayToggle
            label="Heat Map"
            icon={Icons.Flame}
            active={showHeatmap}
            onToggle={onToggleHeatmap}
            activeClass="bg-orange-500 text-white"
          />
          <OverlayToggle
            label="Passing Lanes"
            icon={Icons.ArrowRight}
            active={showPassingLanes}
            onToggle={onTogglePassingLanes}
            activeClass="bg-emerald-600 text-white"
          />
          <OverlayToggle
            label="Pressure Zones"
            icon={Icons.AlertCircle}
            active={showPressure}
            onToggle={onTogglePressure}
            activeClass="bg-red-500 text-white"
          />
        </div>
      </div>

      {/* Analysis panel */}
      {analysis ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {/* Phase badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${PHASE_COLORS[phase] ?? "text-gray-700 bg-gray-50 border-gray-200"}`}>
            <Icons.Activity size={11} />
            {PHASE_LABELS[phase] ?? phase}
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2">
            {analysis.successRate !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-black text-gray-900">
                  {Math.round(analysis.successRate)}%
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Success Rate</div>
              </div>
            )}
            {analysis.riskLevel !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className={`text-lg font-black ${
                  analysis.riskLevel < 40 ? "text-emerald-600" :
                  analysis.riskLevel < 70 ? "text-amber-500" : "text-red-500"
                }`}>
                  {Math.round(analysis.riskLevel)}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Risk Level</div>
              </div>
            )}
            {analysis.intensity !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-black text-purple-600">
                  {Math.round(analysis.intensity)}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Intensity</div>
              </div>
            )}
            {analysis.possession !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-black text-blue-600">
                  {Math.round(analysis.possession)}%
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Possession</div>
              </div>
            )}
            {analysis.passingAccuracy !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-black text-purple-600">
                  {Math.round(analysis.passingAccuracy)}%
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Pass Accuracy</div>
              </div>
            )}
            {analysis.keyPasses !== undefined && (
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <div className="text-lg font-black text-emerald-600">
                  {analysis.keyPasses}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">Key Passes</div>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="bg-[#f0b429]/10 border border-[#f0b429]/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icons.Lightbulb size={13} className="text-[#f0b429] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">{analysis.recommendation}</p>
            </div>
          </div>


        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <Icons.Play size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">Run a simulation</p>
          <p className="text-xs text-gray-300 mt-1">
            Select a phase and click Simulate to see tactical analysis
          </p>
        </div>
      )}
    </div>
  );
}
