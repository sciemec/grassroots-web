"use client";

import Link from "next/link";
import { BarChart2, Target, Network, Map, TrendingUp, FileText, Lock, Layers } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const tools = [
  {
    icon: Target,
    title: "Live Match Collector",
    subtitle: "Log events on a real pitch — xG auto-calculated",
    href: "/analyst/live-match",
    bg: "bg-gradient-to-br from-[#006400] to-[#003d00]",
    live: true,
  },
  {
    icon: BarChart2,
    title: "xG & Shot Analysis",
    subtitle: "Post-match shot map with expected goals timeline",
    href: "/analyst/xg-analysis",
    bg: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]",
    live: true,
  },
  {
    icon: FileText,
    title: "AI Tactical Report",
    subtitle: "Claude generates a 5-section match report from your data",
    href: "/analyst/tactical-report",
    bg: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]",
    live: true,
  },
  {
    icon: Network,
    title: "Pass Map Network",
    subtitle: "Visual passing diagram — who played to who and where",
    href: "/analyst/pass-map",
    bg: "bg-gradient-to-br from-[#1a6b3c] to-[#0d3d20]",
    live: true,
  },
  {
    icon: Map,
    title: "Player Heatmaps",
    subtitle: "Where each player spent time on the pitch",
    href: "/analyst/heatmaps",
    bg: "bg-gradient-to-br from-[#d35400] to-[#a04000]",
    live: true,
  },
  {
    icon: TrendingUp,
    title: "Season Intelligence",
    subtitle: "Rolling xG, form guide, squad depth trends",
    href: "/analyst/season",
    bg: "bg-gradient-to-br from-[#7d6608] to-[#4a3d05]",
    live: true,
  },
  {
    icon: Layers,
    title: "Match Map",
    subtitle: "Tap pitch to log shots & passes together — live or post-match",
    href: "/analyst/match-map",
    bg: "bg-gradient-to-br from-[#c0392b] to-[#7b241c]",
    live: true,
  },
];

export default function AnalystHubPage() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Analyst Hub — Professional Analytics
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {user?.name?.split(" ")[0] ?? "Analyst"} 👋
          </h1>
          <p className="mt-0.5 text-sm italic text-accent/80">
            Match intelligence — Data that wins trophies
          </p>
        </div>

        {/* Tools grid */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
          Analytics Tools
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const card = (
              <div className={`relative rounded-2xl border border-white/10 p-5 transition-all ${
                tool.live
                  ? `${tool.bg} cursor-pointer hover:scale-[1.02] hover:shadow-lg`
                  : "bg-card/40 opacity-60 cursor-not-allowed"
              }`}>
                <Icon className="mb-3 h-6 w-6 text-white" />
                <p className="text-sm font-bold text-white">{tool.title}</p>
                <p className="mt-1 text-xs text-white/70">{tool.subtitle}</p>
                {!tool.live && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    <Lock className="h-2.5 w-2.5" /> Coming Soon
                  </span>
                )}
                {tool.live && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#f0b429] px-2 py-0.5 text-[10px] font-bold text-[#1a3a1a]">
                    LIVE
                  </span>
                )}
              </div>
            );
            return tool.live
              ? <Link key={tool.title} href={tool.href}>{card}</Link>
              : <div key={tool.title}>{card}</div>;
          })}
        </div>

        {/* Pitch to pro banner */}
        <div className="mt-6 rounded-2xl border border-[#f0b429]/30 bg-gradient-to-r from-[#f0b429]/10 to-transparent p-5">
          <p className="text-sm font-bold text-[#f0b429]">
            Professional Club Analytics — Powered by GrassRoots Sports
          </p>
          <p className="mt-1 text-xs text-white/60">
            The same data tools used by European clubs — built for Zimbabwe at $99/month.
            Wyscout charges €299/month. You pay less. You get more local context.
          </p>
        </div>

      </main>
    </div>
  );
}
