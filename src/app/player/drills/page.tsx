"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell, Target, Shield, Award, Users,
  ArrowLeft, GraduationCap, Play,
  CheckCircle2, AlertTriangle, Download, TrendingUp, Flame
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import WeeklyChallenges from "@/components/challenges/WeeklyChallenges";

const FOOTBALL_POSITION_DRILLS = {
  striker: {
    title: "Striker & Attacking Forward Track",
    focus: "Attacking intent, positive first-touch control, creative blind turns, and clinical box execution.",
    drills: [
      { id: "eng_st_01", name: "Lions' Den Central Turning",      duration: "15 mins", description: "Receive a firm vertical entry pass inside a tight 8x8-yard square under physical contact. Protect the ball with your body, turn sharply on the half-turn, and play forward to a teammate." },
      { id: "eng_st_02", name: "Tri-Third Elimination End Zones", duration: "20 mins", description: "Combine out of the defensive third to play an incisive line-breaking pass past the midfield layer. Time your forward run into the shaded end zone to collect and finish without running offside." },
      { id: "eng_st_03", name: "Three-Goal Endline Finale",       duration: "15 mins", description: "Small-sided competitive match attacking a baseline with one large central goal and two corner mini-goals. Any regular goal is 1 point; a first-time finish is worth 2 points." },
      { id: "eng_st_04", name: "Double Trouble Combination",      duration: "15 mins", description: "Attack a keeper and defender in pairs on a 35x25-yard pitch. Move and combine to open up space and score. If the defender wins it, recover to help your unit." },
      { id: "eng_st_05", name: "The Great Escape Funnel",         duration: "20 mins", description: "Start inside a cone funnel before breaking out into a 35x35-yard area against two central guards. Use feints and body movement to disguise your intentions and escape through perimeter gates." },
    ],
  },
  midfielder: {
    title: "Central Midfield & Pivot Track",
    focus: "Pre-receipt shoulder scanning, body shape openness, cover shadows drop, and tactical point switches.",
    drills: [
      { id: "cat_md_01", name: "Barcelona 3-2-1 Build Up Choices", duration: "15 mins", description: "7v7 positional small-sided game. Receive deep build-up passes from the center-back, scan before receiving, use your back foot to open your body shape, and decide whether to combine via a wall-pass or switch play wide." },
      { id: "eng_md_02", name: "Around the Clock Passing Ring",    duration: "12 mins", description: "Position symmetrically around a 20-yard diameter circle. Execute rapid one-touch and two-touch passing patterns through and across the clock structure to break blocks while central defenders chase interceptions." },
      { id: "eng_md_03", name: "Connect Four Corner Squares",      duration: "20 mins", description: "A 35x20-yard directional transition game. Midfielders use quick horizontal circulation to pull the defensive block out of alignment, then launch a vertical through-ball into any of the 4 shaded corner target boxes." },
      { id: "eng_md_04", name: "Table Football Tri-Thirds Match",  duration: "25 mins", description: "Play a match inside a field split into thirds where outfielders are entirely locked into their areas to emphasize vertical lines. Work the ball dynamically through the thirds to feed your striker." },
      { id: "eng_md_05", name: "Three-Channel Tight Turning",      duration: "15 mins", description: "Receive a pass inside a small central vertical channel under tight pressure. Keep a tight turning circle, use an outside hook or Cruyff turn to escape interference, and pass to create width." },
    ],
  },
  defender: {
    title: "Defensive Unit & Fullback Track",
    focus: "Defensive approach angles, arm's-length pressure, deceleration braking, and line cover support.",
    drills: [
      { id: "eng_df_01", name: "Angled Pressing & Directional Dictation", duration: "15 mins", description: "Approach a perimeter attacker at an angle rather than straight-on to limit their options. Get within arm's-length to apply high pressure and dictate their movement toward the wide sidelines." },
      { id: "eng_df_02", name: "Cover and Recover Horizontal Channels",   duration: "15 mins", description: "Work in tandem inside a pitch split horizontally into thirds. Establish optimal supporting distances between the pressing and covering players; if the primary presser is bypassed, the covering player steps out immediately." },
      { id: "eng_df_03", name: "Line Cover and Press 2v2",                duration: "20 mins", description: "Small-sided area with mini-goals behind a baseline. One player presses the ball carrier while the other provides deep covering support directly in front of the goal mouth." },
      { id: "eng_df_04", name: "Stadium Game 1v1 Marking",               duration: "15 mins", description: "Pair up with an opponent inside an isolated half of a 30x20-yard area. Stay close to prevent them from receiving easily, position goal-side, and use a side-on stance to steal possession." },
      { id: "eng_df_05", name: "Five-Section Possession Grid",            duration: "20 mins", description: "Engage in parallel 1v1 duels inside a 30x20-yard pitch split into five sections. Work together as a compact unit off the ball to mark, cover, and intercept passes." },
    ],
  },
  goalkeeper: {
    title: "Goalkeeper Elite Protocol",
    focus: "Balls-of-feet readiness, handling holds ('W' and 'M' catch styles), low ground diving, and wide distribution.",
    drills: [
      { id: "so_gk_01",  name: "Ground Side-Diving & Ball Recovery",  duration: "15 mins", description: "Crouch to lower your center of gravity before diving on the side of your body. Get both hands to the ball using the secure 'M' little-finger line for low shots, then immediately hug it into your chest." },
      { id: "so_gk_02",  name: "The 'W' & 'M' Handling Fundamentals", duration: "10 mins", description: "Practice forming a 'W' with your thumbs almost touching to secure incoming high balls, and an 'M' with little fingers touching to handle low balls. Stand lightly on the balls of your feet with hands open at waist height." },
      { id: "eng_gk_03", name: "Circular Target-Gate Angle Coverage",  duration: "15 mins", description: "Position inside standalone square keeper boxes placed symmetrically within a circle layout. Move dynamically to adjust your positioning angle relative to passing pairs, making safe interceptions on first-time pass inputs." },
      { id: "eng_gk_04", name: "Feeder-Attacker Isolation Guard",     duration: "15 mins", description: "Manage angle coverage in a 20x15-yard pitch with a goal at one end. Direct your defender to mark the attacker tight, tracking the ball from the feeder, and be alert to make reflex saves." },
      { id: "eng_gk_05", name: "Asymmetric Low Block Clearing",       duration: "20 mins", description: "Defend a full-size goal with a backline of 8 outfielders against 7 attackers on half a pitch. Dominate your box, collect loose crosses, and quickly distribute wide after a rebound." },
    ],
  },
  winger: {
    title: "Winger & Wide Forward Track",
    focus: "Explosive width, 1v1 isolation, low cross delivery, and recovery tracking.",
    drills: [
      { id: "grs_wn_01", name: "Wide Channel Sprint & Cross",  duration: "15 mins", description: "Sprint into the wide channel, receive a pass, and deliver a low driven cross before the defender closes. Vary between near-post and cutback deliveries." },
      { id: "grs_wn_02", name: "1v1 Isolation Wing Attack",   duration: "15 mins", description: "Start 15m from the full-back. Use a feint to commit them, then accelerate past. Finish by crossing or cutting inside. Best of 5 runs." },
      { id: "grs_wn_03", name: "Recovery Run Tracking",       duration: "12 mins", description: "After losing possession in the final third, sprint back to get goal-side of the ball within 5 seconds. Coach rates effort with 1–3. Target average above 2.5." },
      { id: "grs_wn_04", name: "Overlap Combination Triangle",duration: "20 mins", description: "3-player combination: winger, full-back, striker. Winger plays inside and then overlaps to receive in behind. Finish with a first-time cross or cut-back." },
      { id: "grs_wn_05", name: "Cutback Decision Rondo",      duration: "15 mins", description: "Reach the byline and choose between a near-post cutback, far-post driven cross, or pulling back to the penalty spot runner. Defenders rotate. 3 points for a first-time finish." },
    ],
  },
};

