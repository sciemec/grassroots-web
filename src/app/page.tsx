"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Award, 
  Zap, 
  Bell, 
  Users, 
  TrendingUp, 
  MapPin, 
  Activity, 
  Filter,
  LogOut,
  User
} from "lucide-react";

// --- Permanent Arena Light Theme Colors ---
const COLORS = {
  bg: "#f4f2ee",
  primary: "#1a5c2a", // Forest Green
  accent: "#c8962a",  // Gold
  border: "#e5e7eb",
  textMain: "#111827",
  textMuted: "#6b7280"
};

export default function ArenaLandingPage() {
  const router = useRouter();
  
  // FIXED: Split selectors to strictly prevent React #185 infinite re-render loops
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState("for-you");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Zustand Async Hydration Guard
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Fetch Feed with Fallback
  useEffect(() => {
    if (!hydrated) return;
    
    // In production, this pulls from your live Laravel API endpoints
    // GET /api/v1/arena/feed, /arena/feed/following, or /arena/feed/connections
    setLoading(true);
    const mockPosts = [
      {
        id: "p1",
        post_type: "prediction_upgrade",
        body: "⬆️ Talent level upgraded to Premier Soccer League! Dynamic progress logged from physical metrics.",
        sport: "Football",
        province: "Harare",
        like_count: 14,
        comment_count: 3,
        liked: true,
        created_at: "2h ago",
        user: { name: "Tendai P.", role: "player", initials: "T.P." }
      },
      {
        id: "p2",
        post_type: "milestone",
        body: "🔥 Score improved to 84 (was 76) — keep going! Biomechanics training schedule completed.",
        sport: "Netball",
        province: "Bulawayo",
        like_count: 8,
        comment_count: 1,
        liked: false,
        created_at: "5h ago",
        user: { name: "Chipo M.", role: "player", initials: "C.M." }
      },
      {
        id: "p3",
        post_type: "standard",
        body: "Solid session with the U17 squad today. Working on front foot passing fundamentals to break low blocks.",
        sport: "Football",
        province: "Mashonaland Central",
        like_count: 22,
        comment_count: 7,
        liked: false,
        created_at: "1d ago",
        user: { name: "Coach Nigel", role: "coach", initials: "C.N." }
      }
    ];
    
    setPosts(mockPosts);
    setLoading(false);
  }, [hydrated, activeTab]);

  if (!hydrated) return null;

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh" }} className="w-full antialiased text-gray-900 font-sans">
      {/* Sticky White Global Navigation Panel */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-black tracking-wider flex items-center space-x-2">
              <span style={{ color: COLORS.primary }}>THE</span>
              <span style={{ backgroundColor: COLORS.primary, color: "#fff" }} className="px-2 py-0.5 rounded text-sm font-bold">ARENA</span>
            </Link>
            
            {/* Dynamic Desk Nav items - auto-hides beautifully on mobile display widths */}
            <div className="hidden md:flex items-center space-x-1 font-medium text-sm text-gray-600">
              <Link href="/" style={{ color: COLORS.primary }} className="px-3 py-2 rounded-lg bg-gray-50 font-bold">Feed</Link>
              <Link href="/arena/network" className="px-3 py-2 rounded-lg hover:bg-gray-50 transition">Network</Link>
              <Link href="/arena/messages" className="px-3 py-2 rounded-lg hover:bg-gray-50 transition">Messages</Link>
              <Link href="/arena/clubs" className="px-3 py-2 rounded-lg hover:bg-gray-50 transition">Clubs</Link>
              <Link href="/talent-leaderboard" className="px-3 py-2 rounded-lg hover:bg-gray-50 transition flex items-center space-x-1">
                <Zap size={14} style={{ color: COLORS.accent }} />
                <span>Leaderboard</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/arena/notifications" className="p-2 text-gray-500 hover:text-gray-900 relative rounded-full hover:bg-gray-100">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
                <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: COLORS.primary }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                </div>
                <button onClick={() => logout()} className="hidden sm:flex text-xs font-semibold text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="text-sm font-semibold text-gray-700 px-4 py-2 hover:bg-gray-50 rounded-lg transition">
                  Sign In
                </Link>
                <Link href="/register" style={{ backgroundColor: COLORS.primary }} className="text-sm font-bold text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-sm transition">
                  Join The Platform
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Structural Layout Interface */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
        {/* Responsive Flexbox/Grid Pipeline layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT IDENTITY COLUMN: Vanishes perfectly on native mobile views */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {user ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
                  {user.name ? user.name.substring(0,2).toUpperCase() : "GR"}
                </div>
                <h2 className="font-bold text-lg text-gray-900">{user.name || "Grassroots User"}</h2>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">{user.role || "Member"}</p>
                <div className="border-t border-gray-100 pt-3 text-left space-y-2 text-xs font-medium text-gray-600">
                  <Link href="/player/profile" className="flex justify-between items-center hover:text-gray-900 py-1">
                    <span>Manage DNA Profile</span>
                    <span style={{ color: COLORS.accent }}>→</span>
                  </Link>
                  <Link href="/arena/network" className="flex justify-between items-center hover:text-gray-900 py-1">
                    <span>Connections Tracker</span>
                    <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold">Live</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
                <Award size={36} className="mx-auto mb-2" style={{ color: COLORS.accent }} />
                <h3 className="font-bold text-sm text-gray-800">Zimbabwe's Social Hub</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">Track statistics, connect with local coaches, and get scouted.</p>
                <Link href="/register" style={{ backgroundColor: COLORS.accent }} className="block w-full text-center text-white font-bold text-xs py-2 rounded-lg hover:opacity-90 shadow-sm transition">
                  Create Free Profile
                </Link>
              </div>
            )}
          </div>

          {/* CENTRE ACTIVE FEED: Dynamic 100% responsive phone display scale */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            {/* Horizontal Feed Navigation Controller */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex space-x-1">
              {["for-you", "following", "connections"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    backgroundColor: activeTab === tab ? "#f3f4f6" : "transparent",
                    color: activeTab === tab ? COLORS.primary : COLORS.textMuted
                  }}
                  className="flex-1 text-center py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition"
                >
                  {tab.replace("-", " ")}
                </button>
              ))}
            </div>

            {/* Quick Interactive Post Composer Input block */}
            {user && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex space-x-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: COLORS.primary }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="w-full">
                    <textarea 
                      placeholder="Share training progress, match outcomes, or media clips..." 
                      className="w-full border-0 resize-none text-sm text-gray-800 focus:ring-0 placeholder-gray-400 p-1 min-h-[60px]"
                      maxLength={280}
                    />
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-2">
                      <div className="flex space-x-2 text-xs font-semibold text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded-lg">#Football</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-lg">#Harare</span>
                      </div>
                      <button style={{ backgroundColor: COLORS.accent }} className="text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition">
                        Post to Arena
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Posts Pipeline View Wrapper */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-pulse">
                    <div className="flex space-x-3 items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/6" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => {
                  const isCelebration = post.post_type === "milestone" || post.post_type === "achievement";
                  const isLevelUp = post.post_type === "prediction_upgrade";

                  return (
                    <div 
                      key={post.id} 
                      style={{ 
                        backgroundColor: isCelebration ? "#f0fdf4" : "#ffffff",
                        borderColor: isCelebration ? "#bbf7d0" : isLevelUp ? "#fde68a" : COLORS.border
                      }}
                      className="rounded-2xl border shadow-sm p-4 space-y-3 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: COLORS.primary }}>
                            {post.user.initials}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                              <span>{post.user.name}</span>
                              <span className="text-xs font-medium text-gray-400 capitalize px-1.5 py-0.2 bg-gray-100 rounded">
                                {post.user.role}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-medium">{post.created_at}</div>
                          </div>
                        </div>

                        {/* Configurable Badges Row based on Post Context Metadata */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                            {post.sport}
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full hidden sm:inline">
                            {post.province}
                          </span>
                        </div>
                      </div>

                      {/* Rendered Post Content String */}
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">
                        {post.body}
                      </p>

                      {/* Standardised Action Interaction Strip Bar */}
                      <div className="flex items-center justify-between border-t border-gray-50/80 pt-3 text-gray-500 text-xs font-bold">
                        <button className="flex items-center space-x-1.5 hover:text-red-500 transition">
                          <Heart size={16} fill={post.liked ? "#ef4444" : "transparent"} style={{ color: post.liked ? "#ef4444" : "inherit" }} />
                          <span>{post.like_count}</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-blue-500 transition">
                          <MessageSquare size={16} />
                          <span>{post.comment_count}</span>
                        </button>
                        <button className="flex items-center space-x-1.5 hover:text-green-600 transition">
                          <Share2 size={16} />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No active updates found in this category section yet.
              </div>
            )}
          </div>

          {/* RIGHT COL: Suggested and Quick-Access panels. Hidden gracefully on mobile phone widths */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center space-x-1">
                <TrendingUp size={14} style={{ color: COLORS.accent }} />
                <span>Trending Talent Profiles</span>
              </h3>
              <div className="space-y-3">
                {[
                  { initials: "K.M.", name: "K. Musona", rank: "Top 2% U19", score: "89" },
                  { initials: "M.N.", name: "M. Nakamba", rank: "Top 5% U17", score: "84" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center font-bold" style={{ color: COLORS.accent }}>
                        {item.initials}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{item.name}</div>
                        <div className="text-gray-400 font-medium">{item.rank}</div>
                      </div>
                    </div>
                    <span className="font-black" style={{ color: COLORS.primary }}>{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-400 font-semibold space-y-1">
              <p>© 2026 GrassRoots Sports Zimbabwe Platform.</p>
              <div className="flex justify-center space-x-2">
                <Link href="/privacy" className="hover:underline">Privacy</Link>
                <span>·</span>
                <Link href="/terms" className="hover:underline">Terms</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}