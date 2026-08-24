"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Plus, ChevronDown, ChevronUp, Loader2, CheckCircle2, X,
  Zap, Activity, Play,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { useYoyoPoseDetector } from "@/hooks/useYoyoPoseDetector";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PhysicalAttribute {
  id: string;
  code: string;
  display_name: string;
  category: string;
  measured_via: string;
  min_age_relevant: number | null;
}

interface AttributeStatus {
  attribute_id: string;
  code: string;
  display_name: string;
  category: string;
  current_percentile: number;
  trend: "improving" | "declining" | "plateau" | "stable";
  sessions_since_baseline: number;
  last_measured_at: string;
  plateau_flagged_at: string | null;
}

interface Measurement {
  id: string;
  attribute_id: string;
  raw_value: number;
  unit: string;
  percentile_at_capture: number;
  measured_at: string;
}

interface DrillItem {
  id: string;
  slug: string;
  name: string;
  difficulty: string;
  category: string;
}

interface WeeklyFocus {
  id: string;
  week_start: string;
  attribute: { id: string; code: string; display_name: string; category: string } | null;
  reason: string;
  drills: DrillItem[];
  outcome: "completed" | "partial" | "missed" | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

const CATEGORY_ORDER = [
  "speed", "endurance", "strength", "power",
  "agility", "flexibility", "balance", "coordination",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  speed:        { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  endurance:    { bg: "#dcfce7", text: "#14532d", border: "#86efac" },
  strength:     { bg: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" },
  power:        { bg: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  agility:      { bg: "#dbeafe", text: "#1e3a5f", border: "#93c5fd" },
  flexibility:  { bg: "#fce7f3", text: "#831843", border: "#f9a8d4" },
  balance:      { bg: "#ccfbf1", text: "#134e4a", border: "#5eead4" },
  coordination: { bg: "#f0fdf4", text: "#14532d", border: "#86efac" },
};

// ─── Yo-Yo IR1 Protocol ──────────────────────────────────────────────────────

const YOYO_PROTOCOL = [
  { level: 5,  speedKmh: 10.0, shuttles: 3 },
  { level: 6,  speedKmh: 10.5, shuttles: 3 },
  { level: 7,  speedKmh: 11.0, shuttles: 3 },
  { level: 8,  speedKmh: 11.5, shuttles: 3 },
  { level: 9,  speedKmh: 12.0, shuttles: 4 },
  { level: 10, speedKmh: 12.5, shuttles: 4 },
  { level: 11, speedKmh: 13.0, shuttles: 4 },
  { level: 12, speedKmh: 13.5, shuttles: 5 },
  { level: 13, speedKmh: 14.0, shuttles: 5 },
  { level: 14, speedKmh: 14.5, shuttles: 5 },
  { level: 15, speedKmh: 15.0, shuttles: 6 },
  { level: 16, speedKmh: 15.5, shuttles: 6 },
  { level: 17, speedKmh: 16.0, shuttles: 6 },
  { level: 18, speedKmh: 16.5, shuttles: 7 },
  { level: 19, speedKmh: 17.0, shuttles: 7 },
  { level: 20, speedKmh: 17.5, shuttles: 7 },
  { level: 21, speedKmh: 18.0, shuttles: 8 },
  { level: 22, speedKmh: 18.5, shuttles: 8 },
  { level: 23, speedKmh: 19.0, shuttles: 8 },
];

interface ShuttleEntry {
  level: number;
  shuttleNum: number;
  totalInLevel: number;
  globalShuttle: number;
  startTime: number;
  endTime: number;
  recoveryEnd: number;
}

const YOYO_SCHEDULE: ShuttleEntry[] = (() => {
  const entries: ShuttleEntry[] = [];
  let t = 0;
  let global = 0;
  for (const { level, speedKmh, shuttles } of YOYO_PROTOCOL) {
    const shuttleTime = 40 / (speedKmh / 3.6);
    for (let s = 0; s < shuttles; s++) {
      global++;
      entries.push({
        level, shuttleNum: s + 1, totalInLevel: shuttles,
        globalShuttle: global,
        startTime: t, endTime: t + shuttleTime, recoveryEnd: t + shuttleTime + 10,
      });
      t += shuttleTime + 10;
    }
  }
  return entries;
})();

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
}

function trendIcon(trend: AttributeStatus["trend"]) {
  switch (trend) {
    case "improving": return <TrendingUp className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />;
    case "declining": return <TrendingDown className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />;
    case "plateau":   return <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#d97706" }} />;
    default:          return <Minus className="h-3.5 w-3.5" style={{ color: "#6b7280" }} />;
  }
}

function trendLabel(trend: AttributeStatus["trend"]) {
  switch (trend) {
    case "improving": return "Improving";
    case "declining": return "Declining";
    case "plateau":   return "Plateau";
    default:          return "Stable";
  }
}

function trendColor(trend: AttributeStatus["trend"]) {
  switch (trend) {
    case "improving": return "#16a34a";
    case "declining": return "#dc2626";
    case "plateau":   return "#d97706";
    default:          return "#6b7280";
  }
}

function percentileLabel(p: number) {
  if (p >= 90) return "Elite";
  if (p >= 75) return "Advanced";
  if (p >= 50) return "Above avg";
  if (p >= 25) return "Developing";
  return "Beginner";
}

function percentileBarColor(p: number) {
  if (p >= 75) return "#16a34a";
  if (p >= 50) return "#f0b429";
  if (p >= 25) return "#f97316";
  return "#ef4444";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Weekly Focus Card ───────────────────────────────────────────────────────

function WeeklyFocusCard({
  focus,
  generating,
  onGenerate,
  onOutcome,
}: {
  focus: WeeklyFocus | null;
  generating: boolean;
  onGenerate: () => void;
  onOutcome: (outcome: "completed" | "partial" | "missed") => void;
}) {
  if (!focus) {
    return (
      <div
        className="rounded-2xl border p-5 mb-6"
        style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4" style={{ color: "#16a34a" }} />
          <span className="text-sm font-semibold" style={{ color: "#15803d" }}>This Week's Focus</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          No focus assigned yet. Let AI pick the attribute that will move the needle most this week.
        </p>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "#1a5c2a" }}
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {generating ? "Generating..." : "Generate My Focus"}
        </button>
      </div>
    );
  }

  const attr = focus.attribute;
  const cs = attr ? categoryStyle(attr.category) : categoryStyle("speed");

  return (
    <div
      className="rounded-2xl border p-5 mb-6"
      style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: "#16a34a" }} />
          <span className="text-sm font-semibold" style={{ color: "#15803d" }}>This Week's Focus</span>
        </div>
        {focus.outcome && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
            style={{
              background: focus.outcome === "completed" ? "#dcfce7" : focus.outcome === "partial" ? "#fef3c7" : "#fee2e2",
              color: focus.outcome === "completed" ? "#15803d" : focus.outcome === "partial" ? "#92400e" : "#991b1b",
            }}
          >
            {focus.outcome}
          </span>
        )}
      </div>

