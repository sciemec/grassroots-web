"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, CheckCircle2, AlertTriangle,
  Star, TrendingUp, TrendingDown, Zap, Target,
  Clock, ChevronDown, ChevronUp, Dumbbell, Download,
  Share2, BookOpen, ChevronRight, ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { compressVideo } from "@/lib/compress-video";
import { downloadPlayerMatchEyePdf } from "@/lib/generate-analysis-pdf";
import { getUploadAdvisory, type UploadAdvisory } from "@/lib/upload-chunks";
import { getUploadStrategy, type UploadStrategyResult } from "@/lib/use-upload-strategy";
import { flushQueue } from "@/lib/upload-queue";
import { UploadGate } from "@/components/upload/UploadGate";
import { saveAnalysisEvent } from "@/lib/thuto-context";

const GRS_GREEN = "#1a5c2a";
const SPORTS = [
  "Football","Rugby","Netball","Basketball","Cricket",
  "Athletics","Swimming","Tennis","Volleyball","Hockey",
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface KeyMoment {
  time: string;
  type: "strength" | "weakness" | "neutral";
  description: string;
}

interface DrillRecommendation {
  drill_id?: string | null;
  drill: string;
  why: string;
  frequency: string;
}

interface TurnoverMoment {
  time:            string;
  decision:        string;
  consequence:     string;
  principle_id:    string;
  principle_title: string;
  principle_fix:   string;
  safety_flag:     boolean;
  safety_note?:    string;
}

interface PlayerAnalysis {
  overall_rating: number;
  performance_summary: string;
  key_moments: KeyMoment[];
  technical_strengths: string[];
  areas_to_improve: string[];
  positioning_analysis: string;
  physical_assessment: string;
  tactical_understanding: string;
  drill_recommendations: DrillRecommendation[];
  turnover_moments?: TurnoverMoment[];
  scout_note: string;
}

type PageStage = "setup" | "confirm" | "uploading" | "uploaded" | "analysing" | "results" | "error";

interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

interface MediaPipeData {
  landmarks?: PoseLandmark[];
  angles?: Record<string, number>;
  confidence?: number;
  frame_count?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ratingColor(r: number) {
  if (r >= 8) return "#16a34a";
  if (r >= 6) return "#d97706";
  if (r >= 4) return "#ea580c";
  return "#dc2626";
}

function momentColor(type: KeyMoment["type"]) {
  if (type === "strength") return { bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" };
  if (type === "weakness") return { bg: "#fef9c3", border: "#fde047", dot: "#ca8a04" };
  return { bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" };
}

// ── MediaPipe Pose helpers ──────────────────────────────────────────────────

/** Extract N evenly-spaced frames from a video File using canvas. */
async function extractVideoFrames(file: File, count = 8): Promise<ImageBitmap[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    const frames: ImageBitmap[] = [];

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) { URL.revokeObjectURL(url); resolve([]); return; }
      const interval = duration / (count + 1);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve([]); return; }
      for (let i = 1; i <= count; i++) {
        await new Promise<void>((res) => { video.currentTime = interval * i; video.onseeked = () => res(); });
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        ctx.drawImage(video, 0, 0);
        try { frames.push(await createImageBitmap(canvas)); } catch { /* skip */ }
      }
      URL.revokeObjectURL(url);
      resolve(frames);
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    video.src = url;
  });
}

