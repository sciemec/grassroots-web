"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Star, Users, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface ClubDetail {
  id: string;
  name: string;
  sport: string;
  province: string;
  tier: string;
  formation?: string;
  playing_style?: string;
  description?: string;
  member_count: number;
  is_member: boolean;
  open_for_trials: boolean;
  scouting_open: boolean;
  created_by: string;
}

interface Review {
  id: string;
  reviewer: { name: string; role: string };
  rating: number;
  body: string;
  created_at: string;
}

interface TopPlayer {
  id: string;
  name: string;
  position: string;
  sport: string;
  thuto_score?: number;
}

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <button key={s} onClick={() => onChange?.(s)} className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star size={16} fill={s <= rating ? "#f59e0b" : "none"} className={s <= rating ? "text-amber-400" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

export default function ClubDetailPage() {
  const { id = '' } = useParams<{ id: string }>() ?? {};
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [club,       setClub]       = useState<ClubDetail | null>(null);
  const [reviews,    setReviews]    = useState<Review[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [joining,    setJoining]    = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating,     setRating]     = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    Promise.allSettled([
      fetch(`${API}/arena/clubs/${id}`,         { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/arena/clubs/${id}/reviews`,  { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/arena/clubs/${id}/players`,  { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([clubRes, revRes, playersRes]) => {
      if (clubRes.status === "fulfilled" && clubRes.value.ok) {
        const json = await clubRes.value.json();
        setClub(json.data ?? json);
      }
      if (revRes.status === "fulfilled" && revRes.value.ok) {
        const json = await revRes.value.json();
        setReviews(safeArray(json.data ?? json));
      }
      if (playersRes.status === "fulfilled" && playersRes.value.ok) {
        const json = await playersRes.value.json();
        setTopPlayers(safeArray(json.data ?? json));
      }
    }).finally(() => setLoading(false));
  }, [token, id]);

  const toggleJoin = async () => {
    if (!token || !club) return;
    setJoining(true);
    try {
      if (club.is_member) {
        await fetch(`${API}/arena/clubs/${id}/leave`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setClub({ ...club, is_member: false, member_count: club.member_count - 1 });
      } else {
        await fetch(`${API}/arena/clubs/${id}/join`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        setClub({ ...club, is_member: true, member_count: club.member_count + 1 });
      }
    } catch {}
    setJoining(false);
  };

  const submitReview = async () => {
    if (!token || !reviewBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating, body: reviewBody }),
      });
      if (res.ok) {
        const json = await res.json();
        setReviews((r) => [json.data ?? json, ...r]);
        setShowReview(false);
        setReviewBody("");
        setRating(5);
      }
    } catch {}
    setSubmitting(false);
  };

  if (!hasHydrated || !user) return null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Club not found. <Link href="/arena/clubs" className="font-medium" style={{ color: GRS_GREEN }}>Back to clubs</Link>
        </div>
      </div>
    );
  }

  const initials = club.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/arena/clubs" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <span className="font-semibold text-sm text-gray-900">{club.name}</span>
          <div className="ml-auto hidden md:flex items-center gap-1 text-sm">
            {[
              { href: "/arena", label: "Feed" },
              { href: "/arena/network", label: "Network" },
              { href: "/arena/clubs", label: "Clubs" },
              { href: "/arena/recruitment", label: "Talent Board" },
              { href: "/arena/messages", label: "Messages" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="px-3 py-1 rounded-full text-gray-600 hover:bg-gray-100 font-medium"
                style={href === "/arena/clubs" ? { background: GRS_GREEN, color: "#fff" } : {}}>{label}</Link>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Club header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{club.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
                <span className="capitalize">{club.sport}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{club.province}</span>
                <span>{club.tier}</span>
                {avgRating && <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" fill="#fbbf24" />{avgRating}</span>}
              </div>
              {club.description && <p className="text-sm text-gray-600 mt-2">{club.description}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {club.open_for_trials && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: GRS_GREEN }}>Open for trials</span>}
                {club.scouting_open   && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Scouting open</span>}
                {club.formation       && <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-50">{club.formation}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={15} />
              <span>{club.member_count} members</span>
            </div>
            <button onClick={toggleJoin} disabled={joining}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors disabled:opacity-50"
              style={club.is_member
                ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: GRS_GREEN }
                : { borderColor: GRS_GREEN, color: GRS_GREEN }}>
              {joining ? "..." : club.is_member ? "Joined" : "Join Club"}
            </button>
          </div>
        </div>

        {/* Top Players */}
        {topPlayers.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Top Players</h2>
            <div className="grid grid-cols-2 gap-3">
              {topPlayers.slice(0, 6).map((p) => {
                const pi = p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                const score = p.thuto_score ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{pi}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.position}</p>
                    </div>
                    {score > 0 && (
                      <span className="ml-auto text-xs font-bold flex-shrink-0"
                        style={{ color: score >= 75 ? GRS_GREEN : score >= 55 ? "#d97706" : "#dc2626" }}>
                        {score}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-900">Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>
            <button onClick={() => setShowReview((v) => !v)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
              Write review
            </button>
          </div>

          {showReview && (
            <div className="p-3 rounded-xl bg-gray-50 space-y-3">
              <StarRating rating={rating} onChange={setRating} />
              <textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Share your experience with this club..."
                rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={submitReview} disabled={submitting || !reviewBody.trim()}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: GRS_GREEN }}>
                  {submitting ? "Posting..." : "Post Review"}
                </button>
                <button onClick={() => setShowReview(false)} className="px-4 py-2 rounded-full text-xs border border-gray-200 text-gray-600">Cancel</button>
              </div>
            </div>
          )}

          {reviews.length === 0 && !showReview && (
            <p className="text-sm text-gray-400 text-center py-4">No reviews yet. Be the first.</p>
          )}

          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">{r.reviewer.name}</p>
                  <StarRating rating={r.rating} />
                </div>
                <p className="text-xs text-gray-600 mt-1">{r.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back link */}
        <Link href="/arena/clubs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> All Clubs
        </Link>
      </div>
    </div>
  );
}
