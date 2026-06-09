// app/api/world-cup/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { syncAllWorldCupMatches } from '@/lib/world-cup/stats-aggregator';

// Admin-only endpoint to sync match data
export async function POST(req: NextRequest) {
  try {
    // Verify admin role (implement your auth check)
    // const session = await getServerSession();
    // if (session?.user?.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { synced, failed } = await syncAllWorldCupMatches();
    
    return NextResponse.json({
      success: true,
      synced,
      failed,
      message: `Synced ${synced} matches, ${failed} failed`
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}