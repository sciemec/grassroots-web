"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Award, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "setup" | "dribbling" | "first_touch" | "passing" | "tackling" | "shooting" | "sprint" | "results";

interface Mechanic {
  key:    string;
  label:  string;
  desc:   string;
  weight: number;
}

interface SkillDef {
  key:        string;
  label:      string;
  emoji:      string;
  endpoint:   string;
  extra:      Record<string, unknown>;
  mechanics:  Mechanic[];
  fieldNames: Record<string, string>;
}

// ─── Skill Definitions ────────────────────────────────────────────────────────

const SKILLS: SkillDef[] = [
  {
    key: "dribbling", label: "Dribbling", emoji: "🔄",
    endpoint: "/player/dribbling",
    extra: { dribble_type: "Close Control" },
    mechanics: [
      { key: "ball_control",        label: "Ball Control & Touch",      desc: "How well do you keep the ball under close control while moving?",           weight: 0.30 },
      { key: "body_position",       label: "Body Position & Shielding", desc: "How well do you use your body to shield and protect the ball?",              weight: 0.25 },
      { key: "change_of_direction", label: "Change of Direction",       desc: "How sharp and quick are your turns and direction changes?",                  weight: 0.25 },
      { key: "awareness",           label: "Head Up & Awareness",       desc: "How often do you look up and scan your surroundings while dribbling?",       weight: 0.20 },
    ],
    fieldNames: {
      ball_control:        "ball_control_score",
      body_position:       "body_position_score",
      change_of_direction: "change_of_direction_score",
      awareness:           "awareness_score",
    },
  },
  {
    key: "first_touch", label: "First Touch", emoji: "🦶",
    endpoint: "/player/first-touch",
    extra: { receive_type: "Ground Pass", pressure_level: "Medium" },
    mechanics: [
      { key: "body_shape",     label: "Body Shape Before Ball",    desc: "Do you scan and get into position before the ball reaches you?",              weight: 0.25 },
      { key: "cushioning",     label: "Cushioning & Softness",     desc: "How well do you absorb the ball's pace to keep it under tight control?",      weight: 0.25 },
      { key: "touch_direction", label: "Touch Direction",          desc: "Do you move the ball away from pressure and into useful space?",              weight: 0.25 },
      { key: "speed_of_play",  label: "Speed of Play After Touch", desc: "How quickly are you ready for your next action after the first touch?",       weight: 0.25 },
    ],
    fieldNames: {
      body_shape:      "body_shape_score",
      cushioning:      "cushioning_score",
      touch_direction: "touch_direction_score",
      speed_of_play:   "speed_of_play_score",
    },
  },
  {
    key: "passing", label: "Passing", emoji: "⚽",
    endpoint: "/player/passing",
    extra: { pass_type: "Short Pass", foot: "Right" },
    mechanics: [
      { key: "body_shape",      label: "Body Shape & Stance",    desc: "Is your non-kicking foot beside the ball? Is your body open to the target?",   weight: 0.25 },
      { key: "weight_accuracy", label: "Pass Weight & Accuracy", desc: "Are your passes the right pace and landing accurately on target?",              weight: 0.35 },
      { key: "decision_making", label: "Decision Making",        desc: "Do you pick the right pass at the right moment — and disguise it?",             weight: 0.25 },
      { key: "follow_through",  label: "Follow Through",         desc: "Does your kicking foot follow through toward the target after contact?",        weight: 0.15 },
    ],
    fieldNames: {
      body_shape:      "body_shape_score",
      weight_accuracy: "weight_accuracy_score",
      decision_making: "decision_making_score",
      follow_through:  "follow_through_score",
    },
  },
  {
    key: "tackling", label: "Tackling", emoji: "🛡️",
    endpoint: "/player/tackling",
    extra: { tackle_type: "Block Tackle" },
    mechanics: [
      { key: "approach",   label: "Approach & Positioning", desc: "Do you close the attacker at the right angle and speed, cutting off options?",  weight: 0.25 },
      { key: "body_shape", label: "Body Shape & Balance",   desc: "Are your knees bent, weight low, and feet shoulder-width apart when tackling?", weight: 0.30 },
      { key: "timing",     label: "Timing",                 desc: "Do you wait for the right moment to commit, rather than diving in early?",      weight: 0.30 },
      { key: "recovery",   label: "Recovery & Transition",  desc: "After a tackle or interception, do you recover quickly and help in attack?",    weight: 0.15 },
    ],
    fieldNames: {
      approach:   "approach_score",
      body_shape: "body_shape_score",
      timing:     "timing_score",
      recovery:   "recovery_score",
    },
  },
  {
    key: "shooting", label: "Shooting", emoji: "🎯",
    endpoint: "/player/shooting",
    extra: { shot_type: "Placed Shot", foot: "Right" },
    mechanics: [
      { key: "plant_foot",    label: "Plant Foot Position",  desc: "Where do you place your non-kicking foot relative to the ball?",       weight: 0.25 },
      { key: "body_shape",    label: "Body Shape Over Ball", desc: "How well do you lean over the ball to control height and direction?",   weight: 0.25 },
      { key: "striking",      label: "Striking Technique",   desc: "Contact point on the foot — ankle lock quality and area of contact?",  weight: 0.35 },
      { key: "follow_through", label: "Follow Through",      desc: "How complete is your swing arc toward the target after striking?",     weight: 0.15 },
    ],
    fieldNames: {
      plant_foot:     "plant_foot_score",
      body_shape:     "body_shape_score",
      striking:       "striking_score",
      follow_through: "follow_through_score",
    },
  },
  {
    key: "sprint", label: "Sprint", emoji: "💨",
    endpoint: "/player/sprint",
    extra: { distance_metres: 40, surface: "Grass", time_achieved: null },
    mechanics: [
      { key: "arm_drive",     label: "Arm Drive",     desc: "Are your arms driving forward in a straight line, held at roughly 90 degrees?",   weight: 0.25 },
      { key: "forward_lean",  label: "Forward Lean",  desc: "Do you lean forward from the ankles (not waist) in the acceleration phase?",      weight: 0.25 },
      { key: "knee_drive",    label: "Knee Drive",    desc: "Are you driving your knees up and forward powerfully on each stride?",             weight: 0.30 },
      { key: "stride_rhythm", label: "Stride Rhythm", desc: "Is your stride cadence consistent, light, and symmetrical on both sides?",        weight: 0.20 },
    ],
    fieldNames: {
      arm_drive:     "arm_drive_score",
      forward_lean:  "forward_lean_score",
      knee_drive:    "knee_drive_score",
      stride_rhythm: "stride_rhythm_score",
    },
  },
];

