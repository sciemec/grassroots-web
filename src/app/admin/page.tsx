"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Users, 
  Shield, // ✅ FIXED: Changed ShieldCheck to Shield to prevent undefined runtime crash
  Search, 
  CreditCard, 
  BarChart3, 
  Megaphone, 
  Globe, 
  Download,
  Lock
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  // STRICTLY PRESERVED: Keeping your exact original features list array layout
  const adminTools = [
    {
      icon: Users,
      title: "Users",
      subtitle: "Manage all users",
      href: "/admin/users",
      color: "bg-blue-500",
    },
    {
      icon: Shield, // ✅ FIXED: Bound to safe icon asset definition mapping
      title: "Verifications",
      subtitle: "Document verifications",
      href: "/admin/verifications",
      color: "bg-emerald-500",
    },
    {
      icon: Search,
      title: "Scout Requests",
      subtitle: "Contact approvals",
      href: "/admin/scout-requests",
      color: "bg-purple-500",
    },
    {
      icon: CreditCard,
      title: "Subscriptions",
      subtitle: "Billing & plans",
      href: "/admin/subscriptions",
      color: "bg-orange-500",
    },
    {
      icon: BarChart3,
      title: "Platform Stats",
      subtitle: "System analytics",
      href: "/admin/stats",
      color: "bg-red-500",
    },
    {
      icon: Megaphone,
      title: "Announcements",
      subtitle: "Platform notices",
      href: "/admin/announcements",
      color: "bg-teal-500",
    },
    {
      icon: Globe,
      title: "Netball info page",
      subtitle: "Manage localized configurations",
      href: "/admin/netball-info",
      color: "bg-indigo-500",
    },
    {
      icon: Download,
      title: "PWA Installs",
      subtitle: "App install tracker",
      href: "/admin/pwa-installs",
      color: "bg-green-600",
    },
  ];

  return (
    // CANVAS BACKGROUND: Set to crisp standard light framework
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6">
        
        {/* TOP PANEL: Shifted to your premium high-visibility Yellow/Gold brand standard for ultimate pop */}
        <div className="bg-[#f0b429] text-[#1c3d22] rounded-2xl p-6 mb-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest opacity-90">
            Admin Portal — Control Center
          </p>
          <h1 className="mt-1 text-2xl font-black">
            Ongorora — Platform management & oversight 👋
          </h1>
          <p className="mt-1 text-sm font-bold opacity-80 italic">
            Root System Access — Critical Infrastructure Scope
          </p>
        </div>

        {/* SECTION LABEL: Explicit charcoal gray for bulletproof contrast */}
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-gray-600 pl-1">
          Admin Tools Menu
        </p>

        {/* LAYOUT GRID: Preserving your exact original spatial component structural framework layout */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminTools.map((tool) => {
            const IconComponent = tool.icon;
            
            return (
              <Link 
                key={tool.title} 
                href={tool.href}
                className="group h-full rounded-2xl border border-gray-200 p-5 bg-white shadow-sm transition-all flex items-center gap-4 hover:scale-[1.01] hover:shadow-md hover:border-gray-400"
              >
                {/* Brand Utility Color Icon Square Block */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${tool.color}`}>
                  <IconComponent size={22} />
                </div>
                
                <div className="min-w-0 flex-1">
                  {/* TITLE: Hardcoded to deep charcoal black font to stop wash-outs */}
                  <p className="text-base font-black text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                    {tool.title}
                  </p>
                  
                  {/* SUBTITLE: Highly legible standard medium slate utility text color */}
                  <p className="mt-0.5 text-xs text-gray-600 font-semibold truncate">
                    {tool.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* FOOTER METRIC NOTE BAR */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            All system-wide configurations are running live in master deployment parameters.
          </p>
        </div>

      </main>
    </div>
  );
}