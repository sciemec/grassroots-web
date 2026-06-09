"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Zap, BookOpen, Dumbbell, Target, Brain, Award, 
  Activity, QrCode, TrendingUp, Heart, Users, MapPin, 
  ChevronRight, Radio, ShieldCheck, GraduationCap
} from "lucide-react";

// 🔴 REACT #185 LOOP PREVENTION: Use individual atomic selectors
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import { LiveMatchBanner } from "@/components/LiveMatchBanner";

export default function PlayerDashboardHome() {
  const router = useRouter();
  
  // Zustand atomic state selectors
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  // Live Ticker State Management
  const [wireIndex, setWireIndex] = useState(0);

  const activityWire = [
    "⚡ K.M. (U17 Striker, Harare) just clocked a 2.84s 20m sprint line benchmark!",
    "🍀 Coach Moyo (Matabeleland North) logged a 4-3-3 tactical blueprint loop.",
    "🔥 T.N. (U13 Midfielder, Bulawayo) cleared a 45cm vertical leap threshold classification.",
    "🛡️ Zimbiru Primary School NASH cohort profile synced into the National Talent Database.",
    "⚡ S.G. (Senior Tier Wingback, Manicaland) logged a 15-second manual heart rate recovery index.",
    "🍀 Teach for Zimbabwe Mobile Lab Ingestion Engine activated for Hwange District schools."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWireIndex((prev) => (prev + 1) % activityWire.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activityWire.length]);

  // Auth Protection Guard Check
  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <Activity className="animate-spin text-[#1c3d22]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans selection:bg-[#f0b429]/30 antialiased">
      
      {/* 🇿🇼 TOP BRAND PARTNERSHIP LOGO PANEL */}
      <div className="bg-[#1c3d22] text-white border-b-4 border-[#f0b429] px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#f0b429] p-2 rounded-xl text-[#1c3d22]">
              <Target size={20} className="stroke-[3]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">GrassRoots Sports Hub</h1>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">National Talent Production Pipeline</p>
            </div>
          </div>
          
          {/* TEACH FOR ZIMBABWE STRATEGIC PARTNER BRANDING LOGO */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-1.5 rounded-xl border border-white/10 shadow-xs">
            <GraduationCap size={16} className="text-[#f0b429]" />
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-widest text-[#f0b429] leading-none">Strategic Education Partner</span>
              <span className="text-[11px] font-black tracking-tight text-white uppercase">Teach For Zimbabwe</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📡 LIVE REGIONAL ACTIVITY WIRE LOG */}
      <div className="bg-[#fffbeb] border-b border-amber-100 py-2.5 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 shadow-3xs">
            <Radio size={10} className="animate-pulse" /> Live Wire
          </span>
          <p className="text-xs font-bold text-amber-900 transition-all duration-500 ease-in-out truncate animate-fade-in">
            {activityWire[wireIndex]}
          </p>
        </div>
      </div>

      {/* MAIN DASHBOARD HUD CONTAINER */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        {/* 🏆 WORLD CUP LIVE BANNER */}
        <LiveMatchBanner />

        {/* 🎛️ ECOSYSTEM INFRASTRUCTURE QUICK-LINKS */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ecosystem Infrastructure Engines</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <Link href="/player/success" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#c8962a]"><Zap size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">THUTO Success Engine</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Streak monitoring & daily check-ins</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors" />
            </Link>

            <Link href="/player/passport" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700"><BookOpen size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">Scannable Talent Passport</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Verified public A4 scout portfolio</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors" />
            </Link>

            <Link href="/player/training" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700"><Activity size={16} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">AI Training Lab Engine</h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">Live MediaPipe camera frame scans</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors" />
            </Link>

          </div>
        </section>

        {/* CORE WORKSPACE TRILOGY HOOKS */}
        <section className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Core Training & Management Operations</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* CARD 1: IDENTIFY */}
            <Link href="/player/sessions/new" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-5 rounded-3xl flex flex-col justify-between h-40 transition-all shadow-3xs group">
              <div className="bg-emerald-50 text-emerald-700 w-9 h-9 rounded-xl flex items-center justify-center"><Activity size={16} /></div>
              <div>
                <h3 className="text-xs font-black uppercase text-gray-900 tracking-wide">Train Now (Identify)</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-snug">Log biometric calibration sessions and match play metrics.</p>
              </div>
            </Link>

            {/* CARD 2: NURTURE (UPDATED TO TRUE POSITION DRILLS SYSTEM) */}
            <Link href="/player/drills" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-5 rounded-3xl flex flex-col justify-between h-40 transition-all shadow-3xs group">
              <div className="bg-blue-50 text-blue-700 w-9 h-9 rounded-xl flex items-center justify-center"><Dumbbell size={16} /></div>
              <div>
                <h3 className="text-xs font-black uppercase text-gray-900 tracking-wide">Drills Lab (Nurture)</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-snug">Get specific drills tailored for your position: Striker, Winger, Midfielder, Defender, or Goalkeeper.</p>
              </div>
            </Link>

            {/* CARD 3: MARKET */}
            <Link href="/player/talent-id" className="bg-white border border-gray-200 hover:border-[#1c3d22] p-5 rounded-3xl flex flex-col justify-between h-40 transition-all shadow-3xs group">
              <div className="bg-purple-50 text-purple-700 w-9 h-9 rounded-xl flex items-center justify-center"><Award size={16} /></div>
              <div>
                <h3 className="text-xs font-black uppercase text-gray-900 tracking-wide">Scout Visibility (Market)</h3>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5 leading-snug">Lorem manage your digital passport visibility for regional review loops.</p>
              </div>
            </Link>

          </div>
        </section>

        {/* ATHLETE IDENTITY SUMMARY FOOTER HUD */}
        <footer className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1c3d22] text-[#f0b429] font-black text-xs flex items-center justify-center uppercase shadow-3xs">
              {user.name ? user.name.slice(0,2) : "GR"}
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900 uppercase tracking-wide">Active Ingestion Session: {user.name}</h5>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={10} /> Syncing Region: {user.province || "Harare, ZW"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg border border-emerald-100">
            <ShieldCheck size={12} className="text-emerald-700" /> Secure Database Sync Active
          </div>
        </footer>

      </main>
    </div>
  );
}