import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import {
  Users, Dumbbell, Brain, Trophy, Globe, Shield, Zap, Star, ChevronRight, Play,
} from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const sports = [
  { name: "Football",   icon: "⚽", color: "bg-green-500" },
  { name: "Basketball", icon: "🏀", color: "bg-orange-500" },
  { name: "Athletics",  icon: "🏃", color: "bg-blue-500" },
  { name: "Volleyball", icon: "🏐", color: "bg-yellow-500" },
  { name: "Cricket",    icon: "🏏", color: "bg-red-500" },
  { name: "Netball",    icon: "🥅", color: "bg-purple-500" },
  { name: "Rugby",      icon: "🏉", color: "bg-amber-600" },
  { name: "Swimming",   icon: "🏊", color: "bg-cyan-500" },
  { name: "Tennis",     icon: "🎾", color: "bg-lime-500" },
  { name: "Hockey",     icon: "🏑", color: "bg-teal-500" },
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
    accent: "text-green-400",
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
    accent: "text-blue-400",
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
    accent: "text-yellow-400",
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
    accent: "text-pink-400",
  },
];

const stats = [
  { value: "10,000+", label: "Registered Athletes", icon: Users },
  { value: "50,000+", label: "Training Sessions", icon: Dumbbell },
  { value: "10", label: "Sports Supported", icon: Trophy },
  { value: "10", label: "Provinces Covered", icon: Globe },
];

