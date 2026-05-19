"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, UserPlus, MessageCircle, CheckCircle2,
  Zap, Trophy, Star, TrendingUp, Eye, Flame, Target,
  Shield, Brain, Activity, Users,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArenaUser {
  id: number;
  name: string;
  role: string;
  sport: string | null;
  province: string | null;
  thuto_score: number | null;
  created_at: string;
  follower_count: number;
  connection_count: number;
  is_verified?: boolean;
  subscription_tier?: string;
  position?: string;
}

interface ArenaPost {
  id: string;
  body: string;
  post_type: string;
  sport: string | null;
  province: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  milestone_label?: string;
}

interface ProfileData {
  user: ArenaUser;
  posts: ArenaPost[];
  scout_views: number;
  is_following: boolean;
  is_connected: boolean;
  connection_status: "none" | "pending" | "accepted";
  prediction?: {
    peak_level_label: string;
    projected_score: number;
    comparable_name: string;
    confidence: number;
  } | null;
}

// ─── ArenaNav ─────────────────────────────────────────────────────────────────

function ArenaNav() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/arena" className="text-lg font-bold" style={{ color: "#1a5c2a" }}>
          The Arena
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/arena" className="text-gray-600 hover:text-gray-900">Feed</Link>
          <Link href="/arena/network" className="text-gray-600 hover:text-gray-900">Network</Link>
          <Link href="/arena/clubs" className="text-gray-600 hover:text-gray-900">Clubs</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
      <div className="relative group">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {initials}
        </div>
        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 hidden group-hover:block z-50">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

