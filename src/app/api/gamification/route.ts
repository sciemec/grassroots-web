// app/api/gamification/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gamification API
//
// POST /api/gamification/session
//      Called after every completed test session
//      Takes: { playerId, aqScore, dq, sessionDate }
//      Returns: { rank, streak, xp, rankUp: bool, streakMessage }
//
// GET  /api/gamification?playerId=xxx
//      Returns full gamification state for the player dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PlayerRank } from '@/lib/grs-engine';

// ── XP rewards per action ─────────────────────────────────────────────────────
const XP_REWARDS = {
  session_completed:  20,
  full_battery:       30,   // bonus for all 6 tests
  coach_verified:     15,   // bonus for coach-verified session
  personal_best:      25,   // bonus for improving any domain score
  streak_7:           50,   // 7-week streak milestone
  streak_12:          100,  // 12-week streak milestone (3 months)
  streak_26:          200,  // 26-week streak (6 months) → Lion rank milestone
  drill_completed:    10,
  tier_unlocked:      40,
};

// ── Rank thresholds — mirrors grs-engine resolveRank() ───────────────────────
function resolveRank(aq: number, sessions: number, dq: number | null): PlayerRank {
  if (aq >= 75 && sessions >= 26 && dq !== null && dq > 0) return 'Lion';
  if (aq >= 60 && sessions >= 24 && dq !== null && dq > 0) return 'Star';
  if (aq >= 40 && sessions >= 16 && dq !== null)           return 'Attacker';
  if (sessions >= 8  && dq !== null && dq > 0)             return 'Skilled';
  if (sessions >= 4)                                        return 'Player';
  return 'Rookie';
}

// ── GET — fetch gamification state ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId');
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 });

  try {
    const g = await prisma.playerGamification.findUnique({ where: { playerId } });
    if (!g) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    return NextResponse.json({
      rank:             g.rank,
      xpTotal:          g.xpTotal,
      weeklyStreak:     g.weeklyStreak,
      longestStreak:    g.longestStreak,
      totalSessions:    g.totalSessions,
      drillTierUnlocked: g.drillTierUnlocked,
      badgesEarned:     g.badgesEarned,
      lastTestAt:       g.lastTestAt,
      // Days until streak resets (if no test this week)
      streakDaysLeft: g.lastTestAt
        ? Math.max(0, 7 - Math.floor((Date.now() - g.lastTestAt.getTime()) / 86400000))
        : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch gamification' }, { status: 500 });
  }
}

// ── POST — update after session ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'session') return handleSession(body);

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

async function handleSession(body: {
  playerId:        string;
  aqScore:         number;
  dq:              number | null;
  testsCompleted:  number;
  coachVerified:   boolean;
  sessionDate:     string;
  previousAQ?:     number;    // to detect personal bests
}) {
  const { playerId, aqScore, dq, testsCompleted, coachVerified, sessionDate, previousAQ } = body;

  try {
    // Get or create gamification record
    let g = await prisma.playerGamification.findUnique({ where: { playerId } });

    const now        = new Date(sessionDate);
    const totalSessions = (g?.totalSessions ?? 0) + 1;

    // ── Streak calculation ────────────────────────────────────────────────────
    let streak = 1;
    if (g?.lastTestAt) {
      const daysSinceLast = Math.floor(
        (now.getTime() - g.lastTestAt.getTime()) / 86400000
      );
      // Within 8 days = streak continues (7-day window with 1 day grace)
      streak = daysSinceLast <= 8 ? (g.weeklyStreak + 1) : 1;
    }
    const longestStreak = Math.max(streak, g?.longestStreak ?? 0);

    // ── XP calculation ────────────────────────────────────────────────────────
    let xpEarned = XP_REWARDS.session_completed;
    if (testsCompleted === 6)   xpEarned += XP_REWARDS.full_battery;
    if (coachVerified)          xpEarned += XP_REWARDS.coach_verified;
    if (previousAQ && aqScore > previousAQ) xpEarned += XP_REWARDS.personal_best;

    // Streak milestones
    if (streak === 7)  xpEarned += XP_REWARDS.streak_7;
    if (streak === 12) xpEarned += XP_REWARDS.streak_12;
    if (streak === 26) xpEarned += XP_REWARDS.streak_26;

    const xpTotal = (g?.xpTotal ?? 0) + xpEarned;

    // ── New rank ──────────────────────────────────────────────────────────────
    const newRank    = resolveRank(aqScore, totalSessions, dq);
    const oldRank    = g?.rank ?? 'Rookie';
    const rankedUp   = newRank !== oldRank;

    // ── Badges ────────────────────────────────────────────────────────────────
    const badges    = g?.badgesEarned ?? [];
    const newBadges = [...badges];
    if (streak === 4  && !badges.includes('streak_4'))  newBadges.push('streak_4');
    if (streak === 12 && !badges.includes('streak_12')) newBadges.push('streak_12');
    if (streak === 26 && !badges.includes('streak_26')) newBadges.push('streak_26');
    if (aqScore >= 80 && !badges.includes('elite_aq'))  newBadges.push('elite_aq');
    if (coachVerified && !badges.includes('first_verified')) newBadges.push('first_verified');

    // ── Streak message ────────────────────────────────────────────────────────
    const streakMessages: Record<number, string> = {
      4:  'One month of consistent testing. Your data is starting to build a real story.',
      8:  'Two months in. Your Development Quotient is now meaningful.',
      12: 'Three months. Scouts can see a genuine trend on your Talent Passport.',
      26: 'Six months. Lion rank achieved. Scout alerts are now active.',
    };
    const streakMessage = streakMessages[streak] ?? null;

    // ── Save ──────────────────────────────────────────────────────────────────
    const updated = await prisma.playerGamification.upsert({
      where:  { playerId },
      create: {
        playerId,
        rank:              newRank,
        xpTotal,
        weeklyStreak:      streak,
        longestStreak,
        lastTestAt:        now,
        totalSessions,
        drillTierUnlocked: 1,
        badgesEarned:      newBadges,
      },
      update: {
        rank:           newRank,
        xpTotal,
        weeklyStreak:   streak,
        longestStreak,
        lastTestAt:     now,
        totalSessions,
        badgesEarned:   newBadges,
      },
    });

    return NextResponse.json({
      rank:           newRank,
      previousRank:   oldRank,
      rankedUp,
      streak,
      longestStreak,
      xpTotal,
      xpEarned,
      badgesEarned:   newBadges,
      newBadges:      newBadges.filter(b => !badges.includes(b)),
      streakMessage,
      totalSessions,
    });

  } catch (err) {
    console.error('POST /api/gamification session error:', err);
    return NextResponse.json({ error: 'Gamification update failed' }, { status: 500 });
  }
}