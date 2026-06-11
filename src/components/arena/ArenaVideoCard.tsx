'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

const SOURCE_LABELS: Record<string, string> = {
  test_session:   'Verified test',
  drill_training: 'Drill session',
  player_upload:  'Training clip',
  whatsapp:       'WhatsApp upload',
};

const RANK_COLORS: Record<string, string> = {
  Student:  '#888', Player:   '#185fa5', Skilled:  '#3b6d11',
  Attacker: '#854f0b', Star: '#534ab7', Lion: '#c8962a',
};

interface ArenaVideoCardProps {
  post: {
    id:            string;
    player_id:     string;
    player_name:   string;
    position?:     string;
    province?:     string;
    body:          string;
    video_url:     string;
    duration_sec?: number;
    aq_at_post?:   number;
    rank_at_post?: string;
    test_tier?:    string;
    video_source?: string;
    like_count:    number;
    comment_count: number;
    view_count:    number;
    created_at:    string;
    sport?:        string;
  };
  currentUserRole?: 'player' | 'scout' | 'coach' | 'fan';
  onFollow?:        (playerId: string) => void;
  onAddToPipeline?: (playerId: string) => void;
}

export default function ArenaVideoCard({ post, currentUserRole, onFollow, onAddToPipeline }: ArenaVideoCardProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [liked,   setLiked]   = useState(false);
  const [likes,   setLikes]   = useState(post.like_count);
  const [views,   setViews]   = useState(post.view_count);
  const [viewed,  setViewed]  = useState(false);

  const initials    = post.player_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const rank        = post.rank_at_post;
  const rankColor   = rank ? (RANK_COLORS[rank] ?? GRS_GREEN) : GRS_GREEN;
  const sourceLabel = SOURCE_LABELS[post.video_source ?? ''] ?? 'Training clip';

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1)  return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const handlePlay = async () => {
    setPlaying(true);
    if (!viewed) {
      setViewed(true);
      setViews(v => v + 1);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts/${post.id}/view`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleLike = async () => {
    setLiked(l => !l);
    setLikes(l => liked ? l - 1 : l + 1);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts/${post.id}/like`, { method: 'POST' }).catch(() => {});
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* Player identity */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Link href={`/arena/profile/${post.player_id}`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: rankColor }}
          >
            {initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/arena/profile/${post.player_id}`}
              className="font-bold text-gray-900 text-sm hover:underline"
            >
              {post.player_name}
            </Link>
            {rank && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ background: rankColor }}
              >
                {rank}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {[post.position, post.province].filter(Boolean).join(' · ')}
            {' · '}{timeAgo(post.created_at)}
          </div>
        </div>

        {/* Scout / coach actions */}
        {currentUserRole === 'scout' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => onFollow?.(post.player_id)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-green-300 transition-colors"
            >
              Follow
            </button>
            <button
              onClick={() => onAddToPipeline?.(post.player_id)}
              className="text-xs px-2.5 py-1.5 rounded-lg text-white transition-colors"
              style={{ background: GRS_GREEN }}
            >
              + Pipeline
            </button>
          </div>
        )}
      </div>

      {/* Caption */}
      {post.body && (
        <div className="px-4 pb-2 text-sm text-gray-700 leading-relaxed">
          {post.body}
        </div>
      )}

      {/* Video */}
      <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          src={post.video_url}
          controls
          playsInline
          preload="metadata"
          onPlay={handlePlay}
          className="w-full h-full object-cover"
        />
        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {sourceLabel}
          </span>
        </div>
        {/* Duration */}
        {post.duration_sec && !playing && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-black/50 text-white">
              {Math.floor(post.duration_sec / 60)}:{String(post.duration_sec % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* AQ at time of recording */}
      {(post.aq_at_post || post.test_tier) && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-50 bg-gray-50/50">
          {post.aq_at_post && (
            <span className="text-xs font-bold" style={{ color: GRS_GREEN }}>
              AQ {post.aq_at_post}
            </span>
          )}
          {post.test_tier && (
            <span className="text-xs text-gray-400">
              {post.test_tier} tier
            </span>
          )}
          {post.sport && (
            <span className="text-xs text-gray-400 ml-auto">{post.sport}</span>
          )}
        </div>
      )}

      {/* Engagement row */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likes}</span>
        </button>
        <Link
          href={`/arena/posts/${post.id}`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          <span>💬</span>
          <span>{post.comment_count}</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span>👁</span>
          <span>{views}</span>
        </div>
        <button
          onClick={() => navigator.share?.({
            title: post.player_name + ' training clip',
            url: window.location.origin + '/arena/profile/' + post.player_id,
          })}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600"
        >
          Share
        </button>
      </div>
    </div>
  );
}
