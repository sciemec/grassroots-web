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
  Clock, Users, ChevronRight, AlertCircle,
} from "lucide-react";
import { uploadVideoInChunksParallel } from "@/lib/upload-chunks";
import { useAuthStore }                from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchEvent {
  timestamp_approx:  string;
  event_type:        string;
  team:              string | null;
  player:            string | null;
  description:       string;
  analyst_emphasis:  "low" | "medium" | "high";
}

interface CommentaryResult {
  events:                MatchEvent[];
  tactical_observations: string[];
  key_players_mentioned: string[];
  summary:               string;
  match_summary:         string;
}

type Phase = "setup" | "recording" | "upload" | "polling" | "done" | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  goal:          "⚽",
  assist:        "🎯",
  yellow_card:   "🟨",
  red_card:      "🟥",
  substitution:  "🔄",
  foul:          "⚠️",
  shot:          "🎯",
  save:          "🧤",
  offside:       "🚩",
  corner:        "🔵",
  free_kick:     "🦶",
  penalty:       "🎯",
  injury:        "🩹",
  tactical_note: "📋",
  other:         "•",
};

const EMPHASIS_STYLE: Record<string, string> = {
  high:   "border-l-4 border-red-400 bg-red-50",
  medium: "border-l-4 border-amber-400 bg-amber-50",
  low:    "border-l-4 border-gray-200 bg-white",
};

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
        {phase === "done" && result && (
          <div>
            {/* Summary card */}
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <CheckCircle size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, color: "#14532d", marginBottom: 4 }}>
                    {homeTeam || "Home"} vs {awayTeam || "Away"} — {sport}
                  </p>
                  {result.match_summary && (
                    <p style={{ color: "#15803d", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{result.match_summary}</p>
                  )}
                  <p style={{ color: "#166534", fontSize: 13 }}>{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Key players */}
            {result.key_players_mentioned?.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Users size={16} color="#1a5c2a" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Players Mentioned</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.key_players_mentioned.map((p, i) => (
                    <span key={i} style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: "2px 10px", fontSize: 13, color: "#166534" }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tactical observations */}
            {result.tactical_observations?.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <AlertCircle size={16} color="#c8962a" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>Tactical Observations</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.tactical_observations.map((obs, i) => (
                    <li key={i} style={{ color: "#444", fontSize: 14, marginBottom: 6 }}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Events timeline */}
            {result.events?.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Clock size={16} color="#1a5c2a" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>
                    Event Timeline ({result.events.length} events)
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.events.map((ev, i) => (
                    <div key={i} className={EMPHASIS_STYLE[ev.analyst_emphasis ?? "low"]} style={{ borderRadius: 8, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 18 }}>{EVENT_ICONS[ev.event_type] ?? "•"}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1a1a1a" }}>
                          {ev.event_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        {ev.timestamp_approx && (
                          <span style={{ backgroundColor: "#1a5c2a", color: "white", borderRadius: 12, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>
                            {ev.timestamp_approx}
                          </span>
                        )}
                        {ev.team && (
                          <span style={{ color: "#666", fontSize: 12 }}>{ev.team}</span>
                        )}
                        {ev.player && (
                          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 12 }}>{ev.player}</span>
                        )}
                      </div>
                      <p style={{ color: "#444", fontSize: 13, margin: 0 }}>{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.events?.length === 0 && (
              <div style={{ backgroundColor: "white", borderRadius: 12, padding: 24, textAlign: "center", color: "#888", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                No specific events were identified in the commentary.
              </div>
            )}

            <button
              onClick={() => { setPhase("setup"); setResult(null); setRecordSecs(0); setUploadPct(0); }}
              style={{ marginTop: 16, backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              New Analysis
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
