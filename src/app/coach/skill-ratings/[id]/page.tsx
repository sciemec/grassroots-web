"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconChevronLeft,
  IconStar,
  IconCheck,
  IconRuler,
} from "@tabler/icons-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Skills config ─────────────────────────────────────────────────────────

const SKILLS = [
  { code: "dribbling",   label: "Dribbling",    emoji: "🏃" },
  { code: "first_touch", label: "First Touch",   emoji: "🎯" },
  { code: "shooting",    label: "Shooting",      emoji: "⚽" },
  { code: "sprint",      label: "Sprint",        emoji: "💨" },
  { code: "passing",     label: "Passing",       emoji: "🔄" },
  { code: "tackling",    label: "Tackling",      emoji: "🛡️" },
] as const;

type SkillCode = (typeof SKILLS)[number]["code"];

// ─── Position field-test config ────────────────────────────────────────────

type PositionGroup = "goalkeeper" | "defender" | "midfielder" | "forward";

interface FieldTest {
  key: string;
  label: string;
  unit: string;
  benchmark: string;
  domain: string;
  desc: string;
}

const POSITION_FIELD_TESTS: Record<PositionGroup, FieldTest[]> = {
  goalkeeper: [
    { key: "reaction_save",    label: "Reaction save",          unit: "saves/10",   benchmark: "6",  domain: "cognitiveSpeed",  desc: "Saves from 5m point-blank — 10 attempts" },
    { key: "distribution_acc", label: "Distribution accuracy",  unit: "accurate/10",benchmark: "7",  domain: "ballMastery",     desc: "Accurate throws/kicks to marked zones" },
    { key: "dive_reach_left",  label: "Dive reach left",        unit: "metres",     benchmark: "2.3",domain: "explosivePower",  desc: "Max horizontal reach diving left" },
    { key: "dive_reach_right", label: "Dive reach right",       unit: "metres",     benchmark: "2.3",domain: "explosivePower",  desc: "Max horizontal reach diving right" },
  ],
  defender: [
    { key: "sprint_40m",       label: "40m sprint",             unit: "seconds",    benchmark: "5.2",domain: "linearSpeed",     desc: "Flat 40m from standing start" },
    { key: "tackle_success",   label: "1v1 tackle success",     unit: "won/10",     benchmark: "6",  domain: "cognitiveSpeed",  desc: "Won tackles in controlled 1v1 drill" },
    { key: "clearance_dist",   label: "Clearance distance",     unit: "metres",     benchmark: "30", domain: "explosivePower",  desc: "Average clearance distance under pressure" },
    { key: "pass_accuracy_d",  label: "Pass accuracy",          unit: "accurate/30",benchmark: "22", domain: "ballMastery",     desc: "Accurate passes in possession drill" },
  ],
  midfielder: [
    { key: "sprint_20m",       label: "20m sprint",             unit: "seconds",    benchmark: "3.0",domain: "linearSpeed",     desc: "Flat 20m from standing start" },
    { key: "pass_accuracy_m",  label: "Passing accuracy",       unit: "accurate/30",benchmark: "24", domain: "ballMastery",     desc: "Accurate passes in rondo or pattern drill" },
    { key: "ball_retention",   label: "Ball retention 1v1",     unit: "retained/5", benchmark: "3",  domain: "cognitiveSpeed",  desc: "Retained possession in 1v1 pressure situation" },
    { key: "yoyo_level",       label: "Yo-Yo endurance",        unit: "level",      benchmark: "14", domain: "endurance",       desc: "Yo-Yo Intermittent Recovery Test level reached" },
  ],
  forward: [
    { key: "sprint_10m",       label: "10m sprint",             unit: "seconds",    benchmark: "1.7",domain: "linearSpeed",     desc: "10m explosive start — measures first-step speed" },
    { key: "shooting_acc",     label: "Shooting accuracy",      unit: "on target/10",benchmark:"5",  domain: "ballMastery",     desc: "Shots on target from edge of box — 10 attempts" },
    { key: "dribble_finish",   label: "Dribble + finish",       unit: "seconds",    benchmark: "8.5",domain: "cognitiveSpeed",  desc: "Slalom 20m then shoot — time to completion" },
    { key: "aerial_wins",      label: "Aerial duel wins",       unit: "won/10",     benchmark: "4",  domain: "explosivePower",  desc: "Won aerial challenges in cross-delivery drill" },
  ],
};