function StatBox({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <Icon size={18} className="mx-auto mb-1" style={{ color }} />
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: ArenaPost }) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeStyle: Record<string, string> = {
    milestone:    "bg-amber-50 border-amber-200",
    achievement:  "bg-green-50 border-green-200",
    standard:     "bg-white border-gray-200",
  };

  return (
    <div className={`rounded-xl border p-4 ${typeStyle[post.post_type] ?? typeStyle.standard}`}>
      {post.post_type !== "standard" && (
        <div className="flex items-center gap-1.5 mb-2">
          {post.post_type === "milestone" && <Star size={13} className="text-amber-600" />}
          {post.post_type === "achievement" && <Trophy size={13} className="text-green-600" />}
          <span className="text-xs font-semibold" style={{ color: post.post_type === "milestone" ? "#92400e" : "#166534" }}>
            {post.milestone_label ?? (post.post_type === "milestone" ? "Milestone" : "Achievement")}
          </span>
        </div>
      )}
      <p className="text-sm text-gray-800 leading-relaxed">{post.body}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span>{timeAgo(post.created_at)}</span>
        <span>{post.like_count} likes</span>
        <span>{post.comment_count} comments</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArenaProfilePage() {
  const params  = useParams();
  const profileId = params?.id as string;
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);

  const [data, setData]       = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [following, setFollowing]     = useState(false);
  const [connecting, setConnecting]   = useState(false);
  const [connStatus, setConnStatus]   = useState<"none" | "pending" | "accepted">("none");

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!profileId) return;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API}/arena/profile/${profileId}`, { headers })
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setFollowing(json.is_following ?? false);
        setConnStatus(json.connection_status ?? "none");
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [profileId, API, token]);

  const handleFollow = async () => {
    if (!token) { router.push("/login"); return; }
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      await fetch(`${API}/arena/follow/${profileId}`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setFollowing(wasFollowing);
    }
  };

  const handleConnect = async () => {
    if (!token) { router.push("/login"); return; }
    setConnecting(true);
    try {
      await fetch(`${API}/arena/connect/${profileId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnStatus("pending");
    } catch {
      // silently fail
    } finally {
      setConnecting(false);
    }
  };

  const isOwnProfile = user && String(user.id) === String(profileId);
  const profile = data?.user;

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const thutoScore = profile?.thuto_score ?? 0;

  // Simulated breakdown from overall score
  const breakdown = {
    Technical: Math.min(100, Math.round(thutoScore * 1.1)),
    Physical:  Math.min(100, Math.round(thutoScore * 0.95)),
    Tactical:  Math.min(100, Math.round(thutoScore * 0.9)),
    Mental:    Math.min(100, Math.round(thutoScore * 1.05)),
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
          <div className="h-32 rounded-2xl bg-gray-300" />
          <div className="h-20 bg-white rounded-2xl border border-gray-200" />
          <div className="h-40 bg-white rounded-2xl border border-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">
          <p>{error || "Profile not found."}</p>
          <Link href="/arena/discover" className="mt-4 inline-block text-sm text-green-700 underline">
            Discover Athletes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Hero Banner */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
          {/* Green banner */}
          <div className="h-24 relative" style={{ backgroundColor: "#1a5c2a" }}>
            {/* Avatar */}
            <div className="absolute -bottom-10 left-5">
              <div
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold text-white shadow"
                style={{ backgroundColor: "#c8962a" }}
              >
                {initials}
              </div>
            </div>
          </div>

          {/* Profile card body */}
          <div className="bg-white pt-12 px-5 pb-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.is_verified && (
                    <CheckCircle2 size={18} style={{ color: "#1a5c2a" }} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {profile.sport && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
                      {profile.sport}
                    </span>
                  )}
                  {profile.position && (
                    <span className="text-xs text-gray-500">{profile.position}</span>
                  )}
                  {profile.province && (
                    <span className="text-xs text-gray-500">· {profile.province}</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium capitalize">
                    {profile.subscription_tier ?? "Free"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span><strong className="text-gray-900">{profile.follower_count}</strong> followers</span>
                  <span><strong className="text-gray-900">{profile.connection_count}</strong> connections</span>
                </div>
              </div>

              {/* Action buttons */}
              {!isOwnProfile && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleFollow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
                    style={{
                      backgroundColor: following ? "white" : "#1a5c2a",
                      color:           following ? "#1a5c2a" : "white",
                      borderColor:     "#1a5c2a",
                    }}
                  >
                    <UserPlus size={14} />
                    {following ? "Following" : "Follow"}
                  </button>

                  {connStatus === "none" && (
                    <button
                      onClick={handleConnect}
                      disabled={connecting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                      style={{ backgroundColor: "#c8962a" }}
                    >
                      <Users size={14} />
                      Connect
                    </button>
                  )}
                  {connStatus === "pending" && (
                    <span className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-500 font-medium">
                      Pending
                    </span>
                  )}
                  {connStatus === "accepted" && (
                    <Link
                      href={`/arena/messages?user=${profileId}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <MessageCircle size={14} />
                      Message
                    </Link>
                  )}
                </div>
              )}
              {isOwnProfile && (
                <Link
                  href="/player/profile"
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 5 Stat Boxes */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <StatBox label="THUTO Score" value={thutoScore || "–"} icon={Zap} color="#c8962a" />
          <StatBox label="Scout Views" value={data?.scout_views ?? 0} icon={Eye} color="#1a5c2a" />
          <StatBox label="Monthly Growth" value="+12%" icon={TrendingUp} color="#059669" />
          <StatBox label="Session Streak" value="5 days" icon={Flame} color="#dc2626" />
          <StatBox label="Prediction" value={data?.prediction?.peak_level_label ?? "–"} icon={Trophy} color="#7c3aed" />
        </div>

        {/* Badges row */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Earned Badges</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "TFZ School", color: "#1a5c2a" },
              { label: "Top 50 ZW", color: "#c8962a" },
              { label: "Early Adopter", color: "#7c3aed" },
              { label: "5-Day Streak", color: "#dc2626" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: badge.color }}
              >
                <Star size={10} />
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* THUTO Breakdown + Prediction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity size={15} style={{ color: "#1a5c2a" }} />
              THUTO Score Breakdown
            </h3>
            <ScoreBar label="Technical" value={breakdown.Technical} color="#1a5c2a" />
            <ScoreBar label="Physical"  value={breakdown.Physical}  color="#c8962a" />
            <ScoreBar label="Tactical"  value={breakdown.Tactical}  color="#7c3aed" />
            <ScoreBar label="Mental"    value={breakdown.Mental}    color="#dc2626" />
          </div>

          {/* THUTO Prediction card */}
          <div className="rounded-2xl shadow-sm p-5 space-y-4" style={{ backgroundColor: "#1a3d26" }}>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Target size={15} style={{ color: "#c8962a" }} />
              THUTO Prediction
            </h3>
            {data?.prediction ? (
              <>
                <div>
                  <div className="text-xs text-green-300 mb-0.5">Peak Level</div>
                  <div className="text-lg font-bold text-white">{data.prediction.peak_level_label}</div>
                </div>
                <div>
                  <div className="text-xs text-green-300 mb-0.5">Projected Score</div>
                  <div className="text-2xl font-bold" style={{ color: "#c8962a" }}>{data.prediction.projected_score}</div>
                </div>
                {data.prediction.comparable_name && (
                  <div>
                    <div className="text-xs text-green-300 mb-1">Plays Like</div>
                    <div className="text-sm font-semibold text-white">{data.prediction.comparable_name}</div>
                  </div>
                )}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-300">Confidence</span>
                    <span className="text-white">{data.prediction.confidence}%</span>
                  </div>
                  <div className="h-2 bg-green-900 rounded-full">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${data.prediction.confidence}%`, backgroundColor: "#c8962a" }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-green-300">
                No prediction yet. Complete 3+ training sessions to unlock.
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <Shield size={12} />
              Powered by THUTO AI
            </div>
          </div>
        </div>

        {/* Recent posts */}
        {data?.posts && data.posts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Brain size={15} style={{ color: "#1a5c2a" }} />
              Recent Arena Posts
            </h3>
            {safeArray<ArenaPost>(data.posts).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            <Link
              href="/arena"
              className="block text-center text-sm text-green-700 hover:text-green-900 font-medium pt-1"
            >
              View full feed →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
