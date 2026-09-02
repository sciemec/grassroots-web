import { revalidateTag, revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  revalidateTag(`player-${id}`);
  revalidatePath(`/player/public/${id}`);

  return NextResponse.json({ revalidated: true });
}
