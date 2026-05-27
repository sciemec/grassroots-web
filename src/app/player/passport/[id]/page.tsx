"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin, Star, Shield, Share2, Bookmark, Send,
  Play, Image as ImageIcon, ChevronDown, ChevronUp,
  X, CheckCircle, AlertCircle, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PassportData {
  user: {
    id: string;
    name: string;
    sport: string;
    province: string;
    avatar_url: string | null;
  };
  profile: {
    position_primary: string;
    bio: string | null;
    age_group: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    dominant_foot: string | null;
    club: string | null;
    school: string | null;
    open_for_scouting: boolean;
  };
  prediction: {
    projected_score: number;
    peak_level_label: string;
    upside_rating: number;
    upside_label: string;
    comparable_name: string | null;
    percentile: number;
    data_quality: string;
    narrative: string | null;
  } | null;
  thuto_dimensions: {
    pace: number;
    technique: number;
    tactical: number;
    mental: number;
    physical: number;
    leadership: number;
  } | null;
  media: MediaItem[];
  badges: Badge[];
  scout_views_7d: number;
  verified: boolean;
}

interface MediaItem {
  id: string;
  media_type: "video" | "image";
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  media_category: string;
  display_order: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ─── Representation Request Modal ─────────────────────────────────────────────

interface EnquiryModalProps {
  playerId: string;
  playerName: string;
  onClose: () => void;
}

function EnquiryModal({ playerId, playerName, onClose }: EnquiryModalProps) {
  const [form, setForm] = useState({
    scout_name: "",
    scout_email: "",
    organisation: "",
    request_type: "scouting",
    message: "",
    professional_status: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const submit = async () => {
    if (!form.scout_name || !form.scout_email || !form.message) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/representation-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, player_id: playerId }),
      });
      if (!res.ok) throw new Error("Failed to send enquiry.");
      setDone(true);
    } catch {
      setError("Could not send your enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {done ? "Enquiry Sent" : `Enquire About ${playerName}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center space-y-3">
            <CheckCircle size={48} className="mx-auto text-green-500" />
            <p className="font-semibold text-gray-900">Enquiry received</p>
            <p className="text-sm text-gray-500">
              Grassroots Sports will review your enquiry and follow up within 48 hours.
              The player will also be notified of your interest.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Grassroots Sports facilitates all enquiries. Player contact details are never shared directly.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Your Name *</label>
                <input
                  value={form.scout_name}
                  onChange={(e) => setForm({ ...form, scout_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email *</label>
                <input
                  type="email"
                  value={form.scout_email}
                  onChange={(e) => setForm({ ...form, scout_email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="you@club.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Organisation</label>
              <input
                value={form.organisation}
                onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Club, academy, or agency name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Enquiry Type</label>
              <select
                value={form.request_type}
                onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="scouting">Scouting Interest</option>
                <option value="trial">Trial Invitation</option>
                <option value="scholarship">Scholarship Opportunity</option>
                <option value="transfer">Transfer Enquiry</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none"
                placeholder="Describe your interest and what you can offer..."
              />
              <div className="text-right text-xs text-gray-400">{form.message.length}/500</div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.professional_status}
                onChange={(e) => setForm({ ...form, professional_status: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-gray-600">
                I confirm I am a licensed scout, coach, or registered sports professional
              </span>
            </label>

            <button
              onClick={submit}
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#c8962a" }}
            >
              {submitting ? "Sending..." : "Send Enquiry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dimension Bar ─────────────────────────────────────────────────────────────

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? "#1a5c2a" : pct >= 50 ? "#c8962a" : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{Math.round(pct)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#1a5c2a" : score >= 55 ? "#c8962a" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>{Math.round(score)}</text>
        <text x="50" y="61" textAnchor="middle" fontSize="9" fill="#6b7280">/100</text>
      </svg>
      <span className="text-xs font-semibold text-gray-600 -mt-1">{label}</span>
    </div>
  );
}

// ─── Media Grid ───────────────────────────────────────────────────────────────

function MediaGrid({ items }: { items: MediaItem[] }) {
  const [active, setActive] = useState<MediaItem | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item)}
            className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group"
          >
            {item.thumbnail_url ? (
              <img
                src={item.thumbnail_url}
                alt={item.caption ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                {item.media_type === "video" ? (
                  <Play size={20} className="text-gray-400" />
                ) : (
                  <ImageIcon size={20} className="text-gray-400" />
                )}
              </div>
            )}
            {item.media_type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={16} className="text-gray-800 ml-0.5" />
                </div>
              </div>
            )}
            {item.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setActive(null)}
          >
            <X size={28} />
          </button>
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {active.media_type === "video" ? (
              <video src={active.url} controls autoPlay className="w-full rounded-xl max-h-[70vh]" />
            ) : (
              <img src={active.url} alt={active.caption ?? ""} className="w-full rounded-xl object-contain max-h-[70vh]" />
            )}
            {active.caption && (
              <p className="text-white/80 text-sm text-center mt-3">{active.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerPassportPublicPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [shared, setShared] = useState(false);
  const [showFullNarrative, setShowFullNarrative] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Watchlist persists in localStorage (no auth needed for fans/scouts browsing)
  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem("gs_watchlist") ?? "[]");
    setWatchlisted(wl.includes(id));
  }, [id]);

  const toggleWatchlist = () => {
    const wl: string[] = JSON.parse(localStorage.getItem("gs_watchlist") ?? "[]");
    let next: string[];
    if (watchlisted) {
      next = wl.filter((x) => x !== id);
    } else {
      next = [...wl, id];
    }
    localStorage.setItem("gs_watchlist", JSON.stringify(next));
    setWatchlisted(!watchlisted);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data?.user.name ?? "Player"} — Grassroots Sports Passport`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/player/passport/${id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const json = await res.json();
      setData(json);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [API, id]);

  useEffect(() => { load(); }, [load]);

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }} className="flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-lg px-4">
          <div className="h-24 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (notFound || !data) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }} className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Shield size={28} className="text-gray-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Passport not found</h1>
        <p className="text-sm text-gray-500">This player profile is not publicly available.</p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          Back to Grassroots Sports
        </Link>
      </div>
    );
  }

  const { user, profile, prediction, thuto_dimensions, media, badges, scout_views_7d, verified } = data;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const upsideStars = prediction?.upside_rating ?? 0;

  const DIMENSIONS = thuto_dimensions
    ? [
        { label: "Pace", value: thuto_dimensions.pace },
        { label: "Technique", value: thuto_dimensions.technique },
        { label: "Tactical", value: thuto_dimensions.tactical },
        { label: "Mental", value: thuto_dimensions.mental },
        { label: "Physical", value: thuto_dimensions.physical },
        { label: "Leadership", value: thuto_dimensions.leadership },
      ]
    : [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Top stripe */}
      <div style={{ backgroundColor: "#1a5c2a" }} className="h-1.5 w-full" />

      {/* Nav */}
      <nav className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            G
          </div>
          <span className="font-bold text-gray-800 text-sm">Grassroots Sports</span>
        </Link>
        <Link
          href="/register/who"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ backgroundColor: "#c8962a" }}
        >
          Join Platform
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Identity Card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Green banner */}
          <div style={{ backgroundColor: "#1a5c2a" }} className="h-20" />

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="-mt-10 mb-3 flex items-end justify-between">
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    {initials}
                  </div>
                )}
                {verified && (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    <Shield size={12} className="text-white" />
                  </div>
                )}
              </div>

              {/* THUTO score ring */}
              {prediction && (
                <ScoreRing score={prediction.projected_score} label="THUTO Score" />
              )}
            </div>

            {/* Name + tags */}
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{profile.position_primary || "Player"}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {user.sport}
              </span>
              {user.province && (
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  <MapPin size={10} /> {user.province}
                </span>
              )}
              {profile.age_group && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {profile.age_group}
                </span>
              )}
              {profile.dominant_foot && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {profile.dominant_foot} foot
                </span>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              {profile.height_cm && (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900">{profile.height_cm}cm</p>
                  <p className="text-xs text-gray-400">Height</p>
                </div>
              )}
              {profile.club && (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 truncate">{profile.club}</p>
                  <p className="text-xs text-gray-400">Club</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: "#1a5c2a" }}>{scout_views_7d}</p>
                <p className="text-xs text-gray-400">Scout Views</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* ── Scout Engagement Bar ── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={toggleWatchlist}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-colors ${
              watchlisted
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Bookmark size={18} className={watchlisted ? "fill-amber-500 text-amber-500" : ""} />
            {watchlisted ? "Watchlisted" : "Watchlist"}
          </button>

          <button
            onClick={() => setShowEnquiry(true)}
            className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold text-white"
            style={{ backgroundColor: "#c8962a" }}
          >
            <Send size={18} />
            Send Enquiry
          </button>

          <button
            onClick={share}
            className="flex flex-col items-center gap-1 py-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Share2 size={18} />
            {shared ? "Copied!" : "Share"}
          </button>
        </div>

        {/* ── THUTO Intelligence ── */}
        {prediction && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: "#c8962a" }} />
              <h2 className="font-bold text-gray-900">THUTO Intelligence</h2>
            </div>

            {/* Prediction summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Peak Level</p>
                <p className="text-sm font-bold text-gray-900">{prediction.peak_level_label}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Upside</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < upsideStars ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">{prediction.upside_label}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Percentile</p>
                <p className="text-sm font-bold" style={{ color: "#1a5c2a" }}>Top {100 - prediction.percentile}%</p>
              </div>
              {prediction.comparable_name && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Plays Like</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{prediction.comparable_name}</p>
                </div>
              )}
            </div>

            {/* Narrative */}
            {prediction.narrative && (
              <div>
                <p className={`text-sm text-gray-600 leading-relaxed ${!showFullNarrative ? "line-clamp-3" : ""}`}>
                  {prediction.narrative}
                </p>
                <button
                  onClick={() => setShowFullNarrative(!showFullNarrative)}
                  className="flex items-center gap-1 text-xs font-medium mt-1"
                  style={{ color: "#1a5c2a" }}
                >
                  {showFullNarrative ? (
                    <><ChevronUp size={14} /> Show less</>
                  ) : (
                    <><ChevronDown size={14} /> Read full analysis</>
                  )}
                </button>
              </div>
            )}

            {/* Dimensions */}
            {DIMENSIONS.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skill Dimensions</p>
                {DIMENSIONS.map((d) => (
                  <DimensionBar key={d.label} label={d.label} value={d.value} />
                ))}
              </div>
            )}

            {prediction.data_quality === "low" && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Limited session data — scores will improve as the player logs more training.
              </p>
            )}
          </div>
        )}

        {/* ── Media Showcase ── */}
        {media.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-900">Media Showcase</h2>
            <MediaGrid items={media} />
          </div>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-bold text-gray-900">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800"
                >
                  <span>{b.icon}</span>
                  {b.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA for unregistered visitors ── */}
        <div
          className="rounded-2xl p-5 text-center space-y-3"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          <p className="text-white font-bold text-lg">Are you a player?</p>
          <p className="text-white/70 text-sm">
            Build your own AI-powered passport and get discovered by scouts across Zimbabwe.
          </p>
          <Link
            href="/register/who"
            className="inline-block px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#c8962a", color: "#fff" }}
          >
            Create Your Passport Free
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Grassroots Sports · Zimbabwe&apos;s First AI-Powered Talent Network ·{" "}
          <Link href="/" className="underline">grassrootssports.live</Link>
        </p>
      </div>

      {/* Enquiry modal */}
      {showEnquiry && (
        <EnquiryModal
          playerId={user.id}
          playerName={user.name}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}
