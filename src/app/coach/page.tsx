"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import AdBanner from "@/components/ui/AdBanner";
import { 
  Users, 
  Activity, 
  Dumbbell, 
  ClipboardList, 
  School, 
  TrendingUp, 
  Zap, 
  ShieldAlert, 
  Target,
  LogOut,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";

// --- Permanent Arena Premium Light Theme Colors ---
const COLORS = {
  bg: "#f4f2ee",     // Warm Off-White
  primary: "#1a5c2a", // Forest Green
  accent: "#c8962a",  // Gold
  border: "#e5e7eb",
  textMain: "#111827",
  textMuted: "#6b7280"
};

export default function CoachHubDashboard() {
  const router = useRouter();
  
  // FIXED: Split selectors to strictly prevent React #185 infinite re-render loops
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [hydrated, setHydrated] = useState(false);
  const [selectedRoleFocus, setSelectedRoleFocus] = useState("head_coach");
  const [statsSummary, setStatsSummary] = useState({
    squadCount: 0,
    activeDrills: 0,
    criticalRisks: 0,
    winRate: "0%"
  });

  // Zustand Async Hydration Guard
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  // Fetch Summary Metadata safely
  useEffect(() => {
    if (!hydrated) return;

    setStatsSummary({
      squadCount: 18,
      activeDrills: 14,
      criticalRisks: 1,
      winRate: "64%"
    });
  }, [hydrated]);

  if (!hydrated) return null;

  // Determine dynamic target link for Department 3 based on inline focus selector
  const getDrillsLink = () => {
    if (selectedRoleFocus === "attack") return "/player/drills?focus=attack";
    if (selectedRoleFocus === "defense") return "/player/drills?focus=defense";
    return "/player/drills?role=head_coach";
  };

  // The 9 Strategic Coaching Departments Config Array
  const departments = [
    {
      id: "tactical-command",
      title: "1. Tactical Command & Live Match",
      description: "Log dynamic events in real-time. Execute multi-sport lineups and formation changes instantly.",
      link: "/coach/live-match",
      icon: Activity,
      color: COLORS.primary,
      badge: "Live Analyst",
      isCustomDrillSlot: false
    },
    {
      id: "squad-analytics",
      title: "2. Squad Performance Analytics",
      description: "Access the complete player roster, review physical metrics, and manage core DNA profiling catalogs.",
      link: "/coach/squad",
      icon: Users,
      color: COLORS.primary,
      badge: "Roster Management",
      isCustomDrillSlot: false
    },
    {
      id: "drills-library",
      title: "3. Drills & Session Planner",
      description: "Access 500+ structured exercises. Adjust the filter scope below to automatically target your coaching assignment.",
      link: getDrillsLink(), // Dynamically configured filter route
      icon: Dumbbell,
      color: COLORS.accent,
      badge: "500+ Exercises",
      isCustomDrillSlot: true
    },
    {
      id: "match-intel",
      title: "4. Match Intel & Logs",
      description: "Review comprehensive historical schedules, tournament outcomes, and season statistics maps.",
      link: "/coach/matches",
      icon: Calendar,
      color: COLORS.primary,
      badge: "Historical Logs",
      isCustomDrillSlot: false
    },
    {
      id: "school-leagues",
      title: "5. School Leagues (NASH/NAPH)",
      description: "Pre-load tournament structures, submit official match outcomes, and track nationwide brackets.",
      link: "/school-leagues",
      icon: School,
      color: COLORS.primary,
      badge: "Tournament Board",
      isCustomDrillSlot: false
    },
    {
      id: "strategic-patterns",
      title: "6. Strategic Team Patterns",
      description: "Detect compounding squad errors and load customized THUTO 4-week strategic fixes instantly.",
      link: "/coach/patterns",
      icon: TrendingUp,
      color: COLORS.primary,
      badge: "AI Prescriptions",
      isCustomDrillSlot: false
    },
    {
      id: "squad-chemistry",
      title: "7. Squad Chemistry Matrix",
      description: "Analyse team cohesion with our 32-dimensional style fingerprint matching network map.",
      link: "/coach/chemistry",
      icon: Zap,
      color: COLORS.accent,
      badge: "Style Matching",
      isCustomDrillSlot: false
    },
    {
      id: "injury-radar",
      title: "8. Injury Prevention Radar",
      description: "Track biometric training loads and intensity scaling using advanced XGBoost risk scores.",
      link: "/injury-tracker",
      icon: ShieldAlert,
      color: "#ce1126", 
      badge: "Biometric Safety",
      isCustomDrillSlot: false
    },
    {
      id: "set-pieces",
      title: "9. Set Piece Engineering",
      description: "Log set piece variations. Track success weights on corners and free kicks to exploit team openings.",
      link: "/coach/set-pieces",
      icon: Target,
      color: COLORS.primary,
      badge: "Tactical Design",
      isCustomDrillSlot: false
    }
  ];

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh" }} className="w-full antialiased text-gray-900 font-sans">
      {/* Sticky Premium White Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-xl font-black tracking-wider flex items-center space-x-2">
              <span style={{ color: COLORS.primary }}>COACH</span>
              <span style={{ backgroundColor: COLORS.primary, color: "#fff" }} className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest">HUB</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/arena" className="text-xs font-bold text-gray-600 hover:text-gray-900 transition bg-gray-100 px-3 py-2 rounded-lg">
              Go to The Arena Feed
            </Link>
            <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: COLORS.primary }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
            </div>
            <button onClick={() => logout()} className="text-gray-500 hover:text-red-600 transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Structural Hub Layout Interface */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Top Operational Status Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                Welcome Back, Coach {user?.name || "Nigel"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your training workflows, plan sessions, and exploit performance intelligence across all departments.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
              <Sparkles size={16} style={{ color: COLORS.accent }} />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                THUTO AI Connected
              </span>
            </div>
          </div>

          {/* Quick Stats Metric Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-gray-100 pt-6">
            <div className="p-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Squad Size</div>
              <div className="text-xl font-black mt-1" style={{ color: COLORS.primary }}>{statsSummary.squadCount} Athletes</div>
            </div>
            <div className="p-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Drills</div>
              <div className="text-xl font-black mt-1" style={{ color: COLORS.accent }}>{statsSummary.activeDrills} Active</div>
            </div>
            <div className="p-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Win-Rate</div>
              <div className="text-xl font-black mt-1 text-gray-800">{statsSummary.winRate}</div>
            </div>
            <div className="p-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Injury Warnings</div>
              <div className="text-xl font-black mt-1 text-red-600">{statsSummary.criticalRisks} Flagged</div>
            </div>
          </div>
        </div>

        {/* Dynamic 9-Department Matrix Layout Grid */}
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
          Coaching Operations Matrix (9 Connected Departments)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const IconComponent = dept.icon;

            // DEPARTMENT 3 CUSTOM HOOK FRAMEWORK SLOT
            if (dept.isCustomDrillSlot) {
              return (
                <div 
                  key={dept.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                        className="p-3 rounded-xl"
                      >
                        <IconComponent size={22} />
                      </div>
                      <span 
                        style={{ color: COLORS.accent, backgroundColor: `${COLORS.accent}08` }}
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded"
                      >
                        {dept.badge}
                      </span>
                    </div>

                    <h3 className="font-black text-gray-900 text-base mb-2">
                      {dept.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                      {dept.description}
                    </p>

                    {/* Clean Inline Segmented Strategy Toggles */}
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl mb-2 text-[11px] font-bold text-center">
                      <button 
                        onClick={() => setSelectedRoleFocus("head_coach")}
                        className={`py-1.5 rounded-lg transition ${selectedRoleFocus === "head_coach" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                      >
                        Tactics
                      </button>
                      <button 
                        onClick={() => setSelectedRoleFocus("attack")}
                        className={`py-1.5 rounded-lg transition ${selectedRoleFocus === "attack" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                      >
                        Attack
                      </button>
                      <button 
                        onClick={() => setSelectedRoleFocus("defense")}
                        className={`py-1.5 rounded-lg transition ${selectedRoleFocus === "defense" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                      >
                        Defence
                      </button>
                    </div>
                  </div>

                  <Link href={dept.link} className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto w-full group">
                    <span className="text-xs font-bold text-gray-700 transition">
                      Launch Aligned Drills
                    </span>
                    <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 group-hover:text-green-700 transition-all" />
                  </Link>
                </div>
              );
            }

            // Standard Department Layout Rendering Card
            return (
              <Link 
                href={dept.link} 
                key={dept.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 p-6 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                      className="p-3 rounded-xl transition"
                    >
                      <IconComponent size={22} />
                    </div>
                    <span 
                      style={{ color: dept.color === COLORS.primary ? COLORS.primary : dept.color, backgroundColor: `${dept.color}08` }}
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded"
                    >
                      {dept.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-base mb-2 group-hover:text-green-800 transition">
                    {dept.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6">
                    {dept.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-700 transition">
                    Launch Module
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 group-hover:text-green-700 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Sidebar Ad Unit slot placement configuration */}
        <div className="mt-8">
          <AdBanner slot="sidebar-top" fallback={true} />
        </div>

      </div>
    </div>
  );
}