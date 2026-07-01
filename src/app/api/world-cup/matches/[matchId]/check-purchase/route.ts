import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ purchased: false });
  }

  try {
    const res = await fetch(
      `${apiUrl}/world-cup/blueprints/check?match_id=${params.matchId}`,
      { headers: { Authorization: authHeader } }
    );
    if (!res.ok) return NextResponse.json({ purchased: false });
    const data = await res.json();
    return NextResponse.json({ purchased: !!data.purchased });
  } catch {
    return NextResponse.json({ purchased: false });
  }
}
