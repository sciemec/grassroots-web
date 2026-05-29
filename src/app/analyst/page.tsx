"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { BarChart2, Target, Network, Map, TrendingUp, FileText, Lock, Layers, Activity, Brain, Camera, Scan } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

// Dynamic import — MediaPipe uses browser globals, must skip SSR
const BiometricScanner = dynamic(() => import("@/components/BiometricScanner"), { ssr: false });

const tools = [
  {
    icon: Camera,
    title: "Match Eye",
    subtitle: "Upload a match video. Gemini watches it natively. Claude writes the full tactical report.",
    href: "/analyst/match-eye",
    live: true,
    featured: true,
  },
  {
    icon: Brain,
    title: "Match Brain",
    subtitle: "One session. Six outputs. Touch, xG, passes, heatmaps, zones & AI report — all synced.",
    href: "/analyst/match-brain",
    live: true,
    featured: true,
  },
  {
    icon: Target,
    title: "Live Match Collector",
    subtitle: "Log events on a real pitch — xG metrics auto-calculated from coordinates instantly.",
    href: "/analyst/live-match",
    live: true,
  },
  {
    icon: BarChart2,
    title: "xG & Shot Analysis",
    subtitle: "Post-match shot map with expected goals rolling timeline tracking logs.",
    href: "/analyst/xg-analysis",
    live: true,
    matchEye: true,
  },
  {
    icon: FileText,
    title: "AI Tactical Report",
    subtitle: "Claude generates a professional, complete 5-section match report from your dataset.",
    href: "/analyst/tactical-report",
    live: true,
    matchEye: true,
  },
  {
    icon: Network,
    title: "Pass Map Network",
    subtitle: "Visual passing matrix diagram — who played to who and where spatial zones overlay.",
    href: "/analyst/pass-map",
    live: true,
  },
  {
    icon: Map,
    title: "Player Heatmaps",
    subtitle: "Where each specific squad player spent high-intensity time on the pitch.",
    href: "/analyst/heatmaps",
    live: true,
    matchEye: true,
  },
  {
    icon: TrendingUp,
    title: "Season Intelligence",
    subtitle: "Rolling team xG charts, form guides, and squad positional depth trends.",
    href: "/analyst/season",
    live: true,
    matchEye: true,
  },
  {
    icon: Layers,
    title: "Match Map",
    subtitle: "Tap pitch canvas to log shots & passes together — live or post-match workflow.",
    href: "/analyst/match-map",
    live: true,
  },
  {
    icon: Activity,
    title: "Smart Touch Tracker",
    subtitle: "Tap player numbers on touches — AI infers formation changes, zones & key players.",
    href: "/analyst/touch-tracker",
    live: true,
  },
  {
    icon: Scan,
    title: "Biometric Scan",
    subtitle: "Open camera or upload a clip — MediaPipe draws the skeleton and scores technique live.",
    href: "#biometric",
    live: true,
    featured: true,
    biometric: true,
  },
];

export default function AnalystHubPage() {
  // FIXED: Split primitive selector completely insulates against React #185 loops
  const user = useAuthStore((state) => state.user);
  const [hasMatchEye, setHasMatchEye] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gs_match_eye_last");
      setHasMatchEye(!!raw);
    } catch {}
  }, []);

  return (
    // FIXED: Upgraded container to standard institutional light canvas bg layout
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">
            Analyst Hub — Professional Analytics
          </p>
          <h1 className="mt-1 text-2xl font-black text-gray-900">
            {user?.name?.split(" ")[0] ?? "Analyst"} 👋
          </h1>
          <p className="mt-1 text-sm font-medium italic text-[#1a5c2a]">
            Match intelligence — Data that wins trophies
          </p>
        </div>

        {/* Tools Grid Area */}
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">
          Analytics Tools
        </p>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const card = (
              // FIXED: Re-templated cards to match clean white backgrounds with dark green branding pop
              <div className={`relative h-full rounded-2xl border border-gray-200 p-5 bg-white shadow-sm transition-all flex flex-col justify-between ${
                tool.live
                  ? "cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-[#1a5c2a]"
                  : "opacity-50 cursor-not-allowed bg-gray-50"
              }`}>
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white bg-[#1a5c2a]`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-base font-bold text-gray-900 group-hover:text-[#1a5c2a]">
                    {tool.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                    {tool.subtitle}
                  </p>
                </div>

                {/* Badge Overlay Layout Placements */}
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end min-h-[24px]">
                  {!tool.live && (
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 border border-gray-200">
                      <Lock className="h-2.5 w-2.5" /> Coming Soon
                    </span>
                  )}
                  {tool.live && !tool.featured && !('matchEye' in tool && hasMatchEye) && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-[#1a5c2a]">
                      LIVE
                    </span>
                  )}
                  {'matchEye' in tool && hasMatchEye && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                      <Camera className="h-2.5 w-2.5" /> Match Eye Data
                    </span>
                  )}
                  {tool.featured && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-black text-[#c8962a]">
                      NEW
                    </span>
                  )}
                </div>
              </div>
            );

            if ('biometric' in tool) {
              return (
                <button
                  key={tool.title}
                  className="group text-left"
                  onClick={() => document.getElementById("biometric")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {card}
                </button>
              );
            }

            return tool.live
              ? <Link key={tool.title} href={tool.href} className="group">{card}</Link>
              : <div key={tool.title}>{card}</div>;
          })}
        </div>

        {/* Inline Biometric Scanner — opens camera right here, no navigation */}
        <div className="mt-6" id="biometric">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">
            Biometric Body Analysis
          </p>
          <BiometricScanner />
        </div>

        {/* Pitch to Pro Banner Panel */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] shrink-0 mt-0.5">
              <SparklesIcon className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                Professional Club Analytics — Powered by GrassRoots Sports
              </p>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed max-w-3xl">
                The same digital data structures utilized by top-tier elite European academies — custom built for the local Zimbabwean sports ecosystem at $99/month. Global competitors charge up to €299/month without any local NASH/NAPH or ZIFA regional context leagues integration metrics.
              </p>
            </div>
          </div>
          <Link 
            href="/player/subscription"
            className="bg-[#1a5c2a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-green-800 transition-colors whitespace-nowrap"
          >
            Upgrade Department
          </Link>
        </div>

      </main>
    </div>
  );
}

// Simple fallback icon for helper banner utility mapping
function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.813zM18.25 5.25L17.5 8l-.75-2.75L14 4.5l2.75-.75L17.5 1l.75 2.75L21 4.5l-2.75.75z" />
    </svg>
  );
}