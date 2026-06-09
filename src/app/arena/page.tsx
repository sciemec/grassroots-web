"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Send, ChevronDown, 
  Trophy, Star, Zap, Globe, Users, Briefcase,
  Bell, Search, Video, Image, Activity, Target,
  TrendingUp, Eye, Calendar, BookOpen, Shield,
  Flame, CheckCircle, Loader2, MapPin, ChevronRight,
  Newspaper, Radio, Award, GraduationCap
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

// ─── Types ─────────────────────────────────────────────────────────────────

type FeedTab = "for-you" | "milestones" | "regional";
type NewsTab = "local" | "global";

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

interface FootballResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "LIVE" | "FT";
  minute?: string;
  league: string;
}

interface NewsItem {
  id: string;
  title: string;
  outlet: string;
  time: string;
  category: "local" | "global";
  url?: string;
}

interface LeftPanelData {
  scout_views: number;
  following: number;
  followers: number;
  sessions: number;
  peak_level_label: string | null;
  thuto_score: number | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  player:  { label: "Player",   color: "#1a5c2a" },
  coach:   { label: "Coach",    color: "#1e40af" },
  scout:   { label: "Scout",    color: "#7c3aed" },
  fan:     { label: "Fan",      color: "#b45309" },
  admin:   { label: "Admin",    color: "#dc2626" },
  analyst: { label: "Analyst",  color: "#0891b2" },
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

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── ArenaNav ──────────────────────────────────────────────────────────────

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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href={homePath} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1a5c2a] flex items-center justify-center text-white font-black text-xl shadow-sm">
            G
          </div>
          <div className="leading-none hidden sm:block">
            <span className="text-sm font-black text-gray-900 block">Grassroots Sports</span>
            <span className="text-[10px] font-bold text-gray-400 block tracking-wide">grassrootssports.live</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {[
            { href: "/player", label: "⚽ Player Hub" },
            { href: "/coach", label: "📋 Coach Hub" },
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
                  Dashboard Hub
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

// ─── PostComposer ──────────────────────────────────────────────────────────

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
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
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
                className="bg-[#1a5c2a] text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-40 transition-all shadow-sm"
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

// ─── CommentSection ────────────────────────────────────────────────────────

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
              <div className="bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 flex-1 shadow-sm">
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
            className="bg-[#1a5c2a] text-white p-1.5 rounded-xl flex items-center justify-center shadow-sm"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PostCard ──────────────────────────────────────────────────────────────

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
    setLikeCount((c) => isToggleOff ? c - 1 : prev ? c : c + 1);

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
    <div className={`border rounded-2xl p-5 mb-4 shadow-sm transition-all bg-white ${
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
        <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-black text-xs px-3 py-1 rounded-xl shadow-sm">
          🏆 {post.milestone_label}
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
            <span>{myReaction ? REACTION_EMOJI[myReaction] : "❤️"}</span>
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

// ─── LeftPanel Widget ──────────────────────────────────────────────────────

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
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
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

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3 font-black text-xs uppercase tracking-wider text-gray-500">
        <div>
          <p className="text-[9px] font-bold text-gray-400 tracking-widest mb-1">Navigation Hub</p>
          <Link href="/arena" className="flex items-center gap-2 py-1 text-[#1a5c2a]">🏡 Home Feed</Link>
          <Link href="/arena/discover" className="flex items-center gap-2 py-1 hover:text-gray-900">🌍 Discover Athletes</Link>
          <Link href="/talent-leaderboard" className="flex items-center gap-2 py-1 hover:text-gray-900">🏆 THUTO Top 50</Link>
        </div>
      </div>
    </aside>
  );
}

// ─── RightPanel Widget ─────────────────────────────────────────────────────

function RightPanel({ token }: { token: string | null }) {
  const [scouts, setScouts] = useState<ScoutOnline[]>([]);
  const [newsTab, setNewsTab] = useState<NewsTab>("local");
  
  const [results] = useState<FootballResult[]>([
    { id: "1", homeTeam: "Dynamos", awayTeam: "Highlanders", homeScore: 1, awayScore: 0, status: "LIVE", minute: "74'", league: "Castle Lager Premier League" },
    { id: "2", homeTeam: "CAPS United", awayTeam: "Ngezi Platinum", homeScore: 2, awayScore: 2, status: "FT", league: "Castle Lager Premier League" },
    { id: "3", homeTeam: "Mamelodi Sundowns", awayTeam: "Orlando Pirates", homeScore: 1, awayScore: 1, status: "LIVE", minute: "42'", league: "DSTV Premiership" },
    { id: "4", homeTeam: "Real Madrid", awayTeam: "Barcelona", homeScore: 3, awayScore: 2, status: "FT", league: "UEFA Champions League" }
  ]);

  const [news] = useState<NewsItem[]>([
    { id: "n1", title: "ZIFA targets advanced youth talent analytics pathways ahead of regional games", outlet: "Soccer24", time: "2h ago", category: "local" },
    { id: "n2", title: "National High School tournament stars land professional scout lookouts", outlet: "The Herald", time: "5h ago", category: "local" },
    { id: "n3", title: "Chipo M. climbs THUTO Matrix Leaderboards to hit regional peak rank criteria", outlet: "Grassroots Analytics", time: "1d ago", category: "local" },
    { id: "n4", title: "Morocco scales up soccer academy infrastructure investment models", outlet: "CAF Online", time: "4h ago", category: "global" },
    { id: "n5", title: "European scouts emphasize algorithmic biometric profiling for African prospects", outlet: "Sky Sports", time: "8h ago", category: "global" }
  ]);

  useEffect(() => {
    const h = authHeaders(token);
    fetch(`${API}/api/v1/arena/scouts-online`, { headers: h }).then((r) => r.json()).then((d) => setScouts(safeArray(d.data ?? d))).catch(() => {});
  }, [token]);

  const filteredNews = news.filter(item => item.category === newsTab);

  return (
    <aside className="space-y-4">
      {/* Match Center */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
          <Award size={14} className="text-[#1a5c2a]" /> Football Match Center
        </h3>
        <div className="space-y-3">
          {results.map((match) => (
            <div key={match.id} className="border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate mb-1">{match.league}</p>
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-gray-950 font-black truncate">{match.homeTeam}</p>
                  <p className="text-gray-950 font-black truncate">{match.awayTeam}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div className="bg-gray-50 rounded px-1.5 py-1 text-center font-black min-w-6">
                    <p className="text-gray-900">{match.homeScore}</p>
                    <p className="text-gray-900">{match.awayScore}</p>
                  </div>
                  <div className="text-right min-w-10">
                    <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      match.status === "LIVE" ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500"
                    }`}>
                      {match.status}
                    </span>
                    {match.minute && <p className="text-[10px] text-red-500 font-bold mt-0.5">{match.minute}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Desk */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <Newspaper size={14} className="text-[#1a5c2a]" /> News Desk
          </h3>
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
            {(["local", "global"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setNewsTab(tab)}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${
                  newsTab === tab ? "bg-white text-[#1a5c2a] shadow-sm" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredNews.map((item) => (
            <div key={item.id} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0 group cursor-pointer">
              <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-[#1a5c2a] transition-colors leading-snug">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-gray-400">
                <span className="text-[#1a5c2a]">{item.outlet}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Scouts */}
      {scouts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
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
    </aside>
  );
}

// ─── Wire ticker messages ───────────────────────────────────────────────────

const WIRE = [
  "Dynamos FC 2–1 Highlanders · 67' — NSS is electric tonight",
  "K.M. (U17 Striker, Harare) clocked 2.84s sprint — open for scouting",
  "T.N. (Bulawayo) earned the Rising Star badge this week",
  "3 new scout verification requests pending review",
  "Munhumutapa Challenge Cup 2026 — registration open for U14 & U16",
  "Zimbabwe U20 squad announced for COSAFA Cup qualifiers",
];

// ─── Core Arena App Component ──────────────────────────────────────────────

export default function ArenaFeedPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [wireIndex, setWireIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts, setPosts] = useState<ArenaPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcode fixed raw array loops to prevent Webpack reference tree optimization crashes completely
  const AVAILABLE_TABS = [
    { id: "for-you", label: "For You Feed", endpoint: "/arena/posts" },
    { id: "milestones", label: "Milestones Only", endpoint: "/arena/posts?type=milestone" },
    { id: "regional", label: "Regional Standings", endpoint: "/arena/posts?filter=regional" }
  ] as const;

  const fetchFeed = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const currentTabConfig = AVAILABLE_TABS.find(t => t.id === activeTab);
      const endpoint = currentTabConfig ? currentTabConfig.endpoint : "/arena/posts";
      
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
    const id = setInterval(() => setWireIndex((p) => (p + 1) % WIRE.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

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

      {/* Brand header */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>
              GRS
            </div>
            <div>
              <p className="font-black text-white text-sm uppercase tracking-wider leading-none">GrassRoots Sports</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>The Arena</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <GraduationCap size={14} style={{ color: "#f0b429" }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>Education Partner</p>
              <p className="text-[10px] font-black uppercase text-white">Teach For Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live wire ticker */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1 rounded text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ backgroundColor: "#dc2626" }}>
            <Radio size={9} className="animate-pulse" /> Live Wire
          </span>
          <p className="text-xs font-semibold truncate" style={{ color: "#92400e" }}>
            {WIRE[wireIndex]}
          </p>
        </div>
      </div>

      <ArenaNav user={user} token={token} />

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <LeftPanel user={user} token={token} />

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 font-black text-xs uppercase tracking-wider">
              {AVAILABLE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPosts([]); }}
                  className={`flex-1 text-center py-3 border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "text-[#1a5c2a] border-[#1a5c2a]"
                      : "text-gray-400 border-transparent hover:text-gray-700"
                  }`}
                >
                  {tab.label}
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
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-3xl block">🏜️</span>
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