// src/components/tactics/SimulationControls.tsx
"use client";

import * as Icons from "lucide-react";

interface SimulationControlsProps {
  isPlaying: boolean;
  speed: 0.5 | 1 | 1.5 | 2;
  onPlayPause: () => void;
  onSpeedChange: (speed: 0.5 | 1 | 1.5 | 2) => void;
  onPhaseChange: (phase: "attacking" | "defending" | "transition" | "set_piece") => void;
  phase: "attacking" | "defending" | "transition" | "set_piece";
  onRunSimulation: () => void;
}

export default function SimulationControls({
  isPlaying,
  speed,
  onPlayPause,
  onSpeedChange,
  onPhaseChange,
  phase,
  onRunSimulation,
}: SimulationControlsProps) {
  const phases: { id: "attacking" | "defending" | "transition" | "set_piece"; label: string; icon: React.ElementType }[] = [
    { id: "attacking", label: "⚔️ Attack", icon: Icons.Flame },
    { id: "defending", label: "🛡️ Defense", icon: Icons.Shield },
    { id: "transition", label: "🔄 Midfield", icon: Icons.RefreshCw },
    { id: "set_piece", label: "🎯 Set Piece", icon: Icons.Target },
  ];

  const speeds: (0.5 | 1 | 1.5 | 2)[] = [0.5, 1, 1.5, 2];

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Phase selection */}
      <div className="flex flex-wrap gap-2">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => onPhaseChange(p.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              phase === p.id
                ? "bg-[#1a5c2a] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <p.icon size={14} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4">
        <button
          onClick={onPlayPause}
          className="p-2.5 rounded-xl bg-[#1a5c2a] text-white hover:bg-[#1a5c2a]/90 transition-colors"
        >
          {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
        </button>

        <div className="flex items-center gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                speed === s
                  ? "bg-[#f0b429] text-black"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onRunSimulation}
          className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-500 transition-colors flex items-center gap-2"
        >
          <Icons.Zap size={16} />
          Simulate
        </button>
      </div>
    </div>
  );
}