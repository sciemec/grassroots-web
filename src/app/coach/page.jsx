"use client";

import { useState, useEffect } from "react";
import {
  Shield, Users, Flame, ShieldAlert, Target, Activity,
  Dumbbell, HeartPulse, Briefcase, BookOpen, Tag, ChevronRight,
} from "lucide-react";
import { COACHING_STAFF_ROLES, type StaffRoleConfig } from "@/config/coaching-staff";
import { loadKnowledgeForRole, type SessionPoint } from "@/lib/coaching-knowledge";
import { useAuthStore } from "@/lib/auth-store";

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Users, Flame, ShieldAlert, Target,
  Activity, Dumbbell, HeartPulse, Briefcase,
};

const ROLE_COLORS: Record<string, { bar: string; icon: string; text: string }> = {
  head_coach:          { bar: "#2E7D32", icon: "bg-green-100 text-green-800",  text: "text-green-700" },
  assistant_coach:     { bar: "#0F6E56", icon: "bg-teal-100 text-teal-800",    text: "text-teal-700" },
  attack_coach:        { bar: "#E65100", icon: "bg-amber-100 text-amber-800",  text: "text-amber-700" },
  defence_coach:       { bar: "#1565C0", icon: "bg-blue-100 text-blue-800",    text: "text-blue-700" },
  gk_coach:            { bar: "#6A1B9A", icon: "bg-purple-100 text-purple-800",text: "text-purple-700" },
  performance_analyst: { bar: "#0F6E56", icon: "bg-cyan-100 text-cyan-800",    text: "text-cyan-700" },
  fitness_coach:       { bar: "#E65100", icon: "bg-orange-100 text-orange-800",text: "text-orange-700" },
  team_physio:         { bar: "#B71C1C", icon: "bg-red-100 text-red-800",      text: "text-red-700" },
  team_manager:        { bar: "#37474F", icon: "bg-slate-100 text-slate-700",  text: "text-slate-600" },
};

export default function CoachHub() {
  const user = useAuthStore(s => s.user);
  const staff = COACHING_STAFF_ROLES.football;

  const [selectedId, setSelectedId] = useState<string>(staff[0].id);
  const [knowledge, setKnowledge] = useState<Record<string, SessionPoint[]>>({});
  const [loading, setLoading] = useState(true);

  const selected = staff.find(s => s.id === selectedId)!;
  const colors = ROLE_COLORS[selectedId] ?? ROLE_COLORS.head_coach;
  const Icon = ICON_MAP[selected.icon] ?? Shield;

  useEffect(() => {
    const loadAll = async () => {
      const entries = await Promise.all(
        staff.map(async s => [
          s.id,
          await loadKnowledgeForRole(s.focusCategories),
        ] as const)
      );
      setKnowledge(Object.fromEntries(entries));
      setLoading(false);
    };
    loadAll();
  }, []);

  const selectedSessions = knowledge[selectedId] ?? [];

  return (
    <div className="min-h-screen bg-[#f8faf8] p-4 md:p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Coaching staff</h1>
        <p className="text-sm text-gray-500 mt-1">
          Session intelligence from your training library
        </p>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        {staff.map(s => {
          const c = ROLE_COLORS[s.id] ?? ROLE_COLORS.head_coach;
          const I = ICON_MAP[s.icon] ?? Shield;
          const isSel = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`text-left bg-white rounded-xl border transition-all overflow-hidden group ${
                isSel
                  ? "border-gray-300 shadow-sm ring-1 ring-gray-200"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {/* Top accent bar */}
              <div className="h-[3px]" style={{ background: c.bar }} />
              <div className="p-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${c.icon}`}>
                  <I size={15} />
                </div>
                <div className="text-xs font-medium text-gray-900 leading-tight mb-1">
                  {s.title}
                </div>
                <div className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                  {s.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Knowledge panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="flex items-start gap-4 p-5 border-b border-gray-100">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-gray-900">{selected.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              {selected.description}
            </p>
          </div>
          {/* Focus chips */}
          <div className="hidden md:flex flex-wrap gap-1.5 max-w-xs">
            {selected.focusCategories.map(cat => (
              <span key={cat} className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-500">
                {cat.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Session intelligence */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            <BookOpen size={13} />
            Session intelligence
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-gray-50 rounded-lg h-24 animate-pulse" />
              ))}
            </div>
          ) : selectedSessions.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              No matching sessions in the training library yet for this role.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((sess, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-4"
                  style={{ borderLeft: `2.5px solid ${colors.bar}` }}
                >
                  <div
                    className={`text-[11px] font-medium mb-3 flex items-center gap-1.5 ${colors.text}`}
                  >
                    <ChevronRight size={11} />
                    {sess.source}
                  </div>
                  <ul className="space-y-2">
                    {sess.points.map((pt, j) => (
                      <li key={j} className="text-sm text-gray-700 leading-relaxed pl-3 border-l border-gray-200">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Mobile focus chips */}
          <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">
              <Tag size={13} />
              Focus areas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.focusCategories.map(cat => (
                <span key={cat} className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-500">
                  {cat.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}