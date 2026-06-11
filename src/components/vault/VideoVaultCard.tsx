'use client';
// src/components/vault/VideoVaultCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shown in /player/profile and /player/vault
// Every video the player has — test session, drill, WhatsApp upload, manual
// Shows: video, label, source badge, visibility control, Share to Arena button
//
// VISIBILITY SYSTEM (explained to the player in plain language):
//
//   Private  → Only you can see this. Not visible to anyone else.
//   School   → Your coach and school admin can see this. Good for coach feedback.
//   Public   → Anyone on GRS can see this, including scouts. Goes into the Arena feed.
//
// Default rules (set at upload time):
//   Test session videos → School (coach verifies, then player decides to go public)
//   Drill videos       → Private (player practice, share when ready)
//   Player uploads     → Private
//   WhatsApp uploads   → Private
//
// The player controls every video individually. One tap to change visibility.
// No video goes public without the player explicitly choosing it.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

const GRS_GREEN = '#1c3d22';

type VideoSource     = 'test_session' | 'drill_training' | 'player_upload' | 'whatsapp';
type VideoVisibility = 'private' | 'school' | 'public';

interface VaultVideo {
  id:          string;
  url:         string;
  label:       string;
  source:      VideoSource;
  visibility:  VideoVisibility;
  verified:    boolean;
  durationSec?: number;
  uploadedAt:  string;
  aqAtUpload?: number;
  rankAtUpload?: string;
  arenaPostId?: string;   // if already shared to Arena
}

interface VideoVaultCardProps {
  video:         VaultVideo;
  onVisibilityChange: (videoId: string, visibility: VideoVisibility) => void;
  onShareToArena: (video: VaultVideo, caption: string) => Promise<void>;
  onDelete:       (videoId: string) => void;
}

const SOURCE_CONFIG: Record<VideoSource, { label: string; color: string; bg: string }> = {
  test_session:   { label: 'Verified test',   color: GRS_GREEN,  bg: '#eaf3de' },
  drill_training: { label: 'Drill session',   color: '#185fa5',  bg: '#e6f1fb' },
  player_upload:  { label: 'Training clip',   color: '#666',     bg: '#f1efe8' },
  whatsapp:       { label: 'WhatsApp upload', color: '#166534',  bg: '#e7fde8' },
};

const VISIBILITY_CONFIG: Record<VideoVisibility, {
  label: string; icon: string; desc: string; color: string; bg: string;
}> = {
  private: {
    label: 'Private',
    icon:  '🔒',
    desc:  'Only you can see this',
    color: '#666',
    bg:    '#f1efe8',
  },
  school: {
    label: 'School',
    icon:  '🏫',
    desc:  'Your coach + school admin can see this',
    color: '#185fa5',
    bg:    '#e6f1fb',
  },
  public: {
    label: 'Public',
    icon:  '🌍',
    desc:  'Scouts and all GRS users can see this',
    color: GRS_GREEN,
    bg:    '#eaf3de',
  },
};

