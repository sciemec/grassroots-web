// src/app/arena/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home, Users, Heart, MessageCircle, Share2, Image,
  Video, MapPin, Globe, LogIn, Plus, Send,
  Play, Eye, UserPlus, Filter,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API       = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const BG        = "#f4f2ee";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  milestone_label?: string;
  image_url?: string;
  video_url?: string;
  aq_at_post?: number;
  rank_at_post?: string;
  test_tier?: string;
  video_source?: string;
  duration_sec?: number;
  like_count: number;
  comment_count: number;
  view_count?: number;
  sport?: string;
  province?: string;
  created_at: string;
  liked?: number;
  my_reaction?: string | null;
  from_whatsapp?: boolean;
  user?: { id: string; name: string; role: string; sport?: string; province?: string };
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user?: { id: string; name: string; role: string };
}

// From Document 14 — video discovery feed
interface ArenaVideo {
  id:            string;
  player_id:     string;
  player_name:   string;
  player_rank:   string;
  position:      string;
  province:      string;
  aq_score:      number | null;
  video_url:     string;
  label:         string;
  source:        string;
  view_count:    number;
  like_count:    number;
  comment_count: number;
  created_at:    string;
  passport_token: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants for video filter dropdowns (from Document 14)
// ─────────────────────────────────────────────────────────────────────────────
const POSITIONS = ["All", "Striker", "Winger", "Midfielder", "Defender", "Goalkeeper"];
const PROVINCES = [
  "All provinces", "Harare", "Bulawayo", "Manicaland", "Masvingo",
  "Midlands", "Mashonaland East", "Mashonaland West", "Mashonaland Central",
  "Matabeleland North", "Matabeleland South",
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const { user, token } = useAuthStore();

  // ── Social feed state (from Document 15) ──────────────────────────────────
  const [posts,             setPosts]             = useState<Post[]>([]);
  const [loadingPosts,      setLoadingPosts]       = useState(true);
  const [newPostBody,       setNewPostBody]        = useState("");
  const [submitting,        setSubmitting]         = useState(false);
  const [expandedComments,  setExpandedComments]   = useState<Record<string, Comment[]>>({});
  const [loadingComments,   setLoadingComments]    = useState<Record<string, boolean>>({});
  const [newComment,        setNewComment]         = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment]  = useState<Record<string, boolean>>({});
  const [showLoginPrompt,   setShowLoginPrompt]    = useState(false);

  // ── Tab state — four tabs: For You / Following / Connections / Videos ──────
  const [activeTab, setActiveTab] = useState<"for-you" | "following" | "connections" | "videos">("for-you");

  // ── Video feed state (from Document 14) ───────────────────────────────────
  const [videos,       setVideos]       = useState<ArenaVideo[]>([]);
  const [loadingVideos,setLoadingVideos]= useState(false);
  const [position,     setPosition]     = useState("All");
  const [province,     setProvince]     = useState("All provinces");
  const [activeVideo,  setActiveVideo]  = useState<string | null>(null);
  const [following,    setFollowing]    = useState<Set<string>>(new Set());
  const [pipedPlayers, setPipedPlayers] = useState<Set<string>>(new Set());
  const [showFilters,  setShowFilters]  = useState(false);

