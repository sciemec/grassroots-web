// app/api/world-cup/matches/route.ts
// Feeds the /worldcup page with real World Cup 2026 data from iSports.
//
// ?status=live      → in-progress matches (score + minute)
// ?status=completed → finished matches
// No status param   → all of the above merged
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  getLiveMatches,
  getCompletedMatches,
  getMatchesByDate,
  ISPORTS_WORLD_CUP_LEAGUE_ID,
  type iSportsMatch,
} from '@/lib/isports/client';

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });
}

async function getReportManifest(): Promise<Record<string, boolean>> {
  const r2 = getR2();
  if (!r2) return {};
  try {
    const bucket = process.env.R2_BUCKET ?? 'grassroots-videos';
    const res = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: 'tactical-reports/index.json' }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
}

// iSports status codes:
// -1 = FT (finished)   0 = NS (not started)
// 1 = 1H  2 = HT  3 = 2H  4 = ET  5 = PEN
const LIVE_STATUSES = new Set([1, 2, 3, 4, 5]);

function isoFromUnix(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

function mapToPageMatch(m: iSportsMatch, manifest: Record<string, boolean> = {}) {
  const iso  = isoFromUnix(m.matchTime);
  const minute = m.extraExplain?.minute ?? 0;

  let statusCode = 'NS';
  if (m.status === -1) statusCode = 'FT';
  else if (m.status === 2) statusCode = 'HT';
  else if (m.status === 4) statusCode = 'ET';
  else if (m.status === 5) statusCode = 'PEN';
  else if (LIVE_STATUSES.has(m.status)) statusCode = 'LIVE';

  return {
    id:                        m.matchId,
    home_team:                 m.homeName,
    away_team:                 m.awayName,
    home_score:                m.homeScore,
    away_score:                m.awayScore,
    date:                      iso.split('T')[0],
    time:                      iso.split('T')[1]?.slice(0, 5) ?? '',
    stadium:                   m.location ?? 'TBD',
    city:                      '',
    minute,
    possession_home:           50,
    possession_away:           50,
    // Mark every finished match as ready — reports are generated on-demand by the reports route.
    // The R2 manifest approach required a cron that never ran; on-demand is the correct model.
    tactical_report_generated: m.status === -1 || manifest[m.matchId] === true,
    round:                     m.round ?? '',
    group:                     m.group ?? '',
    status:                    statusCode,
    home_rank:                 m.homeRank ?? '',
    away_rank:                 m.awayRank ?? '',
    weather:                   m.weather ?? '',
    temperature:               m.temperature ?? '',
  };
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status');
  const lid    = ISPORTS_WORLD_CUP_LEAGUE_ID;

  try {
    // Fetch manifest once — used to set tactical_report_generated on each match
    const manifest = await getReportManifest();

    if (status === 'live') {
      const matches = await getLiveMatches(lid);
      const live = matches.filter((m) => LIVE_STATUSES.has(m.status));
      return NextResponse.json({ matches: live.map((m) => mapToPageMatch(m, manifest)) });
    }

    if (status === 'completed') {
      // Strategy: run a simple no-date call in parallel with per-date calls.
      // The no-date /results endpoint returns recent completed matches and is
      // the most reliable. The per-date loop fills in older results but can
      // hit rate limits when 20+ calls fire at once — so we cap it to the
      // last 7 days and rely on the simple call for anything older.
      const WC_START  = new Date('2026-06-11');
      const today     = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const rangeStart = sevenDaysAgo > WC_START ? sevenDaysAgo : WC_START;

      const dates: string[] = [];
      for (let d = new Date(rangeStart); d <= today; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      const [simpleRes, ...dateResults] = await Promise.allSettled([
        getCompletedMatches(lid),                            // no-date — most reliable
        ...dates.map((date) => getCompletedMatches(lid, date)),
      ]);

      const seen      = new Set<string>();
      const completed: iSportsMatch[] = [];
      for (const r of [simpleRes, ...dateResults]) {
        if (r.status === 'fulfilled') {
          for (const m of r.value) {
            if (!seen.has(m.matchId)) {
              seen.add(m.matchId);
              completed.push(m);
            }
          }
        }
      }
      completed.sort((a, b) => b.matchTime - a.matchTime);
      return NextResponse.json({ matches: completed.map((m) => mapToPageMatch(m, manifest)) });
    }

    // No param — today's live + schedule, plus recent results
    const today   = new Date().toISOString().split('T')[0];
    const [liveRes, scheduledRes, resultsRes] = await Promise.allSettled([
      getLiveMatches(lid),
      getMatchesByDate(today, lid),
      getCompletedMatches(lid),
    ]);

    const seen = new Set<string>();
    const all: ReturnType<typeof mapToPageMatch>[] = [];
    for (const r of [liveRes, scheduledRes, resultsRes]) {
      if (r.status === 'fulfilled') {
        for (const m of r.value) {
          if (!seen.has(m.matchId)) {
            seen.add(m.matchId);
            all.push(mapToPageMatch(m, manifest));
          }
        }
      }
    }

    return NextResponse.json({ matches: all });

  } catch (error) {
    console.error('iSports World Cup error:', error);
    return NextResponse.json(
      { matches: [], error: error instanceof Error ? error.message : 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
