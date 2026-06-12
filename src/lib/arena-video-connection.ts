// src/lib/arena-video-connection.ts
// ─────────────────────────────────────────────────────────────────────────────
// Connects the player vault and test sessions to the Arena video feed.
// Call shareVideoToArena() after a vault upload or test session completion.
// ─────────────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

export interface ArenaVideoSharePayload {
  video_url:    string;
  body?:        string;
  aq_at_post?:  number;
  rank_at_post?: string;
  test_tier?:   string;
  duration_sec?: number;
  video_source?: 'player_upload' | 'test_session' | 'drill_training' | 'whatsapp';
  visibility?:  'public' | 'school';
}

export interface ArenaVideoPost {
  id:            string;
  user_id:       string;
  body:          string;
  video_url:     string;
  thumbnail_url?: string;
  duration_sec?: number;
  aq_at_post?:   number;
  rank_at_post?: string;
  test_tier?:    string;
  video_source?: string;
  like_count:    number;
  comment_count: number;
  view_count:    number;
  created_at:    string;
}

/**
 * Share a video to the Arena feed.
 * Used by: player vault "Share to Arena" button, test session completion.
 * Calls POST /api/v1/arena/posts/share-video.
 * Returns the created post, or null on failure (never throws).
 */
export async function shareVideoToArena(
  token: string,
  payload: ArenaVideoSharePayload,
): Promise<ArenaVideoPost | null> {
  try {
    const res = await fetch(`${API}/arena/posts/share-video`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        video_url:    payload.video_url,
        body:         payload.body ?? '',
        aq_at_post:   payload.aq_at_post,
        rank_at_post: payload.rank_at_post,
        test_tier:    payload.test_tier,
        duration_sec: payload.duration_sec,
        video_source: payload.video_source ?? 'player_upload',
        visibility:   payload.visibility   ?? 'public',
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return (json.post as ArenaVideoPost) ?? null;
  } catch {
    return null;
  }
}

/**
 * Record a video view on an Arena post.
 * Call this when a video starts playing.
 * Fire-and-forget — never throws.
 */
export function recordArenaView(token: string, postId: string): void {
  fetch(`${API}/arena/posts/${postId}/view`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  }).catch(() => {});
}

/**
 * Fetch the video discovery feed.
 * Used by the Videos tab on the Arena feed page.
 */
export async function fetchArenaVideos(
  token: string,
  filters: { province?: string; position?: string; sport?: string; page?: number } = {},
): Promise<{ data: ArenaVideoPost[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.province) params.set('province', filters.province);
  if (filters.position) params.set('position', filters.position);
  if (filters.sport)    params.set('sport',    filters.sport);
  if (filters.page)     params.set('page',     String(filters.page));

  try {
    const res = await fetch(`${API}/arena/videos?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return { data: [], total: 0 };
    const json = await res.json();
    return {
      data:  Array.isArray(json.data) ? json.data : [],
      total: json.total ?? 0,
    };
  } catch {
    return { data: [], total: 0 };
  }
}
