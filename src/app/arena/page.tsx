"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, MessageSquare, Home, Plus, Send, Image } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import ArenaVideoCard from "@/components/arena/ArenaVideoCard";
import { recordArenaView } from "@/lib/arena-video-connection";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const BG        = "#f4f2ee";

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️", fire: "🔥", strong: "💪", trophy: "🏆", clap: "👏",
};

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Types ──────────────────────────────────────────────────────────────────

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
  user?: { id: string; name: string; role: string; sport?: string; province?: string };
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user?: { id: string; name: string; role: string };
}

// ── ArenaNav ──────────────────────────────────────────────────────────────

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const links = [
    { href: "/arena",             label: "Feed",         icon: Home },
    { href: "/arena/network",     label: "Network",      icon: Users },
    { href: "/arena/clubs",       label: "Clubs",        icon: Users },
    { href: "/arena/recruitment", label: "Talent Board", icon: Briefcase },
    { href: "/arena/messages",    label: "Messages",     icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>
          The Arena
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                style={active ? { background: GRS_GREEN } : {}}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}
        >
          {initials}
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex overflow-x-auto border-t border-gray-100 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs flex-shrink-0 ${
                active ? "font-semibold" : "text-gray-500"
              }`}
              style={active ? { color: GRS_GREEN } : {}}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

// ── FeedSkeleton ──────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-32" />
              <div className="h-2 bg-gray-100 rounded w-24" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PostComposer ──────────────────────────────────────────────────────────

function PostComposer({
  userName,
  onPost,
}: {
  userName: string;
  onPost: (body: string, type: string, label: string) => Promise<void>;
}) {
  const [text, setText]     = useState("");
  const [type, setType]     = useState("standard");
  const [label, setLabel]   = useState("");
  const [posting, setPosting] = useState(false);
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const submit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    await onPost(text.trim(), type, label.trim());
    setText("");
    setLabel("");
    setType("standard");
    setPosting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5"
          style={{ background: GRS_GREEN }}
        >
          {initials}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 280))}
            placeholder="Share a result, milestone, or training update..."
            rows={3}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none"
              >
                <option value="standard">Post</option>
                <option value="milestone">Milestone</option>
                <option value="achievement">Achievement</option>
              </select>
              {type !== "standard" && (
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value.slice(0, 60))}
                  placeholder="e.g. First goal of the season"
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none w-44"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${text.length > 250 ? "text-red-400" : "text-gray-400"}`}>
                {text.length}/280
              </span>
              <button
                onClick={submit}
                disabled={!text.trim() || posting}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-40 transition-opacity"
                style={{ background: GRS_GREEN }}
              >
                <Send size={12} />
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────

