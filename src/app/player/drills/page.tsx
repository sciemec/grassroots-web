"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Dumbbell, Target, Shield, Award, Users, 
  ArrowLeft, GraduationCap, Play, 
  CheckCircle2, AlertTriangle, Apple, Brain, Activity
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// 🎛️ COMPLETE PERSONALIZED FOOTBALL TRACK DATA MATRIX
const FOOTBALL_POSITION_DRILLS = {
  striker: {
    title: "Striker & Attacking Forward Track",
    focus: "Attacking intent, positive back-foot turns, crossing synchronization, and clinical box finishing.",
    advice: {
      pre: "Before this drill session eat sadza with peanut butter or maputi (popcorn) 1 hour before to keep energy high and feet quick.",
      post: "After technical training your muscles need repair. Eat beans and sadza or two boiled eggs within 30 minutes to develop muscle memory faster.",
      tactical: "On match day eat sadza with chicken or beans 3 hours before kickoff. Eat a small banana 30 minutes before for quick energy."
    },
    drills: [
      { id: "eng_st_01", name: "Lions' Den Central Turning", duration: "15 mins", description: "Receive a firm vertical entry pass inside a tight, heavily congested 8x8-yard embedded square under physical contact. Protect the ball with your body, turn sharply on the half-turn, and play forward." },
      { id: "eng_st_02", name: "Tri-Third Elimination End Zones", duration: "20 mins", description: "Combine out of the defensive third to play an incisive, firm line-breaking pass past the midfield layer. Time your forward run into the shaded end zone to collect and finish without running offside." },
      { id: "eng_st_03", name: "Three-Goal Endline Finale", duration: "15 mins", description: "Small-sided competitive match attacking a baseline equipped with one large central goal and two corner mini-goals. Any regular goal is 1 point; an instinctive first-time finish is worth 2 points." }
    ]
  },
  midfielder: {
    title: "Central Midfield & Pivot Track",
    focus: "Pre-receipt shoulder scanning, body shape openness, cover shadows drop, and tactical point switches.",
    advice: {
      pre: "Before tactical training drink water and eat a banana or guava if available. Your brain needs to be fueled to make fast decisions.",
      post: "After tactical training drink water first then eat sadza with any relish available. Your brain recovers through good food and sleep.",
      tactical: "Scan for 'BOTS' to gain key information before receiving: ball position, opposition players, teammates, and space."
    },
    drills: [
      { id: "cat_md_01", name: "Barcelona 3-2-1 Build Up Choices", duration: "15 mins", description: "7v7 positional small-sided game. Receive deep build-up passes from the center-back, scan before receiving, use your back foot to open your body shape, and decide whether to combine via a central wall-pass or switch play wide." },
      { id: "eng_md_02", name: "Around the Clock Passing Ring", duration: "12 mins", description: "Position symmetrically around a 20-yard diameter circle area. Execute rapid one-touch and two-touch passing patterns through and across the clock structure to break blocks while central defenders chase interceptions." },
      { id: "eng_md_03", name: "Connect Four Corner Squares", duration: "20 mins", description: "A 35x20-yard directional transition game. Midfielders use quick horizontal circulation to pull the defensive block out of alignment, then launch a vertical through-ball into any of the 4 shaded corner target boxes." }
    ]
  },
  defender: {
    title: "Defensive Unit & Fullback Track",
    focus: "Defensive approach angles, arm's-length pressure, deceleration breaking, and line cover support.",
    advice: {
      pre: "Before speed and fitness training eat sweet potato or two slices of bread with peanut butter 90 minutes before for sprinting energy.",
      post: "After speed and fitness training your body needs protein urgently. Eat road runner chicken, beans, or eggs within 45 minutes.",
      tactical: "Adopt a low, side-on body stance with knees bent, using the lead foot to guide the direction of the next pass."
    },
    drills: [
      { id: "eng_df_01", name: "Angled Pressing & Directional Dictation", duration: "15 mins", description: "Approach a perimeter attacker at an angle rather than straight-on to limit their options. Get within arm's-length to apply high pressure and dictate their movement toward the wide sidelines or weaker side goals." },
      { id: "eng_df_02", name: "Cover and Recover Horizontal Channels", duration: "15 mins", description: "Work in tandem inside a pitch split horizontally into thirds. Establish optimal supporting distances between the pressing and covering players; if the primary presser is bypassed, the covering player steps out immediately while you recover underneath." },
      { id: "eng_df_03", name: "Line Cover and Press 2v2", duration: "20 mins", description: "Small-sided area with mini-goals behind a baseline. The out-of-possession duo must work together seamlessly: one player steps out to actively press the ball carrier while the other provides deep covering support on the line directly in front of the goal mouth." }
    ]
  },
  goalkeeper: {
    title: "Goalkeeper Elite Protocol",
    focus: "Balls-of-feet readiness, handling holds ('W' and 'M' catch styles), low ground diving, and wide distribution.",
    advice: {
      pre: "Before mental and pressure training eat a light meal — eggs with bread or sadza with vegetables. Do not train on an empty stomach.",
      post: "After a tough mental session eat something you enjoy like maputi or roasted peanuts to reward yourself and grow confidence.",
      tactical: "Always distribute WIDE to the wings. Look left or right first, never throw into crowded central areas where opponents intercept."
    },
    drills: [
      { id: "so_gk_01", name: "Ground Side-Diving & Ball Recovery", duration: "15 mins", description: "Crouch to lower your center of gravity before diving on the side of your body (not your stomach). Get both hands to the ball using the secure 'M' little-finger line for low shots, then immediately hug it into your chest." },
      { id: "so_gk_02", name: "The 'W' & 'M' Handling Fundamentals", duration: "10 mins", description: "Practice forming a 'W' with your thumbs almost touching to secure incoming high balls, and an 'M' with little fingers touching to handle low balls. Stand lightly on the balls of your feet with hands open at waist height." },
      { id: "eng_gk_03", name: "Circular Target-Gate Angle Coverage", duration: "15 mins", description: "Position inside standalone square keeper boxes placed symmetrically within a circle layout. Move dynamically to adjust your positioning angle relative to passing pairs, making safe interceptions on first-time pass inputs." }
    ]
  }
};

