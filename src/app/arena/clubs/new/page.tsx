"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MapPin, ChevronLeft, Check, Users, Zap } from "lucide-react";
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

// ─── Constants ─────────────────────────────────────────────────────────────────

const SPORTS = ["Football", "Rugby", "Netball", "Athletics", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];
const TIERS = ["Premier League", "Division 1", "Division 2", "Regional", "School", "Community"];
const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1", "Other"];
const PLAYING_STYLES = ["Possession", "Counter-attack", "High Press", "Direct Play", "Wing Play", "Mixed"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewClubPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName]               = useState("");
  const [sport, setSport]             = useState("");
  const [province, setProvince]       = useState("");
  const [district, setDistrict]       = useState("");
  const [tier, setTier]               = useState("");
  const [formation, setFormation]     = useState("");
  const [playingStyle, setPlayingStyle] = useState("");
  const [bio, setBio]                 = useState("");
  const [isScouting, setIsScouting]   = useState(false);
  const [isOpenTrials, setIsOpenTrials] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Redirect non-coaches
  if (user && user.role !== "coach" && user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Coaches Only</h1>
          <p className="text-gray-500 text-sm mb-6">Only coaches can register clubs on The Arena.</p>
          <Link
            href="/arena/clubs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Browse Clubs
          </Link>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Sign in to register your club.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#c8962a" }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Club name is required."); return; }
    if (!sport)       { setError("Please select a sport."); return; }
    if (!province)    { setError("Please select a province."); return; }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/arena/clubs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          sport,
          province,
          district: district.trim() || null,
          tier:     tier || null,
          formation: formation || null,
          playing_style: playingStyle || null,
          bio: bio.trim() || null,
          is_scouting: isScouting,
          is_open_trials: isOpenTrials,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `Error ${res.status}`);
      }

      const json = await res.json();
      setSuccess(true);

      // Navigate to the new club's detail page after a brief pause
      const clubId = json.club?.id ?? json.id;
      setTimeout(() => {
        if (clubId) {
          router.push(`/arena/clubs/${clubId}`);
        } else {
          router.push("/arena/clubs");
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register club. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            <Check size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Club Registered!</h2>
          <p className="text-gray-500 text-sm">Taking you to your club page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/arena/clubs" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Register Your Club</h1>
            <p className="text-sm text-gray-500 mt-0.5">Add your club to The Arena directory</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Club Identity */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 size={15} style={{ color: "#1a5c2a" }} />
              Club Identity
            </h2>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Club Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Harare City FC"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                maxLength={100}
              />
            </div>

            {/* Sport */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Sport *</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={
                      sport === s
                        ? { backgroundColor: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                        : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">About the Club</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell players and scouts about your club — history, ambitions, culture..."
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin size={15} style={{ color: "#1a5c2a" }} />
              Location
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Province *</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">District / Town</label>
                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Chitungwiza"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  maxLength={80}
                />
              </div>
            </div>
          </div>

          {/* Club Profile */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Trophy size={15} style={{ color: "#1a5c2a" }} />
              Club Profile
            </h2>

            {/* Tier */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">League Tier</label>
              <div className="flex flex-wrap gap-2">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(tier === t ? "" : t)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={
                      tier === t
                        ? { backgroundColor: "#c8962a", color: "#fff", borderColor: "#c8962a" }
                        : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Formation */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Preferred Formation</label>
              <div className="flex flex-wrap gap-2">
                {FORMATIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormation(formation === f ? "" : f)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={
                      formation === f
                        ? { backgroundColor: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                        : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Playing Style */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Playing Style</label>
              <div className="flex flex-wrap gap-2">
                {PLAYING_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPlayingStyle(playingStyle === s ? "" : s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={
                      playingStyle === s
                        ? { backgroundColor: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                        : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recruitment Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users size={15} style={{ color: "#1a5c2a" }} />
              Recruitment Settings
            </h2>
            <p className="text-xs text-gray-400">These settings help players and scouts find you.</p>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={isScouting}
                  onChange={(e) => setIsScouting(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                  style={isScouting
                    ? { backgroundColor: "#1a5c2a", borderColor: "#1a5c2a" }
                    : { backgroundColor: "#fff", borderColor: "#d1d5db" }
                  }
                >
                  {isScouting && <Check size={12} className="text-white" />}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-800">Actively Scouting Players</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  We are actively looking for new talent to join our squad.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={isOpenTrials}
                  onChange={(e) => setIsOpenTrials(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                  style={isOpenTrials
                    ? { backgroundColor: "#c8962a", borderColor: "#c8962a" }
                    : { backgroundColor: "#fff", borderColor: "#d1d5db" }
                  }
                >
                  {isOpenTrials && <Check size={12} className="text-white" />}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-800">Open Trials Available</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Players can show up to our open trials sessions.
                </p>
              </div>
            </label>
          </div>

          {/* THUTO info */}
          <div
            className="rounded-2xl border p-4 flex items-start gap-3"
            style={{ backgroundColor: "#ede9fe", borderColor: "#c4b5fd" }}
          >
            <Zap size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#7c3aed" }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "#5b21b6" }}>THUTO Score</p>
              <p className="text-xs mt-0.5" style={{ color: "#6d28d9" }}>
                Your club will receive a THUTO score once players join and start logging training sessions.
                Higher scores attract more talented players.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <Link
              href="/arena/clubs"
              className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 text-center hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#c8962a" }}
            >
              {submitting ? "Registering..." : "Register Club"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
