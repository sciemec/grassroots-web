"use client";

import type { Detection } from "./player-tracker";

interface DetectionOverlayProps {
  detections: Detection[];
  width: number;
  height: number;
}

/** Renders bounding boxes as an SVG overlay positioned over the video canvas. */
export function DetectionOverlay({ detections, width, height }: DetectionOverlayProps) {
  if (detections.length === 0 || width === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "100%" }}
    >
      {detections.map((d, i) => {
        const [x, y, w, h] = d.bbox;
        const pct = Math.round(d.score * 100);
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#00FF88" strokeWidth={2} />
            <rect x={x} y={y - 16} width={w < 80 ? 80 : w} height={16} fill="rgba(0,255,136,0.8)" />
            <text
              x={x + 4}
              y={y - 3}
              fill="#000"
              fontSize={11}
              fontWeight="bold"
              fontFamily="monospace"
            >
              {d.class} {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
