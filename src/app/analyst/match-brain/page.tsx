"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, AlertCircle, Brain } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

export default function MatchBrainSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Form Parameters
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [selectedSport, setSelectedSport] = useState("football");
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [error, setError] = useState("");

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Please input both home and away squad parameters before launching.");
      return;
    }
    setError("");
    
    // Pass choices safely down to session tracker
    router.push(`/analyst/match-brain/session?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&sport=${selectedSport}&formation=${selectedFormation}`);
  };

  return (
    // CONTAINER: Crisp institutional light canvas background
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Navigation Action Bar */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">Advanced Ingestion Engine</p>
            <h1 className="text-xl font-black text-gray-900">Match Brain Center</h1>
          </div>
        </div>

        {/* Dynamic Explainer Alert Banner */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#c8962a] shrink-0">
              <Brain size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">One unified session. Six automated analytical outputs.</p>
              <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                Synchronize touch telemetry, real-time pass networks, tactical heatmaps, shot map xG progressions, and full AI dossier summaries matching official curriculum tracking parameters seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Main Operational Card Form Component Container */}
        <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleCreateSession} className="space-y-6">
            
            {/* Form Input Fields with Explicit Dark Text and Proper IDs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mbHomeInput" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Home Squad Identifier *
                </label>
                <input
                  id="mbHomeInput"
                  name="mb_home_team"
                  type="text"
                  autoComplete="off"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Dynamos FC"
                  className="w-full rounded-xl border border-gray-200 bg-[#f4f2ee] px-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
              <div>
                <label htmlFor="mbAwayInput" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Away Squad Identifier *
                </label>
                <input
                  id="mbAwayInput"
                  name="mb_away_team"
                  type="text"
                  autoComplete="off"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. CAPS United"
                  className="w-full rounded-xl border border-gray-200 bg-[#f4f2ee] px-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
            </div>

            {/* Sport Matrix Options Wrapper Block */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">Target Athletic Sport</p>
              <div className="flex flex-wrap gap-2">
                {["Football", "Netball", "Rugby", "Basketball", "Cricket", "Athletics"].map((sportOpt) => {
                  const sKey = sportOpt.toLowerCase();
                  const isSelected = selectedSport === sKey;
                  return (
                    <button
                      key={sportOpt}
                      type="button"
                      onClick={() => setSelectedSport(sKey)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-[#c8962a] border-[#c8962a] text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {sportOpt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tactical Base Formation Options Grid Block */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">Analytical Formation Layout Base</p>
              <div className="flex flex-wrap gap-2">
                {["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "Custom"].map((formOpt) => {
                  const isSelected = selectedFormation === formOpt;
                  return (
                    <button
                      key={formOpt}
                      type="button"
                      onClick={() => setSelectedFormation(formOpt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? "bg-[#1a5c2a] border-[#1a5c2a] text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {formOpt}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Execution Master Submit Action Trigger */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1a5c2a] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-green-800 transition-all"
            >
              <Play size={14} fill="currentColor" />
              Launch Live Match Brain Session
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}