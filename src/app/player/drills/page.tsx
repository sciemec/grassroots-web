"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell, Award,
  ArrowLeft, GraduationCap,
  AlertTriangle, Download, Flame, Filter, X, Bell
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import WeeklyChallenges from "@/components/challenges/WeeklyChallenges";
import { postToArena } from "@/lib/arena-poster";
import DrillCard from "@/components/drills/DrillCard";
import {
  FOOTBALL_POSITION_DRILLS,
  type PositionTrack,
  type DrillCategory,
  type EquipmentTier,
  type AgeGroup,
} from "@/lib/drill-data";
import { getSportDrills, SPORT_POSITION_MAP } from "@/lib/sport-drills";
import FitnessTestTab from "@/components/drills/FitnessTestTab";
import SportSwitcher from "@/components/ui/SportSwitcher";

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

const ALL_CATEGORIES: DrillCategory[]  = ["Technical", "Physical", "Tactical"];
const ALL_EQUIPMENT:  EquipmentTier[]  = ["zero", "basic", "gym"];
const EQUIPMENT_LABELS: Record<EquipmentTier, string> = {
  zero:  "No equipment",
  basic: "Ball / partner",
  gym:   "Gym needed",
};
const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
};

export default function FootballDrillsLabPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [activePosition, setActivePosition] = useState<string>("striker");
  const [playerSport,    setPlayerSport]    = useState<string>("football");
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving,  setIsSaving]  = useState(false);
  const [activeTab, setActiveTab] = useState<"drills" | "challenges" | "coach" | "fitness">("drills");
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  const [coachTip,   setCoachTip]   = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);

  // Age group + mastery
  const [ageGroup,    setAgeGroup]    = useState<AgeGroup>("senior");
  const [masteryMap,  setMasteryMap]  = useState<Record<string, number>>({});

  // Achievement badges (Change 8)
  const [earnedBadge, setEarnedBadge] = useState<{ id: string; label: string } | null>(null);

  // Training reminder (Change 7)
  const [reminderSet,  setReminderSet]  = useState(false);
  const [reminderTime, setReminderTime] = useState("18:00");

  // Filter bar
  const [filterCategory,   setFilterCategory]   = useState<DrillCategory | "all">("all");
  const [filterEquipment,  setFilterEquipment]  = useState<EquipmentTier | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<1 | 2 | 3 | "all">("all");
  const [showFilters,      setShowFilters]      = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }

    const loadAll = async () => {
      try {
        const progressRes = await fetch("/api/player/progress");
        if (progressRes.ok) {
          const data = await progressRes.json();
          setCompletedDrills(Array.isArray(data.drills) ? data.drills : []);
          if (data.position) setActivePosition(data.position as string);
          else mapUserPosition();
        } else {
          mapUserPosition();
        }

        const playerId = user.id ?? "me";
        const tierRes = await fetch(`/api/drills?playerId=${playerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}` },
        });
        if (tierRes.ok) setTierProgress(await tierRes.json());

        const raw = localStorage.getItem("gs_futurefit_assignments");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setCompletedDrills(parsed);
            else localStorage.removeItem("gs_futurefit_assignments");
          } catch { localStorage.removeItem("gs_futurefit_assignments"); }
        }

        // Read player sport from localStorage and set default position for that sport
        const storedSport = typeof window !== "undefined"
          ? (localStorage.getItem("player_sport") ?? "football")
          : "football";
        setPlayerSport(storedSport);
        if (storedSport !== "football") {
          const positions = SPORT_POSITION_MAP[storedSport] ?? [];
          if (positions.length > 0) setActivePosition(positions[0]);
        }

        // Load mastery counts from backend
        const apiToken = localStorage.getItem("auth_token");
        if (apiToken && apiToken !== "dev-token") {
          try {
            const masteryRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/player/drill-completions`,
              { headers: { Authorization: `Bearer ${apiToken}` } }
            );
            if (masteryRes.ok) {
              const masteryJson = await masteryRes.json();
              const arr = Array.isArray(masteryJson.data) ? masteryJson.data : [];
              const map: Record<string, number> = {};
              arr.forEach((item: { drill_id: string; completions_count: number }) => {
                map[item.drill_id] = item.completions_count ?? 1;
              });
              setMasteryMap(map);
              // Sync completedDrills from mastery data (merge with existing)
              const doneIds = arr.map((item: { drill_id: string }) => item.drill_id);
              if (doneIds.length > 0) {
                setCompletedDrills(prev => Array.from(new Set([...prev, ...doneIds])));
              }
            }
          } catch { /* silent — mastery loads from localStorage fallback */ }
        }

        // Set default age group from user's age_group field
        const userAg = (user as { age_group?: string }).age_group ?? "";
        if (userAg.includes("u13") || userAg.includes("13")) setAgeGroup("u13");
        else if (userAg.includes("u16") || userAg.includes("16")) setAgeGroup("u16");
        else if (userAg.includes("u19") || userAg.includes("19")) setAgeGroup("u19");

        // Load reminder state + fire if due today (Change 7)
        const savedReminder = localStorage.getItem("gs_drill_reminder");
        if (savedReminder) {
          try {
            const { time } = JSON.parse(savedReminder) as { time: string };
            setReminderSet(true);
            setReminderTime(time ?? "18:00");
            const lastFired = localStorage.getItem("gs_drill_reminder_last");
            const today = new Date().toDateString();
            if (
              lastFired !== today &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              const [h, m] = (time ?? "18:00").split(":").map(Number);
              const now = new Date();
              if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
                new Notification("Time to train! 🏆", {
                  body: "Your daily drill session is waiting.",
                  icon: "/favicon.ico",
                });
                localStorage.setItem("gs_drill_reminder_last", today);
              }
            }
          } catch { /* silent */ }
        }
      } catch { mapUserPosition(); }
      finally  { setIsLoading(false); }
    };

    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, router]);

  // When sport changes, reset to the first position of the new sport
  useEffect(() => {
    const drillSet: Record<string, PositionTrack> = playerSport === "football"
      ? FOOTBALL_POSITION_DRILLS
      : (getSportDrills(playerSport) ?? FOOTBALL_POSITION_DRILLS);
    const keys = Object.keys(drillSet);
    if (keys.length > 0 && !keys.includes(activePosition)) {
      setActivePosition(keys[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerSport]);

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
    const isMarkingDone = !completedDrills.includes(drillId);
    const newCompleted = isMarkingDone
      ? [...completedDrills, drillId]
      : completedDrills.filter(id => id !== drillId);
    setCompletedDrills(newCompleted);
    await saveProgress(newCompleted, activePosition);
    if (isMarkingDone) {
      const currentSet: Record<string, PositionTrack> = playerSport === "football"
        ? FOOTBALL_POSITION_DRILLS
        : (getSportDrills(playerSport) ?? FOOTBALL_POSITION_DRILLS);
      const drill = (currentSet[activePosition]?.drills ?? []).find(d => d.id === drillId);

      // Increment mastery count locally
      setMasteryMap(prev => ({ ...prev, [drillId]: (prev[drillId] ?? 0) + 1 }));

      // Persist mastery to backend (fire-and-forget)
      const apiToken = localStorage.getItem("auth_token");
      if (apiToken && apiToken !== "dev-token" && drill) {
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/player/drill-completions/${drillId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({
              drill_name: drill.name,
              position: activePosition,
              tier: tierProgress?.currentTier ?? 1,
            }),
          }
        ).catch(() => {});
      }

      if (drill) {
        postToArena(
          `Completed "${drill.name}" · ${activePosition} · ${tierProgress?.currentTierLabel ?? "Spark"} tier`,
          {
            postType: "milestone",
            activityType: "drill_completion",
            activityData: {
              drillId,
              drillName: drill.name,
              position: activePosition,
              tier: tierProgress?.currentTier ?? 1,
            },
          }
        );
      }

      // Achievement badge detection (Change 8)
      const earnedBadges: string[] = JSON.parse(localStorage.getItem("gs_earned_badges") ?? "[]");
      const trackDrills = currentSet[activePosition]?.drills ?? [];
      const trackDone = trackDrills.filter(d => newCompleted.includes(d.id)).length;
      let newBadge: { id: string; label: string } | null = null;

      if (!earnedBadges.includes("first_drill") && newCompleted.length === 1) {
        newBadge = { id: "first_drill", label: "First Drill!" };
      } else if (!earnedBadges.includes("five_drills") && newCompleted.length >= 5) {
        newBadge = { id: "five_drills", label: "5 Drills Done" };
      } else if (!earnedBadges.includes(`track_${activePosition}`) && trackDone === trackDrills.length) {
        newBadge = { id: `track_${activePosition}`, label: "Track Complete" };
      }

      if (newBadge) {
        earnedBadges.push(newBadge.id);
        localStorage.setItem("gs_earned_badges", JSON.stringify(earnedBadges));
        setEarnedBadge(newBadge);
        setTimeout(() => setEarnedBadge(null), 4000);
      }
    }
  };

  const generateTalentPassport = () => {
    const passportSet: Record<string, PositionTrack> = playerSport === "football"
      ? FOOTBALL_POSITION_DRILLS
      : (getSportDrills(playerSport) ?? FOOTBALL_POSITION_DRILLS);
    const selectedData = passportSet[activePosition] ?? { title: "", focus: "", drills: [] };
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
      const gender = typeof window !== "undefined" ? localStorage.getItem("player_gender") ?? "male" : "male";
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

  // ── Training reminder helpers (Change 7) ──
  const enableReminder = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;
    saveReminder(reminderTime);
  };

  const saveReminder = (time: string) => {
    localStorage.setItem("gs_drill_reminder", JSON.stringify({ time }));
    setReminderSet(true);
    setReminderTime(time);
  };

  const cancelReminder = () => {
    localStorage.removeItem("gs_drill_reminder");
    localStorage.removeItem("gs_drill_reminder_last");
    setReminderSet(false);
  };

  // ── Derived values — must be BEFORE early return so useMemo is always called ──
  const activeDrillSet: Record<string, PositionTrack> = playerSport === "football"
    ? FOOTBALL_POSITION_DRILLS
    : (getSportDrills(playerSport) ?? FOOTBALL_POSITION_DRILLS);
  const selectedData = activeDrillSet[activePosition] ?? { title: "", focus: "", drills: [] };
  const completedCount = completedDrills.filter(id => selectedData.drills.some(d => d.id === id)).length;
  const completionPct  = selectedData.drills.length > 0 ? (completedCount / selectedData.drills.length) * 100 : 0;
  const tierCfg        = TIER_CONFIG[tierProgress?.currentTier ?? 1];
  const gender         = typeof window !== "undefined" ? localStorage.getItem("player_gender") ?? "male" : "male";
  const coachName      = gender === "female" ? "Amara" : "THUTO";
  const isPremiumUser  = user?.role === "admin" || (user as { subscription_tier?: string } | null)?.subscription_tier === "pro";
  const activeFilterCount = (filterCategory !== "all" ? 1 : 0) + (filterEquipment !== "all" ? 1 : 0) + (filterDifficulty !== "all" ? 1 : 0);

  // useMemo MUST be before any early return (Rules of Hooks)
  const filteredDrills = useMemo(() => {
    return selectedData.drills.filter(d => {
      if (filterCategory   !== "all" && d.category        !== filterCategory)   return false;
      if (filterEquipment  !== "all" && d.equipment_tier  !== filterEquipment)  return false;
      if (filterDifficulty !== "all" && d.difficulty_level !== filterDifficulty) return false;
      return true;
    });
  }, [selectedData.drills, filterCategory, filterEquipment, filterDifficulty]);

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

  // Today's recommended = first incomplete drill
  const todaysDrill = filteredDrills.find(d => !completedDrills.includes(d.id));
  const remainingDrills = filteredDrills.filter(d => d !== todaysDrill);

  // Extracted from JSX IIFE — must live in component body, not inside JSX
  const freeDrills = filteredDrills.filter(d => !d.is_premium);
  const proDrills  = filteredDrills.filter(d =>  d.is_premium);
  const drillCard = (drill: typeof filteredDrills[0], i: number) => (
    <DrillCard
      key={drill.id}
      drill={drill}
      index={i}
      isDone={completedDrills.includes(drill.id)}
      isExpanded={expandedDrill === drill.id}
      isPremiumUser={isPremiumUser}
      onToggleExpand={(id) => setExpandedDrill(expandedDrill === id ? null : id)}
      onMarkDone={toggleDrillCompletion}
      ageGroup={ageGroup}
      masteryCount={masteryMap[drill.id] ?? 0}
    />
  );

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans antialiased">

      {/* Achievement badge toast (Change 8) */}
      {earnedBadge && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#f0b429] text-[#1c3d22] px-5 py-2.5 rounded-full shadow-lg font-black text-sm animate-bounce">
          <Award size={16} />
          {earnedBadge.label}
        </div>
      )}

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
          {(["drills", "challenges", "coach", "fitness"] as const).map((tab, i) => (
            <button key={tab}
              onClick={() => { setActiveTab(tab); if (tab === "coach") fetchCoachTip(); }}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-all"
              style={{
                borderRadius: i === 0 ? "8px 0 0 0" : i === 3 ? "0 8px 0 0" : 0,
                background: activeTab === tab ? "#f4f2ee" : "transparent",
                color: activeTab === tab ? "#1c3d22" : "rgba(255,255,255,0.6)",
                border: "none", cursor: "pointer",
              }}>
              {tab === "drills" ? "My drills" : tab === "challenges" ? "Challenges" : tab === "coach" ? "My coach" : "⚡ Fitness"}
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
            {/* Progress card */}
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

            {/* Sport switcher */}
            <section className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your sport</h4>
              <SportSwitcher
                activeSport={playerSport}
                onSelect={(sport) => {
                  setPlayerSport(sport);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("grs_active_sport", sport);
                    localStorage.setItem("player_sport", sport);
                  }
                  const positions = SPORT_POSITION_MAP[sport] ?? [];
                  setActivePosition(positions[0] ?? "striker");
                  setExpandedDrill(null);
                }}
                size="sm"
              />
            </section>

            {/* Position selector */}
            <section className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select your position</h4>
              <div className="flex flex-wrap gap-2">
                {Object.keys(activeDrillSet).map(key => {
                  const isActive = activePosition === key;
                  const cnt = completedDrills.filter(id => activeDrillSet[key]?.drills.some(d => d.id === id) ?? false).length;
                  return (
                    <button key={key} onClick={() => { setActivePosition(key); setExpandedDrill(null); }}
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

            {/* Age group selector */}
            <section className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Age group</h4>
              <div className="flex flex-wrap gap-2">
                {(["u13", "u16", "u19", "senior"] as const).map(ag => (
                  <button
                    key={ag}
                    onClick={() => setAgeGroup(ag)}
                    className="text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl border transition-all cursor-pointer"
                    style={ageGroup === ag
                      ? { background: "#1c3d22", color: "#fff", borderColor: "#1c3d22" }
                      : { background: "#fff", color: "#374151", borderColor: "#e5e7eb" }}
                  >
                    {ag === "u13" ? "Under 13" : ag === "u16" ? "Under 16" : ag === "u19" ? "Under 19" : "Senior"}
                  </button>
                ))}
              </div>
            </section>

            {/* Training reminder row (Change 7) */}
            <section className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
              <Bell size={15} className={reminderSet ? "text-[#1c3d22]" : "text-gray-400"} />
              <span className="text-xs font-black uppercase tracking-wider text-gray-600">Daily reminder</span>
              {reminderSet ? (
                <>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => saveReminder(e.target.value)}
                    className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-gray-50"
                  />
                  <button
                    onClick={cancelReminder}
                    className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={10} /> Cancel
                  </button>
                  <span className="text-[10px] text-[#1c3d22] font-bold ml-auto">Reminder set ✓</span>
                </>
              ) : (
                <>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 text-gray-700 bg-gray-50"
                  />
                  <button
                    onClick={enableReminder}
                    className="text-[10px] font-black uppercase tracking-wider bg-[#1c3d22] text-white px-3 py-1.5 rounded-xl hover:bg-[#2a5532] transition-colors"
                  >
                    Set reminder
                  </button>
                </>
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sidebar info */}
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

              {/* Drills list */}
              <div className="lg:col-span-8 space-y-4">

                {/* ── STICKY FILTER BAR ── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-0">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#1a5c2a] transition-colors"
                    >
                      <Filter size={13} />
                      Filter drills
                      {activeFilterCount > 0 && (
                        <span className="bg-[#1a5c2a] text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{filteredDrills.length} drill{filteredDrills.length !== 1 ? "s" : ""}</span>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => { setFilterCategory("all"); setFilterEquipment("all"); setFilterDifficulty("all"); }}
                          className="text-[9px] font-black text-red-500 flex items-center gap-0.5 hover:text-red-700"
                        >
                          <X size={10} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {showFilters && (
                    <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                      {/* Category */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Category</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", ...ALL_CATEGORIES] as const).map(c => (
                            <button key={c} onClick={() => setFilterCategory(c as typeof filterCategory)}
                              className="text-[10px] font-bold px-3 py-1 rounded-full border transition-all"
                              style={filterCategory === c
                                ? { background: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                                : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                              {c === "all" ? "All" : c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Equipment */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Equipment</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", ...ALL_EQUIPMENT] as const).map(e => (
                            <button key={e} onClick={() => setFilterEquipment(e as typeof filterEquipment)}
                              className="text-[10px] font-bold px-3 py-1 rounded-full border transition-all"
                              style={filterEquipment === e
                                ? { background: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                                : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                              {e === "all" ? "Any equipment" : EQUIPMENT_LABELS[e]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Difficulty</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(["all", 1, 2, 3] as const).map(d => (
                            <button key={d} onClick={() => setFilterDifficulty(d as typeof filterDifficulty)}
                              className="text-[10px] font-bold px-3 py-1 rounded-full border transition-all"
                              style={filterDifficulty === d
                                ? { background: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                                : { background: "#f9fafb", color: "#374151", borderColor: "#e5e7eb" }}>
                              {d === "all" ? "Any level" : DIFFICULTY_LABELS[d]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {filteredDrills.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-gray-200 rounded-2xl">
                    <p className="text-sm font-bold text-gray-400">No drills match your filters.</p>
                    <button onClick={() => { setFilterCategory("all"); setFilterEquipment("all"); setFilterDifficulty("all"); }}
                      className="mt-2 text-xs font-bold text-[#1a5c2a] underline">Clear filters</button>
                  </div>
                ) : (
                  <>
                        {/* TODAY'S RECOMMENDED — always a free drill */}
                        {todaysDrill && !todaysDrill.is_premium && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c8962a]">Today&rsquo;s Recommended</h4>
                              <div className="flex-1 h-px bg-[#c8962a]/20" />
                            </div>
                            {drillCard(todaysDrill, filteredDrills.indexOf(todaysDrill))}
                          </div>
                        )}

                        {/* FREE DRILLS */}
                        {freeDrills.filter(d => d !== todaysDrill).length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">✅ Free Drills</span>
                              <div className="flex-1 h-px bg-[#1a5c2a]/20" />
                              <span className="text-[9px] text-gray-400">{freeDrills.filter(d => d !== todaysDrill).length} drills</span>
                            </div>
                            {freeDrills.filter(d => d !== todaysDrill).map((drill) =>
                              drillCard(drill, filteredDrills.indexOf(drill))
                            )}
                          </div>
                        )}

                        {/* PRO DRILLS */}
                        {proDrills.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#7c3aed" }}>🔒 Pro Drills</span>
                              <div className="flex-1 h-px" style={{ background: "#ede9fe" }} />
                              <span className="text-[9px]" style={{ color: "#7c3aed" }}>{proDrills.length} drills</span>
                            </div>
                            {!isPremiumUser && (
                              <div className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                style={{ background: "#faf7ff", borderColor: "#e9d5ff" }}>
                                <p className="text-xs text-gray-600">Unlock all Advanced drills + Gemini AI feedback</p>
                                <Link href="/player/subscription"
                                  className="text-[10px] font-black px-3 py-1.5 rounded-lg text-white flex-shrink-0 ml-3"
                                  style={{ background: "#7c3aed" }}>
                                  Upgrade →
                                </Link>
                              </div>
                            )}
                            {proDrills.map((drill) =>
                              drillCard(drill, filteredDrills.indexOf(drill))
                            )}
                          </div>
                        )}
                  </>
                )}
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
                    { value: completedCount,                  label: "Drills mastered"  },
                    { value: `${Math.round(completionPct)}%`, label: "Completion rate"  },
                    { value: activePosition,                  label: "Primary position" },
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

        {/* ── TAB: FITNESS TEST ── */}
        {activeTab === "fitness" && (
          <FitnessTestTab user={user} />
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