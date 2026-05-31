"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Flame, ShieldAlert, Target, Activity,
  Dumbbell, HeartPulse, Briefcase, ChevronRight,
  Send, Bot, Sparkles, Loader2, TrendingUp, Calendar,
  Trophy, Award, Eye, Brain, Zap, BarChart3, AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { COACHING_STAFF_ROLES, getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { loadKnowledgeForRole, type SessionPoint } from "@/lib/coaching-knowledge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

const ROLE_EMOJIS: Record<string, string> = {
  head_coach:          "🎽",
  assistant_coach:     "👥",
  attack_coach:        "🔥",
  defence_coach:       "🛡️",
  gk_coach:            "🥅",
  performance_analyst: "📊",
  fitness_coach:       "🏋️",
  team_physio:         "🩺",
  team_manager:        "💼",
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
}

interface UpcomingMatch {
  id: string;
  opponent: string;
  date: string;
  venue: "home" | "away";
  competition: string;
}

const FOOTBALL_ROLES = COACHING_STAFF_ROLES.football ?? [];

export default function CoachHubPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router      = useRouter();

  const [activeRole,    setActiveRole]    = useState(FOOTBALL_ROLES[0]?.id ?? "head_coach");
  const [query,         setQuery]         = useState("");
  const [chatHistory,   setChatHistory]   = useState<ChatMessage[]>([]);
  const [loadingAi,     setLoadingAi]     = useState(false);
  const [knowledge,     setKnowledge]     = useState<SessionPoint[]>([]);
  const [squadStats,    setSquadStats]    = useState<SquadStats>({ total_players: 0, active_injuries: 0, teamAvgForm: 0, highFatigueCount: 0 });
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [squad,         setSquad]         = useState<SquadMember[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") router.replace("/arena");
  }, [hasHydrated, user, router]);

  // Load knowledge base for the selected role
  useEffect(() => {
    const rc = getRoleConfig(activeRole);
    if (!rc) return;
    loadKnowledgeForRole(rc.focusCategories).then(setKnowledge).catch(() => setKnowledge([]));
  }, [activeRole]);

  // Load biometric data from localStorage
  const loadBiometricData = () => {
    try {
      // In production, this would come from training_sessions_{playerId}
      // Mock data for demonstration
      const mockSquad: SquadMember[] = [
        { id: "1", name: "Tendai Musona", position: "Winger", formScore: 84, fatigue: 45, status: "fit" },
        { id: "2", name: "Blessing Moyo", position: "Striker", formScore: 92, fatigue: 28, status: "fit" },
        { id: "3", name: "Knowledge Chikwanda", position: "Midfielder", formScore: 78, fatigue: 62, status: "caution" },
        { id: "4", name: "Takudzwa Ngwenya", position: "Defender", formScore: 81, fatigue: 35, status: "fit" },
        { id: "5", name: "Tinashe Kamusoko", position: "Defender", formScore: 76, fatigue: 71, status: "caution" },
        { id: "6", name: "Edmore Sibanda", position: "Goalkeeper", formScore: 88, fatigue: 22, status: "fit" },
      ];
      setSquad(mockSquad);
      
      const avgForm = Math.round(mockSquad.reduce((sum, p) => sum + p.formScore, 0) / mockSquad.length);
      const highFatigue = mockSquad.filter(p => p.fatigue > 60).length;
      
      setSquadStats(prev => ({
        ...prev,
        teamAvgForm: avgForm,
        highFatigueCount: highFatigue,
      }));
    } catch (e) {
      console.error("Failed to load biometric data", e);
    }
  };

  // Fetch squad + injury counts
  useEffect(() => {
    if (!token || !user) return;
    setLoadingStats(true);
    Promise.allSettled([
      fetch(`${API}/api/v1/coach/squad`,    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/v1/coach/injuries`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([squadRes, injuryRes]) => {
      const players  = squadRes.status  === "fulfilled" ? (squadRes.value.data  ?? squadRes.value)  : [];
      const injuries = injuryRes.status === "fulfilled" ? (injuryRes.value.data ?? injuryRes.value) : [];
      setSquadStats(prev => ({
        ...prev,
        total_players:   Array.isArray(players)  ? players.length : 0,
        active_injuries: Array.isArray(injuries) ? injuries.filter((i: { recovered_at: string | null }) => !i.recovered_at).length : 0,
      }));
      
      // Load biometric data after squad is fetched
      loadBiometricData();
      
      // Mock upcoming matches
      setUpcomingMatches([
        { id: "1", opponent: "Dynamos FC", date: "2026-06-07", venue: "home", competition: "Premier League" },
        { id: "2", opponent: "CAPS United", date: "2026-06-14", venue: "away", competition: "Premier League" },
        { id: "3", opponent: "Highlanders", date: "2026-06-21", venue: "home", competition: "Chibuku Cup" },
      ]);
    }).catch(() => {/* silent */}).finally(() => setLoadingStats(false));
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

  if (!hasHydrated || !user) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a5c2a]" size={24} />
      </div>
    );
  }

  const roleConfig: StaffRoleConfig = getRoleConfig(activeRole) ?? FOOTBALL_ROLES[0];

  const handleRoleSwitch = (roleId: string) => {
    setActiveRole(roleId);
    setChatHistory([]);
  };

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loadingAi) return;

    const userMsg: ChatMessage = { id: String(Date.now()), role: "user", text: query.trim() };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery("");
    setLoadingAi(true);

    try {
      const res = await fetch(`${API}/api/v1/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: userMsg.text, role: roleConfig.id, language: "en" }),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.answer ?? json.reply ?? json.response ?? "No response received.";
        setChatHistory(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", text }]);
      } else {
        throw new Error("request failed");
      }
    } catch {
      setChatHistory(prev => [...prev, {
        id: String(Date.now() + 1),
        role: "assistant",
        text: "Maziwisa! I encountered a temporary processing gap. Let's trace that strategy drill loop again.",
      }]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 antialiased font-sans flex flex-col lg:flex-row">

      {/* Left Panel — Staff Role Selector */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-6 space-y-6 shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-[#1a5c2a] font-black text-xs uppercase tracking-widest">
            <Shield size={14} />
            <span>Tactical Hub Console</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mt-1">CoachHub Engine</h1>
          <p className="text-xs font-bold text-gray-400 mt-0.5">Zimbabwe Grassroots Framework</p>
        </div>

        {/* Biometric Summary Cards - NEW */}
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
              View Squad <ChevronRight size={10} />
            </Link>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Staff Role</p>
          {FOOTBALL_ROLES.map((role) => {
            const isSelected = activeRole === role.id;
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
                    {ROLE_EMOJIS[role.id] ?? "👤"}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide leading-tight">{role.title}</p>
                    <p className={`text-[10px] font-medium leading-none mt-0.5 truncate max-w-[160px] ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                      {role.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className={isSelected ? "text-white" : "text-gray-400"} />
              </button>
            );
          })}
        </div>

        {/* Quick Links - NEW */}
        <div className="pt-4 border-t border-gray-200 space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Quick Actions</p>
          <Link href="/coach/live-match" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Activity size={12} /> Live Match
          </Link>
          <Link href="/coach/training-plans" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Dumbbell size={12} /> Training Plans
          </Link>
          <Link href="/coach/chemistry" className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#1a5c2a] py-1.5">
            <Zap size={12} /> Squad Chemistry
          </Link>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Metric Strip - Enhanced with Biometrics */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Active Roster</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{loadingStats ? "…" : squadStats.total_players}</span>
              <span className="text-xs font-bold text-gray-400">Players</span>
            </div>
            <Link href="/coach/squad" className="text-[11px] font-black text-[#1a5c2a] uppercase tracking-wide flex items-center gap-0.5 mt-2 hover:underline">
              Manage Squad <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Medical Bay</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${squadStats.active_injuries > 0 ? "text-red-600" : "text-gray-900"}`}>
                {loadingStats ? "…" : squadStats.active_injuries}
              </span>
              <span className="text-xs font-bold text-gray-400">Sidelined</span>
            </div>
            <Link href="/coach/injuries" className="text-[11px] font-black text-[#1a5c2a] uppercase tracking-wide flex items-center gap-0.5 mt-2 hover:underline">
              Track Recovery <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Team Form</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1a5c2a]">{squadStats.teamAvgForm || "—"}</span>
              <span className="text-xs font-bold text-gray-400">Avg Score</span>
            </div>
            <p className="text-[9px] text-gray-500 mt-1">Based on biometric scans</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Fatigue Alert</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${(squadStats.highFatigueCount || 0) > 0 ? "text-amber-600" : "text-gray-900"}`}>
                {squadStats.highFatigueCount || 0}
              </span>
              <span className="text-xs font-bold text-gray-400">Players</span>
            </div>
            {(squadStats.highFatigueCount || 0) > 0 && (
              <p className="text-[9px] text-amber-600 mt-1">⚠️ Rest recommended</p>
            )}
          </div>
        </section>

        {/* Squad Biometrics Table - NEW */}
        {squad.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[#1a5c2a]" />
                <h3 className="text-sm font-bold text-gray-900">Squad Biometrics</h3>
              </div>
              <Link href="/coach/squad" className="text-[10px] font-bold text-[#1a5c2a] hover:underline">
                View All →
              </Link>
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
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {squad.slice(0, 5).map((player) => {
                    const fatigueDisplay = getFatigueDisplay(player.fatigue);
                    return (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{player.name}</td>
                        <td className="px-4 py-3 text-gray-600">{player.position}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${getFormColor(player.formScore)}`}>
                            {player.formScore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${fatigueDisplay.color}`}>
                            {fatigueDisplay.text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            player.status === "fit" ? "bg-green-100 text-green-700" :
                            player.status === "caution" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {player.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/coach/squad/${player.id}`} className="text-[10px] font-bold text-[#1a5c2a] hover:underline">
                            Profile →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Upcoming Matches - NEW */}
        {upcomingMatches.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#1a5c2a]" />
              <h3 className="text-sm font-bold text-gray-900">Upcoming Matches</h3>
            </div>
            <div className="space-y-2">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">vs {match.opponent}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {match.competition} • {match.venue === "home" ? "🏠 Home" : "✈️ Away"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#1a5c2a] font-medium">
                      {new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/coach/matches" className="mt-3 block text-center text-[10px] font-bold text-[#1a5c2a] hover:underline">
              Manage Fixtures →
            </Link>
          </section>
        )}

        {/* THUTO Intelligence Suite - YOUR ORIGINAL CHAT */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Role Context */}
          <div className="lg:col-span-2 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">THUTO Expert System</span>
                <h3 className="text-base font-black text-gray-900">{roleConfig.title}</h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">{roleConfig.description}</p>

            {/* Focus categories as pills */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {roleConfig.focusCategories.map((cat) => (
                  <span key={cat} className="bg-white border border-gray-200 text-gray-700 font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-2xs">
                    🎯 {cat.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Knowledge base session points as suggested prompts */}
            {knowledge.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-gray-400 tracking-wide">Suggested Diagnostics</p>
                <div className="space-y-1.5">
                  {knowledge.slice(0, 2).flatMap((sp) =>
                    sp.points.slice(0, 2).map((point, idx) => (
                      <button
                        key={`${sp.source}-${idx}`}
                        onClick={() => setQuery(point)}
                        className="w-full text-left p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 transition-all line-clamp-2"
                      >
                        💡 {point}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* AI Recommendation Card - NEW */}
            {(squadStats.highFatigueCount || 0) > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-amber-600" />
                  <p className="text-[10px] font-bold text-amber-700 uppercase">AI Insight</p>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  {squadStats.highFatigueCount} player(s) show high fatigue. Consider lighter training session.
                </p>
              </div>
            )}
          </div>

          {/* Chat Terminal - YOUR ORIGINAL */}
          <div className="lg:col-span-3 flex flex-col h-[420px] justify-between">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Bot size={36} className="text-gray-300 mb-2" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-700">Framework Terminal Online</p>
                  <p className="text-xs font-medium max-w-xs mt-1">
                    Ask tactical layout metrics, player recovery outlines, or training drill routines for your squad.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                      <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${isUser ? "bg-[#1a5c2a] text-white" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                        {isUser ? "C" : "T"}
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-2xs ${isUser ? "bg-[#1a5c2a] text-white rounded-tr-none" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              {loadingAi && (
                <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                    <Loader2 className="animate-spin" size={14} />
                  </div>
                  <div className="bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Analyzing Parameters…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAiQuery} className="flex gap-2 border-t border-gray-100 pt-3 bg-white">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask the ${roleConfig.title} assistant…`}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a] transition-all"
              />
              <button
                type="submit"
                disabled={!query.trim() || loadingAi}
                className="bg-[#1a5c2a] text-white p-2.5 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}