  const authToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);

  // ── Fetch social feed (Document 15) ───────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (activeTab === "videos") return;
    setLoadingPosts(true);
    try {
      const urlMap: Record<string, string> = {
        "for-you":     `${API}/api/v1/arena/feed`,
        "following":   `${API}/api/v1/arena/feed/following`,
        "connections": `${API}/api/v1/arena/feed/connections`,
      };
      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(urlMap[activeTab], { headers });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPosts(safeArray<Post>(json.data ?? json));
    } catch {}
    setLoadingPosts(false);
  }, [activeTab, authToken]);

  // ── Fetch video feed (Document 14) ────────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    if (activeTab !== "videos") return;
    setLoadingVideos(true);
    try {
      const params = new URLSearchParams();
      if (position !== "All") params.set("position", position.toLowerCase());
      if (province !== "All provinces") params.set("province", province);
      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`${API}/api/v1/arena/videos?${params}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setVideos(safeArray<ArenaVideo>(Array.isArray(d) ? d : (d.data ?? [])));
      }
    } catch {}
    setLoadingVideos(false);
  }, [activeTab, position, province, authToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // ── Social actions (Document 15) ─────────────────────────────────────────

  const loadComments = async (postId: string) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => { const s = { ...prev }; delete s[postId]; return s; });
      return;
    }
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`${API}/api/v1/arena/posts/${postId}/comments`, { headers });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setExpandedComments(prev => ({ ...prev, [postId]: safeArray<Comment>(json.data ?? json) }));
    } catch {}
    setLoadingComments(prev => ({ ...prev, [postId]: false }));
  };

  const addComment = async (postId: string) => {
    const body = newComment[postId]?.trim();
    if (!body) return;
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      await fetch(`${API}/api/v1/arena/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ body }),
      });
      await loadComments(postId);
      setNewComment(prev => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch {}
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  };

  const handleLike = async (postId: string) => {
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, liked: p.liked === 1 ? 0 : 1, like_count: p.liked === 1 ? p.like_count - 1 : p.like_count + 1 }));
    try {
      await fetch(`${API}/api/v1/arena/posts/${postId}/like`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch { fetchPosts(); }
  };

  const handleCreatePost = async () => {
    if (!newPostBody.trim()) return;
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/arena/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ body: newPostBody, post_type: "standard" }),
      });
      if (!res.ok) throw new Error();
      setNewPostBody("");
      fetchPosts();
    } catch { alert("Could not create post"); }
    setSubmitting(false);
  };

  const handleShare = async (postId: string) => {
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    navigator.clipboard.writeText(`${window.location.origin}/arena/post/${postId}`);
    alert("Link copied to clipboard!");
  };

  // ── Video actions (Document 14) ───────────────────────────────────────────

  const handleFollow = async (playerId: string) => {
    if (!authToken) { window.location.href = "/login"; return; }
    try {
      await fetch(`${API}/api/v1/arena/follow/${playerId}`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` },
      });
      setFollowing(prev => new Set([...prev, playerId]));
    } catch {}
  };

  const handlePipeline = (playerId: string, playerName: string) => {
    if (!authToken) { window.location.href = "/login"; return; }
    sessionStorage.setItem("pipeline_add", JSON.stringify({ id: playerId, name: playerName }));
    window.location.href = "/scout/pipeline";
  };

  const recordView = async (videoId: string) => {
    if (!authToken) return;
    try {
      await fetch(`${API}/api/v1/arena/posts/${videoId}/view`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {}
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Globe size={28} className="text-[#f0b429]" />
            <div>
              <h1 className="text-2xl font-black">The Arena</h1>
              <p className="text-white/70 text-sm">
                Where talent gets discovered.{" "}
                {!user && "Sign in to post, like, and comment."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login prompt banner */}
      {!user && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-amber-800">
              <LogIn size={16} />
              <span className="text-sm">Sign in to like, comment, and share your own content!</span>
            </div>
            <Link href="/login" className="px-4 py-1.5 bg-[#1a5c2a] text-white rounded-lg text-sm font-bold hover:bg-[#2a6e3a] transition">
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* Login toast */}
      {showLoginPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Please sign in to interact with posts
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Tab navigation — four tabs ─────────────────────────────────── */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
          {([
            { key: "for-you",     label: "For You" },
            { key: "following",   label: "Following" },
            { key: "connections", label: "Connections" },
            { key: "videos",      label: "🎥 Videos" },   // ← from Document 14
          ] as const).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-[#1a5c2a] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── VIDEO TAB (from Document 14) ───────────────────────────────── */}
        {activeTab === "videos" && (
          <div>
            {/* Filter bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-wide">Training videos</h2>
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                <Filter size={14} /> Filter
              </button>
            </div>

            {showFilters && (
              <div className="flex gap-3 mb-4 flex-wrap">
                <select value={position} onChange={e => setPosition(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]">
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={province} onChange={e => setProvince(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]">
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}

            {loadingVideos ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Video size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">
                  {position !== "All" || province !== "All provinces"
                    ? "No videos match your filters."
                    : "No training videos posted yet."
                  }
                </p>
                <Link href="/player/drills"
                  className="inline-block px-5 py-2 rounded-lg text-sm font-bold text-white"
                  style={{ background: GRS_GREEN }}>
                  Upload a drill video →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map(video => (
                  <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                    {/* Player row */}
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] flex items-center justify-center text-white font-bold text-sm">
                        {video.player_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">{video.player_name}</div>
                        <div className="text-xs text-gray-400">
                          {video.position} · {video.province}
                          {video.aq_score != null && ` · AQ ${video.aq_score}`}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        {video.player_rank}
                      </span>
                    </div>

                    {/* Inline video */}
                    <div
                      className="relative bg-black"
                      style={{ aspectRatio: "16/9", cursor: "pointer" }}
                      onClick={() => { setActiveVideo(video.id); recordView(video.id); }}>
                      {activeVideo === video.id ? (
                        <video src={video.video_url} controls autoPlay
                          className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Play size={24} className="text-white ml-1" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Label + stats */}
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-sm font-semibold text-gray-800">{video.label}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={11}/>{video.view_count}</span>
                        <span className="flex items-center gap-1"><Heart size={11}/>{video.like_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11}/>{video.comment_count}</span>
                        <span className="ml-auto">{timeAgo(video.created_at)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 pb-4 pt-2 flex items-center gap-2 flex-wrap">
                      {/* Talent passport link */}
                      {video.passport_token && (
                        <Link href={`/passport/${video.passport_token}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition">
                          View Passport
                        </Link>
                      )}
                      {/* Follow */}
                      <button onClick={() => handleFollow(video.player_id)}
                        disabled={following.has(video.player_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          following.has(video.player_id)
                            ? "bg-gray-100 text-gray-400 cursor-default"
                            : "bg-[#1a5c2a] text-white hover:bg-[#2a6e3a]"
                        }`}>
                        <UserPlus size={12} />
                        {following.has(video.player_id) ? "Following" : "Follow"}
                      </button>
                      {/* Pipeline — scouts only */}
                      <button onClick={() => handlePipeline(video.player_id, video.player_name)}
                        disabled={pipedPlayers.has(video.player_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{
                          borderColor: GRS_GOLD,
                          color: pipedPlayers.has(video.player_id) ? "#aaa" : GRS_GOLD,
                          background: pipedPlayers.has(video.player_id) ? "#faeeda" : "transparent",
                        }}>
                        <Users size={12} />
                        {pipedPlayers.has(video.player_id) ? "In pipeline" : "+ Pipeline"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SOCIAL FEED TABS (from Document 15) ───────────────────────── */}
        {activeTab !== "videos" && (
          <>
            {/* Create post — logged-in users only */}
            {user && (
              <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-200">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a5c2a] flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostBody}
                      onChange={e => setNewPostBody(e.target.value)}
                      placeholder="Share your progress, highlight, or achievement..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] resize-none"
                      rows={2}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-[#1a5c2a] transition"><Image size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-[#1a5c2a] transition"><Video size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-[#1a5c2a] transition"><MapPin size={18} /></button>
                      </div>
                      <button onClick={handleCreatePost} disabled={submitting || !newPostBody.trim()}
                        className="px-4 py-2 bg-[#1a5c2a] text-white rounded-lg text-sm font-bold hover:bg-[#2a6e3a] transition disabled:opacity-50">
                        {submitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts feed */}
            {loadingPosts ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Globe size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  {activeTab === "following"
                    ? "No posts from people you follow yet."
                    : activeTab === "connections"
                    ? "No posts from your connections yet."
                    : "No posts yet. Be the first to share!"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                    {/* Post header */}
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] flex items-center justify-center text-white font-bold">
                        {post.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{post.user?.name || "Unknown"}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {post.user?.role || "Player"}
                          </span>
                          {post.sport && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{post.sport}</span>
                          )}
                          {post.province && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">📍 {post.province}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                          {post.from_whatsapp && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.558 4.14 1.535 5.878L.057 23.25a.75.75 0 00.918.919l5.453-1.476A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.8-.53-5.383-1.453l-.386-.228-3.99 1.08 1.086-3.888-.245-.399A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                              WhatsApp
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{post.body}</p>
                        {post.aq_at_post && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                            🏆 AQ: {post.aq_at_post}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Media */}
                    {post.video_url && (
                      <div className="relative aspect-video bg-black">
                        <video src={post.video_url} className="w-full h-full object-cover" controls />
                      </div>
                    )}
                    {post.image_url && !post.video_url && (
                      <img src={post.image_url} alt="Post" className="w-full" />
                    )}

                    {/* Stats */}
                    <div className="px-4 pt-2 text-xs text-gray-400 flex gap-3">
                      <span>{post.like_count} likes</span>
                      <span>{post.comment_count} comments</span>
                      {post.view_count !== undefined && <span>{post.view_count} views</span>}
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-6">
                      <button onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 text-sm transition ${post.liked === 1 ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
                        <Heart size={16} fill={post.liked === 1 ? "currentColor" : "none"} />
                        Like
                      </button>
                      <button onClick={() => loadComments(post.id)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a5c2a] transition">
                        <MessageCircle size={16} /> Comment
                      </button>
                      <button onClick={() => handleShare(post.id)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition">
                        <Share2 size={16} /> Share
                      </button>
                    </div>

                    {/* Comments */}
                    {expandedComments[post.id] && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        {loadingComments[post.id] ? (
                          <div className="text-center py-2">
                            <div className="inline-block w-4 h-4 border-2 border-[#1a5c2a] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : expandedComments[post.id].length === 0 ? (
                          <p className="text-xs text-gray-400 text-center">No comments yet</p>
                        ) : (
                          expandedComments[post.id].map(comment => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold">
                                {comment.user?.name?.charAt(0) || "?"}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold">{comment.user?.name || "Unknown"}</span>
                                  <span className="text-[9px] text-gray-400">{timeAgo(comment.created_at)}</span>
                                </div>
                                <p className="text-xs text-gray-700 mt-0.5">{comment.body}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {user && (
                          <div className="flex gap-2 mt-2">
                            <input type="text" value={newComment[post.id] || ""}
                              onChange={e => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
                            />
                            <button onClick={() => addComment(post.id)}
                              disabled={submittingComment[post.id] || !newComment[post.id]?.trim()}
                              className="px-3 py-2 bg-[#1a5c2a] text-white rounded-lg text-xs font-bold disabled:opacity-50">
                              {submittingComment[post.id] ? "..." : "Post"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}