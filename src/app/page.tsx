"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Award, Zap, ChevronRight, Radio, Users } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

const ThutoChatVisitor = dynamic(() => import("@/components/thuto/ThutoChatVisitor"), { ssr: false });
const PublicVideoGrid  = dynamic(() => import("@/components/home/PublicVideoGrid"),   { ssr: false });

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
      <PublicVideoGrid />

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
