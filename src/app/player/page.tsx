"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import { AdBanner } from "@/components/ui/AdBanner";
import { 
  Dumbbell, 
  Activity, 
  Film, 
  UserCheck, 
  TrendingUp, 
  BookOpen, 
  Award,
  Zap,
  Target,
  Bell,
  ArrowRight
} from "lucide-react";

// --- Permanent Arena Premium Light Theme Colors ---
const COLORS = {
  bg: "#f4f2ee",     // Warm Off-White
  primary: "#1a5c2a", // Forest Green
  accent: "#c8962a",  // Gold
  border: "#e5e7eb"
};

export default function PlayerHubHomeDashboard() {
  // Split Zustand selectors strictly to prevent React #185 infinite re-render loops
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [hydrated, setHydrated] = useState(false);

  // Zustand Async Hydration Guard
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  if (!hydrated) return null;

  // Your Core Consolidated Player Workflow Hub Cards
  const playerWorkflowCards = [
    { 
      title: "Train Now", 
      sub: "Launch active training session schedules", 
      href: "/player/pitch", 
      icon: Activity, 
      bg: "bg-emerald-50", 
      text: "text-emerald-700" 
    },
    { 
      title: "Drills Library", 
      sub: "Access 500+ multi-sport structured exercises", 
      href: "/player/drills", 
      icon: Dumbbell, 
      bg: "bg-amber-50", 
      text: "text-amber-700" 
    },
    { 
      title: "My Passport", 
      sub: "Manage public shareable talent profiling passport", 
      href: "/player/passport", 
      icon: BookOpen, 
      bg: "bg-purple-50", 
      text: "text-purple-700" 
    },
    { 
      title: "Scout Profile", 
      sub: "Review AI evaluation rankings and market value", 
      href: "/player/talent-id", 
      icon: Target, 
      bg: "bg-blue-50", 
      text: "text-blue-700" 
    },
    { 
      title: "My Videos", 
      sub: "Highlight vault, showcases, & clip captures", 
      href: "/player/vault", 
      icon: Film, 
      bg: "bg-indigo-50", 
      text: "text-indigo-700" 
    },
    { 
      title: "My Journey", 
      sub: "Track continuous development progress points", 
      href: "/player/progress", 
      icon: TrendingUp, 
      bg: "bg-teal-50", 
      text: "text-teal-700" 
    },
    { 
      title: "Success Engine", 
      sub: "Configure active milestone mission logs", 
      href: "/player/goal", 
      icon: Zap, 
      bg: "bg-orange-50", 
      text: "text-orange-700" 
    },
    { 
      title: "Identity Verification", 
      sub: "Upload official ID and validation selfies", 
      href: "/player/verification", 
      icon: UserCheck, 
      bg: "bg-slate-50", 
      text: "text-slate-700" 
    }
  ];

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh" }} className="w-full antialiased text-gray-900 font-sans">
      {/* Sticky Premium Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-16">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-black tracking-wider flex items-center space-x-2">
            <span style={{ color: COLORS.primary }}>PLAYER</span>
            <span style={{ backgroundColor: COLORS.primary, color: "#fff" }} className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest">HUB</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/arena" className="text-xs font-bold text-gray-600 hover:text-gray-900 transition bg-gray-100 px-3 py-2 rounded-lg">
              Go to The Arena Feed
            </Link>
            <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: COLORS.primary }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
            </div>
          </div>
        </div>
      </nav>

      {/* Interface Grid Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Player Operations Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select an active operational component department to track metrics or launch core modules.
          </p>
        </div>

        {/* 8 Card Operations Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playerWorkflowCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <Link 
                href={card.href} 
                key={idx} 
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col justify-between hover:shadow-md transition group"
              >
                <div>
                  <div className={`p-3 rounded-xl inline-block ${card.bg} ${card.text} mb-4`}>
                    <IconComponent size={20} />
                  </div>
                  <h3 className="font-black text-gray-900 text-sm mb-1 group-hover:text-green-800 transition">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-4">
                    {card.sub}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto text-[11px] font-bold text-gray-400 group-hover:text-gray-700 transition">
                  <span>Open Module</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Banner Placement Slot */}
        <div className="mt-8">
          <AdBanner slot="sidebar-top" fallback={true} />
        </div>
      </div>
    </div>
  );
}