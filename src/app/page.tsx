import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import AfricanPatternStrip from "@/components/ui/AfricanPatternStrip";
import { ZimPresidentBanner, ZimIndependenceSection } from "@/components/ui/zim-independence";
import {
  Users, Dumbbell, Brain, Trophy, Globe, Shield, Zap, Star, ChevronRight,
} from "lucide-react";

// ── Background tiles ──────────────────────────────────────────────────────────
const CREAM_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpolygon points='100,30 120,65 100,100 80,65' fill='none' stroke='%232C2416' stroke-width='1.5' opacity='0.25'/%3E%3Cpolyline points='0,120 12,108 24,120 36,108 48,120 60,108 72,120 84,108 96,120 108,108 120,120 132,108 144,120 156,108 168,120 180,108 192,120 200,112' fill='none' stroke='%232C2416' stroke-width='1' opacity='0.20'/%3E%3Ccircle cx='30' cy='170' r='5' fill='%23C1714A' opacity='0.32'/%3E%3Ccircle cx='100' cy='170' r='5' fill='%23E6A817' opacity='0.32'/%3E%3Ccircle cx='170' cy='170' r='5' fill='%233A7D6B' opacity='0.32'/%3E%3C/svg%3E")`;

const STATS_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Cpolyline points='0,30 10,20 20,30 30,20 40,30 50,20 60,30 70,20 80,30 90,20 100,30' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.15'/%3E%3Ccircle cx='25' cy='50' r='3' fill='%23E6A817' opacity='0.28'/%3E%3Ccircle cx='75' cy='50' r='3' fill='%23E6A817' opacity='0.28'/%3E%3C/svg%3E")`;

const FOOTER_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Cpolygon points='60,10 74,35 60,60 46,35' fill='none' stroke='%23E6A817' stroke-width='0.8' opacity='0.20'/%3E%3Cellipse cx='20' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.12'/%3E%3Cellipse cx='100' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.12'/%3E%3C/svg%3E")`;

const creamSection = {
  background: "#EDE0C4",
  backgroundImage: CREAM_TILE,
  backgroundSize: "200px 200px",
} as React.CSSProperties;

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-0.5 w-6 bg-[#E6A817]" />
      <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#1B5E20]">{children}</span>
    </div>
  );
}

// ── Hub label (dark bg version) ───────────────────────────────────────────────
function HubSectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[3px] h-[18px] rounded-full" style={{ background: "#E6A817" }} />
      <span className="font-bold text-base" style={{ color: "#1B5E20" }}>{label}</span>
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const sports = [
  { name: "Football",   icon: "⚽", color: "bg-green-600" },
  { name: "Basketball", icon: "🏀", color: "bg-orange-600" },
  { name: "Athletics",  icon: "🏃", color: "bg-blue-600" },
  { name: "Volleyball", icon: "🏐", color: "bg-yellow-600" },
  { name: "Cricket",    icon: "🏏", color: "bg-red-700" },
  { name: "Netball",    icon: "🥅", color: "bg-purple-700" },
  { name: "Rugby",      icon: "🏉", color: "bg-amber-700" },
  { name: "Swimming",   icon: "🏊", color: "bg-cyan-700" },
  { name: "Tennis",     icon: "🎾", color: "bg-lime-700" },
  { name: "Hockey",     icon: "🏑", color: "bg-teal-700" },
];

const stats = [
  { value: "10,000+", label: "Registered Athletes", icon: Users },
  { value: "50,000+", label: "Training Sessions",   icon: Dumbbell },
  { value: "10",      label: "Sports Supported",    icon: Trophy },
  { value: "10",      label: "Provinces Covered",   icon: Globe },
];