export default function VideoVaultCard({
  video, onVisibilityChange, onShareToArena, onDelete,
}: VideoVaultCardProps) {
  const [showVisibility, setShowVisibility] = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const [caption,        setCaption]        = useState('');
  const [sharing,        setSharing]        = useState(false);
  const [sharedToArena,  setSharedToArena]  = useState(!!video.arenaPostId);
  const [changing,       setChanging]       = useState(false);

  const srcCfg = SOURCE_CONFIG[video.source];
  const visCfg = VISIBILITY_CONFIG[video.visibility];

  const timeAgo = (iso: string) => {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d === 0) return 'Today'; if (d === 1) return 'Yesterday';
    if (d < 7)  return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
    return new Date(iso).toLocaleDateString();
  };

  const handleVisibility = async (v: VideoVisibility) => {
    setChanging(true);
    await onVisibilityChange(video.id, v);
    setChanging(false);
    setShowVisibility(false);
  };

  const handleShareToArena = async () => {
    if (sharedToArena) return;
    setSharing(true);
    try {
      await onShareToArena(video, caption);
      setSharedToArena(true);
      setShowShare(false);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Video player */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        <video
          src={video.url}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            {srcCfg.label}
          </span>
        </div>
        {/* Verified badge */}
        {video.verified && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: GRS_GREEN, color: '#fff' }}>
              ✓ Coach verified
            </span>
          </div>
        )}
      </div>

      {/* Label + meta */}
      <div className="px-4 pt-3 pb-2">
        <div className="font-medium text-sm text-gray-900">{video.label}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-400">{timeAgo(video.uploadedAt)}</span>
          {video.durationSec && (
            <span className="text-xs text-gray-400">
              · {Math.floor(video.durationSec / 60)}:{String(video.durationSec % 60).padStart(2,'0')}
            </span>
          )}
          {video.aqAtUpload && (
            <span className="text-xs font-bold" style={{ color: GRS_GREEN }}>
              · AQ {video.aqAtUpload}
            </span>
          )}
        </div>
      </div>

      {/* Visibility control */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowVisibility(v => !v)}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{ background: visCfg.bg, color: visCfg.color }}
        >
          <span>{visCfg.icon}</span>
          <span>{visCfg.label}</span>
          <span className="opacity-60">▾</span>
        </button>

        {showVisibility && (
          <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden">
            {/* Explanation header */}
            <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
              Who can see this video?
            </div>
            {(Object.entries(VISIBILITY_CONFIG) as [VideoVisibility, typeof VISIBILITY_CONFIG[VideoVisibility]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleVisibility(key)}
                disabled={changing}
                className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors hover:bg-gray-50 ${video.visibility === key ? 'bg-gray-50' : ''}`}
              >
                <span className="text-base flex-shrink-0 mt-0.5">{cfg.icon}</span>
                <div>
                  <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                    {cfg.label}
                    {video.visibility === key && <span style={{ color: GRS_GREEN }}>✓</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{cfg.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Share to Arena section */}
      <div className="px-4 pb-4 border-t border-gray-50 pt-3">
        {sharedToArena ? (
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: GRS_GREEN }}>
            <span>✓</span>
            <span>Shared to Arena — your peers and scouts can see this</span>
          </div>
        ) : (
          <>
            {!showShare ? (
              <button
                onClick={() => {
                  // Auto-set public when sharing to Arena
                  if (video.visibility === 'private') {
                    handleVisibility('public');
                  }
                  setShowShare(true);
                }}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 w-full justify-center"
                style={{ background: GRS_GREEN }}
              >
                <span>🏟</span>
                <span>Share to Arena</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 bg-green-50 rounded-lg p-2.5 border border-green-100">
                  This video will appear in the Arena feed. Your peers, coaches, and scouts in Zimbabwe will be able to see and follow your progress.
                </div>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption... (optional)"
                  maxLength={280}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-300 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleShareToArena}
                    disabled={sharing}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                    style={{ background: GRS_GREEN }}
                  >
                    {sharing ? 'Sharing...' : 'Post to Arena'}
                  </button>
                  <button
                    onClick={() => setShowShare(false)}
                    className="px-4 py-2.5 rounded-xl text-xs border border-gray-200 text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// VideoVaultPage — the full vault page using VideoVaultCard
// Drop at: src/app/player/vault/page.tsx  OR  integrate into /player/profile
// ─────────────────────────────────────────────────────────────────────────────

export function VideoVaultPage() {
  const [videos,  setVideos]  = useState<VaultVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<VideoSource | 'all'>('all');

  // Fetch vault on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/vault`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setVideos(data.videos ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? videos : videos.filter(v => v.source === filter);

  const handleVisibilityChange = async (videoId: string, visibility: VideoVisibility) => {
    const token = localStorage.getItem('auth_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/vault/${videoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ visibility }),
    });
    setVideos(vs => vs.map(v => v.id === videoId ? { ...v, visibility } : v));
  };

  const handleShareToArena = async (video: VaultVideo, caption: string) => {
    const token = localStorage.getItem('auth_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts/share-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        video_url:    video.url,
        body:         caption,
        aq_at_post:   video.aqAtUpload,
        rank_at_post: video.rankAtUpload,
        video_source: video.source,
        visibility:   'public',
      }),
    });
    setVideos(vs => vs.map(v => v.id === video.id ? { ...v, arenaPostId: 'shared', visibility: 'public' } : v));
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this video?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/vault/${videoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setVideos(vs => vs.filter(v => v.id !== videoId));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Video vault</h1>
        <p className="text-sm text-gray-500 mt-1">
          {videos.length} video{videos.length !== 1 ? 's' : ''}. Share to Arena so scouts and peers can see your training.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(['all', 'test_session', 'drill_training', 'player_upload', 'whatsapp'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all"
            style={filter === f ? { background: GRS_GREEN, color: '#fff' } : { background: '#f1f1f1', color: '#666' }}>
            {f === 'all' ? `All (${videos.length})` : SOURCE_CONFIG[f as VideoSource].label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🎥</div>
          <div className="text-sm">No videos yet.</div>
          <div className="text-xs mt-1">Complete a test session or upload a training clip.</div>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map(video => (
          <VideoVaultCard
            key={video.id}
            video={video}
            onVisibilityChange={handleVisibilityChange}
            onShareToArena={handleShareToArena}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}