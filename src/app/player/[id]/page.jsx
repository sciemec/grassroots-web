"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, BarChart3, Calendar, Download } from "lucide-react";
import { getStoredSessions, calculatePerformanceTrends, exportScoutReport, PlayerPerformance } from "@/lib/performance-tracker";
import { Sidebar } from "@/components/layout/sidebar";

export default function PlayerProgressPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [performance, setPerformance] = useState<PlayerPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessions = getStoredSessions(playerId);
    const trends = calculatePerformanceTrends(sessions);
    setPerformance(trends);
    setLoading(false);
  }, [playerId]);

  const handleExport = () => {
    if (performance) {
      const report = exportScoutReport(performance);
      navigator.clipboard.writeText(report);
      alert("Scout report copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-xs text-gray-500">Loading player data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex h-screen bg-gray-950">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-12 text-center">
            <p className="text-gray-500">No training sessions found for this player.</p>
            <Link href="/coach/squad" className="mt-4 inline-block text-emerald-500 hover:text-emerald-400">
              ← Back to Squad
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/coach/squad" className="rounded-xl border border-gray-800 bg-gray-900/50 p-2.5 text-gray-400 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">{performance.playerName}</h1>
              <p className="text-xs text-gray-500">{performance.sport} • {performance.position}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export Scout Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">Total Sessions</p>
            <p className="text-2xl font-black text-white">{performance.totalSessions}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">Avg. Form Score</p>
            <p className="text-2xl font-black text-emerald-500">{performance.averages.overallForm}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">Improvement</p>
            <p className={`text-2xl font-black ${performance.trends.improvementRate > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {performance.trends.improvementRate > 0 ? '+' : ''}{performance.trends.improvementRate}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <p className="text-[10px] font-bold uppercase text-gray-500">Consistency</p>
            <p className="text-2xl font-black text-amber-500">{performance.trends.consistencyScore}%</p>
          </div>
        </div>

        {/* Performance Graph */}
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-white">Performance Over Time</h2>
          </div>
          
          <div className="relative h-64">
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 h-48">
              {performance.sessions.slice().reverse().map((session, i) => {
                const height = (session.metrics.overallForm / 100) * 180;
                const isImproving = i > 0 && session.metrics.overallForm > performance.sessions[performance.sessions.length - i].metrics.overallForm;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all ${isImproving ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ height: `${height}px`, minHeight: '4px' }}
                    />
                    <div className="text-[8px] text-gray-600 mt-2 -rotate-45 origin-top-left">
                      {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <p className="text-[10px] text-gray-500 text-center mt-4">
            Green bars = improvement from previous session • Gold bars = dip in form
          </p>
        </div>

        {/* Session History Table */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 overflow-hidden">
          <div className="border-b border-gray-800 px-5 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-white">Session History</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500">Type</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500">Form</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500">Power</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase text-gray-500">Symmetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {performance.sessions.slice(0, 20).map((session) => (
                  <tr key={session.sessionId} className="hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-xs text-gray-300">
                      {new Date(session.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-300 capitalize">{session.sport}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold ${session.metrics.overallForm > 80 ? 'text-emerald-500' : session.metrics.overallForm > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {session.metrics.overallForm}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-300">{session.metrics.explosivePower}%</td>
                    <td className="px-5 py-3 text-xs text-gray-300">{session.metrics.symmetryScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}