// src/app/arena/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, Heart, MessageCircle, Share2, Image,
  Video, MapPin, Globe, LogIn, Plus, Send,
  Play, Eye, UserPlus, Filter, Briefcase, MessageSquare,
  MoreVertical, Pencil, Trash2, X, Check, GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { matchPrograms, type MatchResult, type PlayerMatchData } from "@/lib/scholarship-matcher";
import ScholarshipAlertCard from "@/components/passport/ScholarshipAlertCard";
import { REEL_STORAGE_KEY, type ReelState } from "@/components/passport/ScholarshipReel";

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
// Arena Nav
// ─────────────────────────────────────────────────────────────────────────────
function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed" },
    { href: "/arena/network",     label: "Network" },
    { href: "/arena/clubs",       label: "Clubs" },
    { href: "/arena/recruitment", label: "Talent Board" },
    { href: "/arena/messages",    label: "Messages" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/player" className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border flex-shrink-0 transition-colors hover:bg-amber-50"
          style={{ color: GRS_GOLD, borderColor: GRS_GOLD }}>
          ← Hub
        </Link>
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>The Arena</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
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
  activity_type?: string;
  activity_data?: Record<string, string | number | boolean | null | undefined>;
  user?: { id: string; name: string; role: string; sport?: string; province?: string };
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user?: { id: string; name: string; role: string };
}

// Showcase discover feed — GET /showcase/discover
interface ArenaVideo {
  id:             string;
  user_id:        string;
  skill_type:     string;
  video_url:      string;
  thumbnail_url?: string;
  ai_rating?:     number;
  top_strength?:  string;
  scout_note?:    string;
  view_count:     number;
  like_count:     number;
  open_for_scouting: boolean;
  created_at:     string;
  user?: { id: string; name: string; role: string; sport?: string; province?: string; position?: string };
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
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

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
  const [mediaFile,         setMediaFile]          = useState<File | null>(null);
  const [mediaPreview,      setMediaPreview]       = useState<string | null>(null);
  const [mediaType,         setMediaType]          = useState<"image" | "video" | null>(null);
  const [uploadingMedia,    setUploadingMedia]     = useState(false);
  const [uploadProgress,    setUploadProgress]     = useState(0);
  const [mediaError,        setMediaError]         = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Edit / delete state ────────────────────────────────────────────────────
  const [postMenuOpen,   setPostMenuOpen]   = useState<string | null>(null);
  const [editingPostId,  setEditingPostId]  = useState<string | null>(null);
  const [editBody,       setEditBody]       = useState("");
  const [savingEdit,     setSavingEdit]     = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"for-you" | "following" | "connections" | "videos" | "pathways">("for-you");

  // ── Pathways tab state ────────────────────────────────────────────────────
  const [scholarshipMatches, setScholarshipMatches] = useState<MatchResult[]>([]);

  // ── Activity filter chips (under social tabs, non-video tabs only) ─────────
  const [activityFilter, setActivityFilter] = useState<string>("all");

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