const STEP_ORDER: Step[] = ["setup", "dribbling", "first_touch", "passing", "tackling", "shooting", "sprint", "results"];
const POSITIONS  = ["Goalkeeper", "Defender", "Centre Back", "Midfielder", "Winger", "Attacking Mid", "Forward", "Striker"];
const AGE_GROUPS = ["U12", "U14", "U16", "U18", "U20", "Senior"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeScore(mechanics: Mechanic[], ratings: Record<string, number>): number {
  return Math.round(mechanics.reduce((sum, m) => sum + (ratings[m.key] || 0) * 20 * m.weight, 0));
}

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#ea580c";
  return "#dc2626";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessMePage() {
  const token   = useAuthStore((s) => s.token);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [step,       setStep]       = useState<Step>("setup");
  const [position,   setPosition]   = useState("");
  const [ageGroup,   setAgeGroup]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [allRatings, setAllRatings] = useState<Record<string, Record<string, number>>>({});
  const [scores,     setScores]     = useState<Record<string, number>>({});

  const stepIndex    = STEP_ORDER.indexOf(step);
  const progressPct  = (stepIndex / (STEP_ORDER.length - 1)) * 100;
  const currentSkill = SKILLS.find((s) => s.key === step);
  const currentRatings = allRatings[step] ?? {};
  const allRated = currentSkill
    ? currentSkill.mechanics.every((m) => (currentRatings[m.key] ?? 0) > 0)
    : false;

  function setRating(skillKey: string, mechanicKey: string, val: number) {
    setAllRatings((prev) => ({
      ...prev,
      [skillKey]: { ...(prev[skillKey] ?? {}), [mechanicKey]: val },
    }));
  }

  async function advanceFromSetup() {
    if (!position || !ageGroup) return;
    setSaving(true);
    if (token) {
      fetch(`${API_URL}/profile`, {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ position, age_group: ageGroup }),
      }).catch(() => {});
    }
    setSaving(false);
    setStep("dribbling");
  }

  async function advanceFromSkill() {
    if (!currentSkill || !allRated) return;
    const ratings = allRatings[currentSkill.key] ?? {};
    const overall = computeScore(currentSkill.mechanics, ratings);
    setScores((prev) => ({ ...prev, [currentSkill.key]: overall }));

    if (token) {
      const payload: Record<string, unknown> = {
        sport:         "Football",
        position,
        overall_score: overall,
        ai_feedback:   null,
        ...currentSkill.extra,
      };
      for (const [mk, fieldName] of Object.entries(currentSkill.fieldNames)) {
        payload[fieldName] = ratings[mk] ?? 1;
      }
      fetch(`${API_URL}${currentSkill.endpoint}`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }).catch(() => {});
    }

    const next = STEP_ORDER[stepIndex + 1] as Step;
    setStep(next);
  }

  // ── Computed results ────────────────────────────────────────────────────────

  const skillScores = SKILLS.map((s) => ({ ...s, score: scores[s.key] ?? 0 }));
  const avgScore    = skillScores.length
    ? Math.round(skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length)
    : 0;
  const bestSkill   = skillScores.reduce((a, b) => (b.score > a.score ? b : a), skillScores[0]);
  const worstSkill  = skillScores.reduce((a, b) => (b.score < a.score ? b : a), skillScores[0]);

  // ── Shared styles ───────────────────────────────────────────────────────────

  const bg: React.CSSProperties      = { minHeight: "100vh", backgroundColor: "#f4f2ee" };
  const card: React.CSSProperties    = { backgroundColor: "white", borderRadius: 16, padding: 20, border: "1px solid #e5e7eb", marginBottom: 16 };
  const label: React.CSSProperties   = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 };

  // ── Setup step ──────────────────────────────────────────────────────────────

  if (step === "setup") {
    return (
      <div style={bg}>
        {/* Nav */}
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/player" style={{ color: "#1a5c2a", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Full Skill Assessment</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Coach-assisted — 6 skills, ~10 minutes</div>
          </div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, backgroundColor: "#e5e7eb" }}>
          <div style={{ height: "100%", width: "0%", backgroundColor: "#1a5c2a", transition: "width 0.4s" }} />
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
          <div style={card}>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20 }}>
              Your coach will observe each skill and rate your mechanics. Results automatically update your player profile.
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={label}>Your Position</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: 10,
                      border: "2px solid",
                      borderColor: position === p ? "#1a5c2a" : "#e5e7eb",
                      backgroundColor: position === p ? "#f0f7f2" : "white",
                      color: position === p ? "#1a5c2a" : "#374151",
                      fontWeight: position === p ? 700 : 400,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={label}>Age Group</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AGE_GROUPS.map((ag) => (
                  <button
                    key={ag}
                    onClick={() => setAgeGroup(ag)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 20,
                      border: "2px solid",
                      borderColor: ageGroup === ag ? "#1a5c2a" : "#e5e7eb",
                      backgroundColor: ageGroup === ag ? "#1a5c2a" : "white",
                      color: ageGroup === ag ? "white" : "#374151",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {ag}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={advanceFromSetup}
              disabled={!position || !ageGroup || saving}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                border: "none",
                backgroundColor: position && ageGroup ? "#1a5c2a" : "#d1d5db",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                cursor: position && ageGroup ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Start Assessment <ChevronRight size={18} />
            </button>
          </div>

          {/* Skill preview */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {SKILLS.map((s) => (
              <div key={s.key} style={{ padding: "6px 12px", backgroundColor: "white", borderRadius: 20, border: "1px solid #e5e7eb", fontSize: 12, color: "#6b7280" }}>
                {s.emoji} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results step ────────────────────────────────────────────────────────────

  if (step === "results") {
    return (
      <div style={bg}>
        <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/player" style={{ color: "#1a5c2a", display: "flex", alignItems: "center" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Assessment Complete</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{position} — {ageGroup}</div>
          </div>
        </div>
        <div style={{ height: 4, backgroundColor: "#e5e7eb" }}>
          <div style={{ height: "100%", width: "100%", backgroundColor: "#1a5c2a" }} />
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
          {/* Overall score */}
          <div style={{ ...card, textAlign: "center", backgroundColor: "#1a5c2a" }}>
            <Award size={32} color="#f0b429" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 48, fontWeight: 900, color: "white", lineHeight: 1 }}>{avgScore}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Overall Skill Score / 100</div>
            <div style={{ fontSize: 13, color: "#f0b429", fontWeight: 700, marginTop: 4 }}>{scoreLabel(avgScore)}</div>
          </div>

          {/* Per-skill bars */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 16 }}>Skill Breakdown</div>
            {skillScores.map((s) => (
              <div key={s.key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, color: "#374151" }}>{s.emoji} {s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}/100</div>
                </div>
                <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.score}%`, backgroundColor: scoreColor(s.score), borderRadius: 4, transition: "width 0.6s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Best Skill</div>
              <div style={{ fontSize: 20 }}>{bestSkill.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2a" }}>{bestSkill.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{bestSkill.score}/100</div>
            </div>
            <div style={{ ...card, marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Focus Area</div>
              <div style={{ fontSize: 20 }}>{worstSkill.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>{worstSkill.label}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{worstSkill.score}/100</div>
            </div>
          </div>

          {/* CTAs */}
          <Link href="/player/profile" style={{ display: "block", textAlign: "center", padding: "14px", borderRadius: 12, backgroundColor: "#1a5c2a", color: "white", fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 10 }}>
            View My Profile
          </Link>
          <button
            onClick={() => { setStep("setup"); setAllRatings({}); setScores({}); setPosition(""); setAgeGroup(""); }}
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "white", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Run Assessment Again
          </button>
        </div>
      </div>
    );
  }

  // ── Skill step ──────────────────────────────────────────────────────────────

  if (!currentSkill) return null;

  const skillIdx = SKILLS.findIndex((s) => s.key === step);

  return (
    <div style={bg}>
      {/* Nav */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={() => setStep(STEP_ORDER[stepIndex - 1] as Step)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#1a5c2a", display: "flex", alignItems: "center", padding: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>
            {currentSkill.emoji} {currentSkill.label}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Skill {skillIdx + 1} of {SKILLS.length} — {position}</div>
        </div>
        {/* Step dots */}
        <div style={{ display: "flex", gap: 4 }}>
          {SKILLS.map((s, i) => (
            <div key={s.key} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i < skillIdx ? "#1a5c2a" : i === skillIdx ? "#f0b429" : "#d1d5db" }} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, backgroundColor: "#e5e7eb" }}>
        <div style={{ height: "100%", width: `${progressPct}%`, backgroundColor: "#1a5c2a", transition: "width 0.4s" }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        {/* Live score preview */}
        {Object.keys(currentRatings).length > 0 && (
          <div style={{ backgroundColor: "#1a5c2a", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Current score</span>
            <span style={{ color: "white", fontWeight: 900, fontSize: 18 }}>
              {computeScore(currentSkill.mechanics, currentRatings)}/100
            </span>
          </div>
        )}

        {/* Mechanic cards */}
        {currentSkill.mechanics.map((m, i) => {
          const rating = currentRatings[m.key] ?? 0;
          return (
            <div key={m.key} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{i + 1}. {m.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{m.desc}</div>
                </div>
                {rating > 0 && (
                  <CheckCircle2 size={18} color="#1a5c2a" style={{ flexShrink: 0, marginLeft: 8 }} />
                )}
              </div>

              {/* 1-5 buttons */}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = rating === val;
                  const btnColor   = val <= 2 ? "#dc2626" : val === 3 ? "#d97706" : val === 4 ? "#2563eb" : "#1a5c2a";
                  return (
                    <button
                      key={val}
                      onClick={() => setRating(step, m.key, val)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 10,
                        border: "2px solid",
                        borderColor: isSelected ? btnColor : "#e5e7eb",
                        backgroundColor: isSelected ? btnColor : "white",
                        color: isSelected ? "white" : "#6b7280",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#9ca3af" }}>
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          );
        })}

        {/* Next button */}
        <button
          onClick={advanceFromSkill}
          disabled={!allRated}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            backgroundColor: allRated ? "#1a5c2a" : "#d1d5db",
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            cursor: allRated ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {step === "sprint" ? "See My Results" : `Next: ${SKILLS[skillIdx + 1]?.emoji} ${SKILLS[skillIdx + 1]?.label}`}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
