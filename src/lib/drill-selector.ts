// lib/drill-selector.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gap-to-drill bridge: converts FocusGap[] from grs-engine into concrete
// Drill recommendations from the football-drill-matrix at the right difficulty.
//
// PHASE PROGRESSION ("just beyond current ability")
//   Each player has an age-appropriate phase (spark → build → develop →
//   perform → elite). Within the gap domain:
//     percentile < 25  → step BACK one phase (consolidate)
//     percentile 25–60 → current age phase
//     percentile > 60  → push to NEXT phase (stretch goal)
//
// This means a 14-year-old with a ball mastery percentile of 72 gets
// Develop+ (perform-phase) drills, not their default develop-phase drills.
// ─────────────────────────────────────────────────────────────────────────────

import { FOOTBALL_POSITION_DRILLS } from '@/config/football-drill-matrix';
import type { Drill, PositionKey } from '@/config/football-drill-matrix';
import type { FocusGap, AgeGroup, Position } from '@/lib/grs-engine';

// ── Phase ladder ──────────────────────────────────────────────────────────────
const PHASE_ORDER = ['spark', 'build', 'develop', 'perform', 'elite'] as const;
type Phase = (typeof PHASE_ORDER)[number];

const AGE_TO_PHASE: Record<AgeGroup, Phase> = {
  '6-9':   'spark',
  '10-12': 'build',
  '13-15': 'develop',
  '16-18': 'perform',
  '18+':   'elite',
};

function resolveTargetPhase(ageGroup: AgeGroup, percentile: number): Phase {
  const idx = PHASE_ORDER.indexOf(AGE_TO_PHASE[ageGroup]);
  if (percentile >= 60) return PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
  if (percentile < 25)  return PHASE_ORDER[Math.max(idx - 1, 0)];
  return AGE_TO_PHASE[ageGroup];
}

// ── Return type ───────────────────────────────────────────────────────────────
export interface DrillRecommendation {
  gap:         FocusGap;
  drill:       Drill;
  targetPhase: Phase;
}

// ── Main export ───────────────────────────────────────────────────────────────
//
// Usage:
//   const result  = evaluate(inputs, pastSessions);           // grs-engine
//   const recs    = getDrillsForGaps(result.focusGaps, result.position, result.ageGroup);
//
export function getDrillsForGaps(
  gaps: FocusGap[],
  position: Position,
  ageGroup: AgeGroup,
): DrillRecommendation[] {
  const posKey = position as PositionKey;
  const posConfig = FOOTBALL_POSITION_DRILLS[posKey];
  if (!posConfig) return [];

  const results: DrillRecommendation[] = [];

  for (const gap of gaps) {
    const targetPhase = resolveTargetPhase(ageGroup, gap.percentile);
    const phaseKey    = `${posKey}_${targetPhase}`;

    // Find the matching phase config
    const phaseConfig = posConfig.phases.find(p => p.phase === phaseKey);
    if (!phaseConfig || phaseConfig.drills.length === 0) continue;

    // Rank drills by how many of the gap's focus tags they share
    const ranked = [...phaseConfig.drills].sort((a, b) => {
      const aScore = a.focusCategories.filter(c => gap.focusTags.includes(c)).length;
      const bScore = b.focusCategories.filter(c => gap.focusTags.includes(c)).length;
      return bScore - aScore;
    });

    // Best match or first drill in the phase as fallback
    const drill: Drill = ranked[0];

    results.push({ gap, drill, targetPhase });
  }

  return results;
}
