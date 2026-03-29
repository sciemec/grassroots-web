import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ── Hub data ──────────────────────────────────────────────────────────────

const featuredHubs = [
  {
    icon: "🤖",
    title: "AI Coach",
    tagline: "Get personalised coaching, drills & training plans",
    shona: "Ndinokubatsira sei nhasi?",
    href: "/player/ai-coach",
    gradient: "from-[#0a2a0a] to-[#1B5E20]",
  },
  {
    icon: "⚽",
    title: "Player Hub",
    tagline: "Train · Drill · Analyse · Grow",
    shona: "Dzidzira — Nzira yako yekutamba",
    href: "/player",
    gradient: "from-[#1B5E20] to-[#2E7D32]",
  },
];

const hubGrid = [
  { icon: "🔍", title: "Scout Hub",        subtitle: "Discover talent",          href: "/scout",                     color: "#B71C1C" },
  { icon: "🏆", title: "Fan Hub",           subtitle: "Follow the game",          href: "/fan",                       color: "#C62828" },
  { icon: "📋", title: "Coach Hub",         subtitle: "Manage your squad",        href: "/coach",                     color: "#004D40" },
  { icon: "🎥", title: "Live Match",        subtitle: "Stream & analyse",         href: "/coach/live-match",          color: "#B71C1C", badge: "LIVE" },
  { icon: "📊", title: "Training Formats",  subtitle: "Rondo · SSG · Drills",     href: "/player/training-formats",   color: "#1565C0" },
  { icon: "👥", title: "Squad",             subtitle: "Register & ID players",    href: "/coach/squad",               color: "#4A148C" },
  { icon: "📈", title: "My Journey",        subtitle: "Progress & scores",        href: "/player/development",        color: "#1B5E20" },
  { icon: "🎖️", title: "Milestones",       subtitle: "Your achievements",        href: "/player/milestones",         color: "#BF360C" },
];

const stats = [
  { icon: "🏃", label: "Athletes",         value: "10,000+" },
  { icon: "🏋️", label: "Sessions Logged", value: "50,000+" },
  { icon: "🏅", label: "Sports",           value: "10"      },
  { icon: "🗺️", label: "Provinces",        value: "10"      },
];

const sports = ["⚽ Football","🏉 Rugby","🏀 Basketball","🎾 Tennis","🏏 Cricket","🏃 Athletics","🏊 Swimming","🥅 Netball","🏐 Volleyball","🏑 Hockey"];