const TIER_CONFIG: Record<number, { label: string; color: string; bg: string; source: string; flag: string }> = {
  1: { label: "Spark",   color: "#888780", bg: "#f1efe8", source: "GRS Original",             flag: "🇿🇼" },
  2: { label: "Build",   color: "#185fa5", bg: "#e6f1fb", source: "England Football Learning", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  3: { label: "Develop", color: "#1c3d22", bg: "#eaf3de", source: "Costa Rica U14",            flag: "🇨🇷" },
  4: { label: "Perform", color: "#854f0b", bg: "#faeeda", source: "France U17 + Sundowns",     flag: "🇫🇷" },
  5: { label: "Elite",   color: "#c8962a", bg: "#1c3d22", source: "Spain U23 + England Elite", flag: "🇪🇸" },
};

interface TierProgress {
  currentTier:       number;
  currentTierLabel:  string;
  currentTierSource: string;
  totalUnlocked:     number;
  totalCompleted:    number;
  nextTier?: {
    tier:           number;
    label:          string;
    source:         string;
    sessionsNeeded: number;
    aqNeeded:       number;
    unlockReady:    boolean;
  } | null;
}

export default function FootballDrillsLabPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [activePosition, setActivePosition] = useState<keyof typeof FOOTBALL_POSITION_DRILLS>("striker");
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [activeTab, setActiveTab] = useState<"drills" | "challenges" | "coach">("drills");
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  const [coachTip,   setCoachTip]   = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }

    const loadAll = async () => {
      try {
        const progressRes = await fetch("/api/player/progress");
        if (progressRes.ok) {
          const data = await progressRes.json();
          // ── Safe array guard — prevents filter crash if API returns object ──
          setCompletedDrills(Array.isArray(data.drills) ? data.drills : []);
          if (data.position) setActivePosition(data.position as keyof typeof FOOTBALL_POSITION_DRILLS);
          else mapUserPosition();
        } else {
          mapUserPosition();
        }

        const playerId = user.id ?? "me";
        const tierRes = await fetch(`/api/drills?playerId=${playerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        });
        if (tierRes.ok) setTierProgress(await tierRes.json());

        // ── Fix: safe parse of localStorage drill assignments ─────────────
        const raw = localStorage.getItem("gs_futurefit_assignments");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setCompletedDrills(parsed);
            else localStorage.removeItem("gs_futurefit_assignments");
          } catch { localStorage.removeItem("gs_futurefit_assignments"); }
        }
      } catch { mapUserPosition(); }
      finally  { setIsLoading(false); }
    };

    loadAll();
  }, [hydrated, user, router]);

  const mapUserPosition = () => {
    const pos = (user?.position ?? "").toLowerCase();
    if (pos.includes("strik") || pos.includes("forward")) setActivePosition("striker");
    else if (pos.includes("wing"))                        setActivePosition("winger");
    else if (pos.includes("mid") || pos.includes("play")) setActivePosition("midfielder");
    else if (pos.includes("def") || pos.includes("back")) setActivePosition("defender");
    else if (pos.includes("keep") || pos.includes("goal"))setActivePosition("goalkeeper");
  };

  const saveProgress = async (newCompleted: string[], position: string) => {
    setIsSaving(true);
    try {
      await fetch("/api/player/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drills: newCompleted, position }),
      });
      const playerId = user?.id ?? "me";
      const justCompleted = newCompleted.find(id => !completedDrills.includes(id));
      if (justCompleted) {
        await fetch("/api/drills", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
          body: JSON.stringify({ action: "complete", playerId, drillId: justCompleted }),
        });
        const tierRes = await fetch(`/api/drills?playerId=${playerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        });
        if (tierRes.ok) setTierProgress(await tierRes.json());
      }
    } catch { /* silent */ }
    setIsSaving(false);
  };

  const toggleDrillCompletion = async (drillId: string) => {
    const newCompleted = completedDrills.includes(drillId)
      ? completedDrills.filter(id => id !== drillId)
      : [...completedDrills, drillId];
    setCompletedDrills(newCompleted);
    await saveProgress(newCompleted, activePosition);
  };

  const generateTalentPassport = () => {
    const selectedData = FOOTBALL_POSITION_DRILLS[activePosition];
    const report = {
      playerName:           user?.name ?? "Player",
      position:             activePosition,
      totalDrillsCompleted: completedDrills.filter(id => selectedData.drills.some(d => d.id === id)).length,
      totalAvailable:       selectedData.drills.length,
      completionPercentage: (completedDrills.filter(id => selectedData.drills.some(d => d.id === id)).length / selectedData.drills.length) * 100,
      completedDrillsList:  selectedData.drills.filter(d => completedDrills.includes(d.id)),
      tierProgress:         tierProgress ?? null,
      generatedDate:        new Date().toISOString(),
    };
    const link = document.createElement("a");
    link.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2)));
    link.setAttribute("download", `talent-passport-${user?.name ?? "player"}-${activePosition}.json`);
    link.click();
  };

  const fetchCoachTip = async () => {
    if (coachTip || tipLoading) return;
    setTipLoading(true);
    try {
      const gender = localStorage.getItem("player_gender") ?? "male";
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I am in the ${tierProgress?.currentTierLabel ?? "Spark"} drill tier as a ${activePosition}. Give me one specific training tip for this week.`,
          gender,
          history: [],
          userContext: { position: activePosition },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setCoachTip(json.response ?? json.reply ?? "");
      }
    } catch {}
    setTipLoading(false);
  };

  if (!hydrated || isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="animate-spin text-[#1c3d22] mx-auto mb-4" size={32} />
          <p className="text-sm text-gray-600">Loading your training lab...</p>
        </div>
      </div>
    );
  }

  const selectedData   = FOOTBALL_POSITION_DRILLS[activePosition];
  const completedCount = completedDrills.filter(id => selectedData.drills.some(d => d.id === id)).length;
  const completionPct  = (completedCount / selectedData.drills.length) * 100;
  const tierCfg        = TIER_CONFIG[tierProgress?.currentTier ?? 1];
  const gender         = localStorage.getItem("player_gender") ?? "male";
  const coachName      = gender === "female" ? "Amara" : "THUTO";

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans antialiased">

      {/* Header */}
      <div className="bg-[#1c3d22] text-white border-b-4 border-[#f0b429] px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">GRS Talent Nurture Lab</h1>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                {tierCfg.flag} {tierProgress?.currentTierLabel ?? "Spark"} tier · {tierCfg.source}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-xl border border-[#f0b429]/10">
              <GraduationCap size={16} className="text-[#f0b429]" />
              <div className="text-left">
                <span className="block text-[8px] font-black uppercase tracking-widest text-[#f0b429] leading-none">Strategic Partner</span>
                <span className="text-[11px] font-black tracking-tight text-white uppercase">Teach For Zimbabwe</span>
              </div>
            </div>
            <button onClick={generateTalentPassport}
              className="bg-[#f0b429] text-[#1c3d22] px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#f0b429]/90 transition-all flex items-center gap-2">
              <Download size={14} /> Passport
            </button>
          </div>
        </div>

        {tierProgress?.nextTier && (
          <div className="max-w-5xl mx-auto mt-3 pb-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-white/50">{tierCfg.flag} {tierCfg.source}</span>
              <span className="text-[#f0b429] font-bold">
                {tierProgress.nextTier.unlockReady
                  ? `${TIER_CONFIG[tierProgress.nextTier.tier].flag} ${tierProgress.nextTier.label} ready!`
                  : `${tierProgress.nextTier.sessionsNeeded} sessions to ${tierProgress.nextTier.label}`}
              </span>
            </div>
            <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ background: tierProgress.nextTier.unlockReady ? "#f0b429" : "#4ade80", width: `${tierProgress.nextTier.unlockReady ? 100 : Math.max(5, 100 - (tierProgress.nextTier.sessionsNeeded / 8) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="max-w-5xl mx-auto flex mt-3">
          {(["drills", "challenges", "coach"] as const).map((tab, i) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "coach") fetchCoachTip(); }}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
              style={{
                borderRadius: i === 0 ? "8px 0 0 0" : i === 2 ? "0 8px 0 0" : 0,
                background: activeTab === tab ? "#f4f2ee" : "transparent",
                color: activeTab === tab ? "#1c3d22" : "rgba(255,255,255,0.6)",
                border: "none", cursor: "pointer",
              }}>
              {tab === "drills" ? "My drills" : tab === "challenges" ? "Challenges" : "My coach"}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">

        {/* Medical banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
          <div>
            <h5 className="text-xs font-black uppercase text-orange-900 tracking-wide">FA Medical Safeguard: Concussion Restraint</h5>
            <p className="text-[11px] text-orange-700 font-semibold mt-0.5 leading-relaxed">
              <strong>If In Doubt, Sit Them Out.</strong> No headers for players under 10. Players must be symptom-free before returning.
            </p>
          </div>
        </div>

        {/* ── TAB: DRILLS ── */}
        {activeTab === "drills" && (
          <>
            <div className="bg-gradient-to-r from-[#1c3d22] to-[#2a5532] rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Flame className="text-[#f0b429]" size={24} />
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-80">Your progress</p>
                    <p className="text-2xl font-black">{completedCount}/{selectedData.drills.length}</p>
                    <p className="text-xs">Drills completed</p>
                  </div>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Completion rate</span><span>{Math.round(completionPct)}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#f0b429] transition-all duration-500" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
                {isSaving && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </div>
                )}
              </div>
            </div>

            <section className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select your position</h4>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(FOOTBALL_POSITION_DRILLS) as (keyof typeof FOOTBALL_POSITION_DRILLS)[]).map(key => {
                  const isActive = activePosition === key;
                  const cnt = completedDrills.filter(id => FOOTBALL_POSITION_DRILLS[key].drills.some(d => d.id === id)).length;
                  return (
                    <button key={key} onClick={() => setActivePosition(key)}
                      className={`relative text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl border transition-all cursor-pointer ${
                        isActive ? "bg-[#1c3d22] text-white border-[#1c3d22] shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}>
                      {key}
                      {cnt > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#f0b429] text-[#1c3d22] text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center">{cnt}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 lg:sticky lg:top-44">
                <div className="bg-blue-50 text-blue-700 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Dumbbell size={20} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black uppercase tracking-tight text-gray-900">{selectedData.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-100">Academy routine</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded border" style={{ background: tierCfg.bg, color: tierCfg.color, borderColor: tierCfg.bg }}>
                      {tierCfg.flag} {tierCfg.label} tier
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 leading-relaxed">{selectedData.focus}</p>
                {completionPct === 100 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-3 text-center">
                    <Award className="text-yellow-600 mx-auto mb-1" size={20} />
                    <p className="text-[10px] font-black uppercase text-yellow-800">Position mastered!</p>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                    <span>Completion log</span>
                    <span className="text-[#1c3d22] font-black">{completedCount} / {selectedData.drills.length}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1c3d22] transition-all duration-500" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
                {tierProgress?.nextTier && !tierProgress.nextTier.unlockReady && (
                  <div className="border border-dashed border-gray-200 rounded-xl p-3 text-center">
                    <div className="text-base mb-1">{TIER_CONFIG[tierProgress.nextTier.tier].flag}</div>
                    <div className="text-xs font-bold text-[#1c3d22]">{tierProgress.nextTier.label} tier next</div>
                    <div className="text-[10px] text-gray-400 mt-1">{tierProgress.nextTier.source}</div>
                    {tierProgress.nextTier.sessionsNeeded > 0 && (
                      <div className="text-[10px] text-gray-500 mt-1">{tierProgress.nextTier.sessionsNeeded} more session{tierProgress.nextTier.sessionsNeeded > 1 ? "s" : ""}</div>
                    )}
                  </div>
                )}
                {tierProgress?.nextTier?.unlockReady && (
                  <div className="bg-[#f0b429] rounded-xl p-3 text-center">
                    <div className="text-xs font-black text-[#1c3d22] mb-1">🎉 {tierProgress.nextTier.label} tier ready!</div>
                    <div className="text-[10px] text-[#1c3d22] mb-2">{tierProgress.nextTier.source} unlocked</div>
                    <Link href="/player/talent-id" className="text-[10px] font-black text-[#1c3d22] underline">Take a test to activate →</Link>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8 space-y-3">
                {selectedData.drills.map((drill, index) => {
                  const isDone     = completedDrills.includes(drill.id);
                  const isExpanded = expandedDrill === drill.id;
                  return (
                    <div key={drill.id} className={`group bg-white border rounded-2xl overflow-hidden transition-all shadow-sm ${isDone ? "border-emerald-200 bg-emerald-50/20" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}`}>
                      <button onClick={() => setExpandedDrill(isExpanded ? null : drill.id)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left bg-transparent border-none cursor-pointer">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${isDone ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                          {isDone ? "✓" : index + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-gray-100 text-gray-700 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded">{drill.duration}</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase">Drill {index + 1}/{selectedData.drills.length}</span>
                          </div>
                          <h3 className={`text-sm font-black uppercase tracking-wide ${isDone ? "text-emerald-700 line-through opacity-70" : "text-gray-900"}`}>{drill.name}</h3>
                        </div>
                        <span className="text-xs text-gray-300">{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 space-y-3">
                          <p className="text-xs font-semibold text-gray-500 leading-relaxed">{drill.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => toggleDrillCompletion(drill.id)}
                              className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${isDone ? "bg-emerald-600 text-white border-emerald-600" : "bg-[#1c3d22] text-white border-[#1c3d22]"}`}>
                              {isDone ? <><CheckCircle2 size={12} /> Completed</> : <><Play size={12} className="fill-current" /> Mark as done</>}
                            </button>
                            <Link href="/player/talent-id" className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
                              Test after drilling →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {completedCount > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="text-[#f0b429]" size={20} />
                    <h3 className="text-sm font-black uppercase text-gray-900">Talent passport summary</h3>
                  </div>
                  <button onClick={generateTalentPassport} className="text-[10px] font-black uppercase bg-[#1c3d22] text-white px-3 py-1.5 rounded-xl hover:bg-[#2a5532] transition-colors">
                    Download full report
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: completedCount,                 label: "Drills mastered"  },
                    { value: `${Math.round(completionPct)}%`,label: "Completion rate"  },
                    { value: activePosition,                 label: "Primary position" },
                    { value: `${selectedData.drills.filter(d => completedDrills.includes(d.id)).reduce((a, d) => a + parseInt(d.duration), 0)} min`, label: "Total practice" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-black text-[#1c3d22]">{s.value}</p>
                      <p className="text-[9px] uppercase text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: CHALLENGES ── */}
        {activeTab === "challenges" && (
          <WeeklyChallenges playerSessionCount={tierProgress?.totalCompleted ?? 0} />
        )}

        {/* ── TAB: MY COACH ── */}
        {activeTab === "coach" && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#1c3d22] flex items-center justify-center font-black text-[#f0b429] text-xl flex-shrink-0">
                  {gender === "female" ? "A" : "T"}
                </div>
                <div>
                  <div className="font-black text-[#1c3d22] text-base">{coachName}</div>
                  <div className="text-xs text-gray-400">Your GRS AI coach · {tierProgress?.currentTierLabel ?? "Spark"} tier · {activePosition}</div>
                </div>
              </div>
              {tipLoading && <p className="text-sm text-gray-400 italic">Getting your coaching tip...</p>}
              {coachTip && !tipLoading && (
                <div className="text-sm text-gray-700 leading-relaxed p-3 bg-gray-50 rounded-xl border-l-4 border-[#1c3d22]">{coachTip}</div>
              )}
              {!coachTip && !tipLoading && (
                <button onClick={fetchCoachTip} className="w-full py-3 rounded-xl bg-[#1c3d22] text-white font-black text-sm border-none cursor-pointer hover:bg-[#2a5532] transition-colors">
                  Get my coaching tip this week →
                </button>
              )}
            </div>
            <CoachChat coachName={coachName} tier={tierProgress?.currentTierLabel ?? "Spark"} position={activePosition} gender={gender} />
          </div>
        )}
      </main>
    </div>
  );
}

function CoachChat({ coachName, tier, position, gender }: { coachName: string; tier: string; position: string; gender: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, gender, history: messages.slice(-6), userContext: { position, recentStats: `${tier} drill tier` } }),
      });
      if (res.ok) {
        const json = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: json.response ?? json.reply ?? "Ask me your training question." }]);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 text-xs font-black text-[#1c3d22] uppercase tracking-wide">
        Ask {coachName} anything about training
      </div>
      <div className="px-4 py-3 min-h-20 max-h-72 overflow-y-auto space-y-3">
        {messages.length === 0 && <p className="text-xs text-gray-400 italic">e.g. "How do I improve my first touch?" or "What should I work on this week?"</p>}
        {messages.map((m, i) => (
          <div key={i}>
            <div className="text-[9px] font-black uppercase mb-1" style={{ color: m.role === "user" ? "#888" : "#1c3d22" }}>{m.role === "user" ? "You" : coachName}</div>
            <div className="text-sm text-gray-700 leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && <p className="text-xs text-gray-400 italic">{coachName} is thinking...</p>}
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-gray-100">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder={`Ask ${coachName}...`}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
        <button onClick={send} disabled={!input.trim() || loading}
          className="bg-[#1c3d22] text-white font-black text-xs px-4 py-2 rounded-lg border-none cursor-pointer disabled:opacity-40 transition-opacity">
          Send
        </button>
      </div>
    </div>
  );
}