"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, MessageSquare, Send, ChevronDown, X,
  Trophy, Star, Zap, Globe, Users, Briefcase,
  Bell, Search, Video, Image, Activity, Target,
  TrendingUp, Eye, Calendar, BookOpen, Shield,
  Flame, CheckCircle,
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

interface PostUser {
  id: string;
  name: string;
  role: string;
  sport: string | null;
  province: string | null;
  thuto_score?: number | null;
}

interface ArenaPost {
  id: string;
  user_id: string;
  body: string;
  sport: string | null;
  province: string | null;
  post_type: "standard" | "milestone" | "achievement" | "scout_activity" | "session_milestone" | "prediction_upgrade";
  milestone_label: string | null;
  like_count: number;
  comment_count: number;
  liked: number;
  created_at: string;
  is_auto?: boolean;
  metadata?: Record<string, string | number | null>;
  user: PostUser;
}

interface ArenaComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user: { id: string; name: string; role: string };
}

interface ScoutOnline {
  id: string;
  name: string;
  org: string;
  province: string;
}

interface TrendingTag {
  tag: string;
  count: number;
}

interface LeftPanelData {
  thuto_score: number | null;
  peak_level_label: string | null;
  scout_views: number;
  followers: number;
  following: number;
  sessions: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  player: "bg-emerald-50 text-emerald-700 border-emerald-200",
  coach:  "bg-blue-50 text-blue-700 border-blue-200",
  scout:  "bg-purple-50 text-purple-700 border-purple-200",
  fan:    "bg-amber-50 text-amber-700 border-amber-200",
  admin:  "bg-red-50 text-red-700 border-red-200",
};

const POST_TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  milestone:          { icon: <Trophy size={12} />,   label: "Milestone",   color: "text-amber-600" },
  achievement:        { icon: <Star size={12} />,     label: "Achievement", color: "text-purple-600" },
  scout_activity:     { icon: <Eye size={12} />,      label: "Scout Alert", color: "text-amber-700" },
  session_milestone:  { icon: <Zap size={12} />,      label: "Session",     color: "text-blue-600" },
  prediction_upgrade: { icon: <TrendingUp size={12} />, label: "Level Up",  color: "text-green-600" },
  standard:           { icon: <Globe size={12} />,    label: "",            color: "text-gray-400" },
};

