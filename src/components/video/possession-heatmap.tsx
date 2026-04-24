"use client";

/**
 * PossessionHeatmap — analyses a video file to produce a spatial activity /
 * possession heatmap overlaid on a football pitch diagram.
 *
 * Algorithm (pure canvas — no extra dependencies, safe on 2G/3G networks):
 * 1. Sample SAMPLE_COUNT frames at equal intervals from the video
 * 2. Use the first frame as the static background reference
 * 3. For each subsequent frame compute per-pixel absolute difference (absdiff)
 * 4. Threshold differences at DIFF_THRESHOLD to isolate player movement
 * 5. Accumulate active pixel ratios into a GRID_COLS × GRID_ROWS grid
 * 6. Normalise scores 0–1 and render as a heat-coloured SVG pitch overlay
 *
 * Phase 6 — OpenCV.js possession heatmaps (implemented via canvas pixel analysis;
 * the same absdiff + threshold algorithm OpenCV.js uses, without the 8 MB download).
 */

import { useCallback, useRef, useState } from "react";
import { Activity, AlertCircle, Loader2, RefreshCw } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_COLS = 6;
const GRID_ROWS = 4;
const SAMPLE_COUNT = 20;
/** 0-255 mean channel difference required to count a pixel as "active" */
const DIFF_THRESHOLD = 20;
/** Sample every Nth pixel within a cell for speed (stride × stride grid) */
const STRIDE = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

/** GRID_ROWS × GRID_COLS grid of normalised activity scores (0–1) */
type HeatGrid = number[][];

interface Props {
  videoFile: File | null;
}

// ─── Colour scale ─────────────────────────────────────────────────────────────

/** Map 0–1 value to heatmap RGB: blue → cyan → gold → red */
function heatColor(v: number): string {
  if (v < 0.25) {
    const t = v / 0.25;
    return `rgb(${lerp(59, 6, t)},${lerp(130, 182, t)},${lerp(246, 212, t)})`;
  }
  if (v < 0.5) {
    const t = (v - 0.25) / 0.25;
    return `rgb(${lerp(6, 240, t)},${lerp(182, 180, t)},${lerp(212, 41, t)})`;
  }
  if (v < 0.75) {
    const t = (v - 0.5) / 0.25;
    return `rgb(${lerp(240, 239, t)},${lerp(180, 68, t)},${lerp(41, 68, t)})`;
  }
  const t = (v - 0.75) / 0.25;
  return `rgb(239,${lerp(68, 0, t)},68)`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PossessionHeatmap({ videoFile }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [heatGrid, setHeatGrid] = useState<HeatGrid | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const analyse = useCallback(async () => {
    if (!videoFile) return;
    setStatus("loading");
    setProgress(0);
    setHeatGrid(null);
    setErrorMsg("");

    let objectUrl = "";
    try {
      // ── 1. Load video metadata ──────────────────────────────────────────────
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";
      objectUrl = URL.createObjectURL(videoFile);

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Video failed to load"));
        video.src = objectUrl;
        video.load();
      });

      const duration = video.duration;
      if (!duration || !isFinite(duration)) throw new Error("Cannot determine video duration");

      const W = video.videoWidth || 640;
      const H = video.videoHeight || 360;

      // ── 2. Set up analysis canvas ───────────────────────────────────────────
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      /** Seek to `t` seconds, draw frame, return ImageData */
      const getFrame = (t: number): Promise<ImageData> =>
        new Promise((resolve, reject) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            ctx.drawImage(video, 0, 0, W, H);
            resolve(ctx.getImageData(0, 0, W, H));
          };
          video.addEventListener("seeked", onSeeked);
          video.onerror = () => reject(new Error("Seek failed"));
          video.currentTime = Math.max(0, Math.min(t, duration - 0.05));
        });

      // ── 3. Sample frames ────────────────────────────────────────────────────
      const cellW = W / GRID_COLS;
      const cellH = H / GRID_ROWS;
      const grid: number[][] = Array.from({ length: GRID_ROWS }, () =>
        new Array(GRID_COLS).fill(0)
      );

      // Background = first frame
      const bgFrame = await getFrame(0);
      setProgress(5);

      const interval = duration / (SAMPLE_COUNT - 1);

      for (let i = 1; i < SAMPLE_COUNT; i++) {
        const frame = await getFrame(i * interval);

        // ── 4. Accumulate absdiff per cell ────────────────────────────────────
        for (let row = 0; row < GRID_ROWS; row++) {
          for (let col = 0; col < GRID_COLS; col++) {
            const x0 = Math.floor(col * cellW);
            const y0 = Math.floor(row * cellH);
            const x1 = Math.floor((col + 1) * cellW);
            const y1 = Math.floor((row + 1) * cellH);
            let active = 0;
            let total = 0;

            for (let py = y0; py < y1; py += STRIDE) {
              for (let px = x0; px < x1; px += STRIDE) {
                const idx = (py * W + px) * 4;
                const dr = Math.abs(frame.data[idx]     - bgFrame.data[idx]);
                const dg = Math.abs(frame.data[idx + 1] - bgFrame.data[idx + 1]);
                const db = Math.abs(frame.data[idx + 2] - bgFrame.data[idx + 2]);
                if ((dr + dg + db) / 3 > DIFF_THRESHOLD) active++;
                total++;
              }
            }

            if (total > 0) grid[row][col] += active / total;
          }
        }

        setProgress(5 + Math.round((i / (SAMPLE_COUNT - 1)) * 90));
      }

      // ── 5. Normalise ────────────────────────────────────────────────────────
      const max = Math.max(...grid.flat(), 0.001); // avoid /0
      const normalised: HeatGrid = grid.map((row) => row.map((v) => v / max));

      setHeatGrid(normalised);
      setProgress(100);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }, [videoFile]);

  const reset = () => {
    setStatus("idle");
    setHeatGrid(null);
    setProgress(0);
    setErrorMsg("");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#f0b429]" />
          <span className="font-semibold text-white">Possession Heatmap</span>
          <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429] uppercase tracking-wide">
            AI
          </span>
        </div>
        {videoFile && status === "idle" && (
          <button
            onClick={analyse}
            className="rounded-lg bg-[#f0b429] px-3 py-1.5 text-xs font-bold text-[#1a3a1a] hover:bg-[#f5c542] transition-colors"
          >
            Analyse
          </button>
        )}
        {status === "done" && (
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Re-analyse
          </button>
        )}
      </div>

      {/* No file */}
      {!videoFile && (
        <p className="text-sm text-muted-foreground">
          Upload a video above to generate the possession heatmap.
        </p>
      )}

      {/* File ready but not started */}
      {videoFile && status === "idle" && (
        <p className="text-xs text-muted-foreground">
          Analyses {SAMPLE_COUNT} frames to show where on the pitch movement was most concentrated.
        </p>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Sampling {SAMPLE_COUNT} frames… {progress}%
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#f0b429] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-1 text-xs underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {status === "done" && heatGrid && (
        <div className="space-y-3">
          <PitchHeatmap grid={heatGrid} />

          {/* Legend */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Activity:</span>
            <div className="flex gap-0.5">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                <div
                  key={v}
                  className="h-3 w-7 rounded-sm"
                  style={{ backgroundColor: heatColor(v) }}
                />
              ))}
            </div>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Red zones = highest player activity. Use this to identify which third of the pitch dominated play.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Pitch SVG with heat overlay ─────────────────────────────────────────────

