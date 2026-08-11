"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, Upload, CheckCircle2, AlertTriangle, BookOpen,
  Clock, Target, Shield, Zap, Download, GraduationCap, ShieldAlert,
  Database, FileJson, Play, Pause, Mic,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TACTICAL_PRINCIPLES, FORMATION_LIBRARY, type TacticalPrinciple, type FormationDetail } from "@/lib/thuto-tactics-knowledge";
import { downloadCoachMatchEyePdf, downloadCoachHalfPdf } from "@/lib/generate-analysis-pdf";
import { useAuthStore } from "@/lib/auth-store";
import { SUPPORTED_FORMATIONS } from "@/lib/commentary-zones";
import MatchZonePitch from "@/components/analyst/MatchZonePitch";
import { measureFromVideo, type VideoMeasurement } from "@/lib/super-engine";
import { compressVideo } from "@/lib/compress-video";
import {
  uploadVideoInChunksParallel, getUploadAdvisory, type UploadAdvisory,
} from "@/lib/upload-chunks";

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
  player_tracking?: Array<{
    jersey: string;
    name: string;
    position_tendency: string;
    key_moments: string[];
    rating: number;
    improvement: string;
  }>;
  turnover_moments?: Array<{
    time: string;
    pattern: string;
    consequence: string;
    principle_id: string;
    principle_title: string;
    principle_fix: string;
    safety_flag: boolean;
    safety_note?: string;
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

type PageStage = "setup" | "confirm" | "results" | "error";

const SPORTS = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Hockey"];

const initHalf = (): HalfUploadState => ({
  stage: "idle", pct: 0, fileUri: "", fileName: "", mimeType: "", error: "",
});

// Dark theme palette
const D = {
  bg:      "#030712",
  card:    "#18181b",
  card2:   "#09090b",
  border:  "#27272a",
  border2: "#3f3f46",
  text:    "#f4f4f5",
  muted:   "#a1a1aa",
  dim:     "#71717a",
  green:   "#22c55e",
  greenDk: "#16a34a",
  greenBg: "#052e16",
  greenBd: "#14532d",
  red:     "#ef4444",
  redBg:   "#450a0a",
  redBd:   "#7f1d1d",
  amber:   "#f59e0b",
  amberBg: "#451a03",
  blue:    "#3b82f6",
  blueBg:  "#0c1a3a",
} as const;

// ── Commentary types ────────────────────────────────────────────────────────

interface CmtTimelineEvent {
  minute: number | null;
  audio_time_seconds: number | null;
  event_type: string;
  team: string | null;
  player: string | null;
  description: string;
  zone?: string | null;
  zone_source?: string | null;
}

interface CommentaryResult {
  match_info: { home_score: number | null; away_score: number | null; home_formation: string | null; away_formation: string | null; possession_home: number | null; shots_home: number | null; shots_away: number | null; home_xg: number | null; away_xg: number | null; };
  events_timeline: CmtTimelineEvent[];
  key_players_mentioned: string[];
  tactical: { observations: string[]; strengths: string[]; weaknesses: string[]; };
  summary: string;
  match_summary: string;
}

function formatAudioTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Analyst Match Eye ─────────────────────────────────────────────────────────

export default function AnalystMatchEye() {
  const token = useAuthStore((s) => s.token);

  // Match details
  const [homeTeam,    setHomeTeam]    = useState("");
  const [awayTeam,    setAwayTeam]    = useState("");
  const [competition, setCompetition] = useState("");
  const [sport,       setSport]       = useState("Football");

  // Kit colours for supervised team classification
  const [homeKitColor,  setHomeKitColor]  = useState("#ffffff");
  const [awayKitColor,  setAwayKitColor]  = useState("#0000ff");
  const [homeGkColor,   setHomeGkColor]   = useState("#ffff00");
  const [awayGkColor,   setAwayGkColor]   = useState("#00ffff");
  const [refereeColor,  setRefereeColor]  = useState("#000000");
  const [showKitColors, setShowKitColors] = useState(false);

  // Page flow
  const [pageStage,   setPageStage]   = useState<PageStage>("setup");
  const [activeTab,   setActiveTab]   = useState<"first" | "second" | "summary" | "commentary">("first");
  const [globalError, setGlobalError] = useState("");

  // Half upload states
  const [firstHalf,  setFirstHalf]  = useState<HalfUploadState>(initHalf());
  const [secondHalf, setSecondHalf] = useState<HalfUploadState>(initHalf());

  // Results
  const [firstResult,  setFirstResult]  = useState<HalfResult | null>(null);
  const [secondResult, setSecondResult] = useState<HalfResult | null>(null);

  // Super Engine local tracking
  const [firstTracking,  setFirstTracking]  = useState<VideoMeasurement | null>(null);
  const [secondTracking, setSecondTracking] = useState<VideoMeasurement | null>(null);

  // Per-half analysis in-progress flags
  const [firstAnalysing,  setFirstAnalysing]  = useState(false);
  const [secondAnalysing, setSecondAnalysing] = useState(false);

  // File inputs
  const firstRef  = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);

  // Commentary formation state (Football only)
  const [cmtHomeFormation, setCmtHomeFormation] = useState("4-4-2");
  const [cmtAwayFormation, setCmtAwayFormation] = useState("4-4-2");

  // Commentary tab state
  const [cmtPhase,     setCmtPhase]     = useState<"idle" | "uploading" | "analysing" | "done" | "error">("idle");
  const [cmtUploadPct, setCmtUploadPct] = useState(0);
  const [cmtResult,    setCmtResult]    = useState<CommentaryResult | null>(null);
  const [cmtAudioUrl,  setCmtAudioUrl]  = useState("");
  const [cmtPlaying,   setCmtPlaying]   = useState(false);
  const [cmtAudioCur,  setCmtAudioCur]  = useState(0);
  const [cmtAudioDur,  setCmtAudioDur]  = useState(0);
  const [cmtError,     setCmtError]     = useState("");
  const cmtAudioBlobRef = useRef<File | null>(null);
  const cmtAudioRef     = useRef<HTMLAudioElement>(null);
  const cmtEventRefsMap = useRef<Record<number, HTMLDivElement | null>>({});

  // Pre-upload advisory
  const [pendingHalf, setPendingHalf] = useState<"first" | "second" | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [advisory,    setAdvisory]    = useState<UploadAdvisory | null>(null);

  // ── Pre-upload advisory ────────────────────────────────────────────────────

  const confirmHalf = useCallback((file: File, which: "first" | "second") => {
    const adv = getUploadAdvisory(file);
    if (adv.limitError) { setGlobalError(adv.limitError); return; }
    setPendingFile(file);
    setPendingHalf(which);
    setAdvisory(adv);
    setPageStage("confirm");
  }, []);

  // ── Small-file upload path (Gemini direct via proxy) ──────────────────────

  const uploadHalf = useCallback(async (file: File, which: "first" | "second") => {
    const setH = which === "first" ? setFirstHalf : setSecondHalf;
    const setT = which === "first" ? setFirstTracking : setSecondTracking;
    measureFromVideo(file, "team", () => undefined).then(setT).catch(() => undefined);
    setH((h) => ({ ...h, stage: "compressing", pct: 0, error: "" }));
    const fileToUpload = await compressVideo(file, (pct) => setH((h) => ({ ...h, pct })));
    setH((h) => ({ ...h, stage: "uploading", pct: 0 }));
    try {
      const data = await uploadVideoInChunksParallel(fileToUpload, (pct) => setH((h) => ({ ...h, pct })));
      setH((h) => ({ ...h, stage: "uploaded", pct: 100, fileUri: data.fileUri, fileName: data.fileName, mimeType: data.mimeType }));
    } catch (err) {
      setH((h) => ({ ...h, stage: "error", error: err instanceof Error ? err.message : "Upload failed" }));
    }
  }, []);

  // ── Auto-navigate once a half result arrives (e.g. second half while first tab is open) ──

  useEffect(() => {
    if (pageStage !== "setup") return;
    if (firstResult !== null && activeTab !== "first") {
      setPageStage("results");
      setActiveTab("first");
    } else if (secondResult !== null) {
      setPageStage("results");
      setActiveTab("second");
    }
  }, [pageStage, firstResult, secondResult, activeTab]);

  // ── Commentary audio URL cleanup ──────────────────────────────────────────
  useEffect(() => {
    if (!cmtAudioUrl) return;
    return () => URL.revokeObjectURL(cmtAudioUrl);
  }, [cmtAudioUrl]);

  const activeCommentaryEventIdx = useMemo(() => {
    const evs = Array.isArray(cmtResult?.events_timeline) ? cmtResult!.events_timeline : [];
    let idx = -1;
    evs.forEach((ev, i) => {
      if (ev.audio_time_seconds != null && ev.audio_time_seconds <= cmtAudioCur) idx = i;
    });
    return idx;
  }, [cmtResult, cmtAudioCur]);

  useEffect(() => {
    if (activeCommentaryEventIdx >= 0) {
      cmtEventRefsMap.current[activeCommentaryEventIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeCommentaryEventIdx]);

  // ── Analyse — per-half, independent ───────────────────────────────────────

  const analyseIndependent = useCallback(async (which: "first" | "second") => {
    const half      = which === "first" ? firstHalf       : secondHalf;
    const setAnal   = which === "first" ? setFirstAnalysing : setSecondAnalysing;
    const setResult = which === "first" ? setFirstResult   : setSecondResult;
    const label     = which === "first" ? "First Half"     : "Second Half";

    if (half.stage !== "uploaded") return;
    setAnal(true);
    setGlobalError("");
    setPageStage("results");
    setActiveTab(which);

    try {
      const res = await fetch("/api/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri: half.fileUri, fileName: half.fileName, mimeType: half.mimeType,
          sessionType: "match", homeTeam, awayTeam,
          competition: competition ? `${competition} — ${label}` : label,
          sport,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Analysis failed (${res.status})`);
      }
      const result = await res.json() as HalfResult;
      setResult(result);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : `${label} analysis failed. Please try again.`);
      setPageStage("error");
    } finally {
      setAnal(false);
    }
  }, [firstHalf, secondHalf, homeTeam, awayTeam, competition, sport]);

  // ── Commentary upload + analysis ─────────────────────────────────────────
  const uploadCommentary = useCallback(async (file: File) => {
    setCmtPhase("uploading");
    setCmtUploadPct(0);
    setCmtError("");
    cmtAudioBlobRef.current = file;
    try {
      const { fileUri, fileName, mimeType } = await uploadVideoInChunksParallel(
        file,
        (pct) => setCmtUploadPct(pct),
      );
      setCmtPhase("analysing");
      const res = await fetch("/api/analyse-commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUri, fileName, mimeType, homeTeam: homeTeam || "Home", awayTeam: awayTeam || "Away", sport, half: "full", token, homeFormation: sport === "Football" ? cmtHomeFormation : "", awayFormation: sport === "Football" ? cmtAwayFormation : "" }),
      });
      const data = await res.json() as { result?: CommentaryResult; error?: string };
      if (!res.ok || !data.result) throw new Error(data.error || "Analysis failed.");
      setCmtResult(data.result);
      setCmtAudioUrl(URL.createObjectURL(cmtAudioBlobRef.current!));
      setCmtPhase("done");
    } catch (err) {
      setCmtError(err instanceof Error ? err.message : "Upload or analysis failed. Please try again.");
      setCmtPhase("error");
    }
  }, [homeTeam, awayTeam, sport, token]);

  const reset = () => {
    setPageStage("setup");
    setFirstHalf(initHalf()); setSecondHalf(initHalf());
    setFirstResult(null); setSecondResult(null);
    setFirstTracking(null); setSecondTracking(null);
    setGlobalError(""); setHomeTeam(""); setAwayTeam(""); setCompetition(""); setSport("Football");
    setPendingFile(null); setPendingHalf(null); setAdvisory(null);
  };

  // ── Analyst helpers ────────────────────────────────────────────────────────

  const downloadAsJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Sub-components (dark theme) ────────────────────────────────────────────

  function DStatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: D.green }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: D.muted, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: D.dim, marginTop: 2 }}>{sub}</div>}
      </div>
    );
  }

  function DUploadProgress({ pct }: { pct: number }) {
    const startRef = useRef<{ time: number; pct: number } | null>(null);
    const [eta, setEta] = useState("");
    if (!startRef.current && pct > 0) startRef.current = { time: Date.now(), pct };
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
      <div style={{ border: `1.5px solid ${D.border}`, borderRadius: 12, padding: "20px 16px", background: D.card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: D.green }}>Uploading... {pct}%</div>
          {eta && <div style={{ fontSize: 11, color: D.dim }}>{eta}</div>}
        </div>
        <div style={{ background: D.border, borderRadius: 99, height: 5 }}>
          <div style={{ background: D.green, borderRadius: 99, height: 5, width: `${pct}%`, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: 11, color: D.dim, marginTop: 6 }}>Sending to Google for Gemini analysis</div>
      </div>
    );
  }

  function DUploadZone({ label, half, inputRef, onChange }: {
    label: string; half: HalfUploadState;
    inputRef: React.RefObject<HTMLInputElement>; onChange: (f: File) => void;
  }) {
    return (
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 8 }}>{label}</div>

        {(half.stage === "idle" || half.stage === "error") && (
          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${half.stage === "error" ? D.red : D.border2}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: D.card }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = D.green; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = half.stage === "error" ? D.red : D.border2; }}
          >
            <Upload size={26} style={{ color: D.dim, marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: D.muted, fontWeight: 600 }}>Click to upload</div>
            <div style={{ fontSize: 11, color: D.dim, marginTop: 3 }}>MP4, MOV, AVI — any size</div>
            <div style={{ fontSize: 11, color: D.dim, marginTop: 2 }}>Keep camera steady — avoid panning for best ball tracking</div>
            {half.error && <div style={{ marginTop: 8, fontSize: 12, color: D.red }}>{half.error}</div>}
          </div>
        )}

        {half.stage === "compressing" && (
          <div style={{ border: `1.5px solid ${D.border}`, borderRadius: 12, padding: "20px 16px", background: D.card }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: D.green, marginBottom: 8 }}>
              Preparing video... {half.pct > 0 ? `${half.pct}%` : ""}
            </div>
            <div style={{ background: D.border, borderRadius: 99, height: 5, overflow: "hidden" }}>
              <div style={{ background: D.green, borderRadius: 99, height: 5, width: half.pct > 0 ? `${half.pct}%` : "40%", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, color: D.dim, marginTop: 6 }}>Compressing to 720p — faster upload</div>
          </div>
        )}

        {half.stage === "uploading" && <DUploadProgress pct={half.pct} />}


        {half.stage === "uploaded" && (
          <div style={{ border: `2px solid ${D.greenBd}`, borderRadius: 12, padding: "18px 16px", background: D.greenBg, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={20} style={{ color: D.green, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: D.green }}>Uploaded</div>
              <div style={{ fontSize: 11, color: D.muted }}>Ready for Gemini analysis</div>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
      </div>
    );
  }

  // Tactical keyword matching (same as coach hub)
  const PRINCIPLE_KEYWORDS: Record<string, string[]> = {
    "pressing":          ["press high", "pressed high", "pressing", "high press", "counter-press"],
    "defensive-block":   ["compact", "defensive block", "defensive shape", "low block", "deep defensive", "defensive line", "back line", "exposed", "shape"],
    "counter-attack":    ["counter-attack", "counter-attacking", "transition", "on transition", "fast break"],
    "width-attack":      ["right channel", "left channel", "wide area", "width", "overlap", "overlapping", "winger", "cross"],
    "pass-and-move":     ["combination play", "link play", "one-touch", "possession", "pass and move"],
    "set-pieces-attack": ["set piece", "corner", "free kick", "dead ball"],
  };

  function matchTacticalRef(a: MatchAnalysis): { principles: TacticalPrinciple[]; formations: FormationDetail[] } {
    const corpus = [...(a.tactical_patterns ?? []), ...(a.defensive_issues ?? []), ...(a.attacking_strengths ?? [])].join(" ").toLowerCase();
    const matchedIds = new Set(Object.entries(PRINCIPLE_KEYWORDS).filter(([, kws]) => kws.some((kw) => corpus.includes(kw))).map(([id]) => id));
    return {
      principles: TACTICAL_PRINCIPLES.filter((p) => matchedIds.has(p.id)),
      formations: FORMATION_LIBRARY.filter((f) => corpus.includes(f.code.toLowerCase())),
    };
  }

  // Turnover patterns (dark-themed)
  function DTeamTurnoverInsights({ analysis }: { analysis: MatchAnalysis }) {
    const moments = analysis.turnover_moments ?? [];
    if (moments.length === 0) return null;
    return (
      <div style={{ border: `1.5px solid ${D.redBd}`, borderRadius: 12, overflow: "hidden", background: D.card }}>
        <div style={{ background: D.redBg, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: D.red, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldAlert size={14} style={{ color: D.red }} />
            Team Turnover Patterns
          </div>
          <a href="/coach/tactics/learn?tab=principles" style={{ fontSize: 11, color: D.green, fontWeight: 600, textDecoration: "none" }}>
            Tactics Academy →
          </a>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {moments.map((m, i) => (
            <div key={i} style={{ borderTop: i > 0 ? `1px solid ${D.border}` : "none", paddingTop: i > 0 ? 14 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: D.redBg, color: D.red, padding: "2px 8px", borderRadius: 20 }}>{m.time}</span>
                {m.safety_flag && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: D.red, color: "#fff", padding: "2px 8px", borderRadius: 20 }}>⚡ Collision Risk</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: D.text, margin: "0 0 4px" }}><strong>Pattern:</strong> {m.pattern}</p>
              <p style={{ fontSize: 12, color: D.muted, margin: "0 0 8px" }}><strong>Result:</strong> {m.consequence}</p>
              {m.safety_flag && m.safety_note && (
                <div style={{ background: D.redBg, border: `1px solid ${D.redBd}`, borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: "#fca5a5" }}>
                  ⚠️ {m.safety_note}
                </div>
              )}
              <div style={{ background: D.greenBg, border: `1px solid ${D.greenBd}`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: D.green, marginBottom: 4 }}>{m.principle_title} — Tactics Academy Fix</div>
                <p style={{ fontSize: 12, color: D.muted, margin: "0 0 8px" }}>{m.principle_fix}</p>
                <a href={`/coach/tactics/learn?principle=${m.principle_id}`} style={{ fontSize: 11, fontWeight: 700, color: D.green, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <GraduationCap size={12} /> Study in Tactics Academy →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Tactical Academy callout (dark-themed)
  function DTacticalCallout({ analysis }: { analysis: MatchAnalysis }) {
    const refs = matchTacticalRef(analysis);
    if (refs.principles.length === 0 && refs.formations.length === 0) return null;
    return (
      <div style={{ background: D.greenBg, border: `1.5px solid ${D.greenBd}`, borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: D.green, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <GraduationCap size={14} /> Study in Tactical Academy
        </div>
        <p style={{ fontSize: 12, color: D.muted, margin: "0 0 10px" }}>Based on this match, these topics may help:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {refs.principles.map((p) => (
            <Link key={p.id} href="/coach/tactics/learn?tab=principles" style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, textDecoration: "none", background: D.green, color: "#030712", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {p.title} →
            </Link>
          ))}
          {refs.formations.map((f) => (
            <Link key={f.code} href="/coach/tactics/learn?tab=formations" style={{ fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8, textDecoration: "none", background: D.amber, color: "#030712", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {f.code} Formation →
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Raw stats panel (analyst-exclusive)
  function RawStatsPanel({ first, second }: { first: MatchAnalysis; second: MatchAnalysis }) {
    const rows = [
      { label: "Formation (Home)",       h1: first.formation_home ?? "—",                        h2: second.formation_home ?? "—" },
      { label: "Formation (Away)",        h1: first.formation_away ?? "—",                        h2: second.formation_away ?? "—" },
      { label: "Possession Home %",       h1: String(first.possession_home ?? "—"),               h2: String(second.possession_home ?? "—") },
      { label: "Possession Away %",       h1: String(first.possession_away ?? "—"),               h2: String(second.possession_away ?? "—") },
      { label: "Shots Home",              h1: String(first.shots_home ?? "—"),                    h2: String(second.shots_home ?? "—") },
      { label: "Shots Away",              h1: String(first.shots_away ?? "—"),                    h2: String(second.shots_away ?? "—") },
      { label: "Shots on Target Home",    h1: String(first.shots_on_target_home ?? "—"),          h2: String(second.shots_on_target_home ?? "—") },
      { label: "Shots on Target Away",    h1: String(first.shots_on_target_away ?? "—"),          h2: String(second.shots_on_target_away ?? "—") },
      { label: "Fouls Detected",          h1: String(first.fouls_detected ?? "—"),               h2: String(second.fouls_detected ?? "—") },
      { label: "Key Events Count",        h1: String(first.key_events?.length ?? 0),             h2: String(second.key_events?.length ?? 0) },
      { label: "Turnover Patterns",       h1: String(first.turnover_moments?.length ?? 0),       h2: String(second.turnover_moments?.length ?? 0) },
    ];
    return (
      <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${D.border}`, display: "flex", alignItems: "center", gap: 6 }}>
          <Database size={14} style={{ color: D.blue }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: D.text }}>Raw Data Export</span>
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: D.blueBg, color: D.blue, padding: "2px 8px", borderRadius: 99 }}>ANALYST</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: D.card2 }}>
                <th style={{ textAlign: "left", padding: "8px 16px", color: D.dim, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${D.border}` }}>Metric</th>
                <th style={{ textAlign: "center", padding: "8px 16px", color: D.muted, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${D.border}` }}>1st Half</th>
                <th style={{ textAlign: "center", padding: "8px 16px", color: D.muted, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${D.border}` }}>2nd Half</th>
                <th style={{ textAlign: "center", padding: "8px 16px", color: D.muted, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${D.border}` }}>Full Match</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const n1 = parseFloat(r.h1); const n2 = parseFloat(r.h2);
                const total = !isNaN(n1) && !isNaN(n2) ? String(n1 + n2) : "—";
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${D.border}`, background: i % 2 === 0 ? "transparent" : D.card2 }}>
                    <td style={{ padding: "9px 16px", color: D.muted }}>{r.label}</td>
                    <td style={{ padding: "9px 16px", color: D.text, textAlign: "center", fontWeight: 600 }}>{r.h1}</td>
                    <td style={{ padding: "9px 16px", color: D.text, textAlign: "center", fontWeight: 600 }}>{r.h2}</td>
                    <td style={{ padding: "9px 16px", color: D.green, textAlign: "center", fontWeight: 700 }}>{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Half analysis report (dark-themed)
  function DHalfReport({ result, half, tracking }: { result: HalfResult; half: "first" | "second"; tracking: VideoMeasurement | null }) {
    const a = result.analysis;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
          <DStatBox label="Home Formation"    value={a.formation_home || "—"} />
          <DStatBox label="Away Formation"    value={a.formation_away || "—"} />
          <DStatBox label="Possession (Home)" value={`${a.possession_home ?? "—"}%`} sub={`Away ${a.possession_away ?? "—"}%`} />
          <DStatBox label="Shots (Home)"      value={String(a.shots_home ?? "—")}    sub={`On target: ${a.shots_on_target_home ?? "—"}`} />
          <DStatBox label="Shots (Away)"      value={String(a.shots_away ?? "—")}    sub={`On target: ${a.shots_on_target_away ?? "—"}`} />
          <DStatBox label="Fouls Detected"    value={String(a.fouls_detected ?? "—")} />
        </div>

        {/* Narrative */}
        {result.narrative && (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={15} style={{ color: D.green }} /> Tactical Report
            </div>
            <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.75, whiteSpace: "pre-line" }}>{result.narrative}</div>
          </div>
        )}

        {/* Key events */}
        {(a.key_events?.length ?? 0) > 0 && (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={15} style={{ color: D.green }} /> Key Events
            </div>
            <div style={{ display: "flex", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
              {[{ color: "#60a5fa", label: homeTeam || "Home" }, { color: "#f87171", label: awayTeam || "Away" }, { color: D.dim, label: "Neutral" }].map(({ color, label }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: D.dim }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} /> {label}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {a.key_events.map((ev, i) => {
                const teamColor = ev.team === "home" ? "#60a5fa" : ev.team === "away" ? "#f87171" : D.dim;
                return (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderLeft: `3px solid ${teamColor}`, paddingLeft: 10, paddingTop: 3, paddingBottom: 3 }}>
                    {ev.time && <span style={{ fontSize: 12, fontWeight: 700, color: teamColor, minWidth: 46, flexShrink: 0 }}>{ev.time}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: D.card2, color: teamColor }}>
                      {ev.team === "home" ? (homeTeam || "Home") : ev.team === "away" ? (awayTeam || "Away") : "–"}
                    </span>
                    <span style={{ fontSize: 13, color: D.muted }}><strong style={{ color: D.text }}>{ev.type}</strong> — {ev.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tactical patterns */}
        {(a.tactical_patterns?.length ?? 0) > 0 && (
          <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Target size={13} style={{ color: D.blue }} /> Tactical Patterns
            </div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.tactical_patterns.map((p, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 4 }}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Strengths vs Issues */}
        {((a.attacking_strengths?.length ?? 0) > 0 || (a.defensive_issues?.length ?? 0) > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {(a.attacking_strengths?.length ?? 0) > 0 && (
              <div style={{ background: D.greenBg, border: `1.5px solid ${D.greenBd}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: D.green, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={13} style={{ color: D.green }} /> Attacking Strengths
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {a.attacking_strengths.map((s, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 4 }}>{s}</li>)}
                </ul>
              </div>
            )}
            {(a.defensive_issues?.length ?? 0) > 0 && (
              <div style={{ background: D.redBg, border: `1.5px solid ${D.redBd}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: D.red, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield size={13} style={{ color: D.red }} /> Defensive Issues
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {a.defensive_issues.map((d, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 4 }}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tactical Academy cross-reference */}
        <DTacticalCallout analysis={a} />

        {/* Turnover patterns */}
        <DTeamTurnoverInsights analysis={a} />

        {/* Session Recommendations (renamed from Coaching Points) */}
        {(a.key_coaching_points?.length ?? 0) > 0 && (
          <div style={{ background: D.greenBg, border: `1.5px solid ${D.greenBd}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: D.green, marginBottom: 8 }}>Session Recommendations</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {a.key_coaching_points.map((p, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 5 }}>{p}</li>)}
            </ul>
          </div>
        )}

        {/* Man of match + halftime rec */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {a.man_of_match_candidate && (
            <div style={{ background: D.amberBg, border: `1px solid #78350f`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: D.amber, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Man of the Match</div>
              <div style={{ fontSize: 13, color: D.muted }}>{a.man_of_match_candidate}</div>
            </div>
          )}
          {half === "first" && a.halftime_recommendation && (
            <div style={{ background: D.blueBg, border: `1px solid #1e3a5f`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: D.blue, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Halftime Recommendation</div>
              <div style={{ fontSize: 13, color: D.muted }}>{a.halftime_recommendation}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── canAnalyse guard ───────────────────────────────────────────────────────

  const canAnalyseFirst  = firstHalf.stage  === "uploaded" && !firstResult  && !firstAnalysing  && homeTeam && awayTeam;
  const canAnalyseSecond = secondHalf.stage === "uploaded" && !secondResult && !secondAnalysing && homeTeam && awayTeam;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-gray-950 text-white" style={{ fontFamily: "system-ui,sans-serif" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">

        {/* Sticky header */}
        <div style={{ background: D.card, borderBottom: `1px solid ${D.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
          <Link href="/analyst" style={{ display: "flex", alignItems: "center", gap: 4, color: D.muted, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Analyst Hub
          </Link>
          <div style={{ width: 1, height: 20, background: D.border }} />
          <Eye size={18} style={{ color: D.green }} />
          <span style={{ fontWeight: 800, fontSize: 16, color: D.text }}>Match Eye</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: D.blueBg, color: D.blue, padding: "2px 8px", borderRadius: 99 }}>ANALYST</span>
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: D.greenBg, color: D.green, padding: "2px 10px", borderRadius: 99, border: `1px solid ${D.greenBd}` }}>
            Gemini 2.5 Flash
          </span>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>

          {/* ── SETUP ──────────────────────────────────────────────────────── */}
          {pageStage === "setup" && (
            <>
              {/* Match details */}
              <div style={{ background: D.card, borderRadius: 14, border: `1px solid ${D.border}`, padding: "20px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: D.text, marginBottom: 16 }}>Match Details</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, display: "block", marginBottom: 4 }}>Home Team *</label>
                    <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="e.g. Dynamos FC"
                      style={{ width: "100%", background: D.card2, border: `1.5px solid ${D.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", color: D.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, display: "block", marginBottom: 4 }}>Away Team *</label>
                    <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="e.g. Highlanders FC"
                      style={{ width: "100%", background: D.card2, border: `1.5px solid ${D.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", color: D.text }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, display: "block", marginBottom: 4 }}>Competition</label>
                    <input value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="e.g. Premier League"
                      style={{ width: "100%", background: D.card2, border: `1.5px solid ${D.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", color: D.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: D.muted, display: "block", marginBottom: 4 }}>Sport</label>
                    <select value={sport} onChange={(e) => setSport(e.target.value)}
                      style={{ width: "100%", background: D.card2, border: `1.5px solid ${D.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box", color: D.text }}>
                      {SPORTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Kit colours — optional */}
                <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowKitColors((v) => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: showKitColors ? 12 : 0 }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Kit Colours</span>
                    <span style={{ fontSize: 11, color: D.dim, fontWeight: 500 }}>optional — improves player classification accuracy</span>
                    <span style={{ fontSize: 10, color: D.dim, marginLeft: "auto" }}>{showKitColors ? "▲" : "▼"}</span>
                  </button>
                  {showKitColors && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Home Kit",        value: homeKitColor, set: setHomeKitColor },
                        { label: "Away Kit",         value: awayKitColor, set: setAwayKitColor },
                        { label: "Home Goalkeeper",  value: homeGkColor,  set: setHomeGkColor  },
                        { label: "Away Goalkeeper",  value: awayGkColor,  set: setAwayGkColor  },
                        { label: "Referee Kit",      value: refereeColor, set: setRefereeColor },
                      ].map(({ label, value, set }) => (
                        <label key={label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input type="color" value={value} onChange={(e) => set(e.target.value)}
                            style={{ height: 32, width: 48, borderRadius: 6, border: `1.5px solid ${D.border}`, cursor: "pointer", padding: 2, background: D.card2 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: D.text }}>{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload zones */}
              {homeTeam && awayTeam && (
                <div style={{ background: D.card, borderRadius: 14, border: `1px solid ${D.border}`, padding: "20px", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: D.text, marginBottom: 4 }}>Upload Match Footage</div>
                  <div style={{ fontSize: 13, color: D.dim, marginBottom: 16 }}>Upload each half independently — analyse as soon as each is ready. You don&apos;t need to wait for both.</div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>

                    {/* First half */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <DUploadZone label="First Half (0–45 min)" half={firstHalf} inputRef={firstRef} onChange={(f) => confirmHalf(f, "first")} />
                      {canAnalyseFirst && (
                        <button onClick={() => analyseIndependent("first")}
                          style={{ width: "100%", marginTop: 8, background: D.green, color: "#030712", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Eye size={14} /> Analyse First Half
                        </button>
                      )}
                      {firstAnalysing && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: D.greenBg, border: `1px solid ${D.greenBd}`, borderRadius: 8, fontSize: 12, color: D.green }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: D.green, animation: "analyst-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
                          Gemini is analysing first half...
                        </div>
                      )}
                    </div>

                    {/* Second half */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <DUploadZone label="Second Half (45–90 min)" half={secondHalf} inputRef={secondRef} onChange={(f) => confirmHalf(f, "second")} />
                      {canAnalyseSecond && (
                        <button onClick={() => analyseIndependent("second")}
                          style={{ width: "100%", marginTop: 8, background: D.green, color: "#030712", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Eye size={14} /> Analyse Second Half
                        </button>
                      )}
                      {secondAnalysing && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: D.greenBg, border: `1px solid ${D.greenBd}`, borderRadius: 8, fontSize: 12, color: D.green }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: D.green, animation: "analyst-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
                          Gemini is analysing second half...
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CONFIRM UPLOAD ─────────────────────────────────────────────── */}
          {pageStage === "confirm" && advisory && pendingFile && pendingHalf && (
            <div style={{ background: D.card, borderRadius: 14, border: `1px solid ${D.border}`, padding: "32px 24px", maxWidth: 480, margin: "0 auto" }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: D.text, marginBottom: 4 }}>Ready to upload?</div>
              <div style={{ fontSize: 13, color: D.muted, marginBottom: 20 }}>
                {pendingHalf === "first" ? "First Half (0–45 min)" : "Second Half (45–90 min)"}
              </div>
              <div style={{ background: D.card2, borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: D.muted }}>File</span>
                  <span style={{ fontWeight: 600, color: D.text, maxWidth: 260, textAlign: "right", wordBreak: "break-all" }}>{pendingFile.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: D.muted }}>Size</span>
                  <span style={{ fontWeight: 600, color: D.text }}>{advisory.sizeMB.toFixed(0)} MB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: D.muted }}>Est. upload time</span>
                  <span style={{ fontWeight: 600, color: D.text }}>{advisory.estimatedTime}</span>
                </div>
              </div>
              {advisory.sizeWarning && (
                <div style={{ background: D.amberBg, border: `1px solid #92400e`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: D.amber }}>
                  ⚠️ {advisory.sizeWarning}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setPageStage("setup"); setPendingFile(null); setPendingHalf(null); setAdvisory(null); }}
                  style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: `1px solid ${D.border}`, background: D.card2, fontWeight: 600, fontSize: 14, color: D.muted, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={() => {
                  const file = pendingFile!; const which = pendingHalf!;
                  setPendingFile(null); setPendingHalf(null); setAdvisory(null); setPageStage("setup");
                  uploadHalf(file, which);
                }}
                  style={{ flex: 2, padding: "11px 0", borderRadius: 8, border: "none", background: D.green, fontWeight: 700, fontSize: 14, color: "#030712", cursor: "pointer" }}>
                  Start Upload
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ──────────────────────────────────────────────────────── */}
          {pageStage === "error" && (
            <div style={{ background: D.card, borderRadius: 14, border: `1.5px solid ${D.redBd}`, padding: "36px 24px", textAlign: "center" }}>
              <AlertTriangle size={36} style={{ color: D.red, marginBottom: 12 }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: D.text, marginBottom: 8 }}>{globalError}</div>
              <button onClick={() => { setPageStage("setup"); setGlobalError(""); }}
                style={{ background: D.green, color: "#030712", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                Try Again
              </button>
            </div>
          )}

          {/* ── RESULTS ────────────────────────────────────────────────────── */}
          {pageStage === "results" && (firstResult || secondResult || firstAnalysing || secondAnalysing) && (
            <div>
              {/* Match banner */}
              <div style={{ background: D.greenBg, border: `1px solid ${D.greenBd}`, borderRadius: 14, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: D.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>{competition || sport} — Full Match Analysis</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: D.text, marginTop: 2 }}>{homeTeam} vs {awayTeam}</div>
                </div>
                <Eye size={28} style={{ color: D.greenBd }} />
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, background: D.card, borderRadius: 10, padding: 4, border: `1px solid ${D.border}`, marginBottom: 16 }}>
                {(["first", "second", "summary", "commentary"] as const).map((t) => {
                  const summaryDisabled = t === "summary" && (!firstResult || !secondResult);
                  return (
                    <button key={t}
                      onClick={() => { if (!summaryDisabled) setActiveTab(t); }}
                      style={{ flex: 1, padding: "9px 6px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: summaryDisabled ? "not-allowed" : "pointer", background: activeTab === t ? D.green : "transparent", color: activeTab === t ? "#030712" : summaryDisabled ? D.dim : D.muted, transition: "background 0.15s", opacity: summaryDisabled ? 0.45 : 1 }}>
                      {t === "first" ? "1st Half" : t === "second" ? "2nd Half" : t === "summary" ? "Full Match" : "Commentary"}
                    </button>
                  );
                })}
              </div>

              {activeTab === "first" && (
                firstAnalysing
                  ? <div style={{ background: D.card, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: D.green, animation: "analyst-pulse 1.5s ease-in-out infinite", margin: "0 auto 16px" }} />
                      <div style={{ fontWeight: 700, fontSize: 15, color: D.text, marginBottom: 6 }}>Gemini is analysing the first half...</div>
                      <div style={{ fontSize: 12, color: D.dim }}>This takes 2–5 minutes. You can upload and analyse the second half while you wait.</div>
                    </div>
                  : firstResult
                    ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <DHalfReport result={firstResult} half="first" tracking={firstTracking} />
                          <button
                            onClick={() => downloadCoachHalfPdf(firstResult, "First Half", homeTeam, awayTeam, sport, competition)}
                            style={{ flex: 1, background: D.green, color: "#030712", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            <Download size={16} /> Download First Half PDF
                          </button>
                        </div>
                      )
                    : <div style={{ background: D.card, borderRadius: 12, padding: "36px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: D.dim, marginBottom: 12 }}>First half not yet analysed.</div>
                        <button onClick={() => setPageStage("setup")}
                          style={{ background: D.green, color: "#030712", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Go back to upload
                        </button>
                      </div>
              )}
              {activeTab === "second" && (
                secondAnalysing
                  ? <div style={{ background: D.card, borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: D.green, animation: "analyst-pulse 1.5s ease-in-out infinite", margin: "0 auto 16px" }} />
                      <div style={{ fontWeight: 700, fontSize: 15, color: D.text, marginBottom: 6 }}>Gemini is analysing the second half...</div>
                      <div style={{ fontSize: 12, color: D.dim }}>This takes 2–5 minutes.</div>
                    </div>
                  : secondResult
                    ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <DHalfReport result={secondResult} half="second" tracking={secondTracking} />
                          <button
                            onClick={() => downloadCoachHalfPdf(secondResult, "Second Half", homeTeam, awayTeam, sport, competition)}
                            style={{ flex: 1, background: D.green, color: "#030712", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            <Download size={16} /> Download Second Half PDF
                          </button>
                        </div>
                      )
                    : <div style={{ background: D.card, borderRadius: 12, padding: "36px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 13, color: D.dim, marginBottom: 12 }}>Second half not yet analysed.</div>
                        <button onClick={() => setPageStage("setup")}
                          style={{ background: D.green, color: "#030712", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Go back to upload
                        </button>
                      </div>
              )}

              {activeTab === "summary" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Combined stat boxes */}
                  <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "20px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: D.text, marginBottom: 14 }}>Full Match Stats</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
                      <DStatBox label="Total Shots (Home)" value={String((firstResult.analysis.shots_home ?? 0) + (secondResult.analysis.shots_home ?? 0))} sub={`On target: ${(firstResult.analysis.shots_on_target_home ?? 0) + (secondResult.analysis.shots_on_target_home ?? 0)}`} />
                      <DStatBox label="Total Shots (Away)" value={String((firstResult.analysis.shots_away ?? 0) + (secondResult.analysis.shots_away ?? 0))} sub={`On target: ${(firstResult.analysis.shots_on_target_away ?? 0) + (secondResult.analysis.shots_on_target_away ?? 0)}`} />
                      <DStatBox label="Possession 1H"      value={`${firstResult.analysis.possession_home ?? "—"}%`}  sub="Home team" />
                      <DStatBox label="Possession 2H"      value={`${secondResult.analysis.possession_home ?? "—"}%`} sub="Home team" />
                      <DStatBox label="Total Fouls"        value={String((firstResult.analysis.fouls_detected ?? 0) + (secondResult.analysis.fouls_detected ?? 0))} />
                    </div>
                  </div>

                  {/* Raw data table (analyst exclusive) */}
                  <RawStatsPanel first={firstResult.analysis} second={secondResult.analysis} />

                  {/* Full match session recommendations */}
                  <div style={{ background: D.greenBg, border: `1.5px solid ${D.greenBd}`, borderRadius: 12, padding: "18px 20px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: D.green, marginBottom: 12 }}>Full Match Session Recommendations</div>
                    {(firstResult.analysis.key_coaching_points?.length ?? 0) > 0 && (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 11, color: D.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>First Half</div>
                        <ul style={{ margin: "0 0 14px", paddingLeft: 16 }}>
                          {firstResult.analysis.key_coaching_points.map((p, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 5 }}>{p}</li>)}
                        </ul>
                      </>
                    )}
                    {(secondResult.analysis.key_coaching_points?.length ?? 0) > 0 && (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 11, color: D.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Second Half</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {secondResult.analysis.key_coaching_points.map((p, i) => <li key={i} style={{ fontSize: 13, color: D.muted, marginBottom: 5 }}>{p}</li>)}
                        </ul>
                      </>
                    )}
                  </div>

                  {/* Man of match */}
                  {secondResult.analysis.man_of_match_candidate && (
                    <div style={{ background: D.amberBg, border: `1px solid #78350f`, borderRadius: 10, padding: "16px 18px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: D.amber, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Man of the Match — Full Game</div>
                      <div style={{ fontSize: 14, color: D.muted }}>{secondResult.analysis.man_of_match_candidate}</div>
                    </div>
                  )}

                  {/* Export buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => downloadCoachMatchEyePdf(firstResult, secondResult, homeTeam, awayTeam, sport, competition)}
                      style={{ flex: 1, background: D.green, color: "#030712", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <Download size={16} /> Download PDF Report
                    </button>
                    <button
                      onClick={() => downloadAsJSON({ homeTeam, awayTeam, competition, sport, first: firstResult, second: secondResult }, `match-eye-${homeTeam}-vs-${awayTeam}.json`)}
                      style={{ flex: 1, background: D.card, color: D.muted, border: `1.5px solid ${D.border}`, borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <FileJson size={16} /> Export JSON
                    </button>
                  </div>

                  <button onClick={reset} style={{ background: D.card2, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    Analyse Another Match
                  </button>
                </div>
              )}

              {/* Commentary Tab */}
              {activeTab === "commentary" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <audio ref={cmtAudioRef} src={cmtAudioUrl || undefined} style={{ display: "none" }}
                    onTimeUpdate={() => setCmtAudioCur(cmtAudioRef.current?.currentTime ?? 0)}
                    onDurationChange={() => setCmtAudioDur(cmtAudioRef.current?.duration ?? 0)}
                    onEnded={() => setCmtPlaying(false)}
                    onPlay={() => setCmtPlaying(true)}
                    onPause={() => setCmtPlaying(false)} />

                  {/* Upload area */}
                  {cmtPhase === "idle" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* Formation selects — Football only */}
                      {sport === "Football" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: D.muted, marginBottom: 4 }}>{homeTeam || "Home"} Formation</label>
                            <select value={cmtHomeFormation} onChange={(e) => setCmtHomeFormation(e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.text, boxSizing: "border-box" }}>
                              {SUPPORTED_FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: D.muted, marginBottom: 4 }}>{awayTeam || "Away"} Formation</label>
                            <select value={cmtAwayFormation} onChange={(e) => setCmtAwayFormation(e.target.value)}
                              style={{ width: "100%", padding: "8px 10px", background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.text, boxSizing: "border-box" }}>
                              {SUPPORTED_FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: D.card2, border: `2px dashed ${D.border2}`, borderRadius: 14, padding: "36px 20px", cursor: "pointer" }}>
                        <Mic size={28} color={D.green} />
                        <div style={{ fontWeight: 700, fontSize: 14, color: D.text }}>Upload Audio Commentary</div>
                        <div style={{ fontSize: 12, color: D.muted, textAlign: "center" }}>Record your spoken commentary during the match, then upload here.<br />Gemini extracts every event, player, and tactical note.</div>
                        <div style={{ fontSize: 11, color: D.dim }}>Accepts mp3, m4a, wav, webm, ogg</div>
                        <input type="file" accept="audio/*" style={{ display: "none" }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCommentary(f); e.target.value = ""; }} />
                      </label>
                    </div>
                  )}

                  {/* Uploading */}
                  {cmtPhase === "uploading" && (
                    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: "28px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: D.muted, marginBottom: 12 }}>Uploading audio…</div>
                      <div style={{ background: D.card2, borderRadius: 99, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${cmtUploadPct}%`, background: D.green, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ fontSize: 12, color: D.dim, marginTop: 8 }}>{cmtUploadPct}%</div>
                    </div>
                  )}

                  {/* Analysing */}
                  {cmtPhase === "analysing" && (
                    <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: D.green, animation: "analyst-pulse 1.5s ease-in-out infinite", margin: "0 auto 14px" }} />
                      <div style={{ fontSize: 13, color: D.muted }}>Gemini is transcribing and extracting match events…</div>
                      <div style={{ fontSize: 11, color: D.dim, marginTop: 6 }}>This takes 20–60 seconds</div>
                    </div>
                  )}

                  {/* Error */}
                  {cmtPhase === "error" && (
                    <div style={{ background: D.redBg, border: `1px solid ${D.redBd}`, borderRadius: 12, padding: "16px 18px" }}>
                      <div style={{ fontSize: 13, color: D.red, marginBottom: 10 }}>{cmtError}</div>
                      <button onClick={() => setCmtPhase("idle")} style={{ background: D.card, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>Try Again</button>
                    </div>
                  )}

                  {/* Results */}
                  {cmtPhase === "done" && cmtResult && (
                    <>
                      {/* Audio player */}
                      {cmtAudioUrl && (
                        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <button
                            onClick={() => { const el = cmtAudioRef.current; if (!el) return; cmtPlaying ? el.pause() : void el.play(); }}
                            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: D.green, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {cmtPlaying ? <Pause size={16} color="#030712" /> : <Play size={16} color="#030712" />}
                          </button>
                          <input type="range" min={0} max={cmtAudioDur || 1} step={0.5} value={cmtAudioCur}
                            onChange={(e) => { const t = parseFloat(e.target.value); setCmtAudioCur(t); if (cmtAudioRef.current) cmtAudioRef.current.currentTime = t; }}
                            style={{ flex: 1, accentColor: D.green }} />
                          <span style={{ fontSize: 12, color: D.muted, whiteSpace: "nowrap" }}>{formatAudioTime(cmtAudioCur)} / {formatAudioTime(cmtAudioDur)}</span>
                        </div>
                      )}

                      {/* Zone pitch tracker */}
                      <MatchZonePitch
                        events={cmtResult.events_timeline}
                        audioCur={cmtAudioCur}
                        homeTeam={homeTeam || "Home"}
                        awayTeam={awayTeam || "Away"}
                      />

                      {/* Match summary */}
                      {cmtResult.match_summary && (
                        <div style={{ background: D.greenBg, border: `1.5px solid ${D.greenBd}`, borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: D.green, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Match Summary</div>
                          <div style={{ fontSize: 13, color: D.muted }}>{cmtResult.match_summary}</div>
                        </div>
                      )}

                      {/* Stats row */}
                      {cmtResult.match_info && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8 }}>
                          {cmtResult.match_info.home_score != null && <DStatBox label="Score (Home)" value={String(cmtResult.match_info.home_score)} />}
                          {cmtResult.match_info.away_score != null && <DStatBox label="Score (Away)" value={String(cmtResult.match_info.away_score)} />}
                          {cmtResult.match_info.possession_home != null && <DStatBox label="Possession" value={`${cmtResult.match_info.possession_home}%`} sub="Home" />}
                          {cmtResult.match_info.shots_home != null && <DStatBox label="Shots" value={`${cmtResult.match_info.shots_home}–${cmtResult.match_info.shots_away ?? "?"}`} sub="Home–Away" />}
                          {cmtResult.match_info.home_xg != null && <DStatBox label="xG" value={`${cmtResult.match_info.home_xg}–${cmtResult.match_info.away_xg ?? "?"}`} sub="Home–Away" />}
                        </div>
                      )}

                      {/* Synced event timeline */}
                      {Array.isArray(cmtResult.events_timeline) && cmtResult.events_timeline.length > 0 && (
                        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 10 }}>Events Timeline</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" }}>
                            {cmtResult.events_timeline.map((ev, i) => {
                              const isActive = i === activeCommentaryEventIdx;
                              const canSeek = ev.audio_time_seconds != null && cmtAudioUrl;
                              return (
                                <div
                                  key={i}
                                  ref={(el) => { cmtEventRefsMap.current[i] = el; }}
                                  onClick={() => { if (canSeek && cmtAudioRef.current) { cmtAudioRef.current.currentTime = ev.audio_time_seconds!; void cmtAudioRef.current.play(); } }}
                                  style={{ display: "flex", gap: 10, alignItems: "flex-start", borderRadius: 8, padding: "8px 10px", background: isActive ? D.amberBg : "transparent", border: `1px solid ${isActive ? "#78350f" : "transparent"}`, cursor: canSeek ? "pointer" : "default", transition: "background 0.2s" }}>
                                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    {ev.minute != null && <span style={{ fontSize: 11, fontWeight: 700, color: D.green }}>{ev.minute}′</span>}
                                    {ev.audio_time_seconds != null && <span style={{ fontSize: 10, color: D.dim }}>{formatAudioTime(ev.audio_time_seconds)}</span>}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: D.amber, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ev.event_type.replace(/_/g, " ")}{ev.player ? ` — ${ev.player}` : ""}</div>
                                    <div style={{ fontSize: 12, color: D.muted, marginTop: 2 }}>{ev.description}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tactical observations */}
                      {cmtResult.tactical?.observations?.length > 0 && (
                        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 8 }}>Tactical Observations</div>
                          <ul style={{ margin: 0, paddingLeft: 16 }}>
                            {cmtResult.tactical.observations.map((o, i) => <li key={i} style={{ fontSize: 12, color: D.muted, marginBottom: 4 }}>{o}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Players mentioned */}
                      {cmtResult.key_players_mentioned?.length > 0 && (
                        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: D.text, marginBottom: 8 }}>Players Mentioned</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {cmtResult.key_players_mentioned.map((p, i) => (
                              <span key={i} style={{ fontSize: 11, background: D.greenBg, color: D.green, border: `1px solid ${D.greenBd}`, borderRadius: 6, padding: "3px 8px" }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => { setCmtPhase("idle"); setCmtResult(null); setCmtAudioUrl(""); setCmtAudioCur(0); setCmtAudioDur(0); setCmtPlaying(false); }}
                        style={{ background: D.card2, color: D.muted, border: `1px solid ${D.border}`, borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Upload New Commentary
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <style>{`@keyframes analyst-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
    </div>
  );
}
