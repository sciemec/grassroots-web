"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, UserSearch, Star, FileText, GitCompare,
  Radio, ChevronRight, Trophy, Zap, ShieldCheck,
  GraduationCap, Flame, TrendingUp, Video, Users, Network,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { LiveMatchBanner } from "@/components/LiveMatchBanner";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const WIRE = [
  "K.M. (U17 Striker, Harare) clocked 2.84s sprint · open for scouting",
  "3 new Rising Stars detected in Bulawayo province this week",
  "T.N. (U13 Midfielder, Masvingo) cleared 45cm vertical leap — high potential flag",
  "Showcase clip by S.G. (Wingback, Manicaland) now has 24 scout views",
  "Munhumutapa 2026 — 47 players registered across U14 & U16 categories",
  "THUTO Talent Engine updated rankings — 5 new continental-level prospects",
];

const FEATURES = [
  {
    href: "/arena/discover",
    icon: UserSearch,
    iconBg: "#dcfce7", iconColor: "#16a34a",
    label: "Discover Players",
    desc: "Search · filter · follow talent",
  },
  {
    href: "/scout/shortlist",
    icon: Star,
    iconBg: "#fef3c7", iconColor: "#d97706",
    label: "My Shortlist",
    desc: "Saved players · watchlist",
  },
  {
    href: "/scout/reports",
    icon: FileText,
    iconBg: "#f3e8ff", iconColor: "#9333ea",
    label: "PDF Reports",
    desc: "AI scouting reports · Claude analysis",
  },
  {
    href: "/scout/compare",
    icon: GitCompare,
    iconBg: "#dbeafe", iconColor: "#2563eb",
    label: "Compare Players",
    desc: "Side-by-side stat comparison",
  },
  {
    href: "/talent-leaderboard",
    icon: TrendingUp,
    iconBg: "#fce7f3", iconColor: "#db2777",
    label: "Rising Stars",
    desc: "THUTO rankings · top-rated talent",
  },
  {
    href: "/arena/recruitment",
    icon: Users,
    iconBg: "#e0f2fe", iconColor: "#0284c7",
    label: "Recruitment Board",
    desc: "Talent-wanted postings · applicants",
  },
  {
    href: "/fan-hub",
    icon: Video,
    iconBg: "#ecfdf5", iconColor: "#059669",
    label: "Showcase Clips",
    desc: "AI-rated skill videos · highlights",
  },
  {
    href: "/arena/network",
    icon: Network,
    iconBg: "#ede9fe", iconColor: "#7c3aed",
    label: "My Network",
    desc: "Connections · followers · messages",
  },
  {
    href: "/scout/profile",
    icon: ShieldCheck,
    iconBg: "#f0fdf4", iconColor: "#15803d",
    label: "Scout Profile",
    desc: "Credentials · accreditation · bio",
  },
];

export default function ScoutHubPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const [wireIndex, setWireIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWireIndex((p) => (p + 1) % WIRE.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "scout" && user.role !== "admin") router.replace("/arena");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f4f2ee" }}>
        <Activity className="animate-spin" size={28} style={{ color: "#1a5c2a" }} />
      </div>
    );
  }

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "SC";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>

      {/* Brand header */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>
              GRS
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider leading-none" style={{ color: "#f0b429" }}>GrassRoots Sports</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,180,41,0.7)" }}>Scout Hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <GraduationCap size={14} style={{ color: "#f0b429" }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>Education Partner</p>
              <p className="text-[10px] font-black uppercase" style={{ color: "#f0b429" }}>Teach For Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live wire ticker */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1 rounded text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ backgroundColor: "#dc2626" }}>
            <Radio size={9} className="animate-pulse" /> Live Wire
          </span>
          <p className="text-xs font-semibold truncate" style={{ color: "#92400e" }}>
            {WIRE[wireIndex]}
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          {/* Dark green top */}
          <div className="relative px-5 pt-6 pb-5"
            style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 60%, #0f3320 100%)" }}>
            {/* Chevron watermark */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent 0,transparent 8px,#f0b429 8px,#f0b429 10px)" }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{greeting()},</p>
                <h2 className="text-2xl font-black text-white mt-0.5 leading-tight truncate">{user.name || "Scout"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.25)" }}>
                    <ShieldCheck size={9} /> Scout · Active
                  </span>
                  {user.province && (
                    <span className="text-[10px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
                      📍 {user.province}
                    </span>
                  )}
                </div>
              </div>
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>
                {initials}
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {[
                { label: "Viewed", value: "—", Icon: UserSearch },
                { label: "Shortlisted", value: "—", Icon: Star },
                { label: "Reports", value: "—", Icon: Flame },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl px-3 py-2.5 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon size={11} className="mx-auto mb-1" style={{ color: "rgba(240,180,41,0.55)" }} />
                  <p className="text-base font-black text-white leading-none">{value}</p>
                  <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links strip */}
          <div className="grid grid-cols-3 divide-x divide-[#1a5c2a]/10"
            style={{ backgroundColor: "#f0fdf4", borderTop: "1px solid rgba(26,92,42,0.15)" }}>
            {[
              { href: "/scout/profile",   label: "My Profile" },
              { href: "/scout/shortlist", label: "Shortlist" },
              { href: "/scout/reports",   label: "PDF Report" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="py-2.5 text-center text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#1a5c2a]"
                style={{ color: "#6b7280" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* World Cup live banner */}
        <LiveMatchBanner />

        {/* Feature grid */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 ml-0.5" style={{ color: "#9ca3af" }}>
            Your Tools
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURES.map(({ href, icon: Icon, iconBg, iconColor, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="group bg-white rounded-2xl p-4 flex flex-col gap-3 border border-gray-200 hover:border-[#1a5c2a] shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: iconBg }}>
                    <Icon size={16} style={{ color: iconColor }} />
                  </div>
                  <ChevronRight size={13} className="text-gray-300 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide leading-none text-gray-900">{label}</h4>
                  <p className="text-[11px] font-medium mt-1 leading-snug text-gray-400">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA row */}
        <section className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/talent-leaderboard"
            className="group rounded-2xl p-5 flex items-center justify-between transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.2)" }}>
                <Trophy size={16} style={{ color: "#f0b429" }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-white">THUTO Leaderboard</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Top-ranked talent in Zimbabwe</p>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: "#f0b429" }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/arena"
            className="group rounded-2xl p-5 flex items-center justify-between transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #152d4a 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.2)" }}>
                <Zap size={16} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-white">The Arena</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Network · Post · Get discovered</p>
              </div>
            </div>
            <ChevronRight size={14} style={{ color: "#60a5fa" }} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>

        {/* Identity footer */}
        <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px]"
              style={{ backgroundColor: "#1a5c2a", color: "#f0b429" }}>
              {initials}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">{user.name || "Active Session"}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                {user.province || "Zimbabwe"} · Scout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
            <ShieldCheck size={11} /> Sync Active
          </div>
        </div>

      </main>
    </div>
  );
}
