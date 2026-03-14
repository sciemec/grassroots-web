"use client";

import { useRef, useEffect } from "react";

export interface HeatmapPoint {
  x: number; // 0-100 percentage across pitch width
  y: number; // 0-100 percentage down pitch height
  intensity: number; // 0-1
}

export interface PitchHeatmapProps {
  title: string;
  points: HeatmapPoint[];
  width?: number;
  height?: number;
  team?: "home" | "away";
}

/** Draws a standard football pitch with green field, white lines. */
function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Field background
  ctx.fillStyle = "#2d6a2d";
  ctx.fillRect(0, 0, w, h);

  // Alternating darker stripe bands
  const stripeCount = 8;
  ctx.fillStyle = "#286028";
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillRect(0, (h / stripeCount) * i, w, h / stripeCount);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;

  const pad = { x: w * 0.04, y: h * 0.04 };
  const fw = w - pad.x * 2;
  const fh = h - pad.y * 2;
  const ox = pad.x;
  const oy = pad.y;

  // Outer boundary
  ctx.strokeRect(ox, oy, fw, fh);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(ox, oy + fh / 2);
  ctx.lineTo(ox + fw, oy + fh / 2);
  ctx.stroke();

  // Centre circle
  ctx.beginPath();
  ctx.arc(ox + fw / 2, oy + fh / 2, fw * 0.1, 0, Math.PI * 2);
  ctx.stroke();

  // Centre spot
  ctx.beginPath();
  ctx.arc(ox + fw / 2, oy + fh / 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();

  // Penalty areas (top and bottom)
  const paW = fw * 0.44;
  const paH = fh * 0.16;
  ctx.strokeRect(ox + (fw - paW) / 2, oy, paW, paH);
  ctx.strokeRect(ox + (fw - paW) / 2, oy + fh - paH, paW, paH);

  // Six-yard boxes
  const gbW = fw * 0.22;
  const gbH = fh * 0.07;
  ctx.strokeRect(ox + (fw - gbW) / 2, oy, gbW, gbH);
  ctx.strokeRect(ox + (fw - gbW) / 2, oy + fh - gbH, gbW, gbH);

  // Goal lines (thick bars)
  const goalW = fw * 0.12;
  ctx.lineWidth = 3;
  const goalX = ox + (fw - goalW) / 2;
  ctx.strokeRect(goalX, oy - 4, goalW, 4);
  ctx.strokeRect(goalX, oy + fh, goalW, 4);
  ctx.lineWidth = 1.5;

  // Penalty spots
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(ox + fw / 2, oy + paH + fh * 0.05, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox + fw / 2, oy + fh - paH - fh * 0.05, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Corner arcs
  const cr = fw * 0.025;
  [
    [ox, oy, 0, Math.PI / 2],
    [ox + fw, oy, Math.PI / 2, Math.PI],
    [ox + fw, oy + fh, Math.PI, (3 * Math.PI) / 2],
    [ox, oy + fh, (3 * Math.PI) / 2, 2 * Math.PI],
  ].forEach(([cx, cy, start, end]) => {
    ctx.beginPath();
    ctx.arc(cx as number, cy as number, cr, start as number, end as number);
    ctx.stroke();
  });
}

/** Overlays a Gaussian-blur heatmap on the canvas. */
function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: HeatmapPoint[]
): void {
  const radius = Math.min(w, h) * 0.12;

  for (const pt of points) {
    const cx = (pt.x / 100) * w;
    const cy = (pt.y / 100) * h;
    const alpha = Math.min(1, pt.intensity);

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    if (pt.intensity > 0.66) {
      gradient.addColorStop(0, `rgba(255,30,0,${alpha * 0.7})`);
      gradient.addColorStop(0.4, `rgba(255,120,0,${alpha * 0.45})`);
      gradient.addColorStop(1, "rgba(255,80,0,0)");
    } else if (pt.intensity > 0.33) {
      gradient.addColorStop(0, `rgba(255,200,0,${alpha * 0.65})`);
      gradient.addColorStop(0.4, `rgba(255,165,0,${alpha * 0.35})`);
      gradient.addColorStop(1, "rgba(255,120,0,0)");
    } else {
      gradient.addColorStop(0, `rgba(0,80,255,${alpha * 0.55})`);
      gradient.addColorStop(0.4, `rgba(0,150,255,${alpha * 0.28})`);
      gradient.addColorStop(1, "rgba(0,100,255,0)");
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

/** Legend bar showing cold → hot range. */
function HeatmapLegend() {
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <span className="text-xs text-muted-foreground">Low</span>
      <div
        className="h-2.5 w-32 rounded-full"
        style={{
          background:
            "linear-gradient(to right, rgba(0,100,255,0.7), rgba(255,200,0,0.8), rgba(255,30,0,0.9))",
        }}
      />
      <span className="text-xs text-muted-foreground">High</span>
    </div>
  );
}

/** Reusable pitch heatmap component rendered on an HTML canvas. */
export function PitchHeatmap({
  title,
  points,
  width = 480,
  height = 320,
}: PitchHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawPitch(ctx, width, height);

    if (points.length > 0) {
      drawHeatmap(ctx, width, height, points);
    }
  }, [points, width, height]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="relative flex justify-center overflow-hidden rounded-lg">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="max-w-full rounded-lg"
          style={{ maxHeight: height }}
        />
        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
              No data yet
            </span>
          </div>
        )}
      </div>
      {points.length > 0 && <HeatmapLegend />}
    </div>
  );
}
