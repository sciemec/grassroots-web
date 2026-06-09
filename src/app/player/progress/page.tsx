"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Calendar, Award, LineChart, Activity } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { PlayerSidebar } from "@/components/layout/player-sidebar";

interface TrainingSession {
  overallForm: number;
  explosivePower: number;
  symmetryScore: number;
  kneeAngle: number;
  kneeRating: string;
  timestamp: string;
  duration: number;
}

export default function PlayerProgressPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [latestBiometric, setLatestBiometric] = useState<TrainingSession | null>(null);
  const [improvement, setImprovement] = useState(0);

  useEffect(() => {
    // Load training sessions
    const stored = localStorage.getItem(`training_sessions_${user?.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(parsed);
      
      if (parsed.length > 0) {
        setLatestBiometric(parsed[0]);
        
        // Calculate improvement from first to last
        if (parsed.length >= 2) {
          const first = parsed[parsed.length - 1];
          const last = parsed[0];
          const improvementPercent = ((last.overallForm - first.overallForm) / first.overallForm) * 100;
          setImprovement(Math.round(improvementPercent));
        }
      }
    }
  }, [user?.id]);

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch(rating) {
      case 'ELITE': return 'text-emerald-500';
      case 'GOOD': return 'text-blue-500';
      default: return 'text-red-500';
    }
  };

  // Get form score color
  const getFormColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player" className="flex items-center gap-2 text-gray-400 hover:text-[#f0b429]">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Your Athletic Journey</span>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <h1 className="text-xl font-black" style={{ color: "#f0b429" }}>My Progress</h1>
            <p className="text-sm text-gray-400 mt-1">
              Track your improvement over time. Scouts see this graph on your profile.
            </p>
          </div>

          {/* Stats Summary */}
          {latestBiometric && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <p className="text-[10px] text-gray-500 uppercase">Current Form</p>
                <p className={`text-2xl font-black ${getFormColor(latestBiometric.overallForm)}`}>
                  {latestBiometric.overallForm}
                </p>
                <p className="text-[10px] text-gray-600">out of 100</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <p className="text-[10px] text-gray-500 uppercase">Total Sessions</p>
                <p className="text-2xl font-black" style={{ color: "#f0b429" }}>{sessions.length}</p>
                <p className="text-[10px] text-gray-600">training sessions logged</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                <p className="text-[10px] text-gray-500 uppercase">Improvement</p>
                <p className={`text-2xl font-black ${improvement >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement}%
                </p>
                <p className="text-[10px] text-gray-600">since first session</p>
              </div>
            </div>
          )}

          {/* Performance Graph */}
          {sessions.length >= 2 ? (
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <LineChart className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold" style={{ color: "#f0b429" }}>Form Score Trend</h2>
              </div>
              
              <div className="relative h-48">
                <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 h-40">
                  {(() => {
                    const reversed = sessions.slice().reverse();
                    return reversed.map((session, i) => {
                    const height = (session.overallForm / 100) * 160;
                    const isImproving = i > 0 && session.overallForm > reversed[i - 1].overallForm;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div 
                          className={`w-full rounded-t transition-all cursor-pointer ${isImproving ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ height: `${Math.max(height, 4)}px`, minHeight: '4px' }}
                          title={`Session ${i+1}: ${session.overallForm}`}
                        />
                        <div className="text-[8px] text-gray-600 mt-1 -rotate-45 origin-top-left">
                          {i+1}
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
              </div>

              <p className="mt-4 text-center text-[9px] text-gray-500">
                Session progression (oldest → newest) • Green = improving • Gold = maintaining/dip
              </p>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-8 text-center">
              <Activity className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">Not enough data yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Complete 2+ training sessions to see your progress graph
              </p>
              <Link href="/player/train" className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-[#f0b429]">
                Start Training →
              </Link>
            </div>
          )}

          {/* Session History */}
          {sessions.length > 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 overflow-hidden">
              <div className="border-b border-gray-800 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-bold" style={{ color: "#f0b429" }}>Session History</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-800 bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Form</th>
                      <th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Power</th>
                      <th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Knee</th>
                      <th className="px-4 py-3 text-[10px] text-gray-500 uppercase">Symmetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sessions.slice(0, 20).map((session, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </td>
                        <td className={`px-4 py-3 text-xs font-bold ${getFormColor(session.overallForm)}`}>
                          {session.overallForm}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300">{session.explosivePower}%</td>
                        <td className={`px-4 py-3 text-xs font-bold ${getRatingColor(session.kneeRating)}`}>
                          {session.kneeAngle}°
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-300">{session.symmetryScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Call to Action */}
          {sessions.length === 0 && (
            <div className="mt-6 rounded-xl border border-emerald-800/30 bg-emerald-600/10 p-5 text-center">
              <Award className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-bold" style={{ color: "#f0b429" }}>Get Your Biometric Profile</p>
              <p className="text-xs text-gray-400 mt-1">
                Complete a 30-second assessment to generate your athlete profile
              </p>
              <Link href="/player/train" className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-[#f0b429]">
                Start Now →
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}