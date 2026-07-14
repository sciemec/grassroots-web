// src/app/player/coaching/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { PlayerCoachingStats, CoachingSession, Review } from "@/types/coaching";

export default function PlayerCoachingDashboard() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState<PlayerCoachingStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<CoachingSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<CoachingSession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "sessions" | "reviews">("dashboard");

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        // Load stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/coaching/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }

        // Load upcoming sessions
        const upcomingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/coaching/sessions/upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (upcomingRes.ok) {
          const data = await upcomingRes.json();
          setUpcomingSessions(data.sessions || []);
        }

        // Load recent sessions
        const recentRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/coaching/sessions/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentSessions(data.sessions || []);
        }

        // Load reviews
        const reviewsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/coaching/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("Failed to load coaching data:", error);
        // Mock data
        setStats(mockStats);
        setUpcomingSessions(mockUpcomingSessions);
        setRecentSessions(mockRecentSessions);
        setReviews(mockReviews);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <Icons.Loader2 className="animate-spin text-[#1a5c2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">🎯 Coaching Hub</h1>
            <p className="text-sm text-gray-500">Track your coaching sessions and progress</p>
          </div>
          <Link
            href="/player/coaching/browse"
            className="px-4 py-2 bg-[#f0b429] text-black rounded-xl font-bold text-sm hover:bg-[#f0b429]/90 transition-colors flex items-center gap-2"
          >
            <Icons.Search size={16} />
            Find a Coach
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-[#1a5c2a]">{stats?.totalSessions || 0}</p>
            <p className="text-xs text-gray-500">Total Sessions</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-emerald-500">{stats?.completedSessions || 0}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-[#f0b429]">{stats?.averageRating || 0}</p>
            <p className="text-xs text-gray-500">Avg Rating Given</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-black text-blue-500">${stats?.totalSpent || 0}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-4">
          {["dashboard", "sessions", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors capitalize ${
                activeTab === tab
                  ? "bg-[#1a5c2a] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab === "dashboard" && "📊 Dashboard"}
              {tab === "sessions" && "📅 Sessions"}
              {tab === "reviews" && "⭐ Reviews"}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Icons.Calendar size={16} />
                Upcoming Sessions
              </h3>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.coachName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.scheduledAt).toLocaleString()} • {session.duration}min
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{session.sessionType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#1a5c2a]">${session.price}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            session.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            session.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                      {session.meetingLink && (
                        <div className="mt-3 flex gap-2">
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#1a5c2a] text-white rounded-lg text-xs font-bold hover:bg-[#1a5c2a]/90 transition-colors flex items-center gap-1"
                          >
                            <Icons.Video size={14} />
                            Join Session
                          </a>
                          <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                            Reschedule
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-200">
                  <Icons.Calendar className="mx-auto text-gray-300" size={32} />
                  <p className="text-gray-500 mt-2">No upcoming sessions</p>
                  <Link href="/player/coaching/browse" className="text-[#1a5c2a] hover:underline text-sm">
                    Find a coach →
                  </Link>
                </div>
              )}
            </div>

            {/* Progress */}
            {stats?.progress && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">📈 Your Progress</h3>
                <div className="space-y-3">
                  {Object.entries(stats.progress).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 capitalize">{key}</span>
                        <span className="font-bold text-[#1a5c2a]">{value}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1a5c2a] rounded-full transition-all duration-500"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">All Sessions</h3>
              <span className="text-xs text-gray-500">{recentSessions.length} total</span>
            </div>
            {recentSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{session.coachName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.scheduledAt).toLocaleString()} • {session.duration}min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1a5c2a]">${session.price}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      session.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      session.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
                {session.feedback && (
                  <div className="mt-2 text-xs text-gray-500">
                    Your rating: {session.feedback.playerRating}/5
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Your Reviews</h3>
              <span className="text-xs text-gray-500">{reviews.length} reviews</span>
            </div>
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{review.playerName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Icons.Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'fill-[#f0b429] text-[#f0b429]' : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {review.isVerified && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                {review.coachResponse && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Coach Response</p>
                    <p className="text-sm text-gray-700 mt-1">{review.coachResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Mock data
const mockStats: PlayerCoachingStats = {
  totalSessions: 12,
  completedSessions: 8,
  cancelledSessions: 2,
  totalSpent: 450,
  averageRating: 4.7,
  favoriteCoach: "Coach T. Musona",
  favoriteCoachId: "c1",
  progress: {
    tactical: 75,
    technical: 60,
    physical: 45,
    mental: 80,
  },
  achievements: ["First Session", "5 Sessions Completed", "10 Sessions Completed"],
  recentSessions: [],
  upcomingSessions: [],
};

const mockUpcomingSessions: CoachingSession[] = [
  {
    id: "s1",
    coachId: "c1",
    playerId: "p1",
    coachName: "Coach T. Musona",
    playerName: "Player",
    sessionType: "individual",
    status: "confirmed",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    duration: 45,
    price: 50,
    currency: "USD",
    paymentStatus: "paid",
    meetingLink: "https://meet.daily.co/coaching-s1",
    meetingId: "s1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reminderSent: false,
  },
];

const mockRecentSessions: CoachingSession[] = [
  {
    id: "s2",
    coachId: "c1",
    playerId: "p1",
    coachName: "Coach T. Musona",
    playerName: "Player",
    sessionType: "individual",
    status: "completed",
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    duration: 45,
    price: 50,
    currency: "USD",
    paymentStatus: "paid",
    meetingLink: "https://meet.daily.co/coaching-s2",
    meetingId: "s2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    feedback: {
      playerRating: 5,
      playerComment: "Great session!",
      coachRating: 5,
      coachComment: "Excellent player",
    },
    reminderSent: true,
  },
];

const mockReviews: Review[] = [
  {
    id: "r1",
    playerId: "p1",
    playerName: "Tendai Moyo",
    sessionId: "s2",
    rating: 5,
    comment: "Excellent coaching! Really helped me understand my positioning.",
    categories: {
      expertise: 5,
      communication: 5,
      value: 5,
      punctuality: 4,
      overall: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVerified: true,
  },
];