"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Flame, ShieldAlert, Target, Activity,
  Dumbbell, HeartPulse, Briefcase, BookOpen, Tag, ChevronRight,
  MessageSquare, Send, Bot, Trophy, Sparkles, Loader2, Award
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { COACHING_STAFF_ROLES } from "@/config/coaching-staff";
import { loadKnowledgeForRole } from "@/lib/coaching-knowledge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface SquadStats {
  total_players: number;
  active_injuries: number;
  match_alerts: number;
}

export default function CoachHubPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [activeRole, setActiveRole] = useState("head_coach");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [squadStats, setSquadStats] = useState<SquadStats>({ total_players: 0, active_injuries: 0, match_alerts: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Authenticated route protection matching hydration patterns
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "coach" && user.role !== "admin") {
      router.replace("/arena");
    }
  }, [hasHydrated, user, router]);

  // Fetch live operational squad metrics from the backend
  useEffect(() => {
    if (!token || !user) return;
    setLoadingStats(true);

    Promise.allSettled([
      fetch(`${API}/api/v1/coach/squad`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/v1/coach/injuries`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([squadRes, injuryRes]) => {
      const playersList = squadRes.status === "fulfilled" ? (squadRes.value.data ?? squadRes.value) : [];
      const injuriesList = injuryRes.status === "fulfilled" ? (injuryRes.value.data ?? injuryRes.value) : [];

      setSquadStats({
        total_players: Array.isArray(playersList) ? playersList.length : 0,
        active_injuries: Array.isArray(injuriesList) ? injuriesList.filter((i: { recovered_at: string | null }) => !i.recovered_at).length : 0,
        match_alerts: 2 // Sample localized active notifications tracking pipeline
      });
    }).catch(err => console.error("Error optimizing hub data streams:", err))
      .finally(() => setLoadingStats(false));
  }, [token, user]);

  // Auto-scroll chat history window instance
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  if (!hasHydrated || !user) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a5c2a]" size={24} />
      </div>
    );
  }

  const roleConfig = COACHING_STAFF_ROLES[activeRole] || COACHING_STAFF_ROLES.head_coach;
  const knowledge = loadKnowledgeForRole(activeRole);

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loadingAi) return;

    const userMessage: ChatMessage = { id: String(Date.now()), role: "user", text: query.trim() };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setLoadingAi(true);

    try {
      const response = await fetch(`${API}/api/v1/ai-coach/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: userMessage.text,
          coaching_framework: activeRole,
          system_prompt: knowledge.frameworkPrompt
        })
      });

      if (response.ok) {
        const json = await response.json();
        setChatHistory((prev) => [
          ...prev,
          { id: String(Date.now() + 1), role: "assistant", text: json.reply ?? json.response }
        ]);
      } else {
        throw new Error("API stream connection dropped out.");
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: "assistant", text: "Maziwisa! I encountered a temporary processing gap. Let's trace that strategy drill loop again." }
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 antialiased font-sans flex flex-col lg:flex-row">

      {/* Left Control Panel: Staff Framework Selection */}
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-6 space-y-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[#1a5c2a] font-black text-xs uppercase tracking-widest">
            <Shield size={14} />
            <span>Tactical Hub Console</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 mt-1">Coachub Engine</h1>
          <p className="text-xs font-bold text-gray-400 mt-0.5">Zimbabwe Grassroots Framework</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Staff Directives</p>
          {Object.entries(COACHING_STAFF_ROLES).map(([key, role]) => {
            const isSelected = activeRole === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveRole(key); setChatHistory([]); }}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#1a5c2a] border-[#1a5c2a] text-white shadow-xs"
                    : "bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {key === "head_coach" && "🎽"}
                    {key === "tactician" && "📋"}
                    {key === "fitness_trainer" && "🏋️"}
                    {key === "medic" && "🩺"}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide leading-tight">{role.title}</p>
                    <p className={`text-[10px] font-medium leading-none mt-0.5 ${isSelected ? "text-white/80" : "text-gray-400"}`}>{role.focusDepartment}</p>
                  </div>
                </div>
                <ChevronRight size={14} className={isSelected ? "text-white" : "text-gray-400"} />
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Panel Track */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* Dynamic Metric Overview Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Active Roster Size</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">{loadingStats ? "..." : squadStats.total_players}</span>
              <span className="text-xs font-bold text-gray-400">Registered Athletes</span>
            </div>
            <Link href="/coach/squad" className="text-[11px] font-black text-[#1a5c2a] uppercase tracking-wide flex items-center gap-0.5 mt-2 hover:underline">
              Manage Squad <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Medical Bay Isolation</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black ${squadStats.active_injuries > 0 ? "text-red-600" : "text-gray-900"}`}>
                {loadingStats ? "..." : squadStats.active_injuries}
              </span>
              <span className="text-xs font-bold text-gray-400">Players Sidelined</span>
            </div>
            <Link href="/coach/injuries" className="text-[11px] font-black text-[#1a5c2a] uppercase tracking-wide flex items-center gap-0.5 mt-2 hover:underline">
              Track Recovery <ChevronRight size={12} />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest block">Strategic Preparation</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-gray-900">Active</span>
            </div>
            <Link href="/coach/training-plans" className="text-[11px] font-black text-[#1a5c2a] uppercase tracking-wide flex items-center gap-0.5 mt-2 hover:underline">
              Session Outlines <ChevronRight size={12} />
            </Link>
          </div>
        </section>

        {/* THUTO Intelligence Suite Integration */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Framework Context Sheet Descriptions */}
          <div className="lg:col-span-2 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">THUTO Expert System</span>
                <h3 className="text-base font-black text-gray-900">{roleConfig.title} Framework</h3>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-none">Target Execution Vectors</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roleConfig.keyPerformanceIndicators?.map((kpi: string, i: number) => (
                  <span key={i} className="bg-white border border-gray-200 text-gray-700 font-bold text-[10px] px-2.5 py-1 rounded-lg shadow-2xs">
                    🎯 {kpi}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase text-gray-400 tracking-wide">Suggested Diagnostics</p>
              <div className="space-y-1.5">
                {knowledge.sampleQuestions?.slice(0, 3).map((qText: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(qText)}
                    className="w-full text-left p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 transition-all truncate"
                  >
                    💡 &ldquo;{qText}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Dialogue Terminal */}
          <div className="lg:col-span-3 flex flex-col h-[400px] justify-between">

            {/* Thread Canvas */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-thin">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <Bot size={36} className="text-gray-300 mb-2" />
                  <p className="text-xs font-black uppercase tracking-wider text-gray-700">Framework Terminal Online</p>
                  <p className="text-xs font-medium max-w-xs mt-1">
                    Ask me tactical layout metrics, player recovery outlines, or local training drill routines tailored for your squad.
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
                  <div className="w-7 h-7 rounded-lg text-xs font-black bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                    <Loader2 className="animate-spin" size={14} />
                  </div>
                  <div className="bg-gray-50 text-gray-400 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-xs font-bold uppercase tracking-widest animate-pulse">
                    Analyzing Parameters...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Module */}
            <form onSubmit={handleAiQuery} className="flex gap-2 border-t border-gray-100 pt-3 bg-white">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask our ${roleConfig.title} assistant...`}
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
