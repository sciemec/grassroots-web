import type { Metadata } from "next";
import Link from "next/link";
import { Award, Zap, ChevronRight, Users, Brain, Video, QrCode, Shield, CheckCircle, Star, TrendingUp, Globe } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import LiveActivityWire from "@/components/home/LiveActivityWire";
import {
  DynamicPlayerStories    as PlayerStories,
  DynamicPublicVideoGrid  as PublicVideoGrid,
  DynamicThutoChatVisitor as ThutoChatVisitor,
} from "@/components/home/LandingDynamic";

export const metadata: Metadata = {
  title: "Grassroots Sports — Zimbabwe's #1 Talent Discovery Platform",
  description:
    "AI-powered athletic scoring, personalised training plans, and a digital Talent Passport that gets African grassroots athletes discovered by scouts worldwide — with nothing but a smartphone.",
  openGraph: {
    title: "Grassroots Sports — Identify. Nurture. Market.",
    description:
      "AI sports coaching, video analysis, and a Talent Passport for every Zimbabwean athlete. Free to join.",
    url: "https://grassrootssports.live",
    siteName: "Grassroots Sports",
    images: [
      {
        url: "https://grassrootssports.live/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grassroots Sports — Zimbabwe's AI Talent Platform",
      },
    ],
    locale: "en_ZW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grassroots Sports — Zimbabwe's #1 Talent Discovery Platform",
    description: "AI coaching, video analysis, and a digital Talent Passport for every African athlete.",
    images: ["https://grassrootssports.live/og-image.png"],
  },
};

/* ─── Chevron SVG background pattern ─────────────────────────────── */
const ChevronBg = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="chevron-pat" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
        <polyline
          points="0,20 20,0 40,20"
          fill="none"
          stroke="rgba(240,180,41,0.08)"
          strokeWidth="1.5"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#chevron-pat)" />
  </svg>
);

