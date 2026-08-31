"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, MapPin, Briefcase, Heart, MessageSquare } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

interface CoachProfile {
  id: string;
  name: string;
  first_name?: string;
  surname?: string;
  role: string;
  sport?: string;
  province?: string;
  bio?: string;
  photo_url?: string;
  avatar_url?: string;
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
  connection_status?: string;
}

interface Post {
  id: string;
  body: string;
  post_type: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function CoachPublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [profile, setProfile]         = useState<CoachProfile | null>(null);
  const [posts, setPosts]             = useState<Post[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [connStatus, setConnStatus]   = useState<"none" | "pending" | "connected">("none");

  useEffect(() => {
    if (!hasHydrated) return;
    fetch(`${API}/arena/profile/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const data = json.user ?? json.data ?? json;
        setProfile(data);
        setPosts(Array.isArray(json.posts) ? json.posts : []);
        setIsFollowing(data.is_following ?? false);
        setConnStatus(data.connection_status ?? "none");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, hasHydrated, token]);

  const toggleFollow = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    await fetch(`${API}/arena/follow/${id}`, {
      method: prev ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    }).catch(() => setIsFollowing(prev));
  };

  const sendConnect = async () => {
    setConnStatus("pending");
    await fetch(`${API}/arena/connect/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    }).catch(() => setConnStatus("none"));
  };

  const isOwnProfile = user?.id === id;
  const displayName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ") || profile?.name || "Unknown";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (!hasHydrated || loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }} className="flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }} className="flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400">Coach profile not found</p>
      <Link href="/arena" className="text-sm font-medium hover:underline" style={{ color: GRS_GREEN }}>Back to Arena</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/arena" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <span className="font-bold text-base" style={{ color: GRS_GREEN }}>Coach Profile</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Green banner */}
          <div className="h-20" style={{ background: `linear-gradient(135deg, ${GRS_GREEN} 0%, #2d6a3f 100%)` }} />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-10 mb-4">
              {(profile?.photo_url || profile?.avatar_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo_url ?? profile.avatar_url}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-white shadow flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: GRS_GREEN }}>
                  {initials}
                </div>
              )}
            </div>

            {/* Name + badges */}
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: GOLD }}>Coach</span>
              {profile?.sport && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">{profile.sport}</span>
              )}
            </div>

            {/* Details */}
            <div className="mt-3 space-y-1.5">
              {profile?.province && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={13} /> {profile.province}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Briefcase size={13} /> Grassroots Coach
              </div>
            </div>

            {/* Follower counts */}
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span><span className="font-semibold text-gray-800">{profile?.follower_count ?? 0}</span> followers</span>
              <span><span className="font-semibold text-gray-800">{profile?.following_count ?? 0}</span> following</span>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
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
        </div>

        {/* Posts */}
        {posts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Posts</h2>
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  {post.video_url && (
                    <video
                      src={post.video_url}
                      poster={post.thumbnail_url ?? undefined}
                      controls
                      className="w-full rounded-xl mb-2"
                      style={{ maxHeight: 280, background: "#000" }}
                      preload="metadata"
                    />
                  )}
                  {post.body && <p className="text-sm text-gray-700 line-clamp-3">{post.body}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Heart size={11} />{post.like_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11} />{post.comment_count}</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
            style={{ background: GRS_GREEN }}>
            Join GrassRoots Sports
          </Link>
          <p className="mt-2 text-xs text-gray-400">Free for all Zimbabwean coaches</p>
        </div>
      </div>
    </div>
  );
}
