"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, Heart, Trophy, Users, Star, Radio, ChevronRight,
  Zap, ShieldCheck, GraduationCap, Flame, Video, Building2,
  Globe, MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const WIRE = [
  "Dynamos FC 2â€“1 Highlanders Â· 67' â€” NSS is electric tonight",
  "FC Platinum beat Chicken Inn 3â€“0 at Mandava Stadium",
  "K.M. (Harare) clocked a 2.84s 20m sprint â€” rising star alert",
  "T.N. (Bulawayo) earned the Rising Star badge this week",
  "Munhumutapa Challenge Cup 2026 â€” registration open for U14 & U16",
  "Zimbabwe U20 squad announced for COSAFA Cup qualifiers",
];

const FEATURES = [
  {
    href: "/fan/discover",
    icon: Star,
    iconBg: "#fef3c7", iconColor: "#d97706",
    label: "Discover Talent",
    desc: "Find players Â· positions Â· provinces",
  },
  {
    href: "/fan/following",
    icon: Heart,
    iconBg: "#fce7f3", iconColor: "#db2777",
    label: "Following",
    desc: "Players you support Â· updates",
  },
  {
    href: "/fan/leaderboard",
    icon: Trophy,
    iconBg: "#dcfce7", iconColor: "#16a34a",
    label: "Leaderboard",
    desc: "Top-rated players Â· THUTO scores",
  },
  {
    href: "/fan-hub",
    icon: Video,
    iconBg: "#dbeafe", iconColor: "#2563eb",
    label: "Fan Hub Videos",
    desc: "Highlights Â· skill clips Â· AI reels",
  },
  {
    href: "/streaming",
    icon: Radio,
    iconBg: "#ede9fe", iconColor: "#7c3aed",
    label: "Live Matches",
    desc: "Watch live Â· broadcast mode",
  },
  {
    href: "/arena/clubs",
    icon: Building2,
    iconBg: "#fef3c7", iconColor: "#b45309",
    label: "Schools & Clubs",
    desc: "Find your team Â· follow a club",
  },
  {
    href: "/arena",
    icon: MessageCircle,
    iconBg: "#e0f2fe", iconColor: "#0284c7",
    label: "The Arena",
    desc: "Posts Â· discuss Â· get involved",
  },
  {
    href: "/talent-leaderboard",
    icon: Users,
    iconBg: "#ecfdf5", iconColor: "#15803d",
    label: "Rising Stars",
    desc: "National talent rankings Â· THUTO AI",
  },
];

export default function FanHubPage() {
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
    if (user.role !== "fan" && user.role !== "admin") router.replace("/arena");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f4f2ee" }}>
        <Activity className="animate-spin" size={28} style={{ color: "#1a5c2a" }} />
      </div>
    );
  }

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "FN";

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
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,180,41,0.7)" }}>Fan Hub</p>
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
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>{greeting()},</p>
                <h2 className="text-2xl font-black mt-0.5 leading-tight truncate" style={{ color: "#f0b429" }}>{user.name || "Fan"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.25)" }}>
                    <ShieldCheck size={9} /> Fan Â· Active
                  </span>
                  {user.province && (
                    <span className="text-[10px] font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>
                      ðŸ“ {user.province}
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
                { label: "Following", value: "â€”", Icon: Heart },
                { label: "Favourites", value: "â€”", Icon: Star },
                { label: "Live Now", value: "â€”", Icon: Flame },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl px-3 py-2.5 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon size={11} className="mx-auto mb-1" style={{ color: "rgba(240,180,41,0.55)" }} />
                  <p className="text-base font-black leading-none" style={{ color: "#f0b429" }}>{value}</p>
                  <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "rgba(240,180,41,0.55)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links strip */}
          <div className="grid grid-cols-3 divide-x divide-[#1a5c2a]/10"
            style={{ backgroundColor: "#f0fdf4", borderTop: "1px solid rgba(26,92,42,0.15)" }}>
            {[
              { href: "/fan/discover",    label: "Discover" },
              { href: "/fan/following",   label: "Following" },
              { href: "/fan/leaderboard", label: "Leaderboard" },
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
                <p className="text-xs font-black uppercase tracking-wide" style={{ color: "#f0b429" }}>The Arena</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(240,180,41,0.7)" }}>Post Â· discuss Â· connect</p>
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
                {user.province || "Zimbabwe"} Â· Fan
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