const aiFeatures = [
  {
    icon: Brain,
    title: "AI Coach (Claude)",
    description: "Real-time technique feedback using pose detection and Claude's reasoning. Know exactly what to fix after every session.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Zap,
    title: "Training Plan Generator",
    description: "Tell Claude your goals — get a personalised weekly programme built around your age group, position, and fitness level.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Shield,
    title: "Injury Risk Analysis",
    description: "AI monitors training load patterns and flags early warning signs of overuse injuries before they sideline you.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: Star,
    title: "Scout Reports (AI)",
    description: "Scouts get Claude-generated comparative reports: strengths, weaknesses, potential — all from real session data.",
    color: "text-green-400",
    bg: "bg-green-500/10",
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
    <div className="min-h-screen text-white">
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        {/* Zimbabwe colour blobs: green · gold · red */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-green-400/15 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-64 w-64 rounded-full bg-[#f0b429]/10 blur-3xl" />
          <div className="absolute left-1/2 bottom-0 h-48 w-48 rounded-full bg-[#ce1126]/8 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f0b429]/40 bg-[#f0b429]/10 px-4 py-1.5 text-sm text-[#f0b429]">
              <Zap className="h-3.5 w-3.5" />
              AI-powered · Multi-sport · Offline-first
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Grassroots Sport<br />
              <span className="text-[#f0b429]">Pro Platform</span>
            </h1>

            <p className="mb-10 text-lg text-green-200 sm:text-xl">
              The complete sports platform for Africa&apos;s next generation of athletes.
              Train smarter, get scouted, and grow your game — whether you&apos;re in Harare or Hwange.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-8 py-3.5 text-base font-semibold text-[#1a3a1a] hover:bg-[#f5c842] transition-colors shadow-lg shadow-[#f0b429]/20"
              >
                Get started free <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Play className="h-4 w-4" />
                Sign in
              </Link>
            </div>

            <p className="mt-6 text-sm text-[#f0b429]/80">
              Free for players · No credit card required · Download the app too
            </p>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
              >
                <Icon className="mx-auto mb-2 h-6 w-6 text-green-400" />
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-xs text-green-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sports Strip ─────────────────────────────────────────────────────── */}
      <section id="sports" className="border-y border-[#f0b429]/20 bg-[#f0b429]/5 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">10 Sports, One Platform</h2>
            <p className="mt-2 text-green-300">Track and improve across the sports Africa loves most</p>
          </div>

          <div className="grid grid-cols-5 gap-4 sm:grid-cols-10">
            {sports.map(({ name, icon, color }) => (
              <div
                key={name}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}/20`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <span className="text-xs font-medium text-green-200">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Built for everyone in the game</h2>
            <p className="mt-3 text-lg text-green-300">
              Every role has its own hub — tailored tools, tailored AI
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-green-500/40 hover:bg-white/8 transition-all"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{role.icon}</span>
                  <div>
                    <h3 className={`text-lg font-bold ${role.accent}`}>{role.label}</h3>
                    <p className="text-xs text-green-400">Hub</p>
                  </div>
                </div>

                <h4 className="mb-2 text-base font-semibold text-white">{role.headline}</h4>
                <p className="mb-5 text-sm text-green-300 leading-relaxed">{role.description}</p>

                <ul className="mb-6 flex-1 space-y-2">
                  {role.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-green-200">
                      <span className="mt-0.5 text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={role.href}
                  className="mt-auto flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  {role.cta} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Features ─────────────────────────────────────────────────────── */}
      <section id="ai" className="border-y border-white/10 bg-gradient-to-b from-white/5 to-transparent py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
              <Brain className="h-3.5 w-3.5" />
              Powered by Claude AI
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">AI that actually understands sport</h2>
            <p className="mt-3 text-lg text-green-300">
              Every insight is generated from real training data — not generic advice
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aiFeatures.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="mb-2 font-semibold text-white">{title}</h3>
                <p className="text-sm text-green-300 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* AI Chat Preview */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="mb-3 text-2xl font-bold">Ask your AI Coach anything</h3>
                <p className="mb-6 text-green-300">
                  Claude analyses your biomechanics, drill scores, and session history to give you
                  specific, actionable coaching feedback — in English or Shona.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Why is my shooting weak?", "How do I improve my first touch?", "Ndisimudze sei?"].map((q) => (
                    <span
                      key={q}
                      className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mock chat bubble */}
              <div className="rounded-xl border border-white/10 bg-green-950/60 p-4 font-mono text-sm">
                <div className="mb-3 flex items-center gap-2 text-xs text-green-400">
                  <Brain className="h-3.5 w-3.5" />
                  AI Coach · Claude
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/10 px-3 py-2 text-green-100 text-xs">
                    How can I improve my heading ability?
                  </div>
                  <div className="rounded-lg bg-green-600/20 px-3 py-2 text-green-200 text-xs leading-relaxed">
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

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Simple, affordable pricing</h2>
            <p className="mt-3 text-lg text-green-300">
              Designed for the African grassroots ecosystem
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-6 ${
                  plan.highlighted
                    ? "border-2 border-[#f0b429] bg-[#f0b429]/10"
                    : "border border-white/10 bg-white/5"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[#f0b429] px-3 py-1 text-xs font-bold text-[#1a3a1a]">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-green-400">{plan.period}</span>
                  </div>
                  <p className="mt-2 text-sm text-green-300">{plan.description}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-green-200">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-[#f0b429] text-[#1a3a1a] font-bold hover:bg-[#f5c842]"
                      : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#f0b429]/20 bg-gradient-to-t from-[#f0b429]/8 py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Grassroots Sport" width={72} height={72} className="mx-auto mb-4" />
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Start your journey today
          </h2>
          <p className="mb-8 text-lg text-green-300">
            Join thousands of athletes, coaches, and scouts building African grassroots sport
            with data and AI.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-8 py-4 text-base font-bold text-[#1a3a1a] hover:bg-[#f5c842] transition-colors shadow-lg shadow-[#f0b429]/25"
          >
            Create free account <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Grassroots Sport" width={28} height={28} />
                <span className="font-bold text-white">Grassroots Sport</span>
              </div>
              <p className="text-sm text-green-400">
                AI-powered sports platform for Africa&apos;s next generation.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-green-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/#ai" className="hover:text-white">AI Coach</Link></li>
                <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/#sports" className="hover:text-white">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Roles</h4>
              <ul className="space-y-2 text-sm text-green-400">
                <li><Link href="/register?role=player" className="hover:text-white">Player Hub</Link></li>
                <li><Link href="/register?role=coach" className="hover:text-white">Coach Hub</Link></li>
                <li><Link href="/register?role=scout" className="hover:text-white">Scout Hub</Link></li>
                <li><Link href="/register?role=fan" className="hover:text-white">Fan Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Contact</h4>
              <ul className="space-y-2 text-sm text-green-400">
                <li>Zimbabwe 🇿🇼</li>
                <li>
                  <a href="mailto:support@grassrootssports.live" className="hover:text-white">
                    support@grassrootssports.live
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs text-green-500">
            <span>© {new Date().getFullYear()} Grassroots Sport Pro. Built in Zimbabwe 🇿🇼</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-green-300 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-green-300 transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
