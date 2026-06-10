// app/api/world-cup/sync/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { syncAllWorldCupMatches } from '@/lib/world-cup/stats-aggregator';

// Admin-only endpoint to sync match data
export async function POST(req: NextRequest) {
  try {
    // 🔒 SECURITY CHECK: Validate incoming Cron/Admin Secret Key
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET_KEY || authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Optional: Keep your fallback user session auth commented or add it below
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