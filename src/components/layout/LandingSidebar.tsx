// src/components/layout/LandingSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, UserCircle, Users, Target, Heart, Trophy, 
  Settings, LogOut, Menu, X, Shield, Globe, ArrowLeft,
  Dumbbell, Activity, Calendar, BookOpen, Zap, Camera,
  MessageCircle, Bell, Star, Award, Briefcase, GraduationCap
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const HUB_SECTIONS = [
  {
    title: "🏠 MAIN",
    items: [
      { href: "/", label: "Back to Home", icon: <ArrowLeft size={18} />, description: "Return to landing page" },
    ]
  },
  {
    title: "👥 USER HUBS",
    items: [
      { href: "/player", label: "Player Hub", icon: <UserCircle size={18} />, description: "Training, drills, talent passport", badge: "Personal" },
      { href: "/coach", label: "Coach Hub", icon: <Users size={18} />, description: "Squad management, drills", badge: "Team" },
      { href: "/scout", label: "Scout Hub", icon: <Target size={18} />, description: "Discover talent, reports", badge: "Discovery" },
      { href: "/athlete", label: "Athlete Hub", icon: <Activity size={18} />, description: "Multi-sport athletes", badge: "Multi" },
      { href: "/fan-hub", label: "Fan Hub", icon: <Heart size={18} />, description: "Follow talent, World Cup", badge: "Community" },
    ]
  },
  {
    title: "⚽ WORLD CUP",
    items: [
      { href: "/world-cup", label: "World Cup Live", icon: <Trophy size={18} />, description: "Live matches & commentary", badge: "LIVE" },
      { href: "/world-cup?tab=highlights", label: "Match Highlights", icon: <Camera size={18} />, description: "All match highlights" },
    ]
  },
  {
    title: "🌐 COMMUNITY",
    items: [
      { href: "/arena", label: "The Arena", icon: <Globe size={18} />, description: "Social feed" },
      { href: "/community", label: "Community", icon: <Users size={18} />, description: "Fan community" },
    ]
  },
  {
    title: "📚 ACADEMY",
    items: [
      { href: "/player/drills", label: "Drill Library", icon: <Dumbbell size={18} />, description: "Training drills" },
      { href: "/coach/training-plans", label: "Training Plans", icon: <Calendar size={18} />, description: "Session plans" },
      { href: "/video-studio", label: "Video Studio", icon: <Camera size={18} />, description: "Upload & analyze" },
    ]
  },
  {
    title: "⚙️ ACCOUNT",
    items: [
      { href: "/settings", label: "Settings", icon: <Settings size={18} />, description: "Account settings" },
    ]
  },
];

export function LandingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    setIsOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname?.startsWith(href) ?? false;
  };

  // Get badge color based on badge text
  const getBadgeColor = (badge?: string) => {
    if (badge === "LIVE") return "bg-red-500 text-white animate-pulse";
    if (badge === "Personal") return "bg-blue-500/20 text-blue-300";
    if (badge === "Team") return "bg-green-500/20 text-green-300";
    if (badge === "Discovery") return "bg-purple-500/20 text-purple-300";
    if (badge === "Multi") return "bg-orange-500/20 text-orange-300";
    if (badge === "Community") return "bg-pink-500/20 text-pink-300";
    return "bg-white/10 text-white/50";
  };

  return (
    <>
      {/* Toggle Button - Floating on left edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 left-0 -translate-y-1/2 z-50 p-2 bg-[#1a5c2a] text-white rounded-r-xl shadow-lg hover:bg-[#2a6e3a] transition-all group"
        aria-label="Toggle navigation"
      >
        <Menu size={20} className="group-hover:scale-110 transition-transform" />
        <span className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Quick Navigation
        </span>
      </button>

      {/* Sidebar Overlay */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          w-80 h-screen bg-[#1a5c2a] text-white
          flex flex-col transition-transform duration-300 ease-in-out
          shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 shrink-0 bg-[#1a5c2a]">
          <div className="flex items-center justify-between">
            <Link href="/" className="block" onClick={() => setIsOpen(false)}>
              <h1 className="text-xl font-black tracking-tight">
                Grass<span className="text-[#f0b429]">Roots</span> Sports
              </h1>
              <p className="text-[9px] text-white/40 mt-0.5 tracking-wider">
                Identify · Nurture · Market
              </p>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User Info (if logged in) */}
        {user && (
          <div className="p-4 border-b border-white/10 shrink-0 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#f0b429]">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name || "User"}</p>
                <p className="text-[10px] text-white/50 capitalize">{user.role || "guest"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4">
          {HUB_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            return (
              <div key={section.title} className="mb-4">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white/50 hover:text-white/80 transition-colors"
                >
                  <span>{section.title}</span>
                  <span className="text-xs">{isCollapsed ? "▶" : "▼"}</span>
                </button>
                
                {!isCollapsed && (
                  <div className="space-y-1 px-3">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200
                          ${isActive(item.href) 
                            ? "bg-[#f0b429] text-[#1a5c2a]" 
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                          }
                        `}
                      >
                        {item.icon}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${getBadgeColor(item.badge)}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] opacity-60 group-hover:opacity-100 transition-opacity">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 space-y-3 bg-[#1a5c2a]">
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[#f0b429] text-[#1a5c2a] hover:bg-[#d6a020] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-[7px] text-white/20">
              © 2026 GrassRoots Sports
            </p>
            <p className="text-[7px] text-white/20 mt-0.5">
              Identify · Nurture · Market
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}