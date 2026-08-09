"use client";

/**
 * /analyst/commentary — Per-Half Commentary Analysis
 *
 * Three independent tabs (1st Half / 2nd Half / Full Match).
 * Each tab has its own record / upload / Gemini analysis / results state.
 * Match details (home team, away team, sport) are shared at the top.
 *
 * Pipeline (per tab):
 *   Browser MediaRecorder → WebM blob (or pre-recorded file upload)
 *   → uploadVideoInChunksParallel (Match Eye proxy → Gemini Files API)
 *   → POST /api/analyse-commentary  (Next.js server route, maxDuration=300)
 *   → Gemini 2.0 Flash transcribes + extracts structured data
 *   → Render events timeline + tactical observations + summary
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Upload, Loader2, CheckCircle, XCircle,
  Clock, Users, ChevronRight, Target, BarChart3,
  ArrowRight, TrendingUp, Play, Pause,
} from "lucide-react";
import { uploadVideoInChunksParallel } from "@/lib/upload-chunks";
import { useAuthStore } from "@/lib/auth-store";
import { SUPPORTED_FORMATIONS } from "@/lib/commentary-zones";
import MatchZonePitch from "@/components/analyst/MatchZonePitch";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Shot {
  team:        string;
  player:      string | null;
  minute:      number | null;
  zone_id:     string;
  zone_label:  string;
  xg:          number;
  is_goal:     boolean;
  description: string;
}

interface PlayerPosition {
  name:         string;
  team:         string;
  number:       number | null;
  pitch_x:      number;
  pitch_y:      number;
  active_zones: number[];
}

interface PassCombination {
  from_name:   string;
  from_number: number | null;
  to_name:     string;
  to_number:   number | null;
  count:       number;
  team:        string;
}

interface MatchInfo {
  home_score:      number | null;
  away_score:      number | null;
  home_formation:  string | null;
  away_formation:  string | null;
  possession_home: number | null;
  shots_home:      number | null;
  shots_away:      number | null;
  on_target_home:  number | null;
  on_target_away:  number | null;
  home_xg:         number | null;
  away_xg:         number | null;
}

interface TimelineEvent {
  minute:             number | null;
  audio_time_seconds: number | null;
  event_type:         string;
  team:               string | null;
  player:             string | null;
  description:        string;
  zone?:              string | null;
  zone_source?:       string | null;
}

interface CommentaryResult {
  match_info:            MatchInfo;
  shots:                 Shot[];
  player_positions:      PlayerPosition[];
  pass_combinations:     PassCombination[];
  tactical:              { observations: string[]; strengths: string[]; weaknesses: string[] };
  events_timeline:       TimelineEvent[];
  key_players_mentioned: string[];
  summary:               string;
  match_summary:         string;
}

type Phase   = "setup" | "recording" | "upload" | "analysing" | "done" | "error";
type HalfKey = "first" | "second" | "full";

interface HalfState {
  phase:      Phase;
  recordSecs: number;
  uploadPct:  number;
  errorMsg:   string;
  result:     CommentaryResult | null;
  pushed:     boolean;
  audioUrl:   string | null;
  playing:    boolean;
  audioCur:   number;
  audioDur:   number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const XG_ZONE_XG: Record<string, number> = {
  six_yard: 0.76, penalty_spot: 0.45, central_box: 0.35,
  wide_box_left: 0.12, wide_box_right: 0.12,
  edge_centre: 0.18, edge_wide_left: 0.07, edge_wide_right: 0.07,
  long_range: 0.04,
};

const HALF_LABELS: Record<HalfKey, string> = {
  first: "1st Half", second: "2nd Half", full: "Full Match",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function initHalf(): HalfState {
  return {
    phase: "setup", recordSecs: 0, uploadPct: 0, errorMsg: "",
    result: null, pushed: false, audioUrl: null,
    playing: false, audioCur: 0, audioDur: 0,
  };
}

const HALVES: HalfKey[] = ["first", "second", "full"];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommentaryPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);

  // Shared match details
  const [homeTeam,      setHomeTeam]      = useState("");
  const [awayTeam,      setAwayTeam]      = useState("");
  const [sport,         setSport]         = useState("Football");
  const [homeFormation, setHomeFormation] = useState("4-4-2");
  const [awayFormation, setAwayFormation] = useState("4-4-2");
  const [activeTab,     setActiveTab]     = useState<HalfKey>("first");

  // Per-tab state
  const [tabs, setTabs] = useState<Record<HalfKey, HalfState>>({
    first: initHalf(), second: initHalf(), full: initHalf(),
  });

  // Shared recording refs (only one tab records at a time)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  // Per-tab refs
  const audioBlobRefs = useRef<Partial<Record<HalfKey, Blob | File>>>({});
  const audioRefs     = useRef<Record<HalfKey, HTMLAudioElement | null>>({ first: null, second: null, full: null });
  const eventRefsMaps = useRef<Record<HalfKey, (HTMLDivElement | null)[]>>({ first: [], second: [], full: [] });

  // Cleanup timer on unmount
  useEffect(() => () => { timerRef.current && clearInterval(timerRef.current); }, []);

  // Helper: update one half's state
  const setTab = useCallback((key: HalfKey, patch: Partial<HalfState>) => {
    setTabs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const cur = tabs[activeTab];

  // Synced event index for the active tab
  const activeEventIdx = useMemo(() => {
    const evs = cur.result?.events_timeline ?? [];
    let idx = -1;
    evs.forEach((ev, i) => {
      if (ev.audio_time_seconds != null && ev.audio_time_seconds <= cur.audioCur) idx = i;
    });
    return idx;
  }, [cur.result, cur.audioCur, activeTab]);

  // Auto-scroll the active event into view
  useEffect(() => {
    if (activeEventIdx >= 0) {
      eventRefsMaps.current[activeTab][activeEventIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeEventIdx, activeTab]);

  // True if any tab is currently recording (block tab switching + form editing)
  const anyRecording = HALVES.some((k) => tabs[k].phase === "recording");

  // ── Recording ──────────────────────────────────────────────────────────────

  async function startRecording(halfKey: HalfKey) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current        = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(1000);
      setTab(halfKey, { phase: "recording", recordSecs: 0 });
      timerRef.current = setInterval(() => {
        setTabs((prev) => ({
          ...prev,
          [halfKey]: { ...prev[halfKey], recordSecs: prev[halfKey].recordSecs + 1 },
        }));
      }, 1000);
    } catch {
      setTab(halfKey, { phase: "error", errorMsg: "Microphone access denied. Please allow microphone in your browser settings." });
    }
  }

  async function stopRecordingAndUpload(halfKey: HalfKey) {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    timerRef.current && clearInterval(timerRef.current);
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
    await new Promise<void>((resolve) => { mr.onstop = () => resolve(); });

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    audioBlobRefs.current[halfKey] = blob;
    const file = new File([blob], `commentary-${halfKey}.webm`, { type: "audio/webm" });
    setTab(halfKey, { phase: "upload", uploadPct: 0 });
    try {
      const r = await uploadVideoInChunksParallel(file, (pct) => setTab(halfKey, { uploadPct: pct }));
      setTab(halfKey, { uploadPct: 100 });
      await runAnalysis(halfKey, r);
    } catch (err) {
      setTab(halfKey, { phase: "error", errorMsg: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  // ── File upload (pre-recorded) ─────────────────────────────────────────────

  async function handleFileUpload(halfKey: HalfKey, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    audioBlobRefs.current[halfKey] = file;
    setTab(halfKey, { phase: "upload", uploadPct: 0 });
    try {
      const r = await uploadVideoInChunksParallel(file, (pct) => setTab(halfKey, { uploadPct: pct }));
      setTab(halfKey, { uploadPct: 100 });
      await runAnalysis(halfKey, r);
    } catch (err) {
      setTab(halfKey, { phase: "error", errorMsg: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  // ── Gemini analysis ────────────────────────────────────────────────────────

  async function runAnalysis(halfKey: HalfKey, params: { fileUri: string; fileName: string; mimeType: string }) {
    setTab(halfKey, { phase: "analysing" });
    try {
      const res = await fetch("/api/analyse-commentary", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fileUri:       params.fileUri,
          fileName:      params.fileName,
          mimeType:      params.mimeType,
          homeTeam:      homeTeam || "Home",
          awayTeam:      awayTeam || "Away",
          sport,
          half:          halfKey,
          token,
          homeFormation: sport === "Football" ? homeFormation : "",
          awayFormation: sport === "Football" ? awayFormation : "",
        }),
      });
      const data = await res.json() as { result?: CommentaryResult; error?: string };
      if (!res.ok || !data.result) throw new Error(data.error ?? `Analysis failed (${res.status})`);
      const blob     = audioBlobRefs.current[halfKey];
      const audioUrl = blob ? URL.createObjectURL(blob) : null;
      setTab(halfKey, { result: data.result, audioUrl, phase: "done" });
    } catch (err) {
      setTab(halfKey, { phase: "error", errorMsg: err instanceof Error ? err.message : "Analysis failed" });
    }
  }

  // ── Push to Analysis Hub ───────────────────────────────────────────────────

  function pushToAnalysisHub(halfKey: HalfKey, r: CommentaryResult) {
    const home  = homeTeam || "Home";
    const away  = awayTeam || "Away";
    const today = new Date().toISOString().split("T")[0];
    const mi    = r.match_info ?? {} as MatchInfo;
    const safeArr = <T,>(v: T[] | null | undefined): T[] => Array.isArray(v) ? v : [];

    // 1. xG shots → gs_xg_shots
    const xgShots = safeArr(r.shots).map((s, i) => ({
      id:     `cmt-${Date.now()}-${i}`,
      team:   s.team.toLowerCase().includes(home.toLowerCase()) ? "home" : "away",
      zone:   s.zone_label || s.zone_id,
      xg:     s.xg ?? (XG_ZONE_XG[s.zone_id] ?? 0.05),
      minute: s.minute ?? 0,
      isGoal: s.is_goal,
    }));
    localStorage.setItem("gs_xg_shots", JSON.stringify(xgShots));

    // 2. Heatmaps → gs_heatmaps_squad + gs_heatmaps_data
    const positions = safeArr(r.player_positions);
    localStorage.setItem("gs_heatmaps_squad", positions.map((p) => p.name).join(","));
    const heatData: Record<number, number[]> = {};
    positions.forEach((p, idx) => {
      if (safeArr(p.active_zones).length > 0) {
        heatData[idx] = p.active_zones;
      } else {
        const col  = Math.min(5, Math.floor((p.pitch_y ?? 50) / 100 * 6));
        const row  = Math.min(9, Math.floor((p.pitch_x ?? 50) / 100 * 10));
        const zone = row * 6 + col;
        heatData[idx] = [zone, Math.max(0, zone - 1), Math.min(59, zone + 1)];
      }
    });
    localStorage.setItem("gs_heatmaps_data", JSON.stringify(heatData));

    // 3. Pass map → gs_pass_map_players + gs_pass_map_links
    const playerNumMap: Record<string, number> = {};
    const passMapPlayers = positions.map((p, i) => {
      const num = p.number ?? (i + 1);
      playerNumMap[p.name] = num;
      return { number: num, x: p.pitch_x ?? 50, y: p.pitch_y ?? 50 };
    });
    safeArr(r.pass_combinations).forEach((pc) => {
      [{ name: pc.from_name, num: pc.from_number }, { name: pc.to_name, num: pc.to_number }].forEach(({ name, num }) => {
        if (name && !playerNumMap[name]) {
          const assigned = num ?? (passMapPlayers.length + 1);
          playerNumMap[name] = assigned;
          passMapPlayers.push({ number: assigned, x: 50, y: 50 });
        }
      });
    });
    const passMapLinks = safeArr(r.pass_combinations).map((pc, i) => ({
      id:    `lnk-${i}`,
      from:  playerNumMap[pc.from_name] ?? pc.from_number ?? 0,
      to:    playerNumMap[pc.to_name]   ?? pc.to_number   ?? 0,
      count: pc.count,
    }));
    localStorage.setItem("gs_pass_map_players", JSON.stringify(passMapPlayers));
    localStorage.setItem("gs_pass_map_links",   JSON.stringify(passMapLinks));

    // 4. Tactical form → gs_tactical_form
    const obs = safeArr(r.tactical?.observations);
    localStorage.setItem("gs_tactical_form", JSON.stringify({
      homeTeam:   home,
      awayTeam:   away,
      homeScore:  mi.home_score   ?? 0,
      awayScore:  mi.away_score   ?? 0,
      formation:  mi.home_formation ?? "",
      possession: mi.possession_home ?? 50,
      shots:      (mi.shots_home ?? 0) + (mi.shots_away ?? 0),
      onTarget:   (mi.on_target_home ?? 0) + (mi.on_target_away ?? 0),
      notes:      obs.join(" "),
    }));

    // 5. Season intelligence → gs_touch_tracker_history
    const homeXg = mi.home_xg ?? xgShots.filter((s) => s.team === "home").reduce((a, s) => a + s.xg, 0);
    const awayXg = mi.away_xg ?? xgShots.filter((s) => s.team === "away").reduce((a, s) => a + s.xg, 0);
    let history: unknown[] = [];
    try { history = JSON.parse(localStorage.getItem("gs_touch_tracker_history") ?? "[]"); } catch { history = []; }
    history.push({
      id:       `cmt-${Date.now()}`,
      date:      today,
      homeTeam:  home,
      awayTeam:  away,
      homeXg:    Math.round(homeXg * 100) / 100,
      awayXg:    Math.round(awayXg * 100) / 100,
      homeGoals: mi.home_score ?? 0,
      awayGoals: mi.away_score ?? 0,
    });
    localStorage.setItem("gs_touch_tracker_history", JSON.stringify(history));

    setTab(halfKey, { pushed: true });
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // Shorthand for the current active half key
  const half = activeTab;
  const s    = cur;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: "#1a5c2a", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.push("/analyst")} style={{ color: "#c8962a", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
          ← Analyst Hub
        </button>
        <ChevronRight size={14} color="#c8962a" />
        <span style={{ color: "white", fontWeight: 600, fontSize: 14 }}>Commentary Analysis</span>
      </nav>

      {/* Hidden audio elements — one per half, always in DOM when audioUrl is set */}
      {HALVES.map((h) =>
        tabs[h].audioUrl ? (
          <audio
            key={h}
            ref={(el) => { audioRefs.current[h] = el; }}
            src={tabs[h].audioUrl!}
            onTimeUpdate={() => setTab(h, { audioCur: audioRefs.current[h]?.currentTime ?? 0 })}
            onDurationChange={() => setTab(h, { audioDur: audioRefs.current[h]?.duration ?? 0 })}
            onEnded={() => setTab(h, { playing: false })}
            onPlay={() => setTab(h, { playing: true })}
            onPause={() => setTab(h, { playing: false })}
            style={{ display: "none" }}
          />
        ) : null
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a5c2a", marginBottom: 4 }}>Commentary Analysis</h1>
        <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
          Speak naturally during the match — record or upload afterward per half. Gemini extracts a full event timeline.
        </p>

        {/* ── Shared Match Details ── */}
        <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#555", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Match Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Home Team</label>
              <input
                value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                placeholder="e.g. Dynamos FC"
                disabled={anyRecording}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Away Team</label>
              <input
                value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                placeholder="e.g. Highlanders FC"
                disabled={anyRecording}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Sport</label>
              <select
                value={sport} onChange={(e) => setSport(e.target.value)}
                disabled={anyRecording}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              >
                {["Football","Rugby","Netball","Basketball","Cricket","Hockey","Volleyball","Athletics","Swimming","Tennis"].map((sp) => (
                  <option key={sp}>{sp}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Formation selects — Football only */}
          {sport === "Football" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                  {homeTeam || "Home"} Formation
                </label>
                <select
                  value={homeFormation}
                  onChange={(e) => setHomeFormation(e.target.value)}
                  disabled={anyRecording}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                >
                  {SUPPORTED_FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                  {awayTeam || "Away"} Formation
                </label>
                <select
                  value={awayFormation}
                  onChange={(e) => setAwayFormation(e.target.value)}
                  disabled={anyRecording}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                >
                  {SUPPORTED_FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, backgroundColor: "white", borderRadius: 10, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {HALVES.map((h) => {
            const isActive  = activeTab === h;
            const hasResult = !!tabs[h].result;
            const recThis   = tabs[h].phase === "recording";
            return (
              <button
                key={h}
                onClick={() => !anyRecording && setActiveTab(h)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 8, border: "none",
                  cursor: anyRecording && !recThis ? "not-allowed" : "pointer",
                  backgroundColor: isActive ? "#1a5c2a" : "transparent",
                  color: isActive ? "white" : "#666",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.15s",
                }}
              >
                {HALF_LABELS[h]}
                {hasResult && (
                  <CheckCircle size={13} color={isActive ? "white" : "#16a34a"} />
                )}
                {recThis && (
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    backgroundColor: isActive ? "white" : "#e11d48",
                    display: "inline-block", animation: "pulse 1s infinite",
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Phase: Setup / Recording ── */}
        {(s.phase === "setup" || s.phase === "recording") && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
              {HALF_LABELS[half]} commentary — record live or upload a saved audio file.
            </p>
            {s.phase === "setup" && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => startRecording(half)}
                  disabled={anyRecording}
                  style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: anyRecording ? "#ccc" : "#e11d48", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: anyRecording ? "not-allowed" : "pointer", fontSize: 14 }}
                >
                  <Mic size={16} /> Start Recording
                </button>
                <label style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1a5c2a", color: "white", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  <Upload size={16} /> Upload Audio File
                  <input type="file" accept="audio/*,video/webm,video/mp4" onChange={(e) => handleFileUpload(half, e)} style={{ display: "none" }} />
                </label>
              </div>
            )}
            {s.phase === "recording" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#e11d48", animation: "pulse 1s infinite" }} />
                  <span style={{ fontWeight: 700, color: "#e11d48", fontSize: 18 }}>REC {formatTime(s.recordSecs)}</span>
                  <span style={{ fontSize: 13, color: "#888" }}>— {HALF_LABELS[half]}</span>
                </div>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>Speak naturally — describe what you see happening in the match.</p>
                <button
                  onClick={() => stopRecordingAndUpload(half)}
                  style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  <MicOff size={16} /> Stop &amp; Analyse
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Phase: Upload ── */}
        {s.phase === "upload" && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Upload size={40} color="#1a5c2a" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>Uploading {HALF_LABELS[half]} audio…</p>
            <div style={{ backgroundColor: "#f0f0f0", borderRadius: 8, height: 10, marginBottom: 8 }}>
              <div style={{ width: `${s.uploadPct}%`, height: "100%", backgroundColor: "#1a5c2a", borderRadius: 8, transition: "width 0.3s" }} />
            </div>
            <p style={{ color: "#888", fontSize: 13 }}>{s.uploadPct}%</p>
          </div>
        )}

        {/* ── Phase: Analysing ── */}
        {s.phase === "analysing" && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Loader2 size={40} color="#1a5c2a" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Gemini is analysing your {HALF_LABELS[half]} commentary</p>
            <p style={{ color: "#888", fontSize: 13 }}>This usually takes 30–90 seconds. Please keep this tab open.</p>
          </div>
        )}

        {/* ── Phase: Error ── */}
        {s.phase === "error" && (
          <div style={{ backgroundColor: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <XCircle size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>Analysis failed</p>
                <p style={{ color: "#7f1d1d", fontSize: 13, marginBottom: 12 }}>{s.errorMsg}</p>
                <button
                  onClick={() => setTab(half, { phase: "setup", errorMsg: "" })}
                  style={{ backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase: Done ── */}
        {s.phase === "done" && s.result && (() => {
          const r         = s.result;
          const mi        = r.match_info ?? {} as MatchInfo;
          const home      = homeTeam || "Home";
          const away      = awayTeam || "Away";
          const shots     = Array.isArray(r.shots)             ? r.shots             : [];
          const positions = Array.isArray(r.player_positions)  ? r.player_positions  : [];
          const passes    = Array.isArray(r.pass_combinations) ? r.pass_combinations : [];
          const events    = Array.isArray(r.events_timeline)   ? r.events_timeline   : [];
          const obs       = r.tactical?.observations ?? [];
          const strengths = r.tactical?.strengths    ?? [];
          const weaknesses= r.tactical?.weaknesses   ?? [];
          const homeXg    = mi.home_xg ?? shots.filter((sh) => sh.team.toLowerCase().includes(home.toLowerCase())).reduce((a, sh) => a + (sh.xg ?? 0), 0);
          const awayXg    = mi.away_xg ?? shots.filter((sh) => !sh.team.toLowerCase().includes(home.toLowerCase())).reduce((a, sh) => a + (sh.xg ?? 0), 0);

          return (
            <div>
              {/* ── Audio Player ── */}
              {s.audioUrl && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => {
                      const el = audioRefs.current[half];
                      if (!el) return;
                      if (s.playing) el.pause(); else void el.play();
                    }}
                    style={{ flexShrink: 0, width: 40, height: 40, borderRadius: "50%", backgroundColor: "#1a5c2a", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {s.playing ? <Pause size={18} color="white" /> : <Play size={18} color="white" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={s.audioDur || 1}
                    step={0.5}
                    value={s.audioCur}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      setTab(half, { audioCur: t });
                      const el = audioRefs.current[half];
                      if (el) el.currentTime = t;
                    }}
                    style={{ flex: 1, accentColor: "#1a5c2a", cursor: "pointer" }}
                  />
                  <span style={{ flexShrink: 0, fontSize: 12, color: "#666", fontVariantNumeric: "tabular-nums", minWidth: 90, textAlign: "right" }}>
                    {formatTime(s.audioCur)} / {formatTime(s.audioDur)}
                  </span>
                  <span style={{ fontSize: 11, color: "#c8962a", fontWeight: 600, flexShrink: 0 }}>{HALF_LABELS[half]}</span>
                </div>
              )}

              {/* ── Zone Pitch Visualisation ── */}
              <MatchZonePitch
                events={events}
                audioCur={s.audioCur}
                homeTeam={home}
                awayTeam={away}
              />

              {/* ── Push to Hub CTA ── */}
              {!s.pushed ? (
                <div style={{ backgroundColor: "#1a5c2a", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>Push {HALF_LABELS[half]} to Analysis Hub</p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "4px 0 0" }}>
                      Loads xG data, heatmaps, pass map, tactical form &amp; season record into the analyst pages
                    </p>
                  </div>
                  <button
                    onClick={() => pushToAnalysisHub(half, r)}
                    style={{ backgroundColor: "#c8962a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                  >
                    <TrendingUp size={15} /> Push All Data <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={20} color="#16a34a" />
                  <div>
                    <p style={{ fontWeight: 700, color: "#14532d", margin: 0, fontSize: 14 }}>Data pushed to Analysis Hub</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      {[
                        { label: "xG Analysis", href: "/analyst/xg-analysis" },
                        { label: "Heatmaps",    href: "/analyst/heatmaps"    },
                        { label: "Pass Map",    href: "/analyst/pass-map"    },
                        { label: "Tactical",    href: "/analyst/tactical-report" },
                        { label: "Season",      href: "/analyst/season"      },
                      ].map(({ label, href }) => (
                        <a key={href} href={href} style={{ backgroundColor: "#1a5c2a", color: "white", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                          {label} →
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Scoreboard ── */}
              <div style={{ backgroundColor: "white", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }}>{home}</p>
                    {mi.home_formation && <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{mi.home_formation}</p>}
                  </div>
                  <div style={{ textAlign: "center", padding: "0 16px" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#1a5c2a", letterSpacing: 4 }}>
                      {mi.home_score ?? "–"} : {mi.away_score ?? "–"}
                    </div>
                    <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>{sport} · {HALF_LABELS[half]}</p>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }}>{away}</p>
                    {mi.away_formation && <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{mi.away_formation}</p>}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Shots",      home: mi.shots_home,     away: mi.shots_away     },
                    { label: "On Target",  home: mi.on_target_home, away: mi.on_target_away  },
                    { label: "xG",         home: homeXg.toFixed(2), away: awayXg.toFixed(2)  },
                    { label: "Possession", home: mi.possession_home != null ? `${mi.possession_home}%` : null, away: mi.possession_home != null ? `${100 - mi.possession_home}%` : null },
                  ].map(({ label, home: h, away: a }) => (
                    <div key={label} style={{ textAlign: "center", backgroundColor: "#f8faf8", borderRadius: 8, padding: "8px 4px" }}>
                      <p style={{ fontSize: 10, color: "#888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{h ?? "–"} : {a ?? "–"}</p>
                    </div>
                  ))}
                </div>

                {(homeXg > 0 || awayXg > 0) && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 4 }}>
                      <span>{home} xG: <strong>{homeXg.toFixed(2)}</strong></span>
                      <span>{away} xG: <strong>{awayXg.toFixed(2)}</strong></span>
                    </div>
                    <div style={{ display: "flex", height: 8, borderRadius: 8, overflow: "hidden", backgroundColor: "#f0f0f0" }}>
                      <div style={{ width: `${(homeXg / (homeXg + awayXg)) * 100}%`, backgroundColor: "#1a5c2a", transition: "width 0.5s" }} />
                      <div style={{ flex: 1, backgroundColor: "#e11d48" }} />
                    </div>
                  </div>
                )}

                {r.match_summary && <p style={{ fontSize: 13, color: "#555", margin: "12px 0 0", fontStyle: "italic" }}>{r.match_summary}</p>}
                <p style={{ fontSize: 13, color: "#444", margin: "8px 0 0" }}>{r.summary}</p>
              </div>

              {/* ── Shot Log ── */}
              {shots.length > 0 && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Target size={16} color="#1a5c2a" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Shot Log ({shots.length})</span>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #eee" }}>
                          {["Min", "Team", "Player", "Zone", "xG", ""].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600, color: "#888", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shots.map((sh, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f5f5f5", backgroundColor: sh.is_goal ? "#f0fdf4" : "transparent" }}>
                            <td style={{ padding: "6px 8px", color: "#666" }}>{sh.minute ?? "–"}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 600, color: sh.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48" }}>
                              {sh.team.toLowerCase().includes(home.toLowerCase()) ? home : away}
                            </td>
                            <td style={{ padding: "6px 8px" }}>{sh.player ?? "–"}</td>
                            <td style={{ padding: "6px 8px", color: "#555" }}>{sh.zone_label || sh.zone_id}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 700, color: "#c8962a" }}>{(sh.xg ?? 0).toFixed(2)}</td>
                            <td style={{ padding: "6px 8px" }}>{sh.is_goal && <span style={{ backgroundColor: "#1a5c2a", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>GOAL</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(
                      shots.reduce<Record<string, number>>((acc, sh) => {
                        const z = sh.zone_label || sh.zone_id;
                        acc[z] = (acc[z] ?? 0) + (sh.xg ?? 0);
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1]).map(([zone, xg]) => (
                      <span key={zone} style={{ backgroundColor: "#f4f2ee", border: "1px solid #e5e5e5", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#555" }}>
                        {zone}: <strong>{xg.toFixed(2)} xG</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tactical Breakdown ── */}
              {(obs.length > 0 || strengths.length > 0 || weaknesses.length > 0) && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <BarChart3 size={16} color="#c8962a" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Tactical Breakdown</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {obs.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Observations</p>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {obs.map((o, i) => <li key={i} style={{ color: "#444", fontSize: 13, marginBottom: 4 }}>{o}</li>)}
                        </ul>
                      </div>
                    )}
                    {strengths.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Strengths</p>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {strengths.map((st, i) => <li key={i} style={{ color: "#166534", fontSize: 13, marginBottom: 4 }}>{st}</li>)}
                        </ul>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>Weaknesses</p>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {weaknesses.map((w, i) => <li key={i} style={{ color: "#7f1d1d", fontSize: 13, marginBottom: 4 }}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Pass Combinations ── */}
              {passes.length > 0 && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <ArrowRight size={16} color="#2563eb" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Pass Combinations ({passes.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {passes.sort((a, b) => b.count - a.count).map((pc, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: pc.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48", minWidth: 90 }}>{pc.from_name}</span>
                        <ArrowRight size={12} color="#999" />
                        <span style={{ fontWeight: 600, color: pc.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48", flex: 1 }}>{pc.to_name}</span>
                        <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>×{pc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Players Identified ── */}
              {(r.key_players_mentioned?.length > 0 || positions.length > 0) && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Users size={16} color="#1a5c2a" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Players Identified</span>
                  </div>
                  {positions.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {positions.map((p, i) => (
                        <span key={i} style={{
                          backgroundColor: p.team.toLowerCase().includes(home.toLowerCase()) ? "#f0fdf4" : "#fff1f2",
                          border: `1px solid ${p.team.toLowerCase().includes(home.toLowerCase()) ? "#bbf7d0" : "#fecaca"}`,
                          borderRadius: 16, padding: "3px 10px", fontSize: 13,
                          color: p.team.toLowerCase().includes(home.toLowerCase()) ? "#166534" : "#991b1b",
                        }}>
                          {p.number ? `#${p.number} ` : ""}{p.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.key_players_mentioned.map((p, i) => (
                        <span key={i} style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "3px 10px", fontSize: 13, color: "#166534" }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Events Timeline (synced to audio playback) ── */}
              {events.length > 0 && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Clock size={16} color="#1a5c2a" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Event Timeline ({events.length})</span>
                    {s.audioUrl && <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>● synced · click event to seek</span>}
                  </div>
                  <div style={{ maxHeight: 340, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                    {events.map((ev, i) => {
                      const isActive  = i === activeEventIdx;
                      const hasTiming = ev.audio_time_seconds != null;
                      const borderColor = isActive
                        ? "#c8962a"
                        : ev.event_type === "goal"        ? "#16a34a"
                        : ev.event_type === "yellow_card" ? "#d97706"
                        : ev.event_type === "red_card"    ? "#dc2626"
                        : "#d1d5db";
                      return (
                        <div
                          key={i}
                          ref={(el) => { eventRefsMaps.current[half][i] = el; }}
                          onClick={() => {
                            if (hasTiming) {
                              const el = audioRefs.current[half];
                              if (el) {
                                el.currentTime = ev.audio_time_seconds!;
                                setTab(half, { audioCur: ev.audio_time_seconds! });
                                void el.play();
                              }
                            }
                          }}
                          style={{
                            display: "flex", gap: 10, alignItems: "flex-start",
                            borderLeft: `3px solid ${borderColor}`,
                            paddingLeft: 10, paddingTop: 6, paddingBottom: 6,
                            borderRadius: "0 6px 6px 0",
                            backgroundColor: isActive ? "#fffbeb" : "transparent",
                            cursor: hasTiming ? "pointer" : "default",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <div style={{ minWidth: 44, display: "flex", flexDirection: "column", gap: 1 }}>
                            <span style={{ fontWeight: 700, color: "#1a5c2a", fontSize: 12 }}>
                              {ev.minute != null ? `${ev.minute}′` : "–"}
                            </span>
                            {hasTiming && (
                              <span style={{ fontSize: 10, color: "#aaa" }}>{formatTime(ev.audio_time_seconds!)}</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: 12, color: isActive ? "#92400e" : "#1a1a1a" }}>
                              {ev.event_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                            {ev.player && <span style={{ color: "#1a5c2a", fontWeight: 600, fontSize: 12 }}> · {ev.player}</span>}
                            {ev.team && <span style={{ color: "#888", fontSize: 11 }}> ({ev.team})</span>}
                            <p style={{ color: "#555", fontSize: 12, margin: "2px 0 0" }}>{ev.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setTab(half, { phase: "setup", result: null, audioUrl: null, recordSecs: 0, uploadPct: 0, pushed: false, playing: false, audioCur: 0, audioDur: 0 })}
                  style={{ backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  New Analysis
                </button>
                {!s.pushed && (
                  <button
                    onClick={() => pushToAnalysisHub(half, r)}
                    style={{ backgroundColor: "white", color: "#1a5c2a", border: "2px solid #1a5c2a", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                  >
                    Push to Hub
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
