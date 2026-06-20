// src/app/api/live-commentary/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeBroadcaster, getBroadcaster } from '@/lib/commentary/broadcaster';
import { EventPoller } from '@/lib/commentary/poller';

let poller: EventPoller | null = null;

export async function POST(req: NextRequest) {
  try {
    const { matchId, icecastUrl, icecastPassword, mountPoint } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId required' }, { status: 400 });
    }

    // Get or create broadcaster
    let broadcaster = getBroadcaster();
    if (!broadcaster) {
      if (!icecastUrl || !icecastPassword) {
        return NextResponse.json({ 
          error: 'Icecast credentials required for first start' 
        }, { status: 400 });
      }
      broadcaster = initializeBroadcaster(icecastUrl, icecastPassword, mountPoint);
    }

    // Start broadcaster
    await broadcaster.start();

    // Start poller
    if (poller) {
      poller.stop();
    }
    
    poller = new EventPoller(
      matchId,
      broadcaster,
      (event) => {
        // Event processed by broadcaster
        console.log(`Broadcast event: ${event.eventType}`);
      },
      5000 // Poll every 5 seconds
    );
    poller.start();

    return NextResponse.json({
      success: true,
      message: 'Live commentary started',
      matchId,
      streamUrl: `http://${icecastUrl}/${mountPoint || 'live'}`,
    });
  } catch (error) {
    console.error('Start commentary error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start commentary' 
    }, { status: 500 });
  }
}