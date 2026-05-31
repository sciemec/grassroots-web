"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Camera, TrendingUp, Activity, Award, 
  Sparkles, Clock, CheckCircle, Zap, Heart
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { PlayerSidebar } from "@/components/layout/player-sidebar";

interface TrainingSession {
  overallForm: number;
  timestamp: string;
}

export default function PlayerTrainingHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [lastSession, setLastSession] = useState<TrainingSession | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [bestForm, setBestForm] = useState(0);

  useEffect(() => {
    // Load training history
    const stored = localStorage.getItem(`training_sessions_${user?.id}`);
    if (stored) {
      const sessions = JSON.parse(stored);
      setTotalSessions(sessions.length);
      
      if (sessions.length > 0) {
        setLastSession(sessions[0]);
        const best = Math.max(...sessions.map((s: TrainingSession) => s.overallForm));
        setBestForm(best);
      }
    }
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-black text-white">AI Training Lab</h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Get Discovered • Track Progress
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* Hero Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-600/20 p-3">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-400">Welcome, {user.name?.split(" ")[0] || "Athlete"}!</p>
                <p className="text-xs text-gray-400">Complete a 30-second assessment to generate your biometric profile</p>
              </div>
            </div>
          </div>

          {/* Two Main Options */}
          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Train / Scan Option */}
            <Link href="/player/training/scan" className="group">
              <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6 transition-all hover:border-emerald-500 hover:scale-[1.02]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-500 group-hover:bg-emerald-600/30">
                  <Camera className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-white">New Assessment</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Use your camera to analyze your movement. Get form score, knee angle, and symmetry.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500">
                  <Sparkles className="h-3 w-3" />
                  Takes 30 seconds
                </div>
              </div>
            </Link>

            {/* Progress Option */}
            <Link href="/player/training/progress" className="group">
              <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-6 transition-all hover:border-emerald-500 hover:scale-[1.02]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-blue-500 group-hover:bg-blue-600/30">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-white">My Progress</h2>
                <p className="mt-1 text-sm text-gray-400">
                  View your improvement over time. See graphs and track your development.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-500">
                  <Activity className="h-3 w-3" />
                  {totalSessions} {totalSessions === 1 ? "session" : "sessions"} logged
                </div>
              </div>
            </Link>
          </div>

          {/* Stats Summary (if has sessions) */}
          {totalSessions > 0 && lastSession && (
            <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Your Best Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-emerald-500">{bestForm}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Last assessment: {new Date(lastSession.timestamp).toLocaleDateString()}
              </p>
              <Link 
                href="/player/training/progress" 
                className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
              >
                View full history →
              </Link>
            </div>
          )}

          {/* Info Panel */}
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-bold text-white">Why This Matters</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your biometric data (form score, explosive power, movement symmetry) is visible on your 
              public Arena profile. Scouts filter by these metrics to discover top talent. 
              Higher scores = more visibility = more opportunities.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}