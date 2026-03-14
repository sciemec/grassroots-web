"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download } from "lucide-react";

export interface Sponsor {
  id: string;
  /** Display name of the sponsor */
  name: string;
  /** Text-only logo fallback (no image URL needed for v1) */
  logoText: string;
  /** Brand colour as a hex string, e.g. "#00B050" */
  color: string;
  position: "bottom-left" | "bottom-right" | "bottom-center" | "top-right";
}

export interface MatchInfo {
  home: string;
  away: string;
  score: string;
  minute: number;
}

export interface SponsorshipOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  sponsors: Sponsor[];
  matchInfo?: MatchInfo;
  onCapture?: (dataUrl: string) => void;
}

/** Default demo sponsors pre-loaded for Zimbabwean businesses */
export const DEFAULT_SPONSORS: Sponsor[] = [
  { id: "econet",  name: "Econet",  logoText: "ECONET",  color: "#00B050", position: "top-right" },
  { id: "delta",   name: "Delta",   logoText: "DELTA",   color: "#CC0000", position: "bottom-left" },
  { id: "innscor", name: "Innscor", logoText: "INNSCOR", color: "#003DA5", position: "bottom-right" },
];

const BADGE_HEIGHT = 36;
const BADGE_PADDING = 10;
const TICKER_HEIGHT = 42;

/**
 * Renders a canvas overlay on top of a video element with sponsor branding
 * and a live score ticker bar.  "Capture frame" burns overlays into a PNG.
 */
export function SponsorshipOverlay({
  videoRef,
  sponsors,
  matchInfo,
  onCapture,
}: SponsorshipOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [captured, setCaptured] = useState(false);

  /** Draw one frame: mirror video → overlays → sponsors */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video element's displayed size
    const { videoWidth, videoHeight } = video;
    if (videoWidth === 0 || videoHeight === 0) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Mirror the video frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // ── Score ticker bar (bottom-center) ──────────────────────────────────────
    if (matchInfo) {
      const tickerY = videoHeight - TICKER_HEIGHT;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, tickerY, videoWidth, TICKER_HEIGHT);

      ctx.font = `bold ${BADGE_HEIGHT * 0.5}px Inter, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tickerText = `${matchInfo.home}  ${matchInfo.score}  ${matchInfo.away}   ${matchInfo.minute}'`;
      ctx.fillText(tickerText, videoWidth / 2, tickerY + TICKER_HEIGHT / 2);
    }

    // ── Sponsor badges ─────────────────────────────────────────────────────────
    for (const sponsor of sponsors) {
      drawSponsorBadge(ctx, sponsor, videoWidth, videoHeight);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [videoRef, sponsors, matchInfo]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  /** Capture current frame with overlays burned in as PNG */
  const captureFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pause the RAF loop so we get a clean snapshot
    cancelAnimationFrame(rafRef.current);

    // Redraw once synchronously with latest video frame
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx && video) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (matchInfo) {
        const tickerY = canvas.height - TICKER_HEIGHT;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(0, tickerY, canvas.width, TICKER_HEIGHT);
        ctx.font = `bold 18px Inter, sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tickerText = `${matchInfo.home}  ${matchInfo.score}  ${matchInfo.away}   ${matchInfo.minute}'`;
        ctx.fillText(tickerText, canvas.width / 2, tickerY + TICKER_HEIGHT / 2);
      }
      for (const sponsor of sponsors) {
        drawSponsorBadge(ctx, sponsor, canvas.width, canvas.height);
      }
    }

    const dataUrl = canvas.toDataURL("image/png");
    onCapture?.(dataUrl);

    // Trigger browser download
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `grassroots-frame-${Date.now()}.png`;
    a.click();

    setCaptured(true);
    setTimeout(() => setCaptured(false), 2000);

    // Resume animation loop
    rafRef.current = requestAnimationFrame(drawFrame);
  };

  return (
    <div className="relative w-full">
      {/* Canvas mirrors the video with overlays */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl"
        style={{ display: "block" }}
      />

      {/* Capture button */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Sponsor overlay preview — {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} active
        </span>
        <button
          onClick={captureFrame}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            captured
              ? "border-green-500/40 bg-green-500/10 text-green-700"
              : "hover:bg-muted"
          }`}
        >
          {captured ? (
            <>
              <Download className="h-3.5 w-3.5" /> Saved!
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" /> Capture frame
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Draw a single sponsor badge at its configured position. */
function drawSponsorBadge(
  ctx: CanvasRenderingContext2D,
  sponsor: Sponsor,
  w: number,
  h: number
) {
  const badgeW = 120;
  const margin = 12;
  const tickerOffset = 48; // leave room above the score ticker

  let x = margin;
  let y = margin;

  switch (sponsor.position) {
    case "top-right":
      x = w - badgeW - margin;
      y = margin;
      break;
    case "bottom-left":
      x = margin;
      y = h - BADGE_HEIGHT - margin - tickerOffset;
      break;
    case "bottom-right":
      x = w - badgeW - margin;
      y = h - BADGE_HEIGHT - margin - tickerOffset;
      break;
    case "bottom-center":
      x = (w - badgeW) / 2;
      y = h - BADGE_HEIGHT - margin - tickerOffset;
      break;
  }

  // Badge background using brand colour with opacity
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = sponsor.color;
  roundedRect(ctx, x, y, badgeW, BADGE_HEIGHT, 6);
  ctx.fill();
  ctx.restore();

  // Logo text
  ctx.save();
  ctx.font = `bold ${BADGE_HEIGHT * 0.42}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(sponsor.logoText, x + badgeW / 2, y + BADGE_HEIGHT / 2, badgeW - BADGE_PADDING);
  ctx.restore();
}

/** Draw a rounded rectangle path. */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
