// src/app/api/drills/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Drill unlock API — selects the next drill after a test session.
// Called by useSessionSubmit.ts step 3: POST /api/drills { action: 'unlock' }
// Uses FOOTBALL_POSITION_DRILLS (already in repo) for offline operation.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { FOOTBALL_POSITION_DRILLS } from '@/config/football-drill-matrix';
import type { PositionKey } from '@/config/football-drill-matrix';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

// Map AQ score + session count to a phase index (0-4)
function resolvePhaseIndex(aqScore: number, sessionCount: number): number {
  if (aqScore >= 85 || sessionCount >= 20) return 4;
  if (aqScore >= 70 || sessionCount >= 12) return 3;
  if (aqScore >= 55 || sessionCount >=  6) return 2;
  if (aqScore >= 40 || sessionCount >=  2) return 1;
  return 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const authHeader = req.headers.get('authorization');

  const {
    playerId,
    sessionCount = 1,
    aqScore      = 50,
    dq           = 13,
    position     = 'midfielder',
  } = body;

  // ── Try Laravel backend first ─────────────────────────────────────────────
  try {
    const res = await fetch(`${API}/player/drills/unlock`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fall through to local matrix
  }

  // ── Local drill matrix fallback ───────────────────────────────────────────
  const posKey      = (position in FOOTBALL_POSITION_DRILLS ? position : 'midfielder') as PositionKey;
  const posConfig   = FOOTBALL_POSITION_DRILLS[posKey];
  const phaseIdx    = resolvePhaseIndex(aqScore, sessionCount);
  const phase       = posConfig.phases[phaseIdx];
  const tierNum     = phaseIdx + 1;

  // Pick a drill from the phase, rotating by session count
  const drills      = phase?.drills ?? [];
  const drillIdx    = (sessionCount - 1) % Math.max(drills.length, 1);
  const drill       = drills[drillIdx] ?? null;

  return NextResponse.json({
    newUnlock: drill
      ? {
          id:       drill.id,
          name:     drill.name,
          duration: drill.duration,
          reason:   `Unlocked at ${phase?.label ?? `Tier ${tierNum}`} for ${posKey}`,
        }
      : null,
    tierUnlocked:   tierNum,
    phase:          phase?.phase ?? null,
    totalAvailable: drills.length,
    offline:        true,
  });
}
