"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Users, 
  ClipboardSignature, 
  TrendingUp, 
  Calendar, 
  ShieldAlert, 
  Award, 
  Layers, 
  Flame, 
  UserCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const coachingTools = [
  {
    icon: Users,
    title: "Squad Management & Roster",
    subtitle: "Track physical attendance logs, profile depth positions, and active developmental metrics per player.",
    href: "/coach/squad",
    live: true,
    badge: "Active Roster"
  },
  {
    icon: ClipboardSignature,
    title: "Tactical Board & Formations",
    subtitle: "Design match base-shapes, deploy set-piece routines, and assign phase-of-play assignments.",
    href: "/coach/tactics",
    live: true,
    featured: true
  },
  {
    icon: Calendar,
    title: "Training Session Planner",
    subtitle: "Schedule physical conditioning phases, specific technical drills, and tactical game rehearsals.",
    href: "/coach/training",
    live: true
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics Engine",
    subtitle: "Review combined session data maps, expected goal trends, and post-match player performance scores.",
    href: "/coach/analytics",
    live: true
  },
  {
    icon: ShieldAlert,
    title: "Injury Tracker & Medical",
    subtitle: "Monitor sports medical rehabilitation status parameters, physical load metrics, and squad return timelines.",
    href: "/coach/medical",
    live: true
  },
  {
    icon: Award,
    title: "Scouting Reports & Targets",
    subtitle: "Log recruitment pipeline evaluations, local school filter watchlists, and opposition data metrics.",
    href: "/coach/scouting",
    live: true
  }
];

export default function CoachHubDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    // CONTAINER CANVAS: Standard institutional light background mapping
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        
        {/* Main Dashboard Header Card Component */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">
            Managerial Framework — Technical Department
          </p>
          <h1 className="mt-1 text-2xl font-black text-gray-900">
            Coach {user?.name?.split(" ")[0] ?? "Manager"} Dashboard 👋
          </h1>
          <p className="mt-1 text-sm font-medium italic text-[#1a5c2a]">
            Elite Team Supervision — Tailored for Strategic Local Football Governance
          </p>
        </div>

        {/* HIGH-VISIBILITY METRIC STRIP: Combined Deep Green & Gold Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          
          {/* Metric 1: Gold Performance Card Block */}
          <div className="bg-[#f0b429] text-[#1c3d22] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-80">Season Win Ratio</p>
              <h3 className="text-2xl font-black mt-1">78.4%</h3>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Flame size={20} />
            </div>
          </div>

          {/* Metric 2: White High-Contrast Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Squad Pool</p>
              <h3 className="text-2xl font-black mt-1 text-gray-900">28 Players</h3>
            </div>
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
              <UserCheck size={20} />
            </div>
          </div>

          {/* Metric 3: White High-Contrast Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Next Matchday Fix</p>
              <h3 className="text-sm font-black mt-1.5 text-gray-900 truncate">vs CAPS United (H)</h3>
            </div>
            <div className="bg-emerald-50 text-[#1a5c2a] p-2.5 rounded-xl border border-emerald-100">
              <Layers size={20} />
            </div>
          </div>

        </div>

        {/* Primary Operational Grid Area */}
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">
          Technical Utilities
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coachingTools.map((tool) => {
            const IconComponent = tool.icon;
            
            return (
              <Link 
                key={tool.title} 
                href={tool.href}
                className="group h-full rounded-2xl border border-gray-200 p-5 bg-white shadow-sm transition-all flex flex-col justify-between hover:scale-[1.02] hover:shadow-md hover:border-[#1a5c2a]"
              >
                <div>
                  {/* Icon Frame Block: High density Forest Green container box */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white bg-[#1a5c2a]">
                    <IconComponent size={20} />
                  </div>
                  
                  {/* TITLE: High density charcoal font prevents clipping visualization failures */}
                  <p className="text-base font-bold text-gray-900 group-hover:text-[#1a5c2a] transition-colors">
                    {tool.title}
                  </p>
                  
                  {/* SUBTITLE: Highly visible medium slate tone offers crystal-clear contextual data */}
                  <p className="mt-2 text-xs leading-relaxed text-gray-600 font-medium">
                    {tool.subtitle}
                  </p>
                </div>

                {/* Badge Bottom Footer Row Panel */}
                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between min-h-[24px]">
                  {tool.badge ? (
                    // HIGH CONTRAST CHIP: Premium Yellow highlighting tag for operational text visibility parameters
                    <span className="rounded-full bg-[#f0b429] text-[#1c3d22] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {tool.badge}
                    </span>
                  ) : tool.featured ? (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-[#c8962a]">
                      RECOMMENDED SYSTEM
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-[#1a5c2a]">
                      READY
                    </span>
                  )}
                  
                  <ChevronRight size={14} className="text-gray-400 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pro Infrastructure Notice Banner Block */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Advanced Grassroots Sports Coaching Ecosystem Configuration
              </p>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed max-w-4xl font-medium">
                Integrate real-time metric inputs collected natively via the live data ingestion collectors. These logs automatically synchronize with historical profile files across secondary school registries, enabling decentralized performance auditing without legacy hardware investments.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}