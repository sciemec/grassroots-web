// app/api/coach/drills/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get coach info
    const coach = await prisma.coach.findUnique({
      where: { email: session.user.email },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const body = await req.json();
    const { drillId, playerIds, dueDate, coachNotes } = body;

    if (!drillId || !playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify drill exists
    const drill = await prisma.drill.findUnique({
      where: { externalId: drillId },
    });

    if (!drill) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    // Assign drill to each player
    const assignments = [];
    for (const playerId of playerIds) {
      const assignment = await prisma.playerDrillAssignment.upsert({
        where: {
          playerId_drillId: {
            playerId,
            drillId: drill.id,
          },
        },
        update: {
          assignedBy: coach.name || coach.email,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          coachNotes: coachNotes || undefined,
          status: "pending",
        },
        create: {
          playerId,
          drillId: drill.id,
          assignedBy: coach.name || coach.email,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          coachNotes: coachNotes || undefined,
          status: "pending",
        },
      });
      assignments.push(assignment);
    }

    return NextResponse.json({
      success: true,
      message: `Assigned drill to ${assignments.length} player(s)`,
      assignments,
    });
  } catch (error) {
    console.error("Assign drill error:", error);
    return NextResponse.json({ error: "Failed to assign drill" }, { status: 500 });
  }
}

// Get all assignments for a coach (to see which players have which drills)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coach = await prisma.coach.findUnique({
      where: { email: session.user.email },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const drillId = searchParams.get("drillId");
    const status = searchParams.get("status");

    const where: any = {};
    if (drillId) {
      const drill = await prisma.drill.findUnique({ where: { externalId: drillId } });
      if (drill) where.drillId = drill.id;
    }
    if (status) where.status = status;

    const assignments = await prisma.playerDrillAssignment.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
        drill: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    // Transform to include external drill ID
    const transformed = assignments.map((a) => ({
      ...a,
      drill: {
        ...a.drill,
        externalId: a.drill.externalId,
      },
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json({ error: "Failed to get assignments" }, { status: 500 });
  }
}