function initials(name: string): string {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function authHeaders(token: string | null | undefined) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Arena Top Nav ─────────────────────────────────────────────────────────────

function ArenaNav({ unreadCount }: { unreadCount: number }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/arena/discover?q=${encodeURIComponent(q)}`);
  }

  const hubs = [
    { label: "Player",   href: "/player",   icon: <Activity size={11} /> },
    { label: "Coach",    href: "/coach",    icon: <Shield size={11} /> },
    { label: "Fans",     href: "/fan-hub",  icon: <Heart size={11} /> },
    { label: "Analysis", href: "/analyst",  icon: <Target size={11} /> },
    { label: "Scout",    href: "/scout",    icon: <Search size={11} /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots" width={28} height={28} className="rounded" />
          <span className="font-black text-sm tracking-tight hidden sm:block" style={{ color: "#1a5c2a" }}>
            The Arena
          </span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search athletes…"
              className="w-full text-xs pl-7 pr-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 outline-none focus:border-green-500 focus:bg-white transition-colors"
            />
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-1">
          {hubs.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap"
            >
              {h.icon}
              {h.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/arena/network"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
          >
            <Users size={12} />
            Network
          </Link>
          <Link
            href="/arena/recruitment"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
          >
            <Briefcase size={12} />
            Talent Board
          </Link>

          {/* Notification bell */}
          <Link href="/arena/notifications" className="relative p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={16} className="text-gray-600" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                style={{ background: "#ce1126" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ background: "#1a5c2a" }}
                >
                  {initials(user.name ?? "")}
                </div>
                <span className="hidden sm:block">{user.name?.split(" ")[0]}</span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                  <Link
                    href={roleHomePath(user.role)}
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Hub
                  </Link>
                  <Link
                    href={`/arena/profile/${user.id}`}
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Arena Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Post Composer ─────────────────────────────────────────────────────────────

interface ComposerProps {
  onPosted: (post: ArenaPost) => void;
}

const QUICK_ACTIONS = [
  { label: "Clip",    icon: <Video size={12} />,     type: "achievement" as const, placeholder: "Share a highlight clip…" },
  { label: "Session", icon: <Activity size={12} />,  type: "milestone" as const,  placeholder: "How was your training session?" },
  { label: "Goal",    icon: <Target size={12} />,    type: "milestone" as const,  placeholder: "What goal did you hit today?" },
  { label: "Photo",   icon: <Image size={12} />,     type: "standard" as const,   placeholder: "Share a moment…" },
];

function PostComposer({ onPosted }: ComposerProps) {
  const { user, token } = useAuthStore();
  const [body, setBody] = useState("");
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");
  const [postType, setPostType] = useState<"standard" | "milestone" | "achievement">("standard");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placeholder, setPlaceholder] = useState("Share a moment, milestone, or insight with the Arena…");
  const MAX = 280;

  function activateQuickAction(action: typeof QUICK_ACTIONS[0]) {
    setPostType(action.type);
    setPlaceholder(action.placeholder);
    setExpanded(true);
  }

  async function submit() {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          body: body.trim(),
          sport: sport || undefined,
          province: province || undefined,
          post_type: postType,
          milestone_label: milestoneLabel || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onPosted(data.post as ArenaPost);
        setBody("");
        setSport("");
        setProvince("");
        setPostType("standard");
        setMilestoneLabel("");
        setExpanded(false);
        setPlaceholder("Share a moment, milestone, or insight with the Arena…");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Quick action row */}
      {!expanded && (
        <div className="flex gap-2 mb-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              onClick={() => activateQuickAction(a)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
          style={{ background: "#1a5c2a" }}
        >
          {initials(user?.name ?? "")}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder={placeholder}
            maxLength={MAX}
            rows={expanded ? 3 : 1}
            className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          {expanded && (
            <>
              {/* Post type selector */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {(["standard", "milestone", "achievement"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPostType(t)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      postType === t
                        ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {POST_TYPE_META[t].icon}
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>

              {postType !== "standard" && (
                <input
                  value={milestoneLabel}
                  onChange={(e) => setMilestoneLabel(e.target.value)}
                  placeholder={postType === "milestone" ? "e.g. First 100 training sessions" : "e.g. ZIFA Under-17 Selection"}
                  className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-500"
                />
              )}

              {/* Tags row */}
              <div className="flex gap-2 mt-2">
                <input
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  placeholder="Sport (optional)"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-500"
                />
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province (optional)"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-green-500"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${body.length > MAX - 20 ? "text-red-500" : "text-gray-400"}`}>
                  {MAX - body.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setExpanded(false); setBody(""); setPlaceholder("Share a moment, milestone, or insight with the Arena…"); }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={!body.trim() || submitting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-1.5 rounded-full disabled:opacity-50 transition-opacity"
                    style={{ background: "#1a5c2a" }}
                  >
                    <Send size={11} />
                    {submitting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comment Section ───────────────────────────────────────────────────────────

function CommentSection({ postId, token }: { postId: string; token: string | null | undefined }) {
  const [comments, setComments] = useState<ArenaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/arena/posts/${postId}/comments`, {
      headers: authHeaders(token),
    })
      .then((r) => r.json())
      .then((data) => setComments(safeArray<ArenaComment>(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, token]);

  async function addComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/posts/${postId}/comments`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment as ArenaComment]);
        setNewComment("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="px-4 py-2 text-xs text-gray-400 animate-pulse">Loading comments…</div>;

  return (
    <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-xs text-gray-700">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5"
            style={{ background: "#1a5c2a" }}
          >
            {initials(c.user?.name ?? "")}
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
            <span className="font-semibold mr-1">{c.user?.name}</span>
            <span className={`text-[10px] capitalize mr-2 ${ROLE_BADGE[c.user?.role] ?? ""} px-1.5 py-0.5 rounded-full border`}>
              {c.user?.role}
            </span>
            <span className="text-gray-600">{c.body}</span>
            <span className="ml-2 text-gray-400 text-[10px]">{timeAgo(c.created_at)}</span>
          </div>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
          placeholder="Write a comment…"
          maxLength={280}
          className="flex-1 text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none focus:border-green-500"
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim() || submitting}
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-full disabled:opacity-50"
          style={{ background: "#1a5c2a" }}
        >
          <Send size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post: initial, token }: { post: ArenaPost; token: string | null | undefined }) {
  const [post, setPost] = useState(initial);
  const [liked, setLiked] = useState(initial.liked === 1);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  async function toggleLike() {
    if (liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setPost((p) => ({ ...p, like_count: p.like_count + (wasLiked ? -1 : 1) }));
    try {
      await fetch(`${API}/arena/posts/${post.id}/like`, {
        method: "POST",
        headers: authHeaders(token),
      });
    } catch {
      setLiked(wasLiked);
      setPost((p) => ({ ...p, like_count: p.like_count + (wasLiked ? 1 : -1) }));
    } finally {
      setLiking(false);
    }
  }

  const typeMeta = POST_TYPE_META[post.post_type] ?? POST_TYPE_META.standard;

  // Scout activity — gold background card
  if (post.post_type === "scout_activity") {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff8e8", borderColor: "#f0c060" }}>
        <div className="flex items-start gap-3 p-4 pb-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-amber-800 text-xs font-black shrink-0 border border-amber-300" style={{ background: "#f5d57a" }}>
            <Eye size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-900">Scout Activity</span>
              <span className="text-[10px] text-amber-600">{timeAgo(post.created_at)}</span>
            </div>
            <p className="text-sm text-amber-900 mt-1 leading-relaxed">{post.body}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-amber-200">
          <Link href="/player/subscription" className="text-[11px] font-bold text-amber-800 hover:text-amber-900">
            Upgrade to Pro to see who viewed →
          </Link>
        </div>
      </div>
    );
  }

  // Auto milestone post — dark green gradient
  if (post.post_type === "session_milestone" || post.post_type === "prediction_upgrade") {
    const meta = post.metadata ?? {};
    const isUpgrade = post.post_type === "prediction_upgrade";
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1a3d26, #1a5c2a)" }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ background: "rgba(255,255,255,0.15)" }}>
              {initials(post.user?.name ?? "")}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{post.user?.name}</p>
              <p className="text-[10px] text-green-300">{timeAgo(post.created_at)}</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-green-900" style={{ background: "#f0b429" }}>
              {isUpgrade ? "LEVEL UP" : "MILESTONE"}
            </span>
          </div>

          {isUpgrade && meta.old_label && meta.new_label ? (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
              <div className="text-center">
                <p className="text-[10px] text-green-300">Before</p>
                <p className="text-sm font-bold text-white/70">{meta.old_label as string}</p>
              </div>
              <div className="text-2xl text-green-300">→</div>
              <div className="text-center">
                <p className="text-[10px] text-green-300">Now</p>
                <p className="text-sm font-bold text-white">{meta.new_label as string}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white leading-relaxed">{post.body}</p>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${liked ? "text-red-300" : "text-white/60 hover:text-red-300"}`}
          >
            <Heart size={13} fill={liked ? "currentColor" : "none"} />
            <span>{post.like_count > 0 ? post.like_count : ""}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white/90"
          >
            <MessageSquare size={13} />
            <span>{post.comment_count > 0 ? post.comment_count : "Comment"}</span>
          </button>
        </div>
        {showComments && <div className="bg-white rounded-b-xl"><CommentSection postId={post.id} token={token} /></div>}
      </div>
    );
  }

  // Standard / milestone / achievement post
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
          style={{ background: "#1a5c2a" }}
        >
          {initials(post.user?.name ?? "")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/arena/profile/${post.user_id}`} className="text-sm font-semibold text-gray-900 hover:underline">
              {post.user?.name}
            </Link>
            <span className={`text-[10px] capitalize border px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[post.user?.role] ?? ""}`}>
              {post.user?.role}
            </span>
            {post.user?.sport && (
              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full border border-gray-100">
                {post.user.sport}
              </span>
            )}
            {post.user?.thuto_score != null && (
              <span className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                post.user.thuto_score >= 80
                  ? "text-green-700 bg-green-50 border-green-200"
                  : post.user.thuto_score >= 60
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-gray-500 bg-gray-50 border-gray-200"
              }`}>
                <Zap size={9} />
                {Math.round(post.user.thuto_score)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {post.user?.province && (
              <span className="text-[10px] text-gray-400">{post.user.province}</span>
            )}
            <span className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {post.post_type !== "standard" && (
        <div className={`mx-4 mb-3 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${
          post.post_type === "milestone"
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-purple-50 text-purple-700 border border-purple-200"
        }`}>
          {typeMeta.icon}
          <span>{post.milestone_label || typeMeta.label}</span>
        </div>
      )}

      <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.body}
      </p>

      {(post.sport || post.province) && (
        <div className="px-4 pb-3 flex gap-2">
          {post.sport && (
            <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              #{post.sport}
            </span>
          )}
          {post.province && (
            <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
              #{post.province}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
          }`}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          <span>{post.like_count > 0 ? post.like_count : ""}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-500 transition-colors"
        >
          <MessageSquare size={14} />
          <span>{post.comment_count > 0 ? post.comment_count : "Comment"}</span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} token={token} />}
    </div>
  );
}

// ── Feed Skeleton ─────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-32" />
              <div className="h-2 bg-gray-100 rounded w-20" />
              <div className="h-4 bg-gray-100 rounded w-full mt-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Scouts Online Widget ──────────────────────────────────────────────────────

function ScoutsOnlineWidget({ token }: { token: string | null | undefined }) {
  const [scouts, setScouts] = useState<ScoutOnline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/arena/scouts-online`, { headers: authHeaders(token) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setScouts(safeArray<ScoutOnline>(d.data ?? d).slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2 mb-2 animate-pulse">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 bg-gray-200 rounded w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (scouts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <p className="text-xs font-bold text-gray-900">Scouts Online Now</p>
      </div>
      <div className="space-y-2.5">
        {scouts.map((scout) => (
          <div key={scout.id} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: "#6b21a8" }}
            >
              {initials(scout.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-900 truncate">{scout.org}</p>
              <p className="text-[10px] text-gray-400 truncate">{scout.province}</p>
            </div>
            <Link
              href={`/arena/profile/${scout.id}`}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg border flex-shrink-0"
              style={{ borderColor: "#6b21a8", color: "#6b21a8" }}
            >
              View
            </Link>
          </div>
        ))}
        <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
          {scouts.length} scout{scouts.length !== 1 ? "s" : ""} browsing now
        </p>
      </div>
    </div>
  );
}

// ── Right Side Panel ──────────────────────────────────────────────────────────

interface LeaderboardEntry {
  id: string;
  initials: string;
  sport: string;
  province: string;
  projected_score: number;
  peak_level_label: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  sport: string;
  mutual_connections: number;
}

const STATIC_TRENDING: TrendingTag[] = [
  { tag: "ZimbabweFootball", count: 842 },
  { tag: "PremierSoccer",    count: 631 },
  { tag: "NASHNetball",      count: 419 },
  { tag: "ChibukuCup",       count: 287 },
  { tag: "GrassrootsSports", count: 194 },
];

function RightPanel({ token }: { token: string | null | undefined }) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>(STATIC_TRENDING);
  const [loadingL, setLoadingL] = useState(true);
  const [loadingS, setLoadingS] = useState(true);

  useEffect(() => {
    fetch(`${API}/arena/leaderboard`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setLeaders(safeArray<LeaderboardEntry>(d.data ?? d).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoadingL(false));
  }, [token]);

  useEffect(() => {
    fetch(`${API}/arena/suggested`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setSuggested(safeArray<SuggestedUser>(d.data ?? d).slice(0, 3)))
      .catch(() => {})
      .finally(() => setLoadingS(false));

    // Try to fetch trending tags — fall back to static if not available
    fetch(`${API}/arena/trending`, { headers: authHeaders(token) })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setTrending(safeArray<TrendingTag>(d.data ?? d).slice(0, 5)); })
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-4">
      {/* Arena quick nav */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wide">Arena</p>
        <div className="space-y-1">
          {[
            { label: "Activity Feed",     href: "/arena",               active: true },
            { label: "My Network",        href: "/arena/network" },
            { label: "Discover Athletes", href: "/arena/discover" },
            { label: "Messages",          href: "/arena/messages" },
            { label: "Arena Alerts",      href: "/arena/notifications" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg transition-colors ${
                l.active ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Scouts online widget */}
      <ScoutsOnlineWidget token={token} />

      {/* Top Players leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={13} style={{ color: "#c8962a" }} />
          <p className="text-xs font-bold text-gray-900">Top Players</p>
        </div>
        {loadingL ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2 animate-pulse">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-[11px] text-gray-400">No leaderboard data yet.</p>
        ) : (
          <div className="space-y-2">
            {leaders.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-[10px] font-bold w-4 text-center" style={{ color: i === 0 ? "#c8962a" : "#9ca3af" }}>
                  {i + 1}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ background: "#1a5c2a" }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-900 truncate">{p.peak_level_label}</p>
                  <p className="text-[10px] text-gray-400 truncate">{p.sport} · {p.province}</p>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#c8962a" }}>
                  {Math.round(p.projected_score)}
                </span>
              </div>
            ))}
            <Link
              href="/talent-leaderboard"
              className="block text-center text-[10px] font-semibold mt-2 pt-2 border-t border-gray-100"
              style={{ color: "#1a5c2a" }}
            >
              Full Leaderboard →
            </Link>
          </div>
        )}
      </div>

      {/* Trending in Zimbabwe */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} style={{ color: "#1a5c2a" }} />
          <p className="text-xs font-bold text-gray-900">Trending in Zimbabwe</p>
        </div>
        <div className="space-y-2">
          {trending.map((t, i) => (
            <Link
              key={t.tag}
              href={`/arena/discover?q=${encodeURIComponent(t.tag)}`}
              className="flex items-center justify-between group"
            >
              <div>
                <p className="text-[11px] font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                  #{t.tag}
                </p>
                <p className="text-[10px] text-gray-400">{t.count.toLocaleString()} posts</p>
              </div>
              <span className="text-[10px] text-gray-300">{i + 1}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Suggested for you */}
      {token && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} style={{ color: "#1a5c2a" }} />
            <p className="text-xs font-bold text-gray-900">Suggested for You</p>
          </div>
          {loadingS ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-2 animate-pulse">
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-12 h-5 bg-gray-200 rounded flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : suggested.length === 0 ? (
            <p className="text-[11px] text-gray-400">No suggestions right now.</p>
          ) : (
            <div className="space-y-3">
              {suggested.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: "#1a5c2a" }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-gray-900 truncate">{u.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize truncate">
                      {u.role}{u.sport ? ` · ${u.sport}` : ""}
                    </p>
                  </div>
                  <Link
                    href="/arena/network"
                    className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: "#c8962a", color: "#fff" }}
                  >
                    Connect
                  </Link>
                </div>
              ))}
              <Link
                href="/arena/discover"
                className="block text-center text-[10px] font-semibold mt-1 pt-2 border-t border-gray-100"
                style={{ color: "#1a5c2a" }}
              >
                Discover More Athletes →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Left Side Panel ───────────────────────────────────────────────────────────

function LeftPanel({ token }: { token: string | null | undefined }) {
  const { user } = useAuthStore();
  const [panelData, setPanelData] = useState<LeftPanelData>({
    thuto_score: null,
    peak_level_label: null,
    scout_views: 0,
    followers: 0,
    following: 0,
    sessions: 0,
  });

  useEffect(() => {
    if (!user?.id || !token) return;

    // Fetch arena profile (THUTO score, followers data) + scout view count in parallel
    Promise.allSettled([
      fetch(`${API}/arena/profile/${user.id}`, { headers: authHeaders(token) }).then((r) => r.json()),
      fetch(`${API}/players/${user.id}/view-count`, { headers: authHeaders(token) }).then((r) => r.json()),
    ]).then(([profileRes, viewRes]) => {
      const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
      const viewData = viewRes.status === "fulfilled" ? viewRes.value : null;

      setPanelData({
        thuto_score: profile?.prediction?.projected_score ?? null,
        peak_level_label: profile?.prediction?.peak_level_label ?? null,
        scout_views: viewData?.count ?? 0,
        followers: profile?.user?.followers_count ?? 0,
        following: profile?.user?.following_count ?? 0,
        sessions: 0,
      });
    });
  }, [user?.id, token]);

  const scoreColor =
    (panelData.thuto_score ?? 0) >= 75 ? "#2ecc71" :
    (panelData.thuto_score ?? 0) >= 55 ? "#f0b429" : "#e74c3c";

  const ACHIEVEMENT_BADGES = [
    { label: "TFZ School",   icon: <Shield size={10} />,       active: user?.role === "player" },
    { label: "Verified",     icon: <CheckCircle size={10} />,  active: true },
    { label: "Active",       icon: <Flame size={10} />,        active: true },
  ].filter((b) => b.active);

  return (
    <div className="space-y-3">
      {/* Identity card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-12" style={{ background: "linear-gradient(135deg, #1a5c2a, #2ecc71)" }} />
        <div className="px-4 pb-4 -mt-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black border-2 border-white"
            style={{ background: "#1a5c2a" }}
          >
            {initials(user?.name ?? "")}
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">{user?.name}</p>
          <span className={`text-[10px] capitalize border px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user?.role ?? ""] ?? ""}`}>
            {user?.role}
          </span>

          {/* THUTO score */}
          {panelData.thuto_score !== null && (
            <div className="mt-3 flex items-center gap-2">
              <div className="text-sm font-black" style={{ color: scoreColor }}>
                {Math.round(panelData.thuto_score)}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-500">THUTO Score</p>
                {panelData.peak_level_label && (
                  <p className="text-[10px] text-gray-400 truncate">{panelData.peak_level_label}</p>
                )}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: "Scout Views", value: panelData.scout_views, icon: <Eye size={10} /> },
              { label: "Following",   value: panelData.following,   icon: <Users size={10} /> },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                  {s.icon}
                </div>
                <p className="text-sm font-bold text-gray-900">{s.value}</p>
                <p className="text-[9px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Achievement badges */}
          {ACHIEVEMENT_BADGES.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ACHIEVEMENT_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ borderColor: "#1a5c2a", color: "#1a5c2a", background: "#f0fdf4" }}
                >
                  {b.icon}
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <Link
            href={user?.id ? `/arena/profile/${user.id}` : "/arena"}
            className="mt-3 block text-center text-[11px] font-semibold py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
          >
            View my profile →
          </Link>
        </div>
      </div>

      {/* Hub navigation menu */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">My Hubs</p>
        <div className="space-y-0.5">
          {[
            { label: "Player Hub",    href: "/player",   icon: <Activity size={12} /> },
            { label: "Coach Hub",     href: "/coach",    icon: <Users size={12} /> },
            { label: "Scout Hub",     href: "/scout",    icon: <Eye size={12} /> },
            { label: "Fan Hub",       href: "/fan-hub",  icon: <Star size={12} /> },
            { label: "Analysis Hub",  href: "/analyst",  icon: <TrendingUp size={12} /> },
          ].filter((h) => {
            if (user?.role === "player") return ["player", "fan-hub"].some((r) => h.href.includes(r));
            if (user?.role === "coach") return ["coach", "fan-hub", "analyst"].some((r) => h.href.includes(r));
            if (user?.role === "scout") return ["scout", "fan-hub"].some((r) => h.href.includes(r));
            return true;
          }).map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <span className="text-gray-400">{h.icon}</span>
              {h.label}
            </Link>
          ))}
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-3 mb-2">Community</p>
        <div className="space-y-0.5">
          {[
            { label: "Talent Board",     href: "/arena/recruitment", icon: <Briefcase size={12} /> },
            { label: "National Talent",  href: "/talent-leaderboard", icon: <Trophy size={12} /> },
            { label: "My Passport",      href: "/player/passport",   icon: <BookOpen size={12} /> },
          ].map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <span className="text-gray-400">{h.icon}</span>
              {h.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FeedTab = "for-you" | "following" | "connections" | "my-school";

const TAB_ENDPOINT: Record<FeedTab, string> = {
  "for-you":     "/arena/feed",
  "following":   "/arena/feed/following",
  "connections": "/arena/feed/connections",
  "my-school":   "/arena/feed/school",
};

const TAB_LABELS: Record<FeedTab, string> = {
  "for-you":     "All Activity",
  "following":   "Following",
  "connections": "Connections",
  "my-school":   "My School",
};

export default function ArenaFeedPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<ArenaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auth hydration
  useEffect(() => {
    const store = useAuthStore as unknown as { persist?: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };
    if (store.persist?.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = store.persist?.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Fetch unread notification count for bell badge
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/notifications`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        const items = safeArray<{ read: boolean }>(data.data ?? data);
        setUnreadCount(items.filter((n) => !n.read).length);
      })
      .catch(() => {});
  }, [token]);

  async function loadFeed(newTab: FeedTab, newPage: number, replace: boolean) {
    if (replace) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await fetch(`${API}${TAB_ENDPOINT[newTab]}?page=${newPage}`, {
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = safeArray<ArenaPost>(data.data ?? data);
      const meta = data.meta ?? data;
      const lastPage = meta.last_page ?? 1;
      if (replace) {
        setPosts(items);
      } else {
        setPosts((prev) => [...prev, ...items]);
      }
      setHasMore(newPage < lastPage);
    } catch {
      if (replace) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    setPage(1);
    loadFeed(tab, 1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, hydrated, token]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadFeed(tab, next, false);
  }

  function onPosted(post: ArenaPost) {
    setPosts((prev) => [post, ...prev]);
  }

  if (!hydrated) return null;

  const EMPTY_MESSAGES: Record<FeedTab, string> = {
    "for-you":     "Be the first to post something!",
    "following":   "Follow athletes to see their posts here.",
    "connections": "Connect with athletes to see their posts here.",
    "my-school":   "No posts from your school yet. Be the first!",
  };

  return (
    <div style={{ background: "#f4f2ee", minHeight: "100vh" }}>
      <ArenaNav unreadCount={unreadCount} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-5">

          {/* Left panel — desktop only */}
          <div className="hidden lg:block">
            <LeftPanel token={token} />
          </div>

          {/* Centre: feed */}
          <div className="space-y-4">
            {/* Post composer */}
            <PostComposer onPosted={onPosted} />

            {/* Feed tabs */}
            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
              {(["for-you", "following", "connections", "my-school"] as FeedTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 text-xs font-semibold py-2.5 transition-colors border-b-2 ${
                    tab === t
                      ? "text-green-700 border-green-600 bg-green-50"
                      : "text-gray-500 border-transparent hover:bg-gray-50"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Feed list */}
            {loading ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Nothing here yet</p>
                <p className="text-xs text-gray-400">{EMPTY_MESSAGES[tab]}</p>
              </div>
            ) : (
              <>
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} token={token} />
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-white rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more posts"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right panel — desktop only */}
          <div className="hidden lg:block">
            <RightPanel token={token} />
          </div>
        </div>
      </main>
    </div>
  );
}
