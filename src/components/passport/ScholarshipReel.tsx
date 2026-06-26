"use client";

// src/components/passport/ScholarshipReel.tsx
// Scholarship Reel — 4-slot movement/technical/decision/physical showcase.
// editable=true  → player picks which drill result goes in each slot
// editable=false → scout read-only view (used inside PremiumGate)

import { useState, useEffect } from "react";
import { Video, Plus, X, ChevronDown, ChevronUp, Star } from "lucide-react";
import {
  allDrillResultsKey,
  getDrillsBySlot,
  type ReelSlot,
  type DrillResult,
} from "@/config/gemini-drills";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ReelClip {
  slot: ReelSlot;
  drillId: string;
  drillName: string;
  passportLabel: string;
  sport: string;
  overall_score: number;
  top_strength: string;
  analysedAt: string;
}

export interface ReelState {
  movement: ReelClip | null;
  technical: ReelClip | null;
  decision:  ReelClip | null;
  physical:  ReelClip | null;
}

export const EMPTY_REEL: ReelState = {
  movement: null,
  technical: null,
  decision:  null,
  physical:  null,
};

export const REEL_STORAGE_KEY = "gs_scholarship_reel";

// ── Slot metadata ─────────────────────────────────────────────────────────────

const SLOT_META: Record<ReelSlot, { label: string; sub: string; color: string; bg: string }> = {
  movement:  { label: "Movement",  sub: "Speed, agility, athletic mobility",   color: "#c8962a", bg: "#fffbeb" },
  technical: { label: "Technical", sub: "Sport-specific skill execution",       color: "#1a5c2a", bg: "#f0fdf4" },
  decision:  { label: "Decision",  sub: "Cognitive speed & game intelligence",  color: "#6d28d9", bg: "#f5f3ff" },
  physical:  { label: "Physical",  sub: "Power, endurance, functional fitness", color: "#0369a1", bg: "#eff6ff" },
};

const SLOT_ORDER: ReelSlot[] = ["movement", "technical", "decision", "physical"];

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s >= 8) return "#16a34a";
  if (s >= 6) return "#ca8a04";
  return "#dc2626";
}

