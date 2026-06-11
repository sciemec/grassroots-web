// app/api/drills/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Drill unlock API
//
// GET  /api/drills?playerId=xxx
//      Returns all unlocked drills for the player, grouped by tier
//      Also returns which tier they are in and what is needed for the next tier
//
// POST /api/drills/unlock
//      Called after every test session — checks if a new drill should unlock
//      Takes: { playerId, sessionCount, aqScore, dq }
//      Returns: { newUnlock: DrillSuggestion | null, tierUnlocked: number }
//
// POST /api/drills/complete
//      Called when a player attempts a drill
//      Takes: { playerId, drillId, videoUrl? }
//      Returns: { completed: true, phaseGraduationReady: boolean }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── Drill tier rules — mirrors grs-engine resolveDrillTier() ─────────────────
// Kept here so the API can check independently of the engine
const TIER_RULES: Record<number, { sessionsRequired: number; aqRequired: number; label: string; source: string }> = {
  1: { sessionsRequired: 0,  aqRequired: 0,  label: 'Spark',   source: 'GRS Original'            },
  2: { sessionsRequired: 4,  aqRequired: 0,  label: 'Build',   source: 'England Football Learning' },
  3: { sessionsRequired: 8,  aqRequired: 0,  label: 'Develop', source: 'Costa Rica U14'            },
  4: { sessionsRequired: 16, aqRequired: 40, label: 'Perform', source: 'France U17 + Sundowns'     },
  5: { sessionsRequired: 26, aqRequired: 75, label: 'Elite',   source: 'Spain U23 + England Elite' },
};

// ── GET — fetch player's unlocked drills ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId');
  if (!playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 });
  }

  try {
    // Get gamification state — tells us current tier
    const gamification = await prisma.playerGamification.findUnique({
      where: { playerId },
    });

    const currentTier = gamification?.drillTierUnlocked ?? 1;

    // Get all drill progress records for this player
    const drillProgress = await prisma.playerDrillProgress.findMany({
      where:   { playerId },
      orderBy: { unlockedAt: 'asc' },
    });

    // Get next tier requirements
    const nextTierNum  = Math.min(5, currentTier + 1);
    const nextTierRule = TIER_RULES[nextTierNum];
    const sessionsLeft = Math.max(0, nextTierRule.sessionsRequired - (gamification?.totalSessions ?? 0));
    const aqNeeded     = Math.max(0, nextTierRule.aqRequired - (gamification?.xpTotal ?? 0));

    return NextResponse.json({
      currentTier,
      currentTierLabel:  TIER_RULES[currentTier].label,
      currentTierSource: TIER_RULES[currentTier].source,
      totalUnlocked:     drillProgress.filter(d => d.unlocked).length,
      totalCompleted:    drillProgress.filter(d => d.completed).length,
      drills:            drillProgress,
      nextTier: currentTier < 5 ? {
        tier:          nextTierNum,
        label:         nextTierRule.label,
        source:        nextTierRule.source,
        sessionsNeeded: sessionsLeft,
        aqNeeded,
        unlockReady:   sessionsLeft === 0 && aqNeeded === 0,
      } : null,
    });
  } catch (err) {
    console.error('GET /api/drills error:', err);
    return NextResponse.json({ error: 'Failed to fetch drills' }, { status: 500 });
  }
}

// ── POST — handle unlock or complete actions ──────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'unlock') return handleUnlock(body);
  if (action === 'complete') return handleComplete(body);

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// ── Unlock: called after every test session ───────────────────────────────────
// One new drill unlocks per session — never all at once
async function handleUnlock(body: {
  playerId:     string;
  sessionCount: number;
  aqScore:      number;
  dq:           number | null;
  position:     string;
}) {
  const { playerId, sessionCount, aqScore, dq, position } = body;

  try {
    // 1. Determine which tier the player is now in
    const newTier = resolveNewTier(sessionCount, aqScore, dq);

    // 2. Update gamification record
    await prisma.playerGamification.upsert({
      where:  { playerId },
      create: {
        playerId,
        totalSessions:     sessionCount,
        drillTierUnlocked: newTier,
        lastTestAt:        new Date(),
        weeklyStreak:      1,
      },
      update: {
        totalSessions:     sessionCount,
        drillTierUnlocked: newTier,
        lastTestAt:        new Date(),
      },
    });

    // 3. Find which drills are already unlocked for this player
    const existing = await prisma.playerDrillProgress.findMany({
      where: { playerId },
    });
    const unlockedIds = new Set(existing.map(d => d.drillId));

    // 4. Get the pool of drills available at current tier for this position
    const availableForTier = getDrillPoolForTier(newTier, position);
    const nextDrill = availableForTier.find(d => !unlockedIds.has(d.id));

    if (!nextDrill) {
      // All tier drills already unlocked — check if phase graduation ready
      return NextResponse.json({
        newUnlock:             null,
        tierUnlocked:          newTier,
        phaseGraduationReady:  true,
        message:               'All drills in current tier unlocked. Phase graduation check ready.',
      });
    }

    // 5. Unlock the next drill
    await prisma.playerDrillProgress.upsert({
      where:  { playerId_drillId: { playerId, drillId: nextDrill.id } },
      create: {
        playerId,
        drillId:    nextDrill.id,
        unlocked:   true,
        unlockedAt: new Date(),
      },
      update: {
        unlocked:   true,
        unlockedAt: new Date(),
      },
    });

    return NextResponse.json({
      newUnlock: {
        id:       nextDrill.id,
        name:     nextDrill.name,
        duration: nextDrill.duration,
        tier:     newTier,
        source:   TIER_RULES[newTier].source,
        reason:   `Unlocked after session ${sessionCount} — your ${TIER_RULES[newTier].label} phase drill.`,
      },
      tierUnlocked:         newTier,
      phaseGraduationReady: false,
    });

  } catch (err) {
    console.error('POST /api/drills unlock error:', err);
    return NextResponse.json({ error: 'Unlock failed' }, { status: 500 });
  }
}