const POSITION_GROUP_LABELS: Record<PositionGroup, string> = {
  goalkeeper: "Goalkeeper",
  defender:   "Defender",
  midfielder: "Midfielder",
  forward:    "Forward",
};

function detectPositionGroup(position: string | null): PositionGroup {
  if (!position) return "midfielder";
  const p = position.toLowerCase();
  if (p.includes("keeper") || p.includes("gk") || p === "goalkeeper") return "goalkeeper";
  if (p.includes("back") || p.includes("centre-back") || p.includes("cb") || p.includes("defender") || p === "lb" || p === "rb") return "defender";
  if (p.includes("forward") || p.includes("striker") || p.includes("winger") || p.includes("cf") || p === "st") return "forward";
  return "midfielder";
}

function segColor(seg: number): string {
  if (seg <= 3) return "#ef4444";
  if (seg <= 5) return "#f59e0b";
  if (seg <= 7) return "#4ade80";
  if (seg <= 9) return "#c0dd97";
  return "#c8962a";
}

type PlayerData = {
  id: string;
  first_name: string;
  surname: string;
  sport: string | null;
  position: string | null;
  date_of_birth: string | null;
  match_status: string;
};

// ─── SkillRow ──────────────────────────────────────────────────────────────

function SkillRow({
  skill,
  value,
  notes,
  onChange,
  onNotesChange,
}: {
  skill: { code: SkillCode; label: string; emoji: string };
  value: number;
  notes: string;
  onChange: (v: number) => void;
  onNotesChange: (n: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{skill.emoji}</span>
          <span style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>
            {skill.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowNotes((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: showNotes ? "#c8962a" : "#555",
              fontSize: 10,
              fontWeight: 600,
              padding: 0,
            }}
          >
            {showNotes ? "hide note" : "add note"}
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: value ? segColor(value) : "#2a2a2a",
                minWidth: 28,
                textAlign: "right",
                lineHeight: 1,
              }}
            >
              {value || "—"}
            </span>
            <span style={{ color: "#444", fontSize: 11 }}>/10</span>
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 3 }}
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const seg = i + 1;
          const filled = seg <= (hovered || value);
          const col = segColor(seg);
          return (
            <button
              key={seg}
              onClick={() => onChange(value === seg ? 0 : seg)}
              onMouseEnter={() => setHovered(seg)}
              style={{
                flex: 1,
                height: 30,
                borderRadius: 5,
                border: "none",
                cursor: "pointer",
                background: filled ? col : "#1a1a1a",
                boxShadow: filled ? `0 0 6px ${col}55` : "none",
                transition: "background 0.08s",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          paddingLeft: 2,
          paddingRight: 2,
        }}
      >
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Poor</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Average</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Good</span>
        <span style={{ color: "#3a3a3a", fontSize: 9 }}>Elite</span>
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={`Coaching note for ${skill.label.toLowerCase()}…`}
          rows={2}
          style={{
            marginTop: 8,
            width: "100%",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            color: "#ccc",
            fontSize: 12,
            padding: "8px 10px",
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SkillRaterPage() {
  const token  = useAuthStore((s) => s.token);
  const params = useParams<{ id: string }>();
  const id     = params?.id ?? "";

  const [player,        setPlayer]        = useState<PlayerData | null>(null);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [ratingsLoaded, setRatingsLoaded] = useState(false);
  const [ratings,       setRatings]       = useState<Record<string, number>>({});
  const [notes,         setNotes]         = useState<Record<string, string>>({});
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Tab switcher
  const [activeTab, setActiveTab] = useState<"skills" | "fieldtests">("skills");

  // Field tests state
  const [positionGroup,    setPositionGroup]    = useState<PositionGroup>("midfielder");
  const [fieldValues,      setFieldValues]      = useState<Record<string, string>>({});
  const [fieldTestsLoaded, setFieldTestsLoaded] = useState(false);
  const [savingTests,      setSavingTests]      = useState(false);
  const [savedTests,       setSavedTests]       = useState(false);
  const [fieldError,       setFieldError]       = useState<string | null>(null);

  // ── Load player + skill ratings ─────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;

    Promise.all([
      fetch(`${API}/coach/registered-players/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API}/coach/registered-players/${id}/skill-ratings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ])
      .then(([playerJson, ratingsJson]) => {
        const p = playerJson.data ?? null;
        setPlayer(p);
        if (p) setPositionGroup(detectPositionGroup(p.position));
        const rMap: Record<string, number> = {};
        const nMap: Record<string, string> = {};
        if (Array.isArray(ratingsJson.data)) {
          ratingsJson.data.forEach(
            (r: { skill_code: string; rating: number; notes?: string | null }) => {
              rMap[r.skill_code] = r.rating;
              nMap[r.skill_code] = r.notes ?? "";
            }
          );
        }
        setRatings(rMap);
        setNotes(nMap);
        setRatingsLoaded(true);
      })
      .catch(() => setRatingsLoaded(true))
      .finally(() => setPageLoading(false));
  }, [token, id]);

  // ── Load field tests ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id || activeTab !== "fieldtests") return;
    if (fieldTestsLoaded) return;

    fetch(`${API}/coach/registered-players/${id}/field-tests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const vals: Record<string, string> = {};
        if (Array.isArray(json.data)) {
          json.data.forEach(
            (t: { test_name: string; raw_value: string; position: string }) => {
              // Find the key for this test_name + position so we can pre-fill the input
              const group = t.position as PositionGroup;
              const tests = POSITION_FIELD_TESTS[group] ?? [];
              const match = tests.find(
                (ft) => ft.label.toLowerCase() === t.test_name.toLowerCase()
              );
              if (match) {
                vals[`${group}:${match.key}`] = t.raw_value;
              }
            }
          );
        }
        setFieldValues(vals);
        setFieldTestsLoaded(true);
      })
      .catch(() => setFieldTestsLoaded(true));
  }, [token, id, activeTab, fieldTestsLoaded]);

  // ── Overall score ────────────────────────────────────────────────────────
  const ratedSkills = SKILLS.filter((s) => (ratings[s.code] ?? 0) > 0);
  const overallScore =
    ratedSkills.length > 0
      ? (
          ratedSkills.reduce((sum, s) => sum + ratings[s.code], 0) /
          ratedSkills.length
        ).toFixed(1)
      : null;

  const overallColor = overallScore
    ? parseFloat(overallScore) >= 8
      ? "#c0dd97"
      : parseFloat(overallScore) >= 6
      ? "#fac775"
      : parseFloat(overallScore) >= 4
      ? "#fb923c"
      : "#f87171"
    : "#2a2a2a";

  // ── Save skill ratings ───────────────────────────────────────────────────
  async function saveRatings() {
    const payload = SKILLS.filter((s) => (ratings[s.code] ?? 0) >= 1).map(
      (s) => ({
        code:   s.code,
        rating: ratings[s.code],
        notes:  notes[s.code] || null,
      })
    );

    if (payload.length === 0) {
      setError("Tap the segments to rate at least one skill before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(
        `${API}/coach/registered-players/${id}/skill-ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ratings: payload }),
        }
      );
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const json = await res.json();
        setError(json.message ?? "Failed to save. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Save field tests ─────────────────────────────────────────────────────
  async function saveFieldTests() {
    const tests = POSITION_FIELD_TESTS[positionGroup];
    const payload = tests
      .map((t) => ({
        test_name: t.label,
        raw_value: fieldValues[`${positionGroup}:${t.key}`] ?? "",
        unit:      t.unit,
        benchmark: t.benchmark,
        domain:    t.domain,
      }))
      .filter((t) => t.raw_value.trim() !== "");

    if (payload.length === 0) {
      setFieldError("Enter at least one test result before saving.");
      return;
    }

    setSavingTests(true);
    setFieldError(null);
    setSavedTests(false);

    try {
      const res = await fetch(
        `${API}/coach/registered-players/${id}/field-tests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ position: positionGroup, tests: payload }),
        }
      );
      if (res.ok) {
        setSavedTests(true);
        setTimeout(() => setSavedTests(false), 3000);
      } else {
        const json = await res.json();
        setFieldError(json.message ?? "Failed to save. Try again.");
      }
    } catch {
      setFieldError("Network error. Try again.");
    } finally {
      setSavingTests(false);
    }
  }

  // ── Loading / not found ──────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0e0e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#555", fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0e0e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ color: "#555", fontSize: 13 }}>Player not found.</div>
        <Link
          href="/coach/skill-ratings"
          style={{ color: "#c0dd97", fontSize: 13 }}
        >
          ← Back to Skill Ratings
        </Link>
      </div>
    );
  }

  const age = player.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(player.date_of_birth).getTime()) /
          (365.25 * 24 * 3600 * 1000)
      )
    : null;

  const currentTests = POSITION_FIELD_TESTS[positionGroup];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 100 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 16px 0",
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href="/coach/skill-ratings"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#1a1a1a",
            color: "#999",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <IconChevronLeft size={18} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {player.first_name} {player.surname}
          </div>
          <div style={{ color: "#777", fontSize: 11, marginTop: 1 }}>
            {[player.sport, player.position, age ? `${age} yrs` : null]
              .filter(Boolean)
              .join(" · ") || "Skill rating"}
          </div>
        </div>
        <IconStar size={18} color="#c8962a" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 0" }}>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            background: "#151515",
            borderRadius: 12,
            padding: 4,
          }}
        >
          {(["skills", "fieldtests"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background: activeTab === tab ? "#1a5c2a" : "transparent",
                color: activeTab === tab ? "#c0dd97" : "#555",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {tab === "skills" ? "Skill Ratings" : "Field Tests"}
            </button>
          ))}
        </div>

        {/* ── TAB A: Skill Ratings ─────────────────────────────────────────── */}
        {activeTab === "skills" && (
          <>
            {/* Overall score card */}
            <div
              style={{
                background: "#151515",
                borderRadius: 16,
                padding: "22px 20px",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#555",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: 8,
                }}
              >
                Overall Rating
              </div>
              <div
                style={{
                  fontSize: 60,
                  fontWeight: 900,
                  color: overallColor,
                  lineHeight: 1,
                }}
              >
                {overallScore ?? "—"}
              </div>
              <div style={{ color: "#444", fontSize: 11, marginTop: 8 }}>
                {overallScore
                  ? `${ratedSkills.length} of ${SKILLS.length} skills rated`
                  : "Tap the segments below to rate each skill"}
              </div>

              <div
                style={{
                  marginTop: 14,
                  background: "#0e0e0e",
                  borderRadius: 4,
                  height: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: overallScore
                      ? `${(parseFloat(overallScore) / 10) * 100}%`
                      : "0%",
                    background: `linear-gradient(90deg, #1a5c2a, ${overallColor})`,
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Skill rows */}
            <div
              style={{
                background: "#151515",
                borderRadius: 16,
                padding: "20px 16px 8px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: "#555",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: 20,
                }}
              >
                Tap segments to rate · 1 = poor · 10 = elite
              </div>

              {!ratingsLoaded ? (
                <div
                  style={{
                    color: "#555",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  Loading ratings…
                </div>
              ) : (
                SKILLS.map((skill) => (
                  <SkillRow
                    key={skill.code}
                    skill={skill}
                    value={ratings[skill.code] ?? 0}
                    notes={notes[skill.code] ?? ""}
                    onChange={(v) =>
                      setRatings((prev) => ({ ...prev, [skill.code]: v }))
                    }
                    onNotesChange={(n) =>
                      setNotes((prev) => ({ ...prev, [skill.code]: n }))
                    }
                  />
                ))
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#1a0000",
                  borderRadius: 10,
                  color: "#f87171",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={saveRatings}
              disabled={saving}
              style={{
                width: "100%",
                padding: "15px 0",
                borderRadius: 14,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 700,
                background: saved ? "#0e4020" : saving ? "#1a1a1a" : "#1a5c2a",
                color: saved ? "#c0dd97" : saving ? "#555" : "#c0dd97",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              {saved ? (
                <>
                  <IconCheck size={16} />
                  Ratings Saved
                </>
              ) : saving ? (
                "Saving…"
              ) : (
                <>
                  <IconStar size={15} />
                  Save Ratings
                </>
              )}
            </button>
          </>
        )}

        {/* ── TAB B: Field Tests ───────────────────────────────────────────── */}
        {activeTab === "fieldtests" && (
          <>
            {/* Position group picker */}
            <div
              style={{
                background: "#151515",
                borderRadius: 16,
                padding: "16px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: "#555",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: 12,
                }}
              >
                Position group
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(Object.keys(POSITION_GROUP_LABELS) as PositionGroup[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setPositionGroup(g)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 20,
                      border: "1px solid",
                      borderColor: positionGroup === g ? "#1a5c2a" : "#2a2a2a",
                      background: positionGroup === g ? "#1a5c2a22" : "transparent",
                      color: positionGroup === g ? "#c0dd97" : "#666",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {POSITION_GROUP_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            {/* Test input rows */}
            <div
              style={{
                background: "#151515",
                borderRadius: 16,
                padding: "16px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  color: "#555",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: 16,
                }}
              >
                Enter test results
              </div>

              {currentTests.map((test) => {
                const valKey = `${positionGroup}:${test.key}`;
                return (
                  <div key={test.key} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: "#ddd", fontSize: 13, fontWeight: 600 }}>
                        {test.label}
                      </span>
                      <span style={{ color: "#444", fontSize: 10 }}>
                        benchmark: {test.benchmark} {test.unit}
                      </span>
                    </div>
                    <div style={{ color: "#555", fontSize: 11, marginBottom: 8 }}>
                      {test.desc}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={fieldValues[valKey] ?? ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [valKey]: e.target.value,
                          }))
                        }
                        placeholder="—"
                        style={{
                          flex: 1,
                          background: "#111",
                          border: "1px solid #2a2a2a",
                          borderRadius: 8,
                          color: "#fff",
                          fontSize: 15,
                          fontWeight: 700,
                          padding: "10px 12px",
                          outline: "none",
                        }}
                      />
                      <span
                        style={{
                          color: "#666",
                          fontSize: 11,
                          minWidth: 70,
                          textAlign: "right",
                        }}
                      >
                        {test.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {fieldError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#1a0000",
                  borderRadius: 10,
                  color: "#f87171",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {fieldError}
              </div>
            )}

            <button
              onClick={saveFieldTests}
              disabled={savingTests}
              style={{
                width: "100%",
                padding: "15px 0",
                borderRadius: 14,
                border: "none",
                cursor: savingTests ? "not-allowed" : "pointer",
                fontSize: 15,
                fontWeight: 700,
                background: savedTests ? "#0e4020" : savingTests ? "#1a1a1a" : "#1a5c2a",
                color: savedTests ? "#c0dd97" : savingTests ? "#555" : "#c0dd97",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              {savedTests ? (
                <>
                  <IconCheck size={16} />
                  Field Tests Saved
                </>
              ) : savingTests ? (
                "Saving…"
              ) : (
                <>
                  <IconRuler size={15} />
                  Save Field Tests
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