const aiFeatures = [
  {
    icon: Brain,
    title: "AI Coach (Claude)",
    description: "Real-time technique feedback using pose detection and Claude's reasoning. Know exactly what to fix after every session.",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  {
    icon: Zap,
    title: "Training Plan Generator",
    description: "Tell Claude your goals — get a personalised weekly programme built around your age group, position, and fitness level.",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  {
    icon: Shield,
    title: "Injury Risk Analysis",
    description: "AI monitors training load patterns and flags early warning signs of overuse injuries before they sideline you.",
    color: "text-red-700",
    bg: "bg-red-100",
  },
  {
    icon: Star,
    title: "Scout Reports (AI)",
    description: "Scouts get Claude-generated comparative reports: strengths, weaknesses, potential — all from real session data.",
    color: "text-[#1B5E20]",
    bg: "bg-green-100",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For players just getting started",
    features: [
      "5 training sessions / month",
      "Basic drill library access",
      "AI Coach (5 queries / month)",
      "Public player profile",
      "Community leaderboard",
    ],
    cta: "Get started free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$5",
    period: "/ month",
    description: "For serious athletes & coaches",
    features: [
      "Unlimited training sessions",
      "Full drill library (48+ drills)",
      "Unlimited AI Coach queries",
      "Video pose analysis",
      "Scout visibility & contact requests",
      "Training plan generator",
      "Injury risk monitoring",
      "PDF progress reports",
    ],
    cta: "Start Pro — $5/mo",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$20",
    period: "/ month",
    description: "For coaches & academies (up to 25 players)",
    features: [
      "Everything in Pro × 25 players",
      "Coach squad dashboard",
      "AI tactical insights",
      "Formation recommender",
      "Team export & PDF reports",
      "Priority support",
    ],
    cta: "Start Team",
    href: "/register?plan=team",
    highlighted: false,
  },
];

// ── Featured hub cards data ───────────────────────────────────────────────────
const featuredHubs = [
  {
    icon: "🤖",
    title: "AI Coach",
    tagline: "Get personalised coaching, drills & training plans",
    shona: "Ndinokubatsira sei nhasi?",
    href: "/player/ai-coach",
    from: "#0a2a0a",
    to: "#1B5E20",
  },
  {
    icon: "⚽",
    title: "Player Hub",
    tagline: "Train · Drill · Analyse · Grow",
    shona: "Dzidzira — Nzira yako yekutamba",
    href: "/player",
    from: "#1B5E20",
    to: "#2E7D32",
  },
];

const hubGrid = [
  { icon: "🔍", title: "Scout Hub",        subtitle: "Discover talent",          href: "/scout",                   color: "#B71C1C" },
  { icon: "🏆", title: "Fan Hub",           subtitle: "Follow the game",          href: "/fan",                     color: "#C62828" },
  { icon: "📋", title: "Coach Hub",         subtitle: "Manage your squad",        href: "/coach",                   color: "#004D40" },
  { icon: "🎥", title: "Live Match",        subtitle: "Stream & analyse",         href: "/coach/live-match",        color: "#B71C1C", badge: "LIVE" },
  { icon: "📊", title: "Training Formats",  subtitle: "Rondo · SSG · Drills",     href: "/player/training-formats", color: "#1565C0" },
  { icon: "👥", title: "Squad",             subtitle: "Register & ID players",    href: "/coach/squad",             color: "#4A148C" },
  { icon: "📈", title: "My Journey",        subtitle: "Progress & scores",        href: "/player/development",      color: "#1B5E20" },
  { icon: "🎖️", title: "Milestones",       subtitle: "Your achievements",        href: "/player/milestones",       color: "#BF360C" },
  { icon: "💼", title: "Business Hub",      subtitle: "Budgets · Sponsors · Events", href: "/business-hub",         color: "#1A237E" },
  { icon: "📉", title: "Analyst Hub",       subtitle: "xG · Heatmaps · Tactics", href: "/analyst",                 color: "#004D40", badge: "PRO" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <ZimPresidentBanner />
      <PublicNavbar />

      {/* ── Hub Cards section — Flutter off-white + green chevron ─────────── */}
      <section
        className="pt-16 pb-10 relative overflow-hidden"
        style={{
          backgroundColor: "#F5F7F5",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='12'%3E%3Cpolyline points='0,10 12,2 24,10' fill='none' stroke='%23E6A817' stroke-width='1.2' opacity='0.35'/%3E%3C/svg%3E")`,
          backgroundSize: "24px 12px",
          backgroundRepeat: "repeat",
        }}
      >
        {/* No extra overlay needed — pattern is already at 6% via SVG stroke opacity */}
        {/* Gold bottom rule */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#E6A817" }} />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Title row */}
          <div className="flex items-center gap-3 mb-8 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={40} height={40} className="rounded-lg" />
            <div>
              <h1 className="text-xl font-extrabold leading-tight" style={{ color: "#1B5E20" }}>
                Grassroots <span style={{ color: "#E6A817" }}>Sport</span>
              </h1>
              <p className="text-[11px] italic" style={{ color: "#1B5E20", opacity: 0.6 }}>Zimbabwe&apos;s AI-Powered Sports Platform 🇿🇼</p>
            </div>
          </div>

          <HubSectionLabel label="Explore the Platform" />

          {/* Featured full-width hub cards */}
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            {featuredHubs.map((hub) => (
              <Link key={hub.title} href={hub.href}>
                <div
                  className="relative overflow-hidden rounded-2xl h-40 flex flex-col justify-between p-5 cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(135deg, ${hub.from}, ${hub.to})`,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                  }}
                >
                  <span className="absolute -right-3 -bottom-3 text-[96px] opacity-[0.08] select-none pointer-events-none leading-none">
                    {hub.icon}
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl text-2xl"
                      style={{ background: "rgba(255,255,255,0.14)" }}>
                      {hub.icon}
                    </div>
                    <span className="text-xs text-white/80 font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.14)" }}>
                      Open →
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-[19px] font-extrabold leading-tight">{hub.title}</p>
                    <p className="text-white/65 text-xs mt-0.5 truncate">{hub.tagline}</p>
                    <p className="text-white/40 text-[11px] italic mt-0.5 truncate">{hub.shona}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 2-column compact hub grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hubGrid.map((hub) => (
              <Link key={hub.title} href={hub.href}>
                <div
                  className="relative overflow-hidden rounded-xl h-[110px] flex flex-col justify-between p-3.5 cursor-pointer transition-transform hover:-translate-y-0.5"
                  style={{
                    background: hub.color,
                    boxShadow: `0 4px 12px ${hub.color}55`,
                  }}
                >
                  <span className="absolute -right-2 -bottom-2 text-[60px] opacity-[0.10] select-none pointer-events-none leading-none">
                    {hub.icon}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{hub.icon}</span>
                    {hub.badge && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black text-white"
                        style={{ background: "rgba(255,255,255,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                        {hub.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-tight">{hub.title}</p>
                    <p className="text-white/65 text-[11px] mt-0.5 truncate">{hub.subtitle}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Join banner */}
          <Link href="/register">
            <div
              className="mt-4 rounded-2xl h-[64px] flex items-center gap-4 px-5 overflow-hidden relative cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #4A148C, #7B1FA2, #9C27B0)",
                borderLeft: "4px solid #E6A817",
                boxShadow: "0 4px 14px rgba(123,31,162,0.3)",
              }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="text-lg">👑</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold">Join Free — Create Your Account</p>
                <p className="text-white/65 text-xs truncate">Get full access to all hubs, AI Coach and more</p>
              </div>
              <ChevronRight className="text-white/50 shrink-0 h-5 w-5" />
            </div>
          </Link>
        </div>
      </section>

      {/* ── Pattern strip ─────────────────────────────────────────────────── */}
      <AfricanPatternStrip variant="green" height={44} />

      {/* ── Sports Strip — cream ──────────────────────────────────────────── */}
      <section id="sports" style={creamSection} className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel>10 Sports</SectionLabel>
          <h2 className="mb-10 text-3xl font-bold text-[#1B5E20]">One Platform</h2>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10 sm:gap-4">
            {sports.map(({ name, icon, color }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-xl p-4 transition hover:-translate-y-0.5"
                style={{ background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}/20`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <span className="text-xs font-medium text-[#2C2416]">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles / Features — cream ──────────────────────────────────────── */}
      <section id="features" style={creamSection} className="py-24 border-t border-[#A0522D]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Platform Features</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">Built for everyone in the game</h2>
            <p className="mt-3 text-base text-[#444]">Every role has its own hub — tailored tools, tailored AI</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                id: "player", icon: "🏃", label: "Player", tagline: "Train smarter, get discovered",
                desc: "Track every session, get AI-powered coaching feedback, and build a verified profile that scouts actually see.",
                features: ["AI Coach powered by Claude", "Session tracking with video pose analysis", "Verified identity for scout visibility", "Offline-first — works on 2G/3G", "Progress charts & milestones", "Drill library with 48+ exercises"],
                href: "/player",
              },
              {
                id: "coach", icon: "📋", label: "Coach", tagline: "Build squads, analyse performance",
                desc: "Manage up to 23 players, track fitness and injury status, and get AI-generated tactical insights from real training data.",
                features: ["Full squad roster with shirt numbers", "Injury & fitness status tracking", "AI insights from training data", "Formation recommender powered by Claude", "Session drill assignment to players", "Export PDF training reports"],
                href: "/coach",
              },
              {
                id: "scout", icon: "🔍", label: "Scout", tagline: "Find talent, build pipelines",
                desc: "Search verified players by position, age group, and province. Privacy-protected profiles with admin-approved contact requests.",
                features: ["Advanced player search by position & region", "Privacy-first — initials shown until approved", "Contact request system with admin oversight", "AI scouting reports with comparisons", "Shortlist management", "Radar chart comparisons"],
                href: "/scout",
              },
              {
                id: "fan", icon: "🎉", label: "Fan", tagline: "Follow the game, support talent",
                desc: "Discover rising stars in your region, follow your favourite athletes, and support grassroots sport financially.",
                features: ["Player discovery by province & sport", "Regional leaderboards & rankings", "Follow athletes on their journey", "Academy & club directory", "Donation support for community players", "Live session highlights feed"],
                href: "/fan",
              },
            ].map((role) => (
              <div
                key={role.id}
                className="feature-card-african flex flex-col rounded-xl p-6"
                style={{ background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)", boxShadow: "0 2px 8px rgba(27,94,32,0.06)" }}
              >
                <div className="relative mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl" style={{ background: "#1B5E20" }}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1B5E20]">{role.label}</h3>
                    <p className="text-xs font-semibold text-[#3A7D6B]">Hub</p>
                  </div>
                </div>
                <h4 className="mb-2 text-sm font-semibold text-[#2C2416]">{role.tagline}</h4>
                <p className="mb-5 text-xs text-[#666] leading-relaxed">{role.desc}</p>
                <ul className="mb-6 flex-1 space-y-2">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#2C2416]">
                      <span className="mt-0.5 font-bold text-[#3A7D6B]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={role.href}
                  className="mt-auto flex items-center justify-center gap-2 rounded px-4 py-2.5 text-xs font-bold text-[#E6A817] transition hover:opacity-85"
                  style={{ background: "#2C2416", border: "1px solid #A0522D" }}
                >
                  Explore {role.label} Hub <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features — cream ───────────────────────────────────────────── */}
      <section id="ai" style={creamSection} className="py-24 border-t border-[#A0522D]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Powered by Claude AI</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">AI that actually understands sport</h2>
            <p className="mt-3 text-base text-[#444]">Every insight is generated from real training data — not generic advice</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aiFeatures.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className="feature-card-african rounded-xl p-6"
                style={{ background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }}>
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mb-2 font-bold text-[#1B5E20]">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* AI Chat Preview */}
          <div className="mt-16 rounded-xl p-6 sm:p-8"
            style={{ background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }}>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="mb-3 text-2xl font-bold text-[#1B5E20]">Ask your AI Coach anything</h3>
                <p className="mb-6 text-[#444]">
                  Claude analyses your biomechanics, drill scores, and session history to give you
                  specific, actionable coaching feedback — in English or Shona.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Why is my shooting weak?", "How do I improve my first touch?", "Ndisimudze sei?"].map((q) => (
                    <span key={q} className="rounded-full px-3 py-1 text-xs text-[#1B5E20] font-medium"
                      style={{ background: "rgba(27,94,32,0.1)", border: "1px solid rgba(27,94,32,0.2)" }}>
                      {q}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-4 font-mono text-sm" style={{ background: "#1B5E20" }}>
                <div className="mb-3 flex items-center gap-2 text-xs text-[#E6A817]">
                  <Brain className="h-3.5 w-3.5" />
                  AI Coach · Claude
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-white/80 text-xs">
                    How can I improve my heading ability?
                  </div>
                  <div className="rounded-lg px-3 py-2 text-white/90 text-xs leading-relaxed"
                    style={{ background: "rgba(230,168,23,0.15)" }}>
                    Based on your last 12 sessions, your jump timing is 0.3s early on crosses.
                    Focus on: (1) Watching the ball through contact, (2) Arching your back before
                    release for power, (3) Short approach runs to build explosive leg drive…
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ──────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden"
        style={{ background: "#2E7D32", backgroundImage: STATS_TILE, backgroundSize: "100px 60px" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-[#F5C842] sm:text-5xl">{value}</div>
                <div className="mt-2 text-sm text-white/70 tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing — cream ───────────────────────────────────────────────── */}
      <section id="pricing" style={creamSection} className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">Simple, affordable pricing</h2>
            <p className="mt-3 text-base text-[#444]">Designed for the African grassroots ecosystem</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className="relative flex flex-col rounded-xl p-6"
                style={plan.highlighted
                  ? { background: "#1B5E20", border: "2px solid #E6A817" }
                  : { background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full px-3 py-1 text-xs font-bold text-[#2C2416]" style={{ background: "#E6A817" }}>
                      Most popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold ${plan.highlighted ? "text-white" : "text-[#1B5E20]"}`}>{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlighted ? "text-[#F5C842]" : "text-[#2C2416]"}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-[#666]"}`}>{plan.period}</span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlighted ? "text-white/70" : "text-[#666]"}`}>{plan.description}</p>
                </div>
                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? "text-white/85" : "text-[#2C2416]"}`}>
                      <span className={plan.highlighted ? "text-[#E6A817]" : "text-[#3A7D6B]"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}
                  className="block rounded px-4 py-3 text-center text-sm font-bold transition hover:opacity-85"
                  style={plan.highlighted
                    ? { background: "#E6A817", color: "#2C2416" }
                    : { background: "#2C2416", color: "#E6A817", border: "1px solid #A0522D" }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Zimbabwe Independence Day section ──────────────────────────────── */}
      <ZimIndependenceSection />

      {/* ── Final CTA — dark green ─────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#1B5E20" }}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots Sport" width={72} height={72} className="mx-auto mb-4" />
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Start your journey today</h2>
          <p className="mb-8 text-lg text-white/75">
            Join thousands of athletes, coaches, and scouts building African grassroots sport with data and AI.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded px-8 py-4 text-base font-bold text-[#2C2416] transition hover:-translate-y-px hover:opacity-90"
            style={{ background: "#E6A817" }}>
            Create free account <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Bottom pattern ────────────────────────────────────────────────── */}
      <div style={{ lineHeight: 0, overflow: "hidden" }}>
        <svg viewBox="0 0 1440 36" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", height: 36 }}>
          <rect width="1440" height="36" fill="#2C2416"/>
          <polyline
            points="0,26 9,14 18,26 27,14 36,26 45,14 54,26 63,14 72,26 81,14 90,26 99,14 108,26 117,14 126,26 135,14 144,26 153,14 162,26 171,14 180,26 189,14 198,26 207,14 216,26 225,14 234,26 243,14 252,26 261,14 270,26 279,14 288,26 297,14 306,26 315,14 324,26 333,14 342,26 351,14 360,26 369,14 378,26 387,14 396,26 405,14 414,26 423,14 432,26 441,14 450,26 459,14 468,26 477,14 486,26 495,14 504,26 513,14 522,26 531,14 540,26 549,14 558,26 567,14 576,26 585,14 594,26 603,14 612,26 621,14 630,26 639,14 648,26 657,14 666,26 675,14 684,26 693,14 702,26 711,14 720,26 729,14 738,26 747,14 756,26 765,14 774,26 783,14 792,26 801,14 810,26 819,14 828,26 837,14 846,26 855,14 864,26 873,14 882,26 891,14 900,26 909,14 918,26 927,14 936,26 945,14 954,26 963,14 972,26 981,14 990,26 999,14 1008,26 1017,14 1026,26 1035,14 1044,26 1053,14 1062,26 1071,14 1080,26 1089,14 1098,26 1107,14 1116,26 1125,14 1134,26 1143,14 1152,26 1161,14 1170,26 1179,14 1188,26 1197,14 1206,26 1215,14 1224,26 1233,14 1242,26 1251,14 1260,26 1269,14 1278,26 1287,14 1296,26 1305,14 1314,26 1323,14 1332,26 1341,14 1350,26 1359,14 1368,26 1377,14 1386,26 1395,14 1404,26 1413,14 1422,26 1431,14 1440,26"
            fill="none" stroke="#E6A817" strokeWidth="1.2" opacity="0.5"/>
          {[36,108,180,252,324,396,468,540,612,684,756,828,900,972,1044,1116,1188,1260,1332,1404].map((cx, i) => (
            <circle key={cx} cx={cx} cy="18" r="2.5" fill={i % 2 === 0 ? "#C1714A" : "#3A7D6B"} opacity="0.6"/>
          ))}
        </svg>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-12 relative overflow-hidden"
        style={{ background: "#2C2416", backgroundImage: FOOTER_TILE, backgroundSize: "120px 80px" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo_v2.png" alt="Grassroots Sport" width={28} height={28} />
                <span className="font-bold text-white">Grassroots <span style={{ color: "#F5C842" }}>Sport</span></span>
              </div>
              <p className="text-sm text-white/50">AI-powered sports platform for Africa&apos;s next generation.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#E6A817]">Platform</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/#ai" className="hover:text-white transition-colors">AI Coach</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/#sports" className="hover:text-white transition-colors">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#E6A817]">Hubs</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/player" className="hover:text-white transition-colors">Player Hub</Link></li>
                <li><Link href="/coach"  className="hover:text-white transition-colors">Coach Hub</Link></li>
                <li><Link href="/scout"  className="hover:text-white transition-colors">Scout Hub</Link></li>
                <li><Link href="/fan"    className="hover:text-white transition-colors">Fan Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#E6A817]">Contact</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Zimbabwe 🇿🇼</li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
            &copy; 2026 Grassroots Sport Zimbabwe · Built with AI · All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
