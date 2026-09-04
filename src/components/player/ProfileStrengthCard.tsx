"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, X } from "lucide-react";
import api from "@/lib/api";

// ── Field definitions ────────────────────────────────────────────────────────

const SPORT_OPTIONS = [
  "football", "rugby", "athletics", "netball",
  "basketball", "cricket", "swimming", "tennis",
  "volleyball", "hockey",
];

const POSITION_OPTIONS = [
  "Goalkeeper", "Right Back", "Left Back", "Centre Back",
  "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
  "Right Winger", "Left Winger", "Centre Forward", "Striker",
];

const PROVINCE_OPTIONS = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const AGE_GROUP_OPTIONS = [
  { value: "u12", label: "Under 12" },
  { value: "u14", label: "Under 14" },
  { value: "u16", label: "Under 16" },
  { value: "u17", label: "Under 17" },
  { value: "u18", label: "Under 18" },
  { value: "u20", label: "Under 20" },
  { value: "u23", label: "Under 23" },
  { value: "senior", label: "Senior" },
];

// Priority-ordered questions — the component asks these in order, skipping filled ones
interface Question {
  id: string;
  label: string;
  chipLabel: string;
  benefit: string;
  pctGain: number;
  apiKey: string;
  getValue: (vals: FieldValues) => string | undefined;
  options: { value: string; label: string }[];
}

interface FieldValues {
  sport?: string;
  position?: string;
  province?: string;
  age_group?: string;
}

