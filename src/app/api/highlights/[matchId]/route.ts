import { NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'football-highlights-api.p.rapidapi.com';

export async function GET(request: Request, { params }: { params: { matchId: string } }) {
  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/highlights?matchId=${params.matchId}`, {
      headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY!, 'X-RapidAPI-Host': RAPIDAPI_HOST }
    });
    const data = await response.json();
    return NextResponse.json(data.data || []);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}