export default function FootballDrillsLabPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  // Locked positional state configuration
  const [activePosition, setActivePosition] = useState<keyof typeof FOOTBALL_POSITION_DRILLS>("striker");
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
    } else {
      // 🚀 STRICT AUTOMATED PIPELINE LOCK
      const mappedRole = (user.position || "").toLowerCase();
      if (mappedRole.includes("strik") || mappedRole.includes("forward") || mappedRole.includes("attac")) {
        setActivePosition("striker");
      } else if (mappedRole.includes("mid") || mappedRole.includes("play") || mappedRole.includes("wing")) {
        setActivePosition("midfielder");
      } else if (mappedRole.includes("def") || mappedRole.includes("back") || mappedRole.includes("stop")) {
        setActivePosition("defender");
      } else if (mappedRole.includes("keep") || mappedRole.includes("goal")) {
        setActivePosition("goalkeeper");
      }
    }
  }, [hydrated, user, router]);

  const handleInitializeDrill = async (drillId: string) => {
    setIsSyncing(drillId);
    
    // 📡 PIPELINE PROGRESS MONITORING HOOK (Simulating API sync to Render backend)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setCompletedDrills((prev) =>
        prev.includes(drillId) ? prev.filter((id) => id !== drillId) : [...prev, drillId]
      );
    } catch (error) {
      console.error("Backend metrics sync failed:", error);
    } finally {
      setIsSyncing(null);
    }
  };

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <Dumbbell className="animate-spin text-[#1c3d22]" size={32} />
      </div>
    );
  }

  const selectedData = FOOTBALL_POSITION_DRILLS[activePosition];

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans selection:bg-[#f0b429]/30 antialiased">
      
      {/* 🏁 TEACH FOR ZIMBABWE BRANDED HEADER BARS */}
      <div className="bg-[#1c3d22] text-white border-b-4 border-[#f0b429] px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors mr-1">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">GRS Talent Nurture Lab</h1>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Locked Linear Nurture Track</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs px-4 py-1.5 rounded-xl border border-white/10 shadow-xs">
            <GraduationCap size={16} className="text-[#f0b429]" />
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-widest text-[#f0b429] leading-none">Strategic Education Partner</span>
              <span className="text-[11px] font-black tracking-tight text-white uppercase">Teach For Zimbabwe</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

        {/* 🇿🇼 MEDICAL SAFEGUARD CONCUSSION GUIDELINE NOTICE BANNER */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 shadow-3xs">
          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
          <div>
            <h5 className="text-xs font-black uppercase text-orange-900 tracking-wide">FA Medical Safeguard Rule: Concussion Restraint</h5>
            <p className="text-[11px] text-orange-700 font-semibold mt-0.5 leading-relaxed">
              Core Protocol: <strong>If In Doubt, Sit Them Out.</strong> Suspected head trauma requires an immediate timeline removal from play. Cognitive recovery overrides physical training; players must be completely symptom-free before initiating graduated progression tracks. Do not teach headers until U10 minimum.
            </p>
          </div>
        </div>

        {/* 🧠 ASSIGNED WORKSPACE PARADIGM FRAME */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT TRACK DESCRIPTION METRIC OVERVIEW & TARGETED LOCAL NUTRITION INFORMATION */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* CORE WORKSPACE OPTION CARD */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-3xs space-y-4">
              <div className="bg-blue-50 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs">
                <Dumbbell size={20} />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black uppercase tracking-tight text-gray-900">{selectedData.title}</h2>
                <span className="inline-block bg-[#1c3d22] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-[#1c3d22]">
                  AI Pipeline Profile Locked
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                {selectedData.focus}
              </p>
              <div className="border-t border-gray-100 pt-4 bg-gray-50/50 rounded-2xl p-3 border space-y-2">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Ecosystem Sync Stats</span>
                <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                  <span>Completed Routines</span>
                  <span className="text-[#1c3d22] font-black">{completedDrills.length} / {selectedData.drills.length}</span>
                </div>
              </div>
            </div>

            {/* HIGH-CONVERSION TARGETED ADVICE CORNER */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-3xs space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c8962a] flex items-center gap-1">
                <Apple size={12} /> Personalized Pipeline Fuel Advice
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/50">
                  <span className="block text-[9px] font-black uppercase text-amber-800">Pre-Session Protocol</span>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5 leading-snug">{selectedData.advice.pre}</p>
                </div>
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50">
                  <span className="block text-[9px] font-black uppercase text-emerald-800">Post-Session Recovery</span>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5 leading-snug">{selectedData.advice.post}</p>
                </div>
                <div className="bg-blue-50/40 p-2.5 rounded-xl border border-blue-100/50">
                  <span className="block text-[9px] font-black uppercase text-blue-800">Tactical Awareness Cue</span>
                  <p className="text-[11px] text-gray-600 font-semibold mt-0.5 leading-snug">{selectedData.advice.tactical}</p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT GRID EXCLUSIVE TARGETED POSITION DRILLS */}
          <div className="lg:col-span-8 space-y-3">
            {selectedData.drills.map((drill) => {
              const isDone = completedDrills.includes(drill.id);
              const isDrillSyncing = isSyncing === drill.id;
              return (
                <div 
                  key={drill.id} 
                  className={`bg-white border rounded-2xl p-5 transition-all shadow-3xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden ${
                    isDone ? "border-emerald-200 bg-emerald-50/10" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-gray-100 text-gray-800 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">
                        {drill.duration}
                      </span>
                      <h3 className={`text-sm font-black uppercase tracking-wide truncate ${isDone ? "text-emerald-900 line-through opacity-60" : "text-gray-900"}`}>
                        {drill.name}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 leading-relaxed pr-2">
                      {drill.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleInitializeDrill(drill.id)}
                    disabled={isSyncing !== null}
                    className={`w-full sm:w-auto text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                      isDone 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-3xs" 
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    }`}
                  >
                    {isDrillSyncing ? (
                      <span className="flex items-center gap-1">
                        <Activity size={12} className="animate-pulse" /> Syncing...
                      </span>
                    ) : isDone ? (
                      <>
                        <CheckCircle2 size={14} /> Metric Logged
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" /> Run Drill
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

        </section>

      </main>
    </div>
  );
}