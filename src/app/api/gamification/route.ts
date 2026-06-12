// src/app/api/gamification/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gamification engine — rank, streak, XP, badges after every test session.
// Called by useSessionSubmit.ts step 2.
// Proxies to Laravel /player/gamification; falls back to local calculation.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

// Rank thresholds by AQ score
const RANKS = [
  { min: 90, rank: 'Elite',       xpPerSession: 150 },
  { min: 75, rank: 'Advanced',    xpPerSession: 100 },
  { min: 60, rank: 'Developing',  xpPerSession:  75 },
  { min: 40, rank: 'Foundation',  xpPerSession:  50 },
  { min:  0, rank: 'Beginner',    xpPerSession:  25 },
];

function resolveRank(aq: number) {
  return RANKS.find(r => aq >= r.min) ?? RANKS[RANKS.length - 1];
}

// Badge unlock logic
function checkBadges(streak: number, totalSessions: number, coachVerified: boolean): string[] {
  const badges: string[] = [];
  if (streak === 3)          badges.push('3-Week Streak');
  if (streak === 7)          badges.push('Iron Commitment');
  if (totalSessions === 1)   badges.push('First Test');
  if (totalSessions === 5)   badges.push('5 Sessions');
  if (totalSessions === 10)  badges.push('Dedicated Athlete');
  if (coachVerified)         badges.push('Coach Verified');
  return badges;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const authHeader = req.headers.get('authorization');

  const {
    playerId,
    aqScore     = 50,
    dq          = 50,
    coachVerified = false,
    sessionDate,
    previousAQ,
  } = body;

  // ── Try Laravel backend first ─────────────────────────────────────────────
  try {
    const res = await fetch(`${API}/player/gamification`, {
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
    // Fall through to local calculation
  }

  // ── Local calculation fallback (works offline) ────────────────────────────
  const rankInfo     = resolveRank(aqScore);
  const prevRankInfo = resolveRank(previousAQ ?? aqScore - 1);
  const rankedUp     = rankInfo.rank !== prevRankInfo.rank && aqScore > (previousAQ ?? 0);

  // Derive streak + totalSessions from localStorage hints in the request
  const totalSessions = body.totalSessions ?? 1;
  const streak        = body.streak        ?? 1;
  const xpTotal       = body.xpTotal       ?? rankInfo.xpPerSession;
  const xpEarned      = rankInfo.xpPerSession + (coachVerified ? 25 : 0) + (rankedUp ? 50 : 0);

  const newBadges  = checkBadges(streak, totalSessions, coachVerified);
  const streakMsg  = streak >= 3
    ? `🔥 ${streak}-week streak! Keep going.`
    : streak === 1
    ? '⚡ Session logged. Come back next week for a streak bonus!'
    : null;

  return NextResponse.json({
    rank:           rankInfo.rank,
    previousRank:   prevRankInfo.rank,
    rankedUp,
    streak,
    xpEarned,
    xpTotal:        xpTotal + xpEarned,
    newBadges,
    streakMessage:  streakMsg,
    totalSessions,
    dq,
    offline:        true,
  });
}
