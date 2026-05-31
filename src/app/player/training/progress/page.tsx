"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, TrendingUp, Calendar, Award, LineChart, 
  Activity, Trophy, BarChart3, ChevronRight, Download
} from "lucide-react";
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

export default function PlayerTrainingProgressPage() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [latestBiometric, setLatestBiometric] = useState<TrainingSession | null>(null);
  const [improvement, setImprovement] = useState(0);
  const [bestForm, setBestForm] = useState(0);
  const [averageForm, setAverageForm] = useState(0);

  useEffect(() => {
    // Load training sessions
    const stored = localStorage.getItem(`training_sessions_${user?.id}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(parsed);
      
      if (parsed.length > 0) {
        setLatestBiometric(parsed[0]);
        
        // Calculate best and average
        const forms = parsed.map((s: TrainingSession) => s.overallForm);
        setBestForm(Math.max(...forms));
        setAverageForm(Math.round(forms.reduce((a, b) => a + b, 0) / forms.length));
        
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

  // Export data as CSV
  const exportData = () => {
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
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `training_data_${user?.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player/training" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Lab</span>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">Your Athletic Journey</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <h1 className="text-xl font-black text-white">My Progress</h1>
            <p className="text-sm text-gray-400 mt-1">
              Track your improvement over time. Scouts see this graph on your profile.
            </p>
          </div>

          {/* Stats Summary */}
          {sessions.length > 0 ? (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                <p className="text-[9px] text-gray-500 uppercase">Current Form</p>
                <p className={`text-2xl font-black ${getFormColor(latestBiometric?.overallForm || 0)}`}>
                  {latestBiometric?.overallForm || "—"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                <p className="text-[9px] text-gray-500 uppercase">Best Form</p>
                <p className="text-2xl font-black text-emerald-500">{bestForm || "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                <p className="text-[9px] text-gray-500 uppercase">Avg Form</p>
                <p className="text-2xl font-black text-white">{averageForm || "—"}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
                <p className="text-[9px] text-gray-500 uppercase">Improvement</p>
                <p className={`text-2xl font-black ${improvement >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement}%
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/30 p-8 text-center">
              <Activity className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm text-gray-500">No training data yet</p>
              <p className="text-xs text-gray-600 mt-1">
                Complete your first assessment to see your progress
              </p>
              <Link href="/player/training/scan" className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text