import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import AfricanPatternStrip from "@/components/ui/AfricanPatternStrip";
import {
  Users, Dumbbell, Brain, Trophy, Globe, Shield, Zap, Star, ChevronRight, Play,
} from "lucide-react";

// ── Background tiles ──────────────────────────────────────────────────────────

// Hero: diamond + arch teeth + zigzag on dark green (more visible)
const HERO_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpolygon points='80,20 100,50 80,80 60,50' fill='none' stroke='%23E6A817' stroke-width='1.2' opacity='0.22'/%3E%3Cpolygon points='80,24 96,50 80,76 64,50' fill='%23E6A817' opacity='0.07'/%3E%3Cellipse cx='20' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.12'/%3E%3Cellipse cx='50' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.12'/%3E%3Cellipse cx='110' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.12'/%3E%3Cellipse cx='140' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.12'/%3E%3Cpolyline points='0,105 10,95 20,105 30,95 40,105 50,95 60,105 70,95 80,105 90,95 100,105 110,95 120,105 130,95 140,105 150,95 160,105' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.14'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%233A7D6B' opacity='0.35'/%3E%3Ccircle cx='150' cy='10' r='3' fill='%233A7D6B' opacity='0.35'/%3E%3Ccircle cx='10' cy='150' r='3' fill='%23A0522D' opacity='0.35'/%3E%3Ccircle cx='150' cy='150' r='3' fill='%23A0522D' opacity='0.35'/%3E%3C/svg%3E")`;

// Cream sections: diamond + zigzag + dots watermark on cream (more visible)
const CREAM_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpolygon points='100,30 120,65 100,100 80,65' fill='none' stroke='%232C2416' stroke-width='1.5' opacity='0.25'/%3E%3Cpolyline points='0,120 12,108 24,120 36,108 48,120 60,108 72,120 84,108 96,120 108,108 120,120 132,108 144,120 156,108 168,120 180,108 192,120 200,112' fill='none' stroke='%232C2416' stroke-width='1' opacity='0.20'/%3E%3Ccircle cx='30' cy='170' r='5' fill='%23C1714A' opacity='0.32'/%3E%3Ccircle cx='100' cy='170' r='5' fill='%23E6A817' opacity='0.32'/%3E%3Ccircle cx='170' cy='170' r='5' fill='%233A7D6B' opacity='0.32'/%3E%3C/svg%3E")`;

// Stats banner: zigzag + dots on mid green (more visible)
const STATS_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Cpolyline points='0,30 10,20 20,30 30,20 40,30 50,20 60,30 70,20 80,30 90,20 100,30' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.15'/%3E%3Ccircle cx='25' cy='50' r='3' fill='%23E6A817' opacity='0.28'/%3E%3Ccircle cx='75' cy='50' r='3' fill='%23E6A817' opacity='0.28'/%3E%3C/svg%3E")`;

// Footer: diamond outlines + arch ellipses on charcoal (more visible)
const FOOTER_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Cpolygon points='60,10 74,35 60,60 46,35' fill='none' stroke='%23E6A817' stroke-width='0.8' opacity='0.20'/%3E%3Cellipse cx='20' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.12'/%3E%3Cellipse cx='100' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.12'/%3E%3C/svg%3E")`;

// ── Shared section styles ─────────────────────────────────────────────────────
const creamSection = {
  background: "#EDE0C4",
  backgroundImage: CREAM_TILE,
  backgroundSize: "200px 200px",
} as React.CSSProperties;

// ── Section label helper ──────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-0.5 w-6 bg-[#E6A817]" />
      <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#1B5E20]">{children}</span>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

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

