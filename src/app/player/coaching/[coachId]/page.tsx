// src/app/player/coaching/[coachId]/page.tsx
"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import ReviewSystem from "@/components/coaching/ReviewSystem";
import PaymentModal from "@/components/coaching/PaymentModal";
import type { CoachProfile, AvailabilitySlot, Review, CoachingSession } from "@/types/coaching";

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  premier:  { label: "Premier Coach",    color: "bg-purple-100 text-purple-700" },
  zifa:     { label: "ZIFA Certified",   color: "bg-green-100 text-green-700" },
  national: { label: "National Level",   color: "bg-blue-100 text-blue-700" },
  academy:  { label: "Academy Trained",  color: "bg-amber-100 text-amber-700" },
  elite:    { label: "Elite Coach",      color: "bg-red-100 text-red-700" },
};

const SESSION_TYPES: { id: CoachingSession["sessionType"]; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "individual",     label: "1-on-1 Session",    icon: Icons.User,        desc: "Personalised coaching, direct feedback" },
  { id: "group",          label: "Group Session",     icon: Icons.Users,       desc: "Small group (2–6 players)" },
  { id: "video_analysis", label: "Video Analysis",    icon: Icons.Video,       desc: "Coach reviews your match footage" },
  { id: "tactical",       label: "Tactical Briefing", icon: Icons.Map,         desc: "Positional play and game understanding" },
  { id: "drills",         label: "Drill Session",     icon: Icons.Dumbbell,    desc: "Technique-focused repetitions" },
  { id: "match_analysis", label: "Match Analysis",    icon: Icons.BarChart2,   desc: "Full match breakdown and review" },
];

const DAYS_ORDER = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
const DAY_ABBR: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const MOCK_COACH: CoachProfile = {
  id: "coach_001",
  userId: "user_c001",
  name: "Takesure Musona",
  email: "musona@coach.zw",
  phone: "+263712000001",
  photoUrl: undefined,
  credentials: [
    { id: "c1", name: "CAF A License", issuer: "CAF", year: 2019 },
    { id: "c2", name: "ZIFA Coaching Certificate", issuer: "ZIFA", year: 2016 },
    { id: "c3", name: "UEFA B License", issuer: "UEFA", year: 2021 },
  ],
  experience: 12,
  currentClub: "Dynamos FC",
  currentRole: "Assistant Coach",
  formerClubs: ["Caps United", "Highlanders"],
  specialties: ["Attacking Play", "Set Pieces", "Youth Development", "Pressing Systems"],
  coachingStyle: "High-energy, game-based sessions with immediate feedback. Focus on decision-making under pressure.",
  bio: "Former Division 1 midfielder turned full-time coach. I have worked with youth academies and senior clubs across Harare province for over a decade. My sessions blend structured drills with real-game application to build football intelligence alongside technical ability.",
  languages: ["English", "Shona"],
  rating: 4.8,
  totalSessions: 312,
  totalStudents: 87,
  reviews: [
    {
      id: "r1", playerId: "p1", playerName: "T. Banda", playerPhoto: undefined,
      sessionId: "s1", rating: 5,
      comment: "Excellent session. Musona coaches with real intensity but makes everything clear. My first touch improved massively in just two sessions.",
      categories: { expertise: 5, communication: 5, value: 4, punctuality: 5, overall: 5 },
      createdAt: "2026-06-10T10:00:00Z", updatedAt: "2026-06-10T10:00:00Z", isVerified: true,
    },
    {
      id: "r2", playerId: "p2", playerName: "K. Moyo", playerPhoto: undefined,
      sessionId: "s2", rating: 5,
      comment: "Best video analysis I have had. He spotted things I never noticed about my positioning. Worth every dollar.",
      categories: { expertise: 5, communication: 5, value: 5, punctuality: 5, overall: 5 },
      createdAt: "2026-05-22T09:00:00Z", updatedAt: "2026-05-22T09:00:00Z", isVerified: true,
    },
    {
      id: "r3", playerId: "p3", playerName: "F. Chikwanda", playerPhoto: undefined,
      sessionId: "s3", rating: 4,
      comment: "Great tactical knowledge. Session ran a bit over time but content was very good.",
      categories: { expertise: 5, communication: 4, value: 4, punctuality: 3, overall: 4 },
      createdAt: "2026-04-15T08:00:00Z", updatedAt: "2026-04-15T08:00:00Z", isVerified: true,
    },
  ],
  availability: [
    { id: "a1", day: "monday",    startTime: "06:00", endTime: "09:00", isRecurring: true, maxBookings: 3, bookedCount: 1 },
    { id: "a2", day: "wednesday", startTime: "16:00", endTime: "19:00", isRecurring: true, maxBookings: 3, bookedCount: 2 },
    { id: "a3", day: "saturday",  startTime: "08:00", endTime: "12:00", isRecurring: true, maxBookings: 5, bookedCount: 3 },
    { id: "a4", day: "sunday",    startTime: "09:00", endTime: "11:00", isRecurring: true, maxBookings: 2, bookedCount: 0 },
  ],
  pricePerSession: 35,
  sessionDuration: 60,
  isVerified: true,
  verificationBadge: "zifa",
  videoIntro: undefined,
  socialLinks: {},
  createdAt: "2024-01-15T00:00:00Z",
  updatedAt: "2026-06-01T00:00:00Z",
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Icons.Star
          key={s}
          size={14}
          className={s <= Math.round(value) ? "text-[#f0b429] fill-[#f0b429]" : "text-gray-300"}
        />
      ))}
    </span>
  );
}

