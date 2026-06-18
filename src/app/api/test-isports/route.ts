// src/app/api/test-isports/route.ts
import { NextResponse } from 'next/server';
import { getLiveMatches } from '@/lib/isports/client';

export async function GET() {
  try {
    const matches = await getLiveMatches('1');
    return NextResponse.json({ 
      success: true, 
      count: matches.length,
      matches: matches 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}