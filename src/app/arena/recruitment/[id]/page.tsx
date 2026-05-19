"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft, MapPin, Users, Clock, Zap, Briefcase,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TalentPosting {
  id: number;
  sport: string;
  position: string;
  age_min: number;
  age_max: number;
  thuto_min: number;
  province: string | null;
  style_of_play: string | null;
  stipend: boolean;
  description: string;
  status: "open" | "closed";
  closes_at: string | null;
  created_at: string;
  applications_count: number;
  poster: { id: number; name: string } | null;
  club: { id: number; name: string } | null;
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
          <Link href="/arena/recruitment" className="font-semibold" style={{ color: "#1a5c2a" }}>Talent Board</Link>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostingDetailPage() {
  const params  = useParams();
  const id      = params?.id as string;
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);

  const [posting, setPosting]     = useState<TalentPosting | null>(null);
  const [applied, setApplied]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Apply modal state
  const [showModal, setShowModal]   = useState(false);
  const [message, setMessage]       = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted]   = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!id) return;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API}/arena/talent-wanted/${id}`, { headers })
      .then((r) => r.json())
      .then((json) => {
        setPosting(json.posting ?? null);
        setApplied(json.applied ?? false);
      })
      .catch(() => setError("Failed to load posting."))
      .finally(() => setLoading(false));
  }, [id, API, token]);

  const handleApply = async () => {
    if (!message.trim()) { setSubmitError("Please write a message to the club."); return; }
    if (!token) { setSubmitError("You must be signed in to apply."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API}/arena/talent-wanted/${id}/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), availability: availability.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Failed to submit application.");
      }
      setSubmitted(true);
      setApplied(true);
      setShowModal(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !posting) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-500">
          <p>{error || "Posting not found."}</p>
          <Link href="/arena/recruitment" className="mt-4 inline-block text-sm text-green-700 underline">
            Back to Talent Board
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = posting.closes_at
    ? Math.max(0, Math.ceil((new Date(posting.closes_at).getTime() - Date.now()) / 86400000))
    : null;

  const isCoach  = user?.role === "coach";
  const isPlayer = user?.role === "player";
  const isClosed = posting.status === "closed" || (daysLeft !== null && daysLeft === 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Back */}
        <Link
          href="/arena/recruitment"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} />
          Talent Board
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
              {posting.sport}
            </span>
            {posting.stipend && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                Stipend Available
              </span>
            )}
            {posting.thuto_min > 0 && (
              <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}>
                <Zap size={10} />
                THUTO {posting.thuto_min}+
              </span>
            )}
            {isClosed && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                Closed
              </span>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{posting.position}</h1>
            {posting.club && <p className="text-gray-600 mt-0.5">{posting.club.name}</p>}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">Location</div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                <MapPin size={13} />
                {posting.province ?? "Nationwide"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">Age Range</div>
              <div className="text-sm font-semibold text-gray-900">
                {posting.age_min} – {posting.age_max} years
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">Applications</div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                <Users size={13} />
                {posting.applications_count} applied
              </div>
            </div>
            {daysLeft !== null && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-0.5">Deadline</div>
                <div className={`text-sm font-semibold flex items-center gap-1 ${daysLeft <= 3 ? "text-red-600" : "text-gray-900"}`}>
                  <Clock size={13} />
                  {daysLeft === 0 ? "Closes today" : `${daysLeft} days left`}
                </div>
              </div>
            )}
          </div>

          {/* Style of play */}
          {posting.style_of_play && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Style of Play</h2>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{posting.style_of_play}</p>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">About this Opportunity</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{posting.description}</p>
          </div>

          {/* Posted by */}
          {posting.poster && (
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Posted by {posting.poster.name}
            </p>
          )}
        </div>

        {/* CTA */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">Application submitted! The club will review it soon.</p>
          </div>
        )}

        {isPlayer && !applied && !isClosed && !submitted && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: "#c8962a" }}
          >
            Apply Now
          </button>
        )}

        {isPlayer && applied && !submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">You have already applied to this posting.</p>
          </div>
        )}

        {isCoach && (
          <Link
            href={`/coach/recruitment?posting=${posting.id}`}
            className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            View Applications ({posting.applications_count})
          </Link>
        )}

        {!user && (
          <Link
            href="/login"
            className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: "#c8962a" }}
          >
            Sign in to Apply
          </Link>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Apply for {posting.position}</h2>
            {posting.club && <p className="text-sm text-gray-500 -mt-2">{posting.club.name}</p>}

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Message to the club <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="Tell the club about yourself — your experience, why you're a great fit, and what you bring to the team."
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{message.length}/1000</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Availability <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value.slice(0, 200))}
                placeholder="e.g. Available from June, weekends only, immediate start"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle size={15} />
                {submitError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setSubmitError(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={submitting || !message.trim()}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: "#c8962a" }}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
