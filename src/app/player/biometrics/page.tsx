"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, TrendingUp } from "lucide-react";
import BiometricScanner from "@/components/BiometricScanner";

type TabType = "sprint" | "juggling" | "classification";

export default function PlayerBiometricsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("sprint");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = () => {
    const saved = JSON.parse(typeof window !== "undefined" ? localStorage.getItem("gs_biometric_history") || "[]" : "[]");
    setHistory(saved.slice(0, 10));
    setShowHistory(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/player"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tight text-white">
              Biometric Performance Lab
            </h1>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              AI-Powered Movement Analysis
            </p>
          </div>
          <button
            onClick={loadHistory}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <History className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 rounded-xl border border-gray-800 bg-gray-900/30 p-1">
          <button
            onClick={() => setActiveTab("sprint")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "sprint"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            }`}
          >
            Sprint Mechanics
          </button>
          <button
            onClick={() => setActiveTab("juggling")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "juggling"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            }`}
          >
            Juggling Rhythm
          </button>
          <button
            onClick={() => setActiveTab("classification")}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "classification"
                ? "bg-emerald-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            }`}
          >
            Talent Classifier
          </button>
        </div>

        {/* Scanner Component */}
        <BiometricScanner
          onScanComplete={() => {}}
        />

        {/* Info Panel */}
        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              How It Works
            </p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Point your camera at your full body from 2-3 meters away. The AI tracks 33 skeletal points 
            to measure your knee drive angle, head tilt (scanning ability), core stability, and limb symmetry. 
            All processing happens on your device — no data upload required.
          </p>
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center">
            <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-gray-900 p-5 sm:rounded-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Your Assessment History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>
              {history.length === 0 ? (
                <p className="py-8 text-center text-xs text-gray-500">
                  No assessments yet. Complete your first scan above.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-800 bg-gray-800/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase text-emerald-500">
                          {item.mode}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-white">
                        Knee: {item.metrics?.kneeAngle}° ({item.metrics?.kneeRating})
                      </p>
                      <p className="text-xs text-gray-400">
                        Stability: {Math.max(0, 100 - (item.metrics?.coreDrift || 0))}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}