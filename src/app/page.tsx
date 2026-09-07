"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Award, Zap, ChevronRight, Radio, Users, Brain, Video, QrCode, Shield, CheckCircle } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

const ThutoChatVisitor = dynamic(() => import("@/components/thuto/ThutoChatVisitor"), { ssr: false });
const PublicVideoGrid  = dynamic(() => import("@/components/home/PublicVideoGrid"),   { ssr: false });
const PlayerStories    = dynamic(() => import("@/components/home/PlayerStories"),     { ssr: false });

export default function GrassrootsSportsLanding() {
  const [activityWire, setActivityWire] = useState<string[]>([]);
  const [wireIndex,    setWireIndex]    = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticker-wire`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.ticker_items) setActivityWire(data.ticker_items); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activityWire.length === 0) return;
    const interval = setInterval(() => {
      setWireIndex((prev) => (prev + 1) % activityWire.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activityWire.length]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c3d22] selection:bg-[#f0b429]/30 antialiased font-sans">

      {/* Navigation */}
      <PublicNavbar />

      {/* Player Moments — 24-hour stories strip */}
      <PlayerStories />

      {/* Live activity wire */}
      {activityWire.length > 0 && (
        <div className="bg-[#fffbeb] border-b border-amber-200 py-2.5 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <span className="flex items-center gap-1 bg-[#1c3d22] text-[#f0b429] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0">
              <Radio size={10} className="animate-pulse" /> Live
            </span>
            <p className="text-xs font-bold text-amber-950 truncate transition-all duration-500">
              {activityWire[wireIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#e2f0d9] via-[#f0f9e8] to-[#f4f2ee] border-b border-[#1c3d22]/10 py-16 lg:py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/80 border border-[#1c3d22]/10 rounded-full px-4 py-1.5 mb-2 shadow-3xs">
            <Zap size={14} className="text-[#1c3d22]" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Zimbabwe&apos;s #1 Talent Discovery Platform
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-none">
            Identify. Nurture.{" "}
            <span className="text-[#1c3d22] border-b-4 border-[#f0b429]">Market.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered athletic scoring, personalised training curricula, and a
            digital Talent Passport built to get African grassroots athletes
            discovered by scouts &mdash; with nothing but a smartphone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/register"
              className="bg-[#f0b429] text-[#1c3d22] border-2 border-[#1c3d22] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Get Started <ChevronRight size={14} />
            </Link>
            <Link
              href="/players"
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-3xs"
            >
              Discover Talent <Users size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Public athlete video grid */}
      <div id="features">
        <PublicVideoGrid />
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
            Simple as 1 – 2 – 3
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">How it works</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Register free",
              body: "Sign up in two minutes with just your phone. Choose your sport, position, and province. No credit card.",
            },
            {
              step: "02",
              title: "Log training & matches",
              body: "Record sessions, upload skill clips, and run GRS fitness tests. THUTO AI scores your performance after every session.",
            },
            {
              step: "03",
              title: "Get discovered",
              body: "Your AI-generated Talent Passport is public. Scouts and coaches find you by sport, province, and position — anywhere in the world.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                style={{ background: "#1c3d22", color: "#f0b429" }}
              >
                {step}
              </div>
              <h3 className="font-black text-gray-900 text-base">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider transition-colors"
            style={{ background: "#1c3d22", color: "#f0b429" }}
          >
            Create your free profile <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── KEY FEATURES ─────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ background: "#f4f2ee" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
              Built for Zimbabwe
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
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
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "#e8f5e9" }}
                >
                  <Icon size={20} style={{ color: "#1c3d22" }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#f0b429" }}>
              Affordable for every Zimbabwean
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Simple pricing</h2>
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
                name: "Pro Club",
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
                className={`rounded-2xl border p-6 flex flex-col ${highlight ? "shadow-lg" : ""}`}
                style={{
                  borderColor:  highlight ? "#f0b429" : "#e5e7eb",
                  background:   highlight ? "#fffbeb" : "white",
                }}
              >
                {highlight && (
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full self-start mb-3"
                    style={{ background: "#f0b429", color: "#1c3d22" }}
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
                  className="block text-center rounded-xl py-2.5 text-sm font-bold transition-colors"
                  style={
                    highlight
                      ? { background: "#f0b429", color: "#1c3d22" }
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

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center px-4">
        <Award size={32} className="mx-auto text-[#1c3d22] mb-2" />
        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">
          Grassroots Sports Development Network &copy; 2026 &middot; Identify, Nurture, and Market Talent
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Zimbabwe&apos;s First AI-Powered Multi-Sport Talent Discovery Platform
        </p>
      </footer>

      <ThutoChatVisitor />
    </div>
  );
}
