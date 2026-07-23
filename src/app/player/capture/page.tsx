"use client";

/**
 * Football Skill Analysis — /player/capture
 *
 * Comprehensive 10-drill assessment covering:
 * First Touch · Rebound Strike · Passing Accuracy · Shooting · Crossing ·
 * Free Kick · Heading (Rosch Test) · Ball Juggling · Tennis Ball CNS Test ·
 * Throw-In
 *
 * Each drill has a structured protocol, camera positioning guide, and
 * defined metrics. Gemini AI provides coaching feedback on the recorded clip.
 *
 * Screens:
 *  1. select   — drill grid by category
 *  2. protocol — setup instructions + camera guide + metrics to measure
 *  3. recording — live camera, countdown, stop button
 *  4. uploading — "THUTO is analysing..." animation
 *  5. feedback  — qualitative AI coaching + metric reference
 *  6. error     — retry CTA
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Video, Square, RotateCcw, CheckCircle,
  Save, AlertCircle, Camera, ChevronRight,
  Activity, Brain, Target,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrillMetric {
  key:         string;
  label:       string;
  unit:        string;
  description: string;
}

interface DrillDef {
  id:          string;
  label:       string;
  emoji:       string;
  category:    "Technical" | "Cognitive" | "Physical";
  tagline:     string;
  protocol:    string[];
  cameraSetup: string;
  equipment:   string;
  metrics:     DrillMetric[];
  focus:       string;         // passed to AI for coaching context
  maxDuration: number;         // max recording seconds
}

type Screen = "select" | "protocol" | "recording" | "uploading" | "feedback" | "error";

interface THUTOFeedback {
  strength:            string;
  correction:          string;
  drillRecommendation: string;
}

interface VaultClip {
  id:        string;
  drill:     string;
  videoUrl:  string | null;
  feedback:  THUTOFeedback;
  createdAt: string;
}

// ─── Drill definitions ───────────────────────────────────────────────────────

const DRILLS: DrillDef[] = [
  {
    id: "first_touch",
    label: "First Touch & Control",
    emoji: "🦶",
    category: "Technical",
    tagline: "Dispersion radius · Release latency · Bilateral ratio",
    equipment: "Football · 3 cones · partner",
    protocol: [
      "Place 3 cones in a 2 m triangle as your 'landing target zone'.",
      "Partner delivers the ball from 10–15 m (varied heights and speeds).",
      "Receive the ball and control it INSIDE the triangle with your first touch.",
      "Immediately pass or shoot to a second target after your touch.",
      "5 reps each foot (10 total). No stopping between reps.",
    ],
    cameraSetup: "SIDE-ON · hip height · 4 m from player · triangle cones + full body in frame.",
    metrics: [
      { key: "dispersion_radius", label: "Touch Dispersion Radius", unit: "m",  description: "Average distance ball lands from triangle centre (lower = better)" },
      { key: "release_latency",   label: "Release Latency",         unit: "s",  description: "Time from ball arrival to your next action (lower = sharper)" },
      { key: "bilateral_ratio",   label: "Bilateral Ratio",         unit: "%",  description: "Weak-foot control quality vs dominant foot (100% = equal)" },
    ],
    focus: "first touch quality — cushioning technique, body shape at reception, distance of ball from target zone after touch, speed of second action, comparison between dominant and weak foot",
    maxDuration: 60,
  },
  {
    id: "rebound_strike",
    label: "Rebound Turn & Strike",
    emoji: "🔄",
    category: "Technical",
    tagline: "First-touch radius · Release latency · Strike accuracy",
    equipment: "Football · wall/rebounder · 2 cones for target zone",
    protocol: [
      "Stand 6 m from a wall or rebounder with cones marking an 8 m target zone 3 m behind you.",
      "Pass the ball firmly against the wall.",
      "Take first touch OUT OF FEET to create shooting angle toward the target zone.",
      "Strike immediately after your touch — no extra touch allowed.",
      "3 reps right foot, 3 reps left foot. Alternate every rep.",
    ],
    cameraSetup: "45° BEHIND player · 4 m back · wall, player, and target zone all in frame.",
    metrics: [
      { key: "touch_radius",    label: "First-Touch Radius",  unit: "m",  description: "Distance ball lands from ideal shooting position after touch" },
      { key: "release_latency", label: "Release Latency",     unit: "s",  description: "Time from rebound contact to strike (target: < 1.5 s)" },
      { key: "accuracy_score",  label: "Strike Accuracy",     unit: "%",  description: "Percentage of strikes hitting the target zone" },
    ],
    focus: "rebound first touch quality, body shape setting up for strike, time between controlling the rebound and striking, accuracy of shot into target zone, foot selection and balance through full movement",
    maxDuration: 60,
  },
  {
    id: "passing_accuracy",
    label: "Passing Accuracy",
    emoji: "🎯",
    category: "Technical",
    tagline: "Dominant vs weak foot · Bilateral proficiency",
    equipment: "Football · 2 cones as gate",
    protocol: [
      "Set 2 cones 1 m apart as a 'gate' at 15 m distance.",
      "Dominant foot: 10 passes through the gate (firm, on the ground).",
      "Weak foot: 10 passes through the gate (same distance).",
      "No lofted balls — ground passes only.",
      "Film both sets in one continuous clip back-to-back.",
    ],
    cameraSetup: "BEHIND passer · ground level · 2 m back · gate and full pass trajectory visible.",
    metrics: [
      { key: "dominant_accuracy", label: "Dominant Foot Accuracy",  unit: "%", description: "Passes through the gate — dominant foot" },
      { key: "weak_accuracy",     label: "Weak Foot Accuracy",      unit: "%", description: "Passes through the gate — weak foot" },
      { key: "bilateral_ratio",   label: "Bilateral Proficiency",   unit: "%", description: "Weak foot as % of dominant (100% = truly two-footed)" },
    ],
    focus: "foot contact point on the ball, body shape at contact, weight and trajectory of pass, accuracy through gate, technique difference between dominant and weak foot, follow-through direction",
    maxDuration: 60,
  },
  {
    id: "shooting",
    label: "Shooting",
    emoji: "⚽",
    category: "Technical",
    tagline: "Plant foot · Contact quality · Shot accuracy",
    equipment: "Football · goal or target wall zone",
    protocol: [
      "Set up 12 m from goal (or a target zone marked on a wall).",
      "Ball placed stationary OR delivered by a server from the side.",
      "Strike with instep (laces) aiming for corners.",
      "5 shots right foot, 5 shots left foot — mix ground and elevated.",
      "Short run-up (3 strides) for each shot.",
    ],
    cameraSetup: "SIDE-ON · knee height · 5 m from striker · full run-up and goal/target in frame.",
    metrics: [
      { key: "plant_foot",      label: "Plant Foot Position", unit: "pts", description: "AI rating: ideal = beside ball, pointing at target (1–10)" },
      { key: "contact_quality", label: "Contact Quality",     unit: "pts", description: "Cleanness and timing of foot-to-ball contact (1–10)" },
      { key: "accuracy_score",  label: "Shot Accuracy",       unit: "%",   description: "Percentage of shots on target" },
    ],
    focus: "shooting technique — plant foot position beside and pointing toward target, locked ankle at contact, clean instep contact, body shape over ball for low drive, follow-through direction, both feet comparison, power vs accuracy balance",
    maxDuration: 60,
  },
  {
    id: "crossing",
    label: "Crossing",
    emoji: "↗️",
    category: "Technical",
    tagline: "Approach angle · Contact point · Zone accuracy",
    equipment: "Football · 4 cones marking target zone in box",
    protocol: [
      "Mark a crossing position wide (byline or 30° wide of goal).",
      "Mark a 2 m × 2 m target zone in the box (penalty spot area).",
      "5 crosses from right side, 5 crosses from left side.",
      "Vary delivery height: low cut-back, whipped in, floated.",
      "Film as one continuous clip — all 10 crosses.",
    ],
    cameraSetup: "BEHIND crosser · head height · 5 m back · full swing and target zone visible.",
    metrics: [
      { key: "approach_angle",  label: "Approach Angle Quality", unit: "pts", description: "Run-up curves naturally around ball toward target (1–10)" },
      { key: "contact_point",   label: "Contact Point",          unit: "pts", description: "Foot meets correct part of ball for intended delivery (1–10)" },
      { key: "zone_accuracy",   label: "Zone Accuracy",          unit: "%",   description: "Percentage of crosses landing in target zone" },
    ],
    focus: "crossing technique — approach angle curving around ball, contact point (inside or instep), body lean and arm for balance, delivery height and trajectory control, ability to hit target zone from both sides, non-dominant side comparison",
    maxDuration: 60,
  },
  {
    id: "free_kick",
    label: "Free Kick",
    emoji: "🌀",
    category: "Technical",
    tagline: "Run-up angle · Wrap contact · Accuracy",
    equipment: "Football · goal or target zones",
    protocol: [
      "Place ball 20–25 m from goal (or marked wall target).",
      "Mark target zones: left corner, right corner, top centre.",
      "3 shots curling to the left, 3 shots curling to the right.",
      "Use a short run-up (3–5 strides at a diagonal angle).",
      "Mix driven low shots and dipping lifted efforts.",
    ],
    cameraSetup: "SIDE-ON · hip height · 6 m from ball · ball, full run-up, and goal in frame.",
    metrics: [
      { key: "runup_angle",     label: "Run-Up Angle Quality",    unit: "pts", description: "Diagonal angle creates natural curl direction (1–10)" },
      { key: "contact_quality", label: "Wrap Contact Quality",    unit: "pts", description: "Foot wraps correct part of ball for curl (1–10)" },
      { key: "accuracy_score",  label: "Free Kick Accuracy",      unit: "%",   description: "Percentage of shots hitting target zone" },
    ],
    focus: "free kick technique — diagonal run-up angle relative to ball and target for curl, toes pointing down and inward, contact on inside of foot to wrap ball, body shape at contact, follow-through direction, power vs placement balance, ability to curl both directions",
    maxDuration: 60,
  },
  {
    id: "heading",
    label: "Heading (Rosch Accuracy Test)",
    emoji: "👆",
    category: "Technical",
    tagline: "Forehead contact · Zone accuracy · Reactive heading",
    equipment: "LIGHTWEIGHT PLASTIC BALL (not football) · 3 target zones",
    protocol: [
      "⚠️  Use a lightweight plastic ball — NOT a standard football — for safety.",
      "Mark 3 target zones: Left / Centre / Right, each 1 m wide at 4 m distance, 1.5 m high.",
      "Server delivers 10 crosses from 6 m — varying left and right.",
      "Head each delivery into one of the 3 zones.",
      "Last 4 deliveries: coach shouts L/C/R AFTER ball is in the air (reactive heading).",
    ],
    cameraSetup: "FRONT-ON · chest height · 4 m from player · player and all 3 target zones visible.",
    metrics: [
      { key: "rosch_score",      label: "Rosch Accuracy Score", unit: "pts", description: "Centre zone = 3 pts, Left/Right = 2 pts, off-target = 0 (max 30)" },
      { key: "forehead_contact", label: "Forehead Contact",     unit: "pts", description: "AI rating: contact on flat forehead, not top of skull (1–10)" },
      { key: "reactive_score",   label: "Reactive Heading",     unit: "pts", description: "Score on 4 reactive trials where zone is called mid-air" },
    ],
    focus: "heading technique with lightweight plastic ball — forehead contact point (flat part, not crown), approach timing to ball, eyes open through contact, neck muscle engagement for direction control, body rotation to redirect to called target zone, balance and landing",
    maxDuration: 60,
  },
  {
    id: "ball_juggling",
    label: "Ball Juggling",
    emoji: "⚽",
    category: "Technical",
    tagline: "Max touches · Body variety · Balance & control",
    equipment: "Football",
    protocol: [
      "Start with ball in hands — drop and begin juggling.",
      "Use feet, knees, thighs — any body part above the waist counts.",
      "Aim for maximum consecutive touches without ball hitting the ground.",
      "Multiple attempts allowed within the 60-second clip.",
      "Deliberately show variety: alternate feet, knees, thighs, and shoulder/head.",
    ],
    cameraSetup: "SIDE-ON · 3 m distance · full body height visible · full body + ball in frame.",
    metrics: [
      { key: "max_touches",    label: "Max Consecutive Touches", unit: "touches", description: "Highest single run without ball touching ground" },
      { key: "variety_score",  label: "Touch Variety",           unit: "pts",     description: "How many body parts used (1 = feet only, 10 = full body)" },
      { key: "balance_rating", label: "Balance & Composure",     unit: "pts",     description: "Posture, weight distribution, calm under fatigue (1–10)" },
    ],
    focus: "football juggling — count maximum consecutive touches, observe variety of body parts used (feet, knees, thighs, shoulders, head), assess balance and posture quality, eye-on-ball focus, ability to recover from a poor touch without losing possession",
    maxDuration: 60,
  },
  {
    id: "tennis_juggling",
    label: "Tennis Ball Juggling (CNS Test)",
    emoji: "🎾",
    category: "Cognitive",
    tagline: "Method A: Catch Count · Method B: Reactive Interference",
    equipment: "Tennis ball · 3 coloured cones (Red / Blue / Yellow)",
    protocol: [
      "Use a TENNIS BALL — not a football.",
      "METHOD A (30 s): Bounce tennis ball on top of foot, catch with same hand after each bounce. Count total catches.",
      "METHOD B (Reactive): While bouncing on foot, coach shouts a colour. Touch matching cone before catching — Red = right cone, Blue = left cone, Yellow = centre.",
      "10 Method B trials. Cones 1 m away at waist height.",
      "Record both methods back-to-back in one clip.",
    ],
    cameraSetup: "FRONT-ON · knee height · 3 m from player · foot, hand, and all 3 cones visible.",
    metrics: [
      { key: "catch_count",    label: "Method A Catch Count",     unit: "catches", description: "Successful bounce-and-catches in 30 seconds" },
      { key: "reactive_score", label: "Method B Success Rate",    unit: "%",       description: "Percentage of reactive trials completed without dropping ball" },
      { key: "cns_rating",     label: "CNS Rating",               unit: "pts",     description: "Overall central nervous system performance score (1–10)" },
    ],
    focus: "tennis ball foot juggling for CNS assessment — bouncing a tennis ball on the instep then catching it, counting total catches in 30 seconds, and reactive interference: player touches a called colour cone mid-bounce before catching. Measures hand-eye coordination, dual-task performance, reaction speed, and cognitive agility under motor load",
    maxDuration: 90,
  },
  {
    id: "throw_in",
    label: "Throw-In",
    emoji: "🤾",
    category: "Technical",
    tagline: "Bilateral proficiency · Distance · Technique",
    equipment: "Football · 1 cone as target",
    protocol: [
      "Stand on a sideline (or taped line on ground).",
      "Both feet must stay on or behind the line throughout.",
      "Ball starts from behind the head with both hands (FIFA rules).",
      "Target: land ball on or within 1 m of a cone at 15 m distance.",
      "5 throws from right-footed stance, 5 from left-footed stance.",
    ],
    cameraSetup: "SIDE-ON · hip height · 4 m from thrower · full throw arc and target visible.",
    metrics: [
      { key: "dominant_accuracy", label: "Dominant Stance Accuracy",  unit: "%",   description: "Throws landing on target — dominant side stance" },
      { key: "weak_accuracy",     label: "Non-Dominant Accuracy",     unit: "%",   description: "Throws landing on target — opposite stance" },
      { key: "technique_score",   label: "Throw Technique",           unit: "pts", description: "AI rating: feet, arc, arm symmetry, follow-through (1–10)" },
    ],
    focus: "throw-in technique — both feet on or behind line, ball starting behind head, equal contribution from both hands, arching trajectory, distance and accuracy to target, comparison between dominant and non-dominant stance, follow-through and body balance after release",
    maxDuration: 60,
  },
];

// ─── Vault helper ─────────────────────────────────────────────────────────────

const VAULT_KEY = "grassroots_highlight_vault";

function saveToVault(clip: VaultClip) {
  try {
    const existing: VaultClip[] = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]");
    const updated = [clip, ...existing].slice(0, 20);
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Frame extraction ─────────────────────────────────────────────────────────

function extractFrame(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const vid  = document.createElement("video");
    vid.preload  = "metadata";
    vid.muted    = true;
    vid.playsInline = true;
    vid.src = url;

    vid.onloadedmetadata = () => {
      vid.currentTime = Math.min(vid.duration / 2, 15);
    };

    vid.onseeked = () => {
      try {
        const W = Math.min(vid.videoWidth  || 640, 1280);
        const H = Math.min(vid.videoHeight || 480, 720);
        const canvas = document.createElement("canvas");
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(vid, 0, 0, W, H);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        URL.revokeObjectURL(url);
        resolve(base64);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    vid.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video for frame extraction"));
    };
  });
}

// ─── R2 upload ────────────────────────────────────────────────────────────────

async function uploadToR2(blob: Blob, drillId: string): Promise<string | null> {
  try {
    const filename = `capture-${drillId}-${Date.now()}.webm`;
    const presignRes = await fetch("/api/upload/presigned", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ filename, content_type: "video/webm", folder: "captures" }),
    });
    if (!presignRes.ok) return null;
    const { uploadUrl, publicUrl } = (await presignRes.json()) as {
      uploadUrl: string;
      publicUrl: string | null;
      key: string;
    };
    const putRes = await fetch(uploadUrl, {
      method:  "PUT",
      body:    blob,
      headers: { "Content-Type": "video/webm" },
    });
    if (!putRes.ok) return null;
    return publicUrl;
  } catch {
    return null;
  }
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { id: DrillDef["category"]; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "Technical",  label: "Technical",  icon: <Target   className="h-4 w-4" />, color: "#1a5c2a" },
  { id: "Cognitive",  label: "Cognitive",  icon: <Brain    className="h-4 w-4" />, color: "#7c3aed" },
  { id: "Physical",   label: "Physical",   icon: <Activity className="h-4 w-4" />, color: "#c2410c" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function FootballSkillAnalysisPage() {
  const user = useAuthStore((s) => s.user);

  // ── State ──
  const [screen,       setScreen]       = useState<Screen>("select");
  const [drillId,      setDrillId]      = useState<string>("");
  const [elapsed,      setElapsed]      = useState(0);
  const [feedback,     setFeedback]     = useState<THUTOFeedback | null>(null);
  const [videoUrl,     setVideoUrl]     = useState<string | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [cameraError,  setCameraError]  = useState(false);

  // ── Refs ──
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);

  // ── Typewriter ──
  const strengthText  = useTypewriter(screen === "feedback" ? (feedback?.strength ?? "")            : "", 20);
  const correctionText= useTypewriter(screen === "feedback" ? (feedback?.correction ?? "")           : "", 20);
  const drillText     = useTypewriter(screen === "feedback" ? (feedback?.drillRecommendation ?? "")  : "", 20);

  const drill = DRILLS.find((d) => d.id === drillId) ?? null;

  // ── Camera ──────────────────────────────────────────────────────────────────

  const startCamera = async (): Promise<void> => {
    setCameraError(false);
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError(true);
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Start camera (and then recorder) when entering recording screen
  useEffect(() => {
    if (screen === "recording") {
      startCamera().then(() => {
        // Small delay to ensure stream is attached to video element
        setTimeout(() => { if (streamRef.current) startRecording(); }, 400);
      });
    }
    if (screen === "select" || screen === "protocol") stopStream();
    return () => {
      if (screen !== "recording") stopStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Full cleanup on unmount
  useEffect(() => () => stopStream(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ────────────────────────────────────────────────────────────────

  const getMimeType = (): string => {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    if (typeof MediaRecorder === "undefined") return "";
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    // Reset any previous recorder
    recorderRef.current = null;
    chunksRef.current = [];

    const mimeType = getMimeType();
    const recorder  = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      blobRef.current = blob;
      handleUploadAndAnalyse(blob);
    };

    recorder.start(200);
    recorderRef.current = recorder;

    const maxSec = drill?.maxDuration ?? 60;
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxSec - 1) { stopRecording(); return maxSec; }
        return prev + 1;
      });
    }, 1000);
  }, [drill]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setScreen("uploading");
  }, []);

  // ── Upload + Analyse ─────────────────────────────────────────────────────────

  const handleUploadAndAnalyse = async (blob: Blob) => {
    if (!drill) return;
    try {
      let frame: string | null = null;
      try { frame = await extractFrame(blob); } catch {}

      const r2Url = await uploadToR2(blob, drill.id);
      setVideoUrl(r2Url);

      const res = await fetch("/api/capture/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          frame,
          drill:      drill.label,
          focus:      drill.focus,
          playerName: user?.name ?? "Player",
          position:   "footballer",
          videoUrl:   r2Url,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as THUTOFeedback;
      setFeedback(data);
      setScreen("feedback");

      try {
        await api.post("/captures", {
          drill_name:       drill.label,
          r2_url:           r2Url ?? "",
          thuto_feedback:   JSON.stringify(data),
          duration_seconds: elapsed,
          is_public:        false,
        });
      } catch {}

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErrorMsg(msg);
      setScreen("error");
    }
  };

  // ── Save to Vault ────────────────────────────────────────────────────────────

  const saveToHighlightVault = () => {
    if (!feedback || !drill) return;
    saveToVault({ id: `${Date.now()}`, drill: drill.label, videoUrl, feedback, createdAt: new Date().toISOString() });
    setSavedToVault(true);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────

  const reset = () => {
    blobRef.current = null;
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setScreen("select");
  };

  const recordAgain = () => {
    blobRef.current = null;
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setScreen("protocol"); // back to protocol so player re-reads setup
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto">

        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3"
          style={{ backgroundColor: "#fff", borderColor: "#e5e5e5" }}
        >
          {screen === "select" ? (
            <Link
              href="/player"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#e5e5e5" }}
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
          ) : (
            <button
              onClick={() => {
                if (screen === "protocol")  setScreen("select");
                else if (screen === "recording" || screen === "feedback" || screen === "error") reset();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#e5e5e5" }}
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-base font-bold" style={{ color: "#1a5c2a" }}>
              Football Skill Analysis
            </h1>
            <p className="text-xs text-gray-500">
              {screen === "select"    && "Select a drill to analyse"}
              {screen === "protocol" && (drill?.label ?? "Setup & Protocol")}
              {screen === "recording" && `Recording — ${drill?.label}`}
              {screen === "uploading" && "THUTO is analysing..."}
              {screen === "feedback"  && `${drill?.label} — Feedback`}
              {screen === "error"     && "Analysis failed"}
            </p>
          </div>
          {/* THUTO badge */}
          <div
            className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: "#f0fdf4", color: "#1a5c2a", border: "1px solid #bbf7d0" }}
          >
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            THUTO Vision
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 1 — DRILL SELECT
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "select" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Each drill has a structured protocol, camera positioning guide, and defined metrics.
                THUTO analyses your video and gives specific coaching feedback.
              </p>

              {CATEGORIES.map((cat) => {
                const catDrills = DRILLS.filter((d) => d.category === cat.id);
                if (catDrills.length === 0) return null;
                return (
                  <div key={cat.id}>
                    {/* Category header */}
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {cat.label}
                      </span>
                    </div>

                    {/* Drill cards */}
                    <div className="space-y-2">
                      {catDrills.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => { setDrillId(d.id); setScreen("protocol"); }}
                          className="flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
                          style={{ borderColor: "#e5e5e5" }}
                        >
                          <span className="text-2xl">{d.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>{d.label}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{d.tagline}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 2 — PROTOCOL
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "protocol" && drill && (
            <div className="space-y-5">

              {/* Drill title */}
              <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "#e5e5e5" }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{drill.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#1a5c2a" }}>{drill.label}</h2>
                    <p className="text-xs text-gray-500">{drill.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Equipment needed</p>
                <p className="text-sm text-gray-700">{drill.equipment}</p>
              </div>

              {/* Protocol steps */}
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Setup & Protocol</p>
                <ol className="space-y-2.5">
                  {drill.protocol.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                        style={{ backgroundColor: "#1a5c2a" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Camera setup */}
              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
              >
                <div className="flex items-start gap-2">
                  <Camera className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Camera Position</p>
                    <p className="text-sm text-amber-800">{drill.cameraSetup}</p>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">What THUTO will assess</p>
                <div className="space-y-3">
                  {drill.metrics.map((m) => (
                    <div key={m.key} className="flex items-start gap-3">
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                        style={{ backgroundColor: "#1a5c2a" }}
                      >
                        {m.unit.length <= 3 ? m.unit : "#"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{m.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start recording CTA */}
              <button
                onClick={() => setScreen("recording")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-bold text-white transition-all active:scale-95"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Video className="h-5 w-5" />
                Start Recording ({drill.maxDuration}s max)
              </button>

              <p className="text-center text-xs text-gray-400">
                Follow the protocol above before pressing record.
                THUTO will analyse your technique from the video.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 3 — RECORDING
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "recording" && drill && (
            <div className="space-y-5">

              {/* Camera preview */}
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[9/16] max-h-[440px]">
                {cameraError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                    <Camera className="h-12 w-12 opacity-40" />
                    <p className="text-sm">Camera not available</p>
                    <button
                      onClick={startCamera}
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />

                    {/* REC indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">REC</span>
                    </div>

                    {/* Countdown */}
                    <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {drill.maxDuration - elapsed}s
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${(elapsed / drill.maxDuration) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Drill reminder */}
              <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-2xl mb-1">{drill.emoji}</p>
                <p className="font-semibold text-sm" style={{ color: "#1a5c2a" }}>{drill.label}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {elapsed}s elapsed · max {drill.maxDuration}s
                </p>
              </div>

              {/* Stop button */}
              {!cameraError && (
                <button
                  onClick={stopRecording}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 py-4 text-base font-bold transition-all active:scale-95"
                  style={{ borderColor: "#ef4444", color: "#ef4444", backgroundColor: "#fef2f2" }}
                >
                  <Square className="h-5 w-5 fill-red-500" />
                  Stop & Analyse
                </button>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 4 — UPLOADING / ANALYSING
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "uploading" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
                     style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}>
                  <span className="text-4xl">🤖</span>
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-600 animate-ping" />
                </span>
              </div>

              <h2 className="text-xl font-bold" style={{ color: "#1a5c2a" }}>THUTO is analysing</h2>
              <p className="mt-2 text-sm text-gray-500">
                Reviewing your {drill?.label.toLowerCase()} technique
              </p>

              <div className="mt-6 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-green-500"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>

              <p className="mt-8 max-w-xs text-xs text-gray-400">
                Takes 10–20 seconds. THUTO is assessing your form, body shape, technique, and key metrics.
              </p>

              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50%       { transform: translateY(-8px); }
                }
              `}</style>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 5 — FEEDBACK
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "feedback" && feedback && drill && (
            <div className="space-y-4">

              {/* THUTO header */}
              <div className="flex items-center gap-3 rounded-2xl border p-4"
                   style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                     style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}>
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <p className="font-bold" style={{ color: "#1a5c2a" }}>THUTO</p>
                  <p className="text-xs text-gray-500">{drill.label} · just now</p>
                </div>
              </div>

              {/* Metrics reference */}
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Key Metrics — {drill.label}</p>
                <div className="grid grid-cols-1 gap-2">
                  {drill.metrics.map((m) => (
                    <div key={m.key}
                         className="flex items-center gap-3 rounded-xl p-3"
                         style={{ backgroundColor: "#f9fafb", border: "1px solid #f3f4f6" }}>
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                           style={{ backgroundColor: "#1a5c2a" }}>
                        {m.unit.length <= 3 ? m.unit : "#"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#1a1a1a" }}>{m.label}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strength */}
              <div className="rounded-xl border p-4"
                   style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#1a5c2a" }}>
                    What you did well
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {strengthText}
                  {strengthText.length < (feedback.strength?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-green-600 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Correction */}
              <div className="rounded-xl border p-4"
                   style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    One thing to fix
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {correctionText}
                  {correctionText.length < (feedback.correction?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-amber-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Drill recommendation */}
              <div className="rounded-xl border p-4"
                   style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏋️</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Drill to try
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {drillText}
                  {drillText.length < (feedback.drillRecommendation?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={saveToHighlightVault}
                  disabled={savedToVault}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-95"
                  style={savedToVault
                    ? { backgroundColor: "#f0fdf4", color: "#1a5c2a", border: "1px solid #bbf7d0", cursor: "default" }
                    : { backgroundColor: "#c8962a", color: "#fff" }
                  }
                >
                  {savedToVault ? <><CheckCircle className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save to Vault</>}
                </button>

                <button
                  onClick={recordAgain}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#e5e5e5", color: "#374151" }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Record again
                </button>
              </div>

              {savedToVault && (
                <Link
                  href="/player/vault"
                  className="block w-full rounded-xl border py-3 text-center text-sm text-gray-500 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  View in Highlight Vault →
                </Link>
              )}

              <button
                onClick={reset}
                className="block w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600"
              >
                ← Choose a different drill
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SCREEN — ERROR
              ══════════════════════════════════════════════════════════════════ */}
          {screen === "error" && (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">Analysis failed</h2>
              <p className="mt-2 max-w-xs text-sm text-gray-500">{errorMsg}</p>
              <button
                onClick={() => setScreen("protocol")}
                className="mt-8 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
              <button onClick={reset} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
                Choose different drill
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
