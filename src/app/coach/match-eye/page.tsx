"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, CheckCircle2, AlertTriangle, Eye,
  BookOpen, Clock, Target, Shield, Zap,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ──────────────────────────────────────────────────────────────────────

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
}

interface HalfResult {
  analysis: MatchAnalysis;
  narrative: string;
}

interface HalfUploadState {
  stage: "idle" | "uploading" | "uploaded" | "error";
  pct: number;
  fileUri: string;
  fileName: string;
  mimeType: string;
  error: string;
}

type PageStage = "setup" | "analysing" | "results" | "error";

const SPORTS = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Hockey"];

const initHalf = (): HalfUploadState => ({
  stage: "idle", pct: 0, fileUri: "", fileName: "", mimeType: "", error: "",
});

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MatchEyePage() {
  const token = useAuthStore((s) => s.token);

  // Match details
  const [homeTeam,    setHomeTeam]    = useState("");
  const [awayTeam,    setAwayTeam]    = useState("");
  const [competition, setCompetition] = useState("");
  const [sport,       setSport]       = useState("Football");

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

  // File inputs
  const firstRef  = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);

  // ── Upload one half directly to Gemini ──────────────────────────────────────

  const uploadHalf = useCallback(async (file: File, which: "first" | "second") => {
    const setH = which === "first" ? setFirstHalf : setSecondHalf;
    setH((h) => ({ ...h, stage: "uploading", pct: 0, error: "" }));

    // Step 1 — get resumable upload URL from our proxy
    let uploadUrl: string;
    let mimeType: string;
    try {
      const res = await fetch("/api/match-eye/upload", {
        method: "POST",
        headers: {
          "content-type":      file.type || "video/mp4",
          "x-content-length":  String(file.size),
        },
      });
      if (!res.ok) throw new Error(`Session start failed (${res.status})`);
      const data = await res.json() as { uploadUrl: string; mimeType: string };
      uploadUrl = data.uploadUrl;
      mimeType  = data.mimeType;
    } catch (err) {
      setH((h) => ({ ...h, stage: "error", error: err instanceof Error ? err.message : "Could not start upload" }));
      return;
    }

    // Step 2 — upload bytes directly to Google (bypasses Render size limits)
    let fileUri: string;
    let fileName: string;
    try {
      const result = await new Promise<{ file: { uri: string; name: string } }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setH((h) => ({ ...h, pct: Math.round((e.loaded / e.total) * 100) }));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText) as { file: { uri: string; name: string } }); }
            catch { reject(new Error("Unexpected response from Google")); }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.send(file);
      });
      fileUri  = result.file.uri;
      fileName = result.file.name;
    } catch (err) {
      setH((h) => ({ ...h, stage: "error", error: err instanceof Error ? err.message : "Upload failed" }));
      return;
    }

    setH((h) => ({ ...h, stage: "uploaded", pct: 100, fileUri, fileName, mimeType }));
  }, []);

  // ── Analyse both halves in parallel ─────────────────────────────────────────

  const analyse = useCallback(async () => {
    if (firstHalf.stage !== "uploaded" || secondHalf.stage !== "uploaded") return;
    setPageStage("analysing");
    setGlobalError("");

    const analyseHalf = async (half: HalfUploadState, label: string): Promise<HalfResult> => {
      const res = await fetch("/api/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri:     half.fileUri,
          fileName:    half.fileName,
          mimeType:    half.mimeType,
          homeTeam,
          awayTeam,
          competition: competition ? `${competition} — ${label}` : label,
          sport,
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
  }, [firstHalf, secondHalf, homeTeam, awayTeam, competition, sport]);

  const reset = () => {
    setPageStage("setup");
    setFirstHalf(initHalf());
    setSecondHalf(initHalf());
    setFirstResult(null);
    setSecondResult(null);
    setGlobalError("");
    setHomeTeam("");
    setAwayTeam("");
    setCompetition("");
    setSport("Football");
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
            {half.error && <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>{half.error}</div>}
          </div>
        )}

        {half.stage === "uploading" && (
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "20px 16px", background: "#fff" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a5c2a", marginBottom: 8 }}>
              Uploading... {half.pct}%
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 99, height: 5 }}>
              <div style={{ background: "#1a5c2a", borderRadius: 99, height: 5, width: `${half.pct}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Going directly to Google — no server limit</div>
          </div>
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

  function HalfReport({ result, half }: { result: HalfResult; half: "first" | "second" }) {
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

  const canAnalyse = firstHalf.stage === "uploaded" && secondHalf.stage === "uploaded" && homeTeam && awayTeam;

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
            {/* Match details form */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16 }}>
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
            </div>

            {/* Upload zones — only show once team names entered */}
            {homeTeam && awayTeam && (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 4 }}>Upload Match Footage</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                  Videos upload directly to Google — no file size limit. Upload both halves, then click Analyse.
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <UploadZone label="First Half (0–45 min)"   half={firstHalf}  inputRef={firstRef}  onChange={(f) => uploadHalf(f, "first")}  />
                  <UploadZone label="Second Half (45–90 min)" half={secondHalf} inputRef={secondRef} onChange={(f) => uploadHalf(f, "second")} />
                </div>
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
                <Eye size={18} /> Analyse Full Match with Gemini AI
              </button>
            )}
          </>
        )}

        {/* ── ANALYSING ───────────────────────────────────────────────────────── */}
        {pageStage === "analysing" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "48px 24px", textAlign: "center" }}>
            <Eye size={44} style={{ color: "#1a5c2a", marginBottom: 16 }} />
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 8 }}>
              Gemini is watching the match...
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 32, maxWidth: 380, margin: "0 auto 32px" }}>
              {homeTeam} vs {awayTeam} — both halves are being analysed simultaneously.
              This takes 2–5 minutes depending on video length.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340, margin: "0 auto" }}>
              {(["First Half", "Second Half"] as const).map((label) => (
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

        {/* ── RESULTS ─────────────────────────────────────────────────────────── */}
        {pageStage === "results" && firstResult && secondResult && (
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

            {activeTab === "first"  && <HalfReport result={firstResult}  half="first"  />}
            {activeTab === "second" && <HalfReport result={secondResult} half="second" />}

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