// ── Complete: called when player attempts a drill ─────────────────────────────
async function handleComplete(body: {
  playerId: string;
  drillId:  string;
  videoUrl?: string;
}) {
  const { playerId, drillId, videoUrl } = body;

  try {
    const updated = await prisma.playerDrillProgress.upsert({
      where:  { playerId_drillId: { playerId, drillId } },
      create: {
        playerId,
        drillId,
        unlocked:    true,
        completed:   true,
        completedAt: new Date(),
        attempts:    1,
        videoUrl,
      },
      update: {
        completed:   true,
        completedAt: new Date(),
        attempts:    { increment: 1 },
        videoUrl:    videoUrl ?? undefined,
      },
    });

    // Check if all drills in current tier are now complete → trigger graduation check
    const gamification = await prisma.playerGamification.findUnique({ where: { playerId } });
    const currentTier  = gamification?.drillTierUnlocked ?? 1;
    const tierDrills   = getDrillPoolForTier(currentTier, 'all');
    const completed    = await prisma.playerDrillProgress.findMany({
      where: { playerId, completed: true },
    });
    const completedIds = new Set(completed.map(d => d.drillId));
    const allComplete  = tierDrills.every(d => completedIds.has(d.id));

    return NextResponse.json({
      completed:            true,
      attempts:             updated.attempts,
      phaseGraduationReady: allComplete,
    });

  } catch (err) {
    console.error('POST /api/drills complete error:', err);
    return NextResponse.json({ error: 'Complete failed' }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveNewTier(sessions: number, aq: number, dq: number | null): number {
  if (sessions >= 26 && aq >= 75) return 5;
  if (sessions >= 16 && aq >= 40) return 4;
  if (sessions >= 8  && dq !== null && dq > 0) return 3;
  if (sessions >= 4)  return 2;
  return 1;
}

// Simplified drill pool — in production this reads from football-drill-matrix.ts
// Drill IDs must match the IDs in DRILL_LIBRARY in grs-engine.ts
function getDrillPoolForTier(tier: number, position: string): { id: string; name: string; duration: string }[] {
  const pools: Record<number, { id: string; name: string; duration: string }[]> = {
    1: [
      { id: 'grs_01', name: 'Basic ball familiarisation',   duration: '10 mins' },
      { id: 'grs_02', name: 'Cone dribble circuit',          duration: '10 mins' },
      { id: 'grs_03', name: 'Passing squares',               duration: '12 mins' },
      { id: 'grs_04', name: 'Single-leg balance challenge',  duration: '8 mins'  },
      { id: 'grs_05', name: 'Juggling ladder',               duration: '10 mins' },
    ],
    2: [
      { id: 'eng_st_01', name: "Lions' Den Central Turning",   duration: '15 mins' },
      { id: 'eng_md_02', name: 'Around the Clock Passing Ring', duration: '12 mins' },
      { id: 'eng_df_01', name: 'Angled Pressing and Dictation', duration: '15 mins' },
      { id: 'eng_gk_01', name: 'Ground diving and recovery',    duration: '15 mins' },
      { id: 'eng_st_02', name: 'Tri-Third Elimination Zones',   duration: '20 mins' },
    ],
    3: [
      { id: 'cr_01', name: 'Costa Rica 3v2 combination play', duration: '15 mins' },
      { id: 'cr_02', name: 'Overload pressing trigger',       duration: '20 mins' },
      { id: 'cr_03', name: 'Phase of play rondos',            duration: '15 mins' },
      { id: 'cr_04', name: 'Wide channel transitions',        duration: '20 mins' },
      { id: 'cr_05', name: 'Defensive block and recover',     duration: '15 mins' },
    ],
    4: [
      { id: 'fr_01', name: 'France U17 forward runs',       duration: '20 mins' },
      { id: 'fr_02', name: 'Sundowns unit defending',        duration: '25 mins' },
      { id: 'fr_03', name: 'High press trigger system',      duration: '20 mins' },
      { id: 'fr_04', name: 'Third man combination patterns', duration: '20 mins' },
      { id: 'fr_05', name: 'Sundowns transition attack',     duration: '25 mins' },
    ],
    5: [
      { id: 'el_01', name: 'Spain U23 positional rondo',     duration: '25 mins' },
      { id: 'el_02', name: 'England elite pressing game',    duration: '25 mins' },
      { id: 'el_03', name: 'Advanced individual pressing',   duration: '20 mins' },
      { id: 'el_04', name: 'Tactical flexibility session',   duration: '30 mins' },
      { id: 'el_05', name: 'Professional academy match prep',duration: '30 mins' },
    ],
  };
  return pools[tier] ?? pools[1];
}