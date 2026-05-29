"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Send, ChevronDown, X, Throws,
  Trophy, Star, Zap, Globe, Users, Briefcase,
  Bell, Search, Video, Image, Activity, Target,
  TrendingUp, Eye, Calendar, BookOpen, Shield,
  Flame, CheckCircle, Loader2, MapPin, ChevronRight
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

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
  image_url: string | null;
  like_count: number;
  comment_count: number;
  liked: number;
  my_reaction?: string | null;
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
  scout_views: number;
  following: number;
  followers: number;
  sessions: number;
  peak_level_label: string | null;
  thuto_score: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  player:  { label: "Player",  color: "#1a5c2a" },
  coach:   { label: "Coach",   color: "#1e40af" },
  scout:   { label: "Scout",   color: "#7c3aed" },
  fan:     { label: "Fan",     color: "#b45309" },
  admin:   { label: "Admin",   color: "#dc2626" },
  analyst: { label: "Analyst", color: "#0891b2" },
};

const POST_TYPE_META: Record<string, { label: string; color: string }> = {
  milestone:         { label: "Milestone",        color: "#c8962a" },
  achievement:       { label: "Achievement",       color: "#1a5c2a" },
  scout_activity:    { label: "Scout Activity",    color: "#7c3aed" },
  session_milestone: { label: "Session Milestone", color: "#0891b2" },
  prediction_upgrade:{ label: "Level Up",          color: "#c8962a" },
  standard:          { label: "",                  color: "" },
};

const REACTIONS = [
  { type: "heart",  emoji: "❤️", label: "Like" },
  { type: "fire",   emoji: "🔥", label: "Fire" },
  { type: "strong", emoji: "💪", label: "Strong" },
  { type: "trophy", emoji: "🏆", label: "Trophy" },
  { type: "clap",   emoji: "👏", label: "Clap" },
] as const;

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️", fire: "🔥", strong: "💪", trophy: "🏆", clap: "👏",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
               : { "Content-Type": "application/json" };
}

// ── ArenaNav ──────────────────────────────────────────────────────────────────

