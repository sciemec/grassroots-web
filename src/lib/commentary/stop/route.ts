// src/app/api/live-commentary/stop/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBroadcaster } from '@/lib/commentary/broadcaster';

let poller: any = null;

export async function POST(req: NextRequest) {
  try {
    const broadcaster = getBroadcaster();
    if (broadcaster) {
      await broadcaster.stop();
    }

    if (poller) {
      poller.stop();
      poller = null;
    }

    return NextResponse.json({
      success: true,
      message: 'Live commentary stopped',
    });
  } catch (error) {
    console.error('Stop commentary error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to stop commentary' 
    }, { status: 500 });
  }
}