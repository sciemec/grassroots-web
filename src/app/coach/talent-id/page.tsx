"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Award, Shield, UserCheck, Zap, Crosshair, Dumbbell, Activity } from "lucide-react";

// Mock template structure for player positions
type PositionType = "FW" | "MID" | "DEF" | "GK";

interface AttributeScore {
  label: string;
  value: number;
  icon: any;
}

interface BiometricData {
  overallForm: number;
  explosivePower: number;
  symmetryScore: number;
  fatigueIndex: number;
  hasData: boolean;
  lastScanDate: string | null;
}

function loadBiometricData(playerId: string): BiometricData {
  try {
    const sessionsKey = `training_sessions_${playerId}`;
    const stored = localStorage.getItem(sessionsKey);
    if (stored) {
      const sessions = JSON.parse(stored);
      if (sessions && sessions.length > 0) {
        const latest = sessions[0];
        return {
          overallForm: latest.overallForm || latest.metrics?.overallForm || 0,
          explosivePower: latest.explosivePower || latest.metrics?.explosivePower || 0,
          symmetryScore: latest.symmetryScore || latest.metrics?.symmetryScore || 0,
          fatigueIndex: latest.fatigueIndex || latest.fatigue?.fatigueIndex || 0,
          hasData: true,
          lastScanDate: latest.timestamp || null,
        };
      }
    }
  } catch (e) {
    console.error("Failed to load biometric data", e);
  }
  
  return {
    overallForm: 0,
    explosivePower: 0,
    symmetryScore: 0,
    fatigueIndex: 0,
    hasData: false,
    lastScanDate: null,
  };
}

export default function TalentIDPage() {
  // Safe optional-chaining tracking pattern for Next.js search parameters
  const searchParams = useSearchParams();
  const playerId = searchParams?.get("player_id") ?? "";
  const initialPosition = (searchParams?.get("position") as PositionType) ?? "MID";

  const [position, setPosition] = useState<PositionType>(initialPosition);
  const [metrics, setMetrics] = useState<Record<string, number>>({
    pace: 70,
    technical: 65,
    tactical: 60,
    physical: 75,
    scanning: 55,
  });
  
  const [biometricData, setBiometricData] = useState<BiometricData>({
    overallForm: 0,
    explosivePower: 0,
    symmetryScore: 0,
    fatigueIndex: 0,
    hasData: false,
    lastScanDate: null,
  });

  // Load biometric data when playerId is available
  useEffect(() => {
    if (playerId) {
      const bio = loadBiometricData(playerId);
      setBiometricData(bio);
    }
  }, [playerId]);

  const handleMetricChange = (key: string, value: number) => {
    setMetrics((prev) => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, value)),
    }));
  };

  const attributes: AttributeScore[] = [
    { label: "Pace & Acceleration", key: "pace", icon: Zap },
    { label: "Technical Execution", key: "technical", icon: Crosshair },
    { label: "Tactical Awareness", key: "tactical", icon: Shield },
    { label: "Physical Profile", key: "physical", icon: Dumbbell },
    { label: "Visual Scanning Frequency", key: "scanning", icon: UserCheck },
  ].map((attr) => ({
    label: attr.label,
    value: metrics[attr.key],
    icon: attr.icon,
  }));

  // Calculate generic Grassroots Scouting Grade index
  const overallScoutingScore = Math.round(
    Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length
  );

  // Get color for form score
  const getFormColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  // Get fatigue display
  const getFatigueDisplay = (fatigue: number) => {
    if (fatigue > 60) return { text: "High", color: "text-red-500" };
    if (fatigue > 30) return { text: "Moderate", color: "text-amber-500" };
    return { text: "Low", color: "text-emerald-500" };
  };

  const fatigueDisplay = getFatigueDisplay(biometricData.fatigueIndex);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
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
              Technical Scouting & Performance Mapping
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-900/30 bg-emerald-950/20 text-emerald-400">
            <Award className="h-4 w-4" />
          </div>
        </div>

        {/* Biometric Profile Card - NEW SECTION */}
        {biometricData.hasData && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-bold text-white">Biometric Profile</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400">AI Verified</span>
              </div>
              {playerId && (
                <Link 
                  href={`/coach/squad/${playerId}`} 
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View Full History →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] text-gray-400">Overall Form</p>
                <p className={`text-2xl font-bold ${getFormColor(biometricData.overallForm)}`}>
                  {biometricData.overallForm || "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Explosive Power</p>
                <p className="text-2xl font-bold text-white">{biometricData.explosivePower || "—"}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Movement Symmetry</p>
                <p className="text-2xl font-bold text-white">{biometricData.symmetryScore || "—"}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400">Fatigue Index</p>
                <p className={`text-2xl font-bold ${fatigueDisplay.color}`}>
                  {biometricData.fatigueIndex || "—"}
                </p>
                <p className={`text-[8px] ${fatigueDisplay.color}`}>{fatigueDisplay.text}</p>
              </div>
            </div>
            {biometricData.lastScanDate && (
              <p className="mt-3 text-[9px] text-gray-500 text-right">
                Last scan: {new Date(biometricData.lastScanDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* No Biometric Data Warning */}
        {!biometricData.hasData && playerId && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-amber-400">
                No biometric data available for this player.
              </p>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              Ask the player to complete a movement scan at /player/biomechanics
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Form Assessment Input Panel */}
          <div className="md:col-span-2 space-y-4 rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Live Core Attributes Entry
            </h2>
            
            {/* Position Select Profile */}
            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500">Target Core Position</label>
              <div className="mt-1 flex gap-2">
                {(["FW", "MID", "DEF", "GK"] as PositionType[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos)}
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

            {/* Slider Interfaces */}
            <div className="space-y-4 pt-2">
              {[
                { name: "Pace & Acceleration", key: "pace" },
                { name: "Technical Execution", key: "technical" },
                { name: "Tactical Awareness", key: "tactical" },
                { name: "Physical Profile", key: "physical" },
                { name: "Visual Scanning Frequency", key: "scanning" },
              ].map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-300">{item.name}</span>
                    <span className="font-bold text-emerald-400">{metrics[item.key]}/100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={metrics[item.key]}
                    onChange={(e) => handleMetricChange(item.key, parseInt(e.target.value))}
                    className="w-full accent-emerald-500 bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scouting Assessment Scoring Output Summary */}
          <div className="flex flex-col justify-between rounded-xl border border-gray-800 bg-gray-900/20 p-5 text-center">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                Performance Index
              </h2>
              <div className="mx-auto flex h-28 w-28 flex-col justify-center rounded-full border-4 border-emerald-500/20 bg-emerald-950/10 shadow-inner">
                <span className="text-4xl font-black text-white">{overallScoutingScore}</span>
                <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-widest">GRADE</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-3 py-2 text-left flex justify-between items-center">
                <span className="text-[11px] text-gray-400 uppercase font-medium">Scouted ID</span>
                <span className="text-xs font-mono font-bold text-gray-200">{playerId || "GENERIC_ROOT"}</span>
              </div>
              <div className="rounded-lg bg-gray-900/80 border border-gray-800 px-3 py-2 text-left flex justify-between items-center">
                <span className="text-[11px] text-gray-400 uppercase font-medium">Position Matrix</span>
                <span className="text-xs font-bold text-emerald-400">{position} Evaluation</span>
              </div>
            </div>

            <button
              onClick={() => alert(`Saved data parameters for Assessment Score: ${overallScoutingScore}`)}
              className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition-all"
            >
              Log Scouting Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}