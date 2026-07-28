"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicResult {
  score:      number | null;
  measurable: boolean;
  detail:     string;
}

interface MechanicDef {
  key:   string;
  label: string;
  desc:  string;
  color: string;
}

// ─── Drill mechanic definitions ───────────────────────────────────────────────

const DRILL_MECHANICS: Record<string, MechanicDef[]> = {
  free_kick: [
    { key: "strike_elevation", label: "Strike Elevation",   desc: "Trunk angle at contact controls ball height",            color: "#1d4ed8" },
    { key: "approach_balance", label: "Approach Balance",   desc: "Hip level during run-up affects consistency",            color: "#1a5c2a" },
    { key: "bend_accuracy",    label: "Bend Accuracy",      desc: "Foot shape and contact point for curl",                  color: "#c8962a" },
    { key: "wall_clearance",   label: "Wall Clearance",     desc: "Strike trajectory over/around defensive wall",           color: "#7c3aed" },
  ],
  heading: [
    { key: "attack_angle",           label: "Attack Angle",           desc: "Trunk lean into the ball at contact",                    color: "#1d4ed8" },
    { key: "bilateral_coordination", label: "Jump Coordination",      desc: "Symmetry of both legs during header jump",               color: "#1a5c2a" },
    { key: "forehead_contact",       label: "Forehead Contact",       desc: "Directing the ball with the correct part of the head",   color: "#c8962a" },
  ],
  crossing: [
    { key: "delivery_height",    label: "Delivery Height",    desc: "Trunk angle at delivery controls cross height",          color: "#1d4ed8" },
    { key: "body_balance",       label: "Body Balance",       desc: "Hip level on approach affects consistency",              color: "#1a5c2a" },
    { key: "landing_zone",       label: "Landing Zone",       desc: "Ball arrival accuracy into the penalty area",            color: "#c8962a" },
    { key: "weak_foot_delivery", label: "Weak Foot Delivery", desc: "Crossing ability from non-dominant side",               color: "#7c3aed" },
  ],
  ball_juggling: [
    { key: "body_balance",      label: "Body Balance",      desc: "Hip stability during repeated ball touches",             color: "#1d4ed8" },
    { key: "touch_stability",   label: "Touch Stability",   desc: "Consistent body height between touches",                color: "#1a5c2a" },
    { key: "consecutive_count", label: "Consecutive Count", desc: "Number of juggling touches without the ball hitting the ground", color: "#c8962a" },
    { key: "weak_foot_control", label: "Weak Foot Control", desc: "Juggling ability with non-dominant foot",               color: "#7c3aed" },
  ],
  throw_in: [
    { key: "technique",           label: "Throw Technique",     desc: "Full trunk arc from back to front release",             color: "#1d4ed8" },
    { key: "shoulder_symmetry",   label: "Arm Symmetry",        desc: "Both arms contributing equally to the throw",           color: "#1a5c2a" },
    { key: "distance_reach",      label: "Distance Reach",      desc: "Maximum delivery distance into play",                   color: "#c8962a" },
    { key: "non_dominant_stance", label: "Non-Dominant Stance", desc: "Comfort when leading with non-dominant foot",           color: "#7c3aed" },
  ],
  rebound_turn_strike: [
    { key: "turn_sharpness",  label: "Turn Sharpness",   desc: "Centre of gravity during directional change",            color: "#1d4ed8" },
    { key: "body_shield",     label: "Body Shield",      desc: "Trunk angle to shield ball from pressure",              color: "#1a5c2a" },
    { key: "strike_accuracy", label: "Strike Accuracy",  desc: "Balance and body position at contact after turning",    color: "#c8962a" },
  ],
  // existing skill pages have dedicated pages — these are fallbacks in case
  // drill-analyse is called with these types
  shooting: [
    { key: "body_shape",     label: "Body Shape",       desc: "Trunk lean over the ball at contact",                   color: "#1d4ed8" },
    { key: "striking",       label: "Striking Knee",    desc: "Knee flexion of striking leg",                         color: "#1a5c2a" },
    { key: "follow_through", label: "Follow Through",   desc: "Swing arc completion after contact",                   color: "#c8962a" },
  ],
  passing: [
    { key: "body_shape",     label: "Body Shape",       desc: "Trunk lean controlling pass direction",                color: "#1d4ed8" },
    { key: "knee_flexion",   label: "Support Leg Flex", desc: "Knee bend on standing leg for balance",               color: "#1a5c2a" },
  ],
  tackling: [
    { key: "body_shape",     label: "Defensive Stance", desc: "Knee flexion depth of defensive posture",             color: "#1d4ed8" },
    { key: "approach",       label: "Approach Angle",   desc: "Centre of mass height on approach",                   color: "#1a5c2a" },
  ],
  dribbling: [
    { key: "body_position",       label: "Body Position",        desc: "Centre of mass height during dribble",              color: "#1d4ed8" },
    { key: "change_of_direction", label: "Change of Direction",  desc: "Balance symmetry during directional change",        color: "#1a5c2a" },
  ],
  first_touch: [
    { key: "body_shape", label: "Body Shape",   desc: "Body rotation before ball arrives",      color: "#1d4ed8" },
    { key: "cushioning", label: "Cushioning",   desc: "Knee flexion depth on ball receipt",     color: "#1a5c2a" },
  ],
};

