"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, CheckCircle2, AlertTriangle,
  Star, TrendingUp, TrendingDown, Zap, Target,
  Clock, ChevronDown, ChevronUp, Dumbbell,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { uploadVideoInChunks } from "@/lib/upload-chunks";

const GRS_GREEN = "#1a5c2a";
const SPORTS = [
  "Football","Rugby","Netball","Basketball","Cricket",
  "Athletics","Swimming","Tennis","Volleyball","Hockey",
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface KeyMoment {
  time: string;
  type: "strength" | "weakness" | "neutral";
  description: string;
}

interface DrillRecommendation {
  drill: string;
  why: string;
  frequency: string;
}

interface PlayerAnalysis {
  overall_rating: number;
  performance_summary: string;
  key_moments: KeyMoment[];
  technical_strengths: string[];
  areas_to_improve: string[];
  positioning_analysis: string;
  physical_assessment: string;
  tactical_understanding: string;
  drill_recommendations: DrillRecommendation[];
  scout_note: string;
}

type PageStage = "setup" | "uploading" | "uploaded" | "analysing" | "results" | "error";

// ── Helpers ────────────────────────────────────────────────────────────────────

function ratingColor(r: number) {
  if (r >= 8) return "#16a34a";
  if (r >= 6) return "#d97706";
  if (r >= 4) return "#ea580c";
  return "#dc2626";
}

function momentColor(type: KeyMoment["type"]) {
  if (type === "strength") return { bg: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a" };
  if (type === "weakness") return { bg: "#fef9c3", border: "#fde047", dot: "#ca8a04" };
  return { bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ExpandableSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{title}</span>
        {open ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

function ResultsPanel({ analysis, narrative }: { analysis: PlayerAnalysis; narrative: string }) {
  const rating = Math.min(10, Math.max(1, Math.round(analysis.overall_rating)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Rating card */}
      <div style={{
        background: "#fff", borderRadius: 16, padding: 20,
        border: `2px solid ${ratingColor(rating)}22`,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `${ratingColor(rating)}18`,
          border: `3px solid ${ratingColor(rating)}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: ratingColor(rating), lineHeight: 1 }}>{rating}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: ratingColor(rating), letterSpacing: "0.05em" }}>/ 10</span>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 4 }}>
            Performance Rating
          </p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{analysis.performance_summary}</p>
        </div>
      </div>

      {/* Key moments */}
      {analysis.key_moments?.length > 0 && (
        <ExpandableSection title="Key Moments">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.key_moments.map((m, i) => {
              const c = momentColor(m.type);
              return (
                <div key={i} style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 10, padding: "10px 12px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: c.dot, marginTop: 4, flexShrink: 0,
                  }} />
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.dot, marginRight: 8 }}>
                      {m.time}
                    </span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{m.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ExpandableSection>
      )}

      {/* Strengths + Areas to improve side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#f0fdf4", borderRadius: 14, border: "1px solid #bbf7d0", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} color="#16a34a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Strengths
            </span>
          </div>
          {(analysis.technical_strengths ?? []).map((s, i) => (
            <p key={i} style={{ fontSize: 12, color: "#166534", marginBottom: 6, lineHeight: 1.4 }}>• {s}</p>
          ))}
        </div>
        <div style={{ background: "#fffbeb", borderRadius: 14, border: "1px solid #fde68a", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrendingDown size={14} color="#d97706" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              To Improve
            </span>
          </div>
          {(analysis.areas_to_improve ?? []).map((s, i) => (
            <p key={i} style={{ fontSize: 12, color: "#92400e", marginBottom: 6, lineHeight: 1.4 }}>• {s}</p>
          ))}
        </div>
      </div>

      {/* Detailed breakdowns */}
      {analysis.positioning_analysis && (
        <ExpandableSection title="Positioning & Movement">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.positioning_analysis}</p>
        </ExpandableSection>
      )}
      {analysis.physical_assessment && (
        <ExpandableSection title="Physical Assessment">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.physical_assessment}</p>
        </ExpandableSection>
      )}
      {analysis.tactical_understanding && (
        <ExpandableSection title="Tactical Understanding">
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{analysis.tactical_understanding}</p>
        </ExpandableSection>
      )}

      {/* Drill recommendations */}
      {analysis.drill_recommendations?.length > 0 && (
        <ExpandableSection title="Recommended Drills">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {analysis.drill_recommendations.map((d, i) => (
              <div key={i} style={{
                background: "#f0f9ff", border: "1px solid #bae6fd",
                borderRadius: 10, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Dumbbell size={13} color="#0284c7" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#0369a1" }}>{d.drill}</span>
                  <span style={{
                    marginLeft: "auto", fontSize: 10, fontWeight: 700,
                    background: "#e0f2fe", color: "#0369a1",
                    padding: "2px 8px", borderRadius: 20,
                  }}>{d.frequency}</span>
                </div>
                <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{d.why}</p>
              </div>
            ))}
          </div>
        </ExpandableSection>
      )}

      {/* Scout note */}
      {analysis.scout_note && (
        <div style={{
          background: "#fff", border: `1px solid ${GRS_GREEN}33`,
          borderLeft: `4px solid ${GRS_GREEN}`,
          borderRadius: 10, padding: "12px 14px",
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GRS_GREEN, marginBottom: 6 }}>
            Scout Note
          </p>
          <p style={{ fontSize: 13, color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>
            &ldquo;{analysis.scout_note}&rdquo;
          </p>
        </div>
      )}

      {/* Claude narrative */}
      {narrative && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star size={13} color="#f0b429" fill="#f0b429" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: GRS_GREEN }}>Personal Coaching Message</span>
          </div>
          {narrative.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, marginBottom: 10 }}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PlayerMatchEyePage() {
  const user = useAuthStore((s) => s.user);

  const [pageStage, setPageStage]     = useState<PageStage>("setup");
  const [uploadPct, setUploadPct]     = useState(0);
  const [fileUri,   setFileUri]       = useState("");
  const [fileName,  setFileName]      = useState("");
  const [mimeType,  setMimeType]      = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [sport,         setSport]         = useState("Football");
  const [position,      setPosition]      = useState("");
  const [jersey,        setJersey]        = useState("");
  const [focusQuestion, setFocusQuestion] = useState("");

  const [analysis,  setAnalysis]  = useState<PlayerAnalysis | null>(null);
  const [narrative, setNarrative] = useState("");
  const [error,     setError]     = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Upload to Gemini ────────────────────────────────────────────────────────

  const uploadVideo = useCallback(async (file: File) => {
    setPageStage("uploading");
    setUploadPct(0);
    setError("");
    setUploadedFile(file);

    try {
      const data = await uploadVideoInChunks(file, (pct) => setUploadPct(pct));

      setFileUri(data.fileUri);
      setFileName(data.fileName);
      setMimeType(data.mimeType);
      setUploadPct(100);
      setPageStage("uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPageStage("error");
    }
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadVideo(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) uploadVideo(file);
  };

  // ── Analyse ─────────────────────────────────────────────────────────────────

  const analyse = useCallback(async () => {
    if (!fileUri || !fileName) return;
    setPageStage("analysing");
    setError("");

    try {
      const res = await fetch("/api/player/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri, fileName, mimeType,
          sport, position, jersey, focusQuestion,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Analysis failed (${res.status})`);
      }
      const data = await res.json() as { analysis: PlayerAnalysis; narrative: string };
      setAnalysis(data.analysis);
      setNarrative(data.narrative ?? "");
      setPageStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setPageStage("error");
    }
  }, [fileUri, fileName, mimeType, sport, position, jersey, focusQuestion]);

  const reset = () => {
    setPageStage("setup");
    setUploadPct(0);
    setFileUri("");
    setFileName("");
    setMimeType("");
    setUploadedFile(null);
    setAnalysis(null);
    setNarrative("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/player" style={{ color: "#6b7280", display: "flex" }}>
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Match Eye</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                {user?.name ? `${user.name} · ` : ""}AI personal performance analysis
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* ── SETUP ── */}
        {(pageStage === "setup" || pageStage === "uploaded") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Context inputs */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #e5e7eb" }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: "#374151", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Your Details
              </p>

              {/* Sport */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Sport</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    style={{
                      padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      background: sport === s ? GRS_GREEN : "#fff",
                      borderColor: sport === s ? GRS_GREEN : "#d1d5db",
                      color: sport === s ? "#fff" : "#374151",
                    }}
                  >{s}</button>
                ))}
              </div>

              {/* Position + Jersey */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Your Position</p>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Striker, Midfielder"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Jersey #</p>
                  <input
                    value={jersey}
                    onChange={(e) => setJersey(e.target.value)}
                    placeholder="7"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Focus question */}
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>
                Focus Question <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
              </p>
              <input
                value={focusQuestion}
                onChange={(e) => setFocusQuestion(e.target.value)}
                placeholder="e.g. Am I dropping deep enough? Is my first touch good?"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 10,
                  border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Upload zone */}
            {pageStage === "setup" ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "#fff", borderRadius: 16, padding: 32,
                  border: "2px dashed #d1d5db", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  transition: "border-color 0.2s",
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: `${GRS_GREEN}12`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Upload size={22} color={GRS_GREEN} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>Upload your match video</p>
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                  Drag & drop or tap to choose · MP4, MOV, AVI supported
                </p>
                <input ref={fileRef} type="file" accept="video/*" onChange={handleFilePick} style={{ display: "none" }} />
              </div>
            ) : (
              /* Uploaded — show file name + analyse button */
              <div style={{
                background: "#fff", borderRadius: 16, padding: 16,
                border: `1px solid ${GRS_GREEN}33`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>Video ready</p>
                    <p style={{ fontSize: 11, color: "#6b7280" }}>{uploadedFile?.name}</p>
                  </div>
                  <button
                    onClick={reset}
                    style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Change
                  </button>
                </div>
                <button
                  onClick={analyse}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12,
                    background: GRS_GREEN, color: "#fff",
                    fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer",
                  }}
                >
                  Analyse My Performance
                </button>
              </div>
            )}

            {/* Info banner */}
            <div style={{
              background: "#f0fdf4", borderRadius: 12, padding: "12px 14px",
              border: "1px solid #bbf7d0", display: "flex", gap: 10,
            }}>
              <Zap size={15} color={GRS_GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                Gemini 2.5 Flash watches your full video and analyses your individual performance — positioning, technique, key moments, and specific drills to improve.
              </p>
            </div>
          </div>
        )}

        {/* ── UPLOADING ── */}
        {pageStage === "uploading" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", textAlign: "center" }}>
            <Upload size={28} color={GRS_GREEN} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Uploading to Gemini...</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>
              {uploadPct < 100 ? `${uploadPct}% uploaded` : "Processing video..."}
            </p>
            <div style={{ background: "#f3f4f6", borderRadius: 999, height: 8, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: GRS_GREEN,
                width: `${uploadPct}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── ANALYSING ── */}
        {pageStage === "analysing" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", textAlign: "center" }}>
            <Target size={28} color={GRS_GREEN} style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Analysing your performance...</p>
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
              Gemini is watching your video frame by frame.<br />
              This usually takes 60–120 seconds.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: GRS_GREEN,
                  animation: "pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {pageStage === "error" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #fecaca", textAlign: "center" }}>
            <AlertTriangle size={28} color="#dc2626" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 6 }}>Something went wrong</p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>{error}</p>
            <button
              onClick={reset}
              style={{
                padding: "10px 24px", borderRadius: 10,
                background: GRS_GREEN, color: "#fff",
                fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {pageStage === "results" && analysis && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Context chip */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                background: `${GRS_GREEN}15`, color: GRS_GREEN,
                padding: "4px 12px", borderRadius: 20,
                fontSize: 11, fontWeight: 700,
              }}>{sport}</span>
              {position && (
                <span style={{
                  background: "#f3f4f6", color: "#374151",
                  padding: "4px 12px", borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                }}>{position}{jersey ? ` · #${jersey}` : ""}</span>
              )}
              <button
                onClick={reset}
                style={{
                  marginLeft: "auto", padding: "4px 14px", borderRadius: 20,
                  background: "#fff", border: "1px solid #d1d5db",
                  fontSize: 11, fontWeight: 600, color: "#374151", cursor: "pointer",
                }}
              >
                New Analysis
              </button>
            </div>

            <ResultsPanel analysis={analysis} narrative={narrative} />

            {/* Timeline marker */}
            <div style={{ display: "flex", gap: 16, padding: "10px 0", justifyContent: "center" }}>
              {(["strength", "weakness", "neutral"] as KeyMoment["type"][]).map((t) => {
                const c = momentColor(t);
                const label = t === "strength" ? "Strength" : t === "weakness" ? "Weakness" : "Note";
                return (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot }} />
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={reset}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12,
                background: "#fff", border: `2px solid ${GRS_GREEN}`,
                color: GRS_GREEN, fontWeight: 800, fontSize: 14, cursor: "pointer",
              }}
            >
              Analyse Another Video
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
