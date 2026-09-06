"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconStar } from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Skills config ──────────────────────────────────────────────────────────

const SKILLS = [
  { code: "dribbling",   label: "Dribbling",    emoji: "🏃" },
  { code: "first_touch", label: "First Touch",   emoji: "🎯" },
  { code: "shooting",    label: "Shooting",      emoji: "⚽" },
  { code: "sprint",      label: "Sprint",        emoji: "💨" },
  { code: "passing",     label: "Passing",       emoji: "🔄" },
  { code: "tackling",    label: "Tackling",      emoji: "🛡️" },
] as const;

type SkillCode = (typeof SKILLS)[number]["code"];

function segColor(seg: number): string {
  if (seg <= 3) return "#ef4444";
  if (seg <= 5) return "#f59e0b";
  if (seg <= 7) return "#4ade80";
  if (seg <= 9) return "#c0dd97";
  return "#c8962a";
}

function overallColor(score: number): string {
  if (score >= 8) return "#c0dd97";
  if (score >= 6) return "#fac775";
  if (score >= 4) return "#fb923c";
  return "#f87171";
}

type SkillRating = {
  skill_code: string;
  rating: number;
  notes: string | null;
  coach_name: string | null;
  rated_at: string | null;
};

// ─── Read-only skill row ─────────────────────────────────────────────────────

function SkillRow({ skill, rating }: {
  skill: { code: SkillCode; label: string; emoji: string };
  rating: SkillRating | undefined;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const value = rating?.rating ?? 0;
  const col   = value ? segColor(value) : "#333";

  const ratedDate = rating?.rated_at
    ? new Date(rating.rated_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{skill.emoji}</span>
          <span style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>{skill.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {rating?.notes && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: showNotes ? "#c8962a" : "#555",
                fontSize: 10, fontWeight: 600, padding: 0,
              }}
            >
              {showNotes ? "hide note" : "note"}
            </button>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span style={{
              fontSize: 22, fontWeight: 900,
              color: value ? col : "#2a2a2a",
              minWidth: 28, textAlign: "right", lineHeight: 1,
            }}>
              {value || "—"}
            </span>
            <span style={{ color: "#444", fontSize: 11 }}>/10</span>
          </div>
        </div>
      </div>

      {/* 10-segment bar (read-only) */}
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: 10 }, (_, i) => {
          const seg    = i + 1;
          const filled = seg <= value;
          const c      = segColor(seg);
          return (
            <div
              key={seg}
              style={{
                flex: 1, height: 30, borderRadius: 5,
                background: filled ? c : "#1a1a1a",
                boxShadow: filled ? `0 0 6px ${c}55` : "none",
              }}
            />
          );
        })}
      </div>

      {/* Scale labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: 2, paddingRight: 2 }}>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Poor</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Average</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Good</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Elite</span>
      </div>

      {/* Coach + date */}
      {rating && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <span style={{ color: "#555", fontSize: 10.5 }}>
            {rating.coach_name ? `Rated by ${rating.coach_name}` : "Rated by your coach"}
          </span>
          {ratedDate && (
            <span style={{ color: "#444", fontSize: 10 }}>{ratedDate}</span>
          )}
        </div>
      )}

      {/* Notes */}
      {showNotes && rating?.notes && (
        <div style={{
          marginTop: 8, padding: "8px 10px",
          background: "#111", borderRadius: 8,
          borderLeft: "3px solid #2a2a2a",
          color: "#aaa", fontSize: 11.5, lineHeight: 1.5,
        }}>
          {rating.notes}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlayerSkillRatingsPage() {
  const token = useAuthStore((s) => s.token);

  const [ratings,     setRatings]     = useState<SkillRating[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/player/skill-ratings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data)) setRatings(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Build a lookup by skill_code
  const ratingMap = Object.fromEntries(
    ratings.map((r) => [r.skill_code, r])
  ) as Record<string, SkillRating>;

  const ratedSkills = SKILLS.filter((s) => (ratingMap[s.code]?.rating ?? 0) > 0);
  const overallScore =
    ratedSkills.length > 0
      ? ratedSkills.reduce((sum, s) => sum + ratingMap[s.code].rating, 0) /
        ratedSkills.length
      : null;

  const oc = overallScore ? overallColor(overallScore) : "#2a2a2a";

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0e0e0e",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "#555", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 100 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 16px 0", maxWidth: 520, margin: "0 auto",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link
          href="/player"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 10,
            background: "#1a1a1a", color: "#999", textDecoration: "none", flexShrink: 0,
          }}
        >
          <IconChevronLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Coach Ratings</div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 1 }}>
            Technical skills rated by your coach
          </div>
        </div>
        <IconStar size={18} color="#c8962a" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Overall score card */}
        <div style={{
          background: "#151515", borderRadius: 16,
          padding: "22px 20px", marginBottom: 20, textAlign: "center",
        }}>
          <div style={{
            color: "#555", fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8,
          }}>
            Overall Rating
          </div>
          <div style={{ fontSize: 60, fontWeight: 900, color: oc, lineHeight: 1 }}>
            {overallScore ? overallScore.toFixed(1) : "—"}
          </div>
          <div style={{ color: "#444", fontSize: 11, marginTop: 8 }}>
            {overallScore
              ? `${ratedSkills.length} of ${SKILLS.length} skills rated`
              : "Your coach hasn't rated your skills yet"}
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: 14, background: "#0e0e0e",
            borderRadius: 4, height: 5, overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: overallScore ? `${(overallScore / 10) * 100}%` : "0%",
              background: `linear-gradient(90deg, #1a5c2a, ${oc})`,
              borderRadius: 4, transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* No ratings empty state */}
        {ratings.length === 0 ? (
          <div style={{
            background: "#151515", borderRadius: 16,
            padding: "40px 20px", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⭐</div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              No ratings yet
            </div>
            <div style={{ color: "#555", fontSize: 12, lineHeight: 1.5 }}>
              Your coach will rate your technical skills after a training session or match.
              Check back here once they&apos;ve completed an assessment.
            </div>
          </div>
        ) : (
          /* Skill rows */
          <div style={{
            background: "#151515", borderRadius: 16,
            padding: "20px 16px 8px",
          }}>
            <div style={{
              color: "#555", fontSize: 10, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 20,
            }}>
              Skill breakdown
            </div>

            {SKILLS.map((skill) => (
              <SkillRow
                key={skill.code}
                skill={skill}
                rating={ratingMap[skill.code]}
              />
            ))}
          </div>
        )}

        {/* Info note */}
        {ratings.length > 0 && (
          <div style={{
            marginTop: 16, background: "#111", borderRadius: 12,
            padding: "12px 14px", borderLeft: "3px solid #1a5c2a",
          }}>
            <p style={{ color: "#666", fontSize: 11, lineHeight: 1.6, margin: 0 }}>
              Ratings reflect your coach&apos;s most recent assessment. Work on lower-rated skills during training and ask your coach for feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
