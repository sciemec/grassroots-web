"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Users, MapPin, Trophy, Star, ChevronLeft, UserCheck,
  Zap, MessageSquare, Shield, Dumbbell, Building2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubDetail {
  id: number;
  name: string;
  sport: string;
  province: string;
  district: string | null;
  tier: string | null;
  formation: string | null;
  playing_style: string | null;
  is_scouting: boolean;
  is_open_trials: boolean;
  avg_thuto_score: number | null;
  follower_count: number;
  reviews_count: number;
  coach: { id: number; name: string } | null;
}

interface AvgRatings {
  avg_overall: number | null;
  avg_training: number | null;
  avg_coach: number | null;
  avg_facilities: number | null;
}

interface Review {
  id: number;
  club_id: number;
  rating_overall: number;
  rating_training: number;
  rating_coach: number;
  rating_facilities: number;
  comment: string | null;
  created_at: string;
}

interface TopPlayer {
  id: string;
  name: string;
  position: string | null;
  thuto_score: number | null;
  peak_level_label: string | null;
  sport: string | null;
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
          <Link href="/arena/clubs" className="font-semibold" style={{ color: "#1a5c2a" }}>Clubs</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
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
      </div>
    </nav>
  );
}

// ─── RatingBar ────────────────────────────────────────────────────────────────

