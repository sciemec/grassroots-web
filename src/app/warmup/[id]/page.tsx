"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Clock, ChevronLeft, ChevronRight,
  MapPin, Lightbulb, Timer, CheckCircle, RotateCcw,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WarmupExercise {
  id: string;
  part_number: number;
  part_name: string;
  sequence_order: number;
  name: string;
  level: number | null;
  instructions: string | null;
  starting_position: string | null;
  coaching_cues: string | null;
  dosage: string | null;
  mediapipe_form_check: boolean;
}

interface WarmupPart {
  part_number: number;
  part_name: string;
  exercises: WarmupExercise[];
}

interface WarmupProgram {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  total_duration_minutes: number | null;
  parts: WarmupPart[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<number, string> = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
  2: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  3: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
};

function partLabel(partName: string, level: number | null, hasLevels: boolean) {
  const base = partName;
  if (!hasLevels || level === null) return base;
  return `${base} · Level ${level} (${LEVEL_LABELS[level]})`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WarmupPlayerPage() {
  const _params = useParams<{ id: string }>();
  const id = _params?.id;
  const token = useAuthStore((s) => s.token);

  const [program, setProgram] = useState<WarmupProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [showLevelPicker, setShowLevelPicker] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`${API}/warmup-programs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setProgram(j.data ?? null))
      .catch(() => setError("Could not load this programme."))
      .finally(() => setLoading(false));
  }, [token, id]);

  // Detect whether programme has levelled exercises (any exercise with level !== null)
  const hasLevels = useMemo(() => {
    if (!program) return false;
    return program.parts.some((p) => p.exercises.some((e) => e.level !== null));
  }, [program]);

  // Build the flat exercise list for the selected level
  const flatExercises = useMemo<WarmupExercise[]>(() => {
    if (!program) return [];
    const list: WarmupExercise[] = [];
    for (const part of program.parts) {
      for (const ex of part.exercises) {
        if (ex.level === null || ex.level === selectedLevel) {
          list.push(ex);
        }
      }
    }
    return list;
  }, [program, selectedLevel]);

  const total = flatExercises.length;
  const current = flatExercises[currentIndex] ?? null;

  const handleLevelSelect = (level: 1 | 2 | 3) => {
    setSelectedLevel(level);
    setShowLevelPicker(false);
    setCurrentIndex(0);
    setDone(false);
  };

  const handleLevelChange = useCallback((level: 1 | 2 | 3) => {
    // If currently in Part 2 (levelled section), jump to first Part 2 exercise
    const isInPart2 = current?.level !== undefined && current?.level !== null;
    setSelectedLevel(level);
    if (isInPart2) {
      // Find first Part 2 exercise position in the new flat list
      // We need to recompute with the new level
      const newList: WarmupExercise[] = [];
      if (program) {
        for (const part of program.parts) {
          for (const ex of part.exercises) {
            if (ex.level === null || ex.level === level) newList.push(ex);
          }
        }
      }
      const firstPart2 = newList.findIndex((e) => e.level !== null);
      setCurrentIndex(firstPart2 >= 0 ? firstPart2 : 0);
    }
  }, [current, program]);

  const goNext = () => {
    if (currentIndex >= total - 1) { setDone(true); return; }
    setCurrentIndex((i) => i + 1);
  };
  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const restart = () => { setCurrentIndex(0); setDone(false); };

  // ── Render states ───────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen />;
  if (error || !program) return <ErrorScreen error={error} />;

  // Show level picker before starting (only for programmes with levels)
  if (hasLevels && showLevelPicker) {
    return (
      <LevelPickerScreen
        program={program}
        onSelect={handleLevelSelect}
      />
    );
  }

  // Completion screen
  if (done) {
    return (
      <CompletionScreen
        program={program}
        total={total}
        selectedLevel={selectedLevel}
        hasLevels={hasLevels}
        onRestart={restart}
      />
    );
  }

  if (!current) return null;

  const progress = Math.round(((currentIndex + 1) / total) * 100);
  const isLevelledExercise = current.level !== null;
  const levelColors = isLevelledExercise ? LEVEL_COLORS[current.level!] : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/warmup" style={{ color: "#6b7280", display: "flex", alignItems: "center", textDecoration: "none" }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{program.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
              {currentIndex + 1} / {total} exercises
              {program.total_duration_minutes ? ` · ${program.total_duration_minutes} min` : ""}
            </p>
          </div>
          {hasLevels && (
            <LevelBadgeButton
              level={selectedLevel}
              onSelect={handleLevelChange}
            />
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, backgroundColor: "#e5e7eb" }}>
          <div style={{ height: "100%", backgroundColor: "#1a5c2a", width: `${progress}%`, transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 100px" }}>

        {/* Part label */}
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a5c2a" }}>
            Part {current.part_number}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>·</span>
          <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
            {partLabel(current.part_name, current.level, hasLevels)}
          </span>
          {isLevelledExercise && levelColors && (
            <span style={{ fontSize: 11, fontWeight: 700, color: levelColors.text, backgroundColor: levelColors.bg, padding: "2px 8px", borderRadius: 10, border: `1px solid ${levelColors.border}` }}>
              Level {current.level} — {LEVEL_LABELS[current.level!]}
            </span>
          )}
        </div>

        {/* Main exercise card */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 16 }}>

          {/* Exercise name + dosage */}
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#111", lineHeight: 1.25, flex: 1 }}>
                {current.name}
              </h2>
              {current.dosage && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "5px 10px", borderRadius: 20, border: "1px solid #bbf7d0", whiteSpace: "nowrap", flexShrink: 0 }}>
                  <Timer size={11} /> {current.dosage}
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: "0 20px 20px" }}>

            {/* Starting position */}
            {current.starting_position && (
              <Section
                icon={<MapPin size={14} color="#2563eb" />}
                label="Starting Position"
                labelColor="#1d4ed8"
                bgColor="#eff6ff"
                borderColor="#bfdbfe"
              >
                {current.starting_position}
              </Section>
            )}

            {/* Instructions */}
            {current.instructions && (
              <Section
                icon={null}
                label="How To Do It"
                labelColor="#374151"
                bgColor="#f9fafb"
                borderColor="#e5e7eb"
              >
                {current.instructions}
              </Section>
            )}

            {/* Coaching cues */}
            {current.coaching_cues && (
              <Section
                icon={<Lightbulb size={14} color="#b45309" />}
                label="Coaching Cues"
                labelColor="#92400e"
                bgColor="#fffbeb"
                borderColor="#fde68a"
              >
                {current.coaching_cues}
              </Section>
            )}
          </div>
        </div>

        {/* Exercise dots row */}
        <ExerciseDots total={total} current={currentIndex} />
      </div>

      {/* Fixed bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        backgroundColor: "#fff", borderTop: "1px solid #e5e7eb",
        padding: "12px 16px",
        display: "flex", gap: 10,
        paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
      }}>
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px", borderRadius: 12, border: "1px solid #d1d5db",
            backgroundColor: currentIndex === 0 ? "#f9fafb" : "#fff",
            color: currentIndex === 0 ? "#d1d5db" : "#374151",
            fontWeight: 700, fontSize: 14, cursor: currentIndex === 0 ? "not-allowed" : "pointer",
          }}
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button
          onClick={goNext}
          style={{
            flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "13px", borderRadius: 12, border: "none",
            backgroundColor: "#1a5c2a", color: "#fff",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          {currentIndex >= total - 1 ? (
            <><CheckCircle size={18} /> Complete</>
          ) : (
            <>Next <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  icon, label, labelColor, bgColor, borderColor, children,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor: string;
  bgColor: string;
  borderColor: string;
  children: string;
}) {
  return (
    <div style={{ marginTop: 14, backgroundColor: bgColor, borderRadius: 10, border: `1px solid ${borderColor}`, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: labelColor }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function ExerciseDots({ total, current }: { total: number; current: number }) {
  if (total > 20) return null; // don't render for very long lists
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 5, flexWrap: "wrap", padding: "0 16px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? "#1a5c2a" : i < current ? "#86efac" : "#e5e7eb",
            transition: "all 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}

function LevelBadgeButton({
  level, onSelect,
}: {
  level: 1 | 2 | 3;
  onSelect: (l: 1 | 2 | 3) => void;
}) {
  const [open, setOpen] = useState(false);
  const c = LEVEL_COLORS[level];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontSize: 11, fontWeight: 700, color: c.text, backgroundColor: c.bg,
          border: `1px solid ${c.border}`, borderRadius: 20, padding: "4px 10px",
          cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        Level {level} ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
          backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden", minWidth: 160,
        }}>
          {([1, 2, 3] as const).map((l) => {
            const lc = LEVEL_COLORS[l];
            return (
              <button
                key={l}
                onClick={() => { onSelect(l); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 14px", border: "none", cursor: "pointer",
                  backgroundColor: l === level ? lc.bg : "#fff",
                  fontWeight: l === level ? 700 : 500, fontSize: 13, color: lc.text,
                }}
              >
                Level {l} — {LEVEL_LABELS[l]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LevelPickerScreen({
  program, onSelect,
}: {
  program: WarmupProgram;
  onSelect: (l: 1 | 2 | 3) => void;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/warmup" style={{ color: "#6b7280", display: "flex", alignItems: "center", textDecoration: "none" }}>
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{program.name}</span>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "36px 20px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Clock size={28} color="#fff" />
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#111" }}>Choose Your Level</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Select the level for Part 2 exercises.<br />You can change this at any time during the programme.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {([1, 2, 3] as const).map((level) => {
            const c = LEVEL_COLORS[level];
            const subtitles: Record<number, string> = {
              1: "New to the programme or returning after injury",
              2: "Comfortable with Level 1 exercises",
              3: "Experienced — full range of motion and load",
            };
            return (
              <button
                key={level}
                onClick={() => onSelect(level)}
                style={{
                  width: "100%", textAlign: "left",
                  backgroundColor: "#fff", border: "2px solid #e5e7eb",
                  borderRadius: 14, padding: "18px 20px",
                  cursor: "pointer", transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a5c2a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Level {level} — {LEVEL_LABELS[level]}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.text, backgroundColor: c.bg, padding: "3px 10px", borderRadius: 20, border: `1px solid ${c.border}` }}>
                    Part 2
                  </span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>{subtitles[level]}</p>
              </button>
            );
          })}
        </div>

        {program.total_duration_minutes && (
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9ca3af" }}>
            <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Approximately {program.total_duration_minutes} minutes total
          </p>
        )}
      </div>
    </div>
  );
}

function CompletionScreen({
  program, total, selectedLevel, hasLevels, onRestart,
}: {
  program: WarmupProgram;
  total: number;
  selectedLevel: 1 | 2 | 3;
  hasLevels: boolean;
  onRestart: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/warmup" style={{ color: "#6b7280", display: "flex", alignItems: "center", textDecoration: "none" }}>
          <ArrowLeft size={18} />
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{program.name}</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "36px 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle size={36} color="#fff" />
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#111" }}>Warm-Up Complete!</h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
            You completed all {total} exercises{hasLevels ? ` at Level ${selectedLevel} (${LEVEL_LABELS[selectedLevel]})` : ""}.
            You&apos;re ready to train.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onRestart}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 22px", borderRadius: 12, border: "1px solid #d1d5db",
                backgroundColor: "#fff", color: "#374151",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              <RotateCcw size={15} /> Do Again
            </button>
            <Link
              href="/warmup"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 22px", borderRadius: 12, border: "none",
                backgroundColor: "#1a5c2a", color: "#fff",
                fontWeight: 700, fontSize: 14, textDecoration: "none",
              }}
            >
              All Programmes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <div style={{ height: 16, width: 140, backgroundColor: "#e5e7eb", borderRadius: 5 }} />
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ height: 14, width: "40%", backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 20 }} />
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "20px" }}>
          <div style={{ height: 22, width: "60%", backgroundColor: "#e5e7eb", borderRadius: 6, marginBottom: 20 }} />
          <div style={{ height: 80, backgroundColor: "#f1f5f9", borderRadius: 10, marginBottom: 12 }} />
          <div style={{ height: 120, backgroundColor: "#f1f5f9", borderRadius: 10, marginBottom: 12 }} />
          <div style={{ height: 80, backgroundColor: "#f1f5f9", borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{error || "Programme not found."}</p>
        <Link href="/warmup" style={{ color: "#1a5c2a", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>← Back to programmes</Link>
      </div>
    </div>
  );
}
