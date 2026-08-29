"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, Upload, Camera,
  StopCircle, Video, Zap, CheckCircle2, RefreshCw,
  Share2, Trophy, Info, Target,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// ── Score normalisation ──────────────────────────────────────────────────────

function scoreSpeed(sec: number): number {
  if (sec <= 3.8) return 98; if (sec <= 4.2) return 88; if (sec <= 4.6) return 76;
  if (sec <= 5.0) return 63; if (sec <= 5.5) return 50; if (sec <= 6.0) return 38; return 26;
}
function scoreJump(cm: number): number {
  if (cm >= 65) return 98; if (cm >= 55) return 88; if (cm >= 45) return 76;
  if (cm >= 35) return 63; if (cm >= 25) return 50; if (cm >= 15) return 38; return 26;
}
// Balance: weighted errors (eyes-closed × 1.5) — lower is better
function scoreBalance(rOpen: number, lOpen: number, rClosed: number, lClosed: number): number {
  const w = rOpen + lOpen + rClosed * 1.5 + lClosed * 1.5;
  if (w <= 1)  return 98; if (w <= 3)  return 88; if (w <= 6)  return 75;
  if (w <= 10) return 60; if (w <= 15) return 45; if (w <= 20) return 32; return 20;
}
function scoreReaction(sec: number): number {
  if (sec <= 2.0) return 98; if (sec <= 2.5) return 86; if (sec <= 3.0) return 73;
  if (sec <= 3.5) return 59; if (sec <= 4.0) return 46; if (sec <= 4.5) return 34; return 24;
}
function scoreAgility(sec: number): number {
  if (sec <= 4.2) return 98; if (sec <= 4.6) return 86; if (sec <= 5.0) return 73;
  if (sec <= 5.5) return 59; if (sec <= 6.0) return 46; if (sec <= 6.5) return 34; return 24;
}

function scoreTier(s: number): { tier: string; color: string; bg: string } {
  if (s >= 90) return { tier: "Elite",      color: "#fff",    bg: "#1c3d22" };
  if (s >= 75) return { tier: "Advanced",   color: "#fff",    bg: "#2d6b3c" };
  if (s >= 60) return { tier: "Good",       color: "#1c3d22", bg: "#dcfce7" };
  if (s >= 45) return { tier: "Average",    color: "#92400e", bg: "#fef3c7" };
  if (s >= 30) return { tier: "Developing", color: "#7c3333", bg: "#fee2e2" };
  return               { tier: "Beginner",  color: "#374151", bg: "#f3f4f6" };
}

// ── Plain English helpers ─────────────────────────────────────────────────────

function plainEnglish(testId: string, score: number): string {
  switch (testId) {
    case "sprint":
      if (score >= 75) return "Your speed and acceleration are well above average. Scouts notice fast players instantly — this is a standout attribute.";
      if (score >= 50) return "Decent pace for your level. Work on your first 10m explosion — that's where sprints are won or lost.";
      return "Speed takes time to build but improves fast with the right drills. Short burst training 3× per week will make a noticeable difference.";
    case "jump":
      if (score >= 75) return "Excellent explosive leg power. Your fast-twitch muscle fibres are naturally strong — great for sprinting and aerial ability.";
      if (score >= 50) return "Average leg power for your age group. Box jumps and squat jumps twice a week will improve this over 6–8 weeks.";
      return "Leg power is trainable. Start with bodyweight squats and calf raises daily, then progress to bounding and jump drills.";
    case "balance":
      if (score >= 75) return "Strong body control. You naturally know where your body is in space — this makes you harder to knock off the ball and safer under pressure.";
      if (score >= 50) return "Decent balance. Single-leg exercises and eyes-closed standing will build this further within a few weeks.";
      return "Balance training protects your ankles and makes you more stable in challenges. Practise single-leg stands daily — it's simple and it works.";
    case "reaction":
      if (score >= 75) return "Fast reactive speed — your brain responds to movement quickly. This gives you a split-second advantage in one-on-one situations.";
      if (score >= 50) return "Average reaction time. Ladder drills and partner reaction games improve this within 4–6 weeks.";
      return "Reaction speed responds well to training. Mirror drills and reaction ball exercises are fun and effective — try them daily.";
    case "agility":
      if (score >= 75) return "Sharp change-of-direction ability. You can stop, pivot, and accelerate quickly — a key trait scouts look for in every position.";
      if (score >= 50) return "Adequate agility. Cone drills done 2–3 times per week will sharpen your cuts and turns noticeably.";
      return "Agility develops quickly with practice. Start with basic ladder footwork, then progress to reactive cone patterns as you get sharper.";
    default:
      return `${scoreTier(score).tier} level result. Keep training consistently to improve.`;
  }
}

function drillTip(testId: string, score: number): string {
  switch (testId) {
    case "sprint":
      if (score >= 75) return "Hill sprints × 6 reps — keeps top-end speed sharp";
      if (score >= 50) return "A-skip + 10m burst × 8 reps — builds acceleration mechanics";
      return "Wall drive × 3 sets of 10 each leg — teaches correct sprint posture";
    case "jump":
      if (score >= 75) return "Depth jumps × 3 sets of 5 — maintains reactive power";
      if (score >= 50) return "Box jump × 4 sets of 6 — builds explosive power";
      return "Squat jump (bodyweight) × 3 sets of 10 — develops fast-twitch fibres";
    case "balance":
      if (score >= 75) return "Single-leg deadlift × 3 sets each side — advanced proprioception";
      if (score >= 50) return "Eyes-closed single-leg stand × 30 sec × 3 sets — deeper balance";
      return "Single-leg stand (eyes open) × 3 sets of 30 sec each side — do this daily";
    case "reaction":
      if (score >= 75) return "Partner reaction ball throws × 3 min — keeps sharpness";
      if (score >= 50) return "Mirror drill with a partner × 5 min — reactive footwork";
      return "Tennis ball drop reactions × 10 reps — trains response speed simply";
    case "agility":
      if (score >= 75) return "5-10-5 shuttle × 5 timed reps — fine-tunes peak change of direction";
      if (score >= 50) return "T-drill × 5 reps each direction — builds multi-directional agility";
      return "Basic ladder footwork (2 feet each box) × 4 passes — foundation agility";
    default:
      return "20 min general athletic training 3× per week";
  }
}