function ArenaNav({ user, token }: { user: any; token: string | null }) {
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.replace("/login");
  };

  const homePath = user ? roleHomePath(user.role as Parameters<typeof roleHomePath>[0]) : "/";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href={homePath} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1a5c2a] flex items-center justify-center text-white font-black text-xl shadow-xs">
            G
          </div>
          <div className="leading-none hidden sm:block">
            <span className="text-sm font-black text-gray-900 block">Grassroots Sports</span>
            <span className="text-[10px] font-bold text-gray-400 block tracking-wide">grassrootssports.live</span>
          </div>
        </Link>

        {/* Global Hub Connectors */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { href: "/player", label: "⚽ Player Hub" },
            { href: "/coach", label: "🎽 Coach Hub" },
            { href: "/scout", label: "🔍 Scout Hub" },
            { href: "/fan", label: "👥 Fan Hub" },
            { href: "/analyst", label: "📊 Analyst Hub" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1a5c2a] hover:bg-gray-50 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/arena/notifications" className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
              3
            </span>
          </Link>
          <Link href="/arena/messages" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all">
            <MessageSquare size={18} />
          </Link>

          <div ref={dropRef} className="relative">
            <button
              onClick={() => setDropOpen((o) => !o)}
              className="flex items-center gap-2 p-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1a5c2a] text-white font-black text-xs flex items-center justify-center">
                {initials(user?.name)}
              </div>
              <ChevronDown size={14} className="text-gray-500 mr-1" />
            </button>
            {dropOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl py-1 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-black text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-[#1a5c2a] uppercase tracking-wider mt-0.5">{user?.role}</p>
                </div>
                <Link href={homePath} className="block px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  Dashboard Dashboard
                </Link>
                <Link href={`/arena/profile/${user?.id}`} className="block px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  Arena Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-xs font-black text-red-600 hover:bg-red-50 border-t border-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── PostComposer ──────────────────────────────────────────────────────────────

function PostComposer({ user, token, onPosted }: { user: any; token: string | null; onPosted: (post: ArenaPost) => void }) {
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<"standard" | "milestone" | "achievement">("standard");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [sport, setSport] = useState("");
  const [province, setProvince] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const MAX = 280;

  const handleSubmit = async () => {
    if (!body.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/v1/arena/posts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          body: body.slice(0, MAX),
          post_type: postType,
          milestone_label: postType !== "standard" ? milestoneLabel : undefined,
          sport: sport || undefined,
          province: province || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onPosted(json.data ?? json);
        setBody(""); setPostType("standard"); setMilestoneLabel(""); setSport(""); setProvince("");
        setExpanded(false);
      }
    } catch (err) {
      console.error("Failed to compile post transmission:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-xs">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#1a5c2a] text-white font-black text-sm flex items-center justify-center shrink-0">
          {initials(user?.name)}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Share your latest training milestone, match details or update..."
          rows={expanded ? 3 : 1}
          className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] placeholder-gray-400 resize-none font-medium transition-all"
        />
      </div>

      {expanded && (
        <div className="mt-4 pl-12 border-t border-gray-50 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {(["standard", "milestone", "achievement"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                  postType === t
                    ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                    : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {postType !== "standard" && (
            <input
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
              placeholder={postType === "milestone" ? "e.g., First Hat-Trick of the Season" : "e.g., Selected for NASH Provincial Squad"}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 mb-3 focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
            />
          )}

          <div className="flex gap-2 mb-4">
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="Sport (e.g., Football)"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none w-1/2"
            />
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Province (e.g., Harare)"
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none w-1/2"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400">
              {body.length} / {MAX} chars
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setExpanded(false); setBody(""); }}
                className="px-4 py-1.5 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || submitting}
                className="bg-[#1a5c2a] text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-all shadow-xs"
              >
                {submitting ? "Posting..." : "Post Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CommentSection ────────────────────────────────────────────────────────────

function CommentSection({ postId, token }: { postId: string; token: string | null }) {
  const [comments, setComments] = useState<ArenaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    fetch(`${API}/api/v1/arena/posts/${postId}/comments`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setComments(safeArray(d.data ?? d)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, token]);

  const pushComment = async () => {
    if (!newBody.trim() || !token) return;
    try {
      const res = await fetch(`${API}/api/v1/arena/posts/${postId}/comments`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ body: newBody.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [...prev, json.data ?? json]);
        setNewBody("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/50 rounded-xl p-3">
      {loading ? (
        <Loader2 className="animate-spin text-gray-400 mx-auto" size={16} />
      ) : (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-xs">
              <div className="w-6 h-6 rounded-md bg-gray-200 text-gray-700 font-bold flex items-center justify-center shrink-0">
                {initials(c.user?.name)}
              </div>
              <div className="bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 flex-1 shadow-2xs">
                <span className="font-black text-gray-900 block">{c.user?.name || "User"}</span>
                <span className="text-gray-700 mt-0.5 block font-medium leading-normal">{c.body}</span>
                <span className="text-[9px] font-bold text-gray-400 block mt-1">{timeAgo(c.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {token && (
        <div className="flex gap-2">
          <input
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Write a supportive comment..."
            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]"
          />
          <button
            onClick={pushComment}
            className="bg-[#1a5c2a] text-white p-1.5 rounded-xl flex items-center justify-center shadow-xs"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post, token }: { post: ArenaPost; token: string | null }) {
  const [myReaction, setMyReaction] = useState<string | null>(post.my_reaction ?? (post.liked ? "heart" : null));
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showPicker, setShowPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleReact = async (type: string) => {
    setShowPicker(false);
    const prev = myReaction;
    const isToggleOff = prev === type;

    setMyReaction(isToggleOff ? null : type);
    setLikeCount((c) => destructionOff ? c - 1 : prev ? c : c + 1);

    try {
      await fetch(`${API}/api/v1/arena/posts/${post.id}/like`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ reaction: type }),
      });
    } catch {
      setMyReaction(prev);
    }
  };

  const badge = ROLE_BADGE[post.user?.role] ?? ROLE_BADGE.player;
  const isCelebration = post.post_type === "milestone" || post.post_type === "achievement";

  return (
    <div className={`border rounded-2xl p-5 mb-4 shadow-xs transition-all bg-white ${
      isCelebration ? "border-emerald-200 bg-emerald-50/10" : "border-gray-200"
    }`}>
      <div className="flex gap-3 items-start justify-between">
        <div className="flex gap-3">
          <Link href={`/arena/profile/${post.user?.id}`} className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-black text-sm border border-gray-200">
            {initials(post.user?.name)}
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/arena/profile/${post.user?.id}`} className="text-sm font-black text-gray-900 hover:text-[#1a5c2a]">
                {post.user?.name || "Anonymous Athlete"}
              </Link>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border" style={{ backgroundColor: badge.color + "10", color: badge.color, borderColor: badge.color + "30" }}>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">{timeAgo(post.created_at)} · {post.user?.province || "Zimbabwe"}</p>
          </div>
        </div>

        {post.user?.thuto_score && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-2 py-1 text-center shrink-0">
            <span className="text-[8px] font-black block text-amber-700 leading-none uppercase tracking-wider">THUTO</span>
            <span className="text-sm font-black text-amber-600 leading-none block mt-0.5">{post.user.thuto_score}</span>
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-gray-800 leading-relaxed mt-4 whitespace-pre-wrap">{post.body}</p>

      {post.milestone_label && (
        <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs px-3 py-1 rounded-xl shadow-2xs">
          🏅 {post.milestone_label}
        </div>
      )}

      <div className="flex items-center gap-4 mt-5 pt-3 border-t border-gray-50 text-gray-500">
        <div className="relative" onMouseEnter={() => setShowPicker(true)} onMouseLeave={() => setShowPicker(false)}>
          {showPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-1.5 flex gap-1.5 z-50">
              {REACTIONS.map((r) => (
                <button key={r.type} onClick={() => handleReact(r.type)} className="text-xl hover:scale-125 transition-transform p-1">
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => handleReact(myReaction ?? "heart")} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider hover:text-red-500">
            <span>{myReaction ? REACTION_EMOJI[myReaction] : "🤍"}</span>
            <span>{likeCount}</span>
          </button>
        </div>

        <button onClick={() => setShowComments((s) => !s)} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider hover:text-[#1a5c2a]">
          <MessageSquare size={15} />
          <span>{post.comment_count}</span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} token={token} />}
    </div>
  );
}

// ── Widgets & Panels ─────────────────────────────────────────────────────────

function LeftPanel({ user, token }: { user: any; token: string | null }) {
  const [data, setData] = useState<LeftPanelData>({ scout_views: 0, following: 0, followers: 0, sessions: 0, peak_level_label: null, thuto_score: null });

  useEffect(() => {
    if (!user || !token) return;
    Promise.allSettled([
      fetch(`${API}/api/v1/arena/profile/${user.id}`, { headers: authHeaders(token) }).then((r) => r.json()),
      fetch(`${API}/api/v1/players/${user.id}/view-count`, { headers: authHeaders(token) }).then((r) => r.json()),
    ]).then(([p, vc]) => {
      const profile = p.status === "fulfilled" ? p.value : null;
      const views = vc.status === "fulfilled" ? vc.value : null;
      setData({
        scout_views: views?.count ?? 0,
        following: profile?.following_count ?? 0,
        followers: profile?.followers_count ?? 0,
        sessions: profile?.sessions_count ?? 0,
        peak_level_label: profile?.prediction?.peak_level_label ?? "Developing Prospect",
        thuto_score: profile?.user?.thuto_score ?? profile?.prediction?.projected_score ?? null,
      });
    });
  }, [user, token]);

  const badge = ROLE_BADGE[user?.role ?? "player"];

  return (
    <aside className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-12 bg-gradient-to-r from-[#1a5c2a] to-emerald-700" />
        <div className="p-4 pt-0 -mt-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#1a5c2a] border-4 border-white text-white font-black text-base mx-auto flex items-center justify-center shadow-sm">
            {initials(user?.name)}
          </div>
          <h2 className="text-sm font-black text-gray-900 mt-2 truncate">{user?.name}</h2>
          <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1" style={{ backgroundColor: badge.color + "10", color: badge.color }}>
            {badge.label}
          </span>

          {data.thuto_score && (
            <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5">
              <span className="text-[9px] font-black text-[#1a5c2a] block uppercase tracking-widest">THUTO Prediction Matrix</span>
              <span className="text-xl font-black text-[#1a5c2a] block mt-0.5">{data.thuto_score}</span>
              <span className="text-[10px] font-bold text-gray-500 block mt-0.5">{data.peak_level_label}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4 text-center border-t border-gray-50 pt-3">
            <div>
              <span className="text-sm font-black text-gray-900 block">{data.scout_views}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mt-0.5">Scout Views</span>
            </div>
            <div>
              <span className="text-sm font-black text-gray-900 block">{data.followers}</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mt-0.5">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Mapping */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3 font-black text-xs uppercase tracking-wider text-gray-500">
        <div>
          <p className="text-[9px] font-bold text-gray-400 tracking-widest mb-1">Navigation Navigation</p>
          <Link href="/arena" className="flex items-center gap-2 py-1 text-[#1a5c2a]">🏠 Home Feed</Link>
          <Link href="/arena/discover" className="flex items-center gap-2 py-1 hover:text-gray-900">🌍 Discover Athletes</Link>
          <Link href="/talent-leaderboard" className="flex items-center gap-2 py-1 hover:text-gray-900">🏆 THUTO Top 50</Link>
        </div>
      </div>
    </aside>
  );
}

function RightPanel({ token }: { token: string | null }) {
  const [scouts, setScouts] = useState<ScoutOnline[]>([]);
  const [trending, setTrending] = useState<TrendingTag[]>([]);

  useEffect(() => {
    const h = authHeaders(token);
    fetch(`${API}/api/v1/arena/scouts-online`, { headers: h }).then((r) => r.json()).then((d) => setScouts(safeArray(d.data ?? d))).catch(() => {});
    fetch(`${API}/api/v1/arena/trending`, { headers: h }).then((r) => r.json()).then((d) => setTrending(safeArray(d.data ?? d))).catch(() => {});
  }, [token]);

  return (
    <aside className="space-y-4">
      {scouts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" />
            Verified Scouts Active ({scouts.length})
          </h3>
          <div className="space-y-3">
            {scouts.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate">{s.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 truncate">{s.org} · {s.province}</p>
                </div>
                <Link href={`/arena/profile/${s.id}`} className="text-[10px] font-black uppercase text-[#1a5c2a] bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-[#1a5c2a] hover:text-white transition-all">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {trending.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#1a5c2a]" /> Trending Zimbabwe
          </h3>
          <div className="space-y-2">
            {trending.slice(0, 5).map((t) => (
              <div key={t.tag} className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#1a5c2a]">#{t.tag}</span>
                <span className="text-gray-400 text-[10px]">{t.count} updates</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Core Arena App Component ──────────────────────────────────────────────────

export default function ArenaFeedPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<ArenaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  const fetchFeed = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = TAB_ENDPOINT[activeTab];
      const res = await fetch(`${API}/api/v1${endpoint}`, { headers: authHeaders(token) });
      if (res.ok) {
        const json = await res.json();
        setPosts(safeArray(json.data ?? json));
      }
    } catch (err) {
      console.error("Failed to sync arena timeline feeds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasHydrated && user) {
      fetchFeed();
    }
  }, [activeTab, hasHydrated, user]);

  if (!hasHydrated || !user) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a5c2a]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-[#f4f2ee] min-h-screen text-gray-900 antialiased font-sans">
      <ArenaNav user={user} token={token} />

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <LeftPanel user={user} token={token} />

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="flex border-b border-gray-100 font-black text-xs uppercase tracking-wider">
              {(Object.keys(TAB_LABELS) as FeedTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPosts([]); }}
                  className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === tab
                      ? "text-[#1a5c2a] border-[#1a5c2a]"
                      : "text-gray-400 border-transparent hover:text-gray-700"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          </div>

          <PostComposer user={user} token={token} onPosted={(p) => setPosts((prev) => [p, ...prev])} />

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#1a5c2a]" size={28} />
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs">
              <span className="text-3xl block">🏟️</span>
              <h4 className="text-sm font-black text-gray-900 mt-3">The Arena feed is currently peaceful</h4>
              <p className="text-xs font-bold text-gray-400 mt-1">Be the first player in your region to post a development insight!</p>
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} token={token} />)
          )}
        </div>

        <RightPanel token={token} />
      </div>
    </div>
  );
}