"use client";
// src/app/v/[token]/page.tsx
// Public (no auth) Arena post viewer — accessible via share link

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Eye, Play, Award, Trophy, Shield } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_LABELS: Record<string, string> = {
  player: "Player",
  coach:  "Coach",
  scout:  "Scout",
  fan:    "Fan",
  admin:  "Admin",
};

const POST_TYPE_ICONS: Record<string, React.ElementType> = {
  milestone:   Trophy,
  achievement: Award,
  standard:    Shield,
};

interface SharedPost {
  id: string;
  body: string;
  post_type: string;
  milestone_label?: string;
  image_url?: string;
  video_url?: string;
  like_count: number;
  comment_count: number;
  view_count?: number;
  created_at: string;
  share_token: string;
  user?: {
    id: string;
    name: string;
    role: string;
    sport?: string;
    province?: string;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: "#1a5c2a" }}
    >
      {initials}
    </div>
  );
}

export default function PublicPostPage({ params }: { params: { token: string } }) {
  const [post, setPost] = useState<SharedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/arena/public/${params.token}`)
      .then(r => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(json => setPost(json.data ?? json))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="text-5xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Link not found</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">This post may have been removed or the link is invalid.</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: "#1a5c2a" }}>
          Go to GrassRoots Sports
        </Link>
      </div>
    );
  }

  const author = post.user;
  const TypeIcon = POST_TYPE_ICONS[post.post_type] ?? Shield;
  const isVideo = !!post.video_url;
  const isMilestone = post.post_type === "milestone" || post.post_type === "achievement";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Minimal branded header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1a5c2a" }}>
              <span className="text-white font-black text-xs">GR</span>
            </div>
            <span className="font-black text-sm text-gray-900">GrassRoots Sports</span>
          </Link>
          <Link
            href="/register"
            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Join Free
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Post card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Milestone / achievement banner */}
          {isMilestone && (
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-green-100" style={{ backgroundColor: "#f0fdf4" }}>
              <TypeIcon size={14} className="text-green-600 shrink-0" />
              <span className="text-xs font-semibold text-green-700">
                {post.post_type === "achievement" ? "Achievement Unlocked" : post.milestone_label ?? "Milestone"}
              </span>
            </div>
          )}

          {/* Author row */}
          <div className="p-4 flex items-center gap-3">
            {author ? <Avatar name={author.name} /> : <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-gray-900 truncate">{author?.name ?? "GrassRoots Athlete"}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {author?.role && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
                    {ROLE_LABELS[author.role] ?? author.role}
                  </span>
                )}
                {author?.sport && <span className="text-[11px] text-gray-500">{author.sport}</span>}
                {author?.province && <span className="text-[11px] text-gray-400">· {author.province}</span>}
              </div>
            </div>
            <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(post.created_at)}</span>
          </div>

          {/* Post body */}
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.body}</p>
          </div>

          {/* Image */}
          {post.image_url && !isVideo && (
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt="Post media" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Video */}
          {isVideo && (
            <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
              <video
                src={post.video_url}
                controls
                playsInline
                className="w-full h-full object-contain"
                poster={undefined}
              >
                Your browser does not support video.
              </video>
            </div>
          )}

          {/* Stats row */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-5 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Heart size={13} /> {post.like_count}</span>
            <span className="flex items-center gap-1"><MessageCircle size={13} /> {post.comment_count}</span>
            {post.view_count !== undefined && (
              <span className="flex items-center gap-1"><Eye size={13} /> {post.view_count}</span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Play size={16} style={{ color: "#f0b429" }} />
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#f0b429" }}>Join GrassRoots Sports</span>
          </div>
          <p className="text-white font-bold text-base mb-1">Zimbabwe&apos;s AI Sports Platform</p>
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
            Track stats, get scouted, and connect with coaches across all sports.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl font-black text-sm"
              style={{ backgroundColor: "#f0b429", color: "#1a3a1a" }}
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl font-bold text-sm border"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)" }}
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-400 mt-4">
          Shared via <Link href="/" className="underline">grassrootssports.live</Link> · Zimbabwe&apos;s first AI sports platform
        </p>

      </div>
    </div>
  );
}