// ── Test definitions ─────────────────────────────────────────────────────────

type TestId = "sprint" | "jump" | "balance" | "reaction" | "agility";

interface Benchmark { label: string; value: string }

interface TestDef {
  id: TestId;
  name: string;
  icon: string;
  tagline: string;
  geminiType: string | null;
  /** "balance" uses its own 4-field input instead of a single number */
  inputVariant: "single" | "balance";
  unit: string;
  lowerIsBetter: boolean;
  diagram: string;
  setup: string[];
  cameraGuide: string;
  label: string;
  placeholder: string;
  min: number;
  max: number;
  step: number;
  benchmarks: Benchmark[];
  scoreFn: (v: number) => number;
}

const TESTS: TestDef[] = [
  /* T1 ── Speed & Acceleration ─────────────────────────────────────────── */
  {
    id: "sprint",
    name: "Speed & Acceleration",
    icon: "⚡",
    tagline: "30m sprint — 0–10m burst + 10–30m top-end speed",
    geminiType: "sprint",
    inputVariant: "single",
    unit: "sec",
    lowerIsBetter: true,
    diagram:
      "[ START ] ─── 10m ─── [ CONE 2 ] ─── 20m ─── [ FINISH 30m ]\n" +
      "                                               📷 ← camera here (3–5m to the side)",
    setup: [
      "Place 3 cones in a straight line: 0m (start), 10m, and 30m (finish).",
      "Camera 3–5m to the SIDE of the 30m finish cone, perpendicular to the sprint path.",
      "Set phone to Slow Motion — 120fps or 240fps — for accurate frame-based timing.",
      "Player starts standing still behind the 0m cone.",
      "Sprint at full effort through all 3 cones without slowing before the finish.",
      "Recommended: Photo Finish Sprint Timer or My Sprint Pro — record 30m total time.",
      "Do 2 attempts. Use the best result.",
    ],
    cameraGuide:
      "Phone on tripod 3–5m to the SIDE of the 30m finish cone, lens pointing perpendicular to the sprint. 30m finish line must be clearly in frame.",
    label: "Best 30m sprint time",
    placeholder: "e.g. 4.5",
    min: 2.5, max: 8.0, step: 0.01,
    benchmarks: [
      { label: "World-class", value: "< 3.8s"    },
      { label: "Elite youth",  value: "3.8–4.2s"  },
      { label: "Good",         value: "4.2–4.8s"  },
      { label: "Grassroots",   value: "4.8–5.5s"  },
    ],
    scoreFn: scoreSpeed,
  },

  /* T2 ── Vertical Jump ────────────────────────────────────────────────── */
  {
    id: "jump",
    name: "Vertical Jump",
    icon: "🦘",
    tagline: "Explosive leg power — flight time method (h = ⅛g·t²)",
    geminiType: "jump",
    inputVariant: "single",
    unit: "cm",
    lowerIsBetter: false,
    diagram:
      "📷 (ground level, 2–3m to the side)\n" +
      "│\n" +
      "└── Player: feet shoulder-width, full body in frame (head to toes)",
    setup: [
      "Place phone at ANKLE / GROUND LEVEL on a stable surface — use a shoe, book, or low tripod.",
      "Film from the SIDE — the player's full body from head to toes must be visible.",
      "Player stands with feet shoulder-width apart, arms at sides.",
      "Countermovement jump: bend knees, swing arms upward, jump as high as possible.",
      "Recommended app: My Jump Lab — use frame-by-frame toe-off and toe-land selection.",
      "Formula used: h = ½ × g × (t/2)² where g = 9.81 m/s², t = total flight time.",
      "Do 3 attempts. Record the best height.",
    ],
    cameraGuide:
      "Phone at GROUND LEVEL, 2–3m to the SIDE. Both feet and full body visible head to toe. Use landscape orientation.",
    label: "Best jump height",
    placeholder: "e.g. 42",
    min: 5, max: 100, step: 1,
    benchmarks: [
      { label: "World-class", value: "> 65cm"   },
      { label: "Elite youth",  value: "50–65cm"  },
      { label: "Good",         value: "35–50cm"  },
      { label: "Grassroots",   value: "20–35cm"  },
    ],
    scoreFn: scoreJump,
  },

  /* T3 ── Balance / Proprioception ─────────────────────────────────────── */
  {
    id: "balance",
    name: "Balance & Proprioception",
    icon: "⚖️",
    tagline: "Ankle stability + neuromuscular control — 4 stances × 30 sec",
    geminiType: "balance",  // measures hip drop + knee valgus during single-leg stance
    inputVariant: "balance",
    unit: "errors",
    lowerIsBetter: true,
    diagram:
      "Test order (rest 30s between each stance):\n" +
      "  1. Right leg, eyes OPEN   → count errors (touch-downs, hops, grabs)\n" +
      "  2. Left leg,  eyes OPEN   → count errors\n" +
      "  3. Right leg, eyes CLOSED → count errors  (weighted ×1.5 in GRS engine)\n" +
      "  4. Left leg,  eyes CLOSED → count errors  (weighted ×1.5 in GRS engine)\n" +
      "\n" +
      "  Surface: flat, HARD floor — barefoot or thin socks only",
    setup: [
      "Use a flat, HARD surface — barefoot or thin socks only. Shoes mask ankle instability.",
      "Stand on ONE leg. The lifted foot must NOT touch the standing leg or the floor.",
      "Hold each stance for exactly 30 seconds. Use your phone stopwatch.",
      "Each touch-down, hop, or grab for support = 1 error. Count every error honestly.",
      "Test in this exact order: Right Open → Left Open → Right Closed → Left Closed.",
      "Rest 30 seconds between each stance.",
      "Eyes-closed scores are weighted ×1.5 in the GRS engine — harder means more diagnostic.",
      "A partner counts errors live. Or prop your phone up and review the video after.",
    ],
    cameraGuide:
      "No specific camera required. If recording solo, prop the phone 1–2m in front at waist height and review the video after to count errors accurately.",
    label: "Error counts across 4 stances",
    placeholder: "0",
    min: 0, max: 30, step: 1,
    benchmarks: [
      { label: "Elite (target)",    value: "0–2 total weighted errors"  },
      { label: "Good",              value: "3–6 weighted errors"        },
      { label: "Average",           value: "7–10 weighted errors"       },
      { label: "Developing",        value: "> 10 weighted errors"       },
    ],
    scoreFn: () => 0, // Not used — balance uses a 4-field custom scorer
  },

  /* T4 ── Scanning & Reactive Shuttle ──────────────────────────────────── */
  {
    id: "reaction",
    name: "Scanning & Reactive Shuttle",
    icon: "👁️",
    tagline: "Visual scan → decision → explosive directional burst",
    geminiType: null,   // reaction time can't be extracted from pose landmarks — manual entry only
    inputVariant: "single",
    unit: "sec",
    lowerIsBetter: true,
    diagram:
      "            [ LEFT CONE ]\n" +
      "                  ^ 5m\n" +
      "[ Coach ] → [ CENTER ] ← 📷 (behind player, chest height)\n" +
      "                  v 5m\n" +
      "            [ RIGHT CONE ]",
    setup: [
      "Place a CENTER cone where the player will stand.",
      "Place a LEFT cone 5m to the player's LEFT and a RIGHT cone 5m to the player's RIGHT.",
      "Coach stands 5m AHEAD of the center cone (facing the player), holding a RED and a BLUE marker.",
      "Camera is placed DIRECTLY BEHIND the player at chest height — it sees the player's back and the coach beyond.",
      "Player does continuous fast feet / light jogging on the spot at CENTER cone, scanning shoulder-to-shoulder.",
      "Coach randomly raises RED → player sprints LEFT past the left cone.",
      "Coach randomly raises BLUE → player sprints RIGHT past the right cone.",
      "Measure the time from when the coach raises the marker to when the player passes the called cone.",
      "Do 5 trials. Record the average time.",
    ],
    cameraGuide:
      "Camera DIRECTLY BEHIND the player at chest height, facing toward the coach. Coach, player, and both side cones must all be visible in frame.",
    label: "Avg reaction-to-cone time",
    placeholder: "e.g. 2.8",
    min: 1.0, max: 6.0, step: 0.01,
    benchmarks: [
      { label: "Elite",       value: "< 2.0s"  },
      { label: "Good",        value: "2.0–2.8s" },
      { label: "Average",     value: "2.8–3.5s" },
      { label: "Developing",  value: "> 3.5s"   },
    ],
    scoreFn: scoreReaction,
  },

  /* T5 ── 5-10-5 Pro Agility ───────────────────────────────────────────── */
  {
    id: "agility",
    name: "5-10-5 Pro Agility Shuttle",
    icon: "🔀",
    tagline: "Acceleration + deceleration + change of direction",
    geminiType: "agility",  // measures cut depth, L/R symmetry, COM height during direction changes
    inputVariant: "single",
    unit: "sec",
    lowerIsBetter: true,
    diagram:
      "[ Cone A ] ←── 5m ──→ [ Cone B ] ←── 5m ──→ [ Cone C ]\n" +
      "                        (START)\n" +
      "                           📷 ← 8–10m directly across from Cone B",
    setup: [
      "Place 3 cones in a straight line, 5m apart: Cone A (left end), Cone B (center), Cone C (right end).",
      "Camera 8–10m DIRECTLY ACROSS from Cone B (perpendicular to the cone line). All 3 cones must be visible.",
      "Player straddles Cone B in an athletic stance — feet either side, down hand touching the ground.",
      "On signal: sprint 5m RIGHT to touch Cone C, plant and turn, sprint 10m LEFT to touch Cone A, plant and turn, sprint 5m back past Cone B.",
      "Total = 20m with 2 direction changes. Run ends when the player passes Cone B on the final return.",
      "Do 2 attempts. Record the best time.",
    ],
    cameraGuide:
      "Camera 8–10m to the SIDE of Cone B (center), perpendicular to the cone line. All 3 cones and full athlete movement must stay in frame throughout.",
    label: "Best 5-10-5 time",
    placeholder: "e.g. 4.9",
    min: 3.5, max: 9.0, step: 0.01,
    benchmarks: [
      { label: "Elite",       value: "< 4.2s"  },
      { label: "Good",        value: "4.2–4.8s" },
      { label: "Average",     value: "4.8–5.5s" },
      { label: "Developing",  value: "> 5.5s"   },
    ],
    scoreFn: scoreAgility,
  },
];

