"use client";

/**
 * PlayerTracker — uses TensorFlow.js + COCO-SSD for in-browser player detection.
 *
 * TF.js and COCO-SSD are NOT bundled — they are loaded from CDN on demand to
 * avoid adding ~5 MB to the initial JS bundle. The user must explicitly click
 * "Load AI Model" before processing begins.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Brain, Cpu, Loader2 } from "lucide-react";
import { DetectionOverlay } from "./player-tracker-overlay";

export interface Detection {
  bbox: [number, number, number, number]; // x, y, width, height (pixels)
  class: string;
  score: number;
  frameIndex: number;
}

export interface PlayerTrackerProps {
  videoFile?: File;
  /** Called with all detections after analysis finishes. */
  onDetections?: (detections: Detection[]) => void;
}

type TrackerState = "idle" | "loading-model" | "model-ready" | "analysing" | "done" | "error";

// CDN URLs for TF.js and COCO-SSD
const TF_CDN = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js";
const COCO_CDN = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd/dist/coco-ssd.min.js";

const SAMPLE_COUNT = 12; // frames to analyse per video

/** Inject a script tag and resolve when loaded. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/** Seek a video element to a given time and wait for the seek to complete. */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.currentTime = time;
    video.addEventListener("seeked", () => resolve(), { once: true });
  });
}

/** Sample n frames evenly from a video file using a canvas element. */
async function sampleFrames(
  videoFile: File,
  targetCount: number
): Promise<{ canvas: HTMLCanvasElement; timeMs: number }[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    video.addEventListener("loadedmetadata", async () => {
      const duration = video.duration;
      const step = duration / (targetCount + 1);
      const results: { canvas: HTMLCanvasElement; timeMs: number }[] = [];
      const offscreen = document.createElement("canvas");
      const ctx = offscreen.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D context not available")); return; }

      for (let i = 1; i <= targetCount; i++) {
        const t = step * i;
        await seekTo(video, t);
        offscreen.width = video.videoWidth;
        offscreen.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const clone = document.createElement("canvas");
        clone.width = offscreen.width;
        clone.height = offscreen.height;
        clone.getContext("2d")?.drawImage(offscreen, 0, 0);
        results.push({ canvas: clone, timeMs: Math.round(t * 1000) });
      }

      URL.revokeObjectURL(video.src);
      resolve(results);
    });

    video.addEventListener("error", () => reject(new Error("Video load error")));
    video.load();
  });
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
      <p className="text-base font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

/**
 * PlayerTracker component — loads TF.js + COCO-SSD from CDN and runs
 * player detection across sampled frames from the provided video file.
 */
export function PlayerTracker({ videoFile, onDetections }: PlayerTrackerProps) {
  const [trackerState, setTrackerState] = useState<TrackerState>("idle");
  const [progress, setProgress] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewDims, setPreviewDims] = useState({ width: 0, height: 0 });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelRef = useRef<any>(null);

  /** Load TF.js and COCO-SSD from CDN, then warm up the model. */
  const loadModel = async () => {
    setTrackerState("loading-model");
    setErrorMsg("");
    try {
      await loadScript(TF_CDN);
      await loadScript(COCO_CDN);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cocoSsd = (window as unknown as { cocoSsd: any }).cocoSsd;
      if (!cocoSsd) throw new Error("COCO-SSD failed to load from CDN");
      modelRef.current = await cocoSsd.load();
      setTrackerState("model-ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Model load failed");
      setTrackerState("error");
    }
  };

  /** Run detection on sampled frames from the video file. */
  const analyseVideo = useCallback(async () => {
    if (!videoFile || !modelRef.current) return;
    setTrackerState("analysing");
    setProgress(0);
    setDetections([]);
    setErrorMsg("");

    try {
      const frames = await sampleFrames(videoFile, SAMPLE_COUNT);
      const allDetections: Detection[] = [];

      for (let i = 0; i < frames.length; i++) {
        const { canvas } = frames[i];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const preds: any[] = await modelRef.current.detect(canvas);

        const personPreds = preds
          .filter((p) => p.class === "person" && p.score > 0.4)
          .map((p) => ({
            bbox: p.bbox as [number, number, number, number],
            class: p.class as string,
            score: p.score as number,
            frameIndex: i,
          }));

        allDetections.push(...personPreds);
        setProgress(Math.round(((i + 1) / frames.length) * 100));

        // Render last frame to preview canvas
        if (i === frames.length - 1 && previewCanvasRef.current) {
          const previewCtx = previewCanvasRef.current.getContext("2d");
          previewCanvasRef.current.width = canvas.width;
          previewCanvasRef.current.height = canvas.height;
          previewCtx?.drawImage(canvas, 0, 0);
          setPreviewDims({ width: canvas.width, height: canvas.height });
        }
      }

      setDetections(allDetections);
      onDetections?.(allDetections);
      setTrackerState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      setTrackerState("error");
    }
  }, [videoFile, onDetections]);

  useEffect(() => {
    if (videoFile && trackerState === "model-ready") analyseVideo();
  }, [videoFile, trackerState, analyseVideo]);

  const personDetections = detections.filter((d) => d.class === "person");
  const avgConfidence =
    personDetections.length > 0
      ? Math.round((personDetections.reduce((s, d) => s + d.score, 0) / personDetections.length) * 100)
      : 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">AI Player Tracker</span>
        {trackerState === "model-ready" && (
          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-600">Model ready</span>
        )}
      </div>

      {trackerState === "idle" && (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <Brain className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">TensorFlow.js Player Detection</p>
          <p className="mb-4 text-xs text-muted-foreground">Detects players in video frames using COCO-SSD (~5 MB model, loaded from CDN)</p>
          <button onClick={loadModel} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Load AI Model (~5 MB)
          </button>
        </div>
      )}

      {trackerState === "loading-model" && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading TensorFlow.js model from CDN…</span>
        </div>
      )}

      {trackerState === "model-ready" && !videoFile && (
        <div className="rounded-xl border border-dashed p-5 text-center">
          <p className="text-sm text-muted-foreground">Upload a video file above to start player detection</p>
        </div>
      )}

      {trackerState === "analysing" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analysing frames for players…</span><span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {trackerState === "done" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatChip label="Players detected" value={personDetections.length} />
            <StatChip label="Avg confidence" value={`${avgConfidence}%`} />
            <StatChip label="Frames analysed" value={SAMPLE_COUNT} />
          </div>
          {previewDims.width > 0 && (
            <div className="relative overflow-hidden rounded-xl border">
              <canvas ref={previewCanvasRef} className="w-full" />
              <DetectionOverlay
                detections={detections.filter((d) => d.frameIndex === SAMPLE_COUNT - 1)}
                width={previewDims.width}
                height={previewDims.height}
              />
            </div>
          )}
          <button onClick={analyseVideo} className="w-full rounded-xl border py-2 text-sm font-medium hover:bg-muted transition-colors">Re-analyse</button>
        </div>
      )}

      {trackerState === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorMsg || "An error occurred. Please try again."}</span>
        </div>
      )}
    </div>
  );
}
