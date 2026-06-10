// src/app/api/world-cup/[id]/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
// Make sure you are importing from your global instance wrapper, not creating a 'new PrismaClient()' here
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Missing identity parameter" }, { status: 400 });
    }

    const tournamentData = await prisma.tournament.findUnique({
      where: { id: String(id) }
    });

    if (!tournamentData) {
      return NextResponse.json({ error: "Tournament record not found" }, { status: 404 });
    }

    return NextResponse.json(tournamentData);
  } catch (error) {
    console.error("Database extraction failure on dynamic route:", error);
    return NextResponse.json({ error: "Internal operational error" }, { status: 500 });
  }
}