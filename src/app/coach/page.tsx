"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, Users, Activity, Dumbbell, ChevronRight, 
  Send, Bot, Sparkles, Loader2, Zap, Calendar 
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { COACHING_STAFF_ROLES, getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { loadKnowledgeForRole, type SessionPoint } from "@/lib/coaching-knowledge";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const ROLE_EMOJIS: Record<string, string> = {
  head_coach: "🎽",
  assistant_coach: "👥",
  attack_coach: "🔥",
  defence_coach: "🛡️",
  gk_coach: "🥅",
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

const FOOTBALL_ROLES = COACHING_STAFF_ROLES.football ?? [];

export default function CoachHubPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [activeRole, setActiveRole] = useState(FOOTBALL_ROLES[0]?.id ?? "head_coach");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [knowledge, setKnowledge] = useState<SessionPoint[]>([]);
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

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chatHistory]);

  if (!hasHydrated || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size="{24}"/></div>;

  const roleConfig: StaffRoleConfig = getRoleConfig(activeRole) ?? FOOTBALL_ROLES[0];

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loadingAi) return;
    const userMsg: ChatMessage = { id: String(Date.now()), role: "user", text: query.trim() };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery("");
    setLoadingAi(true);
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: userMsg.text, role: roleConfig.id, language: "en" }),
      });
      const json = await res.json();
      setChatHistory(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", text: json.answer ?? "Response received." }]);
    } catch {
      setChatHistory(prev => [...prev, { id: String(Date.now() + 1), role: "assistant", text: "Processing gap." }]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans flex">
      <main className="flex-1 p-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link className="bg-white border p-5 rounded-3xl shadow-2xs" href="/coach/squad">
            <Users className="text-blue-600 mb-3" size={20}/>
            <h3 className="text-xs font-black uppercase">Squad Roster</h3>
          </Link>
          <Link className="bg-white border p-5 rounded-3xl shadow-2xs" href="/coach/live-match">
            <Activity className="text-emerald-600 mb-3" size={20}/>
            <h3 className="text-xs font-black uppercase">Live Match Tracker</h3>
          </Link>
          <Link className="bg-white border p-5 rounded-3xl shadow-2xs" href="/player/drills">
            <Dumbbell className="text-purple-600 mb-3" size={20}/>
            <h3 className="text-xs font-black uppercase">Nurture Lab</h3>
          </Link>
        </section>
        
        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatHistory.map(msg => (
              <div key={msg.id} className={`p-3 rounded-xl text-xs ${msg.role === "user" ? "bg-[#1a5c2a] text-white ml-auto" : "bg-gray-100"}`}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleAiQuery} className="flex gap-2 border-t pt-3">
            <input className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-xs" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask tactical assistant..." />
            <button className="bg-[#1a5c2a] text-white px-4 rounded-xl" disabled={loadingAi}><Send size={16}/></button>
          </form>
        </section>
      </main>
    </div>
  );
}