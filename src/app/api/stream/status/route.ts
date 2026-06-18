// src/app/api/stream/status/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('http://139.84.250.73:8000/live', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    
    return NextResponse.json({ 
      isLive: response.ok,
      streamUrl: 'http://139.84.250.73:8000/live',
      mountPoint: '/live'
    });
  } catch (error) {
    return NextResponse.json({ 
      isLive: false, 
      error: String(error) 
    });
  }
}