function PitchHeatmap({ grid }: { grid: HeatGrid }) {
  const W = 600;
  const H = 400;
  const cellW = W / GRID_COLS;
  const cellH = H / GRID_ROWS;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ aspectRatio: "3/2", display: "block" }}
      >
        {/* Pitch base */}
        <rect width={W} height={H} fill="#1a5c2a" />

        {/* Alternating pitch stripes */}
        {Array.from({ length: GRID_COLS }).map((_, i) => (
          i % 2 === 0 ? null : (
            <rect
              key={i}
              x={i * cellW}
              y={0}
              width={cellW}
              height={H}
              fill="rgba(0,0,0,0.06)"
            />
          )
        ))}

        {/* Heat zones */}
        {grid.map((row, ri) =>
          row.map((val, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellW}
              y={ri * cellH}
              width={cellW}
              height={cellH}
              fill={heatColor(val)}
              opacity={0.45 + val * 0.45}
            />
          ))
        )}

        {/* Activity score labels */}
        {grid.map((row, ri) =>
          row.map((val, ci) =>
            val > 0.15 ? (
              <text
                key={`lbl-${ri}-${ci}`}
                x={ci * cellW + cellW / 2}
                y={ri * cellH + cellH / 2 + 4}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
                fontFamily="monospace"
                opacity={0.9}
              >
                {Math.round(val * 100)}%
              </text>
            ) : null
          )
        )}

        {/* Pitch markings */}
        <PitchMarkings W={W} H={H} />
      </svg>
    </div>
  );
}

function PitchMarkings({ W, H }: { W: number; H: number }) {
  return (
    <g fill="none" stroke="white" strokeWidth={1.5} opacity={0.75}>
      {/* Outer boundary */}
      <rect x={2} y={2} width={W - 4} height={H - 4} />
      {/* Halfway line */}
      <line x1={W / 2} y1={2} x2={W / 2} y2={H - 2} />
      {/* Centre circle */}
      <circle cx={W / 2} cy={H / 2} r={H * 0.15} />
      <circle cx={W / 2} cy={H / 2} r={3} fill="white" stroke="none" />
      {/* Left penalty area */}
      <rect x={2} y={H * 0.22} width={W * 0.155} height={H * 0.56} />
      {/* Left 6-yard box */}
      <rect x={2} y={H * 0.36} width={W * 0.058} height={H * 0.28} />
      {/* Left penalty spot */}
      <circle cx={W * 0.11} cy={H / 2} r={2.5} fill="white" stroke="none" />
      {/* Right penalty area */}
      <rect x={W - 2 - W * 0.155} y={H * 0.22} width={W * 0.155} height={H * 0.56} />
      {/* Right 6-yard box */}
      <rect x={W - 2 - W * 0.058} y={H * 0.36} width={W * 0.058} height={H * 0.28} />
      {/* Right penalty spot */}
      <circle cx={W * 0.89} cy={H / 2} r={2.5} fill="white" stroke="none" />
      {/* Goals (shaded) */}
      <rect x={0} y={H * 0.43} width={4} height={H * 0.14} fill="rgba(255,255,255,0.25)" stroke="none" />
      <rect x={W - 4} y={H * 0.43} width={4} height={H * 0.14} fill="rgba(255,255,255,0.25)" stroke="none" />
      {/* Zone dividers (faint) */}
      {Array.from({ length: GRID_COLS - 1 }).map((_, i) => (
        <line
          key={`vd-${i}`}
          x1={(i + 1) * (W / GRID_COLS)}
          y1={0}
          x2={(i + 1) * (W / GRID_COLS)}
          y2={H}
          strokeDasharray="4 4"
          opacity={0.25}
        />
      ))}
      {Array.from({ length: GRID_ROWS - 1 }).map((_, i) => (
        <line
          key={`hd-${i}`}
          x1={0}
          y1={(i + 1) * (H / GRID_ROWS)}
          x2={W}
          y2={(i + 1) * (H / GRID_ROWS)}
          strokeDasharray="4 4"
          opacity={0.25}
        />
      ))}
    </g>
  );
}