export default function GrassrootsSportsLanding() {
  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c3d22] selection:bg-[#f0b429]/30 antialiased font-sans">

      {/* Navigation */}
      <PublicNavbar />
      <div className="h-16" />

      {/* Player Moments — 24-hour stories strip */}
      <PlayerStories />

      {/* Live activity wire (client-only ticker) */}
      <LiveActivityWire />

      {/* ── HERO — dark green with chevron pattern ─────────────────── */}
      <header className="relative overflow-hidden py-20 lg:py-28 px-6 text-center" style={{ background: "#0d2e17" }}>
        <ChevronBg />

        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "#f0b429" }} />

        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-xs font-black uppercase tracking-wider"
            style={{ borderColor: "rgba(240,180,41,0.4)", color: "#f0b429", background: "rgba(240,180,41,0.08)" }}>
            <Zap size={13} />
            Zimbabwe&apos;s #1 AI Sports Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none text-white">
            Identify.{" "}
            <span style={{ color: "#f0b429" }}>Nurture.</span>{" "}
            <br className="hidden sm:block" />
            Market.
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg text-green-200 max-w-2xl mx-auto leading-relaxed font-medium">
            AI-powered scoring, personalised training plans, and a digital Talent Passport
            that gets African athletes discovered by scouts — with nothing but a smartphone.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wider transition-colors hover:brightness-110"
              style={{ background: "#f0b429", color: "#0d2e17" }}
            >
              Get started free <ChevronRight size={15} />
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wider border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "white" }}
            >
              Discover talent <Users size={15} />
            </Link>
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {[
              { value: "354+", label: "Athletes" },
              { value: "10",   label: "Sports" },
              { value: "8",    label: "Provinces" },
              { value: "Free", label: "to join" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl px-4 py-2 text-center"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <p className="text-lg font-black text-white leading-none">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#f0b429" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background: "linear-gradient(to bottom, transparent, #f4f2ee)" }} />
      </header>

      {/* ── SPORTS STRIP ──────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-5 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
            10 sports · one platform
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              ["⚽","Football"],["🏉","Rugby"],["🏃","Athletics"],["🏐","Netball"],
              ["🏀","Basketball"],["🏏","Cricket"],["🏊","Swimming"],["🎾","Tennis"],
              ["🏐","Volleyball"],["🏑","Hockey"],
            ].map(([emoji, sport]) => (
              <span key={sport} className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <span>{emoji}</span>{sport}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Public athlete video grid */}
      <div id="features">
        <PublicVideoGrid />
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
            Simple as 1 – 2 – 3
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">How it works</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              color: "#1c3d22",
              title: "Register free",
              body: "Sign up in two minutes with just your phone. Choose your sport, position, and province. No credit card.",
            },
            {
              step: "02",
              color: "#f0b429",
              title: "Log training & matches",
              body: "Record sessions, upload skill clips, and run GRS fitness tests. THUTO AI scores your performance after every session.",
            },
            {
              step: "03",
              color: "#b91c1c",
              title: "Get discovered",
              body: "Your AI-generated Talent Passport is public. Scouts and coaches find you by sport, province, and position — anywhere in the world.",
            },
          ].map(({ step, color, title, body }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shadow-md"
                style={{ background: color, color: color === "#f0b429" ? "#0d2e17" : "white" }}
              >
                {step}
              </div>
              <h3 className="font-black text-gray-900 text-base">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-black uppercase tracking-wider transition-colors hover:brightness-110"
            style={{ background: "#1c3d22", color: "#f0b429" }}
          >
            Create your free profile <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── THREE ROLES — dark section ────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6" style={{ background: "#0d2e17" }}>
        <ChevronBg />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
              Built for everyone in sport
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">One platform. Three roles.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp size={24} />,
                role: "Athlete",
                tagline: "Get seen. Get signed.",
                points: ["AI training plans", "Talent Passport QR code", "Skill video uploads", "THUTO AI coach chat"],
                accent: "#f0b429",
                href: "/register",
              },
              {
                icon: <Users size={24} />,
                role: "Coach",
                tagline: "Manage. Develop. Win.",
                points: ["Squad management", "Live match dashboard", "Register players instantly", "Coach-verified fitness scores"],
                accent: "#4ade80",
                href: "/register",
              },
              {
                icon: <Globe size={24} />,
                role: "Scout",
                tagline: "Discover hidden talent.",
                points: ["Browse 354+ athletes", "Filter by sport & province", "Shortlist & compare players", "PDF scouting reports"],
                accent: "#60a5fa",
                href: "/register",
              },
            ].map(({ icon, role, tagline, points, accent, href }) => (
              <div
                key={role}
                className="rounded-2xl p-6 flex flex-col gap-4 border"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: accent + "22", color: accent }}>
                  {icon}
                </div>
                <div>
                  <p className="text-lg font-black text-white">{role}</p>
                  <p className="text-sm font-semibold" style={{ color: accent }}>{tagline}</p>
                </div>
                <ul className="space-y-2 flex-1">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-green-200">
                      <CheckCircle size={13} style={{ color: accent, flexShrink: 0 }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="mt-2 block text-center rounded-xl py-2.5 text-sm font-bold transition-colors hover:brightness-110"
                  style={{ background: accent, color: "#0d2e17" }}
                >
                  Join as {role}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY FEATURES ──────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "#f4f2ee" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
              Built for Zimbabwe
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              Everything a grassroots athlete needs
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                Icon: Brain,
                title: "THUTO AI Coach",
                body: "Your personal AI sports coach — answers training questions, builds weekly plans, and analyses your stats in plain language.",
              },
              {
                Icon: QrCode,
                title: "Talent Passport",
                body: "A shareable, QR-linked profile with your stats, fitness scores, and highlight clips. Hand it to any scout — no paper CV needed.",
              },
              {
                Icon: Video,
                title: "Video Analysis",
                body: "Upload a drill or match clip. AI breaks down your technique and gives drill recommendations in seconds.",
              },
              {
                Icon: Shield,
                title: "Verified Performance",
                body: "Coach-verified EUROFIT tests and GRS fitness scores. Scouts know your numbers are real, not self-reported.",
              },
              {
                Icon: Users,
                title: "Multi-sport",
                body: "Football, rugby, athletics, netball, basketball, cricket and more. One platform, all sports — with sport-specific stats for each.",
              },
              {
                Icon: Zap,
                title: "Works on 2G",
                body: "Designed for Zimbabwe's network conditions. Fast, lightweight, and fully functional on low-bandwidth mobile data.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#e8f5e9" }}
                >
                  <Icon size={20} style={{ color: "#1c3d22" }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ────────────────────────────────────── */}
      <section className="py-10 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8">
          {[
            { icon: <Star size={18} style={{ color: "#f0b429" }} />, stat: "354+", label: "Registered athletes" },
            { icon: <Globe size={18} style={{ color: "#1c3d22" }} />, stat: "8",    label: "Provinces covered" },
            { icon: <Award size={18} style={{ color: "#b91c1c" }} />, stat: "10",   label: "Sports supported" },
            { icon: <Zap size={18} style={{ color: "#1c3d22" }} />,   stat: "$0",   label: "Cost to join" },
          ].map(({ icon, stat, label }) => (
            <div key={label} className="flex items-center gap-3">
              {icon}
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{stat}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-[#f4f2ee]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
              Affordable for every Zimbabwean
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Simple pricing</h2>
            <p className="text-sm text-gray-500 mt-2">Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                color: "#1c3d22",
                features: ["Player profile & Talent Passport", "Training log", "THUTO AI chat", "1 sport", "Public discovery listing"],
                cta: "Get started free",
                href: "/register",
                highlight: false,
              },
              {
                name: "School",
                price: "$10",
                period: "per month",
                color: "#f0b429",
                features: ["Everything in Free", "Up to 3 sports", "20 video uploads/month", "Team roster management", "Coach dashboard"],
                cta: "Start free trial",
                href: "/register",
                highlight: true,
              },
              {
                name: "Pro-Local",
                price: "$25",
                period: "per month",
                color: "#1c3d22",
                features: ["Everything in School", "All 10 sports", "Unlimited video", "Live match dashboard", "Scout recruitment tools"],
                cta: "Start free trial",
                href: "/register",
                highlight: false,
              },
            ].map(({ name, price, period, color, features, cta, href, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl border p-6 flex flex-col ${highlight ? "shadow-xl" : ""}`}
                style={{
                  borderColor:  highlight ? "#f0b429" : "#e5e7eb",
                  background:   highlight ? "#fffbeb" : "white",
                  transform:    highlight ? "scale(1.03)" : undefined,
                }}
              >
                {highlight && (
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full self-start mb-3"
                    style={{ background: "#f0b429", color: "#0d2e17" }}
                  >
                    Most popular
                  </span>
                )}
                <p className="font-black text-gray-900 text-base">{name}</p>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-black" style={{ color }}>{price}</span>
                  <span className="text-xs text-gray-400 ml-1">/{period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="block text-center rounded-xl py-3 text-sm font-bold transition-colors hover:brightness-110"
                  style={
                    highlight
                      ? { background: "#f0b429", color: "#0d2e17" }
                      : { background: "#1c3d22", color: "#f0b429" }
                  }
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Prices in USD · EcoCash &amp; Stripe accepted · Cancel any time
          </p>
        </div>
      </section>

      {/* ── FINAL CTA — dark with chevron ─────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center" style={{ background: "#0d2e17" }}>
        <ChevronBg />
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "#f0b429" }} />
        <div className="relative max-w-2xl mx-auto space-y-5">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#f0b429" }}>
            Join today — it&apos;s free
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            The next great Zimbabwean athlete is already out there.
          </h2>
          <p className="text-green-200 text-base font-medium leading-relaxed">
            Make sure the world can find them.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-black uppercase tracking-wider transition-colors hover:brightness-110"
              style={{ background: "#f0b429", color: "#0d2e17" }}
            >
              Create your free profile <ChevronRight size={15} />
            </Link>
            <Link
              href="/players"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-sm font-black uppercase tracking-wider border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "white" }}
            >
              Browse athletes <Users size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
        <section className="bg-[#1c3d22] py-10 px-4 text-center">
          <p className="text-white text-sm font-bold mb-1">Already have a smartphone?</p>
          <p className="text-green-200 text-xs mb-4">Chat with THUTO — your AI coach — directly on WhatsApp.</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent("START")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-sm px-6 py-3 rounded-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Start chatting with THUTO
          </a>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          <Award size={32} className="text-[#1c3d22]" />
          <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest text-center">
            Grassroots Sports Development Network &copy; 2026 &middot; Identify, Nurture, and Market Talent
          </p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">
            Zimbabwe&apos;s First AI-Powered Multi-Sport Talent Discovery Platform
          </p>
          <div className="flex items-center gap-4 mt-1">
            <Link href="/privacy" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</Link>
            <a href="mailto:sciemeq@gmail.com" className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <ThutoChatVisitor />
    </div>
  );
}