const TOTAL_TESTS = TESTS.length;

// ── Per-test state ────────────────────────────────────────────────────────────

interface TestState {
  expanded: boolean;
  inputMode: "manual" | "video";
  manualValue: string;
  // Balance-specific sub-fields
  balRightOpen:   string;
  balLeftOpen:    string;
  balRightClosed: string;
  balLeftClosed:  string;
  // Video
  video:   File | null;
  preview: string | null;
  // Results
  measuring:     boolean;
  measuredValue: number | null;
  measureNote:   string;
  score:         number | null;
  error:         string;
}

function initState(): TestState {
  return {
    expanded: false, inputMode: "manual", manualValue: "",
    balRightOpen: "", balLeftOpen: "", balRightClosed: "", balLeftClosed: "",
    video: null, preview: null,
    measuring: false, measuredValue: null, measureNote: "", score: null, error: "",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [states, setStates] = useState<Record<string, TestState>>(
    () => Object.fromEntries(TESTS.map((t) => [t.id, initState()]))
  );
  const [showGuide,    setShowGuide]    = useState<Record<string, boolean>>({});
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [arenaSharing, setArenaSharing] = useState(false);
  const [arenaPosted,  setArenaPosted]  = useState(false);
  const [ageGroup,     setAgeGroup]     = useState<"u13" | "u17" | "senior">("senior");
  const [testArenaPosted,    setTestArenaPosted]    = useState<Record<string, boolean>>({});
  const [testPassportSaved,  setTestPassportSaved]  = useState<Record<string, boolean>>({});

  // Single shared camera instance
  const [camTestId,   setCamTestId]   = useState<string | null>(null);
  const [camReady,    setCamReady]    = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown,   setCountdown]   = useState(60);

  const streamRef   = useRef<MediaStream | null>(null);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRefs    = useRef<Record<string, HTMLInputElement | null>>({});
  const xhrRef      = useRef<XMLHttpRequest | null>(null);

  const patch = (id: string, p: Partial<TestState>) =>
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));

  // Assign stream to video element when camera becomes ready
  useEffect(() => {
    if (!camReady || !streamRef.current) return;
    const assign = () => {
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    };
    assign();
    const id = setTimeout(assign, 150);
    return () => clearTimeout(id);
  }, [camReady, camTestId]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false); setIsRecording(false);
    setCamTestId(null); setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const startCamera = async (testId: string) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamTestId(testId);
      setCamReady(true);
    } catch {
      patch(testId, { error: "Camera access denied. Allow camera permission and try again." });
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  }, []);

  const startRecording = (testId: string) => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8"
      : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "";
    const rec = new MediaRecorder(streamRef.current, mime ? { mimeType: mime } : undefined);
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const type = rec.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const file = new File([blob], `bio_test.${type.includes("mp4") ? "mp4" : "webm"}`, { type });
      patch(testId, { video: file, preview: URL.createObjectURL(blob), error: "" });
      stopCamera();
    };
    rec.start(100);
    setIsRecording(true);
    setCountdown(60);
    let secs = 60;
    timerRef.current = setInterval(() => {
      secs -= 1; setCountdown(secs);
      if (secs <= 0) stopRecording();
    }, 1000);
  };

  // ── Python MediaPipe AI measurement ──────────────────────────────────────

  const measureWithPython = async (t: TestDef) => {
    const st = states[t.id];
    if (!st.video || !t.geminiType) return;
    patch(t.id, { measuring: true, error: "" });

    // Pre-warm: ping the Python service via SSE before sending the video.
    // The SSE stream sends keep-alive comments so Render's LB doesn't drop the
    // connection while the Python pod wakes from sleep (cold-start ~30-60 s).
    await new Promise<void>((resolve) => {
      try {
        const es = new EventSource("/api/fitness-test/warm");
        const guard = setTimeout(() => { es.close(); resolve(); }, 100_000);
        es.onmessage = () => { clearTimeout(guard); es.close(); resolve(); };
        es.onerror  = () => { clearTimeout(guard); es.close(); resolve(); };
      } catch { resolve(); }
    });

    const formData = new FormData();
    formData.append("file", st.video);
    const endpoint = `/api/fitness-test?test_type=${t.geminiType}&age_group=${ageGroup}`;

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const note = [data.key_metric, data.detail].filter(Boolean).join(" — ");
          patch(t.id, {
            measuring:     false,
            measuredValue: null,
            score:         data.test_score ?? data.overall_percentile ?? 50,
            measureNote:   note || "Analysis complete.",
            error:         "",
          });
        } catch {
          patch(t.id, { measuring: false, error: "Invalid response from AI service." });
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          patch(t.id, { measuring: false, error: err.detail ?? `Analysis failed (${xhr.status})` });
        } catch {
          patch(t.id, { measuring: false, error: `Analysis failed (${xhr.status})` });
        }
      }
    };

    xhr.onerror = () => {
      patch(t.id, {
        measuring: false,
        error: xhr.status > 0
          ? `HTTP ${xhr.status} from AI service`
          : "No response from AI service — check connection or try again.",
      });
    };

    xhr.open("POST", endpoint);
    xhr.send(formData);
  };

  // ── Manual submit (single-value tests) ───────────────────────────────────

  const submitManual = (t: TestDef) => {
    const val = parseFloat(states[t.id].manualValue);
    if (isNaN(val) || val < 0) { patch(t.id, { error: "Please enter a valid number." }); return; }
    patch(t.id, { measuredValue: val, score: t.scoreFn(val), measureNote: "Manually entered", error: "" });
  };

  // ── Balance submit (4-field weighted scoring) ─────────────────────────────

  const submitBalance = () => {
    const st = states["balance"];
    const rO = parseInt(st.balRightOpen,   10);
    const lO = parseInt(st.balLeftOpen,    10);
    const rC = parseInt(st.balRightClosed, 10);
    const lC = parseInt(st.balLeftClosed,  10);
    if ([rO, lO, rC, lC].some(isNaN)) { patch("balance", { error: "Please enter all 4 error counts (use 0 if no errors)." }); return; }
    const weighted = rO + lO + rC * 1.5 + lC * 1.5;
    const sc = scoreBalance(rO, lO, rC, lC);
    patch("balance", {
      measuredValue: parseFloat(weighted.toFixed(1)),
      score: sc,
      measureNote: `Right Open: ${rO} | Left Open: ${lO} | Right Closed: ${rC} | Left Closed: ${lC} · Weighted total: ${weighted.toFixed(1)}`,
      error: "",
    });
  };

  // ── Summary ───────────────────────────────────────────────────────────────

  const completedTests = TESTS.filter((t) => states[t.id].score !== null);
  const overallScore   = completedTests.length
    ? Math.round(completedTests.reduce((s, t) => s + (states[t.id].score ?? 0), 0) / completedTests.length)
    : null;

  const saveToPassport = async () => {
    if (!token || token === "dev-token" || overallScore === null) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/player/biometrics/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({
          testType: "biomechanics-talent-id",
          rawScore: overallScore,
          tier: scoreTier(overallScore).tier,
          scoutNarrative:
            `GRS Biomechanics Talent ID completed (${completedTests.length}/${TOTAL_TESTS} tests). ` +
            `Overall score: ${overallScore}/100 — ${scoreTier(overallScore).tier}.`,
          suggestedDrills: completedTests.map(
            (t) => `${t.name}: ${states[t.id].measuredValue}${t.unit} (Score ${states[t.id].score}/100)`
          ),
        }),
      });
      setSaved(true);
    } catch { /* silent */ } finally { setSaving(false); }
  };

  const shareToArena = async () => {
    if (!token || token === "dev-token" || overallScore === null) return;
    setArenaSharing(true);
    try {
      // Step 1: ensure result is saved to video_analyses
      let analysisId: string | null = null;
      if (!saved) {
        const saveRes = await fetch(`${API_URL}/video-analyses`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
          body: JSON.stringify({
            sport: "Athletics",
            analysis_type: "fitness_analyse",
            ai_feedback: {
              overall_score: overallScore,
              tier: scoreTier(overallScore).tier,
              tests: completedTests.map((t) => ({
                id: t.id, name: t.name,
                score: states[t.id].score,
                measured: states[t.id].measuredValue,
                unit: t.unit,
              })),
            },
            user_question: "GRS Biomechanics Talent Identifier",
          }),
        });
        if (saveRes.ok) {
          const d = await saveRes.json() as { data?: { id?: string }; id?: string };
          analysisId = d.data?.id ?? d.id ?? null;
          setSaved(true);
        }
      }
      // Step 2: share via video_analyses endpoint (or fall back to direct post)
      if (analysisId) {
        await fetch(`${API_URL}/video-analyses/${analysisId}/share-to-arena`, {
          method: "POST",
          headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        });
      } else {
        // Fallback: direct post (backend may not have video_analyses yet)
        const lines = completedTests.map((t) => {
          const st = states[t.id];
          return `${t.icon} ${t.name}: ${st.measuredValue}${t.unit} — ${scoreTier(st.score ?? 0).tier}`;
        });
        const postBody =
          `Just completed the GRS Biomechanics Talent Identifier! 🧬\n\n` +
          lines.join("\n") +
          `\n\nOverall Ability Score: ${overallScore}/100 — ${scoreTier(overallScore).tier}\n\n` +
          `#GrassRootsSports #BiomechanicsTalent #Zimbabwe`;
        await fetch(`${API_URL}/arena/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
          body: JSON.stringify({ body: postBody, post_type: "milestone" }),
        });
      }
      setArenaPosted(true);
    } catch { /* silent */ } finally { setArenaSharing(false); }
  };

  const saveTestToPassport = async (t: TestDef, score: number, tierLabel: string) => {
    if (!token || token === "dev-token") return;
    try {
      await fetch(`${API_URL}/player/biometrics/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({
          testType: `biomechanics-${t.id}`,
          rawScore: score,
          tier: tierLabel,
          scoutNarrative:
            `${t.name}: ${score}/100 — ${tierLabel}. ` +
            plainEnglish(t.id, score),
          suggestedDrills: [drillTip(t.id, score)],
        }),
      });
      setTestPassportSaved((prev) => ({ ...prev, [t.id]: true }));
    } catch { /* silent */ }
  };

  const shareTestToArena = async (t: TestDef, score: number, tierLabel: string) => {
    if (!token || token === "dev-token") return;
    try {
      // Try video_analyses pathway first
      const saveRes = await fetch(`${API_URL}/video-analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({
          sport: "Athletics",
          analysis_type: "fitness_analyse",
          ai_feedback: { test_id: t.id, name: t.name, score, tier: tierLabel, summary: plainEnglish(t.id, score) },
          user_question: t.name,
        }),
      });
      if (saveRes.ok) {
        const d = await saveRes.json() as { data?: { id?: string }; id?: string };
        const id = d.data?.id ?? d.id ?? null;
        if (id) {
          await fetch(`${API_URL}/video-analyses/${id}/share-to-arena`, {
            method: "POST",
            headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
          });
          setTestArenaPosted((prev) => ({ ...prev, [t.id]: true }));
          return;
        }
      }
      // Fallback: direct milestone post
      const body =
        `${t.icon} ${t.name} — Talent ID Result\n\n` +
        `Score: ${score}/100 · ${tierLabel}\n\n` +
        plainEnglish(t.id, score) + "\n\n" +
        `#GrassRootsSports #TalentID #Zimbabwe`;
      await fetch(`${API_URL}/arena/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
        body: JSON.stringify({ body, post_type: "milestone" }),
      });
      setTestArenaPosted((prev) => ({ ...prev, [t.id]: true }));
    } catch { /* silent */ }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/player" className="text-gray-400 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              Biomechanics Talent Identifier
            </h1>
            <p className="text-xs text-gray-400">5 core physical tests · Discover your natural ability</p>
          </div>
          <span className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ background: "#1c3d22", color: "#fff" }}>
            Talent ID
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Intro */}
        <div className="rounded-2xl p-4 border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <p className="text-sm font-black text-gray-900 mb-1">What does this measure?</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            These 5 tests reveal the raw physical attributes no coaching can fake — speed, explosive power,
            proprioceptive balance, cognitive reaction, and change-of-direction agility.
            Complete all 5 to unlock your <strong>Biomechanics Ability Score</strong>.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {TESTS.map((t) => (
              <span key={t.id}
                className="text-[11px] font-bold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
                {t.icon} {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Tests completed</p>
            <p className="text-xs font-black text-gray-900">{completedTests.length} / {TOTAL_TESTS}</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedTests.length / TOTAL_TESTS) * 100}%`, background: "#1c3d22" }} />
          </div>
        </div>

        {/* Age group selector */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider flex-shrink-0">Age group</p>
          <div className="flex gap-2">
            {(["u13", "u17", "senior"] as const).map((ag) => (
              <button key={ag} onClick={() => setAgeGroup(ag)}
                className="text-xs font-bold px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  background:   ageGroup === ag ? "#1c3d22" : "transparent",
                  color:        ageGroup === ag ? "#fff"    : "#374151",
                  borderColor:  ageGroup === ag ? "#1c3d22" : "#d1d5db",
                }}>
                {ag === "u13" ? "U13" : ag === "u17" ? "U17" : "Senior"}
              </button>
            ))}
          </div>
        </div>

        {/* Test cards */}
        {TESTS.map((t) => {
          const st          = states[t.id];
          const done        = st.score !== null;
          const tier        = done ? scoreTier(st.score!) : null;
          const isCamActive = camTestId === t.id;

          return (
            <div key={t.id} className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: done ? "#bbf7d0" : "#e5e7eb" }}>

              {/* Card header — click to expand */}
              <button
                onClick={() => patch(t.id, { expanded: !st.expanded })}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                </div>
                {done && tier ? (
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: tier.bg, color: tier.color }}>
                    {st.score}/100 · {tier.tier}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-1 rounded-full shrink-0">
                    Not done
                  </span>
                )}
                {st.expanded
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </button>

              {/* Expanded body */}
              {st.expanded && (
                <div className="border-t border-gray-100 px-4 pb-5 pt-4 space-y-4">

                  {/* Setup guide toggle */}
                  <button
                    onClick={() => setShowGuide((p) => ({ ...p, [t.id]: !p[t.id] }))}
                    className="flex items-center gap-1.5 text-xs font-bold"
                    style={{ color: "#1c3d22" }}
                  >
                    <Info size={13} />
                    {showGuide[t.id] ? "Hide setup guide" : "Show setup guide"}
                    {showGuide[t.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {showGuide[t.id] && (
                    <div className="rounded-xl p-3 space-y-3"
                      style={{ background: "#f8fffe", border: "1px solid #bbf7d0" }}>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Layout / sequence</p>
                        <pre className="text-[11px] font-mono text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100 leading-relaxed overflow-x-auto whitespace-pre">
                          {t.diagram}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Step-by-step</p>
                        <ol className="space-y-1.5">
                          {t.setup.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-600">
                              <span className="font-black shrink-0" style={{ color: "#1c3d22" }}>{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-wide mb-0.5">Camera / recording</p>
                        <p className="text-xs text-amber-700">{t.cameraGuide}</p>
                      </div>
                    </div>
                  )}

                  {/* Benchmarks */}
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
                      Reference benchmarks ({t.lowerIsBetter ? "lower is better" : "higher is better"})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {t.benchmarks.map((b) => (
                        <div key={b.label} className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-bold text-gray-400">{b.label}</p>
                          <p className="text-xs font-black text-gray-800">{b.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI vs Manual tabs (only for tests that have Gemini support) */}
                  {t.geminiType && (t.inputVariant === "single" || t.inputVariant === "balance") && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => patch(t.id, { inputMode: "video", error: "" })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all"
                        style={{
                          background: st.inputMode === "video" ? "#1c3d22" : "#f3f4f6",
                          color:      st.inputMode === "video" ? "#fff"    : "#6b7280",
                        }}
                      >
                        <Camera size={12} /> AI Measure (video)
                      </button>
                      <button
                        onClick={() => patch(t.id, { inputMode: "manual", error: "" })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-all"
                        style={{
                          background: st.inputMode === "manual" ? "#1c3d22" : "#f3f4f6",
                          color:      st.inputMode === "manual" ? "#fff"    : "#6b7280",
                        }}
                      >
                        <Target size={12} /> Manual entry
                      </button>
                    </div>
                  )}

                  {/* ── VIDEO input ── */}
                  {st.inputMode === "video" && t.geminiType && !done && (
                    <div className="space-y-2">
                      {isCamActive && camReady && !st.preview && (
                        <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 200 }}>
                          <video ref={videoRef} muted playsInline className="w-full object-cover"
                            style={{ maxHeight: 280 }} />
                          {isRecording && (
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              REC · {countdown}s
                            </div>
                          )}
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                            {!isRecording ? (
                              <button onClick={() => startRecording(t.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white"
                                style={{ background: "#dc2626" }}>
                                <Video size={12} /> Record
                              </button>
                            ) : (
                              <button onClick={stopRecording}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black text-white bg-gray-800">
                                <StopCircle size={12} /> Stop & Use
                              </button>
                            )}
                            <button onClick={stopCamera}
                              className="px-3 py-2 rounded-full text-xs font-bold text-white/70 bg-black/40">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {st.preview && (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                          <video src={st.preview} controls className="w-full h-full object-contain" />
                          <button
                            onClick={() => patch(t.id, { video: null, preview: null, measuredValue: null, score: null, measureNote: "" })}
                            className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {!st.preview && !(isCamActive && camReady) && (
                        <div className="flex gap-2">
                          <button onClick={() => startCamera(t.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed text-xs font-bold text-gray-500 hover:border-gray-400 transition">
                            <Camera size={14} /> Record now
                          </button>
                          <button onClick={() => fileRefs.current[t.id]?.click()}
                            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed text-xs font-bold text-gray-500 hover:border-gray-400 transition">
                            <Upload size={14} /> Upload clip
                          </button>
                          <input
                            ref={(el) => { fileRefs.current[t.id] = el; }}
                            type="file" accept="video/*" className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              if (f.size > 200 * 1024 * 1024) { patch(t.id, { error: "Video must be under 200MB." }); return; }
                              patch(t.id, { video: f, preview: URL.createObjectURL(f), error: "" });
                            }}
                          />
                        </div>
                      )}

                      {st.preview && st.score === null && (
                        <button onClick={() => measureWithPython(t)}
                          disabled={st.measuring}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                          style={{ background: "#1c3d22" }}>
                          {st.measuring
                            ? <><RefreshCw size={13} className="animate-spin" /> AI is analysing…</>
                            : <><Zap size={13} /> Analyse with AI</>}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── SINGLE MANUAL input (sprint, jump, reaction, agility) ── */}
                  {t.inputVariant === "single" && (st.inputMode === "manual" || !t.geminiType) && !done && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block">
                        {t.label} ({t.unit})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number" min={t.min} max={t.max} step={t.step}
                          value={st.manualValue}
                          onChange={(e) => patch(t.id, { manualValue: e.target.value, error: "" })}
                          onKeyDown={(e) => { if (e.key === "Enter") submitManual(t); }}
                          placeholder={t.placeholder}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white"
                        />
                        <button onClick={() => submitManual(t)}
                          className="px-5 py-2 rounded-xl text-xs font-black text-white"
                          style={{ background: "#1c3d22" }}>
                          Save
                        </button>
                      </div>
                      {!t.geminiType && (
                        <p className="text-[10px] text-gray-400">
                          Use a stopwatch or your phone's camera to time this drill. Enter your best result above.
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── BALANCE 4-field input ── */}
                  {t.inputVariant === "balance" && (st.inputMode === "manual" || !t.geminiType) && !done && (
                    <div className="space-y-3">
                      <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider">
                        Error count per stance (enter 0 if no errors)
                      </p>

                      {/* Eyes OPEN row */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-1.5">
                          Eyes <span className="text-green-700">OPEN</span> — 30 seconds each
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Right leg</label>
                            <input type="number" min={0} max={30} step={1}
                              value={st.balRightOpen}
                              onChange={(e) => patch(t.id, { balRightOpen: e.target.value, error: "" })}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Left leg</label>
                            <input type="number" min={0} max={30} step={1}
                              value={st.balLeftOpen}
                              onChange={(e) => patch(t.id, { balLeftOpen: e.target.value, error: "" })}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Eyes CLOSED row */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-xs font-bold text-gray-500">
                            Eyes <span className="text-amber-700">CLOSED</span> — 30 seconds each
                          </p>
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ×1.5 weight
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Right leg</label>
                            <input type="number" min={0} max={30} step={1}
                              value={st.balRightClosed}
                              onChange={(e) => patch(t.id, { balRightClosed: e.target.value, error: "" })}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm font-semibold text-gray-800 bg-amber-50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">Left leg</label>
                            <input type="number" min={0} max={30} step={1}
                              value={st.balLeftClosed}
                              onChange={(e) => patch(t.id, { balLeftClosed: e.target.value, error: "" })}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm font-semibold text-gray-800 bg-amber-50"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-400">
                        Error = any touch-down, hop, or grab for support. Eyes-closed errors count ×1.5.
                        Target: 0–2 total weighted errors.
                      </p>

                      <button onClick={submitBalance}
                        className="w-full py-2.5 rounded-xl text-xs font-black text-white"
                        style={{ background: "#1c3d22" }}>
                        Calculate Balance Score
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {st.error && (
                    <p className="text-xs text-red-600 font-semibold bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                      {st.error}
                    </p>
                  )}

                  {/* Result */}
                  {done && tier && (
                    <div className="rounded-xl p-4" style={{ background: tier.bg }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-lg font-black" style={{ color: tier.color }}>
                            {t.id === "balance"
                              ? `${st.measuredValue} weighted errors`
                              : st.measuredValue !== null
                                ? `${st.measuredValue}${t.unit}`
                                : "AI Analysed"}
                          </p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: tier.color, opacity: 0.85 }}>
                            Score: {st.score}/100 · {tier.tier}
                          </p>
                          {/* Plain English explanation */}
                          <p className="text-xs mt-2 leading-relaxed font-medium" style={{ color: tier.color, opacity: 0.9 }}>
                            {plainEnglish(t.id, st.score ?? 0)}
                          </p>
                          {/* Drill tip */}
                          <p className="text-[11px] mt-1.5 font-semibold" style={{ color: tier.color, opacity: 0.7 }}>
                            Try this: {drillTip(t.id, st.score ?? 0)}
                          </p>
                        </div>
                        <CheckCircle2 size={22} style={{ color: tier.color, opacity: 0.5 }} />
                      </div>

                      {/* Per-test share buttons */}
                      {user && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => saveTestToPassport(t, st.score ?? 0, tier.tier)}
                            disabled={testPassportSaved[t.id]}
                            className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg border transition"
                            style={{
                              color: tier.color,
                              borderColor: `${tier.color}60`,
                              background: testPassportSaved[t.id] ? `${tier.color}18` : "transparent",
                              opacity: testPassportSaved[t.id] ? 0.75 : 1,
                            }}
                          >
                            {testPassportSaved[t.id] ? "Saved to Passport" : "Add to Passport"}
                          </button>
                          <button
                            onClick={() => shareTestToArena(t, st.score ?? 0, tier.tier)}
                            disabled={testArenaPosted[t.id]}
                            className="flex-1 text-[11px] font-bold py-1.5 px-2 rounded-lg border transition"
                            style={{
                              color: tier.color,
                              borderColor: `${tier.color}60`,
                              background: testArenaPosted[t.id] ? `${tier.color}18` : "transparent",
                              opacity: testArenaPosted[t.id] ? 0.75 : 1,
                            }}
                          >
                            {testArenaPosted[t.id] ? "Posted to Arena" : "Share to Arena"}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => patch(t.id, {
                          measuredValue: null, score: null, manualValue: "",
                          balRightOpen: "", balLeftOpen: "", balRightClosed: "", balLeftClosed: "",
                          video: null, preview: null, measureNote: "",
                        })}
                        className="mt-3 text-xs font-bold underline block"
                        style={{ color: tier.color, opacity: 0.6 }}
                      >
                        Redo this test
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}

        {/* Summary card */}
        {overallScore !== null && (
          <div className="rounded-2xl p-5 border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={20} style={{ color: "#1c3d22" }} />
              <div className="flex-1">
                <p className="text-sm font-black text-gray-900">Biomechanics Ability Score</p>
                <p className="text-xs text-gray-500">
                  {completedTests.length} of {TOTAL_TESTS} tests completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: "#1c3d22" }}>{overallScore}</p>
                <p className="text-xs font-bold text-gray-400">/ 100</p>
              </div>
            </div>

            {/* Per-test score bars */}
            <div className="space-y-2.5 mb-4">
              {completedTests.map((t) => {
                const sc   = states[t.id].score ?? 0;
                const tier = scoreTier(sc);
                return (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="text-base">{t.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <p className="text-xs font-bold text-gray-700">{t.name}</p>
                        <p className="text-xs font-black" style={{ color: "#1c3d22" }}>
                          {sc} — {tier.tier}
                        </p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${sc}%`, background: "#1c3d22" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall tier badge */}
            {(() => {
              const t = scoreTier(overallScore);
              return (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ background: t.bg }}>
                  <span className="text-xs font-black" style={{ color: t.color }}>
                    {t.tier} Athlete
                  </span>
                </div>
              );
            })()}

            {completedTests.length < TOTAL_TESTS && (
              <p className="text-xs text-gray-500 mb-3">
                Complete all {TOTAL_TESTS} tests for the most accurate score.
                Currently based on {completedTests.length} test{completedTests.length !== 1 ? "s" : ""}.
              </p>
            )}

            {user ? (
              <div className="flex gap-2">
                <button
                  onClick={saveToPassport}
                  disabled={saving || saved}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-60 transition"
                  style={{ background: "#1c3d22" }}
                >
                  {saving  ? <><RefreshCw size={12} className="animate-spin" /> Saving…</>
                   : saved ? <><CheckCircle2 size={12} /> Saved to Passport</>
                   :          "Save to Passport"}
                </button>
                <button
                  onClick={shareToArena}
                  disabled={arenaSharing || arenaPosted}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition border"
                  style={{
                    background:  arenaPosted ? "#f3f4f6" : "#fff",
                    color:       arenaPosted ? "#6b7280" : "#1c3d22",
                    borderColor: arenaPosted ? "#e5e7eb" : "#bbf7d0",
                  }}
                >
                  {arenaSharing  ? <><RefreshCw size={12} className="animate-spin" /> Posting…</>
                   : arenaPosted ? <><CheckCircle2 size={12} /> Posted!</>
                   :               <><Share2 size={12} /> Share to Arena</>}
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400">
                <Link href="/login" className="font-bold underline" style={{ color: "#1c3d22" }}>
                  Sign in
                </Link>{" "}
                to save your results and post to The Arena.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