// ─── Drill labels ─────────────────────────────────────────────────────────────

const DRILL_TYPE_LABELS: Record<string, string> = {
  free_kick:           "Free Kick",
  heading:             "Heading",
  crossing:            "Crossing",
  ball_juggling:       "Ball Juggling",
  throw_in:            "Throw-In",
  rebound_turn_strike: "Rebound Turn & Strike",
  shooting:            "Shooting",
  passing:             "Passing",
  tackling:            "Tackling",
  dribbling:           "Dribbling",
  first_touch:         "First Touch",
  ball_mastery:        "Ball Mastery",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function barColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#d97706";
  if (pct >= 40) return "#ea580c";
  return "#dc2626";
}

function barLabel(pct: number): string {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs work";
  return "Critical";
}

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function DrillAnalysePage() {
  const token      = useAuthStore((s) => s.token);
  const searchParams = useSearchParams();
  const drillType  = searchParams.get("drill_type") ?? "ball_mastery";
  const drillName  = searchParams.get("name") ?? DRILL_TYPE_LABELS[drillType] ?? "Drill Analysis";

  const mechanics  = DRILL_MECHANICS[drillType] ?? [];
  const isBallMastery = drillType === "ball_mastery" || mechanics.length === 0;

  const [videoFile,    setVideoFile]    = useState<File | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [results,      setResults]      = useState<Record<string, MechanicResult> | null>(null);
  const [geminiText,   setGeminiText]   = useState<string>("");
  const [error,        setError]        = useState("");
  const [done,         setDone]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyseVideo = async () => {
    if (!videoFile) return;
    setVideoLoading(true);
    setError("");
    setResults(null);
    setGeminiText("");

    const form = new FormData();
    form.append("file", videoFile);

    try {
      const r = await fetch(
        `/api/fitness-test?test_type=${drillType}&age_group=u17`,
        { method: "POST", body: form }
      );
      const data = await r.json();

      if (!r.ok) {
        setError(data.detail ?? "Analysis failed — check lighting and ensure your full body is visible.");
      } else if (isBallMastery) {
        // Gemini returns free-text feedback
        const text: string = data.feedback ?? data.analysis ?? data.detail ?? JSON.stringify(data);
        setGeminiText(text);
        setDone(true);
      } else if (data.mechanics) {
        setResults(data.mechanics as Record<string, MechanicResult>);
        setDone(true);
      } else {
        setError("No mechanics data returned. Try a different video angle where your full body is visible.");
      }
    } catch {
      setError("Could not reach the AI service. Check your connection and try again.");
    }
    setVideoLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/player/drills" style={{ color: "#1a5c2a", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          <ArrowLeft size={16} /> Drill Lab
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{drillName}</span>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 4 }}>{drillName}</h1>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Upload a short clip of yourself performing this drill. MediaPipe will measure your body mechanics and score what it can detect.
          </p>
        </div>

        {/* Upload card */}
        {!done && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a5c2a", marginBottom: 12 }}>
              Upload Drill Video
            </h2>

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #d1d5db", borderRadius: 12, padding: "28px 16px",
                textAlign: "center", cursor: "pointer", marginBottom: 14,
                background: videoFile ? "#f0fdf4" : "#fafafa",
                borderColor: videoFile ? "#86efac" : "#d1d5db",
              }}
            >
              {videoFile ? (
                <>
                  <CheckCircle2 size={28} color="#16a34a" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{videoFile.name}</p>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Tap to change</p>
                </>
              ) : (
                <>
                  <Upload size={28} color="#9ca3af" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Tap to select video</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>MP4, MOV, AVI · max 500 MB</p>
                </>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null); setError(""); }}
            />

            {/* Tips */}
            <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>Recording tips</p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
                <li>Film from the side so your full body is visible</li>
                <li>Good lighting — outdoors or bright indoor</li>
                <li>10–30 seconds is enough, repeat the action 3–5 times</li>
                <li>Keep the camera still (lean against a wall or ask someone to hold it)</li>
              </ul>
            </div>

            {error && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#dc2626", margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              onClick={analyseVideo}
              disabled={!videoFile || videoLoading}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
                fontWeight: 900, fontSize: 14, cursor: videoFile && !videoLoading ? "pointer" : "not-allowed",
                background: videoFile && !videoLoading ? "#1a5c2a" : "#d1d5db",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {videoLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Analysing with MediaPipe…</>
              ) : (
                <><Video size={16} /> Measure My Technique</>
              )}
            </button>

            {videoLoading && (
              <p style={{ textAlign: "center", fontSize: 11, color: "#6b7280", marginTop: 10 }}>
                This can take 30–90 seconds on first run. MediaPipe is reading your pose landmarks frame by frame.
              </p>
            )}
          </div>
        )}

        {/* Gemini free-text result (ball_mastery) */}
        {done && geminiText && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7c3aed", marginBottom: 12 }}>
              AI Feedback
            </h2>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{geminiText}</p>
          </div>
        )}

        {/* MediaPipe mechanic results */}
        {done && results && mechanics.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a5c2a", margin: 0 }}>
              Biomechanics Results
            </h2>

            {mechanics.map((m) => {
              const result = results[m.key];
              const score  = result?.score ?? null;
              const pct    = score ?? 0;

              return (
                <div
                  key={m.key}
                  style={{
                    background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb",
                    padding: "16px 18px",
                    opacity: result?.measurable === false ? 0.65 : 1,
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{m.label}</span>
                      {result?.measurable && score !== null && (
                        <span style={{
                          fontSize: 9, fontWeight: 900, background: "#dcfce7", color: "#15803d",
                          padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          AI Measured
                        </span>
                      )}
                      {result?.measurable === false && (
                        <span style={{
                          fontSize: 9, fontWeight: 900, background: "#f3f4f6", color: "#9ca3af",
                          padding: "2px 7px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          Rate Manually
                        </span>
                      )}
                    </div>
                    {score !== null && (
                      <span style={{ fontSize: 12, fontWeight: 800, color: barColor(pct) }}>
                        {barLabel(pct)} · {Math.round(pct)}
                      </span>
                    )}
                  </div>

                  {/* Score bar */}
                  {score !== null ? (
                    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 999, marginBottom: 8 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor(pct), borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                  ) : (
                    <div style={{ height: 6, background: "#f3f4f6", borderRadius: 999, marginBottom: 8 }} />
                  )}

                  {/* Detail text */}
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                    {result?.detail ?? m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Try again */}
        {done && (
          <button
            onClick={() => { setDone(false); setResults(null); setGeminiText(""); setVideoFile(null); setError(""); }}
            style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "2px solid #1a5c2a",
              background: "transparent", color: "#1a5c2a", fontWeight: 800, fontSize: 13, cursor: "pointer",
              marginBottom: 24,
            }}
          >
            Analyse Another Clip
          </button>
        )}

        {/* What MediaPipe measures */}
        {!done && mechanics.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>
              What MediaPipe will measure
            </h2>
            {mechanics.map((m) => (
              <div key={m.key} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{m.desc}</p>
                </div>
              </div>
            ))}
            <p style={{ fontSize: 10, color: "#d1d5db", marginTop: 10, marginBottom: 0, fontStyle: "italic" }}>
              Some mechanics (marked &ldquo;Rate Manually&rdquo;) require ball tracking and cannot be measured from pose alone.
            </p>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/player/drills"
          style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          <ArrowLeft size={14} /> Back to Drill Lab
        </Link>
      </div>
    </div>
  );
}

// ─── Export wrapped in Suspense (required for useSearchParams) ────────────────

export default function DrillAnalysePageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "#1a5c2a" }} />
      </div>
    }>
      <DrillAnalysePage />
    </Suspense>
  );
}
