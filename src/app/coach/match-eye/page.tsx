"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, CheckCircle2, AlertTriangle, Eye,
  BookOpen, Clock, Target, Shield, Zap, Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { measureFromVideo, type VideoMeasurement } from "@/lib/super-engine";
import { compressVideo } from "@/lib/compress-video";
import { uploadVideoInChunks } from "@/lib/upload-chunks";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrackedPlayer {
  jersey: string;
  name: string;
  position: string;
}

interface MatchEvent {
  time: string;
  team: "home" | "away" | "neutral";
  type: string;
  description: string;
}

interface MatchAnalysis {
  formation_home: string;
  formation_away: string;
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  shots_on_target_home: number;
  shots_on_target_away: number;
  fouls_detected: number;
  key_events: MatchEvent[];
  tactical_patterns: string[];
  defensive_issues: string[];
  attacking_strengths: string[];
  man_of_match_candidate: string;
  halftime_recommendation: string;
  key_coaching_points: string[];
  player_tracking?: Array<{
    jersey: string;
    name: string;
    position_tendency: string;
    key_moments: string[];
    rating: number;
    improvement: string;
  }>;
}

interface HalfResult {
  analysis: MatchAnalysis;
  narrative: string;
}

interface HalfUploadState {
  stage: "idle" | "compressing" | "uploading" | "uploaded" | "error";
  pct: number;
  fileUri: string;
  fileName: string;
  mimeType: string;
  error: string;
}

type PageStage = "setup" | "analysing" | "results" | "error";

const SPORTS = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Hockey"];

type SessionType = "match" | "drill";

const DRILL_TYPES = [
  "Rondo",
  "Defence vs Strikers",
  "Attack vs Defence",
  "Small-Sided Game",
  "Finishing Drill",
  "Passing Patterns",
  "Pressing Drill",
  "Set Pieces",
  "Free / Other",
];

interface DrillObservation {
  identifier: string;
  observation: string;
  fix: string;
}

interface DrillAnalysis {
  drill_type: string;
  duration_observed: string;
  intensity_rating: number;
  player_count?: number;
  key_observations: string[];
  individual_feedback: DrillObservation[];
  technical_issues: string[];
  positives: string[];
  coaching_points: string[];
  drill_progression: string;
}

interface DrillResult {
  analysis: DrillAnalysis;
  narrative: string;
}

