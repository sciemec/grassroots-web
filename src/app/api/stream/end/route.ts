import { NextRequest, NextResponse } from "next/server";

interface EndStreamBody {
  room_name?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.DAILY_API_KEY;

  // No-op if Daily is not configured
  if (!apiKey) return NextResponse.json({ ok: true });

  const body = (await req.json().catch(() => ({}))) as EndStreamBody;
  const { room_name } = body;
  if (!room_name) return NextResponse.json({ ok: true });

  await fetch(`https://api.daily.co/v1/rooms/${room_name}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
