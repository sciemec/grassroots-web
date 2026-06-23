import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const { matchId } = params;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ purchased: false });
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/world-cup/blueprints/check?match_id=${matchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ purchased: false });
    }

    const data = await res.json();
    return NextResponse.json({ purchased: data.purchased ?? false });
  } catch {
    return NextResponse.json({ purchased: false });
  }
}