const initHalf = (): HalfUploadState => ({
  stage: "idle", pct: 0, fileUri: "", fileName: "", mimeType: "", error: "",
});

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MatchEyePage() {
  const token = useAuthStore((s) => s.token);

  // Session type
  const [sessionType, setSessionType] = useState<SessionType>("match");

  // Match details
  const [homeTeam,       setHomeTeam]       = useState("");
  const [awayTeam,       setAwayTeam]       = useState("");
  const [competition,    setCompetition]    = useState("");
  const [sport,          setSport]          = useState("Football");
  const [trackedPlayers, setTrackedPlayers] = useState<TrackedPlayer[]>([{ jersey: "", name: "", position: "" }]);

  // Drill details
  const [drillType,  setDrillType]  = useState("Rondo");
  const [drillFocus, setDrillFocus] = useState("");

  // Page flow
  const [pageStage,   setPageStage]   = useState<PageStage>("setup");
  const [activeTab,   setActiveTab]   = useState<"first" | "second" | "summary">("first");
  const [globalError, setGlobalError] = useState("");

  // Half upload states
  const [firstHalf,  setFirstHalf]  = useState<HalfUploadState>(initHalf());
  const [secondHalf, setSecondHalf] = useState<HalfUploadState>(initHalf());

  // Results
  const [firstResult,  setFirstResult]  = useState<HalfResult | null>(null);
  const [secondResult, setSecondResult] = useState<HalfResult | null>(null);
  const [drillResult,  setDrillResult]  = useState<DrillResult | null>(null);

  // Super Engine local tracking (YOLOv8 ball + player detection in browser)
  const [firstTracking,  setFirstTracking]  = useState<VideoMeasurement | null>(null);
  const [secondTracking, setSecondTracking] = useState<VideoMeasurement | null>(null);

  // File inputs
  const firstRef  = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);

  // ── Upload one half directly to Gemini ──────────────────────────────────────

  const uploadHalf = useCallback(async (file: File, which: "first" | "second") => {
    const setH = which === "first" ? setFirstHalf : setSecondHalf;
    const setT = which === "first" ? setFirstTracking : setSecondTracking;

    // Run Super Engine ball+player tracking in the browser in parallel with compression+upload.
    measureFromVideo(file, "team", () => undefined).then(setT).catch(() => undefined);

    // Step 1 — compress to 720p H.264 in the browser (skipped if file < 50 MB)
    setH((h) => ({ ...h, stage: "compressing", pct: 0, error: "" }));
    const fileToUpload = await compressVideo(file, (pct) => {
      setH((h) => ({ ...h, pct }));
    });

    // Step 2 — POST compressed file to our Next.js proxy, which streams it to Google server-to-server.
    // A direct browser → Google PUT is blocked by CORS (Google does not set
    // Access-Control-Allow-Origin on the Gemini Files API upload endpoint).
    // XHR is used so we can track upload progress.
    setH((h) => ({ ...h, stage: "uploading", pct: 0 }));
    try {
      const data = await uploadVideoInChunks(
        fileToUpload,
        (pct) => setH((h) => ({ ...h, pct })),
      );
      setH((h) => ({ ...h, stage: "uploaded", pct: 100, fileUri: data.fileUri, fileName: data.fileName, mimeType: data.mimeType }));
    } catch (err) {
      setH((h) => ({ ...h, stage: "error", error: err instanceof Error ? err.message : "Upload failed" }));
    }
  }, []);

  // ── Analyse ─────────────────────────────────────────────────────────────────

  const analyse = useCallback(async () => {
    setPageStage("analysing");
    setGlobalError("");

    // ── Drill mode: single video ─────────────────────────────────────────────
    if (sessionType === "drill") {
      if (firstHalf.stage !== "uploaded") return;
      try {
        const res = await fetch("/api/match-eye/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUri:        firstHalf.fileUri,
            fileName:       firstHalf.fileName,
            mimeType:       firstHalf.mimeType,
            sessionType:    "drill",
            drillType,
            drillFocus,
            sport,
            trackedPlayers: trackedPlayers.filter((p) => p.jersey || p.name),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `Analysis failed (${res.status})`);
        }
        setDrillResult(await res.json() as DrillResult);
        setPageStage("results");
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
        setPageStage("error");
      }
      return;
    }

    // ── Match mode: two halves in parallel ───────────────────────────────────
    if (firstHalf.stage !== "uploaded" || secondHalf.stage !== "uploaded") return;

    const analyseHalf = async (half: HalfUploadState, label: string): Promise<HalfResult> => {
      const res = await fetch("/api/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri:        half.fileUri,
          fileName:       half.fileName,
          mimeType:       half.mimeType,
          sessionType:    "match",
          homeTeam,
          awayTeam,
          competition:    competition ? `${competition} — ${label}` : label,
          sport,
          trackedPlayers: trackedPlayers.filter((p) => p.jersey || p.name),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Analysis failed (${res.status})`);
      }
      return res.json() as Promise<HalfResult>;
    };

    try {
      const [first, second] = await Promise.all([
        analyseHalf(firstHalf, "First Half"),
        analyseHalf(secondHalf, "Second Half"),
      ]);
      setFirstResult(first);
      setSecondResult(second);
      setPageStage("results");
      setActiveTab("first");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setPageStage("error");
    }
  }, [sessionType, firstHalf, secondHalf, homeTeam, awayTeam, competition, sport, drillType, drillFocus, trackedPlayers]);

  const reset = () => {
    setPageStage("setup");
    setFirstHalf(initHalf());
    setSecondHalf(initHalf());
    setFirstResult(null);
    setSecondResult(null);
    setDrillResult(null);
    setFirstTracking(null);
    setSecondTracking(null);
    setGlobalError("");
    setHomeTeam("");
    setAwayTeam("");
    setCompetition("");
    setSport("Football");
    setDrillType("Rondo");
    setDrillFocus("");
    setTrackedPlayers([{ jersey: "", name: "", position: "" }]);
  };

  // ── Sub-components ───────────────────────────────────────────────────────────

  function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1a5c2a" }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
      </div>
    );
  }

  // Shows upload progress with estimated time remaining
  function UploadProgress({ pct }: { pct: number }) {
    const startRef = useRef<{ time: number; pct: number } | null>(null);
    const [eta, setEta] = useState<string>("");

    // On first render (pct may already be > 0), record baseline
    if (!startRef.current && pct > 0) {
      startRef.current = { time: Date.now(), pct };
    }

    // Recalculate ETA whenever pct changes
    const pctRef = useRef(pct);
    pctRef.current = pct;
    if (startRef.current && pct > startRef.current.pct) {
      const elapsed = (Date.now() - startRef.current.time) / 1000;
      const done = pct - startRef.current.pct;
      const remaining = 100 - pct;
      const secsLeft = (elapsed / done) * remaining;
      if (secsLeft > 1 && secsLeft < 600) {
        const m = Math.floor(secsLeft / 60);
        const s = Math.round(secsLeft % 60);
        setEta(m > 0 ? `~${m}m ${s}s remaining` : `~${s}s remaining`);
      }
    }

    return (
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "20px 16px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a5c2a" }}>Uploading... {pct}%</div>
          {eta && <div style={{ fontSize: 11, color: "#9ca3af" }}>{eta}</div>}
        </div>
        <div style={{ background: "#e5e7eb", borderRadius: 99, height: 5 }}>
          <div style={{ background: "#1a5c2a", borderRadius: 99, height: 5, width: `${pct}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Sending to Google for AI analysis</div>
      </div>
    );
  }

  function UploadZone({
    label, half, inputRef, onChange,
  }: {
    label: string;
    half: HalfUploadState;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (f: File) => void;
  }) {
    return (
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8 }}>{label}</div>

        {(half.stage === "idle" || half.stage === "error") && (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              border: half.stage === "error" ? "2px dashed #ef4444" : "2px dashed #d1d5db",
              borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer",
              background: "#fafafa",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1a5c2a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = half.stage === "error" ? "#ef4444" : "#d1d5db"; }}
          >
            <Upload size={26} style={{ color: "#9ca3af", marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Click to upload</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>MP4, MOV, AVI — any size</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Tip: record at 720p for fastest upload</div>
            {half.error && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>{half.error}</div>}
          </div>
        )}

        {half.stage === "compressing" && (
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "20px 16px", background: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a5c2a", marginBottom: 8 }}>
              Preparing video... {half.pct > 0 ? `${half.pct}%` : ""}
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 99, height: 5, overflow: "hidden" }}>
              {half.pct > 0
                ? <div style={{ background: "#1a5c2a", borderRadius: 99, height: 5, width: `${half.pct}%`, transition: "width 0.3s" }} />
                : <div style={{ background: "#1a5c2a", borderRadius: 99, height: 5, width: "40%", animation: "pulse 1.2s ease-in-out infinite" }} />
              }
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Compressing to 720p — makes upload 5–10× faster</div>
          </div>
        )}

        {half.stage === "uploading" && (
          <UploadProgress pct={half.pct} />
        )}

        {half.stage === "uploaded" && (
          <div style={{ border: "2px solid #bbf7d0", borderRadius: 12, padding: "18px 16px", background: "#f0fdf4", display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Uploaded</div>
              <div style={{ fontSize: 11, color: "#555" }}>Ready for Gemini analysis</div>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      </div>
    );
  }

  // ── Per-player analysis cards (from Gemini player tracking) ─────────────────
  function PlayerTrackingCards({ players }: { players: NonNullable<MatchAnalysis["player_tracking"]> }) {
    if (!players.length) return null;
    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 14 }}>
          Player Tracking — {players.length} player{players.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {players.map((pl, i) => (
            <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "#1a5c2a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0,
                }}>
                  #{pl.jersey}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{pl.name || `Player #${pl.jersey}`}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{pl.position_tendency}</div>
                </div>
                {/* Rating badge */}
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0, display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center",
                  background: pl.rating >= 8 ? "#dcfce7" : pl.rating >= 6 ? "#fef9c3" : "#fee2e2",
                }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: pl.rating >= 8 ? "#15803d" : pl.rating >= 6 ? "#92400e" : "#dc2626", lineHeight: 1 }}>
                    {pl.rating}
                  </div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>/10</div>
                </div>
              </div>

              {pl.key_moments?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>Key Moments</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {pl.key_moments.map((m, j) => (
                      <div key={j} style={{ fontSize: 13, color: "#374151", paddingLeft: 10, borderLeft: "2px solid #e5e7eb" }}>{m}</div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e" }}>
                <strong>Improve:</strong> {pl.improvement}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Ball Zone Activity panel (from local YOLOv8 tracking) ─────────────────
  function TrackingPanel({ tracking }: { tracking: VideoMeasurement }) {
    if (!tracking.ballTrajectory?.length && !tracking.playersInFrame) return null;

    // Map ball x-positions (0–640 canvas) into 3 horizontal zones
    const zones = [0, 0, 0]; // left / centre / right
    for (const pt of tracking.ballTrajectory ?? []) {
      const z = pt.x < 213 ? 0 : pt.x < 427 ? 1 : 2;
      zones[z]++;
    }
    const maxZ = Math.max(...zones, 1);
    const zoneLabels = ["Left Third", "Centre", "Right Third"];
    const zoneColors = ["#3b82f6", "#1a5c2a", "#3b82f6"];

    // 3×2 grid heatmap from playerHeatmap (if Python server was running)
    const hmap = tracking.playerHeatmap;

    return (
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Ball Zone Activity</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 99 }}>
            YOLOv8 · {tracking.ballTrajectory?.length ?? 0} frames
          </span>
        </div>

        {/* Zone bars */}
        <div style={{ display: "flex", gap: 8, marginBottom: hmap ? 14 : 0 }}>
          {zones.map((count, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: "4px 0", marginBottom: 4, height: 56, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{
                  width: "60%", borderRadius: "4px 4px 0 0",
                  height: `${Math.round((count / maxZ) * 100)}%`,
                  background: zoneColors[i], minHeight: 4,
                  transition: "height 0.3s",
                }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>{zoneLabels[i]}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{count} detections</div>
            </div>
          ))}
        </div>

        {/* Player heatmap grid (only when Python server provided it) */}
        {hmap && hmap.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 6 }}>Player Heatmap (ByteTrack)</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${hmap[0].length}, 1fr)`, gap: 2 }}>
              {hmap.map((row, ri) =>
                row.map((val, ci) => {
                  const intensity = Math.min(val / Math.max(...hmap.flat(), 1), 1);
                  return (
                    <div key={`${ri}-${ci}`} style={{
                      height: 14, borderRadius: 3,
                      background: `rgba(26,92,42,${0.1 + intensity * 0.9})`,
                    }} />
                  );
                })
              )}
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 9, color: "#9ca3af" }}>Low</span>
              {[0.15, 0.35, 0.6, 0.85, 1].map((o) => (
                <div key={o} style={{ width: 12, height: 8, borderRadius: 2, background: `rgba(26,92,42,${o})` }} />
              ))}
              <span style={{ fontSize: 9, color: "#9ca3af" }}>High</span>
            </div>
          </div>
        )}

        {tracking.playersInFrame != null && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
            Peak players detected: <strong style={{ color: "#1a1a1a" }}>{tracking.playersInFrame}</strong>
            {(tracking.enginesUsed ?? []).length > 0 && (
              <span style={{ marginLeft: 8 }}>· {tracking.enginesUsed.join(", ")}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Drill session results ─────────────────────────────────────────────────
  function DrillReport({ result, tracking }: { result: DrillResult; tracking: VideoMeasurement | null }) {
    const a = result.analysis;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Header stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
          <StatBox label="Drill Type"  value={a.drill_type || drillType} />
          <StatBox label="Intensity"   value={`${a.intensity_rating ?? "—"}/10`} />
          {a.duration_observed && <StatBox label="Duration" value={a.duration_observed} />}
          {a.player_count != null && <StatBox label="Players" value={String(a.player_count)} />}
        </div>

        {/* YOLOv8 tracking panel */}
        {tracking && <TrackingPanel tracking={tracking} />}

        {/* Narrative */}
        {result.narrative && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={15} style={{ color: "#1a5c2a" }} /> Session Report
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-line" }}>
              {result.narrative}
            </div>
          </div>
        )}

        {/* What's working */}
        {(a.positives?.length ?? 0) > 0 && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={13} style={{ color: "#16a34a" }} /> What&apos;s Working
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.positives.map((p, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Key observations */}
        {(a.key_observations?.length ?? 0) > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={13} style={{ color: "#2563eb" }} /> Key Observations
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.key_observations.map((o, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{o}</li>)}
            </ul>
          </div>
        )}

        {/* Technical issues + next progression */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {(a.technical_issues?.length ?? 0) > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={13} style={{ color: "#dc2626" }} /> Technical Issues
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {a.technical_issues.map((t, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{t}</li>)}
              </ul>
            </div>
          )}
          {a.drill_progression && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1e40af", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Target size={13} style={{ color: "#2563eb" }} /> Next Progression
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{a.drill_progression}</div>
            </div>
          )}
        </div>

        {/* Individual player feedback */}
        {(a.individual_feedback?.length ?? 0) > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 14 }}>
              Individual Feedback — {a.individual_feedback.length} player{a.individual_feedback.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.individual_feedback.map((pl, i) => (
                <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{pl.identifier}</div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>{pl.observation}</div>
                  <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400e" }}>
                    <strong>Fix:</strong> {pl.fix}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coaching points */}
        {(a.coaching_points?.length ?? 0) > 0 && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 8 }}>
              Coaching Points
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.coaching_points.map((p, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 5 }}>{p}</li>)}
            </ul>
          </div>
        )}

        <button
          onClick={reset}
          style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Analyse Another Session
        </button>
      </div>
    );
  }

  function HalfReport({ result, half, tracking }: { result: HalfResult; half: "first" | "second"; tracking: VideoMeasurement | null }) {
    const a = result.analysis;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
          <StatBox label="Home Formation"    value={a.formation_home || "—"} />
          <StatBox label="Away Formation"    value={a.formation_away || "—"} />
          <StatBox label="Possession (Home)" value={`${a.possession_home ?? "—"}%`} sub={`Away ${a.possession_away ?? "—"}%`} />
          <StatBox label="Shots (Home)"      value={String(a.shots_home ?? "—")}    sub={`On target: ${a.shots_on_target_home ?? "—"}`} />
          <StatBox label="Shots (Away)"      value={String(a.shots_away ?? "—")}    sub={`On target: ${a.shots_on_target_away ?? "—"}`} />
          <StatBox label="Fouls Detected"    value={String(a.fouls_detected ?? "—")} />
        </div>

        {/* Ball tracking panel (Super Engine — optional, appears when YOLOv8 fires) */}
        {tracking && <TrackingPanel tracking={tracking} />}

        {/* Narrative */}
        {result.narrative && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={15} style={{ color: "#1a5c2a" }} /> Tactical Report
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-line" }}>
              {result.narrative}
            </div>
          </div>
        )}

        {/* Key events */}
        {(a.key_events?.length ?? 0) > 0 && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={15} style={{ color: "#1a5c2a" }} /> Key Events
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.key_events.map((ev, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a", minWidth: 46, flexShrink: 0 }}>{ev.time}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                    background: ev.team === "home" ? "#dbeafe" : ev.team === "away" ? "#fee2e2" : "#f3f4f6",
                    color:      ev.team === "home" ? "#1d4ed8" : ev.team === "away" ? "#dc2626" : "#374151",
                  }}>
                    {ev.team === "home" ? homeTeam : ev.team === "away" ? awayTeam : "–"}
                  </span>
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    <strong>{ev.type}</strong> — {ev.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Three columns: tactical / defensive / attacking */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {(a.tactical_patterns?.length ?? 0) > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Target size={13} style={{ color: "#2563eb" }} /> Tactical Patterns
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {a.tactical_patterns.map((p, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{p}</li>)}
              </ul>
            </div>
          )}
          {(a.defensive_issues?.length ?? 0) > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={13} style={{ color: "#dc2626" }} /> Defensive Issues
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {a.defensive_issues.map((d, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{d}</li>)}
              </ul>
            </div>
          )}
          {(a.attacking_strengths?.length ?? 0) > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={13} style={{ color: "#d97706" }} /> Attacking Strengths
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {a.attacking_strengths.map((s, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Coaching points */}
        {(a.key_coaching_points?.length ?? 0) > 0 && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#15803d", marginBottom: 8 }}>
              Coaching Points for Next Training
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.key_coaching_points.map((p, i) => <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 5 }}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Per-player tracking cards */}
        {(a.player_tracking?.length ?? 0) > 0 && (
          <PlayerTrackingCards players={a.player_tracking!} />
        )}

        {/* Man of match + halftime rec */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {a.man_of_match_candidate && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Man of the Match
              </div>
              <div style={{ fontSize: 13, color: "#374151" }}>{a.man_of_match_candidate}</div>
            </div>
          )}
          {half === "first" && a.halftime_recommendation && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Halftime Recommendation
              </div>
              <div style={{ fontSize: 13, color: "#374151" }}>{a.halftime_recommendation}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const canAnalyse = sessionType === "drill"
    ? firstHalf.stage === "uploaded"
    : firstHalf.stage === "uploaded" && secondHalf.stage === "uploaded" && homeTeam && awayTeam;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link href="/coach" style={{ display: "flex", alignItems: "center", gap: 4, color: "#555", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Coach Hub
        </Link>
        <div style={{ width: 1, height: 20, background: "#e5e7eb" }} />
        <Eye size={18} style={{ color: "#1a5c2a" }} />
        <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>Match Eye</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: "#1a5c2a", color: "#fff", padding: "2px 10px", borderRadius: 99 }}>
          Gemini 2.5 Flash
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── SETUP & UPLOAD ──────────────────────────────────────────────────── */}
        {(pageStage === "setup") && (
          <>
            {/* Session type toggle */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>What are you analysing?</div>
              <div style={{ display: "flex", gap: 10 }}>
                {([
                  { value: "match" as SessionType, label: "Full Match", icon: <Eye size={16} />, sub: "Two halves, full game" },
                  { value: "drill" as SessionType, label: "Training Drill", icon: <Users size={16} />, sub: "Rondo, defence drills, etc." },
                ] as const).map(({ value, label, icon, sub }) => (
                  <button
                    key={value}
                    onClick={() => { setSessionType(value); setFirstHalf(initHalf()); setSecondHalf(initHalf()); }}
                    style={{
                      flex: 1, padding: "12px 16px", border: `2px solid ${sessionType === value ? "#1a5c2a" : "#e5e7eb"}`,
                      borderRadius: 10, cursor: "pointer", textAlign: "left",
                      background: sessionType === value ? "#f0fdf4" : "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ color: sessionType === value ? "#1a5c2a" : "#9ca3af" }}>{icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 14, color: sessionType === value ? "#1a5c2a" : "#374151" }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", paddingLeft: 24 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Details form — match or drill */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16 }}>
              {sessionType === "match" ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 16 }}>Match Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Home Team *</label>
                      <input
                        value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                        placeholder="e.g. Dynamos FC"
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Away Team *</label>
                      <input
                        value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                        placeholder="e.g. Highlanders FC"
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Competition</label>
                      <input
                        value={competition} onChange={(e) => setCompetition(e.target.value)}
                        placeholder="e.g. Premier League"
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Sport</label>
                      <select
                        value={sport} onChange={(e) => setSport(e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                      >
                        {SPORTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 16 }}>Drill Details</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Drill Type *</label>
                      <select
                        value={drillType} onChange={(e) => setDrillType(e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                      >
                        {DRILL_TYPES.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Sport</label>
                      <select
                        value={sport} onChange={(e) => setSport(e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}
                      >
                        {SPORTS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>
                      What should Gemini focus on? <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
                    </label>
                    <input
                      value={drillFocus} onChange={(e) => setDrillFocus(e.target.value)}
                      placeholder="e.g. press timing, first touch, defensive shape under pressure"
                      style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Players to Track */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Players to Track</div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Optional — Gemini will analyse each player specifically</span>
              </div>

              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr 32px", gap: 8, marginBottom: 6, marginTop: 12 }}>
                {["Jersey #", "Name", "Position", ""].map((h) => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
                ))}
              </div>

              {trackedPlayers.map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
                  <input
                    value={p.jersey}
                    onChange={(e) => {
                      const next = [...trackedPlayers];
                      next[i] = { ...next[i], jersey: e.target.value };
                      setTrackedPlayers(next);
                    }}
                    placeholder="#7"
                    style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 14, outline: "none" }}
                  />
                  <input
                    value={p.name}
                    onChange={(e) => {
                      const next = [...trackedPlayers];
                      next[i] = { ...next[i], name: e.target.value };
                      setTrackedPlayers(next);
                    }}
                    placeholder="Player name"
                    style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 14, outline: "none" }}
                  />
                  <input
                    value={p.position}
                    onChange={(e) => {
                      const next = [...trackedPlayers];
                      next[i] = { ...next[i], position: e.target.value };
                      setTrackedPlayers(next);
                    }}
                    placeholder="e.g. Striker"
                    style={{ border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "7px 10px", fontSize: 14, outline: "none" }}
                  />
                  <button
                    onClick={() => setTrackedPlayers(trackedPlayers.filter((_, j) => j !== i))}
                    style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, padding: 0, lineHeight: 1 }}
                    title="Remove"
                  >×</button>
                </div>
              ))}

              {trackedPlayers.length < 11 && (
                <button
                  onClick={() => setTrackedPlayers([...trackedPlayers, { jersey: "", name: "", position: "" }])}
                  style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#1a5c2a", background: "none", border: "1.5px dashed #bbf7d0", borderRadius: 8, padding: "7px 16px", cursor: "pointer", width: "100%" }}
                >
                  + Add Player
                </button>
              )}
            </div>

            {/* Upload zones */}
            {(sessionType === "drill" || (homeTeam && awayTeam)) && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16 }}>
                {sessionType === "drill" ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 4 }}>Upload Drill Video</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                      Upload your training clip. Goes directly to Google — no file size limit.
                    </div>
                    <UploadZone label="Drill Clip" half={firstHalf} inputRef={firstRef} onChange={(f) => uploadHalf(f, "first")} />
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 4 }}>Upload Match Footage</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                      Videos upload directly to Google — no file size limit. Upload both halves, then click Analyse.
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <UploadZone label="First Half (0–45 min)"   half={firstHalf}  inputRef={firstRef}  onChange={(f) => uploadHalf(f, "first")}  />
                      <UploadZone label="Second Half (45–90 min)" half={secondHalf} inputRef={secondRef} onChange={(f) => uploadHalf(f, "second")} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Analyse button */}
            {canAnalyse && (
              <button
                onClick={analyse}
                style={{
                  width: "100%", background: "#1a5c2a", color: "#fff", border: "none",
                  borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Eye size={18} /> {sessionType === "drill" ? `Analyse ${drillType} with Gemini AI` : "Analyse Full Match with Gemini AI"}
              </button>
            )}
          </>
        )}

        {/* ── ANALYSING ───────────────────────────────────────────────────────── */}
        {pageStage === "analysing" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "48px 24px", textAlign: "center" }}>
            <Eye size={44} style={{ color: "#1a5c2a", marginBottom: 16 }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 8 }}>
              {sessionType === "drill" ? "Gemini is watching the drill..." : "Gemini is watching the match..."}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 32, maxWidth: 380, margin: "0 auto 32px" }}>
              {sessionType === "drill"
                ? `${drillType} — Gemini is analysing player movement, technique, and coaching moments. This takes 1–3 minutes.`
                : `${homeTeam} vs ${awayTeam} — both halves are being analysed simultaneously. This takes 2–5 minutes.`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340, margin: "0 auto" }}>
              {(sessionType === "drill" ? ["Drill Clip"] : ["First Half", "Second Half"]).map((label) => (
                <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 9, height: 9, borderRadius: "50%", background: "#1a5c2a", flexShrink: 0,
                    animation: "matcheye-pulse 1.5s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af" }}>Analysing...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────────── */}
        {pageStage === "error" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #fee2e2", padding: "36px 24px", textAlign: "center" }}>
            <AlertTriangle size={36} style={{ color: "#dc2626", marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 8 }}>{globalError}</div>
            <button
              onClick={() => { setPageStage("setup"); setGlobalError(""); setFirstHalf(initHalf()); setSecondHalf(initHalf()); }}
              style={{ background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── DRILL RESULTS ───────────────────────────────────────────────────── */}
        {pageStage === "results" && sessionType === "drill" && drillResult && (
          <div>
            <div style={{
              background: "#1a5c2a", borderRadius: 14, padding: "16px 20px",
              marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {sport} — Training Session Analysis
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginTop: 2 }}>
                  {drillType}
                </div>
              </div>
              <Users size={28} style={{ color: "rgba(255,255,255,0.5)" }} />
            </div>
            <DrillReport result={drillResult} tracking={firstTracking} />
          </div>
        )}

        {/* ── MATCH RESULTS ───────────────────────────────────────────────────── */}
        {pageStage === "results" && sessionType === "match" && firstResult && secondResult && (
          <div>
            {/* Match banner */}
            <div style={{
              background: "#1a5c2a", borderRadius: 14, padding: "16px 20px",
              marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {competition || sport} — Full Match Analysis
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginTop: 2 }}>
                  {homeTeam} vs {awayTeam}
                </div>
              </div>
              <Eye size={28} style={{ color: "rgba(255,255,255,0.5)" }} />
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", marginBottom: 16 }}>
              {(["first", "second", "summary"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  flex: 1, padding: "9px 6px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: activeTab === t ? "#1a5c2a" : "transparent",
                  color:      activeTab === t ? "#fff" : "#6b7280",
                  transition: "background 0.15s",
                }}>
                  {t === "first" ? "First Half" : t === "second" ? "Second Half" : "Full Match"}
                </button>
              ))}
            </div>

            {activeTab === "first"  && <HalfReport result={firstResult}  half="first"  tracking={firstTracking}  />}
            {activeTab === "second" && <HalfReport result={secondResult} half="second" tracking={secondTracking} />}

            {activeTab === "summary" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Combined stats */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 14 }}>Full Match Stats</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
                    <StatBox label="Total Shots (Home)" value={String((firstResult.analysis.shots_home ?? 0) + (secondResult.analysis.shots_home ?? 0))} sub={`On target: ${(firstResult.analysis.shots_on_target_home ?? 0) + (secondResult.analysis.shots_on_target_home ?? 0)}`} />
                    <StatBox label="Total Shots (Away)" value={String((firstResult.analysis.shots_away ?? 0) + (secondResult.analysis.shots_away ?? 0))} sub={`On target: ${(firstResult.analysis.shots_on_target_away ?? 0) + (secondResult.analysis.shots_on_target_away ?? 0)}`} />
                    <StatBox label="Possession 1H"      value={`${firstResult.analysis.possession_home ?? "—"}%`}  sub="Home team" />
                    <StatBox label="Possession 2H"      value={`${secondResult.analysis.possession_home ?? "—"}%`} sub="Home team" />
                    <StatBox label="Total Fouls"        value={String((firstResult.analysis.fouls_detected ?? 0) + (secondResult.analysis.fouls_detected ?? 0))} />
                  </div>
                </div>

                {/* All coaching points */}
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d", marginBottom: 12 }}>
                    Full Match Coaching Points
                  </div>
                  {(firstResult.analysis.key_coaching_points?.length ?? 0) > 0 && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>First Half</div>
                      <ul style={{ margin: "0 0 14px", paddingLeft: 16 }}>
                        {firstResult.analysis.key_coaching_points.map((p, i) => (
                          <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 5 }}>{p}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {(secondResult.analysis.key_coaching_points?.length ?? 0) > 0 && (
                    <>
                      <div style={{ fontWeight: 700, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Second Half</div>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {secondResult.analysis.key_coaching_points.map((p, i) => (
                          <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 5 }}>{p}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* Man of match */}
                {secondResult.analysis.man_of_match_candidate && (
                  <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      Man of the Match — Full Game
                    </div>
                    <div style={{ fontSize: 14, color: "#374151" }}>{secondResult.analysis.man_of_match_candidate}</div>
                  </div>
                )}

                <button
                  onClick={reset}
                  style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                >
                  Analyse Another Match
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes matcheye-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </div>
  );
}
