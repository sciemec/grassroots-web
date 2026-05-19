"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft, Star, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

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

// ─── StarPicker ───────────────────────────────────────────────────────────────

function StarPicker({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={(hover || value) >= n ? "fill-current" : ""}
              style={{ color: (hover || value) >= n ? "#c8962a" : "#d1d5db" }}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm font-semibold" style={{ color: "#c8962a" }}>
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClubReviewPage() {
  const params  = useParams();
  const clubId  = params?.id as string;
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);

  const [clubName, setClubName]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const [ratings, setRatings] = useState({
    overall: 0,
    training: 0,
    coach: 0,
    facilities: 0,
  });
  const [comment, setComment] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Load club name for display
  useEffect(() => {
    if (!clubId) return;
    fetch(`${API}/arena/clubs/${clubId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((json) => { if (json.club?.name) setClubName(json.club.name); })
      .catch(() => {});
  }, [clubId, token]);

  const allRated = ratings.overall > 0 && ratings.training > 0 && ratings.coach > 0 && ratings.facilities > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRated) { setError("Please rate all 4 categories."); return; }
    if (!token)    { setError("You must be signed in to leave a review."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/clubs/${clubId}/review`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          rating_overall:    ratings.overall,
          rating_training:   ratings.training,
          rating_coach:      ratings.coach,
          rating_facilities: ratings.facilities,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to submit review.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center text-gray-500">
          <p className="font-medium">You need to be signed in to leave a review.</p>
          <Link href="/login" className="mt-4 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#1a5c2a" }}>
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#dcfce7" }}
          >
            <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Thank you for helping the community. Your review helps players make better decisions.
          </p>
          <Link
            href={`/arena/clubs/${clubId}`}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white inline-block"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Back to Club
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <Link
          href={`/arena/clubs/${clubId}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} />
          {clubName ? `Back to ${clubName}` : "Back to Club"}
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Write a Review</h1>
            {clubName && (
              <p className="text-sm text-gray-500 mt-1">Reviewing <strong>{clubName}</strong></p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Reviews are anonymous — your name will not be shown.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ratings */}
            <div className="space-y-5">
              <StarPicker
                label="Overall Experience"
                value={ratings.overall}
                onChange={(v) => setRatings((r) => ({ ...r, overall: v }))}
              />
              <StarPicker
                label="Training Quality"
                value={ratings.training}
                onChange={(v) => setRatings((r) => ({ ...r, training: v }))}
              />
              <StarPicker
                label="Coaching Staff"
                value={ratings.coach}
                onChange={(v) => setRatings((r) => ({ ...r, coach: v }))}
              />
              <StarPicker
                label="Facilities & Pitch"
                value={ratings.facilities}
                onChange={(v) => setRatings((r) => ({ ...r, facilities: v }))}
              />
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Comment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="Share your experience — what made this club great or what could improve?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{comment.length}/200</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !allRated}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: allRated ? "#1a5c2a" : "#9ca3af" }}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
