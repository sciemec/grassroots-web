"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORTS = ["Football", "Rugby", "Netball", "Athletics", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPostingPage() {
  const user   = useAuthStore((s) => s.user);
  const token  = useAuthStore((s) => s.token);
  const router = useRouter();

  // Guard — only coaches
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const store = useAuthStore as unknown as { persist: { hasHydrated(): boolean; onFinishHydration(cb: () => void): () => void } };
    if (store.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = store.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") router.replace("/arena/recruitment");
  }, [hydrated, user, router]);

  // Club list
  const [clubs, setClubs] = useState<{ id: number; name: string }[]>([]);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/arena/clubs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        const raw = j?.data ?? j;
        if (Array.isArray(raw)) setClubs(raw);
      })
      .catch(() => {});
  }, [token, API]);

  // Form state
  const [clubId, setClubId]           = useState("");
  const [sport, setSport]             = useState("");
  const [position, setPosition]       = useState("");
  const [ageMin, setAgeMin]           = useState("15");
  const [ageMax, setAgeMax]           = useState("25");
  const [thutoMin, setThutoMin]       = useState("0");
  const [province, setProvince]       = useState("");
  const [styleOfPlay, setStyleOfPlay] = useState("");
  const [stipend, setStipend]         = useState(false);
  const [description, setDescription] = useState("");
  const [closesAt, setClosesAt]       = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport || !position || !description) {
      setError("Sport, position, and description are required.");
      return;
    }
    if (parseInt(ageMin) > parseInt(ageMax)) {
      setError("Minimum age cannot be greater than maximum age.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        sport,
        position: position.trim(),
        age_min:  parseInt(ageMin),
        age_max:  parseInt(ageMax),
        thuto_min: parseInt(thutoMin) || 0,
        stipend,
        description: description.trim(),
      };
      if (clubId)       body.club_id       = parseInt(clubId);
      if (province)     body.province      = province;
      if (styleOfPlay.trim()) body.style_of_play = styleOfPlay.trim();
      if (closesAt)     body.closes_at     = closesAt;

      const res = await fetch(`${API}/arena/talent-wanted`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.message || (j?.errors ? Object.values(j.errors as Record<string, string[]>).flat().join(". ") : "Failed to create posting.");
        throw new Error(msg);
      }

      setSuccess(true);
      setTimeout(() => router.push("/arena/recruitment"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !user) return null;

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <ArenaNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Posting published!</h2>
          <p className="text-sm text-gray-500">Redirecting to the Talent Board…</p>
        </div>
      </div>
    );
  }

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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Post Talent Wanted</h1>
          <p className="text-sm text-gray-500 mb-6">
            Tell players what you are looking for. Matching players will be notified automatically.
          </p>

          {error && (
            <div className="mb-5 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Club (optional) */}
            {clubs.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Club <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select a club</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sport + Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Sport <span className="text-red-500">*</span>
                </label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Select sport</option>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value.slice(0, 50))}
                  placeholder="e.g. Striker, Centre Back"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            {/* Age Range */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Age Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Min age</span>
                  <input
                    type="number"
                    min={10} max={40}
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 whitespace-nowrap">Max age</span>
                  <input
                    type="number"
                    min={10} max={40}
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>
            </div>

            {/* Province + THUTO */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Province <span className="text-gray-400 font-normal">(leave blank = Nationwide)</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Nationwide</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Min THUTO Score <span className="text-gray-400 font-normal">(0 = any)</span>
                </label>
                <input
                  type="number"
                  min={0} max={100}
                  value={thutoMin}
                  onChange={(e) => setThutoMin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
            </div>

            {/* Style of Play */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Style of Play <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={styleOfPlay}
                onChange={(e) => setStyleOfPlay(e.target.value.slice(0, 200))}
                placeholder="e.g. High pressing, possession-based, quick transitions"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                placeholder="Tell players about the opportunity — what you're offering, training schedule, what you expect, and how to stand out."
                rows={5}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{description.length}/2000</p>
            </div>

            {/* Closing date + Stipend */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Closing Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Stipend / Pay</label>
                <button
                  type="button"
                  onClick={() => setStipend(!stipend)}
                  className="w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: stipend ? "#fef3c7" : "white",
                    borderColor: stipend ? "#d97706" : "#e5e7eb",
                    color: stipend ? "#92400e" : "#374151",
                  }}
                >
                  <span>{stipend ? "Stipend available" : "No stipend"}</span>
                  <div
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ backgroundColor: stipend ? "#d97706" : "#d1d5db" }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ transform: stipend ? "translateX(22px)" : "translateX(2px)" }}
                    />
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/arena/recruitment"
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {submitting ? "Publishing…" : "Publish Posting"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
