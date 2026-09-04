"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

// ── Field definitions (mirrors ProfileStrengthCard) ───────────────────────────

interface Field {
  id: string;
  chipLabel: string;
  benefit: string;
  pctGain: number;
  isFilled: (v: FieldValues) => boolean;
}

interface FieldValues {
  sport?: string;
  position?: string;
  province?: string;
  ageGroup?: string;
}

const FIELDS: Field[] = [
  {
    id: "sport",
    chipLabel: "Sport",
    benefit: "Unlocks sport-specific AI analysis and scouting matches",
    pctGain: 10,
    isFilled: (v) => Boolean(v.sport),
  },
  {
    id: "position",
    chipLabel: "Position",
    benefit: "Scouts filter by position — this gets you found",
    pctGain: 10,
    isFilled: (v) => Boolean(v.position),
  },
  {
    id: "province",
    chipLabel: "Province",
    benefit: "Appear in provincial talent searches",
    pctGain: 10,
    isFilled: (v) => Boolean(v.province),
  },
  {
    id: "age_group",
    chipLabel: "Age",
    benefit: "Matched to the right competitions and scouts",
    pctGain: 10,
    isFilled: (v) => Boolean(v.ageGroup),
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profileId: string;
  sport?: string;
  position?: string;
  province?: string;
  ageGroup?: string;
  pct: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PublicProfileCompletionNudge({
  profileId,
  sport,
  position,
  province,
  ageGroup,
  pct,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasHydrated && user?.id === profileId) {
      setVisible(true);
    }
  }, [hasHydrated, user, profileId]);

  if (!visible) return null;

  const values: FieldValues = { sport, position, province, ageGroup };
  const missing = FIELDS.filter((f) => !f.isFilled(values));
  const filled  = FIELDS.filter((f) =>  f.isFilled(values));
  const nextAction = missing[0] ?? null;

  if (pct >= 100) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3 mt-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-300">Profile complete</p>
            <p className="text-xs text-green-300/60">Scouts can find everything they need.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#f0b429]/10 bg-[#f0b429]/5 px-4 pt-4 pb-3">

      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]/60">
          Your profile strength
        </p>
        <span className="text-sm font-bold text-[#f0b429]">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0b429]/10 mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "#f0b429" }}
        />
      </div>

      {/* 4-chip checklist */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FIELDS.map((f) => {
          const done = f.isFilled(values);
          return (
            <div
              key={f.id}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                done
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-[#f0b429]/20 bg-[#f0b429]/5 text-[#f0b429]/40"
              }`}
            >
              {done
                ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                : <span className="h-2 w-2 rounded-full bg-[#f0b429]/20 shrink-0" />
              }
              {f.chipLabel}
            </div>
          );
        })}
      </div>

      {/* Next action — links to profile edit page */}
      {nextAction && (
        <Link
          href="/player/profile"
          className="block w-full rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-3 py-3 text-left transition-colors hover:bg-[#f0b429]/10 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
                  +{nextAction.pctGain}%
                </span>
                <span className="text-xs font-semibold text-white">Add {nextAction.chipLabel}</span>
              </div>
              <p className="text-[11px] text-[#f0b429]/40 leading-snug">{nextAction.benefit}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#f0b429]/60 shrink-0 ml-2" />
          </div>
        </Link>
      )}

      {/* Progress note */}
      <p className="mt-2.5 text-[10px] text-[#f0b429]/30 text-center">
        {filled.length} of {FIELDS.length} key fields complete · tap above to finish
      </p>
    </div>
  );
}