// ── Component ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0f1f10" }}>
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-16"
        style={{
          background: "linear-gradient(135deg, #0a2a0a 0%, #1B5E20 50%, #2E7D32 100%)",
        }}
      >
        {/* Chevron pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40'%3E%3Cpolyline points='0,30 15,10 30,30 45,10 60,30' fill='none' stroke='%23FFC107' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 40px",
          }}
        />
        {/* Gold bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#E6A817" }} />

        <div className="mx-auto max-w-2xl px-5 py-12 pb-14 relative z-10">
          {/* Logo + greeting */}
          <div className="flex items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_v2.png"
              alt="Grassroots Sport"
              width={48}
              height={48}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">
                Grassroots <span style={{ color: "#F5C842" }}>Sports</span>
              </h1>
              <p className="text-xs text-white/60 italic">Bhora ndeye vanhu vose</p>
            </div>
          </div>

          <p className="text-white/75 text-sm leading-relaxed mb-6 max-w-md">
            Zimbabwe&apos;s first AI-powered sports platform. Train anywhere, get discovered everywhere —
            from Harare to Hwange.
          </p>

          {/* Phase badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 cursor-default"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
            }}
          >
            <span style={{ color: "#E6A817" }}>⚡</span>
            Beta Phase
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
              style={{ background: "#E6A817", color: "#1a1a1a" }}
            >
              LIVE
            </span>
          </div>

          {/* Sports strip */}
          <div className="flex gap-2 flex-wrap">
            {sports.map((s) => (
              <span
                key={s}
                className="text-xs px-2.5 py-1 rounded-full text-white/70"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">

        {/* ── Section: Your Hubs ─────────────────────────────────────────── */}
        <div>
          <SectionLabel icon="⊞" label="Your Hubs" />

          {/* Featured hub cards */}
          <div className="space-y-3 mb-3">
            {featuredHubs.map((hub) => (
              <Link key={hub.title} href={hub.href}>
                <div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${hub.gradient} h-40 flex flex-col justify-between p-5`}
                  style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}
                >
                  {/* Decorative bg icon */}
                  <span className="absolute -right-3 -bottom-3 text-[100px] opacity-[0.08] select-none pointer-events-none">
                    {hub.icon}
                  </span>

                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-xl text-2xl"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      {hub.icon}
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      Open →
                    </div>
                  </div>

                  {/* Bottom text */}
                  <div>
                    <p className="text-white text-xl font-extrabold leading-tight">{hub.title}</p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">{hub.tagline}</p>
                    <p className="text-white/45 text-[11px] italic mt-0.5 truncate">{hub.shona}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 2-column hub grid */}
          <div className="grid grid-cols-2 gap-3">
            {hubGrid.map((hub) => (
              <Link key={hub.title} href={hub.href}>
                <div
                  className="relative overflow-hidden rounded-2xl h-[120px] flex flex-col justify-between p-3.5"
                  style={{
                    background: hub.color,
                    boxShadow: `0 4px 14px ${hub.color}55`,
                  }}
                >
                  {/* Decorative bg icon */}
                  <span className="absolute -right-2 -bottom-2 text-[65px] opacity-[0.10] select-none pointer-events-none">
                    {hub.icon}
                  </span>

                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{hub.icon}</span>
                    {hub.badge && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black text-white"
                        style={{ background: "rgba(255,255,255,0.2)" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                        {hub.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom text */}
                  <div>
                    <p className="text-white text-[15px] font-bold leading-tight">{hub.title}</p>
                    <p className="text-white/70 text-[11px] mt-0.5 truncate">{hub.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Section: Platform Stats ────────────────────────────────────── */}
        <div>
          <SectionLabel icon="📊" label="Platform" />
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-white text-xl font-extrabold leading-none" style={{ color: "#E6A817" }}>{s.value}</p>
                  <p className="text-white/55 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section: What you get ──────────────────────────────────────── */}
        <div>
          <SectionLabel icon="✨" label="What You Get" />
          <div className="space-y-2">
            {[
              { icon: "🤖", title: "AI Coach (Claude)", desc: "Real-time technique feedback in English or Shona" },
              { icon: "📱", title: "Offline-First",     desc: "Works on 2G/3G — built for Zimbabwe's network" },
              { icon: "🔍", title: "Scout Visibility",  desc: "Verified profiles seen by scouts across Africa" },
              { icon: "🏋️", title: "Injury Prevention", desc: "AI monitors training load before you break down" },
              { icon: "📈", title: "Progress Tracking", desc: "Sessions, drills, milestones — all in one place" },
              { icon: "💰", title: "Market Valuation",  desc: "First platform to value Zimbabwean grassroots players" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-white/50 text-xs">{f.desc}</p>
                </div>
                <span className="ml-auto text-white/20 text-xs">✓</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Subscription teaser ────────────────────────────────────────── */}
        <Link href="/register">
          <div
            className="rounded-2xl h-[68px] flex items-center gap-4 px-5 overflow-hidden relative"
            style={{
              background: "linear-gradient(90deg, #4A148C, #7B1FA2, #9C27B0)",
              borderLeft: "4px solid #E6A817",
              boxShadow: "0 4px 16px rgba(123,31,162,0.35)",
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <span className="text-xl">👑</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold">Join Free — Get Started</p>
              <p className="text-white/70 text-xs truncate">Create your account and explore all hubs</p>
            </div>
            <span className="text-white/50 text-lg shrink-0">›</span>
          </div>
        </Link>

        {/* ── Footer links ───────────────────────────────────────────────── */}
        <div className="pt-4 pb-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={24} height={24} className="rounded" />
            <span className="text-white/60 text-sm font-semibold">
              Grassroots <span style={{ color: "#E6A817" }}>Sport</span>
            </span>
            <span className="ml-auto text-white/30 text-xs">Zimbabwe 🇿🇼</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/40">
            <Link href="/login"    className="hover:text-white/70 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white/70 transition-colors">Register</Link>
            <Link href="/privacy"  className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="/terms"    className="hover:text-white/70 transition-colors">Terms</Link>
          </div>
          <p className="text-white/20 text-xs mt-4">
            AI-powered · Built for Africa · &copy; 2026 Grassroots Sport
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Section label helper ────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[3px] h-[18px] rounded-full" style={{ background: "#E6A817" }} />
      <span className="text-lg">{icon}</span>
      <span className="text-white font-bold text-base">{label}</span>
    </div>
  );
}