/** Angle (degrees) at joint B formed by segments A→B and B→C. */
function computeAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): number {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(rad * 180 / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

const POSE_LANDMARK_NAMES = [
  "nose","left_eye_inner","left_eye","left_eye_outer","right_eye_inner","right_eye",
  "right_eye_outer","left_ear","right_ear","mouth_left","mouth_right",
  "left_shoulder","right_shoulder","left_elbow","right_elbow","left_wrist","right_wrist",
  "left_pinky","right_pinky","left_index","right_index","left_thumb","right_thumb",
  "left_hip","right_hip","left_knee","right_knee","left_ankle","right_ankle",
  "left_heel","right_heel","left_foot_index","right_foot_index",
];

/**
 * Run MediaPipe Pose on the first 8 key frames of a video file.
 * Returns averaged landmarks + computed joint angles, or null if unavailable.
 * Never throws — all errors are silently swallowed.
 */
async function runMediaPipeOnFile(file: File): Promise<MediaPipeData | null> {
  try {
    // Dynamic import avoids SSR issues and keeps it out of the initial bundle
    const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm",
    );
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses: 1,
    }) as unknown as {
      detect(frame: ImageBitmap): { poseLandmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>> };
      close(): void;
    };

    const frames = await extractVideoFrames(file, 8);
    if (frames.length === 0) { landmarker.close(); return null; }

    // Accumulate landmarks across frames
    type RawPoint = { x: number; y: number; z: number; visibility: number };
    const accumulated: RawPoint[][] = [];
    let totalConf = 0, confCount = 0;

    for (const frame of frames) {
      const result = landmarker.detect(frame);
      if (result.poseLandmarks?.length) {
        accumulated.push(result.poseLandmarks[0] as RawPoint[]);
        const avgVis = (result.poseLandmarks[0] as RawPoint[])
          .reduce((s, l) => s + (l.visibility ?? 0), 0) / result.poseLandmarks[0].length;
        totalConf += avgVis;
        confCount++;
      }
    }

    landmarker.close();
    frames.forEach((f) => f.close());

    if (accumulated.length === 0) return null;

    // Average landmark positions across detected frames
    const n = accumulated[0].length;
    const avg = Array.from({ length: n }, (_, i) => ({
      x:          accumulated.reduce((s, f) => s + f[i].x,          0) / accumulated.length,
      y:          accumulated.reduce((s, f) => s + f[i].y,          0) / accumulated.length,
      z:          accumulated.reduce((s, f) => s + f[i].z,          0) / accumulated.length,
      visibility: accumulated.reduce((s, f) => s + (f[i].visibility ?? 0), 0) / accumulated.length,
    }));

    const landmarks: PoseLandmark[] = avg.map((p, i) => ({
      name: POSE_LANDMARK_NAMES[i] ?? `landmark_${i}`,
      x: p.x, y: p.y, z: p.z, visibility: p.visibility,
    }));

    // Key joint angles (indices: 11=L_shoulder 12=R_shoulder 13=L_elbow 14=R_elbow
    // 15=L_wrist 16=R_wrist 23=L_hip 24=R_hip 25=L_knee 26=R_knee 27=L_ankle 28=R_ankle)
    const angles: Record<string, number> = {};
    if (avg.length > 28) {
      angles.knee_left   = computeAngle(avg[23], avg[25], avg[27]);
      angles.knee_right  = computeAngle(avg[24], avg[26], avg[28]);
      angles.hip_left    = computeAngle(avg[11], avg[23], avg[25]);
      angles.hip_right   = computeAngle(avg[12], avg[24], avg[26]);
      angles.elbow_left  = computeAngle(avg[11], avg[13], avg[15]);
      angles.elbow_right = computeAngle(avg[12], avg[14], avg[16]);
      angles.trunk_lean  = computeAngle(avg[23], avg[11], avg[13]);
    }

    return {
      landmarks,
      angles,
      confidence:  confCount > 0 ? totalConf / confCount : undefined,
      frame_count: accumulated.length,
    };
  } catch {
    return null; // MediaPipe unavailable — skip gracefully
  }
}

// ── Safety & Injury Exposure ────────────────────────────────────────────────

const BALL_RETENTION_KEYWORDS = [
  "hold", "held the ball", "too long", "slow release", "reluctant to release",
  "too many touches", "excessive touches", "takes too long", "doesn't release",
  "under pressure", "tight area", "pressed", "dispossessed", "loses the ball",
  "needs to play quicker", "release earlier", "play quicker",
];

function extractPlayerSafetyFlags(analysis: PlayerAnalysis): string[] {
  const flags: string[] = [];
  const lower = (s: string) => s.toLowerCase();

  for (const m of analysis.key_moments ?? []) {
    const desc = lower(m.description);
    if (BALL_RETENTION_KEYWORDS.some((kw) => desc.includes(kw))) {
      flags.push(m.description);
    }
  }
  for (const a of analysis.areas_to_improve ?? []) {
    if (BALL_RETENTION_KEYWORDS.some((kw) => lower(a).includes(kw))) {
      flags.push(a);
    }
  }
  if (analysis.physical_assessment) {
    const pl = lower(analysis.physical_assessment);
    if (BALL_RETENTION_KEYWORDS.some((kw) => pl.includes(kw))) {
      flags.push(analysis.physical_assessment);
    }
  }

  return Array.from(new Set(flags));
}