      {attr && (
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>{attr.display_name}</h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            style={{ background: cs.bg, color: cs.text }}
          >
            {attr.category}
          </span>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{focus.reason}</p>

      {focus.drills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned Drills</p>
          <div className="flex flex-col gap-1.5">
            {focus.drills.map((d) => (
              <Link
                key={d.id}
                href={`/player/drills`}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <Activity className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium text-gray-800">{d.name}</span>
                <span className="ml-auto text-xs text-gray-400 capitalize">{d.difficulty}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!focus.outcome && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How did it go?</p>
          <div className="flex gap-2">
            {(["completed", "partial", "missed"] as const).map((o) => (
              <button
                key={o}
                onClick={() => onOutcome(o)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors hover:bg-gray-50"
                style={{
                  borderColor: o === "completed" ? "#86efac" : o === "partial" ? "#fcd34d" : "#fca5a5",
                  color: o === "completed" ? "#15803d" : o === "partial" ? "#92400e" : "#991b1b",
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Yo-Yo IR1 Test Modal ────────────────────────────────────────────────────

function YoyoTestModal({
  status,
  onClose,
  onSaved,
}: {
  status: AttributeStatus;
  onClose: () => void;
  onSaved: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<"ready" | "playing" | "ended">("ready");
  const [currentEntry, setCurrentEntry] = useState<ShuttleEntry>(YOYO_SCHEDULE[0]);
  const [completedShuttles, setCompletedShuttles] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const missedRef = useRef<Set<number>>(new Set());
  const lastCompletedRef = useRef<number>(0);

  // ── Camera mode ─────────────────────────────────────────────────────────
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  // Ref mirrors cameraMode so rAF callbacks never read stale state
  const cameraModeRef = useRef(false);
  // Ref mirrors consecutiveMisses for camera callbacks (avoids stale closure)
  const consecutiveMissesRef = useRef(0);

  const getAudioTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  // Callbacks for the pose detector — stable refs, functional setState
  const handleShuttleCompletedCamera = useCallback((globalShuttle: number) => {
    if (missedRef.current.has(globalShuttle)) return;
    setCompletedShuttles((n) => n + 1);
    consecutiveMissesRef.current = 0;
    setConsecutiveMisses(0);
  }, []);

  const handleMissCamera = useCallback((globalShuttle: number) => {
    missedRef.current.add(globalShuttle);
    consecutiveMissesRef.current += 1;
    const next = consecutiveMissesRef.current;
    setConsecutiveMisses(next);
    if (next >= 2) {
      audioRef.current?.pause();
      setPhase("ended");
    }
  }, []);

  const { cameraVideoRef, start: startCamera, stop: stopCamera } = useYoyoPoseDetector({
    schedule: YOYO_SCHEDULE,
    getAudioTime,
    onShuttleCompleted: handleShuttleCompletedCamera,
    onMissDetected: handleMissCamera,
  });

  // ── Audio timeline sync ─────────────────────────────────────────────────
  // When cameraMode is active, camera is the sole source of truth —
  // skip the timeupdate auto-completion path.
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    let entry: ShuttleEntry | null = null;
    for (let i = YOYO_SCHEDULE.length - 1; i >= 0; i--) {
      if (YOYO_SCHEDULE[i].startTime <= t) { entry = YOYO_SCHEDULE[i]; break; }
    }
    if (!entry) return;
    setCurrentEntry(entry);
    // Camera mode: skip auto-completion (handled by pose detector)
    if (cameraModeRef.current) return;
    if (t >= entry.endTime && lastCompletedRef.current < entry.globalShuttle) {
      lastCompletedRef.current = entry.globalShuttle;
      if (!missedRef.current.has(entry.globalShuttle)) {
        setCompletedShuttles((n) => n + 1);
        setConsecutiveMisses(0);
      }
    }
  }, []);

  // Stop camera whenever the test ends (from any source)
  useEffect(() => {
    if (phase === "ended") stopCamera();
  }, [phase, stopCamera]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleToggleCamera = (on: boolean) => {
    setCameraMode(on);
    cameraModeRef.current = on;
    if (!on) setCameraError(false);
  };

  const handleStart = async () => {
    if (cameraMode) {
      setCameraStarting(true);
      const videoEl = cameraVideoRef.current;
      if (videoEl) {
        const ok = await startCamera(videoEl);
        if (!ok) {
          setCameraError(true);
          setCameraMode(false);
          cameraModeRef.current = false;
        }
      }
      setCameraStarting(false);
    }
    audioRef.current?.play();
    setPhase("playing");
  };

  const handleMiss = () => {
    if (phase !== "playing") return;
    missedRef.current.add(currentEntry.globalShuttle);
    consecutiveMissesRef.current += 1;
    const next = consecutiveMissesRef.current;
    setConsecutiveMisses(next);
    if (next >= 2) { audioRef.current?.pause(); setPhase("ended"); }
  };

  const handleEnd = () => { audioRef.current?.pause(); stopCamera(); setPhase("ended"); };

  const handleClose = () => { audioRef.current?.pause(); stopCamera(); onClose(); };

  const handleSave = async () => {
    const metres = completedShuttles * 40;
    setSaving(true); setError("");
    try {
      await api.post("/attribute-measurements", {
        attribute_id: status.attribute_id,
        raw_value: metres,
        unit: "metres",
        measured_at: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  const score = completedShuttles * 40;
  // Derive sprint vs recovery from currentEntry + live audio time
  const liveT = audioRef.current?.currentTime ?? 0;
  const inSprint = phase === "playing" && liveT >= currentEntry.startTime && liveT < currentEntry.endTime;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: "#1a5c2a" }}>
          <div>
            <p className="font-bold text-white text-base">Yo-Yo IR Level 1</p>
            <p className="text-xs text-green-200">Aerobic endurance test</p>
          </div>
          <button onClick={handleClose}
            className="rounded-full p-1.5 hover:bg-white/20 transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src="/audio/yoyo_ir1.mp3"
          onTimeUpdate={handleTimeUpdate} onEnded={() => setPhase("ended")} preload="auto" />

        {/* Camera video element — always mounted so cameraVideoRef is valid before start() */}
        <div style={{ display: phase === "playing" && cameraMode && !cameraError ? "block" : "none" }}>
          <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
            <video ref={cameraVideoRef} autoPlay playsInline muted
              className="w-full h-full object-cover" />
            {/* Zone labels */}
            <div className="absolute inset-x-0 bottom-0 flex justify-between px-3 pb-2">
              {(["A — 0 m", "B — 20 m"] as const).map((label) => (
                <span key={label}
                  className="rounded px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  {label}
                </span>
              ))}
            </div>
            {/* Phase badge */}
            <div className="absolute top-2 right-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                style={{ background: inSprint ? "#1a5c2a" : "#6b7280" }}>
                {inSprint ? "SPRINT" : "RECOVERY"}
              </span>
            </div>
            {/* Detection note */}
            <div className="absolute top-2 left-2">
              <span className="rounded px-2 py-0.5 text-xs text-white"
                style={{ background: "rgba(0,0,0,0.45)" }}>
                AI detecting
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* ── Ready phase ─────────────────────────────────────────────── */}
          {phase === "ready" && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Run 40 m shuttles (A→B→A) in time with the beeps.
                  Test ends after 2 consecutive misses.
                </p>
                <p className="text-xs text-gray-400 mt-1">Score = completed shuttles × 40 m</p>
              </div>

              {/* Camera toggle */}
              <div className="rounded-xl border p-3" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">AI camera detection</p>
                    <p className="text-xs text-gray-500">Auto-detects misses via your phone camera</p>
                  </div>
                  <button
                    onClick={() => handleToggleCamera(!cameraMode)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{ background: cameraMode ? "#1a5c2a" : "#d1d5db" }}
                    role="switch"
                    aria-checked={cameraMode}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: cameraMode ? "translateX(1.375rem)" : "translateX(0.125rem)" }}
                    />
                  </button>
                </div>
                {cameraMode && (
                  <p className="text-xs mt-2 rounded-lg px-2.5 py-2"
                    style={{ background: "#f0fdf4", color: "#15803d" }}>
                    Position camera face-on, wide enough so zones A (0 m), B (20 m) and the recovery area are all visible.
                  </p>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={cameraStarting}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "#1a5c2a", opacity: cameraStarting ? 0.7 : 1 }}>
                {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {cameraStarting ? "Starting camera..." : "Start Test"}
              </button>
            </div>
          )}

          {/* ── Playing phase ────────────────────────────────────────────── */}
          {phase === "playing" && (
            <div className="flex flex-col gap-4">
              {/* Stats row */}
              <div className="flex items-center justify-between">
                <div className="rounded-lg px-3 py-2" style={{ background: "#dcfce7" }}>
                  <p className="text-xs text-green-700 font-semibold">LEVEL</p>
                  <p className="text-2xl font-bold" style={{ color: "#1a5c2a" }}>{currentEntry.level}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-semibold">SHUTTLE</p>
                  <p className="text-xl font-bold text-gray-800">
                    {currentEntry.shuttleNum} / {currentEntry.totalInLevel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-semibold">DISTANCE</p>
                  <p className="text-xl font-bold" style={{ color: "#1a5c2a" }}>{score} m</p>
                </div>
              </div>

              {/* Miss warning */}
              {consecutiveMisses > 0 && (
                <div className="rounded-lg px-3 py-2 text-center text-sm font-semibold"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}>
                  {consecutiveMisses === 1
                    ? "⚠️ 1 miss — one more ends the test"
                    : "Test ending..."}
                </div>
              )}

              {/* Camera error fallback notice */}
              {cameraError && (
                <div className="rounded-lg px-3 py-1.5 text-xs text-center"
                  style={{ background: "#fef3c7", color: "#92400e" }}>
                  Camera unavailable — tap Miss manually
                </div>
              )}

              {/* Miss button: shown in manual mode OR when camera errored */}
              {(!cameraMode || cameraError) && (
                <button onClick={handleMiss}
                  className="w-full rounded-xl py-4 text-lg font-bold text-white active:scale-95 transition-transform"
                  style={{ background: "#dc2626" }}>
                  Miss
                </button>
              )}

              {/* Camera active — no miss button needed */}
              {cameraMode && !cameraError && (
                <div className="rounded-lg px-3 py-2 text-center text-xs text-gray-500"
                  style={{ background: "#f9fafb" }}>
                  AI is counting misses automatically
                </div>
              )}

              <button onClick={handleEnd}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors text-center">
                End test early
              </button>
            </div>
          )}

          {/* ── Ended phase ──────────────────────────────────────────────── */}
          {phase === "ended" && (
            saved ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle2 className="h-10 w-10" style={{ color: "#16a34a" }} />
                <p className="font-semibold text-gray-800">Saved!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl p-4 text-center"
                  style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
                  <p className="text-xs text-gray-500 mb-1">Final Score</p>
                  <p className="text-4xl font-bold" style={{ color: "#1a5c2a" }}>{score} m</p>
                  <p className="text-xs text-gray-400 mt-1">{completedShuttles} shuttles completed</p>
                </div>
                {error && <p className="text-xs text-red-600 text-center">{error}</p>}
                <button onClick={handleSave} disabled={saving}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#1a5c2a", opacity: saving ? 0.7 : 1 }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Result
                </button>
                <button onClick={onClose}
                  className="text-xs text-gray-400 hover:text-gray-600 text-center">
                  Discard
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Attribute Card ──────────────────────────────────────────────────────────

function AttributeCard({
  status,
  onLogClick,
  onRunTest,
}: {
  status: AttributeStatus;
  onLogClick: (attr: AttributeStatus) => void;
  onRunTest?: (attr: AttributeStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<Measurement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const cs = categoryStyle(status.category);

  const loadHistory = useCallback(async () => {
    if (history.length > 0) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/player/attribute-measurements/${status.attribute_id}`);
      const raw = res.data?.data ?? res.data;
      setHistory(safeArray<Measurement>(raw));
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  }, [status.attribute_id, history.length]);

  const handleExpand = () => {
    if (!expanded) loadHistory();
    setExpanded((e) => !e);
  };

  const pct = Math.max(0, Math.min(100, status.current_percentile));
  const barColor = percentileBarColor(pct);

  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{status.display_name}</p>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize mt-0.5"
              style={{ background: cs.bg, color: cs.text }}
            >
              {status.category}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-2 mt-0.5">
            {trendIcon(status.trend)}
            <span className="text-xs font-medium" style={{ color: trendColor(status.trend) }}>
              {trendLabel(status.trend)}
            </span>
          </div>
        </div>

        {/* Percentile bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Percentile</span>
            <span className="font-semibold" style={{ color: barColor }}>{pct}% — {percentileLabel(pct)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{status.sessions_since_baseline} session{status.sessions_since_baseline !== 1 ? "s" : ""} logged</span>
          <span>{timeAgo(status.last_measured_at)}</span>
        </div>

        {/* Plateau warning */}
        {status.trend === "plateau" && (
          <div
            className="mt-2 rounded-lg px-2.5 py-1.5 text-xs"
            style={{ background: "#fef3c7", color: "#92400e" }}
          >
            Plateaued for {status.sessions_since_baseline} sessions — this week's focus may help.
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex border-t"
        style={{ borderColor: "#f3f4f6" }}
      >
        <button
          onClick={() => onLogClick(status)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:bg-gray-50"
          style={{ color: "#1a5c2a" }}
        >
          <Plus className="h-3.5 w-3.5" /> Log
        </button>
        {onRunTest && (
          <>
            <div className="w-px" style={{ background: "#f3f4f6" }} />
            <button
              onClick={() => onRunTest(status)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:bg-gray-50"
              style={{ color: "#0369a1" }}
            >
              <Play className="h-3.5 w-3.5" /> Run Test
            </button>
          </>
        )}
        <div className="w-px" style={{ background: "#f3f4f6" }} />
        <button
          onClick={handleExpand}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:bg-gray-50 text-gray-500"
        >
          History {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* History panel */}
      {expanded && (
        <div className="border-t px-4 py-3" style={{ borderColor: "#f3f4f6", background: "#fafafa" }}>
          {loadingHistory ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading history...
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No measurements recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{new Date(m.measured_at).toLocaleDateString()}</span>
                  <span className="font-semibold text-gray-800">
                    {m.raw_value} <span className="font-normal text-gray-400">{m.unit}</span>
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: percentileBarColor(m.percentile_at_capture) + "22",
                      color: percentileBarColor(m.percentile_at_capture),
                    }}
                  >
                    p{m.percentile_at_capture}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Log Measurement Modal ───────────────────────────────────────────────────

function LogMeasurementModal({
  catalogue,
  preselected,
  onClose,
  onSaved,
}: {
  catalogue: PhysicalAttribute[];
  preselected: AttributeStatus | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [attributeId, setAttributeId] = useState(preselected?.attribute_id ?? "");
  const [rawValue, setRawValue] = useState("");
  const [unit, setUnit] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Infer unit from attribute code
  const selectedAttr = catalogue.find((a) => a.id === attributeId);

  const UNIT_HINTS: Record<string, string> = {
    sprint_10m: "seconds", sprint_30m: "seconds", sprint_40m: "seconds",
    max_sprint_speed_kmh: "km/h", reaction_time: "ms",
    beep_test_level: "level", vo2max_est: "ml/kg/min", yo_yo_test_distance: "m",
    aerobic_endurance: "metres",
    recovery_heart_rate: "bpm", continuous_run_12min_m: "m",
    push_ups_60s: "reps", squat_reps_60s: "reps", plank_hold_seconds: "s",
    grip_strength_kg: "kg", pull_ups: "reps",
    vertical_jump_cm: "cm", broad_jump_cm: "cm", medicine_ball_throw_m: "m",
    illinois_agility_seconds: "s", t_test_seconds: "s", "505_agility_seconds": "s",
    lateral_shuffle_5m: "s",
    sit_and_reach_cm: "cm", hip_flexor_range_deg: "°", shoulder_mobility_cm: "cm",
    single_leg_hold_seconds: "s", y_balance_composite: "%",
    juggling_touches_per_min: "touches", wall_ball_control_60s: "touches",
  };

  useEffect(() => {
    if (selectedAttr && UNIT_HINTS[selectedAttr.code]) {
      setUnit(UNIT_HINTS[selectedAttr.code]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttr?.code]);

  const handleSubmit = async () => {
    if (!attributeId || !rawValue || !unit) {
      setError("Please fill in attribute, value, and unit.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/attribute-measurements", {
        attribute_id: attributeId,
        raw_value: parseFloat(rawValue),
        unit,
        measured_at: measuredAt || undefined,
      });
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Log a Measurement</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-10 w-10" style={{ color: "#16a34a" }} />
            <p className="font-semibold text-gray-800">Measurement saved!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Attribute selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Attribute *</label>
              <select
                value={attributeId}
                onChange={(e) => setAttributeId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select an attribute...</option>
                {CATEGORY_ORDER.map((cat) => {
                  const attrs = catalogue.filter((a) => a.category === cat);
                  if (!attrs.length) return null;
                  return (
                    <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                      {attrs.map((a) => (
                        <option key={a.id} value={a.id}>{a.display_name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            {/* Value + unit row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Value *</label>
                <input
                  type="number"
                  step="any"
                  value={rawValue}
                  onChange={(e) => setRawValue(e.target.value)}
                  placeholder="e.g. 3.82"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit *</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. seconds"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Optional date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date (optional — defaults to today)</label>
              <input
                type="date"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 rounded-lg bg-red-50 px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: "#1a5c2a" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Measurement"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlayerAttributesPage() {
  const user = useAuthStore((s) => s.user);

  const [statuses, setStatuses] = useState<AttributeStatus[]>([]);
  const [catalogue, setCatalogue] = useState<PhysicalAttribute[]>([]);
  const [focus, setFocus] = useState<WeeklyFocus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [preselected, setPreselected] = useState<AttributeStatus | null>(null);
  const [yoyoTestStatus, setYoyoTestStatus] = useState<AttributeStatus | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, catRes, focusRes] = await Promise.allSettled([
        api.get("/player/attribute-status"),
        api.get("/physical-attributes"),
        api.get("/weekly-focus"),
      ]);

      if (statusRes.status === "fulfilled") {
        const raw = statusRes.value.data?.data ?? statusRes.value.data;
        setStatuses(safeArray<AttributeStatus>(raw));
      }
      if (catRes.status === "fulfilled") {
        const raw = catRes.value.data?.data ?? catRes.value.data;
        setCatalogue(safeArray<PhysicalAttribute>(raw));
      }
      if (focusRes.status === "fulfilled") {
        const raw = focusRes.value.data?.data ?? focusRes.value.data;
        setFocus(raw ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/weekly-focus/generate", {});
      const raw = res.data?.data ?? res.data;
      setFocus(raw ?? null);
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const handleOutcome = async (outcome: "completed" | "partial" | "missed") => {
    if (!focus) return;
    try {
      await api.patch(`/weekly-focus/${focus.id}/outcome`, { outcome });
      setFocus((f) => f ? { ...f, outcome } : f);
    } catch {
      // silently fail
    }
  };

  const handleLogClick = (status: AttributeStatus) => {
    setPreselected(status);
    setShowModal(true);
  };

  const handleModalSaved = () => {
    loadData();
  };

  // Derive categories present in statuses
  const presentCategories = Array.from(new Set(statuses.map((s) => s.category)));
  const sortedCategories = CATEGORY_ORDER.filter((c) => presentCategories.includes(c));

  const filtered = activeCategory === "all"
    ? statuses
    : statuses.filter((s) => s.category === activeCategory);

  // Summary stats
  const avgPercentile = statuses.length
    ? Math.round(statuses.reduce((sum, s) => sum + s.current_percentile, 0) / statuses.length)
    : 0;
  const plateauCount = statuses.filter((s) => s.trend === "plateau").length;
  const improvingCount = statuses.filter((s) => s.trend === "improving").length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: "#f4f2ee" }}>
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <Link
              href="/player"
              className="rounded-lg p-1.5 hover:bg-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Physical Attributes</h1>
              <p className="text-sm text-gray-500">
                {user?.first_name ? `${user.first_name}'s` : "Your"} performance dashboard
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading your attributes...</span>
            </div>
          ) : (
            <>
              {/* Weekly Focus */}
              <WeeklyFocusCard
                focus={focus}
                generating={generating}
                onGenerate={handleGenerate}
                onOutcome={handleOutcome}
              />

              {/* Summary tiles */}
              {statuses.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
                    <p className="text-2xl font-bold" style={{ color: "#1a5c2a" }}>{statuses.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Attributes tracked</p>
                  </div>
                  <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
                    <p className="text-2xl font-bold" style={{ color: "#f0b429" }}>{avgPercentile}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Avg percentile</p>
                  </div>
                  <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e7eb" }}>
                    <p className="text-2xl font-bold" style={{ color: plateauCount > 0 ? "#d97706" : "#16a34a" }}>
                      {plateauCount > 0 ? plateauCount : improvingCount}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {plateauCount > 0 ? "Plateaued" : "Improving"}
                    </p>
                  </div>
                </div>
              )}

              {/* Log button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setPreselected(null); setShowModal(true); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ background: "#1a5c2a" }}
                >
                  <Plus className="h-4 w-4" /> Log Measurement
                </button>
              </div>

              {/* Empty state */}
              {statuses.length === 0 && (
                <div className="rounded-2xl bg-white border p-8 text-center" style={{ borderColor: "#e5e7eb" }}>
                  <Activity className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <h3 className="font-semibold text-gray-800 mb-1">No measurements yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Log your first measurement to start tracking your physical development.
                  </p>
                  <button
                    onClick={() => { setPreselected(null); setShowModal(true); }}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{ background: "#1a5c2a" }}
                  >
                    Log First Measurement
                  </button>
                </div>
              )}

              {/* Category filter tabs */}
              {statuses.length > 0 && sortedCategories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{
                      background: activeCategory === "all" ? "#1a5c2a" : "white",
                      color: activeCategory === "all" ? "white" : "#374151",
                      border: `1px solid ${activeCategory === "all" ? "#1a5c2a" : "#e5e7eb"}`,
                    }}
                  >
                    All ({statuses.length})
                  </button>
                  {sortedCategories.map((cat) => {
                    const count = statuses.filter((s) => s.category === cat).length;
                    const cs = categoryStyle(cat);
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
                        style={{
                          background: isActive ? cs.text : "white",
                          color: isActive ? "white" : cs.text,
                          border: `1px solid ${isActive ? cs.text : cs.border}`,
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Attribute cards grid */}
              {filtered.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((s) => (
                    <AttributeCard
                      key={s.attribute_id}
                      status={s}
                      onLogClick={handleLogClick}
                      onRunTest={s.code === "aerobic_endurance" ? (attr) => setYoyoTestStatus(attr) : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Log Measurement Modal */}
      {showModal && (
        <LogMeasurementModal
          catalogue={catalogue}
          preselected={preselected}
          onClose={() => { setShowModal(false); setPreselected(null); }}
          onSaved={handleModalSaved}
        />
      )}

      {/* Yo-Yo IR1 Test Modal */}
      {yoyoTestStatus && (
        <YoyoTestModal
          status={yoyoTestStatus}
          onClose={() => setYoyoTestStatus(null)}
          onSaved={() => { setYoyoTestStatus(null); loadData(); }}
        />
      )}
    </div>
  );
}
