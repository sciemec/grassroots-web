"use client";

import { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { COACHING_STAFF_ROLES, type StaffRoleConfig } from "@/config/coaching-staff";

// Safe Dynamic Lucide Icon Mapper Component - Resolves Error #130
function DynamicStaffIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.User className={className} />; // Generic fallback if icon string is missing
  return <IconComponent className={className} size={20} />;
}

export default function DynamicCoachHubPage() {
  const user = useAuthStore((state) => state.user);
  const [selectedSport, setSelectedSport] = useState<string>("football");

  // Fetch roles dynamically according to active sport token key tracking fallback
  const activeRoles = COACHING_STAFF_ROLES[selectedSport] || COACHING_STAFF_ROLES.football;

  return (
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        
        {/* Institutional Branding Greeting Header Box */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">
              Technical Department — Management Panel
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              Coach {user?.name?.split(" ")[0] ?? "Manager"} Hub 👋
            </h1>
            <p className="mt-1 text-sm font-medium italic text-[#1a5c2a]">
              Active Role Matrix Optimization Core
            </p>
          </div>

          {/* High Visibility Dynamic Sport Configuration Switcher */}
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 shrink-0 self-start sm:self-center shadow-inner">
            {Object.keys(COACHING_STAFF_ROLES).map((sportKey) => (
              <button
                key={sportKey}
                type="button"
                onClick={() => setSelectedSport(sportKey)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  selectedSport === sportKey
                    ? "bg-[#1a5c2a] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {sportKey}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats Bar Panel Area */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-[#f0b429] text-[#1c3d22] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-85">Departments Mapped</p>
              <h3 className="text-2xl font-black mt-1">{activeRoles.length} Departments</h3>
            </div>
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Icons.ShieldAlert size={20} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Discipline</p>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-wide mt-1.5">{selectedSport} Tracking</h3>
            </div>
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-700">
              <Icons.Trophy size={20} />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Regional Registry</p>
              <h3 className="text-sm font-black text-gray-900 mt-2 truncate">NASH / ZIFA Standard Compliant</h3>
            </div>
            <div className="bg-emerald-50 text-[#1a5c2a] p-2.5 rounded-xl border border-emerald-100">
              <Icons.Layers size={20} />
            </div>
          </div>
        </div>

        {/* Matrix Deployment Card Grid */}
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500 pl-1">
          Technical Staff Matrix Roles
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeRoles.map((role) => (
            <div 
              key={role.id}
              className="h-full rounded-2xl border border-gray-200 p-5 bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#1a5c2a]"
            >
              <div>
                {/* Department Icon Box wrapper using Forest Green design standard */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white bg-[#1a5c2a] shadow-xs">
                  <DynamicStaffIcon name={role.icon} />
                </div>

                {/* Role Title Text Layer */}
                <h3 className="text-base font-bold text-gray-900">
                  {role.title}
                </h3>
                
                {/* Role Operational Description Layer */}
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed font-medium">
                  {role.description}
                </p>
              </div>

              {/* Focus Tags Tracking Panel Component Area */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">
                  Drill Targeting Categories
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {role.focusCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/player/drills?category=${cat}`}
                      className="rounded-lg bg-gray-100 border border-gray-200/60 px-2 py-1 text-[10px] font-bold text-gray-700 capitalize transition-colors hover:bg-[#f0b429] hover:text-[#1c3d22] hover:border-[#f0b429]"
                    >
                      {cat.replace(/_/g, " ")}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Support Banner Notice */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c8962a] shrink-0">
            <Icons.Sparkles size={16} className="animate-pulse" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Click any dynamic target filter tag inside a coaching panel card department to launch pre-filtered workout tracks in the Player Drill Hub matching active tactical focus scopes automatically.
          </p>
        </div>

      </main>
    </div>
  );
}