function PlayerSafetyExposureNotes({ analysis }: { analysis: PlayerAnalysis }) {
  const flags = extractPlayerSafetyFlags(analysis);
  if (flags.length === 0) return null;

  return (
    <div style={{
      background: "#fffbeb", borderRadius: 14,
      border: "1px solid #f59e0b", overflow: "hidden",
    }}>
      <div style={{
        background: "#f59e0b", padding: "8px 14px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <ShieldAlert size={14} color="#fff" />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Safety &amp; Injury Exposure
        </span>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5, marginBottom: 10 }}>
          Moments were observed where you held the ball under pressure or in tight areas.
          At grassroots level, this increases exposure to mistimed challenges and physical contact.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
          {flags.map((flag, i) => (
            <div key={i} style={{
              background: "#fef3c7", borderRadius: 8, padding: "7px 10px",
              border: "1px solid #fde68a", fontSize: 12, color: "#78350f", lineHeight: 1.4,
            }}>
              ⚡ {flag}
            </div>
          ))}
        </div>
        <div style={{
          background: "#fff7ed", borderRadius: 10, border: "1px solid #fdba74",
          padding: "10px 12px",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#c2410c", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Coaching Fix
          </p>
          <p style={{ fontSize: 12, color: "#7c2d12", lineHeight: 1.5, margin: 0 }}>
            Work on 1–2 touch passing in tight spaces. Scan before receiving and know your next
            action before the ball arrives — this reduces dwell time and your exposure to physical challenges.
          </p>
        </div>
        <p style={{ fontSize: 10, color: "#b45309", fontStyle: "italic", marginTop: 8, lineHeight: 1.4 }}>
          This is a coaching observation, not a medical assessment.
        </p>
      </div>
    </div>
  );
}

// ── Turnover → Tactical Academy ────────────────────────────────────────────────

function TurnoverInsights({ analysis }: { analysis: PlayerAnalysis }) {
  const moments = (analysis.turnover_moments ?? []).filter(
    (m) => m.decision && m.principle_title
  );
  if (moments.length === 0) return null;

  return (
    <div style={{ borderRadius: 14, border: "1px solid #fca5a5", overflow: "hidden" }}>
      <div style={{
        background: "#dc2626", padding: "8px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Turnover Analysis
        </span>
        <Link
          href="/player/tactics"
          style={{ fontSize: 10, fontWeight: 700, color: "#fca5a5", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}
        >
          Tactics Academy →
        </Link>
      </div>
      <div style={{ background: "#fff5f5", padding: "10px 14px 14px" }}>
        <p style={{ fontSize: 11, color: "#7f1d1d", lineHeight: 1.5, marginBottom: 12 }}>
          Possession was lost through decision-making that a tactical principle could address.
          Study these in the Tactics Academy before your next session.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {moments.map((m, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: 10,
              border: `1px solid ${m.safety_flag ? "#fca5a5" : "#e5e7eb"}`,
              overflow: "hidden",
            }}>
              {/* Time + safety badge row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 12px",
                background: m.safety_flag ? "#fef2f2" : "#f9fafb",
                borderBottom: "1px solid #f3f4f6",
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#fff",
                  background: "#374151", borderRadius: 6, padding: "2px 6px",
                }}>
                  {m.time}
                </span>
                {m.safety_flag && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: "#fff",
                    background: "#dc2626", borderRadius: 6, padding: "2px 7px",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    ⚡ Contact Risk
                  </span>
                )}
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Decision & consequence */}
                <p style={{ fontSize: 12, color: "#111", fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                  {m.decision}
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4, margin: 0 }}>
                  → {m.consequence}
                </p>
                {/* Safety note when applicable */}
                {m.safety_flag && m.safety_note && (
                  <div style={{
                    background: "#fef2f2", borderRadius: 8, padding: "6px 10px",
                    border: "1px solid #fca5a5", fontSize: 11, color: "#991b1b", lineHeight: 1.4,
                  }}>
                    🛡 {m.safety_note}
                  </div>
                )}
                {/* Tactical principle link */}
                <div style={{
                  background: "#f0fdf4", borderRadius: 8, padding: "8px 10px",
                  border: "1px solid #bbf7d0",
                }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                    Tactics Academy Fix
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#1a5c2a", marginBottom: 3 }}>
                    {m.principle_title}
                  </p>
                  <p style={{ fontSize: 11, color: "#166534", lineHeight: 1.4, marginBottom: 6 }}>
                    {m.principle_fix}
                  </p>
                  <Link
                    href={`/player/tactics?principle=${m.principle_id}`}
                    style={{
                      fontSize: 10, fontWeight: 800, color: "#fff",
                      background: "#1a5c2a", borderRadius: 6, padding: "4px 10px",
                      textDecoration: "none", display: "inline-block",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >
                    Study in Tactics Academy →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10, color: "#b91c1c", fontStyle: "italic", marginTop: 10, lineHeight: 1.4 }}>
          Turnover moments are identified from THUTO&apos;s video analysis — verify against your own footage.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ExpandableSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{title}</span>
        {open ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

function ResultsPanel({ analysis, narrative }: { analysis: PlayerAnalysis; narrative: string }) {
  const rating = Math.min(10, Math.max(1, Math.round(analysis.overall_rating)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Rating card */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: 20,
        border: `2px solid ${ratingColor(rating)}22`,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `${ratingColor(rating)}18`,
          border: `3px solid ${ratingColor(rating)}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: ratingColor(rating), lineHeight: 1 }}>{rating}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: ratingColor(rating), letterSpacing: "0.05em" }}>/ 10</span>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 4 }}>
            Performance Rating
          </p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{analysis.performance_summary}</p>
        </div>
      </div>

      {/* Key moments */}
      {analysis.key_moments?.length > 0 && (
        <ExpandableSection title="Key Moments">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.key_moments.map((m, i) => {
              const c = momentColor(m.type);
              return (
                <div key={i} style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 10, padding: "10px 12px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: c.dot, marginTop: 4, flexShrink: 0,
                  }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.dot, marginRight: 8 }}>
                      {m.time}
                    </span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{m.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>
      )}

      {/* Strengths + Areas to improve side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#f0fdf4", borderRadius: 14, border: "1px solid #bbf7d0", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} color="#16a34a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Strengths
            </span>
          </div>
          {(analysis.technical_strengths ?? []).map((s, i) => (
            <p key={i} style={{ fontSize: 12, color: "#166534", marginBottom: 6, lineHeight: 1.4 }}>• {s}</p>
          ))}
        </div>
        <div style={{ background: "#fffbeb", borderRadius: 14, border: "1px solid #fde68a", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrendingDown size={14} color="#d97706" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              To Improve
            </span>
          </div>
          {(analysis.areas_to_improve ?? []).map((s, i) => (
            <p key={i} style={{ fontSize: 12, color: "#92400e", marginBottom: 6, lineHeight: 1.4 }}>• {s}</p>
          ))}
        </div>
      </div>

      {/* Safety & Injury Exposure Notes */}
      <PlayerSafetyExposureNotes analysis={analysis} />

      {/* Turnover → Tactical Academy */}
      <TurnoverInsights analysis={analysis} />

      {/* Detailed breakdowns */}
      {analysis.positioning_analysis && (
        <ExpandableSection title="Positioning & Movement">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.positioning_analysis}</p>
        </ExpandableSection>
      )}
      {analysis.physical_assessment && (
        <ExpandableSection title="Physical Assessment">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.physical_assessment}</p>
        </ExpandableSection>
      )}
      {analysis.tactical_understanding && (
        <ExpandableSection title="Tactical Understanding">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.tactical_understanding}</p>
        </ExpandableSection>
      )}

      {/* Drill recommendations */}
      {analysis.drill_recommendations?.length > 0 && (
        <ExpandableSection title="Recommended Drills">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analysis.drill_recommendations.map((d, i) =>
              d.drill_id ? (
                <Link
                  key={i}
                  href={`/player/drills?highlight=${d.drill_id}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div style={{
                    background: "#f0fdf4", border: "1px solid #86efac",
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Dumbbell size={13} color="#15803d" />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#15803d" }}>{d.drill}</span>
                      <span style={{
                        marginLeft: "auto", fontSize: 10, fontWeight: 700,
                        background: "#dcfce7", color: "#15803d",
                        padding: "2px 8px", borderRadius: 20,
                      }}>{d.frequency}</span>
                      <ChevronRight size={12} color="#15803d" />
                    </div>
                    <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.4, margin: 0 }}>{d.why}</p>
                  </div>
                </Link>
              ) : (
                <div key={i} style={{
                  background: "#f0f9ff", border: "1px solid #bae6fd",
                  borderRadius: 10, padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Dumbbell size={13} color="#0284c7" />
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>{d.drill}</span>
                    <span style={{
                      marginLeft: "auto", fontSize: 10, fontWeight: 700,
                      background: "#e0f2fe", color: "#0369a1",
                      padding: "2px 8px", borderRadius: 20,
                    }}>{d.frequency}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{d.why}</p>
                </div>
              )
            )}
          </div>
        </ExpandableSection>
      )}

      {/* Scout note */}
      {analysis.scout_note && (
        <div style={{
          background: "#fff", border: `1px solid ${GRS_GREEN}33`,
          borderLeft: `4px solid ${GRS_GREEN}`,
          borderRadius: 10, padding: "12px 14px",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GRS_GREEN, marginBottom: 6 }}>
            Scout Note
          </p>
          <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>
            &ldquo;{analysis.scout_note}&rdquo;
          </p>
        </div>
      )}

      {/* Claude narrative */}
      {narrative && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star size={13} color="#f0b429" fill="#f0b429" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: GRS_GREEN }}>Personal Coaching Message</span>
          </div>
          {narrative.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 10 }}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PlayerMatchEyePage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [pageStage, setPageStage]     = useState<PageStage>("setup");
  const [savedId,       setSavedId]       = useState<string | null>(null);
  const [passportSaved, setPassportSaved] = useState(false);
  const [arenaShared,   setArenaShared]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [sharing,       setSharing]       = useState(false);
  const [uploadPct, setUploadPct]     = useState(0);
  const [fileUri,   setFileUri]       = useState("");
  const [fileName,  setFileName]      = useState("");
  const [mimeType,  setMimeType]      = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [sport,         setSport]         = useState("Football");
  const [position,      setPosition]      = useState("");
  const [jersey,        setJersey]        = useState("");
  const [focusQuestion, setFocusQuestion] = useState("");

  const [analysis,    setAnalysis]    = useState<PlayerAnalysis | null>(null);
  const [narrative,   setNarrative]   = useState("");
  const [error,       setError]       = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [advisory,    setAdvisory]    = useState<UploadAdvisory | null>(null);
  const [gateProbing,  setGateProbing]  = useState(false);
  const [gateStrategy, setGateStrategy] = useState<UploadStrategyResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [poseData, setPoseData] = useState<MediaPipeData | null>(null);

  // ── Upload via R2 → Laravel job → Gemini Files API ───────────────────────
  // Bypasses the Render proxy entirely (avoids 60s load-balancer timeout).
  // Flow: compress → presigned PUT to R2 → POST r2_key to Laravel →
  //       poll until status='uploaded' → receive fileUri for analyse step.

  const uploadVideo = useCallback(async (file: File) => {
    setPageStage("uploading");
    setUploadPct(0);
    setError("");
    setUploadedFile(file);

    // Fire MediaPipe pose analysis concurrently — WASM runs while R2 uploads
    // and Gemini processes (60–120 s), so the ~5–10 s pose analysis is free.
    const posePromise = runMediaPipeOnFile(file);

    try {
      // Step 1 — Compress to 720p H.264
      const fileToUpload = await compressVideo(file, (pct) => setUploadPct(Math.round(pct * 0.4)));

      // Step 2 — Get a presigned R2 PUT URL (direct to R2, no Render proxy)
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName:    fileToUpload.name || file.name,
          contentType: fileToUpload.type || "video/mp4",
          source:      "match-eye",
        }),
      });
      if (!presignRes.ok) throw new Error("Could not get upload URL");
      const { uploadUrl, publicUrl, key } = await presignRes.json() as { uploadUrl: string; publicUrl: string; key: string };

      // Step 3 — PUT file directly to R2 (progress 40→80%)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(40 + Math.round((e.loaded / e.total) * 40));
        };
        xhr.onload  = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Connection dropped during upload. Check your signal and try again."));
        xhr.timeout  = 180_000;
        xhr.ontimeout = () => reject(new Error("Upload timed out. Try a smaller clip or a stronger connection."));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", fileToUpload.type || "video/mp4");
        xhr.send(fileToUpload);
      });

      setUploadPct(80);

      // Step 4 — Submit r2_key to Laravel; background worker forwards to Gemini
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const submitRes = await fetch(`${apiBase}/match-eye/player-upload`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          r2_key:         key,
          r2_url:         publicUrl,
          sport,
          position,
          jersey:         jersey   || undefined,
          focus_question: focusQuestion || undefined,
          mime_type:      fileToUpload.type || "video/mp4",
        }),
      });
      if (!submitRes.ok) throw new Error("Could not submit clip for processing");
      const { upload_id } = await submitRes.json() as { upload_id: string };

      // Step 5 — Poll every 4 s until status='uploaded' or 'failed' (max 8 min)
      setUploadPct(85);
      const maxPolls = 120;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, 4_000));
        const pollRes = await fetch(`${apiBase}/match-eye/player-upload/${upload_id}`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!pollRes.ok) continue;
        const poll = await pollRes.json() as { status: string; file_uri?: string; file_name?: string; mime_type?: string; error?: string };

        if (poll.status === "uploaded" && poll.file_uri) {
          setFileUri(poll.file_uri);
          setFileName(poll.file_name ?? "");
          setMimeType(poll.mime_type ?? "video/mp4");
          setUploadPct(100);
          // Collect MediaPipe result (ran concurrently — should be ready by now)
          const pose = await posePromise;
          if (pose) setPoseData(pose);
          setPageStage("uploaded");
          return;
        }

        if (poll.status === "failed") {
          throw new Error(poll.error ?? "Background processing failed. Please try again.");
        }

        // Still processing — bump progress indicator slightly
        setUploadPct(Math.min(98, 85 + Math.round((i / maxPolls) * 13)));
      }

      throw new Error("Upload timed out waiting for Gemini. Please try again.");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPageStage("error");
    }
  }, [token, sport, position, jersey, focusQuestion]);

  const confirmAndUpload = (file: File) => {
    const adv = getUploadAdvisory(file);
    if (adv.limitError) {
      setError(adv.limitError);
      setPageStage("error");
      return;
    }
    setPendingFile(file);
    setAdvisory(adv);
    setPageStage("confirm");
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) confirmAndUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) confirmAndUpload(file);
  };

  // ── Analyse ─────────────────────────────────────────────────────────────────

  const analyse = useCallback(async () => {
    if (!fileUri || !fileName) return;
    setPageStage("analysing");
    setError("");

    try {
      const res = await fetch("/api/player/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri, fileName, mimeType,
          sport, position, jersey, focusQuestion,
          poseData: poseData ?? undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Analysis failed (${res.status})`);
      }
      const data = await res.json() as { analysis: PlayerAnalysis; narrative: string };
      setAnalysis(data.analysis);
      setNarrative(data.narrative ?? "");
      // Save to THUTO player intelligence context
      saveAnalysisEvent({
        tool: "match-eye",
        timestamp: new Date().toISOString(),
        sport,
        position,
        summary: data.analysis.performance_summary?.slice(0, 200) ?? "Match video analysis completed.",
        score: data.analysis.overall_rating != null
          ? Math.min(100, Math.round(data.analysis.overall_rating * 10))
          : undefined,
        strengths:    (data.analysis.technical_strengths ?? []).slice(0, 2),
        improvements: (data.analysis.areas_to_improve ?? []).slice(0, 2),
      });
      setPageStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setPageStage("error");
    }
  }, [fileUri, fileName, mimeType, sport, position, jersey, focusQuestion]);

  const reset = () => {
    setPageStage("setup");
    setUploadPct(0);
    setFileUri("");
    setFileName("");
    setMimeType("");
    setUploadedFile(null);
    setAnalysis(null);
    setNarrative("");
    setError("");
    setPendingFile(null);
    setAdvisory(null);
    setSavedId(null);
    setPassportSaved(false);
    setArenaShared(false);
    setPoseData(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveToPassport = async (): Promise<string | null> => {
    if (!analysis || saving) return savedId;
    setSaving(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL!;
      const res = await fetch(`${apiBase}/video-analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({
          sport,
          analysis_type: "match_eye",
          ai_feedback: JSON.stringify(analysis),
          user_question: focusQuestion || null,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { data?: { id?: string }; id?: string };
        const id = data.data?.id ?? data.id ?? null;
        setSavedId(id);
        setPassportSaved(true);
        return id;
      }
    } catch { /* silent */ } finally { setSaving(false); }
    return null;
  };

  const shareToArena = async () => {
    if (sharing) return;
    const id = savedId ?? await saveToPassport();
    if (!id) return;
    setSharing(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL!;
      await fetch(`${apiBase}/video-analyses/${id}/share-to-arena`, {
        method: "POST",
        headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
      });
      setArenaShared(true);
    } catch { /* silent */ } finally { setSharing(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/player" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Match Eye</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {user?.name ? `${user.name} · ` : ""}AI personal performance analysis
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* ── SETUP ── */}
        {(pageStage === "setup" || pageStage === "uploaded") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Context inputs */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb" }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Your Details
              </p>

              {/* Sport */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Sport</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      background: sport === s ? GRS_GREEN : "#fff",
                      borderColor: sport === s ? GRS_GREEN : "#d1d5db",
                      color: sport === s ? "#fff" : "#374151",
                    }}
                  >{s}</button>
                ))}
              </div>

              {/* Position + Jersey */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Your Position</p>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Striker, Midfielder"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Jersey #</p>
                  <input
                    value={jersey}
                    onChange={(e) => setJersey(e.target.value)}
                    placeholder="7"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Focus question */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                Focus Question <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
              </p>
              <input
                value={focusQuestion}
                onChange={(e) => setFocusQuestion(e.target.value)}
                placeholder="e.g. Am I dropping deep enough? Is my first touch good?"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 10,
                  border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Upload zone */}
            {pageStage === "setup" ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "#fff", borderRadius: 16, padding: 32,
                  border: "2px dashed #d1d5db", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: `${GRS_GREEN}12`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={22} color={GRS_GREEN} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Upload your match video</p>
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                  Drag & drop or tap to choose · MP4, MOV, AVI supported
                </p>
                <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>
                  Keep camera steady — avoid panning for best ball tracking
                </p>
                <input ref={fileRef} type="file" accept="video/*" onChange={handleFilePick} style={{ display: "none" }} />
              </div>
            ) : (
              /* Uploaded — show file name + analyse button */
              <div style={{
                background: "#fff", borderRadius: 16, padding: 16,
                border: `1px solid ${GRS_GREEN}33`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>Video ready</p>
                    <p style={{ fontSize: 11, color: "#6b7280" }}>{uploadedFile?.name}</p>
                  </div>
                  <button
                    onClick={reset}
                    style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Change
                  </button>
                </div>
                <button
                  onClick={analyse}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12,
                    background: GRS_GREEN, color: "#fff",
                    fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer",
                  }}
                >
                  Analyse My Performance
                </button>
              </div>
            )}

            {/* Info banner */}
            <div style={{
              background: "#f0fdf4", borderRadius: 12, padding: "12px 14px",
              border: "1px solid #bbf7d0", display: "flex", gap: 10,
            }}>
              <Zap size={15} color={GRS_GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                THUTO analyses your full video and scores your individual performance — positioning, technique, key moments, and specific drills to improve.
              </p>
            </div>
          </div>
        )}

        {/* ── CONFIRM (pre-upload advisory) ── */}
        {pageStage === "confirm" && advisory && pendingFile && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Upload size={18} color={GRS_GREEN} />
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Ready to upload</p>
            </div>
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13 }}>
              <p style={{ color: "#374151", marginBottom: 4 }}>
                <strong>{pendingFile.name}</strong>
              </p>
              <p style={{ color: "#6b7280" }}>
                {advisory.sizeMB.toFixed(0)} MB · {advisory.estimatedTime}
              </p>
            </div>
            {advisory.sizeWarning && (
              <div style={{
                background: "#fffbeb", border: "1px solid #f0b429", borderRadius: 10,
                padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#92400e", lineHeight: 1.5,
              }}>
                ⚠️ {advisory.sizeWarning}
              </div>
            )}
            {(gateProbing || gateStrategy?.mode === "queue") ? (
              <UploadGate
                strategy={gateStrategy}
                probing={gateProbing}
                onForceUpload={() => {
                  const file = pendingFile!;
                  setPendingFile(null); setAdvisory(null); setGateStrategy(null);
                  setPageStage("setup");
                  flushQueue();
                  uploadVideo(file);
                }}
                onQueue={() => {
                  const file = pendingFile!;
                  setPendingFile(null); setAdvisory(null); setGateStrategy(null);
                  // Route through the same R2 → Laravel → Gemini async flow
                  uploadVideo(file);
                }}
              />
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setPendingFile(null); setAdvisory(null); setGateStrategy(null); setPageStage("setup"); }}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: "none", border: "1px solid #d1d5db", color: "#374151", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!pendingFile) return;
                    setGateProbing(true);
                    const strategy = await getUploadStrategy();
                    setGateProbing(false);
                    if (strategy.mode === "live") {
                      const file = pendingFile;
                      setPendingFile(null); setAdvisory(null);
                      uploadVideo(file);
                    } else {
                      setGateStrategy(strategy);
                    }
                  }}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 10, fontSize: 14, fontWeight: 800,
                    background: GRS_GREEN, color: "#fff", border: "none", cursor: "pointer",
                  }}
                >
                  Start Upload
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── UPLOADING ── */}
        {pageStage === "uploading" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", textAlign: "center" }}>
            <Upload size={28} color={GRS_GREEN} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Uploading to THUTO...</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
              {uploadPct < 100 ? `${uploadPct}% uploaded` : "Processing video..."}
            </p>
            <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: GRS_GREEN,
                width: `${uploadPct}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── ANALYSING ── */}
        {pageStage === "analysing" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", textAlign: "center" }}>
            <Target size={28} color={GRS_GREEN} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Analysing your performance...</p>
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
              THUTO is watching your video frame by frame.<br />
              This usually takes 60–120 seconds.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: GRS_GREEN,
                  animation: "pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {pageStage === "error" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #fecaca", textAlign: "center" }}>
            <AlertTriangle size={28} color="#dc2626" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Something went wrong</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>{error}</p>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px", borderRadius: 10,
                background: GRS_GREEN, color: "#fff",
                fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {pageStage === "results" && analysis && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Context chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                background: `${GRS_GREEN}15`, color: GRS_GREEN,
                padding: "4px 12px", borderRadius: 20,
                fontSize: 11, fontWeight: 700,
              }}>{sport}</span>
              {position && (
                <span style={{
                  background: "#f3f4f6", color: "#374151",
                  padding: "4px 12px", borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                }}>{position}{jersey ? ` · #${jersey}` : ""}</span>
              )}
              <button
                onClick={reset}
                style={{
                  marginLeft: "auto", padding: "4px 14px", borderRadius: 20,
                  background: "#fff", border: "1px solid #d1d5db",
                  fontSize: 11, fontWeight: 600, color: "#374151", cursor: "pointer",
                }}
              >
                New Analysis
              </button>
            </div>

            <ResultsPanel analysis={analysis} narrative={narrative} />

            {/* Save to Passport + Share to Arena */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { void saveToPassport(); }}
                disabled={saving || passportSaved}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 12,
                  background: passportSaved ? "#f0fdf4" : GRS_GREEN,
                  border: passportSaved ? `1px solid #bbf7d0` : "none",
                  color: passportSaved ? "#16a34a" : "#fff",
                  fontWeight: 700, fontSize: 13, cursor: passportSaved ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <BookOpen size={15} />
                {saving ? "Saving…" : passportSaved ? "Saved to Passport ✓" : "Save to Passport"}
              </button>
              <button
                onClick={() => { void shareToArena(); }}
                disabled={sharing || arenaShared}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 12,
                  background: arenaShared ? "#f0fdf4" : "#fff",
                  border: arenaShared ? `1px solid #bbf7d0` : "1px solid #d1d5db",
                  color: arenaShared ? "#16a34a" : "#374151",
                  fontWeight: 700, fontSize: 13, cursor: arenaShared ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  opacity: sharing ? 0.7 : 1,
                }}
              >
                <Share2 size={15} />
                {sharing ? "Sharing…" : arenaShared ? "Shared to Arena ✓" : "Share to Arena"}
              </button>
            </div>

            {/* Download PDF */}
            <button
              onClick={() => downloadPlayerMatchEyePdf(analysis, narrative, sport)}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                background: "#fff", border: "1px solid #d1d5db",
                color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Download size={16} />
              Download PDF Report
            </button>

            {/* Timeline marker */}
            <div style={{ display: "flex", gap: 16, padding: "10px 0", justifyContent: "center" }}>
              {(["strength", "weakness", "neutral"] as KeyMoment["type"][]).map((t) => {
                const c = momentColor(t);
                const label = t === "strength" ? "Strength" : t === "weakness" ? "Weakness" : "Note";
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={reset}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                background: "#fff", border: `2px solid ${GRS_GREEN}`,
                color: GRS_GREEN, fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >
              Analyse Another Video
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
