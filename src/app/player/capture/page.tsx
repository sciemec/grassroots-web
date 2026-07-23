"use client";

/**
 * Football Skill Analysis — /player/capture
 *
 * 10-drill continuous testing loop:
 *   select → protocol → recording → uploading → feedback → (practice) → retest
 *
 * Features:
 * - Fetches player profile on mount (name, position, age_group, gender)
 * - THUTO (+ AMARA for female players) provides vision-based coaching
 * - Returns drill score (1–10) + qualitative feedback + 3-exercise practice plan
 * - Progress comparison: shows improvement vs previous best
 * - Practice plan with tick-boxes — "Retest Now" unlocks when all ticked
 * - Auto-saves to drill_analysis_results (feeds Talent Passport + Arena)
 * - Leaderboard link shows ranking in age group
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Video, Square, RotateCcw, CheckCircle,
  AlertCircle, Camera, ChevronRight, Trophy,
  Activity, Brain, Target, TrendingUp, TrendingDown,
  Minus, RefreshCw, CheckSquare, Square as SquareIcon,
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
  focus:       string;
  maxDuration: number;
}

type Screen = "select" | "protocol" | "recording" | "uploading" | "feedback" | "error";

interface PracticeExercise {
  name:        string;
  duration:    string;
  reps:        string;
  description: string;
  why:         string;
}

interface THUTOFeedback {
  drill_score:          number;
  strength:             string;
  correction:           string;
  drillRecommendation:  string;
  practice_plan: {
    title:     string;
    exercises: PracticeExercise[];
  };
}

interface PlayerProfile {
  first_name?: string;
  name?:       string;
  position?:   string;
  age_group?:  string;
  gender?:     string;
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
    emoji: "⚡",
    category: "Technical",
    tagline: "Turn sharpness · Strike accuracy · Body shield position",
    equipment: "Football · wall or rebounder",
    protocol: [
      "Stand 5 m from a wall or rebounder with your back to it.",
      "Pass the ball hard against the wall.",
      "As it returns, receive with your back to the 'defender' and immediately turn.",
      "Strike at a marked target (cone gate 2 m wide, 8 m away) within 2 touches.",
      "Alternate left/right turns. 8 reps total.",
    ],
    cameraSetup: "45° DIAGONAL · waist height · capture both the turn and the strike.",
    metrics: [
      { key: "turn_sharpness",        label: "Turn Sharpness",        unit: "s",  description: "Time from ball receipt to completed turn (lower = faster)" },
      { key: "strike_accuracy",       label: "Strike Accuracy",       unit: "/8", description: "Number of strikes hitting the cone gate target" },
      { key: "body_shield_position",  label: "Body Shield Position",  unit: "pts", description: "AI rating: how well you use body to protect ball (1–10)" },
    ],
    focus: "back-to-goal receiving — body shield positioning, turn technique (inside/outside), transition from receive to strike, accuracy of the final shot, balance on non-dominant side",
    maxDuration: 60,
  },
  {
    id: "passing_accuracy",
    label: "Passing Accuracy",
    emoji: "🎯",
    category: "Technical",
    tagline: "Gate precision · Velocity control · Weak foot score",
    equipment: "Football · 6 cones",
    protocol: [
      "Set 3 cone gates: each gate 50 cm wide, at 10 m, 15 m, and 20 m distances.",
      "Pass through each gate alternating distances. 4 passes per gate (12 total).",
      "Use inside of foot for the 10 m gate, laces for 15 m and 20 m gates.",
      "Last 3 passes: use your weak foot only.",
      "Record how many passes go through the centre of each gate.",
    ],
    cameraSetup: "BEHIND the player · elevated · all 3 gates visible · shows pass trajectory.",
    metrics: [
      { key: "gate_precision",    label: "Gate Precision",    unit: "/12", description: "Passes through gate centre (both feet combined)" },
      { key: "velocity_control",  label: "Velocity Control",  unit: "pts", description: "AI rating: appropriate pace for each distance (1–10)" },
      { key: "weak_foot_score",   label: "Weak Foot Score",   unit: "/3",  description: "Number of weak-foot passes through gate" },
    ],
    focus: "passing technique — standing foot placement, hip rotation, follow-through, head down at contact, lace vs inside-of-foot selection, weight of pass appropriate to distance, weak foot mechanics",
    maxDuration: 90,
  },
  {
    id: "shooting",
    label: "Shooting",
    emoji: "🥅",
    category: "Technical",
    tagline: "Strike power · Placement accuracy · Non-dominant foot",
    equipment: "Football · goal or wall markings · 3 cones",
    protocol: [
      "Mark a goal 6 m wide with cones. Place cones at penalty spot (11 m) and 16 m arc.",
      "Series A: 3 shots from penalty spot — aim for top corners (left, right, left).",
      "Series B: 3 shots from 16 m — aim for low corners.",
      "Series C: 3 shots with weak foot from penalty spot.",
      "Allow 20 seconds between shots. No run-up limit.",
    ],
    cameraSetup: "BEHIND the goal · slightly elevated · capture both the striking foot AND the ball path.",
    metrics: [
      { key: "placement_accuracy", label: "Placement Accuracy", unit: "/9",  description: "Shots on target (within goal frame)" },
      { key: "strike_power",       label: "Strike Power",       unit: "pts", description: "AI rating: ball speed and contact quality (1–10)" },
      { key: "weak_foot_accuracy", label: "Weak Foot Accuracy", unit: "/3",  description: "Weak foot shots on target" },
    ],
    focus: "shooting technique — run-up angle, plant foot position, striking zone on boot (laces vs instep), follow-through, body lean, head position at contact, placement accuracy and power generation",
    maxDuration: 120,
  },
  {
    id: "crossing",
    label: "Crossing",
    emoji: "🌐",
    category: "Technical",
    tagline: "Landing zone accuracy · Delivery height · Both feet",
    equipment: "Football · 3 cones · optional target player",
    protocol: [
      "Place a cone 'penalty spot' and a 'far post cone' to mark your target zone.",
      "Start 35 m from goal at the byline. Dribble to the byline and cross.",
      "4 crosses from left flank, 4 from right flank (8 total).",
      "Aim for the landing zone: between penalty spot and far post cone.",
      "Crosses must clear head height and arrive with pace.",
    ],
    cameraSetup: "HIGH AND WIDE · 8 m from crosser · capture run-up, contact, and ball flight.",
    metrics: [
      { key: "landing_accuracy", label: "Landing Zone Accuracy", unit: "/8",  description: "Crosses landing in the marked scoring zone" },
      { key: "delivery_height",  label: "Delivery Height",       unit: "pts", description: "AI rating: crosses clearing defensive line height (1–10)" },
      { key: "both_feet_ratio",  label: "Both Feet Ratio",       unit: "%",   description: "Quality of non-dominant foot crosses vs dominant" },
    ],
    focus: "crossing technique — approach angle, planting foot position, contact point on the ball (inside of laces), follow-through, bend and flight of delivery, height clearance over defenders, accuracy into target zone",
    maxDuration: 90,
  },
  {
    id: "free_kick",
    label: "Free Kick",
    emoji: "🌀",
    category: "Technical",
    tagline: "Bend accuracy · Strike elevation · Wall clearance",
    equipment: "Football · 3 cones (wall) · goal markings",
    protocol: [
      "Set up a 3-cone 'wall' 4 m high (use a fence or jerseys on sticks) 9 m from the ball.",
      "Mark a goal 6 m wide. Ball placed 25 m out, slightly left of centre.",
      "Attempt 5 free kicks. Aim to bend the ball over/around the wall into the right corner.",
      "2 kicks with left foot, 2 with right foot, 1 of your choice.",
      "Each kick must clear the wall — strikes hitting the wall don't count.",
    ],
    cameraSetup: "SIDE-ON · captures run-up, ball contact, and full flight path over the wall.",
    metrics: [
      { key: "wall_clearance",    label: "Wall Clearance",   unit: "/5",  description: "Kicks clearing the cone wall" },
      { key: "target_accuracy",   label: "Target Accuracy",  unit: "/5",  description: "Kicks reaching the corner target zone" },
      { key: "strike_elevation",  label: "Strike Elevation", unit: "pts", description: "AI rating: lift and flight trajectory quality (1–10)" },
    ],
    focus: "free kick technique — approach angle, standing foot position, striking zone (inside of laces for curl, instep for dip), follow-through direction, ball elevation, consistent contact point, mental routine and composure",
    maxDuration: 90,
  },
  {
    id: "heading_rosch",
    label: "Heading (Rosch Test)",
    emoji: "👤",
    category: "Technical",
    tagline: "Forehead contact · Attack angle · Bilateral coordination",
    equipment: "Football · jump marker (tape on wall)",
    protocol: [
      "Mark a target height on a wall at 20 cm above your standing reach.",
      "Series A: 5 standing headers — toss ball yourself, head it at the wall target.",
      "Series B: 5 jumping headers — throw ball slightly forward, attack with a run-up.",
      "Series C: 5 headers alternating left/right sides (2 step approach, cross delivery angle).",
      "Partner holds/throws ball for series B and C if available.",
    ],
    cameraSetup: "FRONT-ON · 3 m away · captures forehead contact point, neck position, and eyes.",
    metrics: [
      { key: "forehead_contact",   label: "Forehead Contact Accuracy", unit: "pts", description: "AI rating: consistent ball-to-forehead contact (1–10)" },
      { key: "attack_angle",       label: "Attack Angle",              unit: "pts", description: "AI rating: downward attack angle on the ball (1–10)" },
      { key: "bilateral_accuracy", label: "Bilateral Accuracy",        unit: "%",   description: "Header quality from weaker side vs stronger side" },
    ],
    focus: "heading technique — forehead contact (not crown of head), eyes open, neck muscles locked, attacking the ball (not waiting for it), body twist for power, jumping timing, neck strength and head stability on contact",
    maxDuration: 90,
  },
  {
    id: "ball_juggling",
    label: "Ball Juggling",
    emoji: "⚽",
    category: "Technical",
    tagline: "Consecutive count · Surface variety · Weak foot control",
    equipment: "Football",
    protocol: [
      "Warm up: 30 seconds of free juggling to find your rhythm.",
      "Test 1: Maximum consecutive juggles — feet only. Count until drop. 2 attempts.",
      "Test 2: Structured sequence — right foot × 2, left foot × 2, thigh × 1. Repeat sequence for 30 seconds.",
      "Test 3: 20 consecutive juggles using weak foot only (restart from 0 on each drop).",
      "Take 15 seconds rest between each test.",
    ],
    cameraSetup: "FRONT-ON · full body · waist height · all contact surfaces visible.",
    metrics: [
      { key: "max_consecutive",  label: "Max Consecutive Juggles", unit: "reps", description: "Best score from 2 attempts — feet only" },
      { key: "sequence_quality", label: "Sequence Quality",        unit: "pts",  description: "AI rating: rhythm and surface variety in test 2 (1–10)" },
      { key: "weak_foot_juggles",label: "Weak Foot Consecutive",   unit: "reps", description: "Best consecutive count with non-dominant foot only" },
    ],
    focus: "juggling technique — ankle lock on contact, consistent contact point on foot, soft cushioning on receipt, body balance and core stability, height control (knee height), transition between surfaces, rhythm and relaxation",
    maxDuration: 120,
  },
  {
    id: "tennis_ball_cns",
    label: "Tennis Ball CNS Test",
    emoji: "🧠",
    category: "Cognitive",
    tagline: "Reaction time · Hand-eye coordination · Bilateral speed",
    equipment: "Tennis ball · wall",
    protocol: [
      "Stand 1 m from a wall. Throw the tennis ball against the wall with your right hand.",
      "Catch it with your LEFT hand. Then throw with left, catch with right.",
      "Count how many successful catch-throw-catch cycles you complete in 30 seconds.",
      "Rest 20 seconds. Repeat for a second 30-second test.",
      "Third test: Same drill but close your eyes after throwing. Catch by sound.",
    ],
    cameraSetup: "SIDE-ON · 1.5 m distance · captures both hands and wall contact clearly.",
    metrics: [
      { key: "cycles_30s",      label: "Cycles per 30 seconds", unit: "reps", description: "Successful throw-switch-catch cycles (best of 2 attempts)" },
      { key: "bilateral_speed", label: "Bilateral Speed",       unit: "pts",  description: "AI rating: smooth hand switching without hesitation (1–10)" },
      { key: "eyes_closed",     label: "Eyes-Closed Catches",   unit: "reps", description: "Successful catches on the third (eyes-closed) test" },
    ],
    focus: "CNS reaction and coordination — speed of throw-catch cycle, smooth bilateral hand switching, eyes tracking the ball, anticipation of bounce angle, rhythm without hesitation, eyes-closed auditory-proprioceptive catch quality",
    maxDuration: 90,
  },
  {
    id: "throw_in",
    label: "Throw-In",
    emoji: "🙌",
    category: "Technical",
    tagline: "Distance reach · Non-dominant stance · Technique score",
    equipment: "Football · target cones",
    protocol: [
      "Mark targets at 10 m and 15 m from your feet.",
      "Test A: 4 throw-ins from standing position — both feet behind line.",
      "Test B: 4 throw-ins from short run-up (3 steps). Feet must not cross line at release.",
      "Test C: 3 throw-ins from non-dominant stance (opposite foot forward).",
      "Ball must start behind the head and follow a clean arc — no short-arming.",
    ],
    cameraSetup: "SIDE-ON · full body · captures feet position, arm arc, and ball release point.",
    metrics: [
      { key: "max_distance",     label: "Maximum Distance",         unit: "m",   description: "Furthest legal throw-in (feet behind line, ball behind head)" },
      { key: "weak_accuracy",    label: "Non-Dominant Accuracy",    unit: "%",   description: "Throws landing on target — opposite stance" },
      { key: "technique_score",  label: "Throw Technique",          unit: "pts", description: "AI rating: feet, arc, arm symmetry, follow-through (1–10)" },
    ],
    focus: "throw-in technique — both feet on or behind line, ball starting behind head, equal contribution from both hands, arching trajectory, distance and accuracy to target, comparison between dominant and non-dominant stance, follow-through and body balance after release",
    maxDuration: 60,
  },
];

// ─── Vault helper ─────────────────────────────────────────────────────────────

const VAULT_KEY = "grassroots_highlight_vault";

function saveToVault(clip: { id: string; drill: string; videoUrl: string | null; feedback: THUTOFeedback; createdAt: string }) {
  try {
    const existing = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]");
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
    vid.onloadedmetadata = () => { vid.currentTime = Math.min(vid.duration / 2, 15); };
    vid.onseeked = () => {
      try {
        const W = Math.min(vid.videoWidth || 640, 1280);
        const H = Math.min(vid.videoHeight || 480, 720);
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(vid, 0, 0, W, H);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        URL.revokeObjectURL(url);
        resolve(base64);
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    vid.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load video")); };
  });
}

// ─── R2 upload ────────────────────────────────────────────────────────────────

async function uploadToR2(blob: Blob, drillId: string): Promise<string | null> {
  try {
    const filename = `capture-${drillId}-${Date.now()}.webm`;
    const presignRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content_type: "video/webm", folder: "captures" }),
    });
    if (!presignRes.ok) return null;
    const { uploadUrl, publicUrl } = (await presignRes.json()) as { uploadUrl: string; publicUrl: string | null };
    const putRes = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "video/webm" } });
    if (!putRes.ok) return null;
    return publicUrl;
  } catch { return null; }
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

// ─── Score colour helper ──────────────────────────────────────────────────────

function scoreColour(score: number) {
  if (score >= 7) return { bg: "#f0fdf4", border: "#bbf7d0", text: "#1a5c2a", label: "Strong" };
  if (score >= 5) return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: "Developing" };
  return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "Needs Work" };
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
  const token = useAuthStore((s) => s.token);

  // ── State ──
  const [screen,       setScreen]       = useState<Screen>("select");
  const [drillId,      setDrillId]      = useState<string>("");
  const [elapsed,      setElapsed]      = useState(0);
  const [feedback,     setFeedback]     = useState<THUTOFeedback | null>(null);
  const [videoUrl,     setVideoUrl]     = useState<string | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [cameraError,  setCameraError]  = useState(false);

  // Profile + history
  const [profile,       setProfile]       = useState<PlayerProfile | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [rank,          setRank]          = useState<number | null>(null);
  const [improvement,   setImprovement]   = useState<number | null>(null);

  // Practice plan
  const [practiceTicks,    setPracticeTicks]    = useState<boolean[]>([]);
  const [practiceComplete, setPracticeComplete] = useState(false);

  // ── Refs ──
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);

  // ── Typewriter ──
  const strengthText   = useTypewriter(screen === "feedback" ? (feedback?.strength ?? "")           : "", 20);
  const correctionText = useTypewriter(screen === "feedback" ? (feedback?.correction ?? "")          : "", 20);
  const drillText      = useTypewriter(screen === "feedback" ? (feedback?.drillRecommendation ?? "") : "", 20);

  const drill = DRILLS.find((d) => d.id === drillId) ?? null;

  // ── Fetch player profile on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) setProfile(data.data);
        else if (data)  setProfile(data);
      })
      .catch(() => {});
  }, [token, user]);

  // ── Sync practice ticks with exercises count ──────────────────────────────
  useEffect(() => {
    const count = feedback?.practice_plan?.exercises?.length ?? 0;
    setPracticeTicks(Array(count).fill(false));
    setPracticeComplete(false);
  }, [feedback]);

  // ── Camera ────────────────────────────────────────────────────────────────

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
    } catch { setCameraError(true); }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (screen === "recording") {
      startCamera().then(() => {
        setTimeout(() => { if (streamRef.current) startRecording(); }, 400);
      });
    }
    if (screen === "select" || screen === "protocol") stopStream();
    return () => { if (screen !== "recording") stopStream(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => () => stopStream(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ─────────────────────────────────────────────────────────────

  const getMimeType = (): string => {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    if (typeof MediaRecorder === "undefined") return "";
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    recorderRef.current = null;
    chunksRef.current   = [];
    const mimeType = getMimeType();
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
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

  // ── Upload + Analyse ──────────────────────────────────────────────────────

  const handleUploadAndAnalyse = async (blob: Blob) => {
    if (!drill) return;
    try {
      let frame: string | null = null;
      try { frame = await extractFrame(blob); } catch {}

      const r2Url = await uploadToR2(blob, drill.id);
      setVideoUrl(r2Url);

      // Player profile context for THUTO / AMARA
      const playerName = profile?.first_name ?? (user?.name?.split(" ")[0]) ?? "Player";
      const position   = profile?.position ?? "footballer";
      const gender     = profile?.gender   ?? "";
      const age_group  = profile?.age_group ?? "";

      const res = await fetch("/api/capture/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          frame,
          drill:      drill.label,
          focus:      drill.focus,
          playerName,
          position,
          gender,
          age_group,
          videoUrl:   r2Url,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as THUTOFeedback;
      setFeedback(data);
      setScreen("feedback");

      // Save to drill_analysis_results + get rank/improvement from backend
      try {
        const saveRes = await api.post("/player/captures/drill-result", {
          drill_id:       drill.id,
          drill_name:     drill.label,
          overall_score:  data.drill_score,
          feedback:       `${data.strength} ${data.correction} ${data.drillRecommendation}`,
          video_url:      r2Url ?? undefined,
          age_group:      age_group || undefined,
          gender:         gender || undefined,
          position:       position !== "footballer" ? position : undefined,
          practice_plan:  data.practice_plan,
          sport:          "football",
        });
        const saved = saveRes.data?.data ?? saveRes.data;
        if (saved?.previous_score !== undefined) setPreviousScore(saved.previous_score);
        if (saved?.improvement    !== undefined) setImprovement(saved.improvement);
        if (saved?.rank           !== undefined) setRank(saved.rank);
      } catch {
        // Backend save failed silently — feedback still shown
      }

      // Also save to local vault
      try {
        saveToVault({ id: `${Date.now()}`, drill: drill.label, videoUrl: r2Url, feedback: data, createdAt: new Date().toISOString() });
      } catch {}

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErrorMsg(msg);
      setScreen("error");
    }
  };

  // ── Practice tick ─────────────────────────────────────────────────────────

  const toggleTick = (index: number) => {
    setPracticeTicks((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      setPracticeComplete(updated.every(Boolean));
      return updated;
    });
  };

  // ── Retest (same drill, reset capture state) ──────────────────────────────

  const retest = () => {
    // Keep drillId — same drill
    blobRef.current = null;
    // previousScore stays as the old best (for next comparison)
    const lastScore = feedback?.drill_score ?? null;
    if (lastScore !== null) setPreviousScore(lastScore);
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setPracticeTicks([]);
    setPracticeComplete(false);
    setRank(null);
    setImprovement(null);
    setScreen("protocol");
  };

  // ── Full reset ────────────────────────────────────────────────────────────

  const reset = () => {
    blobRef.current = null;
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setPreviousScore(null);
    setRank(null);
    setImprovement(null);
    setPracticeTicks([]);
    setPracticeComplete(false);
    setScreen("select");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const playerName = profile?.first_name ?? user?.name?.split(" ")[0] ?? "Player";
  const playerPos  = profile?.position ?? "";
  const playerAG   = profile?.age_group ?? "";

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

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate" style={{ color: "#1a5c2a" }}>
              Football Skill Analysis
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {screen === "select"    && "Select a drill to analyse"}
              {screen === "protocol" && (drill?.label ?? "Setup & Protocol")}
              {screen === "recording" && `Recording — ${drill?.label}`}
              {screen === "uploading" && "THUTO is analysing..."}
              {screen === "feedback"  && `${drill?.label} — Feedback`}
              {screen === "error"     && "Analysis failed"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* THUTO badge */}
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: "#f0fdf4", color: "#1a5c2a", border: "1px solid #bbf7d0" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              THUTO
              {profile?.gender === "female" && <span className="ml-0.5 text-purple-600">+ AMARA</span>}
            </div>
            {/* Player chip */}
            {profile && (
              <p className="text-xs text-gray-400 truncate max-w-[140px]">
                {playerName}{playerPos ? ` · ${playerPos}` : ""}{playerAG ? ` · ${playerAG}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 1 — DRILL SELECT
              ════════════════════════════════════════════════════════════════ */}
          {screen === "select" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Select a drill · record your technique · get scored feedback.
                </p>
                <Link
                  href="/player/capture/leaderboard"
                  className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e5e5", color: "#1a5c2a" }}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Leaderboard
                </Link>
              </div>

              {CATEGORIES.map((cat) => {
                const catDrills = DRILLS.filter((d) => d.category === cat.id);
                if (catDrills.length === 0) return null;
                return (
                  <div key={cat.id}>
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

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 2 — PROTOCOL
              ════════════════════════════════════════════════════════════════ */}
          {screen === "protocol" && drill && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "#e5e5e5" }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{drill.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#1a5c2a" }}>{drill.label}</h2>
                    <p className="text-xs text-gray-500">{drill.tagline}</p>
                  </div>
                </div>
              </div>

              {previousScore !== null && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#1a5c2a" }}
                >
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span>Previous best: <strong>{previousScore.toFixed(1)}/10</strong> — can you beat it?</span>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Equipment needed</p>
                <p className="text-sm text-gray-700">{drill.equipment}</p>
              </div>

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

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 3 — RECORDING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "recording" && drill && (
            <div className="space-y-5">
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
                    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">REC</span>
                    </div>
                    <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {drill.maxDuration - elapsed}s
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${(elapsed / drill.maxDuration) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-2xl mb-1">{drill.emoji}</p>
                <p className="font-semibold text-sm" style={{ color: "#1a5c2a" }}>{drill.label}</p>
                <p className="text-xs text-gray-400 mt-1">{elapsed}s elapsed · max {drill.maxDuration}s</p>
              </div>

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

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 4 — UPLOADING / ANALYSING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "uploading" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}
                >
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
              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50%       { transform: translateY(-8px); }
                }
              `}</style>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 5 — FEEDBACK
              ════════════════════════════════════════════════════════════════ */}
          {screen === "feedback" && feedback && drill && (
            <div className="space-y-4">

              {/* THUTO header */}
              <div
                className="flex items-center gap-3 rounded-2xl border p-4"
                style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}
                >
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: "#1a5c2a" }}>THUTO{profile?.gender === "female" ? " + AMARA" : ""}</p>
                  <p className="text-xs text-gray-500">{drill.label} · just now</p>
                </div>
              </div>

              {/* ── SCORE BADGE ── */}
              {(() => {
                const sc = scoreColour(feedback.drill_score);
                return (
                  <div
                    className="flex flex-col items-center rounded-2xl border p-5"
                    style={{ backgroundColor: sc.bg, borderColor: sc.border }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: sc.text }}>
                      THUTO Score
                    </p>
                    <p className="text-5xl font-black tabular-nums" style={{ color: sc.text }}>
                      {feedback.drill_score.toFixed(1)}
                      <span className="text-2xl font-bold">/10</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: sc.text }}>{sc.label}</p>

                    {/* Progress vs previous */}
                    {previousScore !== null && improvement !== null && (
                      <div className="mt-3 flex items-center gap-2">
                        {improvement > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              +{improvement.toFixed(1)} vs best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        ) : improvement < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-600">
                              {improvement.toFixed(1)} vs best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        ) : (
                          <>
                            <Minus className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-600">
                              Same as best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Rank */}
                    {rank !== null && rank <= 20 && (
                      <div
                        className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ backgroundColor: rank <= 3 ? "#c8962a" : "#1a5c2a", color: "#fff" }}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Ranked #{rank}
                        {playerAG ? ` in ${playerAG}` : ""}
                        {profile?.gender ? ` ${profile.gender === "female" ? "Female" : "Male"}` : ""}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Strength */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
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
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
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
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏋️</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Drill to try right now
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {drillText}
                  {drillText.length < (feedback.drillRecommendation?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* ── PRACTICE PLAN ── */}
              {feedback.practice_plan?.exercises?.length > 0 && (
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#e5e5e5" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCw className="h-4 w-4" style={{ color: "#1a5c2a" }} />
                    <p className="font-bold text-sm" style={{ color: "#1a5c2a" }}>
                      {feedback.practice_plan.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Tick each exercise when done. When all are ticked, Retest unlocks.
                  </p>

                  <div className="space-y-4">
                    {feedback.practice_plan.exercises.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => toggleTick(i)}
                        className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors"
                        style={{
                          backgroundColor: practiceTicks[i] ? "#f0fdf4" : "#f9fafb",
                          border: `1px solid ${practiceTicks[i] ? "#bbf7d0" : "#f3f4f6"}`,
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {practiceTicks[i]
                            ? <CheckSquare className="h-5 w-5 text-green-600" />
                            : <SquareIcon  className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold" style={{ color: practiceTicks[i] ? "#1a5c2a" : "#1a1a1a" }}>
                              {ex.name}
                            </p>
                            <span className="rounded-full px-2 py-0.5 text-xs"
                                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                              {ex.duration}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-xs"
                                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                              {ex.reps}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed">{ex.description}</p>
                          <p className="mt-1 text-xs italic text-gray-400">{ex.why}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Retest button */}
                  <button
                    onClick={retest}
                    disabled={!practiceComplete}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all"
                    style={practiceComplete
                      ? { backgroundColor: "#1a5c2a", color: "#fff" }
                      : { backgroundColor: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
                    }
                  >
                    <RefreshCw className="h-5 w-5" />
                    {practiceComplete ? "Retest Now — Beat Your Score!" : `Complete all ${feedback.practice_plan.exercises.length} exercises to unlock Retest`}
                  </button>
                </div>
              )}

              {/* Secondary actions */}
              <div className="flex gap-3">
                <button
                  onClick={retest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Record Again
                </button>

                <Link
                  href={`/player/capture/leaderboard?drill_id=${drill.id}&age_group=${playerAG}&gender=${profile?.gender ?? ""}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#e5e5e5", color: "#374151" }}
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Link>
              </div>

              {videoUrl && !savedToVault && (
                <button
                  onClick={() => {
                    saveToVault({ id: `${Date.now()}`, drill: drill.label, videoUrl, feedback, createdAt: new Date().toISOString() });
                    setSavedToVault(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                  style={{ backgroundColor: "#c8962a", color: "#fff" }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Save Video to Vault
                </button>
              )}
              {savedToVault && (
                <Link
                  href="/player/vault"
                  className="block w-full rounded-xl border py-3 text-center text-sm text-gray-500 hover:bg-gray-50"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  View in Highlight Vault →
                </Link>
              )}

              <button onClick={reset} className="block w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600">
                ← Choose a different drill
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 6 — ERROR
              ════════════════════════════════════════════════════════════════ */}
          {screen === "error" && (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">Analysis failed</h2>
              <p className="mt-2 max-w-xs text-sm text-gray-500">{errorMsg}</p>
              <button
                onClick={() => setScreen("protocol")}
                className="mt-8 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
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
