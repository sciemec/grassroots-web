"use client";

/**
 * /analyst/commentary — Record-then-Upload Commentary Analysis
 *
 * Analyst speaks naturally during a match (their own commentary / observations).
 * After the match they upload the audio recording — Gemini transcribes it and
 * extracts a structured event timeline, tactical observations, and match summary.
 *
 * Pipeline:
 *   Browser MediaRecorder → WebM blob
 *   → uploadVideoInChunksParallel (reuses Match Eye proxy)
 *   → POST /api/v1/commentary/analyse  { fileUri, fileName, mimeType, ... }
 *   → Poll /api/v1/commentary/status/{jobId} every 5s
 *   → Render events timeline + tactical observations + summary
 */

import { useEffect, useRef, useState } from "react";
import { useRouter }                   from "next/navigation";
import {
  Mic, MicOff, Upload, Loader2, CheckCircle, XCircle,
  Clock, Users, ChevronRight, AlertCircle, Target, BarChart3,
  ArrowRight, TrendingUp,
} from "lucide-react";
import { uploadVideoInChunksParallel } from "@/lib/upload-chunks";
import { useAuthStore }                from "@/lib/auth-store";

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
  minute:      number | null;
  event_type:  string;
  team:        string | null;
  player:      string | null;
  description: string;
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

