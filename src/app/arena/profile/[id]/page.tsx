"use client";
import { useState, useEffect, use } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserPlus, UserCheck, MessageCircle, Eye, Heart, MessageSquare, Star } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

interface ProfileData {
  id: string;
  name: string;
  role: string;
  sport: string;
  province: string;
  position?: string;
  bio?: string;
  avatar_url?: string;
  thuto_score?: number;
  peak_level_label?: string;
  upside_rating?: number;
  upside_label?: string;
  percentile?: number;
  comparable_name?: string;
  prediction_narrative?: string;
  data_quality?: string;
}

interface ArenaPost {
  id: string;
  body: string;
  post_type: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

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
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 75 ? "#16a34a" : value >= 55 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

export default function ArenaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [profile, setProfile]           = useState<ProfileData | null>(null);
  const [posts, setPosts]               = useState<ArenaPost[]>([]);
  const [scoutViews, setScoutViews]     = useState(0);
  const [isFollowing, setIsFollowing]   = useState(false);
  const [connStatus, setConnStatus]     = useState<"none"|"pending"|"connected">("none");
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);
  const [expandNarrative, setExpand]    = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    fetch(`${API}/arena/profile/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then((json) => {
        if (!json) return;
        setProfile(json.user ?? json);
        setPosts(Array.isArray(json.posts) ? json.posts : []);
        setScoutViews(json.scout_views ?? 0);
        setIsFollowing(json.is_following ?? false);
        setConnStatus(json.connection_status ?? "none");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, hasHydrated, token]);

  const toggleFollow = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    await fetch(`${API}/arena/follow/${id}`, {
      method: prev ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => setIsFollowing(prev));
  };

  const sendConnect = async () => {
    setConnStatus("pending");
    await fetch(`${API}/arena/connect/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => setConnStatus("none"));
  };

  if (!hasHydrated || loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"><div className="h-20 bg-gray-100 rounded-xl" /></div>)}
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="text-center py-20"><p className="text-gray-400">Profile not found</p><Link href="/arena/discover" className="text-sm font-medium mt-3 inline-block hover:underline" style={{ color: GRS_GREEN }}>Discover Athletes</Link></div>
    </div>
  );

  const initials = (profile?.name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isOwnProfile = user?.id === id;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{ background: GRS_GREEN }}>{initials}</div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{profile?.name}</h1>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: GOLD }}>{profile?.role}</span>
                {profile?.sport && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{profile.sport}</span>}
                {profile?.province && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{profile.province}</span>}
                {profile?.position && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{profile.position}</span>}
              </div>
              {profile?.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.bio}</p>}
            </div>
          </div>

          {/* Scout views */}
          {scoutViews > 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
              <Eye size={13} /> {scoutViews} scout{scoutViews !== 1 ? "s" : ""} viewed this week
            </div>
          )}

          {/* Action buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <button onClick={toggleFollow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={isFollowing
                  ? { background: "#f9fafb", color: "#6b7280", borderColor: "#d1d5db" }
                  : { background: GRS_GREEN, color: "white", borderColor: GRS_GREEN }}>
                {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                {isFollowing ? "Following" : "Follow"}
              </button>
              {connStatus === "none" && (
                <button onClick={sendConnect}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
                  style={{ background: GOLD }}>
                  Connect
                </button>
              )}
              {connStatus === "pending" && (
                <span className="px-4 py-2 rounded-full text-sm text-gray-500 border border-dashed border-gray-300">Pending</span>
              )}
              {connStatus === "connected" && (
                <Link href="/arena/messages"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50">
                  <MessageCircle size={14} /> Message
                </Link>
              )}
            </div>
          )}
        </div>

        {/* THUTO Score */}
        {profile?.thuto_score != null && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">THUTO Score</h2>
            <div className="flex items-end gap-4 mb-3">
              <span className="text-4xl font-black" style={{ color: GRS_GREEN }}>{profile.thuto_score}</span>
              <div className="pb-1">
                {profile.peak_level_label && <p className="text-sm font-medium text-gray-700">{profile.peak_level_label}</p>}
                {profile.percentile != null && <p className="text-xs text-gray-400">Top {100 - profile.percentile}% of players</p>}
              </div>
            </div>
            <ScoreBar value={profile.thuto_score} />
            {profile.upside_label && (
              <div className="flex items-center gap-1 mt-3">
                {Array.from({ length: profile.upside_rating ?? 0 }).map((_, i) => <Star key={i} size={12} fill={GOLD} color={GOLD} />)}
                <span className="text-xs text-gray-500 ml-1">{profile.upside_label}</span>
              </div>
            )}
            {profile.comparable_name && (
              <p className="text-xs text-gray-400 mt-2">Comparable: <span className="text-gray-600 font-medium">{profile.comparable_name}</span></p>
            )}
            {profile.prediction_narrative && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className={`text-xs text-gray-600 leading-relaxed ${expandNarrative ? "" : "line-clamp-2"}`}>{profile.prediction_narrative}</p>
                <button onClick={() => setExpand(!expandNarrative)} className="text-xs font-medium mt-1 hover:underline" style={{ color: GRS_GREEN }}>
                  {expandNarrative ? "Show less" : "Read more"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recent posts */}
        {posts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Posts</h2>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  {post.post_type !== "standard" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium mr-2"
                      style={{ background: post.post_type === "achievement" ? "#f0fdf4" : "#fffbeb", color: post.post_type === "achievement" ? GRS_GREEN : GOLD }}>
                      {post.post_type}
                    </span>
                  )}
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{post.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart size={11} />{post.like_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11} />{post.comment_count}</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
