"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, LayoutGrid, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar"; // Ensure exact case alignment

export default function LiveMatchSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Form States
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [selectedSport, setSelectedSport] = useState("football");
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [error, setError] = useState("");

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Please fill out both Home and Away team fields before starting.");
      return;
    }
    setError("");
    
    // Proceed to interactive collection layout
    router.push(`/analyst/live-match/collector?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&sport=${selectedSport}&formation=${selectedFormation}`);
  };

  return (
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Header Block Layout */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">Session Creator</p>
            <h1 className="text-xl font-black text-gray-900">Start Match Brain Session</h1>
          </div>
        </div>

        {/* Info Explainer Prompt Banner Panel */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-sm font-bold text-[#c8962a]">
            One session. Four input modes. Six analytical outputs.
          </p>
          <p className="mt-1 text-xs text-gray-600 leading-relaxed">
            Collect touches, shots, passes, and zones in real time. Full automated visual tracking dashboards will be ready the absolute moment the final whistle blows.
          </p>
        </div>

        {/* Institutional Light Main Action Form Card Panel */}
        <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleStartSession} className="space-y-5">
            
            {/* Team Inputs Row Block - Added unique id, name, and autocomplete tags */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="homeTeamInput" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Home Team *
                </label>
                <input
                  id="homeTeamInput"
                  name="home_team_name"
                  type="text"
                  autoComplete="off"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Dynamos FC"
                  className="w-full rounded-xl border border-gray-200 bg-[#f4f2ee] px-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
              <div>
                <label htmlFor="awayTeamInput" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Away Team *
                </label>
                <input
                  id="awayTeamInput"
                  name="away_team_name"
                  type="text"
                  autoComplete="off"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. CAPS United"
                  className="w-full rounded-xl border border-gray-200 bg-[#f4f2ee] px-4 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
            </div>

            {/* Sport Selector Toggle Array - High Contrast Light Elements */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">Target Sport Parameters</p>
              <div className="flex flex-wrap gap-2">
                {["Football", "Netball", "Rugby", "Basketball", "Cricket", "Athletics"].map((sportOpt) => {
                  const optLower = sportOpt.toLowerCase();
                  const isSelected = selectedSport === optLower;
                  return (
                    <button
                      key={sportOpt}
                      type="button"
                      onClick={() => setSelectedSport(optLower)}
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

            {/* Formation Selector Toggle Grid */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">Home Team Tactical Base Shape</p>
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

            {/* Master Action Trigger Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1a5c2a] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-green-800 transition-all"
            >
              <Play size={16} fill="currentColor" />
              Start Match Brain Session
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}