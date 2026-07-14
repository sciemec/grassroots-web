// app/coach/talent-id/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Award, 
  Shield, 
  UserCheck, 
  Zap, 
  Crosshair, 
  Dumbbell, 
  Activity,
  AlertCircle,
  History,
  Save,
  RotateCcw,
  TrendingUp,
  Loader2
} from "lucide-react";
import { BiometricProfile } from "@/components/BiometricProfile";
import { AttributeSlider } from "@/components/AttributeSlider";
import { useBiometricData } from "@/hooks/useBiometricData";
import { useScoutingForm } from "@/hooks/useScoutingForm";
import { PositionType } from "@/types";

export default function TalentIDPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams?.get("player_id") ?? "";
  const coachId = searchParams?.get("coach_id") ?? "coach_default";
  const initialPosition = (searchParams?.get("position") as PositionType) ?? "MID";

  // State for showing history
  const [showHistory, setShowHistory] = useState(false);

  // Biometric data
  const { 
    data: biometricData, 
    loading: bioLoading, 
    error: bioError,
    refresh: refreshBio 
  } = useBiometricData(playerId);

  // Scouting form state
  const {
    position,
    setPosition,
    attributes,
    updateAttribute,
    overallScore,
    notes,
    setNotes,
    isSaving,
    error: saveError,
    saveProfile,
    resetToDefaults,
    savedProfiles,
    teamAverages,
  } = useScoutingForm({
    playerId,
    coachId,
    initialPosition,
  });

  // Handle position change with team average refresh
  const handlePositionChange = (newPosition: PositionType) => {
    setPosition(newPosition);
  };

  // Attribute configuration
  const attributeConfigs = [
    { key: 'pace' as const, label: 'Pace & Acceleration', icon: <Zap className="h-4 w-4" /> },
    { key: 'technical' as const, label: 'Technical Execution', icon: <Crosshair className="h-4 w-4" /> },
    { key: 'tactical' as const, label: 'Tactical Awareness', icon: <Shield className="h-4 w-4" /> },
    { key: 'physical' as const, label: 'Physical Profile', icon: <Dumbbell className="h-4 w-4" /> },
    { key: 'scanning' as const, label: 'Visual Scanning Frequency', icon: <UserCheck className="h-4 w-4" /> },
  ];

  // Get color for overall score
  const getOverallColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getOverallBg = (score: number) => {
    if (score >= 80) return "border-emerald-500/20 bg-emerald-950/10";
    if (score >= 60) return "border-amber-500/20 bg-amber-950/10";
    return "border-red-500/20 bg-red-950/10";
  };

  if (!playerId) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">No Player Selected</h2>
          <p className="text-gray-400 text-sm mt-2">
            Please select a player from the squad list
          </p>
          <Link
            href="/coach"
            className="mt-4 inline-block px-4 py-2 bg-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
          >
            Return to Squad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Navigation Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/coach"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              Grassroots Talent ID Matrix
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              {playerId} • {position} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/30 bg-emerald-950/20 text-emerald-400">
            <Award className="h-4 w-4" />
          </div>
        </div>

        {/* Biometric Profile */}
        {bioLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm text-gray-400">Loading biometric data...</span>
          </div>
        ) : bioError ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{bioError}</p>
          </div>
        ) : (
          <BiometricProfile
            data={biometricData}
            playerId={playerId}
            onRefresh={refreshBio}
            compact={false}
          />
        )}

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          {/* Form Assessment Panel */}
          <div className="lg:col-span-2 space-y-4 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Core Attributes Assessment
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefaults}
                  className="px-2 py-1 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-2 py-1 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <History className="h-3 w-3" />
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>

            {/* Position Selection */}
            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500">
                Target Core Position
              </label>
              <div className="mt-1 flex gap-2">
                {(["FW", "MID", "DEF", "GK"] as PositionType[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handlePositionChange(pos)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      position === pos
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Attribute Sliders */}
            <div className="space-y-4 pt-2">
              {attributeConfigs.map(({ key, label, icon }) => (
                <AttributeSlider
                  key={key}
                  label={label}
                  value={attributes[key]}
                  onChange={(value) => updateAttribute(key, value)}
                  icon={icon}
                  showComparison={teamAverages?.[key]}
                />
              ))}
            </div>

            {/* Notes Section */}
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase text-gray-500">
                Coach Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional observations, strengths, areas for development..."
                className="w-full mt-1 rounded-lg border border-gray-700 bg-gray-900/50 p-3 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                rows={3}
              />
            </div>
          </div>

          {/* Scouting Summary Panel */}
          <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/20 p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 text-center mb-4">
              Performance Index
            </h2>

            {/* Overall Score */}
            <div className="mx-auto flex h-32 w-32 flex-col justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-950/10 shadow-inner">
              <span className={`text-4xl font-black ${getOverallColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-widest">
                GRADE
              </span>
            </div>

            {/* Score Distribution */}
            <div className="mt-4 space-y-1">
              {attributeConfigs.map(({ key, label }) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${getOverallColor(attributes[key])}`}>
                    {attributes[key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Player Info */}
            <div className="mt-6 space-y-2">
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-3 py-2 text-left flex justify-between items-center">
                <span className="text-[11px] text-gray-400 uppercase font-medium">
                  Player ID
                </span>
                <span className="text-xs font-mono font-bold text-gray-200">
                  {playerId}
                </span>
              </div>
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-3 py-2 text-left flex justify-between items-center">
                <span className="text-[11px] text-gray-400 uppercase font-medium">
                  Position
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {position}
                </span>
              </div>
              {savedProfiles.length > 0 && (
                <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-3 py-2 text-left">
                  <span className="text-[11px] text-gray-400 uppercase font-medium block mb-1">
                    Previous Scores
                  </span>
                  <div className="flex gap-2">
                    {savedProfiles.slice(0, 3).map((profile, index) => (
                      <span 
                        key={index}
                        className="text-[10px] px-2 py-1 bg-gray-800 rounded-md"
                      >
                        {profile.overallScore}% 
                        <span className="text-gray-500 text-[8px] ml-1">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              {saveError && (
                <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">
                  {saveError}
                </div>
              )}
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Log Scouting Profile
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  // Navigate to player profile
                  window.location.href = `/coach/squad/${playerId}`;
                }}
                className="w-full rounded-xl border border-gray-700 py-2.5 text-xs font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                View Full Player Profile →
              </button>
            </div>
          </div>
        </div>

        {/* History Panel (Collapsible) */}
        {showHistory && savedProfiles.length > 0 && (
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h3 className="text-sm font-bold text-gray-400 mb-4">Assessment History</h3>
            <div className="space-y-3">
              {savedProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">
                        {profile.overallScore}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {profile.position}
                      </span>
                    </div>
                    {profile.notes && (
                      <p className="text-xs text-gray-500 mt-1">{profile.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(profile.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}