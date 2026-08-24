"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Clock, ArrowLeft, Zap } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exercise {
  id: string;
  part_number: number;
  part_name: string;
  sequence_order: number;
  name: string;
  level: number | null;       // 1 / 2 / 3 — only populated for Part 2 variations
  instructions: string | null;
  sets: string | null;
  mediapipe_form_check: boolean;
}

interface Part {
  part_number: number;
  part_name: string;
  exercises: Exercise[];
}

interface WarmupProgram {
  id: string;
  code: string | null;
  name: string | null;
  source: string | null;
  total_duration_minutes: number | null;
  parts: Part[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PART_COLORS: Record<number, { bg: string; border: string; badge: string; text: string }> = {
  1: { bg: "#f0fdf4", border: "#bbf7d0", badge: "#16a34a", text: "#14532d" },
  2: { bg: "#eff6ff", border: "#bfdbfe", badge: "#2563eb", text: "#1e3a8a" },
  3: { bg: "#fefce8", border: "#fde68a", badge: "#d97706", text: "#78350f" },
};

const LEVEL_LABELS: Record<number, string> = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };

function ExerciseRow({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);
  const hasDetail = ex.instructions || ex.sets;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        marginBottom: 6,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => hasDetail && setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "none",
          border: "none",
          cursor: hasDetail ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        {/* Sequence badge */}
        <span
          style={{
            minWidth: 24,
            height: 24,
            borderRadius: "50%",
            background: "#1a5c2a",
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {ex.sequence_order}
        </span>

        <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: "#111827" }}>
          {ex.name}
        </span>

        {/* Level pill (Part 2 only) */}
        {ex.level !== null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 99,
              background: ex.level === 1 ? "#dcfce7" : ex.level === 2 ? "#dbeafe" : "#fee2e2",
              color: ex.level === 1 ? "#15803d" : ex.level === 2 ? "#1d4ed8" : "#b91c1c",
              flexShrink: 0,
            }}
          >
            L{ex.level} {LEVEL_LABELS[ex.level]}
          </span>
        )}

        {/* Sets */}
        {ex.sets && (
          <span style={{ fontSize: 12, color: "#6b7280", flexShrink: 0 }}>{ex.sets}</span>
        )}

        {/* AI form check indicator */}
        {ex.mediapipe_form_check && (
          <Zap size={14} color="#c8962a" style={{ flexShrink: 0 }} />
        )}

        {hasDetail && (
          open
            ? <ChevronUp size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
            : <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
        )}
      </button>

      {open && hasDetail && (
        <div
          style={{
            padding: "0 14px 12px 48px",
            fontSize: 13,
            color: "#374151",
            lineHeight: 1.6,
            borderTop: "1px solid #f3f4f6",
          }}
        >
          {ex.instructions && <p style={{ margin: "8px 0 0" }}>{ex.instructions}</p>}
          {ex.sets && !ex.instructions && (
            <p style={{ margin: "8px 0 0", color: "#6b7280" }}>Sets / reps: {ex.sets}</p>
          )}
          {ex.mediapipe_form_check && (
            <p style={{ margin: "6px 0 0", color: "#c8962a", fontSize: 12, fontWeight: 500 }}>
              <Zap size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
              AI form check available in the mobile app
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program }: { program: WarmupProgram }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
              {program.name ?? "Warmup Programme"}
            </span>
            {program.code && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                }}
              >
                {program.code.toUpperCase()}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
            {program.source && (
              <span style={{ fontSize: 12, color: "#6b7280" }}>Source: {program.source}</span>
            )}
            {program.total_duration_minutes && (
              <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} />
                {program.total_duration_minutes} min
              </span>
            )}
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {program.parts.reduce((s, p) => s + p.exercises.length, 0)} exercises · {program.parts.length} parts
            </span>
          </div>
        </div>

        {expanded
          ? <ChevronUp size={20} color="#9ca3af" />
          : <ChevronDown size={20} color="#9ca3af" />}
      </button>

      {/* Parts */}
      {expanded && (
        <div style={{ padding: "0 20px 20px" }}>
          {program.parts.map((part) => {
            const colors = PART_COLORS[part.part_number] ?? PART_COLORS[1];
            return (
              <div key={part.part_number} style={{ marginBottom: 16 }}>
                {/* Part header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: colors.badge,
                      color: "white",
                    }}
                  >
                    Part {part.part_number}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                    {part.part_name}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>
                    {part.exercises.length} exercises
                  </span>
                </div>

                {/* Exercises */}
                {part.exercises.map((ex) => (
                  <ExerciseRow key={ex.id} ex={ex} />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WarmupPage() {
  const token   = useAuthStore((s) => s.token);
  const router  = useRouter();

  const [programs, setPrograms] = useState<WarmupProgram[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/warmup-programs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((body) => {
        setPrograms(Array.isArray(body.data) ? body.data : []);
      })
      .catch(() => setError("Could not load warmup programmes. Try again later."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 30,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
          aria-label="Back"
        >
          <ArrowLeft size={20} color="#374151" />
        </button>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
            Warmup Programmes
          </h1>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Structured pre-training activation routines
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Loading skeleton */}
        {loading && (
          <div>
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 84,
                  background: "white",
                  borderRadius: 14,
                  marginBottom: 16,
                  animation: "pulse 1.5s ease-in-out infinite",
                  border: "1px solid #e5e7eb",
                }}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "14px 16px",
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && programs.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 16px", color: "#6b7280" }}>
            <Clock size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              No warmup programmes yet
            </p>
            <p style={{ fontSize: 13 }}>
              Programmes will appear here once your coach or admin adds them.
            </p>
          </div>
        )}

        {/* Programme cards */}
        {!loading && !error && programs.map((p) => (
          <ProgramCard key={p.id} program={p} />
        ))}

        {/* AI form-check legend */}
        {!loading && !error && programs.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <Zap size={14} color="#c8962a" />
            <span style={{ fontSize: 12, color: "#92400e" }}>
              Exercises marked with this icon have AI pose feedback available in the GrassRoots mobile app.
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
