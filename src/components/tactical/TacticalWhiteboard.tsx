// src/components/tactical/TacticalWhiteboard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import { TacticalMovement, TacticalLesson } from "@/types/tactical";
import { TacticalEngine } from "@/lib/tactical-engine";

interface TacticalWhiteboardProps {
  lesson: TacticalLesson;
  mode: "edit" | "view" | "simulate";
  onMovementAdd?: (movement: TacticalMovement) => void;
  onMovementUpdate?: (movement: TacticalMovement) => void;
  onMovementDelete?: (id: string) => void;
  onLessonSave?: (lesson: TacticalLesson) => void;
  playerId?: string;
  isPlayerView?: boolean;
}

type Tool = "select" | "run" | "pass" | "dribble" | "cross" | "shot" | "press" | "cover" | "arrow" | "label";
type Phase = "attacking" | "defending" | "transition" | "set_piece";

const PLAYER_POSITIONS = [
  { id: "GK", label: "GK", x: 50, y: 90 },
  { id: "RB", label: "RB", x: 82, y: 72 },
  { id: "RCB", label: "RCB", x: 62, y: 75 },
  { id: "LCB", label: "LCB", x: 38, y: 75 },
  { id: "LB", label: "LB", x: 18, y: 72 },
  { id: "CDM", label: "CDM", x: 50, y: 60 },
  { id: "CM", label: "CM", x: 50, y: 50 },
  { id: "RM", label: "RM", x: 75, y: 52 },
  { id: "LM", label: "LM", x: 25, y: 52 },
  { id: "CAM", label: "CAM", x: 50, y: 35 },
  { id: "RW", label: "RW", x: 78, y: 24 },
  { id: "ST", label: "ST", x: 50, y: 18 },
  { id: "LW", label: "LW", x: 22, y: 24 },
];