function PostCard({ post, token }: { post: Post; token: string }) {
  const [liked, setLiked]       = useState(!!post.my_reaction);
  const [reaction, setReaction] = useState<string | null>(post.my_reaction ?? null);
  const [likes, setLikes]       = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText]   = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const user     = post.user;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  const cardBg =
    post.post_type === "milestone" || post.post_type === "achievement"
      ? { background: "#f0fdf4", border: "1px solid #bbf7d0" }
      : post.post_type === "prediction_upgrade"
      ? { background: "#fffbeb", border: "1px solid #fde68a" }
      : { background: "#fff", border: "1px solid #e5e5e5" };

  const doLike = async (r: string) => {
    const wasLiked = liked && reaction === r;
    setLiked(!wasLiked);
    setReaction(wasLiked ? null : r);
    setLikes((l) => (wasLiked ? l - 1 : reaction ? l : l + 1));
    try {
      await fetch(`${API}/arena/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction: r }),
      });
    } catch {}
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    try {
      const res = await fetch(`${API}/arena/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setComments(safeArray(await res.json()));
    } catch {}
    setCommentsLoaded(true);
  };

  const toggleComments = () => {
    setShowComments((s) => !s);
    if (!commentsLoaded) loadComments();
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API}/arena/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setComments((c) => [...c, json.comment]);
        setCommentText("");
      }
    } catch {}
  };

  return (
    <div className="rounded-xl overflow-hidden" style={cardBg}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{user?.name ?? "Unknown"}</span>
            {user?.role && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                {user.role}
              </span>
            )}
            {post.milestone_label && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ background: GRS_GOLD }}
              >
                {post.milestone_label}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {[user?.sport, user?.province].filter(Boolean).join(" · ")}
            {" · "}{timeAgo(post.created_at)}
          </div>
        </div>
      </div>

      {/* Body */}
      {post.body && (
        <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">{post.body}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image_url} alt="" className="rounded-lg w-full max-h-72 object-cover" />
        </div>
      )}

      {/* Sport / province tags */}
      {(post.sport || post.province) && (
        <div className="px-4 pb-2 flex gap-1.5">
          {post.sport && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{post.sport}</span>
          )}
          {post.province && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{post.province}</span>
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 py-2.5 border-t border-black/5 flex items-center gap-1 flex-wrap">
        {Object.entries(REACTION_EMOJI).map(([key, emoji]) => (
          <button
            key={key}
            onClick={() => doLike(key)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
              reaction === key ? "bg-green-50 font-semibold" : "hover:bg-gray-50 text-gray-500"
            }`}
            style={reaction === key ? { color: GRS_GREEN } : {}}
          >
            <span>{emoji}</span>
            {reaction === key && <span>{likes}</span>}
          </button>
        ))}
        {likes > 0 && !reaction && <span className="text-xs text-gray-400 ml-1">{likes}</span>}
        <button
          onClick={toggleComments}
          className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          💬 {post.comment_count}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-black/5 px-4 py-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: GRS_GREEN }}
              >
                {c.user?.name?.slice(0, 1) ?? "?"}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-1.5">
                <span className="text-xs font-semibold text-gray-700">{c.user?.name} </span>
                <span className="text-xs text-gray-600">{c.body}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 280))}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment..."
              className="flex-1 text-xs border border-gray-200 rounded-full px-3 py-1.5 outline-none"
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim()}
              className="text-xs font-semibold px-3 py-1.5 rounded-full text-white disabled:opacity-40"
              style={{ background: GRS_GREEN }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

const TABS = [
  { key: "foryou",      label: "For You" },
  { key: "following",   label: "Following" },
  { key: "connections", label: "Connections" },
  { key: "school",      label: "School" },
  { key: "videos",      label: "Videos" },
] as const;

type TabKey = typeof TABS[number]["key"];

const TAB_ENDPOINT: Record<TabKey, string> = {
  foryou:      "/arena/feed",
  following:   "/arena/feed/following",
  connections: "/arena/feed/connections",
  school:      "/arena/feed/school",
  videos:      "/arena/videos",
};

export default function ArenaPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [tab, setTab]       = useState<TabKey>("foryou");
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async (t: TabKey) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}${TAB_ENDPOINT[t]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setPosts(safeArray(json.data ?? json));
      } else {
        setPosts([]);
      }
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (hasHydrated && !user) router.push("/login");
  }, [hasHydrated, user, router]);

  useEffect(() => {
    fetchFeed(tab);
  }, [tab, fetchFeed]);

  const handlePost = async (body: string, postType: string, milestoneLabel: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body, post_type: postType, milestone_label: milestoneLabel || undefined }),
      });
      if (res.ok) {
        const json = await res.json();
        if (tab === "foryou" || tab === "connections") {
          setPosts((p) => [json.post, ...p]);
        }
      }
    } catch {}
  };

  const handleFollow = async (playerId: string) => {
    if (!token) return;
    await fetch(`${API}/arena/follow/${playerId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const handleAddToPipeline = async (playerId: string) => {
    if (!token) return;
    await fetch(`${API}/arena/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ user_id: playerId }),
    }).catch(() => {});
  };

  if (!hasHydrated || !user) return null;

  const userName = user.name ?? "You";

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <ArenaNav userName={userName} />

      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Left panel — identity */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="h-16 w-full" style={{ background: GRS_GREEN }} />
              <div className="px-4 pb-4 -mt-6">
                <div
                  className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-white font-bold"
                  style={{ background: GRS_GOLD }}
                >
                  {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 font-semibold text-gray-900 text-sm">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="border-t border-gray-100 py-2">
                {[
                  { href: "/player",    label: "Player Hub" },
                  { href: "/player/showcase", label: "My Showcase" },
                  { href: "/player/vault",    label: "Highlight Vault" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={14} /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Centre — feed */}
          <main className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex overflow-x-auto gap-1 pb-1">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                    tab === key ? "text-white" : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                  style={tab === key ? { background: GRS_GREEN } : {}}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Composer (not shown on Videos tab) */}
            {tab !== "videos" && (
              <PostComposer userName={userName} onPost={handlePost} />
            )}

            {/* Feed */}
            {loading ? (
              <FeedSkeleton />
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <p className="text-gray-500 text-sm">Nothing here yet.</p>
                {tab === "foryou" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Start by posting an update or following other players.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) =>
                  post.video_url ? (
                    <ArenaVideoCard
                      key={post.id}
                      post={{
                        id:            post.id,
                        player_id:     post.user_id,
                        player_name:   post.user?.name ?? "Player",
                        province:      post.province,
                        body:          post.body,
                        video_url:     post.video_url,
                        duration_sec:  post.duration_sec,
                        aq_at_post:    post.aq_at_post,
                        rank_at_post:  post.rank_at_post,
                        test_tier:     post.test_tier,
                        video_source:  post.video_source,
                        like_count:    post.like_count,
                        comment_count: post.comment_count,
                        view_count:    post.view_count ?? 0,
                        created_at:    post.created_at,
                        sport:         post.sport,
                      }}
                      currentUserRole={user.role as "player" | "scout" | "coach" | "fan"}
                      onFollow={handleFollow}
                      onAddToPipeline={handleAddToPipeline}
                    />
                  ) : (
                    <PostCard key={post.id} post={post} token={token ?? ""} />
                  )
                )}
              </div>
            )}
          </main>

          {/* Right panel — nav */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Arena</p>
              {[
                { href: "/arena/network",     label: "My Network",   icon: Users },
                { href: "/arena/clubs",        label: "Clubs",        icon: Users },
                { href: "/arena/recruitment",  label: "Talent Board", icon: Briefcase },
                { href: "/arena/messages",     label: "Messages",     icon: MessageSquare },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Icon size={15} className="text-gray-400" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Did you know?</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Scouts browse the Videos tab daily. Upload a showcase clip to get noticed.
              </p>
              <Link
                href="/player/showcase"
                className="mt-3 block text-center text-xs font-semibold py-1.5 rounded-full text-white"
                style={{ background: GRS_GOLD }}
              >
                Upload a clip
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
