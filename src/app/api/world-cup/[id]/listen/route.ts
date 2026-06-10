// src/app/api/world-cup/[id]/listen/route.ts
// Stateless endpoint — no Prisma, no next-auth.
// Client tracks session duration locally; this route just acknowledges.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!params.id?.trim()) {
    return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action === 'start') {
      return NextResponse.json({
        sessionId: `session-${params.id}-${Date.now()}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
