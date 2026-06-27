// src/app/api/world-cup/highlights/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('YOUTUBE_API_KEY not set');
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  try {
    const qs = new URLSearchParams({
      part: 'snippet',
      maxResults: '5',
      q: query,
      type: 'video',
      key: apiKey,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${qs.toString()}`
    );

    if (!response.ok) {
      let message = 'YouTube API error';
      try {
        const errData = await response.json();
        message = errData.error?.message || message;
      } catch { /* non-JSON error body — ignore */ }
      throw new Error(message);
    }

    const data = await response.json();

    const videos = (data.items ?? [])
      .filter((item: Record<string, unknown>) => {
        const id = item.id as Record<string, unknown> | undefined;
        return typeof id?.videoId === 'string';
      })
      .map((item: Record<string, unknown>) => {
        const id = item.id as Record<string, string>;
        const snippet = item.snippet as Record<string, unknown>;
        const thumbnails = snippet.thumbnails as Record<string, Record<string, string>> | undefined;
        return {
          id: id.videoId,
          title: snippet.title as string,
          thumbnail: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? '',
          channelTitle: snippet.channelTitle as string,
          publishedAt: snippet.publishedAt as string,
          url: `https://www.youtube.com/watch?v=${id.videoId}`,
        };
      });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
  }
}