type Phase = "setup" | "recording" | "upload" | "polling" | "done" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const XG_ZONE_XG: Record<string, number> = {
  six_yard: 0.76, penalty_spot: 0.45, central_box: 0.35,
  wide_box_left: 0.12, wide_box_right: 0.12,
  edge_centre: 0.18, edge_wide_left: 0.07, edge_wide_right: 0.07,
  long_range: 0.04,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommentaryPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  // Setup form
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [sport,    setSport]    = useState("Football");
  const [half,     setHalf]     = useState<"first" | "second" | "full">("first");

  // Recording state
  const [phase,          setPhase]         = useState<Phase>("setup");
  const [recordSecs,     setRecordSecs]    = useState(0);
  const [uploadPct,      setUploadPct]     = useState(0);
  const [statusMsg,      setStatusMsg]     = useState("");
  const [errorMsg,       setErrorMsg]      = useState("");
  const [result,         setResult]        = useState<CommentaryResult | null>(null);
  const [pushed,         setPushed]        = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current);
    pollRef.current  && clearInterval(pollRef.current);
  }, []);

  // ── Recording ──────────────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      chunksRef.current        = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(1000); // collect every 1s so we can show live size

      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
      setPhase("recording");
    } catch {
      setErrorMsg("Microphone access denied. Please allow microphone in your browser settings.");
      setPhase("error");
    }
  }

  async function stopRecordingAndUpload() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    // Stop recording
    timerRef.current && clearInterval(timerRef.current);
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());

    // Wait for the last ondataavailable
    await new Promise<void>((resolve) => { mr.onstop = () => resolve(); });

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "commentary.webm", { type: "audio/webm" });

    setPhase("upload");
    setUploadPct(0);

    try {
      const { fileUri, fileName, mimeType } = await uploadVideoInChunksParallel(
        file,
        (pct) => setUploadPct(pct),
      );

      setUploadPct(100);
      setStatusMsg("Audio uploaded — starting analysis…");

      await submitJob({ fileUri, fileName, mimeType, durationSeconds: recordSecs });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  // ── File upload (pre-recorded file) ───────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhase("upload");
    setUploadPct(0);

    try {
      const { fileUri, fileName, mimeType } = await uploadVideoInChunksParallel(
        file,
        (pct) => setUploadPct(pct),
      );

      setUploadPct(100);
      setStatusMsg("File uploaded — starting analysis…");

      await submitJob({ fileUri, fileName, mimeType, durationSeconds: undefined });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  // ── Submit to backend ─────────────────────────────────────────────────────

  async function submitJob(params: {
    fileUri: string; fileName: string; mimeType: string; durationSeconds?: number;
  }) {
    const res = await fetch(`${apiBase}/commentary/analyse`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        gemini_file_uri:  params.fileUri,
        gemini_file_name: params.fileName,
        mime_type:        params.mimeType,
        home_team:        homeTeam || "Home",
        away_team:        awayTeam || "Away",
        sport,
        half,
        duration_seconds: params.durationSeconds ?? null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(body.message ?? `Server error ${res.status}`);
    }

    const { job_id } = await res.json() as { job_id: string };
    setPhase("polling");
    setStatusMsg("Gemini is analysing your commentary…");
    pollStatus(job_id);
  }

  // ── Poll status ───────────────────────────────────────────────────────────

  function pollStatus(jobId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${apiBase}/commentary/status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json() as { status: string; result?: CommentaryResult; error?: string };

        if (data.status === "done" && data.result) {
          clearInterval(pollRef.current!);
          setResult(data.result);
          setPhase("done");
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setErrorMsg(data.error ?? "Analysis failed");
          setPhase("error");
        }
        // pending / processing — keep polling
      } catch {
        // network blip — keep polling
      }
    }, 5000);
  }

  // ── Push all extracted data into the 5 analyst hub localStorage keys ─────

  function pushToAnalysisHub(r: CommentaryResult) {
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
        // Derive primary zone from pitch_x/y if Gemini didn't output zones
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
    // Register any extra names from pass_combinations
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
      id:        `cmt-${Date.now()}`,
      date:       today,
      homeTeam:   home,
      awayTeam:   away,
      homeXg:     Math.round(homeXg * 100) / 100,
      awayXg:     Math.round(awayXg * 100) / 100,
      homeGoals:  mi.home_score ?? 0,
      awayGoals:  mi.away_score ?? 0,
    });
    localStorage.setItem("gs_touch_tracker_history", JSON.stringify(history));

    setPushed(true);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

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

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a5c2a", marginBottom: 4 }}>Commentary Analysis</h1>
        <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>
          Speak naturally during the match — record or upload afterward. Gemini extracts a full event timeline.
        </p>

        {/* ── Phase: Setup ── */}
        {(phase === "setup" || phase === "recording") && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1a1a1a" }}>Match Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Home Team</label>
                <input
                  value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Dynamos FC"
                  disabled={phase === "recording"}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Away Team</label>
                <input
                  value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. Highlanders FC"
                  disabled={phase === "recording"}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Sport</label>
                <select
                  value={sport} onChange={(e) => setSport(e.target.value)}
                  disabled={phase === "recording"}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                >
                  {["Football","Rugby","Netball","Basketball","Cricket","Hockey","Volleyball","Athletics","Swimming","Tennis"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>Period</label>
                <select
                  value={half} onChange={(e) => setHalf(e.target.value as "first" | "second" | "full")}
                  disabled={phase === "recording"}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
                >
                  <option value="first">First Half</option>
                  <option value="second">Second Half</option>
                  <option value="full">Full Match</option>
                </select>
              </div>
            </div>

            {/* Recording controls */}
            {phase === "setup" && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={startRecording}
                  style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  <Mic size={16} /> Start Recording
                </button>
                <label style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1a5c2a", color: "white", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                  <Upload size={16} /> Upload Audio File
                  <input type="file" accept="audio/*,video/webm,video/mp4" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            )}

            {phase === "recording" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#e11d48", animation: "pulse 1s infinite" }} />
                  <span style={{ fontWeight: 700, color: "#e11d48", fontSize: 18 }}>REC {formatTime(recordSecs)}</span>
                </div>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>Speak naturally — describe what you see happening in the match.</p>
                <button
                  onClick={stopRecordingAndUpload}
                  style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  <MicOff size={16} /> Stop & Analyse
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Phase: Upload ── */}
        {phase === "upload" && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Upload size={40} color="#1a5c2a" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>Uploading audio…</p>
            <div style={{ backgroundColor: "#f0f0f0", borderRadius: 8, height: 10, marginBottom: 8 }}>
              <div style={{ width: `${uploadPct}%`, height: "100%", backgroundColor: "#1a5c2a", borderRadius: 8, transition: "width 0.3s" }} />
            </div>
            <p style={{ color: "#888", fontSize: 13 }}>{uploadPct}%</p>
          </div>
        )}

        {/* ── Phase: Polling ── */}
        {phase === "polling" && (
          <div style={{ backgroundColor: "white", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Loader2 size={40} color="#1a5c2a" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Gemini is analysing your commentary</p>
            <p style={{ color: "#888", fontSize: 13 }}>This usually takes 30–90 seconds. You can leave this tab open.</p>
          </div>
        )}

        {/* ── Phase: Error ── */}
        {phase === "error" && (
          <div style={{ backgroundColor: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <XCircle size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>Analysis failed</p>
                <p style={{ color: "#7f1d1d", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
                <button
                  onClick={() => { setPhase("setup"); setErrorMsg(""); }}
                  style={{ backgroundColor: "#e11d48", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Phase: Done ── */}
        {phase === "done" && result && (() => {
          const mi        = result.match_info ?? {} as MatchInfo;
          const home      = homeTeam || "Home";
          const away      = awayTeam || "Away";
          const shots     = Array.isArray(result.shots)             ? result.shots             : [];
          const positions = Array.isArray(result.player_positions)  ? result.player_positions  : [];
          const passes    = Array.isArray(result.pass_combinations) ? result.pass_combinations : [];
          const events    = Array.isArray(result.events_timeline)   ? result.events_timeline   : [];
          const obs       = result.tactical?.observations ?? [];
          const strengths = result.tactical?.strengths    ?? [];
          const weaknesses= result.tactical?.weaknesses   ?? [];
          const homeXg    = mi.home_xg ?? shots.filter((s) => s.team.toLowerCase().includes(home.toLowerCase())).reduce((a, s) => a + (s.xg ?? 0), 0);
          const awayXg    = mi.away_xg ?? shots.filter((s) => !s.team.toLowerCase().includes(home.toLowerCase())).reduce((a, s) => a + (s.xg ?? 0), 0);
          const maxXg     = Math.max(homeXg, awayXg, 0.1);

          return (
            <div>
              {/* ── Push to Hub CTA ── */}
              {!pushed ? (
                <div style={{ backgroundColor: "#1a5c2a", borderRadius: 12, padding: 20, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: 0 }}>Push to Analysis Hub</p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "4px 0 0" }}>
                      Loads xG data, heatmaps, pass map, tactical form &amp; season record into the analyst pages
                    </p>
                  </div>
                  <button
                    onClick={() => pushToAnalysisHub(result)}
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
                    <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>{sport} · {half === "first" ? "1st Half" : half === "second" ? "2nd Half" : "Full Match"}</p>
                  </div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px" }}>{away}</p>
                    {mi.away_formation && <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{mi.away_formation}</p>}
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Shots",    home: mi.shots_home,      away: mi.shots_away      },
                    { label: "On Target",home: mi.on_target_home,  away: mi.on_target_away  },
                    { label: "xG",       home: homeXg.toFixed(2),  away: awayXg.toFixed(2)  },
                    { label: "Possession",home: mi.possession_home != null ? `${mi.possession_home}%` : null, away: mi.possession_home != null ? `${100 - mi.possession_home}%` : null },
                  ].map(({ label, home: h, away: a }) => (
                    <div key={label} style={{ textAlign: "center", backgroundColor: "#f8faf8", borderRadius: 8, padding: "8px 4px" }}>
                      <p style={{ fontSize: 10, color: "#888", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
                        {h ?? "–"} : {a ?? "–"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* xG bar */}
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

                {result.match_summary && (
                  <p style={{ fontSize: 13, color: "#555", margin: "12px 0 0", fontStyle: "italic" }}>{result.match_summary}</p>
                )}
                <p style={{ fontSize: 13, color: "#444", margin: "8px 0 0" }}>{result.summary}</p>
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
                        {shots.map((s, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f5f5f5", backgroundColor: s.is_goal ? "#f0fdf4" : "transparent" }}>
                            <td style={{ padding: "6px 8px", color: "#666" }}>{s.minute ?? "–"}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 600, color: s.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48" }}>
                              {s.team.toLowerCase().includes(home.toLowerCase()) ? home : away}
                            </td>
                            <td style={{ padding: "6px 8px" }}>{s.player ?? "–"}</td>
                            <td style={{ padding: "6px 8px", color: "#555" }}>{s.zone_label || s.zone_id}</td>
                            <td style={{ padding: "6px 8px", fontWeight: 700, color: "#c8962a" }}>{(s.xg ?? 0).toFixed(2)}</td>
                            <td style={{ padding: "6px 8px" }}>{s.is_goal && <span style={{ backgroundColor: "#1a5c2a", color: "white", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>GOAL</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* xG per zone summary */}
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Object.entries(
                      shots.reduce<Record<string, number>>((acc, s) => {
                        const z = s.zone_label || s.zone_id;
                        acc[z] = (acc[z] ?? 0) + (s.xg ?? 0);
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
                          {strengths.map((s, i) => <li key={i} style={{ color: "#166534", fontSize: 13, marginBottom: 4 }}>{s}</li>)}
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
                        <span style={{ fontWeight: 600, color: pc.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48", minWidth: 90 }}>
                          {pc.from_name}
                        </span>
                        <ArrowRight size={12} color="#999" />
                        <span style={{ fontWeight: 600, color: pc.team.toLowerCase().includes(home.toLowerCase()) ? "#1a5c2a" : "#e11d48", flex: 1 }}>
                          {pc.to_name}
                        </span>
                        <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
                          ×{pc.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Players Mentioned ── */}
              {(result.key_players_mentioned?.length > 0 || positions.length > 0) && (
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
                      {result.key_players_mentioned.map((p, i) => (
                        <span key={i} style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "3px 10px", fontSize: 13, color: "#166534" }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Events Timeline ── */}
              {events.length > 0 && (
                <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Clock size={16} color="#1a5c2a" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Event Timeline ({events.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {events.map((ev, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        borderLeft: `3px solid ${ev.event_type === "goal" ? "#16a34a" : ev.event_type === "yellow_card" ? "#d97706" : ev.event_type === "red_card" ? "#dc2626" : "#d1d5db"}`,
                        paddingLeft: 10, paddingTop: 4, paddingBottom: 4,
                      }}>
                        <span style={{ minWidth: 32, fontWeight: 700, color: "#1a5c2a", fontSize: 12 }}>
                          {ev.minute != null ? `${ev.minute}′` : "–"}
                        </span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 12, color: "#1a1a1a" }}>
                            {ev.event_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          {ev.player && <span style={{ color: "#1a5c2a", fontWeight: 600, fontSize: 12 }}> · {ev.player}</span>}
                          {ev.team && <span style={{ color: "#888", fontSize: 11 }}> ({ev.team})</span>}
                          <p style={{ color: "#555", fontSize: 12, margin: "2px 0 0" }}>{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setPhase("setup"); setResult(null); setRecordSecs(0); setUploadPct(0); setPushed(false); }}
                  style={{ backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  New Analysis
                </button>
                {!pushed && (
                  <button
                    onClick={() => pushToAnalysisHub(result)}
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