  // ── Build scholarship matches when pathways tab is opened ────────────────
  useEffect(() => {
    if (activeTab !== "pathways" || !user) return;
    const reel = (() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(REEL_STORAGE_KEY) : null;
        return raw ? (JSON.parse(raw) as ReelState) : null;
      } catch { return null; }
    })();
    const reelFilled = reel
      ? Object.values(reel).filter(Boolean).length
      : 0;
    const u = user as unknown as Record<string, unknown>;
    const data: PlayerMatchData = {
      sport:               (u.sport       as string)  ?? "football",
      position:            (u.position    as string)  ?? "",
      thuto_score:         (u.thuto_score as number)  ?? 0,
      target_pathway:      (u.target_pathway as string) ?? "",
      school_year:         (u.school_year as string)  ?? "form5",
      ncaa_registered:     !!(u.ncaa_registered),
      english_proficiency: (u.english_proficiency as string) ?? "basic",
      reel_complete:       reelFilled >= 4,
    };
    setScholarshipMatches(matchPrograms(data));
  }, [activeTab, user]);

  // ── Fetch social feed ─────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    if (activeTab === "videos" || activeTab === "pathways") return;
    setLoadingPosts(true);
    try {
      const urlMap: Record<string, string> = {
        "for-you":     `${API}/arena/feed`,
        "following":   `${API}/arena/feed/following`,
        "connections": `${API}/arena/feed/connections`,
      };
      const base = urlMap[activeTab];
      const url = activityFilter !== "all" ? `${base}?type=${activityFilter}` : base;
      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPosts(safeArray<Post>(json.data ?? json));
    } catch {}
    setLoadingPosts(false);
  }, [activeTab, activityFilter, authToken]);

  // ── Fetch video feed — /showcase/discover (public endpoint) ──────────────
  const fetchVideos = useCallback(async () => {
    if (activeTab !== "videos") return;
    setLoadingVideos(true);
    try {
      const params = new URLSearchParams();
      if (position !== "All") params.set("position", position.toLowerCase());
      if (province !== "All provinces") params.set("province", province);
      const res = await fetch(`${API}/showcase/discover?${params}`);
      if (res.ok) {
        const d = await res.json();
        setVideos(safeArray<ArenaVideo>(d.data ?? d));
      }
    } catch {}
    setLoadingVideos(false);
  }, [activeTab, position, province]);

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
      const res = await fetch(`${API}/arena/posts/${postId}/comments`, { headers });
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
      await fetch(`${API}/arena/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ body }),
      });
      // Re-fetch comments directly (don't call loadComments — it toggles/collapses if already open)
      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const cr = await fetch(`${API}/arena/posts/${postId}/comments`, { headers });
      if (cr.ok) {
        const cj = await cr.json();
        setExpandedComments(prev => ({ ...prev, [postId]: safeArray<Comment>(cj.data ?? cj) }));
      }
      setNewComment(prev => ({ ...prev, [postId]: "" }));
      fetchPosts();
    } catch {}
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  };

  const handleLike = async (postId: string) => {
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, liked: p.liked === 1 ? 0 : 1, like_count: p.liked === 1 ? p.like_count - 1 : p.like_count + 1 }));
    try {
      await fetch(`${API}/arena/posts/${postId}/like`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch { fetchPosts(); }
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      // Step 1 — get presigned PUT URL (fast, <1s)
      const res = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, source: "arena" }),
      });
      if (!res.ok) return null;
      const { uploadUrl, publicUrl } = await res.json();
      if (!uploadUrl || !publicUrl) return null;

      // Step 2 — upload directly to R2 with progress tracking via XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`R2 ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      return publicUrl as string;
    } catch (e) {
      console.error("uploadMedia error:", e);
      return null;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType("image");
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaError(null);
    const MB = file.size / (1024 * 1024);
    if (MB > 100) {
      setMediaError(`Video is ${Math.round(MB)}MB — max 100MB. Trim it or reduce resolution to 720p.`);
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }
    setMediaFile(file);
    setMediaType("video");
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleCreatePost = async () => {
    if (!newPostBody.trim() && !mediaFile) return;
    if (!user) { setShowLoginPrompt(true); setTimeout(() => setShowLoginPrompt(false), 3000); return; }
    setSubmitting(true);
    try {
      let image_url: string | undefined;
      let video_url: string | undefined;
      if (mediaFile) {
        setUploadProgress(0);
        setUploadingMedia(true);
        const url = await uploadMedia(mediaFile);
        setUploadingMedia(false);
        setUploadProgress(0);
        if (mediaType === "image") image_url = url ?? undefined;
        else video_url = url ?? undefined;
      }
      // Body is required by the backend — use a fallback when only media is posted
      const postBody = newPostBody.trim() || (mediaType === "image" ? "📸" : mediaType === "video" ? "🎥" : "");
      const payload: Record<string, unknown> = { body: postBody, post_type: "standard" };
      if (image_url) payload.image_url = image_url;
      if (video_url) payload.video_url = video_url;
      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `${res.status}`);
      }
      setNewPostBody("");
      clearMedia();
      fetchPosts();
    } catch (e) { alert(`Could not create post: ${e instanceof Error ? e.message : "please try again"}`); }
    setSubmitting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingPostId(postId);
    try {
      await fetch(`${API}/arena/posts/${postId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${authToken}` },
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { alert("Could not delete post. Please try again."); }
    setDeletingPostId(null);
    setPostMenuOpen(null);
  };

  const startEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditBody(post.body);
    setPostMenuOpen(null);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditBody("");
  };

  const handleSaveEdit = async (postId: string) => {
    const body = editBody.trim();
    if (!body) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${API}/arena/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, body }));
      setEditingPostId(null);
      setEditBody("");
    } catch { alert("Could not save edit. Please try again."); }
    setSavingEdit(false);
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
      await fetch(`${API}/arena/follow/${playerId}`, {
        method: "POST", headers: { Authorization: `Bearer ${authToken}` },
      });
      setFollowing(prev => new Set([...prev, playerId]));
    } catch {}
  };

  const handlePipeline = (userId: string, userName: string) => {
    if (!authToken) { window.location.href = "/login"; return; }
    sessionStorage.setItem("pipeline_add", JSON.stringify({ id: userId, name: userName }));
    window.location.href = "/scout/pipeline";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  if (!hasHydrated) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "You"} />

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

      {/* Menu backdrop — closes ⋮ menu on outside click */}
      {postMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setPostMenuOpen(null)} />
      )}

      {/* Login toast */}
      {showLoginPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          Please sign in to interact with posts
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Tab navigation ───────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto">
          {([
            { key: "for-you",     label: "For You" },
            { key: "following",   label: "Following" },
            { key: "connections", label: "Connections" },
            { key: "videos",      label: "🎥 Videos" },
            { key: "pathways",    label: "🎓 Pathways" },
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
                {videos.map(video => {
                  const playerName = video.user?.name ?? "Player";
                  const initial = playerName.charAt(0).toUpperCase();
                  const meta = [video.user?.position, video.user?.sport, video.user?.province].filter(Boolean).join(" · ");
                  return (
                  <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                    {/* Player row */}
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: GRS_GREEN }}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">{playerName}</div>
                        {meta && <div className="text-xs text-gray-400">{meta}</div>}
                      </div>
                      {video.ai_rating != null && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          AI {video.ai_rating}/10
                        </span>
                      )}
                    </div>

                    {/* Inline video */}
                    <div
                      className="relative bg-black"
                      style={{ aspectRatio: "16/9", cursor: "pointer" }}
                      onClick={() => setActiveVideo(video.id)}>
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

                    {/* Skill + stats */}
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-sm font-semibold text-gray-800 capitalize">{video.skill_type}</p>
                      {video.top_strength && <p className="text-xs text-gray-500 mt-0.5">{video.top_strength}</p>}
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={11}/>{video.view_count}</span>
                        <span className="flex items-center gap-1"><Heart size={11}/>{video.like_count}</span>
                        <span className="ml-auto">{timeAgo(video.created_at)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-4 pb-4 pt-2 flex items-center gap-2 flex-wrap">
                      {video.user?.id && (
                        <Link href={`/arena/profile/${video.user.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:border-[#1a5c2a] hover:text-[#1a5c2a] transition">
                          View Profile
                        </Link>
                      )}
                      {/* Follow */}
                      <button onClick={() => handleFollow(video.user_id)}
                        disabled={following.has(video.user_id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          following.has(video.user_id)
                            ? "bg-gray-100 text-gray-400 cursor-default"
                            : "bg-[#1a5c2a] text-white hover:bg-[#2a6e3a]"
                        }`}>
                        <UserPlus size={12} />
                        {following.has(video.user_id) ? "Following" : "Follow"}
                      </button>
                      {/* Pipeline — scouts only */}
                      <button onClick={() => handlePipeline(video.user_id, playerName)}
                        disabled={pipedPlayers.has(video.user_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition"
                        style={{
                          borderColor: GRS_GOLD,
                          color: pipedPlayers.has(video.user_id) ? "#aaa" : GRS_GOLD,
                          background: pipedPlayers.has(video.user_id) ? "#faeeda" : "transparent",
                        }}>
                        <Users size={12} />
                        {pipedPlayers.has(video.user_id) ? "In pipeline" : "+ Pipeline"}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PATHWAYS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "pathways" && (
          <div>
            {!user ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <GraduationCap size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-semibold mb-1">Sign in to see your scholarship matches</p>
                <p className="text-gray-400 text-sm mb-4">We match your THUTO score, position, and reel against 25+ programs.</p>
                <a href="/login" className="inline-block px-5 py-2 rounded-lg text-sm font-bold text-white" style={{ background: GRS_GREEN }}>
                  Sign in →
                </a>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                      <GraduationCap size={20} color={GRS_GREEN} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">Scholarship Pathways</p>
                      <p className="text-xs text-gray-500">
                        {scholarshipMatches.length > 0
                          ? `${scholarshipMatches.length} programs matched · sorted by fit`
                          : "Complete your profile and reel for more matches"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match cards */}
                {scholarshipMatches.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 text-sm mb-2">No matches yet.</p>
                    <p className="text-gray-400 text-xs mb-4">
                      Build your Scholarship Reel and set a target pathway in your passport to unlock matches.
                    </p>
                    <a href="/player/passport" className="inline-block px-5 py-2 rounded-lg text-sm font-bold text-white" style={{ background: GRS_GREEN }}>
                      Build My Passport →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scholarshipMatches.map((match) => (
                      <ScholarshipAlertCard
                        key={match.program.id}
                        match={match}
                        onAddToOutreach={(programId) => {
                          window.location.href = `/player/pathway?program=${programId}`;
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* CTA to complete reel */}
                {scholarshipMatches.length > 0 && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <p className="text-xs text-amber-700 font-semibold mb-2">
                      Complete your Scholarship Reel to improve your match scores
                    </p>
                    <a href="/player/passport" className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: GRS_GOLD }}>
                      Edit Reel →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SOCIAL FEED TABS ───────────────────────────────────────────────── */}
        {activeTab !== "videos" && activeTab !== "pathways" && (
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
                    {/* Media preview */}
                    {mediaPreview && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200">
                        {mediaType === "image"
                          ? <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                          : <video src={mediaPreview} className="w-full max-h-64" controls />
                        }
                        <button onClick={clearMedia}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">
                          ✕
                        </button>
                      </div>
                    )}
                    {/* Upload progress bar */}
                    {uploadingMedia && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Uploading{mediaType === "video" ? " video" : " photo"}…</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#1a5c2a] h-1.5 rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {/* File size error */}
                    {mediaError && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{mediaError}</p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => { setMediaError(null); imageInputRef.current?.click(); }}
                          className={`p-2 transition ${mediaType === "image" ? "text-[#1a5c2a]" : "text-gray-400 hover:text-[#1a5c2a]"}`}
                          title="Add photo">
                          <Image size={18} />
                        </button>
                        <button onClick={() => { setMediaError(null); videoInputRef.current?.click(); }}
                          className={`p-2 transition ${mediaType === "video" ? "text-[#1a5c2a]" : "text-gray-400 hover:text-[#1a5c2a]"}`}
                          title="Add video (MP4, 720p, under 50MB for fastest upload)">
                          <Video size={18} />
                        </button>
                      </div>
                      <button onClick={handleCreatePost}
                        disabled={submitting || uploadingMedia || (!newPostBody.trim() && !mediaFile)}
                        className="px-4 py-2 bg-[#1a5c2a] text-white rounded-lg text-sm font-bold hover:bg-[#2a6e3a] transition disabled:opacity-50">
                        {uploadingMedia ? `${uploadProgress}%` : submitting ? "Posting…" : "Post"}
                      </button>
                    </div>
                    {/* Hidden file inputs */}
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/*" className="hidden" onChange={handleVideoSelect} />
                  </div>
                </div>
              </div>
            )}

            {/* Activity filter chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: "all",              label: "All" },
                { key: "drill_completion", label: "⚽ Drills" },
                { key: "aq_score",         label: "📈 AQ" },
                { key: "tier_unlock",      label: "🏆 Tiers" },
                { key: "session",          label: "🤖 Scored" },
                { key: "streak",           label: "🔥 Streaks" },
                { key: "gemini_drill",     label: "🤖 AI Drills" },
              ].map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setActivityFilter(chip.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                    activityFilter === chip.key
                      ? "bg-[#1a5c2a] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {chip.label}
                </button>
              ))}
            </div>

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
                {posts.map(post => {
                  const isOwner = user?.id === post.user_id || user?.id === post.user?.id;
                  const isEditing = editingPostId === post.id;
                  const isDeleting = deletingPostId === post.id;
                  const menuOpen = postMenuOpen === post.id;
                  return (
                  <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative"
                    style={
                      post.post_type === "milestone" || post.post_type === "achievement"
                        ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }
                        : post.post_type === "prediction_upgrade"
                        ? { borderColor: "#fde68a" }
                        : {}
                    }>

                    {/* Post header */}
                    <div className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] flex items-center justify-center text-white font-bold flex-shrink-0">
                        {post.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{post.user?.name || post.user?.role || "Player"}</span>
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

                        {/* Body — inline editor or plain text */}
                        {isEditing ? (
                          <div className="mt-2">
                            <textarea
                              value={editBody}
                              onChange={e => setEditBody(e.target.value)}
                              maxLength={280}
                              rows={3}
                              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] resize-none"
                            />
                            <div className="flex gap-2 mt-1">
                              <button onClick={() => handleSaveEdit(post.id)}
                                disabled={savingEdit || !editBody.trim()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1a5c2a] text-white rounded-lg text-xs font-bold disabled:opacity-50">
                                <Check size={12} /> {savingEdit ? "Saving…" : "Save"}
                              </button>
                              <button onClick={cancelEdit}
                                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium">
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{post.body}</p>
                        )}

                        {post.aq_at_post && (
                          <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                            🏆 AQ: {post.aq_at_post}
                          </div>
                        )}

                        {/* Activity enrichment card */}
                        {post.activity_type === "drill_completion" && post.activity_data && (
                          <div className="mt-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                            <span className="font-bold">⚽ Drill completed</span>
                            {post.activity_data.drillName && (
                              <span className="ml-1 text-green-700">· {String(post.activity_data.drillName)}</span>
                            )}
                            {post.activity_data.position && (
                              <span className="ml-1 text-green-600">· {String(post.activity_data.position)}</span>
                            )}
                          </div>
                        )}
                        {post.activity_type === "session_milestone" && post.activity_data && (
                          <div className="mt-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
                            <span className="font-bold">📈 Score improved</span>
                            {post.activity_data.new_score !== undefined && (
                              <span className="ml-1">→ {String(post.activity_data.new_score)}</span>
                            )}
                          </div>
                        )}
                        {post.activity_type === "prediction_upgrade" && post.activity_data && (
                          <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                            <span className="font-bold">⬆️ Level up</span>
                            {post.activity_data.new_label && (
                              <span className="ml-1 font-semibold">· {String(post.activity_data.new_label)}</span>
                            )}
                          </div>
                        )}
                        {post.activity_type === "gemini_drill" && post.activity_data && (
                          <div className="mt-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-800">
                            <span className="font-bold">🤖 AI Drill Analysis</span>
                            {post.activity_data.drillName && (
                              <span className="ml-1 text-purple-700">· {String(post.activity_data.drillName)}</span>
                            )}
                            {post.activity_data.score !== undefined && (
                              <span className="ml-2 font-semibold text-purple-900">{String(post.activity_data.score)}/10</span>
                            )}
                          </div>
                        )}

                        {/* Scout / coach action row — shown on player posts */}
                        {post.user?.role === "player" && !isOwner && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/scout/pipeline?playerId=${post.user_id}`}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#1a5c2a] text-[#1a5c2a] hover:bg-green-50 transition">
                              + Add to Pipeline
                            </Link>
                            <Link
                              href={`/passport/${post.user_id}`}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                              View Passport →
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* ⋮ owner menu */}
                      {isOwner && !isEditing && (
                        <div className="relative flex-shrink-0">
                          <button onClick={() => setPostMenuOpen(menuOpen ? null : post.id)}
                            className="p-1.5 rounded-full text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition">
                            <MoreVertical size={16} />
                          </button>
                          {menuOpen && (
                            <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1 text-sm">
                              <button onClick={() => startEditPost(post)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition">
                                <Pencil size={14} /> Edit
                              </button>
                              <button onClick={() => handleDeletePost(post.id)}
                                disabled={isDeleting}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                                <Trash2 size={14} /> {isDeleting ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                                  <span className="text-xs font-bold">{comment.user?.name || comment.user?.role || "Player"}</span>
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
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}