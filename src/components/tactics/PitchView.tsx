// src/components/tactics/PitchView.tsx
"use client";

import { useRef, useEffect } from "react";
import { Formation, SimulationState } from "@/types/tactics";
import { FORMATIONS } from "@/lib/tactics-engine";

interface PitchViewProps {
  formation: Formation;
  simulationState: SimulationState;
  selectedPosition?: string | null;
  onPositionSelect?: (id: string) => void;
  showHeatmap: boolean;
  showPassingLanes: boolean;
  showPressure: boolean;
  phase: string;
}

export default function PitchView({
  formation,
  simulationState,
  selectedPosition,
  onPositionSelect,
  showHeatmap,
  showPassingLanes,
  showPressure,
  phase,
}: PitchViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positions = FORMATIONS[formation].positions;

  // Animation frame for smooth rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = width * 1.4;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Draw pitch
    drawPitch(ctx, width, height);
    
    // Draw heatmap overlay
    if (showHeatmap) {
      drawHeatmap(ctx, width, height, simulationState);
    }
    
    // Draw pressure zones
    if (showPressure) {
      drawPressureZones(ctx, width, height, simulationState);
    }
    
    // Draw passing lanes
    if (showPassingLanes) {
      drawPassingLanes(ctx, width, height, simulationState);
    }
    
    // Draw player positions
    drawPlayers(ctx, width, height, positions, simulationState, selectedPosition, onPositionSelect);

    // Draw ball
    drawBall(ctx, width, height, simulationState);

    // Draw movement paths
    drawMovementPaths(ctx, width, height, simulationState);

  }, [formation, simulationState, selectedPosition, showHeatmap, showPassingLanes, showPressure, phase, onPositionSelect]);

  const drawPitch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Grass
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#2d6a2d");
    gradient.addColorStop(0.5, "#3a7a3a");
    gradient.addColorStop(1, "#2d6a2d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Pitch markings
    const padding = width * 0.05;
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;

    // Border
    ctx.strokeRect(padding, padding, width - padding * 2, height - padding * 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.1, 0, 2 * Math.PI);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Penalty areas
    const penAreaW = width * 0.3;
    const penAreaH = height * 0.15;
    const penX = (width - penAreaW) / 2;

    // Top penalty area
    ctx.strokeRect(penX, padding, penAreaW, penAreaH);
    // Bottom penalty area
    ctx.strokeRect(penX, height - padding - penAreaH, penAreaW, penAreaH);

    // Goal areas
    const goalAreaW = width * 0.15;
    const goalAreaH = height * 0.07;
    const goalX = (width - goalAreaW) / 2;

    ctx.strokeRect(goalX, padding, goalAreaW, goalAreaH);
    ctx.strokeRect(goalX, height - padding - goalAreaH, goalAreaW, goalAreaH);
  };

  const drawPlayers = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    positions: { id: string; label: string; x: number; y: number }[],
    state: SimulationState,
    selected: string | null | undefined,
    onSelect?: (id: string) => void
  ) => {
    // Reset click zones each render to prevent accumulation
    (ctx.canvas as any)._clickZones = [];
    positions.forEach((pos) => {
      const posData = state.playerPositions[pos.id] || { x: pos.x, y: pos.y };
      const x = (posData.x / 100) * width;
      const y = (posData.y / 100) * height;
      const isSelected = selected === pos.id;
      const radius = isSelected ? 12 : 10;

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 10;

      // Player circle
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 5;

      // Glow for selected
      if (isSelected) {
        ctx.shadowColor = "rgba(240, 180, 41, 0.5)";
        ctx.shadowBlur = 20;
      }

      // Circle
      const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
      gradient.addColorStop(0, isSelected ? "#f0b429" : "#22c55e");
      gradient.addColorStop(1, isSelected ? "#ca8a04" : "#16a34a");
      
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Position label
      ctx.fillStyle = "white";
      ctx.font = isSelected ? "bold 10px sans-serif" : "9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pos.label, x, y);

      // Selected indicator
      if (isSelected) {
        ctx.strokeStyle = "#f0b429";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Click handler
      if (onSelect) {
        (ctx.canvas as any)._clickZones.push({
          id: pos.id,
          x,
          y,
          radius: radius + 5,
          onSelect,
        });
      }
    });
  };

  const drawBall = (ctx: CanvasRenderingContext2D, width: number, height: number, state: SimulationState) => {
    const x = (state.ballPosition.x / 100) * width;
    const y = (state.ballPosition.y / 100) * height;

    // Ball shadow
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    
    // Ball
    const gradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 6);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.5, "#f0f0f0");
    gradient.addColorStop(1, "#cccccc");
    
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Pentagon pattern
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
      const px = x + 3 * Math.cos(angle);
      const py = y + 3 * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(100,100,100,0.3)";
      ctx.fill();
    }
  };

  const drawHeatmap = (ctx: CanvasRenderingContext2D, width: number, height: number, state: SimulationState) => {
    // Generate heatmap data from movement paths
    const heatmapData: number[][] = [];
    const cols = 20;
    const rows = 28;
    const cellW = width / cols;
    const cellH = height / rows;

    // Initialize heatmap
    for (let i = 0; i < rows; i++) {
      heatmapData[i] = [];
      for (let j = 0; j < cols; j++) {
        heatmapData[i][j] = 0;
      }
    }

    // Add heat from movement paths
    state.movementPaths.forEach(path => {
      path.points.forEach(point => {
        const col = Math.floor((point.x / 100) * cols);
        const row = Math.floor((point.y / 100) * rows);
        if (row < rows && col < cols && row >= 0 && col >= 0) {
          heatmapData[row][col] += 0.5;
        }
      });
    });

    // Draw heatmap
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const intensity = Math.min(1, heatmapData[i][j] / 5);
        if (intensity > 0.05) {
          const alpha = intensity * 0.6;
          const r = Math.round(255 * intensity);
          const g = Math.round(255 * (1 - intensity) * intensity);
          const b = 0;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(j * cellW, i * cellH, cellW + 1, cellH + 1);
        }
      }
    }
  };

  const drawPressureZones = (ctx: CanvasRenderingContext2D, width: number, height: number, state: SimulationState) => {
    state.pressureZones.forEach(zone => {
      const x = (zone.x / 100) * width;
      const y = (zone.y / 100) * height;
      const radius = (zone.radius / 100) * Math.min(width, height);
      const intensity = zone.intensity / 100;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 50, 50, ${intensity * 0.3})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 50, ${intensity * 0.15})`);
      gradient.addColorStop(1, `rgba(255, 150, 50, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Border
      ctx.strokeStyle = `rgba(255, 50, 50, ${intensity * 0.3})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  const drawPassingLanes = (ctx: CanvasRenderingContext2D, width: number, height: number, state: SimulationState) => {
    state.passingLanes.forEach(lane => {
      const from = state.playerPositions[lane.from];
      const to = state.playerPositions[lane.to];
      if (!from || !to) return;

      const x1 = (from.x / 100) * width;
      const y1 = (from.y / 100) * height;
      const x2 = (to.x / 100) * width;
      const y2 = (to.y / 100) * height;

      if (lane.active) {
        // Active passing lane
        ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
      } else {
        // Inactive lane
        ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow
      if (lane.active) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLen = 8;
        const arrowX = x2 - 10 * Math.cos(angle);
        const arrowY = y2 - 10 * Math.sin(angle);
        
        ctx.fillStyle = "rgba(34, 197, 94, 0.6)";
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowLen * Math.cos(angle - 0.5), arrowY - arrowLen * Math.sin(angle - 0.5));
        ctx.lineTo(arrowX - arrowLen * Math.cos(angle + 0.5), arrowY - arrowLen * Math.sin(angle + 0.5));
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const drawMovementPaths = (ctx: CanvasRenderingContext2D, width: number, height: number, state: SimulationState) => {
    state.movementPaths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = "rgba(240, 180, 41, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      path.points.forEach((point, i) => {
        const x = (point.x / 100) * width;
        const y = (point.y / 100) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow at end
      const last = path.points[path.points.length - 1];
      const prev = path.points[path.points.length - 2] || last;
      if (last && prev) {
        const x1 = (prev.x / 100) * width;
        const y1 = (prev.y / 100) * height;
        const x2 = (last.x / 100) * width;
        const y2 = (last.y / 100) * height;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLen = 8;
        const arrowX = x2;
        const arrowY = y2;

        ctx.fillStyle = "rgba(240, 180, 41, 0.6)";
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - arrowLen * Math.cos(angle - 0.5), arrowY - arrowLen * Math.sin(angle - 0.5));
        ctx.lineTo(arrowX - arrowLen * Math.cos(angle + 0.5), arrowY - arrowLen * Math.sin(angle + 0.5));
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: "1/1.4" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl shadow-lg"
        onClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const clickZones = (canvas as any)._clickZones || [];
          
          for (const zone of clickZones) {
            const dx = x - zone.x;
            const dy = y - zone.y;
            if (dx * dx + dy * dy < zone.radius * zone.radius) {
              zone.onSelect(zone.id);
              break;
            }
          }
        }}
      />
    </div>
  );
}