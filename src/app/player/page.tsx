"use client";

import Link from "next/link";
import { 
  Trophy, 
  Target, 
  Flame, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  User, 
  Compass,
  Zap,
  BookOpen,
  Apple,
  Award
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { POSITION_FOCUS_MAP } from "@/config/position-focus";

export default function PlayerHubDashboardPage() {
  // FIXED: Explicit isolated selector stops infinite rendering loops instantly
  const user = useAuthStore((state) => state.user);
  
  // Safe position alignment lookup matching your configuration structure
  const rawPosition = (user?.position || "striker").toLowerCase();
  const currentFocus = POSITION_FOCUS_MAP[rawPosition] || POSITION_FOCUS_MAP.striker;

  // Track components list strictly mapped to light-theme premium specifications
  const actionTracks = [
    {
      title: "Positional Drill Academy",
      subtitle: "Access targeted training circuits curated specifically for your profile.",
      href: "/player/drills",
      icon: Target,
      accent: "bg-emerald-50 text-[#1a5c2a] border border-emerald-100",
      badge: "🎯 Specialized Track"
    },
    {
      title: "My Digital Talent Passport",
      subtitle: "Review your verified school profiles, academic averages, and share your public athletic CV.",
      href: "/player/passport", // ✅ FIXED: Bound cleanly to your built talent passport route
      icon: BookOpen,
      accent: "bg-purple-50 text-purple-700 border border-purple-100",
      badge: "📋 Passport Active"
    },
    {
      title: "Nutrition & Fuel Engine",
      subtitle: "Log daily traditional meal variations, caloric constraints, and look over personalized active diet plans.",
      href: "/player/nutrition", // ✅ FIXED: Bound cleanly to your built nutrition feature route
      icon: Apple,
      accent: "bg-amber-50 text-[#c8962a] border border-amber-200",
      badge: "🥗 Fuel Engine Active"
    },
    {
      title: "Matchday Live Center",
      subtitle: "View tactical text commentary streams, live radio feeds, and scores.",
      href: "/fan/live-commentary",
      icon: Trophy,
      accent: "bg-red-50 text-red-600 border border-red-100",
      badge: "⚽ In-Play Arena"
    },
    {
      title: "Physical Conditioning & Form",
      subtitle: "Monitor dynamic performance metrics, speed loads, and attributes.",
      href: "/player/fitness",
      icon: Activity,
      accent: "bg-blue-50 text-blue-700 border border-blue-100",
      badge: "⚡ Bio Analytics"
    },
    {
      title: "Milestones & Career Trophies",
      subtitle: "Browse your full historical log of matching team career breakthroughs and performance honors.",
      href: "/player/progress", // ✅ FIXED: Bound cleanly to your merged milestones track
      icon: Award,
      accent: "bg-orange-50 text-orange-600 border border-orange-100",
      badge: "✨ Career Milestones"
    }
  ];

  return (
    // CONTAINER CANVAS: Standard institutional light grey background framework
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        
        {/* TOP GREETING BOX: Clean white container card overlaying crisp dark text */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">
              Athlete Development — Grassroots Track
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              Welcome Back, {user?.name?.split(" ")[0] ?? "Player"}! 👋
            </h1>
            <p className="mt-1 text-sm font-medium italic text-[#1a5c2a]">
              Train Smart. Build Profile. Get Scouted.
            </p>
          </div>

          {/* DYNAMIC POSITION TRACK CHIP: High visibility custom Tailwind mapping badges */}
          <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs text-center shrink-0 self-start sm:self-center ${currentFocus.badgeColor}`}>
            ⚽ {currentFocus.title}
          </div>
        </div>

        {/* HIGH-VISIBILITY PROFILE SUMMARY SUMMARY STRIP: Highlights tracking goals */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          
          {/* Highlight 1: Gold Box High Contrast Component for vital metrics */}
          <div className="bg-[#f0b429] text-[#1c3d22] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-85">Weekly Milestone</p>
              <h3 className="text-xl font-black mt-1">3x 10km Running Run</h3>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Flame size={20} />
            </div>
          </div>

          {/* Highlight 2: White High-Contrast Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Workouts</p>
              <h3 className="text-2xl font-black mt-1 text-gray-900">Ready to Review</h3>
            </div>
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
              <Zap size={20} />
            </div>
          </div>

          {/* Highlight 3: White High-Contrast Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Scout Visibility Status</p>
              <h3 className="text-sm font-black text-emerald-700 mt-2 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-block w-fit">
                ● Live on Talent Hub
              </h3>
            </div>
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
              <Compass size={20} />
            </div>
          </div>

        </div>

        {/* Positional Targeted Matrix Strategy Focus Guidelines Block */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
            Your Positional Physical Focus Specialization
          </p>
          <div className="flex flex-wrap gap-2">
            {currentFocus.physicalFocus.map((attribute) => (
              <span 
                key={attribute}
                className="bg-gray-100 border border-gray-200 text-gray-800 px-3 py-1.5 rounded-xl text-xs font-bold capitalize"
              >
                ⚡ {attribute.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Platform Core Utilities Action Track Grid List */}
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">
          Player Academy Modules
        </p>

        <div className="space-y-3">
          {actionTracks.map((track) => {
            const IconComponent = track.icon;
            return (
              <Link
                key={track.title}
                href={track.href}
                className="group w-full rounded-2xl border border-gray-200 p-5 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#1a5c2a] hover:shadow-md"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* High Density Accent Icon Box Container */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${track.accent}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    {/* TITLE: High density absolute charcoal black prevents text dropouts */}
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1a5c2a] transition-colors">
                      {track.title}
                    </h3>
                    {/* SUBTITLE: Highly readable slate tone for details */}
                    <p className="text-xs text-gray-500 font-medium mt-0.5 max-w-2xl leading-relaxed">
                      {track.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-gray-50 pt-3 sm:pt-0 sm:border-0">
                  {/* Track Status Highlight Badge Tag */}
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#f0b429] text-[#1c3d22] px-2.5 py-1 rounded-xl shadow-xs">
                    {track.badge}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all hidden sm:block" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Educational/Sports Technology Insight Panel Banner */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] shrink-0">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Your personal tracking metric logs sync directly across local high school team registers and active academy scouting databases automatically to accelerate player identification loops.
          </p>
        </div>

      </main>
    </div>
  );
}