export default function TacticalWhiteboard({
  lesson,
  mode,
  onMovementAdd,
  onMovementUpdate,
  onMovementDelete,
  onLessonSave,
  playerId,
  isPlayerView = false,
}: TacticalWhiteboardProps) {
  const [selectedTool, setSelectedTool] = useState<Tool>("select");
  const [selectedMovement, setSelectedMovement] = useState<TacticalMovement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [simulation, setSimulation] = useState<TacticalEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeMovements, setActiveMovements] = useState<string[]>([]);
  const [completedMovements, setCompletedMovements] = useState<string[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Initialize Simulation ─────────────────────────────────────────

  useEffect(() => {
    if (mode === "simulate" && lesson.movements.length > 0) {
      const engine = new TacticalEngine(lesson);
      
      engine.on("onUpdate", (data) => {
        setCurrentTime(data.time);
        setProgress(data.progress);
        setActiveMovements(data.activeMovements);
        setCompletedMovements(data.completedMovements);
        drawCanvas();
      });
      
      engine.on("onComplete", () => {
        setIsPlaying(false);
        drawCanvas();
      });

      setSimulation(engine);
    }
  }, [lesson, mode]);

  // ─── Drawing Functions ─────────────────────────────────────────────

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = width * 1.4;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw pitch
    drawPitch(ctx, width, height);

    // Draw players
    PLAYER_POSITIONS.forEach(pos => {
      drawPlayer(ctx, width, height, pos, selectedPlayer === pos.id);
    });

    // Draw movements
    drawMovements(ctx, width, height);

    // Draw simulation state
    if (mode === "simulate" && simulation) {
      drawSimulationState(ctx, width, height);
    }

  }, [selectedPlayer, mode, simulation, lesson.movements]);

  const drawPitch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = width * 0.05;
    const pitchW = width - padding * 2;
    const pitchH = height - padding * 2;

    // Grass
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1a472a");
    gradient.addColorStop(0.3, "#2d6a2d");
    gradient.addColorStop(0.7, "#2d6a2d");
    gradient.addColorStop(1, "#1a472a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.5;

    // Border
    ctx.strokeRect(padding, padding, pitchW, pitchH);

    // Center line
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.08, 0, 2 * Math.PI);
    ctx.stroke();

    // Penalty areas
    const paW = pitchW * 0.28;
    const paH = pitchH * 0.13;
    const paX = (width - paW) / 2;

    ctx.strokeRect(paX, padding, paW, paH);
    ctx.strokeRect(paX, height - padding - paH, paW, paH);

    // Goal areas
    const gaW = pitchW * 0.14;
    const gaH = pitchH * 0.06;
    const gaX = (width - gaW) / 2;

    ctx.strokeRect(gaX, padding, gaW, gaH);
    ctx.strokeRect(gaX, height - padding - gaH, gaW, gaH);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, width: number, height: number, pos: { id: string; label: string; x: number; y: number }, selected: boolean) => {
    const x = (pos.x / 100) * width;
    const y = (pos.y / 100) * height;
    const radius = selected ? 14 : 11;

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 5;

    // Circle
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
    gradient.addColorStop(0, selected ? "#f0b429" : "#22c55e");
    gradient.addColorStop(1, selected ? "#ca8a04" : "#16a34a");

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = "white";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pos.label, x, y);

    // Selected indicator
    if (selected) {
      ctx.strokeStyle = "#f0b429";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawMovements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const movements = lesson.movements;
    const isSimulating = mode === "simulate" && simulation;

    movements.forEach((movement, index) => {
      const isActive = activeMovements.includes(movement.id);
      const isComplete = completedMovements.includes(movement.id);
      const isPending = !isActive && !isComplete && isSimulating;

      // Determine opacity based on simulation state
      let opacity = 1;
      let lineWidth = 2;
      let color = getMovementColor(movement.type);

      if (isSimulating) {
        if (isComplete) opacity = 0.3;
        else if (isActive) opacity = 1;
        else if (isPending) opacity = 0.1;
      }

      // Draw path
      const path = movement.path;
      if (path.length > 1) {
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = isActive ? 3 : lineWidth;
        ctx.setLineDash(isActive ? [] : [4, 4]);

        ctx.beginPath();
        path.forEach((point, i) => {
          const x = (point.x / 100) * width;
          const y = (point.y / 100) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow at end
        if (movement.arrow && path.length > 1) {
          const last = path[path.length - 1];
          const prev = path[path.length - 2];
          const x1 = (prev.x / 100) * width;
          const y1 = (prev.y / 100) * height;
          const x2 = (last.x / 100) * width;
          const y2 = (last.y / 100) * height;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const arrowLen = 10;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - arrowLen * Math.cos(angle - 0.5), y2 - arrowLen * Math.sin(angle - 0.5));
          ctx.lineTo(x2 - arrowLen * Math.cos(angle + 0.5), y2 - arrowLen * Math.sin(angle + 0.5));
          ctx.closePath();
          ctx.fill();
        }

        // Label
        if (movement.label) {
          const midPoint = path[Math.floor(path.length / 2)];
          const mx = (midPoint.x / 100) * width;
          const my = (midPoint.y / 100) * height;
          
          ctx.fillStyle = "white";
          ctx.font = "8px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(movement.label, mx, my - 5);
        }

        ctx.globalAlpha = 1;
      }
    });
  };

  const drawSimulationState = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw progress bar at bottom
    const barY = height - 20;
    const barW = width - 40;
    const barX = 20;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.roundRect(barX, barY - 4, barW, 8, 4);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.roundRect(barX, barY - 4, (progress / 100) * barW, 8, 4);
    ctx.fill();

    // Time label
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${currentTime.toFixed(1)}s / ${lesson.duration.toFixed(1)}s`, width / 2, barY - 8);

    // Active movement count
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "8px sans-serif";
    ctx.fillText(`Active: ${activeMovements.length}  |  Complete: ${completedMovements.length}/${lesson.movements.length}`, width - 20, barY - 8);
  };

  const getMovementColor = (type: string): string => {
    const colors: Record<string, string> = {
      run: "#22c55e",
      pass: "#3b82f6",
      dribble: "#f59e0b",
      cross: "#8b5cf6",
      shot: "#ef4444",
      press: "#f97316",
      cover: "#06b6d4",
    };
    return colors[type] || "#ffffff";
  };

  // ─── Simulation Controls ───────────────────────────────────────────

  const handlePlay = () => {
    if (!simulation) return;
    setIsPlaying(true);
    simulation.play();
  };

  const handlePause = () => {
    if (!simulation) return;
    setIsPlaying(false);
    simulation.pause();
  };

  const handleStop = () => {
    if (!simulation) return;
    setIsPlaying(false);
    simulation.stop();
    setCurrentTime(0);
    setProgress(0);
    setActiveMovements([]);
    setCompletedMovements([]);
  };

  const handleSpeedChange = (speed: 0.5 | 1 | 1.5 | 2) => {
    if (!simulation) return;
    simulation.setSpeed(speed);
  };

  // ─── Drawing Tools ──────────────────────────────────────────────────

  const tools: { id: Tool; label: string; icon: React.ElementType }[] = [
    { id: "select", label: "Select", icon: Icons.MousePointer },
    { id: "run", label: "Run", icon: Icons.Zap },
    { id: "pass", label: "Pass", icon: Icons.ArrowRight },
    { id: "dribble", label: "Dribble", icon: Icons.Footprints },
    { id: "cross", label: "Cross", icon: Icons.Crosshair },
    { id: "shot", label: "Shot", icon: Icons.Target },
    { id: "press", label: "Press", icon: Icons.Shield },
    { id: "cover", label: "Cover", icon: Icons.Circle },
    { id: "arrow", label: "Arrow", icon: Icons.Move },
    { id: "label", label: "Label", icon: Icons.Type },
  ];

  const toolColors: Record<Tool, string> = {
    select: "bg-gray-200 text-gray-700",
    run: "bg-emerald-500 text-white",
    pass: "bg-blue-500 text-white",
    dribble: "bg-amber-500 text-white",
    cross: "bg-purple-500 text-white",
    shot: "bg-red-500 text-white",
    press: "bg-orange-500 text-white",
    cover: "bg-cyan-500 text-white",
    arrow: "bg-indigo-500 text-white",
    label: "bg-pink-500 text-white",
  };

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      {mode === "edit" && (
        <div className="bg-gray-800 p-3 flex flex-wrap items-center gap-2 border-b border-gray-700">
          <div className="flex flex-wrap gap-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedTool === tool.id
                    ? toolColors[tool.id]
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title={tool.label}
              >
                <tool.icon size={16} />
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-gray-600 mx-2" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onLessonSave && lesson) {
                  onLessonSave(lesson);
                }
              }}
              className="px-4 py-2 bg-[#1a5c2a] text-white rounded-lg text-sm font-bold hover:bg-[#1a5c2a]/90 transition-colors flex items-center gap-2"
            >
              <Icons.Save size={14} />
              Save Lesson
            </button>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ aspectRatio: "1/1.4", touchAction: "none" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={(e) => {
            // Drawing logic
          }}
          onMouseMove={(e) => {
            // Drawing logic
          }}
          onMouseUp={() => {
            // Drawing logic
          }}
        />

        {/* Mode Indicator */}
        {mode === "simulate" && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <Icons.Play size={12} />
            Simulation Mode
          </div>
        )}

        {isPlayerView && (
          <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-blue-500/30">
            <Icons.Eye size={12} />
            Player View
          </div>
        )}

        {/* Playback Controls */}
        {mode === "simulate" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 px-4 py-2 rounded-xl">
            <button
              onClick={handleStop}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <Icons.Square size={16} />
            </button>
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="p-2 bg-[#f0b429] text-black rounded-lg hover:bg-[#f0b429]/90 transition-colors"
            >
              {isPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
            </button>
            <div className="flex items-center gap-1">
              {[0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                    simulation?.getState().speed === s
                      ? "bg-[#f0b429] text-black"
                      : "text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400">
              {currentTime.toFixed(1)}s / {lesson.duration.toFixed(1)}s
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {showTimeline && mode === "simulate" && (
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Timeline</span>
            <span className="text-xs text-gray-400">
              {activeMovements.length} active · {completedMovements.length} complete
            </span>
          </div>
          <div className="relative h-16 bg-gray-900 rounded-lg overflow-hidden">
            {lesson.movements.map((movement) => {
              const startX = (movement.timing.startTime / lesson.duration) * 100;
              const width = (movement.timing.duration / lesson.duration) * 100;
              const isActive = activeMovements.includes(movement.id);
              const isComplete = completedMovements.includes(movement.id);

              return (
                <div
                  key={movement.id}
                  className={`absolute top-1 h-3 rounded transition-colors ${
                    isActive ? "opacity-100" : isComplete ? "opacity-30" : "opacity-10"
                  }`}
                  style={{
                    left: `${startX}%`,
                    width: `${Math.max(width, 0.5)}%`,
                    backgroundColor: getMovementColor(movement.type),
                    top: `${movement.id.charCodeAt(0) % 10 * 4 + 4}px`,
                  }}
                  title={`${movement.type}: ${movement.description}`}
                />
              );
            })}
            {/* Progress Indicator */}
            <div
              className="absolute top-0 bottom-0 w-px bg-[#f0b429]"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}