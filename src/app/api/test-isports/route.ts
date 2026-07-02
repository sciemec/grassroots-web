// src/app/api/test-isports/route.ts
import { NextResponse } from 'next/server';
import { getLiveMatches } from '@/lib/isports/client';

export async function GET() {
  try {
    const matches = await getLiveMatches('1');

    return NextResponse.json({
      success: true,
      count: Array.isArray(matches) ? matches.length : 0,
      matches: matches,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
