/**
 * GET  /api/ubuntu/session-state?id=&role=&name=
 *   Returns current session state for the polling client.
 *
 * POST /api/ubuntu/session-state
 *   Body: { sessionId, phase, drillIndex, startAt }
 *   Host pushes phase transitions so the observer's client syncs.
 *
 * Storage: in-process Map (survives Vercel Edge hot reload within one instance).
 * For production multi-instance scale: replace with Redis / KV.
 * For a grassroots two-player session on one Vercel instance this works perfectly.
 */

import { NextRequest, NextResponse } from "next/server";

type SessionPhase =
  | "loading" | "waiting" | "intro" | "drill"
  | "feedback" | "rest" | "done";

interface SessionRecord {
  phase:       SessionPhase;
  drillIndex:  number;
  startAt:     number | null;
  playerA:     { name: string; points: number; lastSeen: number } | null;
  playerB:     { name: string; points: number; lastSeen: number } | null;
  updatedAt:   number;
}

// In-process store (single Vercel instance is fine for 2-player sessions)
const sessions = new Map<string, SessionRecord>();

const ONLINE_THRESHOLD_MS = 10_000; // 10 seconds without ping = offline

function getOrCreate(id: string): SessionRecord {
  if (!sessions.has(id)) {
    sessions.set(id, {
      phase:      "waiting",
      drillIndex: 0,
      startAt:    null,
      playerA:    null,
      playerB:    null,
      updatedAt:  Date.now(),
    });
  }
  return sessions.get(id)!;
}

// ── GET — client heartbeat + state read ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id   = searchParams.get("id");
  const role = searchParams.get("role") as "A" | "B" | null;
  const name = searchParams.get("name") ?? "";

  if (!id || !role) {
    return NextResponse.json({ error: "id and role required" }, { status: 400 });
  }

  const rec = getOrCreate(id);
  const now = Date.now();

  // Register heartbeat
  if (role === "A") {
    rec.playerA = { name, points: rec.playerA?.points ?? 0, lastSeen: now };
  } else {
    rec.playerB = { name, points: rec.playerB?.points ?? 0, lastSeen: now };
  }

  const partnerRole    = role === "A" ? "B" : "A";
  const partnerRecord  = role === "A" ? rec.playerB : rec.playerA;
  const partnerJoined  = !!partnerRecord && (now - partnerRecord.lastSeen) < ONLINE_THRESHOLD_MS;
  const partnerPoints  = partnerRecord?.points ?? 0;

  return NextResponse.json({
    phase:         rec.phase,
    drillIndex:    rec.drillIndex,
    startAt:       rec.startAt,
    partnerJoined,
    partnerName:   partnerRecord?.name ?? null,
    partnerPoints,
    partnerRole,
  });
}

// ── POST — host pushes phase transition ───────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: {
    sessionId:  string;
    phase:      SessionPhase;
    drillIndex: number;
    startAt:    number;
    points?:    { role: "A" | "B"; value: number };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { sessionId, phase, drillIndex, startAt, points } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const rec     = getOrCreate(sessionId);
  rec.phase     = phase;
  rec.drillIndex = drillIndex;
  rec.startAt   = startAt;
  rec.updatedAt = Date.now();

  if (points) {
    if (points.role === "A" && rec.playerA) {
      rec.playerA.points = (rec.playerA.points ?? 0) + points.value;
    }
    if (points.role === "B" && rec.playerB) {
      rec.playerB.points = (rec.playerB.points ?? 0) + points.value;
    }
  }

  return NextResponse.json({ ok: true });
}
