
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Camera, IdCard, Video, Award, Target, ChevronRight, Loader2, Flame 
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { SimplifiedSidebar } from "@/components/layout/simplified-sidebar";

interface BiometricResult {
  id: string;
  testType: string;
  rawScore: string;
  percentile: number;
  tier: string;
  date: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  sport?: string;
  province?: string;
  age_group?: string;
}

export default function AthleteDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  
  const [biometrics, setBiometrics] = useState<BiometricResult[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vaultCount, setVaultCount] = useState(0);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadAthleteData();
  }, [hasHydrated, user, router]);

  const loadAthleteData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user profile data from backend API
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data || profileData);
      } else {
        setProfile(user as UserProfile);
      }

      // 2. Fetch biometric performance tracking results
      const bioRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/biometrics/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bioRes.ok) {
        const bioData = await bioRes.json();
        setBiometrics(bioData.results || []);
      }

      // 3. Sync and count offline video files stored in local vault
      const storedVideos = localStorage.getItem("gs_athlete_videos");
      if (storedVideos) {
        const videos = JSON.parse(storedVideos);
        setVaultCount(Array.isArray(videos) ? videos.length : 0);
      }
    } catch (error) {
      console.error("Failed to load athlete dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render uniform full-screen fallback loader during authentication checks
  if (!hasHydrated || isLoading) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a4329]" size={32} />
      </div>
    );
  }

  // Derive inline analytics and top achievements from active metrics history
  const latestBiometric = biometrics[0];
  const completedTests = biometrics.length;
  const bestPercentile = biometrics.length > 0 
    ? Math.max(...biometrics.map(b => b.percentile)) 
    : 0;

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <SimplifiedSidebar />
      
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Welcome Branding Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900">
              Welcome, {profile?.name?.split(" ")[0] || "Athlete"}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.sport || "Multi-sport athlete"} · {profile?.province || "Zimbabwe"}
            </p>
          </div>

          {/* Interactive Performance Stats Grid Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-200 shadow-sm">
              <Target size={20} className="mx-auto text-[#1a4329] mb-2" />
              <p className="text-2xl font-black text-gray-900">{completedTests}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tests Completed</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-200 shadow-sm">
              <Award size={20} className="mx-auto text-[#f0b429] mb-2" />
              <p className="text-2xl font-black text-gray-900">{bestPercentile}th</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Best Percentile</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center border border-gray-200 shadow-sm">
              {completedTests > 0 ? (
                <>
                  <Flame size={20} className="mx-auto text-orange-500 mb-2" />
                  <p className="text-2xl font-black text-gray-900 truncate px-1">
                    {latestBiometric?.tier?.split(" ")[0] || "Active"}
                  </p>
                </>
              ) : (
                <>
                  <Video size={20} className="mx-auto text-[#1a4329] mb-2" />
                  <p className="text-2xl font-black text-gray-900">{vaultCount}</p>
                </>
              )}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {completedTests > 0 ? "Current Tier" : "Videos Stored"}
              </p>
            </div>
          </div>

          {/* Core App Actions Navigation Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link 
              href="/athlete/scan"
              className="bg-[#1a4329] rounded-2xl p-6 text-white shadow-md hover:shadow-lg transition-all border border-gray-800"
            >
              <Camera size={28} className="text-[#ccff00] mb-3" />
              <h2 className="text-lg font-black">AI Biometric Scan</h2>
              <p className="text-sm text-gray-300 mt-1">Record a 10-second video. Get instant athletic assessment.</p>
              <div className="flex items-center gap-1 mt-4 text-sm font-bold text-[#ccff00]">
                Start Scan <ChevronRight size={14} />
              </div>
            </Link>

            <Link 
              href="/athlete/vault"
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              <Video size={28} className="text-[#1a4329] mb-3" />
              <h2 className="text-lg font-black text-gray-900">My Video Vault</h2>
              <p className="text-sm text-gray-500 mt-1">Upload training clips. Build your highlight reel.</p>
              <div className="flex items-center gap-1 mt-4 text-sm font-bold text-[#1a4329]">
                Upload Videos <ChevronRight size={14} />
              </div>
            </Link>
          </div>

          {/* Secure Talent Passport Card Block */}
          <Link 
            href="/athlete/passport"
            className="block bg-gradient-to-r from-[#1a4329] to-[#235837] rounded-2xl p-5 text-white shadow-sm mb-8 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-[#ccff00]">
                  <IdCard size={24} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Your Talent Passport</h3>
                  <p className="text-xs text-gray-300 mt-0.5">Share your real-time verified profile with scouts via secure QR code.</p>
                </div>
              </div>
              <div className="bg-[#ccff00] text-[#1a4329] px-4 py-2 rounded-xl text-xs font-black shadow-sm tracking-wider uppercase">
                Open
              </div>
            </div>
          </Link>

          {/* Historically Logged Recent Metrics Ledger */}
          {biometrics.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Recent Test Results</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {biometrics.slice(0, 5).map((test) => (
                  <div key={test.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-900 capitalize">
                        {test.testType.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {new Date(test.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{test.rawScore}</p>
                      <p className="text-[10px] font-bold text-[#1a4329] mt-0.5">{test.percentile}th percentile</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}