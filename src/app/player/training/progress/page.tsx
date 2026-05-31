"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, TrendingUp, Calendar, LineChart, 
  Activity, Download, Loader2
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
// ✅ FIXED: Imported PlayerSidebar cleanly to align with line 98
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

export default function PlayerTrainingProgressPage() {
  const user = useAuthStore((s) => s.user);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [latestBiometric, setLatestBiometric] = useState<TrainingSession | null>(null);
  const [improvement, setImprovement] = useState(0);
  const [bestForm, setBestForm] = useState(0);
  const [averageForm, setAverageForm] = useState(0);

  // Prevent server-to-client hydration lag errors
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !user?.id) return;

    try {
      const stored = localStorage.getItem(`training_sessions_${user?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setLatestBiometric(parsed[0]);
          
          const forms = parsed.map((s: TrainingSession) => s.overallForm);
          setBestForm(Math.max(...forms));
          setAverageForm(Math.round(forms.reduce((a, b) => a + b, 0) / forms.length));
          
          if (parsed.length >= 2) {
            const first = parsed[parsed.length - 1];
            const last = parsed[0];
            if (first.overallForm > 0) {
              const improvementPercent = ((last.overallForm - first.overallForm) / first.overallForm) * 100;
              setImprovement(Math.round(improvementPercent));
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to safely parse storage logs:", err);
    }
  }, [hasHydrated, user?.id]);

  const getRatingColor = (rating: string) => {
    switch(rating?.toUpperCase()) {
      case 'ELITE': return 'text-emerald-500';
      case 'GOOD': return 'text-blue-500';
      default: return 'text-red-500';
    }
  };

  const getFormColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const exportData = () => {
    if (sessions.length === 0) return;
    const headers = ["Date", "Form Score", "Explosive Power", "Symmetry", "Knee Angle", "Rating"];
    const rows = sessions.map(s => [
      new Date(s.timestamp).toLocaleDateString(),
      s.overallForm,
      s.explosivePower,
      s.symmetryScore,
      s.kneeAngle,
      s.kneeRating
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training_data_${user?.id || 'profile'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-screen bg-gray-950 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={24} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* ✅ RENDERS SMOOTHLY NOW THAT IMPORT IS EXTRACTED */}
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
          
          {/* Header Controls */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player/training" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Lab</span>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Your Athletic Journey</span>
            </div>
          </div>

          {/* Title Header Block */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-black text-white">My Progress</h1>
              <p className="text-sm text-gray-400 mt-1">
                Track your improvement over time. Scouts evaluate this validation data matrix live on your Arena card profile.
              </p>
            </div>
            {sessions.length > 0 && (
              <button 
                onClick={exportData}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10 shadow-xs shrink-0"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>

          {/* Stats Matrix */}
          {sessions.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Current Form</p>
                  <p className={`text-2xl font-black mt-1 ${getFormColor(latestBiometric?.overallForm || 0)}`}>
                    {latestBiometric?.overallForm || "—"}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Best Form Score</p>
                  <p className="text-2xl font-black text-emerald-500 mt-1">{bestForm || "—"}%</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Average Form</p>
                  <p className="text-2xl font-black text-white mt-1">{averageForm || "—"}%</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Net Improvement</p>
                  <p className={`text-2xl font-black mt-1 ${improvement >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {improvement >= 0 ? '+' : ''}{improvement}%
                  </p>
                </div>
              </div>

              {/* Log Table Area */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center gap-1.5 tracking-wider">
                  <LineChart size={14} className="text-emerald-500" /> Historical Performance Log
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <th className="pb-3">Timestamp Date</th>
                        <th className="pb-3">Form Rating</th>
                        <th className="pb-3">Explosive Power</th>
                        <th className="pb-3">Symmetry</th>
                        <th className="pb-3 text-right">Knee Biometrics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-xs text-gray-300 font-medium">
                      {sessions.map((session, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 flex items-center gap-2">
                            <Calendar size={12} className="text-gray-600" />
                            {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className={`py-3.5 font-bold ${getFormColor(session.overallForm)}`}>
                            {session.overallForm}%
                          </td>
                          <td className="py-3.5 font-semibold text-white">
                            {session.explosivePower} kW
                          </td>
                          <td className="py-3.5">
                            {session.symmetryScore}% R/L Match
                          </td>
                          <td className={`py-3.5 text-right font-black tracking-wider text-[11px] ${getRatingColor(session.kneeRating)}`}>
                            {session.kneeRating}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-8 text-center">
              <Activity className="mx-auto mb-3 h-8 w-8 text-gray-600 animate-pulse" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-wide">No performance data compiled yet</p>
              <p className="text-xs text-gray-600 mt-1.5 max-w-xs mx-auto">
                Complete your first biometric scan assessment tracking sequence inside the lab to unpack your timeline graphs.
              </p>
              <Link 
                href="/player/training/scan" 
                className="mt-4 inline-block rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Launch First Assessment Scan
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}