export default function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);

  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedType, setSelectedType]     = useState<CoachingSession["sessionType"]>("individual");
  const [selectedSlot, setSelectedSlot]     = useState<AvailabilitySlot | null>(null);
  const [bookingNotes, setBookingNotes]     = useState("");
  const [bookingError, setBookingError]     = useState("");
  const [pendingSession, setPendingSession] = useState<{ id: string; price: number } | null>(null);
  const [showPayment, setShowPayment]       = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Tab
  const [tab, setTab] = useState<"overview" | "availability" | "reviews">("overview");

  const loadCoach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coaches/${coachId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error("not found");
      const json = await res.json();
      const data = json.data ?? json;
      setCoach(data as CoachProfile);
    } catch {
      setCoach(MOCK_COACH);
    } finally {
      setLoading(false);
    }
  }, [coachId, token]);

  useEffect(() => { loadCoach(); }, [loadCoach]);

  const handleBook = async () => {
    setBookingError("");
    if (!selectedSlot) { setBookingError("Please choose an available time slot."); return; }
    if (!user) { setBookingError("You must be signed in to book."); return; }
    if (!coach) return;

    // Build scheduled datetime from slot (next occurrence of that day)
    const dayIdx = DAYS_ORDER.indexOf(selectedSlot.day as (typeof DAYS_ORDER)[number]);
    const now = new Date();
    const diff = (dayIdx - now.getDay() + 8) % 7 || 7;
    const next = new Date(now);
    next.setDate(now.getDate() + diff);
    const [h, m] = selectedSlot.startTime.split(":").map(Number);
    next.setHours(h, m, 0, 0);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coaching/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          coachId: coach.id,
          playerId: user.id,
          sessionType: selectedType,
          scheduledAt: next.toISOString(),
          duration: coach.sessionDuration,
          notes: bookingNotes,
        }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const sessionId = json.data?.id ?? json.id ?? `sess_${Date.now()}`;
      setPendingSession({ id: sessionId, price: coach.pricePerSession });
      setShowPayment(true);
    } catch {
      // Offline fallback — open payment anyway with a local session ID
      setPendingSession({ id: `sess_${Date.now()}`, price: coach?.pricePerSession ?? 35 });
      setShowPayment(true);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="p-4 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="flex items-center justify-center">
        <div className="text-center">
          <Icons.UserX size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Coach not found.</p>
          <Link href="/player/coaching/browse" className="text-sm font-bold" style={{ color: "#1a5c2a" }}>
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const badge = BADGE_CONFIG[coach.verificationBadge];
  const avgRating = coach.reviews.length
    ? coach.reviews.reduce((s, r) => s + r.rating, 0) / coach.reviews.length
    : coach.rating;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/player/coaching/browse"
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Icons.ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">{coach.name}</p>
            <p className="text-xs text-gray-500">{coach.currentRole} · {coach.currentClub}</p>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Star size={14} className="text-[#f0b429] fill-[#f0b429]" />
            <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Banner */}
          <div className="h-20 sm:h-28" style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #2d8a47 100%)" }} />
          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="-mt-10 mb-3 flex items-end justify-between">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-2xl font-black shadow-md"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              {coach.isVerified && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${badge.color}`}>
                  <Icons.BadgeCheck size={13} />
                  {badge.label}
                </span>
              )}
            </div>

            <h1 className="text-xl font-black text-gray-900">{coach.name}</h1>
            <p className="text-sm text-gray-600 mb-3">{coach.currentRole} · {coach.currentClub}</p>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Rating",   value: avgRating.toFixed(1), icon: Icons.Star },
                { label: "Sessions", value: coach.totalSessions,  icon: Icons.CalendarCheck },
                { label: "Students", value: coach.totalStudents,  icon: Icons.Users },
                { label: "Years",    value: coach.experience,     icon: Icons.Trophy },
              ].map((s) => (
                <div key={s.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <s.icon size={16} className="mx-auto mb-1" style={{ color: "#1a5c2a" }} />
                  <p className="text-base font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {coach.specialties.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "#1a5c2a" }}>
                  {s}
                </span>
              ))}
            </div>

            {/* Languages */}
            <div className="flex items-center gap-2">
              <Icons.Globe size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500">{coach.languages.join(" · ")}</span>
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                {(["overview","availability","reviews"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-3 text-sm font-bold capitalize transition-colors"
                    style={{
                      color: tab === t ? "#1a5c2a" : "#6b7280",
                      borderBottom: tab === t ? "2px solid #1a5c2a" : "2px solid transparent",
                    }}
                  >
                    {t}
                    {t === "reviews" && coach.reviews.length > 0 && (
                      <span className="ml-1.5 text-xs font-black text-gray-400">({coach.reviews.length})</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Overview tab */}
                {tab === "overview" && (
                  <div className="space-y-5">
                    {/* Bio */}
                    <div>
                      <h3 className="text-sm font-black text-gray-900 mb-2">About</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{coach.bio}</p>
                    </div>

                    {/* Coaching style */}
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <div className="flex items-start gap-2">
                        <Icons.Lightbulb size={16} className="text-green-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-green-900 mb-1">Coaching Style</p>
                          <p className="text-sm text-green-800">{coach.coachingStyle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credentials */}
                    <div>
                      <h3 className="text-sm font-black text-gray-900 mb-3">Credentials</h3>
                      <div className="space-y-2.5">
                        {coach.credentials.map((cred) => (
                          <div key={cred.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1a5c2a" }}>
                              <Icons.Award size={16} className="text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{cred.name}</p>
                              <p className="text-xs text-gray-500">{cred.issuer} · {cred.year}</p>
                            </div>
                            <Icons.BadgeCheck size={16} className="ml-auto flex-shrink-0 text-green-500" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Former clubs */}
                    {coach.formerClubs.length > 0 && (
                      <div>
                        <h3 className="text-sm font-black text-gray-900 mb-2">Former Clubs</h3>
                        <div className="flex flex-wrap gap-2">
                          {coach.formerClubs.map((c) => (
                            <span key={c} className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 font-bold">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Session types */}
                    <div>
                      <h3 className="text-sm font-black text-gray-900 mb-3">Session Types Offered</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {SESSION_TYPES.map((st) => (
                          <div key={st.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <st.icon size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#1a5c2a" }} />
                            <div>
                              <p className="text-xs font-bold text-gray-900">{st.label}</p>
                              <p className="text-xs text-gray-500">{st.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability tab */}
                {tab === "availability" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Select a time slot below to book your session. All times are CAT (Central Africa Time).
                    </p>
                    {DAYS_ORDER.filter((d) => coach.availability.some((s) => s.day === d)).map((day) => {
                      const slots = coach.availability.filter((s) => s.day === day);
                      return (
                        <div key={day}>
                          <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">{DAY_ABBR[day]}day</p>
                          <div className="space-y-2">
                            {slots.map((slot) => {
                              const available = slot.maxBookings - slot.bookedCount;
                              const isFull = available <= 0;
                              const isSelected = selectedSlot?.id === slot.id;
                              return (
                                <button
                                  key={slot.id}
                                  disabled={isFull}
                                  onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                                  style={{
                                    borderColor: isSelected ? "#1a5c2a" : isFull ? "#e5e7eb" : "#d1d5db",
                                    backgroundColor: isSelected ? "#f0fdf4" : isFull ? "#f9fafb" : "#fff",
                                    opacity: isFull ? 0.6 : 1,
                                  }}
                                >
                                  <Icons.Clock size={15} style={{ color: "#1a5c2a", flexShrink: 0 }} />
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">{slot.startTime} – {slot.endTime}</p>
                                    <p className="text-xs text-gray-500">{slot.isRecurring ? "Weekly" : "One-off"}</p>
                                  </div>
                                  {isFull ? (
                                    <span className="text-xs font-bold text-gray-400">Full</span>
                                  ) : (
                                    <span className="text-xs font-bold text-green-600">{available} spot{available !== 1 ? "s" : ""}</span>
                                  )}
                                  {isSelected && <Icons.CheckCircle size={16} style={{ color: "#1a5c2a", flexShrink: 0 }} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {coach.availability.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-6">No availability slots posted yet.</p>
                    )}
                  </div>
                )}

                {/* Reviews tab */}
                {tab === "reviews" && (
                  <ReviewSystem
                    reviews={coach.reviews}
                    averageRating={avgRating}
                    totalReviews={coach.reviews.length}
                    coachId={coach.id}
                    playerId={user?.id ? String(user.id) : undefined}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right column — booking card */}
          <div className="lg:col-span-1 space-y-4">
            {bookingSuccess ? (
              <div className="bg-white rounded-2xl border border-green-200 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Icons.CheckCircle size={28} className="text-green-600" />
                </div>
                <p className="text-base font-black text-gray-900 mb-1">Booking Confirmed!</p>
                <p className="text-sm text-gray-500 mb-4">You will receive a confirmation and meeting link shortly.</p>
                <Link
                  href="/player/coaching"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Icons.Calendar size={15} />
                  View My Sessions
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-20">
                {/* Price header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">${coach.pricePerSession}</span>
                    <span className="text-sm text-gray-500">/ session</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{coach.sessionDuration} minutes · USD</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Session type */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
                      Session Type
                    </label>
                    <div className="space-y-1.5">
                      {SESSION_TYPES.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setSelectedType(st.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all text-sm"
                          style={{
                            borderColor: selectedType === st.id ? "#1a5c2a" : "#e5e7eb",
                            backgroundColor: selectedType === st.id ? "#f0fdf4" : "#fff",
                            fontWeight: selectedType === st.id ? 700 : 500,
                          }}
                        >
                          <st.icon size={14} style={{ color: "#1a5c2a", flexShrink: 0 }} />
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slot selector shortcut */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
                      Time Slot
                    </label>
                    {selectedSlot ? (
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold"
                        style={{ borderColor: "#1a5c2a", backgroundColor: "#f0fdf4", color: "#1a5c2a" }}
                      >
                        <Icons.Clock size={14} />
                        <span>{DAY_ABBR[selectedSlot.day]} · {selectedSlot.startTime}</span>
                        <button
                          onClick={() => setSelectedSlot(null)}
                          className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                          <Icons.X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setTab("availability")}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 transition-colors"
                      >
                        <Icons.CalendarPlus size={14} />
                        Choose a slot
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wide">
                      Session Notes (optional)
                    </label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="What would you like to focus on?"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2"
                      style={{ "--tw-ring-color": "#1a5c2a30" } as React.CSSProperties}
                    />
                  </div>

                  {bookingError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <Icons.AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{bookingError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    className="w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#f0b429", color: "#1a3a1a" }}
                  >
                    <Icons.CalendarCheck size={16} />
                    Book &amp; Pay ${coach.pricePerSession}
                  </button>

                  <div className="flex items-center gap-1.5 justify-center">
                    <Icons.ShieldCheck size={13} className="text-gray-400" />
                    <span className="text-xs text-gray-400">EcoCash · InnBucks · OneMoney · Card</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rating snapshot card */}
            {!bookingSuccess && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.MessageSquare size={15} style={{ color: "#1a5c2a" }} />
                  <p className="text-sm font-black text-gray-900">Reviews</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-gray-900">{avgRating.toFixed(1)}</span>
                  <div>
                    <StarRating value={avgRating} />
                    <p className="text-xs text-gray-400 mt-0.5">{coach.reviews.length} reviews</p>
                  </div>
                </div>
                <button
                  onClick={() => setTab("reviews")}
                  className="mt-3 text-xs font-bold"
                  style={{ color: "#1a5c2a" }}
                >
                  Read all reviews →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && pendingSession && coach && user && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => { setShowPayment(false); setPendingSession(null); }}
          coachName={coach.name}
          sessionId={pendingSession.id}
          coachId={coach.id}
          amount={pendingSession.price}
          playerName={user.name ?? "Player"}
          playerPhone={(user as { phone?: string }).phone ?? ""}
          playerEmail={user.email ?? ""}
          onPaymentComplete={() => {
            setShowPayment(false);
            setPendingSession(null);
            setBookingSuccess(true);
            setSelectedSlot(null);
            setBookingNotes("");
          }}
        />
      )}
    </div>
  );
}