function RatingBar({ label, value }: { label: string; value: number | null }) {
  const pct = value ? Math.round((value / 5) * 100) : 0;
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-semibold w-8 text-right" style={{ color }}>
        {value ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

// ─── StarRow ─────────────────────────────────────────────────────────────────

function StarRow({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= value ? "fill-current" : ""}
          style={{ color: n <= value ? "#c8962a" : "#d1d5db" }}
        />
      ))}
    </span>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const ago = (() => {
    const diff = Date.now() - new Date(review.created_at).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 30) return `${d}d ago`;
    return new Date(review.created_at).toLocaleDateString("en-ZW", { month: "short", year: "numeric" });
  })();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            A
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Anonymous Player</p>
            <p className="text-xs text-gray-400">{ago}</p>
          </div>
        </div>
        <StarRow value={review.rating_overall} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
        <span>Training: <strong>{review.rating_training}/5</strong></span>
        <span>Coach: <strong>{review.rating_coach}/5</strong></span>
        <span>Facilities: <strong>{review.rating_facilities}/5</strong></span>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="h-40 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClubDetailPage() {
  const params   = useParams();
  const clubId   = params?.id as string;
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);

  const [club, setClub]           = useState<ClubDetail | null>(null);
  const [avgRatings, setAvgRatings] = useState<AvgRatings | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!clubId) return;
    (async () => {
      setLoading(true);
      try {
        const [detailRes, reviewsRes, playersRes] = await Promise.allSettled([
          fetch(`${API}/arena/clubs/${clubId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API}/arena/clubs/${clubId}/reviews`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API}/arena/clubs/${clubId}/players`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (detailRes.status === "fulfilled" && detailRes.value.ok) {
          const json = await detailRes.value.json();
          setClub(json.club ?? null);
          setAvgRatings(json.avg_ratings ?? null);
          setIsFollowing(json.is_following ?? false);
        }

        if (reviewsRes.status === "fulfilled" && reviewsRes.value.ok) {
          const rj = await reviewsRes.value.json();
          const raw = rj?.data ?? rj;
          setReviews(Array.isArray(raw) ? raw : []);
        }

        if (playersRes.status === "fulfilled" && playersRes.value.ok) {
          const pj = await playersRes.value.json();
          const raw = pj?.data ?? pj;
          setTopPlayers(Array.isArray(raw) ? raw.slice(0, 6) : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, token]);

  const handleFollow = async () => {
    if (!token || !club) return;
    setFollowLoading(true);
    const prev = isFollowing;
    setIsFollowing(!prev);
    setClub((c) => c ? { ...c, follower_count: c.follower_count + (prev ? -1 : 1) } : c);
    try {
      await fetch(`${API}/arena/clubs/${club.id}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setIsFollowing(prev);
      setClub((c) => c ? { ...c, follower_count: c.follower_count + (prev ? 1 : -1) } : c);
    } finally {
      setFollowLoading(false);
    }
  };

  const score = club?.avg_thuto_score ?? null;
  const scoreColor = score
    ? score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626"
    : "#9ca3af";

  const isOwner = user && club?.coach?.id && String(user.id) === String(club.coach.id);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Back */}
        <Link href="/arena/clubs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} />
          Back to Clubs
        </Link>

        {loading ? (
          <Skeleton />
        ) : !club ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Club not found</p>
          </div>
        ) : (
          <>
            {/* ── Club Banner ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header strip */}
              <div className="p-5" style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #2d7a3a 100%)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-white">{club.name}</h1>
                    <p className="text-green-200 text-sm mt-0.5">{club.sport}</p>
                  </div>
                  {score !== null && (
                    <div className="text-right bg-white/10 rounded-xl px-3 py-2">
                      <div className="text-2xl font-bold text-white">{score.toFixed(0)}</div>
                      <div className="text-xs text-green-200">THUTO</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {club.is_scouting && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                      Actively Scouting
                    </span>
                  )}
                  {club.is_open_trials && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                      Open Trials
                    </span>
                  )}
                  {club.tier && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
                      {club.tier}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-100">
                <div className="flex flex-col items-center py-4 gap-0.5">
                  <span className="text-lg font-bold text-gray-900">{club.follower_count}</span>
                  <span className="text-xs text-gray-400">Followers</span>
                </div>
                <div className="flex flex-col items-center py-4 gap-0.5">
                  <span className="text-lg font-bold text-gray-900">{club.reviews_count}</span>
                  <span className="text-xs text-gray-400">Reviews</span>
                </div>
                <div className="flex flex-col items-center py-4 gap-0.5">
                  <span className="text-lg font-bold text-gray-900">{club.formation ?? "—"}</span>
                  <span className="text-xs text-gray-400">Formation</span>
                </div>
                <div className="flex flex-col items-center py-4 gap-0.5 px-2 text-center">
                  <span className="text-sm font-bold text-gray-900 leading-tight">{club.playing_style ?? "—"}</span>
                  <span className="text-xs text-gray-400">Style</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 pt-2 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-1">
                  <MapPin size={14} />
                  <span>{club.province}{club.district ? ` · ${club.district}` : ""}</span>
                </div>

                {token && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor: isFollowing ? "#f3f4f6" : "#c8962a",
                      color: isFollowing ? "#374151" : "#fff",
                    }}
                  >
                    <UserCheck size={15} />
                    {isFollowing ? "Following" : "Follow Club"}
                  </button>
                )}

                {isOwner && (
                  <Link
                    href={`/arena/clubs/${club.id}/edit`}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    Edit Club
                  </Link>
                )}

                {token && !isOwner && (
                  <Link
                    href={`/arena/clubs/${club.id}/review`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50"
                  >
                    <Star size={14} />
                    Write Review
                  </Link>
                )}
              </div>
            </div>

            {/* ── Coach Info ── */}
            {club.coach && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  {club.coach.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{club.coach.name}</p>
                  <p className="text-xs text-gray-400">Head Coach / Manager</p>
                </div>
                <Shield size={16} className="text-gray-300 shrink-0" />
              </div>
            )}

            {/* ── Top Players ── */}
            {topPlayers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Trophy size={16} style={{ color: "#c8962a" }} />
                  Top Players
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topPlayers.map((p) => {
                    const score = p.thuto_score ?? null;
                    const color = score
                      ? score >= 75 ? "#16a34a" : score >= 55 ? "#ca8a04" : "#dc2626"
                      : "#9ca3af";
                    const initials = p.name
                      .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <Link
                        key={p.id}
                        href={`/arena/profile/${p.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors no-underline"
                        style={{ textDecoration: "none" }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: "#1a5c2a" }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.position ?? p.sport ?? "Player"}</p>
                          {p.peak_level_label && (
                            <p className="text-xs mt-0.5 font-medium truncate" style={{ color: "#1a5c2a" }}>{p.peak_level_label}</p>
                          )}
                        </div>
                        {score !== null && (
                          <div className="shrink-0 text-right">
                            <div className="text-base font-bold" style={{ color }}>{score.toFixed(0)}</div>
                            <div className="text-xs text-gray-400">THUTO</div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Average Ratings ── */}
            {avgRatings && (avgRatings.avg_overall || avgRatings.avg_training || avgRatings.avg_coach || avgRatings.avg_facilities) ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Zap size={16} style={{ color: "#c8962a" }} />
                  THUTO Ratings Breakdown
                </h2>
                <RatingBar label="Overall"    value={avgRatings.avg_overall} />
                <RatingBar label="Training"   value={avgRatings.avg_training} />
                <RatingBar label="Coach"      value={avgRatings.avg_coach} />
                <RatingBar label="Facilities" value={avgRatings.avg_facilities} />
              </div>
            ) : null}

            {/* ── Reviews ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={16} style={{ color: "#1a5c2a" }} />
                  Player Reviews
                  {reviews.length > 0 && (
                    <span className="text-xs text-gray-400 font-normal">({reviews.length})</span>
                  )}
                </h2>
                {token && !isOwner && (
                  <Link
                    href={`/arena/clubs/${club.id}/review`}
                    className="text-sm font-medium"
                    style={{ color: "#c8962a" }}
                  >
                    + Add Review
                  </Link>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
                  <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No reviews yet</p>
                  <p className="text-xs mt-1">Be the first to share your experience at this club</p>
                  {token && !isOwner && (
                    <Link
                      href={`/arena/clubs/${club.id}/review`}
                      className="mt-3 inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ backgroundColor: "#c8962a" }}
                    >
                      Write a Review
                    </Link>
                  )}
                </div>
              ) : (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
