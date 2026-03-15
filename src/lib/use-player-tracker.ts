"use client";
import { useEffect, useRef, useState } from "react";

export interface TrackerState {
  playerCount: number;
  loading: boolean;
  ready: boolean;
  error: string;
}

interface Prediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface CocoSsdModel {
  detect: (el: HTMLVideoElement) => Promise<Prediction[]>;
}

export function usePlayerTracker(
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  enabled: boolean
): TrackerState {
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const modelRef = useRef<CocoSsdModel | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  // Load model when enabled
  useEffect(() => {
    if (!enabled) {
      setReady(false);
      setLoading(false);
      setError("");
      modelRef.current = null;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        await import("@tensorflow/tfjs");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (cancelled) return;
        modelRef.current = model as unknown as CocoSsdModel;
        setReady(true);
      } catch {
        if (!cancelled) setError("Failed to load player tracking model.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  // Run detection loop when ready
  useEffect(() => {
    if (!ready || !enabled) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /** Draws bounding boxes and labels for detected players. */
    const detect = async () => {
      frameRef.current++;
      if (
        video.readyState >= 2 &&
        frameRef.current % 6 === 0 &&
        modelRef.current
      ) {
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        try {
          const predictions = await modelRef.current.detect(video);
          const players = predictions.filter(
            (p) => p.class === "person" && p.score > 0.5
          );

          players.forEach((p, i) => {
            const [x, y, w, h] = p.bbox;
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#22c55e";
            ctx.font = "bold 12px monospace";
            const label = `P${i + 1} ${Math.round(p.score * 100)}%`;
            const labelWidth = label.length * 7.5;
            ctx.fillRect(x, y - 18, labelWidth, 18);
            ctx.fillStyle = "#000";
            ctx.fillText(label, x + 2, y - 4);
          });

          setPlayerCount(players.length);
        } catch {
          // Skip frame on inference error — do not interrupt the loop
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPlayerCount(0);
    };
  }, [ready, enabled, videoRef, canvasRef]);

  return { playerCount, loading, ready, error };
}
