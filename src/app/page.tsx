import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import AfricanPatternStrip from "@/components/ui/AfricanPatternStrip";
import {
  Users, Dumbbell, Brain, Trophy, Globe, Shield, Zap, Star, ChevronRight, Play,
} from "lucide-react";

// ── SVG background tiles (encoded from grassroots_pattern_v2.html) ─────────
const HERO_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cpolygon points='80,20 100,50 80,80 60,50' fill='none' stroke='%23E6A817' stroke-width='1' opacity='0.12'/%3E%3Cpolygon points='80,24 96,50 80,76 64,50' fill='%23E6A817' opacity='0.04'/%3E%3Cellipse cx='20' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.07'/%3E%3Cellipse cx='50' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.07'/%3E%3Cellipse cx='110' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.07'/%3E%3Cellipse cx='140' cy='140' rx='10' ry='14' fill='%23E6A817' opacity='0.07'/%3E%3Cpolyline points='0,105 10,95 20,105 30,95 40,105 50,95 60,105 70,95 80,105 90,95 100,105 110,95 120,105 130,95 140,105 150,95 160,105' fill='none' stroke='%23ffffff' stroke-width='0.6' opacity='0.08'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%233A7D6B' opacity='0.2'/%3E%3Ccircle cx='150' cy='10' r='3' fill='%233A7D6B' opacity='0.2'/%3E%3Ccircle cx='10' cy='150' r='3' fill='%23A0522D' opacity='0.2'/%3E%3Ccircle cx='150' cy='150' r='3' fill='%23A0522D' opacity='0.2'/%3E%3C/svg%3E")`;

const CREAM_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpolygon points='100,30 120,65 100,100 80,65' fill='none' stroke='%232C2416' stroke-width='1.5' opacity='0.13'/%3E%3Cpolyline points='0,120 12,108 24,120 36,108 48,120 60,108 72,120 84,108 96,120 108,108 120,120 132,108 144,120 156,108 168,120 180,108 192,120 200,112' fill='none' stroke='%232C2416' stroke-width='1' opacity='0.11'/%3E%3Ccircle cx='30' cy='170' r='5' fill='%23C1714A' opacity='0.17'/%3E%3Ccircle cx='100' cy='170' r='5' fill='%23E6A817' opacity='0.17'/%3E%3Ccircle cx='170' cy='170' r='5' fill='%233A7D6B' opacity='0.17'/%3E%3C/svg%3E")`;

const STATS_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Cpolyline points='0,30 10,20 20,30 30,20 40,30 50,20 60,30 70,20 80,30 90,20 100,30' fill='none' stroke='%23ffffff' stroke-width='0.8' opacity='0.08'/%3E%3Ccircle cx='25' cy='50' r='3' fill='%23E6A817' opacity='0.15'/%3E%3Ccircle cx='75' cy='50' r='3' fill='%23E6A817' opacity='0.15'/%3E%3C/svg%3E")`;

const FOOTER_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='80'%3E%3Cpolygon points='60,10 74,35 60,60 46,35' fill='none' stroke='%23E6A817' stroke-width='0.8' opacity='0.1'/%3E%3Cellipse cx='20' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.06'/%3E%3Cellipse cx='100' cy='70' rx='8' ry='10' fill='%23E6A817' opacity='0.06'/%3E%3C/svg%3E")`;

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
        style={{
          background: "#1B5E20",
          backgroundImage: HERO_TILE,
          backgroundSize: "160px 160px",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E6A817]/40 bg-[#E6A817]/15 px-4 py-1.5 text-sm text-[#F5C842]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5C842] animate-pulse" />
              AI-powered · Multi-sport · Offline-first
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              Grassroots Sport<br />
              <em className="not-italic text-[#F5C842]">Pro Platform</em>
            </h1>

            <p className="mb-10 text-lg text-white/75 sm:text-xl">
              The complete sports platform for Africa&apos;s next generation of athletes.
              Train smarter, get scouted, and grow your game — whether you&apos;re in Harare or Hwange.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded px-8 py-3.5 text-sm font-bold text-[#2C2416] transition hover:-translate-y-px"
                style={{ background: "#E6A817" }}
              >
                Get started free <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded border border-white/35 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/6 transition"
              >
                <Play className="h-4 w-4" />
                Sign in
              </Link>
            </div>

            <p className="mt-6 text-sm text-[#F5C842]/80">
              Free for players · No credit card required · Download the app too
            </p>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg p-6 text-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(230,168,23,0.2)" }}
              >
                <Icon className="mx-auto mb-2 h-6 w-6 text-[#E6A817]" />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-white/55">{label}</p>
              </div>
            ))}
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
                className="group flex flex-col rounded-xl p-6 transition hover:-translate-y-1"
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
                className="rounded-xl p-6 transition hover:-translate-y-1"
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
        style={{
          background: "#1B5E20",
          backgroundImage: HERO_TILE,
          backgroundSize: "160px 160px",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Grassroots Sport" width={72} height={72} className="mx-auto mb-4" />
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

      {/* ── Pattern strip: charcoal + gold zigzag ────────────────────────────── */}
      <AfricanPatternStrip variant="dark" height={36} />

      {/* ── Footer — charcoal + diamond tile ─────────────────────────────────── */}
      <footer
        className="py-12 relative overflow-hidden"
        style={{
          background: "#2C2416",
          backgroundImage: FOOTER_TILE,
          backgroundSize: "120px 80px",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="Grassroots Sport" width={28} height={28} />
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
