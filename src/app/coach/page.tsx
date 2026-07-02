// src/app/coach/page.tsx
// GrassRoots Coach Hub - Complete with Drills API & Gamification Integration

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import CoachAnalysisTab from "@/components/coach/CoachAnalysisTab";
import { loadKnowledgeForRole, type SessionPoint } from "@/lib/coaching-knowledge";
import { getDrillsByDepartment, getDepartmentStats, type Drill } from "@/lib/department-drills";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

// Icon mapper for string icon names
const getIconComponent = (iconName: string) => {
  const IconComponent = (Icons as Record<string, unknown>)[iconName] as React.ComponentType<{ size?: number; className?: string }> | undefined;
  return IconComponent || Icons.Shield;
};

// Role emoji fallback map
const ROLE_EMOJIS: Record<string, string> = {
  head_coach: "🎽",
  assistant_coach: "👥",
  attack_coach: "🔥",
  defence_coach: "🛡️",
  gk_coach: "🥅",
  midfield_coach: "⚡",
  performance_analyst: "📊",
  fitness_coach: "🏋️",
  team_physio: "🩺",
  team_manager: "💼",
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface SquadStats {
  total_players: number;
  active_injuries: number;
  teamAvgForm?: number;
  highFatigueCount?: number;
}

interface SquadMember {
  id: string;
  name: string;
  position: string;
  formScore: number;
  fatigue: number;
  status: "fit" | "caution" | "injured";
  testScore?: number;
}

interface UpcomingMatch {
  id: string;
  opponent: string;
  date: string;
  venue: "home" | "away";
  competition: string;
}

interface DrillProgress {
  id: string;
  drillId: string;
  unlocked: boolean;
  completed: boolean;
  attempts: number;
  unlockedAt: string;
  completedAt: string | null;
}

interface GamificationState {
  rank: string;
  xpTotal: number;
  weeklyStreak: number;
  longestStreak: number;
  totalSessions: number;
  drillTierUnlocked: number;
  badgesEarned: string[];
  lastTestAt: string;
}

// Player Drills Modal Component
function PlayerDrillsModal({ player, drills, gamification, onClose }: {
  player: SquadMember;
  drills: DrillProgress[];
  gamification: GamificationState | null;
  onClose: () => void;
}) {
  const completedCount = drills.filter(d => d.completed).length;
  const unlockedCount = drills.filter(d => d.unlocked).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black">{player.name}</h2>
            <p className="text-white/70 text-sm">{player.position} • Form: {player.formScore}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Gamification Stats */}
          {gamification && (
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-black text-[#1a5c2a]">{gamification.rank}</p>
                <p className="text-[9px] text-gray-500">Rank</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-black text-[#1a5c2a]">{gamification.xpTotal}</p>
                <p className="text-[9px] text-gray-500">XP</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-black text-[#1a5c2a]">{gamification.weeklyStreak}</p>
                <p className="text-[9px] text-gray-500">Streak</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xl font-black text-[#1a5c2a]">{unlockedCount}</p>
                <p className="text-[9px] text-gray-500">Unlocked</p>
              </div>
            </div>
          )}

          {/* Badges */}
          {gamification?.badgesEarned && gamification.badgesEarned.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">🏅 Badges Earned</h3>
              <div className="flex flex-wrap gap-2">
                {gamification.badgesEarned.map((badge) => (
                  <span key={badge} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {badge.replace('_', ' ').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Drills Progress */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Icons.Dumbbell size={14} className="text-[#1a5c2a]" />
              Drills Progress ({completedCount}/{unlockedCount} completed)
            </h3>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#1a5c2a] rounded-full" style={{ width: `${unlockedCount > 0 ? (completedCount / unlockedCount) * 100 : 0}%` }} />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {drills.map((drill) => (
                <div key={drill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{drill.drillId.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-400">Attempts: {drill.attempts}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {drill.completed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed ✓</span>
                    ) : drill.unlocked ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">In Progress</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Locked 🔒</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Get all football roles from config
const getFootballRoles = (): StaffRoleConfig[] => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { COACHING_STAFF_ROLES } = require("@/config/coaching-staff");
  return COACHING_STAFF_ROLES.football || [];
};

export default function CoachHubPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [activeRole, setActiveRole] = useState<string>("head_coach");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [knowledge, setKnowledge] = useState<SessionPoint[]>([]);
  const [squadStats, setSquadStats] = useState<SquadStats>({
    total_players: 0,
    active_injuries: 0,
    teamAvgForm: 0,
    highFatigueCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
  const [departmentDrills, setDepartmentDrills] = useState<Drill[]>([]);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const [departmentStats, setDepartmentStats] = useState(getDepartmentStats());
  const [assignedDrills, setAssignedDrills] = useState<Record<string, string[]>>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDrillForAssign, setSelectedDrillForAssign] = useState<Drill | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // State for drills and gamification
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedPlayerData, setSelectedPlayerData] = useState<SquadMember | null>(null);
  const [playerDrills, setPlayerDrills] = useState<DrillProgress[]>([]);
  const [playerGamification, setPlayerGamification] = useState<GamificationState | null>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const [showPlayerDrillsModal, setShowPlayerDrillsModal] = useState(false);

  const [coachTab, setCoachTab] = useState<"squad" | "analysis">("squad");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const footballRoles = getFootballRoles();

  // Suppress unused variable warnings for state setters used only via side effects
  void knowledge;
  void loadingPlayerData;
  void departmentStats;

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "coach" && user.role !== "admin") router.replace("/arena");
  }, [hasHydrated, user, router]);

  // Load role config and drills when role changes
  useEffect(() => {
    const rc = getRoleConfig(activeRole);
    if (!rc) return;

    loadKnowledgeForRole(rc.focusCategories).then(setKnowledge).catch(() => setKnowledge([]));

    const department = rc.department;
    if (department && department !== "all") {
      const drills = getDrillsByDepartment(department);
      setDepartmentDrills(drills);
    } else if (department === "all" || rc.id === "head_coach" || rc.id === "assistant_coach") {
      const allDrills = [
        ...getDrillsByDepartment("striker"),
        ...getDrillsByDepartment("defender"),
        ...getDrillsByDepartment("midfielder"),
        ...getDrillsByDepartment("goalkeeper"),
        ...getDrillsByDepartment("fitness"),
        ...getDrillsByDepartment("analytics"),
        ...getDrillsByDepartment("medical"),
        ...getDrillsByDepartment("admin"),
      ];
      setDepartmentDrills(allDrills.slice(0, 8));
    } else {
      setDepartmentDrills([]);
    }
  }, [activeRole]);

  // Load player drills and gamification when a player is selected
  useEffect(() => {
    if (!selectedPlayerId) return;

    const loadPlayerData = async () => {
      setLoadingPlayerData(true);
      try {
        const drillsRes = await fetch(`/api/drills?playerId=${selectedPlayerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (drillsRes.ok) {
          const drillsData = await drillsRes.json();
          setPlayerDrills(drillsData.drills || []);
        }

        const gamificationRes = await fetch(`/api/gamification?playerId=${selectedPlayerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (gamificationRes.ok) {
          const gamificationData = await gamificationRes.json();
          setPlayerGamification(gamificationData);
        }
      } catch {
        // silently fail — modal shows empty state
      } finally {
        setLoadingPlayerData(false);
      }
    };

    loadPlayerData();
  }, [selectedPlayerId, token]);

  // Load biometric data — uses real API players when available, falls back to mock
  const loadBiometricData = (realPlayers?: Record<string, unknown>[]) => {
    try {
      let members: SquadMember[];

      if (realPlayers && realPlayers.length > 0) {
        members = realPlayers.map((p, i) => ({
          id:        String(p.id ?? i + 1),
          name:      String(p.name ?? p.full_name ?? "Player"),
          position:  String(p.position ?? p.position_primary ?? "—"),
          formScore: Number(p.avg_form_score ?? p.form_score ?? p.overall_score ?? 75),
          fatigue:   Number(p.fatigue ?? 40),
          status:    (["fit", "caution", "injured"].includes(String(p.status)) ? p.status : "fit") as SquadMember["status"],
          testScore: p.athletic_score != null ? Number(p.athletic_score) : undefined,
        }));
      } else {
        // Fallback mock — shown until real players are synced
        members = [
          { id: "1", name: "Tendai Musona",     position: "Winger",     formScore: 84, fatigue: 45, status: "fit" },
          { id: "2", name: "Blessing Moyo",     position: "Striker",    formScore: 92, fatigue: 28, status: "fit" },
          { id: "3", name: "Knowledge Chikwanda", position: "Midfielder", formScore: 78, fatigue: 62, status: "caution" },
          { id: "4", name: "Takudzwa Ngwenya",  position: "Defender",   formScore: 81, fatigue: 35, status: "fit" },
          { id: "5", name: "Tinashe Kamusoko", position: "Defender",   formScore: 76, fatigue: 71, status: "caution" },
          { id: "6", name: "Edmore Sibanda",    position: "Goalkeeper", formScore: 88, fatigue: 22, status: "fit" },
          { id: "7", name: "Tanaka Chikuni",    position: "Midfielder", formScore: 85, fatigue: 32, status: "fit" },
          { id: "8", name: "Takunda Moyo",      position: "Striker",    formScore: 79, fatigue: 48, status: "fit" },
        ];
      }

      setSquad(members);

      const avgForm    = Math.round(members.reduce((sum, p) => sum + p.formScore, 0) / members.length);
      const highFatigue = members.filter((p) => p.fatigue > 60).length;

      setSquadStats((prev) => ({
        ...prev,
        teamAvgForm:      avgForm,
        highFatigueCount: highFatigue,
      }));
    } catch {
      // silently fail — squad table stays empty
    }
  };

  // Fetch squad + injury counts from real API
  useEffect(() => {
    if (!token || !user) return;
    setLoadingStats(true);
    Promise.allSettled([
      fetch(`${API}/coach/squad`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API}/coach/injuries`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([squadRes, injuryRes]) => {
        const players = squadRes.status === "fulfilled" ? squadRes.value.data ?? squadRes.value : [];
        const injuries = injuryRes.status === "fulfilled" ? injuryRes.value.data ?? injuryRes.value : [];
        setSquadStats((prev) => ({
          ...prev,
          total_players: Array.isArray(players) ? players.length : 0,
          active_injuries: Array.isArray(injuries) ? injuries.filter((i: { recovered_at: string | null }) => !i.recovered_at).length : 0,
        }));
        loadBiometricData();

        setUpcomingMatches([
          { id: "1", opponent: "Dynamos FC", date: "2026-06-07", venue: "home", competition: "Premier League" },
          { id: "2", opponent: "CAPS United", date: "2026-06-14", venue: "away", competition: "Premier League" },
          { id: "3", opponent: "Highlanders", date: "2026-06-21", venue: "home", competition: "Chibuku Cup" },
        ]);
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [token, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const getFormColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getFatigueDisplay = (fatigue: number) => {
    if (fatigue > 60) return { text: "High", color: "text-red-500" };
    if (fatigue > 30) return { text: "Moderate", color: "text-amber-500" };
    return { text: "Low", color: "text-emerald-500" };
  };

  const handleRoleSwitch = (roleId: string) => {
    setActiveRole(roleId);
    setChatHistory([]);
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loadingAi) return;

    const userMsg: ChatMessage = { id: String(Date.now()), role: "user", text: query.trim() };
    setChatHistory((prev) => [...prev, userMsg]);
    setQuery("");
    setLoadingAi(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: userMsg.text, role: activeRole, language: "en" }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.answer ?? json.reply ?? json.response ?? "No response received.";
        setChatHistory((prev) => [...prev, { id: String(Date.now() + 1), role: "assistant", text }]);
      } else {
        throw new Error("request failed");
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          text: "Maziwisa! I encountered a temporary processing gap. Let's trace that strategy drill loop again.",
        },
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  const assignDrillToPlayers = (drill: Drill, playerIds: string[]) => {
    const newAssignments = { ...assignedDrills };
    playerIds.forEach((playerId) => {
      if (!newAssignments[playerId]) newAssignments[playerId] = [];
      if (!newAssignments[playerId].includes(drill.id)) {
        newAssignments[playerId].push(drill.id);
      }
    });
    setAssignedDrills(newAssignments);
    localStorage.setItem("bhora_drill_assignments", JSON.stringify(newAssignments));
    alert(`Drill "${drill.name}" assigned to ${playerIds.length} player(s)`);
  };

  if (!hasHydrated || !user) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Icons.Loader2 className="animate-spin text-[#1a5c2a]" size={24} />
      </div>
    );
  }

  const roleConfig = getRoleConfig(activeRole);
  const RoleIcon = roleConfig ? getIconComponent(roleConfig.icon) : Icons.Shield;
  void RoleIcon; // used via getIconComponent in the role list below

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 antialiased font-sans flex flex-col lg:flex-row">
      {/* Left Panel — Staff Role Selector */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-6 space-y-6 shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-[#1a5c2a] font-black text-xs uppercase tracking-widest">
            <Icons.Shield size={14} />
            <span>Tactical Hub Console</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mt-1">CoachHub Engine</h1>
          <p className="text-xs font-bold text-gray-400 mt-0.5">Zimbabwe Grassroots Framework</p>
        </div>

        {/* Biometric Summary Cards */}
        {squadStats.teamAvgForm !== undefined && squadStats.teamAvgForm > 0 && (
          <div className="space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Team Biometrics</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-lg font-black text-[#1a5c2a]">{squadStats.teamAvgForm}</p>
                <p className="text-[8px] text-gray-500">Avg Form</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-amber-600">{squadStats.highFatigueCount || 0}</p>
                <p className="text-[8px] text-gray-500">High Fatigue</p>
              </div>
            </div>
            <Link href="/coach/squad" className="text-[10px] font-bold text-[#1a5c2a] flex items-center gap-0.5">
              View Squad <Icons.ChevronRight size={10} />
            </Link>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Staff Role</p>
          {footballRoles.map((role) => {
            const isSelected = activeRole === role.id;
            const RoleIconItem = getIconComponent(role.icon);
            return (
              <button
                key={role.id}
                onClick={() => handleRoleSwitch(role.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#1a5c2a] border-[#1a5c2a] text-white shadow-xs"
                    : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isSelected ? "bg-white/20" : "bg-gray-100"}`}>
                    {ROLE_EMOJIS[role.id] ?? <RoleIconItem size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide leading-tight">{role.title}</p>
                    <p className={`text-[10px] font-medium leading-none mt-0.5 truncate max-w-[160px] ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                      {role.description.substring(0, 50)}...
                    </p>
                  </div>
                </div>
                <Icons.ChevronRight size={14} className={isSelected ? "text-white" : "text-gray-400"} />
              </button>
            );
          })}
        </div>

        {/* Department Drill Count */}
        {departmentDrills.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Icons.BookOpen size={12} className="text-[#1a5c2a]" />
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Department Drills</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{departmentDrills.length}</p>
            <p className="text-[10px] text-gray-500">Available training sessions</p>
          </div>
        )}

        {/* Drill Library Stats */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Academy Library</p>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="flex justify-between"><span>Striker:</span><span className="font-bold">{getDepartmentStats().striker}</span></div>
            <div className="flex justify-between"><span>Defender:</span><span className="font-bold">{getDepartmentStats().defender}</span></div>
            <div className="flex justify-between"><span>Midfielder:</span><span className="font-bold">{getDepartmentStats().midfielder}</span></div>
            <div className="flex justify-between"><span>Goalkeeper:</span><span className="font-bold">{getDepartmentStats().goalkeeper}</span></div>
            <div className="flex justify-between"><span>Fitness:</span><span className="font-bold">{getDepartmentStats().fitness}</span></div>
            <div className="flex justify-between"><span>Medical:</span><span className="font-bold">{getDepartmentStats().medical}</span></div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-[10px] font-bold">
            <span>Total Drills:</span>
            <span className="text-[#1a5c2a]">{getDepartmentStats().total}</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-gray-200 space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quick Actions</p>
          <Link href="/coach/live-match" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Icons.Activity size={12} /> Live Match
          </Link>
          <Link href="/coach/training-plans" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Icons.Dumbbell size={12} /> Training Plans
          </Link>
          <Link href="/coach/chemistry" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Icons.Zap size={12} /> Squad Chemistry
          </Link>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 px-6">
          <button
            onClick={() => setCoachTab("squad")}
            className={`py-4 px-6 text-sm font-black uppercase tracking-wide border-b-2 transition-colors ${coachTab === "squad" ? "border-[#1a5c2a] text-[#1a5c2a]" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >
            Squad Overview
          </button>
          <button
            onClick={() => setCoachTab("analysis")}
            className={`py-4 px-6 text-sm font-black uppercase tracking-wide border-b-2 transition-colors ${coachTab === "analysis" ? "border-[#1a5c2a] text-[#1a5c2a]" : "border-transparent text-gray-400 hover:text-gray-700"}`}
          >
            🔬 AI Analysis
          </button>
        </div>

        {/* AI Analysis Tab */}
        {coachTab === "analysis" && (
          <div className="p-6">
            <CoachAnalysisTab token={token ?? null} />
          </div>
        )}

        {/* Squad Overview — all existing content wrapped */}
        {coachTab === "squad" && (
        <div className="p-6 space-y-6">
        {/* Metric Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Active Roster</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{loadingStats ? "…" : squadStats.total_players}</span>
              <span className="text-xs font-bold text-gray-400">Players</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Medical Bay</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${squadStats.active_injuries > 0 ? "text-red-600" : "text-gray-900"}`}>
                {loadingStats ? "…" : squadStats.active_injuries}
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Team Form</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1a5c2a]">{squadStats.teamAvgForm || "—"}</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Fatigue Alert</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${(squadStats.highFatigueCount || 0) > 0 ? "text-amber-600" : "text-gray-900"}`}>
                {squadStats.highFatigueCount || 0}
              </span>
            </div>
          </div>
        </section>

        {/* Department Drills Section */}
        {departmentDrills.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-2">
                <Icons.HardHat size={16} className="text-[#1a5c2a]" />
                <h3 className="text-sm font-bold text-gray-900">{roleConfig?.title} Drill Library</h3>
                <span className="text-[10px] bg-[#1a5c2a]/10 text-[#1a5c2a] px-2 py-0.5 rounded-full font-bold">{departmentDrills.length} Sessions</span>
              </div>
              <Link href={`/coach/drills/${roleConfig?.department || "all"}`} className="text-[10px] font-bold text-[#1a5c2a] hover:underline flex items-center gap-1">
                View All Drills <Icons.ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {departmentDrills.slice(0, 4).map((drill) => (
                <div key={drill.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedDrill(drill); setShowDrillModal(true); }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{drill.name}</h4>
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{drill.duration}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          drill.difficulty === "beginner" ? "bg-green-100 text-green-700" :
                          drill.difficulty === "advanced" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>{drill.difficulty}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{drill.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1"><Icons.Target size={10} className="text-gray-400" /><p className="text-[9px] text-gray-400">{drill.coachingPoints.length} coaching points</p></div>
                        <div className="flex items-center gap-1"><Icons.Clock size={10} className="text-gray-400" /><p className="text-[9px] text-gray-400">Phase: {drill.phase}</p></div>
                      </div>
                    </div>
                    <button className="ml-4 text-[#1a5c2a] hover:bg-[#1a5c2a]/10 p-2 rounded-lg transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedDrill(drill); setShowDrillModal(true); }}>
                      <Icons.Play size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Squad Biometrics Table */}
        {squad.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><Icons.Users size={16} className="text-[#1a5c2a]" /><h3 className="text-sm font-bold text-gray-900">Squad Biometrics</h3></div>
              <Link href="/coach/squad" className="text-[10px] font-bold text-[#1a5c2a] hover:underline">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Player</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Position</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Form</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Fatigue</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">Drills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {squad.slice(0, 5).map((player) => {
                    const fatigueDisplay = getFatigueDisplay(player.fatigue);
                    const assignedCount = assignedDrills[player.id]?.length || 0;
                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedPlayerId(player.id);
                          setSelectedPlayerData(player);
                          setShowPlayerDrillsModal(true);
                        }}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{player.name}</td>
                        <td className="px-4 py-3 text-gray-600">{player.position}</td>
                        <td className="px-4 py-3"><span className={`font-bold ${getFormColor(player.formScore)}`}>{player.formScore}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs ${fatigueDisplay.color}`}>{fatigueDisplay.text}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${player.status === "fit" ? "bg-green-100 text-green-700" : player.status === "caution" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{player.status}</span></td>
                        <td className="px-4 py-3">{assignedCount > 0 ? <span className="text-[10px] bg-[#1a5c2a]/10 text-[#1a5c2a] px-2 py-0.5 rounded-full font-bold">{assignedCount} drills</span> : <span className="text-[10px] text-gray-400">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Icons.Calendar size={16} className="text-[#1a5c2a]" /><h3 className="text-sm font-bold text-gray-900">Upcoming Matches</h3></div>
            <div className="space-y-2">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div><p className="text-sm font-medium text-gray-900">vs {match.opponent}</p><p className="text-[10px] text-gray-500 mt-0.5">{match.competition} • {match.venue === "home" ? "🏠 Home" : "✈️ Away"}</p></div>
                  <div className="text-right"><p className="text-xs text-[#1a5c2a] font-medium">{new Date(match.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* THUTO Intelligence Suite - Chat */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600"><Icons.Sparkles size={16} /></div>
              <div><span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">THUTO Expert System</span><h3 className="text-base font-black text-gray-900">{roleConfig?.title}</h3></div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{roleConfig?.description}</p>
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">{roleConfig?.focusCategories.map((cat) => (<span key={cat} className="bg-white border border-gray-200 text-gray-700 font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-sm">🎯 {cat.replace(/_/g, " ")}</span>))}</div>
            </div>
            {(squadStats.highFatigueCount || 0) > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2"><Icons.Brain size={14} className="text-amber-600" /><p className="text-[10px] font-bold text-amber-700 uppercase">AI Insight</p></div>
                <p className="text-[11px] text-amber-800 mt-1">{squadStats.highFatigueCount} player(s) show high fatigue. Consider lighter training session.</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col h-[420px] justify-between">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Icons.Bot size={36} className="text-gray-300 mb-2" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-700">Framework Terminal Online</p>
                  <p className="text-xs font-medium max-w-xs mt-1">Ask about tactical layouts, recovery protocols, or training drills.</p>
                </div>
              ) : (
                chatHistory.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                      <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${isUser ? "bg-[#1a5c2a] text-white" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>{isUser ? "C" : "T"}</div>
                      <div className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${isUser ? "bg-[#1a5c2a] text-white rounded-tr-none" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"}`}>{msg.text}</div>
                    </div>
                  );
                })
              )}
              {loadingAi && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0"><Icons.Loader2 className="animate-spin" size={14} /></div>
                  <div className="bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-xs font-bold uppercase tracking-widest animate-pulse">Analyzing Parameters…</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAiQuery} className="flex gap-2 border-t border-gray-100 pt-3 bg-white">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Ask the ${roleConfig?.title} assistant…`} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] transition-all" />
              <button type="submit" disabled={!query.trim() || loadingAi} className="bg-[#1a5c2a] text-white p-2.5 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shadow-sm shrink-0 cursor-pointer"><Icons.Send size={16} /></button>
            </form>
          </div>
        </section>
        </div>
        )} {/* end squad tab */}
      </main>

      {/* Drill Detail Modal */}
      {showDrillModal && selectedDrill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDrillModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">{selectedDrill.name}</h2>
              <button onClick={() => setShowDrillModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{selectedDrill.duration}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${selectedDrill.difficulty === "beginner" ? "bg-green-100 text-green-700" : selectedDrill.difficulty === "advanced" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{selectedDrill.difficulty}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">{selectedDrill.phase}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedDrill.description}</p>
              <div><h4 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1"><Icons.Target size={12} /> Coaching Points</h4><ul className="space-y-1">{selectedDrill.coachingPoints.map((point, i) => (<li key={i} className="text-sm text-gray-600 flex items-start gap-2"><Icons.CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />{point}</li>))}</ul></div>
              <div><h4 className="text-xs font-black uppercase text-gray-500 mb-2 flex items-center gap-1"><Icons.Briefcase size={12} /> Equipment Needed</h4><div className="flex flex-wrap gap-1">{selectedDrill.equipment.map((item, i) => (<span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{item}</span>))}</div></div>
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button className="flex-1 bg-[#1a5c2a] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 transition-colors flex items-center justify-center gap-2" onClick={() => { setSelectedDrillForAssign(selectedDrill); setSelectedPlayers([]); setShowAssignModal(true); setShowDrillModal(false); }}><Icons.Play size={14} /> Assign to Players</button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2" onClick={() => { alert(`Drill "${selectedDrill.name}" added to training plan`); }}><Icons.Bookmark size={14} /> Save to Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Drill to Players Modal */}
      {showAssignModal && selectedDrillForAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200"><h2 className="text-lg font-black text-gray-900">Assign Drill to Players</h2><p className="text-xs text-gray-500 mt-1">{selectedDrillForAssign.name}</p></div>
            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {squad.map((player) => (
                <label key={player.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={(e) => { if (e.target.checked) { setSelectedPlayers([...selectedPlayers, player.id]); } else { setSelectedPlayers(selectedPlayers.filter((id) => id !== player.id)); } }} className="w-4 h-4 rounded border-gray-300 text-[#1a5c2a] focus:ring-[#1a5c2a]" />
                  <div><p className="text-sm font-medium text-gray-900">{player.name}</p><p className="text-[10px] text-gray-500">{player.position}</p></div>
                </label>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl font-bold text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={() => { assignDrillToPlayers(selectedDrillForAssign, selectedPlayers); setShowAssignModal(false); }} disabled={selectedPlayers.length === 0} className="flex-1 bg-[#1a5c2a] text-white py-2 rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 disabled:opacity-50 disabled:cursor-not-allowed">Assign to {selectedPlayers.length} Player(s)</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Drills Modal */}
      {showPlayerDrillsModal && selectedPlayerData && (
        <PlayerDrillsModal
          player={selectedPlayerData}
          drills={playerDrills}
          gamification={playerGamification}
          onClose={() => {
            setShowPlayerDrillsModal(false);
            setSelectedPlayerId(null);
            setSelectedPlayerData(null);
          }}
        />
      )}
    </div>
  );
}