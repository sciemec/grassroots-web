"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Activity, Dumbbell, ChevronRight,
  Send, Bot, Sparkles, Loader2, Zap, Calendar,
  Trophy, AlertTriangle, Brain, MapPin, ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { COACHING_STAFF_ROLES, getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { loadKnowledgeForRole, type SessionPoint } from "@/lib/coaching-knowledge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com";

const ROLE_EMOJIS: Record<string, string> = {
  head_coach:        "🎽",
  assistant_coach:   "👥",
  attack_coach:      "🔥",
  defence_coach:     "🛡️",
  gk_coach:          "🥅",
  performance_analyst: "📊",
  fitness_coach:     "🏋️",
  team_physio:       "🩺",
  team_manager:      "💼",
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

  const [activeRole,   setActiveRole]    = useState(FOOTBALL_ROLES[0]?.id ?? "head_coach");
  const [query,        setQuery]         = useState("");
  const [chatHistory,  setChatHistory]   = useState<ChatMessage[]>([]);
  const [loadingAi,    setLoadingAi]     = useState(false);
  const [knowledge,    setKnowledge]     = useState<SessionPoint[]>([]);
  const [squadStats,   setSquadStats]    = useState<SquadStats>({ total_players: 0, active_injuries: 0, teamAvgForm: 0, highFatigueCount: 0 });
  const [loadingStats, setLoadingStats]  = useState(true);
  const [squad,        setSquad]         = useState<SquadMember[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") router.replace("/arena");
  }, [hasHydrated, user, router]);

  useEffect(() => {
    const rc = getRoleConfig(activeRole);
    if (!rc) return;
    loadKnowledgeForRole(rc.focusCategories).then(setKnowledge).catch(() => setKnowledge([]));
  }, [activeRole]);

  const loadBiometricData = () => {
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
    setSquadStats(prev => ({ ...prev, teamAvgForm: avgForm, highFatigueCount: highFatigue }));
  };

  useEffect(() => {
    if (!token || !user) return;
    setLoadingStats(true);
    Promise.allSettled([
      fetch(`${API}/api/v1/coach/squad`,    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/v1/coach/injuries`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([squadRes, injuryRes]) => {
      const players  = squadRes.status   === "fulfilled" ? (squadRes.value.data  ?? squadRes.value)  : [];
      const injuries = injuryRes.status === "fulfilled" ? (injuryRes.value.data ?? injuryRes.value) : [];
      setSquadStats(prev => ({
        ...prev,
        total_players:   Array.isArray(players)  ? players.length : 0,
        active_injuries: Array.isArray(injuries) ? injuries.filter((i: { recovered_at: string | null }) => !i.recovered_at).length : 0,
      }));
      loadBiometricData();
      setUpcomingMatches([
        { id: "1", opponent: "Dynamos FC", date: "2026-06-07", venue: "home", competition: "Premier League" },
        { id: "2", opponent: "CAPS United", date: "2026-06-14", venue: "away", competition: "Premier League" },
      ]);
    }).finally(() => setLoadingStats(false));
  }, [token, user]);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chatHistory]);

  const getFormColor = (score: number) => score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const getFatigueDisplay = (fatigue: number) => fatigue > 60 ? { text: "High", color: "text-red-500" } : fatigue > 30 ? { text: "Moderate", color: "text-amber-500" } : { text: "Low", color: "text-emerald-500" };

  if (!hasHydrated || !user) return <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center"><Loader2 className="animate-spin text-[#1a5c2a]" size={24} /></div>;

  const roleConfig: StaffRoleConfig = getRoleConfig(activeRole) ?? FOOTBALL_ROLES[0];

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
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setChatHistory(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", text: json.answer ?? "Response received." }]);
    } catch {
      setChatHistory(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", text: "Processing gap. Re-tracing drill loop." }]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 antialiased font-sans flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-6 space-y-6 shrink-0 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-[#1a5c2a] font-black text-xs uppercase tracking-widest"><Shield size={14} /> <span>Tactical Hub Console</span></div>
          <h1 className="text-xl font-black text-gray-900 mt-1">CoachHub Engine</h1>
        </div>
        
        {/* Biometric Stats */}
        {squadStats.teamAvgForm !== undefined && (
          <div className="space-y-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Team Biometrics</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center"><p className="text-lg font-black text-[#1a5c2a]">{squadStats.teamAvgForm}</p><p className="text-[8px] text-gray-500">Avg Form</p></div>
              <div className="text-center"><p className="text-lg font-black text-amber-600">{squadStats.highFatigueCount || 0}</p><p className="text-[8px] text-gray-500">High Fatigue</p></div>
            </div>
          </div>
        )}

        {/* Roles */}
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Staff Role</p>
          {FOOTBALL_ROLES.map((role) => (
            <button key={role.id} onClick={() => setActiveRole(role.id)} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all border ${activeRole === role.id ? "bg-[#1a5c2a] border-[#1a5c2a] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">{ROLE_EMOJIS[role.id] ?? "👤"}</div>
              <p className="text-xs font-black uppercase tracking-wide">{role.title}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/coach/squad" className="bg-white border p-5 rounded-3xl shadow-2xs">
            <Users size={20} className="text-blue-600 mb-3" />
            <h3 className="text-xs font-black uppercase">Squad Roster</h3>
            <p className="text-[11px] text-gray-500 mt-1">Manage talent pipeline & profiles.</p>
          </Link>
          <Link href="/coach/live-match" className="bg-white border p-5 rounded-3xl shadow-2xs">
            <Activity size={20} className="text-emerald-600 mb-3" />
            <h3 className="text-xs font-black uppercase">Live Match Tracker</h3>
            <p className="text-[11px] text-gray-500 mt-1">Log raw pitch actions & trials.</p>
          </Link>
          <Link href="/player/drills" className="bg-white border p-5 rounded-3xl shadow-2xs">
            <Dumbbell size={20} className="text-purple-600 mb-3" />
            <h3 className="text-xs font-black uppercase">Nurture Lab</h3>
            <p className="text-[11px] text-gray-500 mt-1">Access position-specific drills.</p>
          </Link>
        </section>

        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                <div className={`p-3 rounded-2xl text-xs font-medium max-w-[80%] ${msg.role === "user" ? "bg-[#1a5c2a] text-white" : "bg-gray-100 text-gray-800"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleAiQuery} className="flex gap-2 border-t pt-3">
            <input className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-xs" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask tactical assistant..." />
            <button className="bg-[#1a5c2a] text-white px-4 rounded-xl" disabled={loadingAi}><Send size={16} /></button>
          </form>
        </section>
      </main>
    </div>
  );
}
```[cite: 1]

Once you have replaced the file content, remember to trigger the final production build in your terminal to ensure all these updates synchronize with your live environment:[cite: 1]

```powershell
npx vercel --prod --force
```[cite: 1]