const QUESTIONS: Question[] = [
  {
    id: "sport",
    label: "What sport do you play?",
    chipLabel: "Sport",
    benefit: "Unlocks sport-specific AI analysis and scouting matches",
    pctGain: 10,
    apiKey: "sport",
    getValue: (v) => v.sport,
    options: SPORT_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
  },
  {
    id: "position",
    label: "What is your position?",
    chipLabel: "Position",
    benefit: "Scouts filter by position — this gets you found",
    pctGain: 10,
    apiKey: "position_primary",
    getValue: (v) => v.position,
    options: POSITION_OPTIONS.map((p) => ({ value: p.toLowerCase(), label: p })),
  },
  {
    id: "province",
    label: "Which province are you from?",
    chipLabel: "Province",
    benefit: "Appear in provincial talent searches",
    pctGain: 10,
    apiKey: "province",
    getValue: (v) => v.province,
    options: PROVINCE_OPTIONS.map((p) => ({ value: p, label: p })),
  },
  {
    id: "age_group",
    label: "Which age group are you in?",
    chipLabel: "Age",
    benefit: "Matched to the right competitions and scouts",
    pctGain: 10,
    apiKey: "age_group",
    getValue: (v) => v.age_group,
    options: AGE_GROUP_OPTIONS,
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sport?: string;
  position?: string;
  province?: string;
  ageGroup?: string;
  pct: number;
  onFieldSaved: (apiKey: string, value: string) => void;
}

// ── THUTO nudge (compliant with permanent THUTO UI rule — never auto-opens) ──
function nudgeThutoOnCompletion() {
  try {
    const alreadyNudged = localStorage.getItem("thuto_profile_complete_nudged");
    if (alreadyNudged) return;
    localStorage.setItem("thuto_preload_message",
      "Your profile is 100% complete! I can now generate a much more accurate talent prediction and match you with scouts who are specifically looking for players like you. Well done — most players never finish their profile. You are already ahead. Keep training and logging sessions to push your THUTO score higher."
    );
    const current = parseInt(localStorage.getItem("thuto_unread_count") ?? "0", 10);
    localStorage.setItem("thuto_unread_count", String(current + 1));
    localStorage.setItem("thuto_profile_complete_nudged", "true");
  } catch { /* localStorage unavailable */ }
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProfileStrengthCard({ sport, position, province, ageGroup, pct, onFieldSaved }: Props) {
  const [flowOpen, setFlowOpen]     = useState(false);
  const [flowStep, setFlowStep]     = useState(0);  // index into missing questions
  const [saving, setSaving]         = useState(false);
  const [localValues, setLocalValues] = useState<FieldValues>({
    sport, position, province, age_group: ageGroup,
  });

  const fieldValues: FieldValues = {
    sport:     localValues.sport     ?? sport,
    position:  localValues.position  ?? position,
    province:  localValues.province  ?? province,
    age_group: localValues.age_group ?? ageGroup,
  };

  // Questions that are still unanswered
  const missing = QUESTIONS.filter((q) => !q.getValue(fieldValues));
  const filled  = QUESTIONS.filter((q) =>  q.getValue(fieldValues));

  // The "next action" is the first missing question
  const nextAction = missing[0] ?? null;

  // Current question in the flow (clamp to valid range)
  const currentQ = missing[flowStep] ?? missing[missing.length - 1];

  const openFlow = () => {
    setFlowStep(0);
    setFlowOpen(true);
  };

  const handleSelect = async (question: Question, value: string) => {
    setSaving(true);
    try {
      await api.patch("/profile", { [question.apiKey]: value });
      const updatedValues = { ...localValues, [question.id]: value };
      setLocalValues(updatedValues);
      onFieldSaved(question.apiKey, value);

      // Advance to next unanswered question
      const stillMissing = QUESTIONS.filter(
        (q) => !q.getValue(updatedValues) && q.id !== question.id
      );
      if (stillMissing.length === 0) {
        setFlowOpen(false);
        // Check if 100% now — pct prop updates asynchronously, so check locally
        const allFilled = QUESTIONS.every((q) => q.getValue(updatedValues));
        if (allFilled) nudgeThutoOnCompletion();
      } else {
        setFlowStep(0); // always go to first remaining missing
      }
    } catch {
      // Silently fail — user can try again
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    const nextStep = flowStep + 1;
    if (nextStep >= missing.length) {
      setFlowOpen(false);
    } else {
      setFlowStep(nextStep);
    }
  };

  if (pct >= 100) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">Profile complete</p>
            <p className="text-xs text-green-400/60">Scouts can find everything they need. Keep logging sessions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Profile strength card ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-card px-4 pt-4 pb-3">

        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Profile strength
          </p>
          <span className="text-sm font-bold text-[#f0b429]">{pct}%</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 mb-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#f0b429" : "#f0b429" }}
          />
        </div>

        {/* 4-chip checklist */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {QUESTIONS.map((q) => {
            const done = Boolean(q.getValue(fieldValues));
            return (
              <div
                key={q.id}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                  done
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-white/10 bg-white/5 text-white/30"
                }`}
              >
                {done
                  ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                  : <span className="h-2 w-2 rounded-full bg-white/20 shrink-0" />
                }
                {q.chipLabel}
              </div>
            );
          })}
        </div>

        {/* Next action card */}
        {nextAction && (
          <button
            type="button"
            onClick={openFlow}
            className="w-full rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-3 py-3 text-left transition-colors hover:bg-[#f0b429]/10 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
                    +{nextAction.pctGain}%
                  </span>
                  <span className="text-xs font-semibold text-white">Add {nextAction.chipLabel}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-snug">{nextAction.benefit}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#f0b429]/60 shrink-0 ml-2" />
            </div>
          </button>
        )}

        {/* Progress note */}
        <p className="mt-2.5 text-[10px] text-white/20 text-center">
          {filled.length} of {QUESTIONS.length} key fields complete · {missing.length} remaining
        </p>
      </div>

      {/* ── Single-question flow modal ────────────────────────────────────── */}
      {flowOpen && currentQ && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151515] shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex gap-1.5">
                {missing.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === flowStep ? "w-6 bg-[#f0b429]" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFlowOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/50" />
              </button>
            </div>

            {/* Question */}
            <div className="px-5 pb-2">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                {flowStep + 1} of {missing.length}
              </p>
              <h3 className="text-base font-bold text-white mb-0.5">{currentQ.label}</h3>
              <p className="text-xs text-white/40">{currentQ.benefit}</p>
            </div>

            {/* Options */}
            <div className="max-h-[40vh] overflow-y-auto px-5 pb-2">
              <div className={`grid gap-2 mt-3 ${currentQ.options.length > 6 ? "grid-cols-2" : "grid-cols-1"}`}>
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={saving}
                    onClick={() => handleSelect(currentQ, opt.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white text-left capitalize transition-colors hover:border-[#f0b429]/40 hover:bg-[#f0b429]/10 hover:text-[#f0b429] active:scale-[0.97] disabled:opacity-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3">
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