const roles = [
  {
    id: "player",
    label: "Player",
    icon: "🏃",
    headline: "Train smarter, get discovered",
    description: "Track every session, get AI-powered coaching feedback, and build a verified profile that scouts actually see.",
    features: [
      "AI Coach powered by Claude — real-time technique feedback",
      "Session tracking with video pose analysis",
      "Verified identity for scout visibility",
      "Offline-first — works on 2G/3G in rural areas",
      "Personal progress charts & milestones",
      "Drill library with 48+ exercises",
    ],
    cta: "Start as Player",
    href: "/register/player",
  },
  {
    id: "coach",
    label: "Coach",
    icon: "📋",
    headline: "Build squads, analyse performance",
    description: "Manage up to 23 players, track fitness and injury status, and get AI-generated tactical insights from real training data.",
    features: [
      "Full squad roster with shirt numbers & positions",
      "Injury & fitness status tracking",
      "AI insights from aggregated training data",
      "Formation recommender powered by Claude",
      "Session drill assignment to players",
      "Export PDF training reports",
    ],
    cta: "Start as Coach",
    href: "/register/coach",
  },
  {
    id: "scout",
    label: "Scout",
    icon: "🔍",
    headline: "Find talent, build pipelines",
    description: "Search verified players by position, age group, and province. Privacy-protected profiles reveal full details only after admin-approved contact requests.",
    features: [
      "Advanced player search by position & region",
      "Privacy-first — initials + region shown until approved",
      "Contact request system with admin oversight",
      "AI scouting reports with comparative analysis",
      "Shortlist management across multiple teams",
      "Radar chart comparisons",
    ],
    cta: "Start as Scout",
    href: "/register/scout",
  },
  {
    id: "fan",
    label: "Fan",
    icon: "🎉",
    headline: "Follow the game, support talent",
    description: "Discover rising stars in your region, follow your favourite athletes, and support grassroots sport financially.",
    features: [
      "Player discovery by province & sport",
      "Regional leaderboards & rankings",
      "Follow athletes on their journey",
      "Academy & club directory",
      "Donation support for community players",
      "Live session highlights feed",
    ],
    cta: "Start as Fan",
    href: "/register/fan",
  },
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <PublicNavbar />

      {/* ── Pattern strip: charcoal + gold diamonds + white zigzag ─────────── */}
      <AfricanPatternStrip variant="dark" height={36} />

      {/* ── Hero — dark green + SVG tile watermark ───────────────────────────── */}
      <section
        className="relative overflow-hidden pt-16"
        style={{ background: "#1B5E20", backgroundImage: HERO_TILE, backgroundSize: "160px 160px" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          {/* 2-column hero: text left, stat cards right */}
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            {/* Left — copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border px-3.5 py-1.5 text-[11px] font-semibold tracking-[2px] uppercase text-[#F5C842]"
                style={{ background: "rgba(230,168,23,0.15)", borderColor: "rgba(230,168,23,0.4)", borderRadius: "2px" }}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5C842] animate-pulse" />
                Live · Harare Province
              </div>

              <h1 className="mb-5 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
                Develop <em className="not-italic text-[#F5C842]">Every</em><br />
                Athlete in Zimbabwe
              </h1>

              <p className="mb-8 max-w-md text-base leading-7 text-white/75">
                The complete digital platform for talent identification, coach management,
                and real-time competition tracking — whether you&apos;re in Harare or Hwange.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="rounded px-7 py-3.5 text-sm font-bold text-[#2C2416] transition hover:-translate-y-px hover:opacity-90"
                  style={{ background: "#E6A817" }}
                >
                  Register as Athlete
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded border border-white/35 px-7 py-3.5 text-sm font-semibold text-white hover:border-white/70 transition"
                >
                  <Play className="h-4 w-4" />
                  Coach Hub →
                </Link>
              </div>
            </div>

            {/* Right — stat cards */}
            <div className="flex flex-col gap-3">
              {/* 3-card row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { num: "10,000+", label: "Athletes" },
                  { num: "86+",     label: "Coaches" },
                  { num: "34+",     label: "Clubs" },
                ].map(({ num, label }) => (
                  <div
                    key={label}
                    className="relative overflow-hidden rounded-lg p-4 pl-6"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(230,168,23,0.2)" }}
                  >
                    {/* Gold left bar */}
                    <div className="absolute left-0 top-0 h-full w-1" style={{ background: "#E6A817", opacity: 0.7 }} />
                    <p className="text-2xl font-bold text-white">{num}</p>
                    <p className="mt-0.5 text-xs tracking-wide text-white/55">{label}</p>
                  </div>
                ))}
              </div>
              {/* Wide stat card */}
              <div
                className="relative overflow-hidden rounded-lg p-5 pl-7"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(230,168,23,0.2)" }}
              >
                <div className="absolute left-0 top-0 h-full w-1" style={{ background: "#E6A817", opacity: 0.7 }} />
                <p className="text-lg font-bold text-[#F5C842]">Live This Weekend</p>
                <p className="mt-1.5 text-sm text-white/55">3 tournaments · 18 matches · 240 players registered</p>
              </div>
              {/* Extra stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: "50,000+", label: "Training Sessions" },
                  { num: "10",      label: "Provinces Covered" },
                ].map(({ num, label }) => (
                  <div
                    key={label}
                    className="relative overflow-hidden rounded-lg p-4 pl-6"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(230,168,23,0.2)" }}
                  >
                    <div className="absolute left-0 top-0 h-full w-1" style={{ background: "#E6A817", opacity: 0.7 }} />
                    <p className="text-2xl font-bold text-white">{num}</p>
                    <p className="mt-0.5 text-xs tracking-wide text-white/55">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pattern strip: forest green + gold arch teeth ────────────────────── */}
      <AfricanPatternStrip variant="green" height={44} />

      {/* ── Sports Strip — cream ─────────────────────────────────────────────── */}
      <section id="sports" style={creamSection} className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionLabel>10 Sports</SectionLabel>
          <h2 className="mb-10 text-3xl font-bold text-[#1B5E20]">One Platform</h2>

          <div className="grid grid-cols-5 gap-4 sm:grid-cols-10">
            {sports.map(({ name, icon, color }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-xl p-4 cursor-pointer transition hover:-translate-y-0.5"
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

      {/* ── Roles Section — cream ────────────────────────────────────────────── */}
      <section id="features" style={creamSection} className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Platform Features</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">
              Built for everyone in the game
            </h2>
            <p className="mt-3 text-base text-[#444]">
              Every role has its own hub — tailored tools, tailored AI
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="feature-card-african flex flex-col rounded-xl p-6"
                style={{
                  background: "rgba(255,248,230,0.82)",
                  border: "1px solid rgba(160,82,45,0.15)",
                  boxShadow: "0 2px 8px rgba(27,94,32,0.06)",
                }}
              >
                {/* Gold bottom accent on hover */}
                <div className="relative mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-2xl"
                    style={{ background: "#1B5E20" }}
                  >
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1B5E20]">{role.label}</h3>
                    <p className="text-xs font-semibold text-[#3A7D6B]">Hub</p>
                  </div>
                </div>

                <h4 className="mb-2 text-sm font-semibold text-[#2C2416]">{role.headline}</h4>
                <p className="mb-5 text-xs text-[#666] leading-relaxed">{role.description}</p>

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
                  {role.cta} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features — cream ──────────────────────────────────────────────── */}
      <section id="ai" style={creamSection} className="py-24 border-t border-[#A0522D]/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Powered by Claude AI</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">
              AI that actually understands sport
            </h2>
            <p className="mt-3 text-base text-[#444]">
              Every insight is generated from real training data — not generic advice
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aiFeatures.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="feature-card-african rounded-xl p-6"
                style={{
                  background: "rgba(255,248,230,0.82)",
                  border: "1px solid rgba(160,82,45,0.15)",
                }}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mb-2 font-bold text-[#1B5E20]">{title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* AI Chat Preview */}
          <div
            className="mt-16 rounded-xl p-6 sm:p-8"
            style={{ background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="mb-3 text-2xl font-bold text-[#1B5E20]">Ask your AI Coach anything</h3>
                <p className="mb-6 text-[#444]">
                  Claude analyses your biomechanics, drill scores, and session history to give you
                  specific, actionable coaching feedback — in English or Shona.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Why is my shooting weak?", "How do I improve my first touch?", "Ndisimudze sei?"].map((q) => (
                    <span
                      key={q}
                      className="rounded-full px-3 py-1 text-xs text-[#1B5E20] font-medium"
                      style={{ background: "rgba(27,94,32,0.1)", border: "1px solid rgba(27,94,32,0.2)" }}
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock chat bubble */}
              <div
                className="rounded-xl p-4 font-mono text-sm"
                style={{ background: "#1B5E20" }}
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-[#E6A817]">
                  <Brain className="h-3.5 w-3.5" />
                  AI Coach · Claude
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-white/80 text-xs">
                    How can I improve my heading ability?
                  </div>
                  <div className="rounded-lg px-3 py-2 text-white/90 text-xs leading-relaxed" style={{ background: "rgba(230,168,23,0.15)" }}>
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

      {/* ── Stats Banner — green mid ──────────────────────────────────────────── */}
      <section
        className="py-16 relative overflow-hidden"
        style={{
          background: "#2E7D32",
          backgroundImage: STATS_TILE,
          backgroundSize: "100px 60px",
        }}
      >
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

      {/* ── Pricing — cream ───────────────────────────────────────────────────── */}
      <section id="pricing" style={creamSection} className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-3xl font-bold text-[#1B5E20] sm:text-4xl">
              Simple, affordable pricing
            </h2>
            <p className="mt-3 text-base text-[#444]">
              Designed for the African grassroots ecosystem
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className="relative flex flex-col rounded-xl p-6"
                style={
                  plan.highlighted
                    ? { background: "#1B5E20", border: "2px solid #E6A817" }
                    : { background: "rgba(255,248,230,0.82)", border: "1px solid rgba(160,82,45,0.15)" }
                }
              >
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

                <Link
                  href={plan.href}
                  className="block rounded px-4 py-3 text-center text-sm font-bold transition hover:opacity-85"
                  style={
                    plan.highlighted
                      ? { background: "#E6A817", color: "#2C2416" }
                      : { background: "#2C2416", color: "#E6A817", border: "1px solid #A0522D" }
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — dark green ────────────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "#1B5E20" }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Grassroots Sport" width={72} height={72} className="mx-auto mb-4" />
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Start your journey today
          </h2>
          <p className="mb-8 text-lg text-white/75">
            Join thousands of athletes, coaches, and scouts building African grassroots sport
            with data and AI.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded px-8 py-4 text-base font-bold text-[#2C2416] transition hover:-translate-y-px hover:opacity-90"
            style={{ background: "#E6A817" }}
          >
            Create free account <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Bottom pattern: charcoal + GOLD zigzag + terracotta/teal dots ──── */}
      <div style={{ lineHeight: 0, overflow: "hidden" }}>
        <svg viewBox="0 0 1440 36" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%", height: 36 }}>
          <rect width="1440" height="36" fill="#2C2416"/>
          <polyline points="0,26 9,14 18,26 27,14 36,26 45,14 54,26 63,14 72,26 81,14 90,26 99,14 108,26 117,14 126,26 135,14 144,26 153,14 162,26 171,14 180,26 189,14 198,26 207,14 216,26 225,14 234,26 243,14 252,26 261,14 270,26 279,14 288,26 297,14 306,26 315,14 324,26 333,14 342,26 351,14 360,26 369,14 378,26 387,14 396,26 405,14 414,26 423,14 432,26 441,14 450,26 459,14 468,26 477,14 486,26 495,14 504,26 513,14 522,26 531,14 540,26 549,14 558,26 567,14 576,26 585,14 594,26 603,14 612,26 621,14 630,26 639,14 648,26 657,14 666,26 675,14 684,26 693,14 702,26 711,14 720,26 729,14 738,26 747,14 756,26 765,14 774,26 783,14 792,26 801,14 810,26 819,14 828,26 837,14 846,26 855,14 864,26 873,14 882,26 891,14 900,26 909,14 918,26 927,14 936,26 945,14 954,26 963,14 972,26 981,14 990,26 999,14 1008,26 1017,14 1026,26 1035,14 1044,26 1053,14 1062,26 1071,14 1080,26 1089,14 1098,26 1107,14 1116,26 1125,14 1134,26 1143,14 1152,26 1161,14 1170,26 1179,14 1188,26 1197,14 1206,26 1215,14 1224,26 1233,14 1242,26 1251,14 1260,26 1269,14 1278,26 1287,14 1296,26 1305,14 1314,26 1323,14 1332,26 1341,14 1350,26 1359,14 1368,26 1377,14 1386,26 1395,14 1404,26 1413,14 1422,26 1431,14 1440,26" fill="none" stroke="#E6A817" strokeWidth="1.2" opacity="0.5"/>
          {[36,108,180,252,324,396,468,540,612,684,756,828,900,972,1044,1116,1188,1260,1332,1404].map((cx, i) => (
            <circle key={cx} cx={cx} cy="18" r="2.5" fill={i % 2 === 0 ? "#C1714A" : "#3A7D6B"} opacity="0.6"/>
          ))}
        </svg>
      </div>

      {/* ── Footer — charcoal + diamond tile ─────────────────────────────────── */}
      <footer
        className="py-12 relative overflow-hidden"
        style={{ background: "#2C2416", backgroundImage: FOOTER_TILE, backgroundSize: "120px 80px" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Grassroots Sport" width={28} height={28} />
                <span className="font-bold text-white">
                  Grassroots <span style={{ color: "#F5C842" }}>Sport</span>
                </span>
              </div>
              <p className="text-sm text-white/50">
                AI-powered sports platform for Africa&apos;s next generation.
              </p>
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
              <h4 className="mb-3 text-sm font-semibold text-[#E6A817]">Roles</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/register?role=player" className="hover:text-white transition-colors">Player Hub</Link></li>
                <li><Link href="/register?role=coach" className="hover:text-white transition-colors">Coach Hub</Link></li>
                <li><Link href="/register?role=scout" className="hover:text-white transition-colors">Scout Hub</Link></li>
                <li><Link href="/register?role=fan" className="hover:text-white transition-colors">Fan Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#E6A817]">Contact</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Zimbabwe 🇿🇼</li>
                <li>
                  <a href="mailto:support@grassrootssports.live" className="hover:text-white transition-colors">
                    support@grassrootssports.live
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs text-white/30">
            <span>© {new Date().getFullYear()} Grassroots Sport Pro. Built in Zimbabwe 🇿🇼</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