function scoreLabel(s: number): string {
  if (s >= 8.5) return "Elite";
  if (s >= 7)   return "Strong";
  if (s >= 5.5) return "Developing";
  return "Needs Work";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  editable?:     boolean;
  playerName?:   string;
  sport?:        string;
  reel:          ReelState;
  onReelChange?: (reel: ReelState) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScholarshipReel({
  editable = false,
  playerName = "",
  sport = "football",
  reel,
  onReelChange,
}: Props) {
  const [allResults, setAllResults]       = useState<DrillResult[]>([]);
  const [openPicker, setOpenPicker]       = useState<ReelSlot | null>(null);
  const [expandedSlot, setExpandedSlot]   = useState<ReelSlot | null>(null);

  // Load all drill results the player has ever done (from localStorage)
  useEffect(() => {
    if (!editable || !playerName) return;
    try {
      const raw = typeof window !== "undefined"
        ? localStorage.getItem(allDrillResultsKey(playerName))
        : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setAllResults(parsed as DrillResult[]);
      }
    } catch {
      // silently fail
    }
  }, [editable, playerName]);

  // Filter available results for a given slot — must match reelSlot
  function resultsForSlot(slot: ReelSlot): DrillResult[] {
    const slotDrillIds = new Set(getDrillsBySlot(sport, slot).map((d) => d.id));
    return allResults.filter((r) => slotDrillIds.has(r.drillId));
  }

  function pickClip(slot: ReelSlot, result: DrillResult) {
    const clip: ReelClip = {
      slot,
      drillId:      result.drillId,
      drillName:    result.drillName,
      passportLabel: result.passportLabel,
      sport:        result.sport,
      overall_score: result.overall_score,
      top_strength:  result.top_strength,
      analysedAt:    result.analysedAt,
    };
    const next: ReelState = { ...reel, [slot]: clip };
    onReelChange?.(next);
    setOpenPicker(null);
  }

  function removeClip(slot: ReelSlot) {
    const next: ReelState = { ...reel, [slot]: null };
    onReelChange?.(next);
  }

  const filledCount = SLOT_ORDER.filter((s) => reel[s] !== null).length;

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Video size={18} color="#1a5c2a" />
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Scholarship Reel
          </p>
          <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
            {editable
              ? `${filledCount}/4 slots filled — picked from your Gemini drill results`
              : "AI-scored performance clips across 4 recruiter evaluation categories"}
          </p>
        </div>
      </div>

      {/* 4 slot cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SLOT_ORDER.map((slot) => {
          const meta    = SLOT_META[slot];
          const clip    = reel[slot];
          const isOpen  = expandedSlot === slot;
          const picking = openPicker === slot;
          const available = editable ? resultsForSlot(slot) : [];

          return (
            <div
              key={slot}
              style={{
                borderRadius: 12,
                border: `1.5px solid ${clip ? meta.color + "55" : "#e5e7eb"}`,
                background: clip ? meta.bg : "#fafafa",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Slot header */}
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: meta.color, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                    {meta.label}
                  </p>
                  <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>{meta.sub}</p>
                </div>

                {clip && editable && (
                  <button
                    onClick={() => removeClip(slot)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9ca3af" }}
                    title="Remove clip"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filled slot */}
              {clip ? (
                <div style={{ padding: "0 12px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: 0 }}>{clip.passportLabel}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} fill={scoreColor(clip.overall_score)} color={scoreColor(clip.overall_score)} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(clip.overall_score) }}>
                        {clip.overall_score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 10, color: "#6b7280", margin: "3px 0 6px" }}>
                    {scoreLabel(clip.overall_score)} · {new Date(clip.analysedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedSlot(isOpen ? null : slot)}
                    style={{
                      background: "none", border: `1px solid ${meta.color}44`,
                      borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                      fontSize: 10, color: meta.color, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {isOpen ? "Hide" : "Strength"} {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>

                  {isOpen && (
                    <p style={{ fontSize: 11, color: "#374151", marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>
                      &ldquo;{clip.top_strength}&rdquo;
                    </p>
                  )}

                  {editable && (
                    <button
                      onClick={() => setOpenPicker(picking ? null : slot)}
                      style={{
                        marginTop: 8, background: "none", border: "none",
                        fontSize: 10, color: "#9ca3af", cursor: "pointer", padding: 0,
                      }}
                    >
                      Change clip
                    </button>
                  )}
                </div>
              ) : (
                /* Empty slot */
                <div style={{ padding: "0 12px 12px" }}>
                  {editable ? (
                    <button
                      onClick={() => setOpenPicker(picking ? null : slot)}
                      style={{
                        width: "100%", border: `1.5px dashed ${meta.color}66`,
                        borderRadius: 8, padding: "10px 0", cursor: "pointer",
                        background: "none", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6, color: meta.color,
                        fontSize: 11, fontWeight: 700,
                      }}
                    >
                      <Plus size={14} />
                      Add {meta.label} clip
                    </button>
                  ) : (
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "8px 0", margin: 0 }}>
                      No clip added
                    </p>
                  )}
                </div>
              )}

              {/* Drill picker dropdown (editable mode) */}
              {picking && editable && (
                <div
                  style={{
                    margin: "0 12px 12px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {available.length === 0 ? (
                    <div style={{ padding: 12, textAlign: "center" }}>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                        No analysed {meta.label.toLowerCase()} drills yet.
                      </p>
                      <p style={{ fontSize: 10, color: "#d1d5db", marginTop: 4 }}>
                        Complete a Gemini drill in this category first.
                      </p>
                    </div>
                  ) : (
                    available.map((r) => (
                      <button
                        key={r.drillId}
                        onClick={() => pickClip(slot, r)}
                        style={{
                          width: "100%", background: "none", border: "none",
                          borderBottom: "1px solid #f3f4f6", padding: "9px 12px",
                          cursor: "pointer", textAlign: "left", display: "flex",
                          alignItems: "center", justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: 0 }}>{r.passportLabel}</p>
                          <p style={{ fontSize: 10, color: "#9ca3af", margin: "2px 0 0" }}>
                            {new Date(r.analysedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(r.overall_score) }}>
                          {r.overall_score.toFixed(1)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion note (editable) */}
      {editable && filledCount > 0 && filledCount < 4 && (
        <p style={{ fontSize: 11, color: "#ca8a04", marginTop: 12, textAlign: "center" }}>
          {4 - filledCount} more slot{4 - filledCount > 1 ? "s" : ""} — scouts want to see all 4 categories.
        </p>
      )}

      {editable && filledCount === 4 && (
        <p style={{ fontSize: 11, color: "#16a34a", marginTop: 12, textAlign: "center", fontWeight: 700 }}>
          Reel complete — all 4 categories showcased.
        </p>
      )}
    </div>
  );
}
