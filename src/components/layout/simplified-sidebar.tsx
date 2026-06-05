
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Target, Dumbbell, TrendingUp, IdCard,
  Users, BookOpen, UserSearch, Heart, Settings,
  Activity, Video, Camera, Medal, BarChart3,
  LogOut, Menu, X, FileText, Star, Briefcase
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { FEATURES, roleCanAccess } from "@/config/features";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  feature?: keyof typeof FEATURES;
}

const NAV_ITEMS: NavItem[] = [
  // CORE - Always visible to everyone (if role matches)
  { href: "/", label: "Home", icon: <Home size={18} />, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
  
  // PLAYER / ATHLETE CORE
  { href: "/player/training", label: "AI Training Lab", icon: <Target size={18} />, roles: ["player"], feature: "biometrics" },
  { href: "/athlete/scan", label: "Biometric Scan", icon: <Activity size={18} />, roles: ["athlete"], feature: "biometrics" },
  { href: "/player/drills", label: "My Drills", icon: <Dumbbell size={18} />, roles: ["player"], feature: "drills" },
  { href: "/player/progress", label: "My Progress", icon: <TrendingUp size={18} />, roles: ["player"], feature: "biometrics" },
  { href: "/athlete/vault", label: "My Videos", icon: <Video size={18} />, roles: ["athlete"], feature: "multiSport" },
  { href: "/player/talent-id", label: "Talent Passport", icon: <IdCard size={18} />, roles: ["player", "athlete"], feature: "passport" },
  
  // COACH CORE
  { href: "/coach/squad", label: "My Squad", icon: <Users size={18} />, roles: ["coach"], feature: "coaches" },
  { href: "/coach/hub", label: "Drill Library", icon: <BookOpen size={18} />, roles: ["coach"], feature: "drills" },
  { href: "/coach/talent-id", label: "Talent ID", icon: <Target size={18} />, roles: ["coach"], feature: "coaches" },
  
  // SCOUT CORE
  { href: "/scout/discover", label: "Discover Talent", icon: <UserSearch size={18} />, roles: ["scout"], feature: "scouts" },
  { href: "/scout/reports", label: "Scouting Reports", icon: <FileText size={18} />, roles: ["scout"], feature: "scouts" },
  { href: "/scout/shortlist", label: "My Shortlist", icon: <Star size={18} />, roles: ["scout"], feature: "scouts" },
  
  // FAN CORE
  { href: "/community", label: "Discover Stars", icon: <Medal size={18} />, roles: ["fan"], feature: "fans" },
  { href: "/talent-leaderboard", label: "Leaderboard", icon: <BarChart3 size={18} />, roles: ["fan", "scout", "coach"], feature: "fans" },
  
  // DISABLED FEATURES (hidden when FEATURES flag is false)
  { href: "/arena", label: "The Arena", icon: <Users size={18} />, roles: ["player", "coach", "scout", "fan"], feature: "arena" },
  { href: "/fan-hub", label: "Fan Hub", icon: <Heart size={18} />, roles: ["fan"], feature: "fanHub" },
  { href: "/business-hub", label: "Business Hub", icon: <Briefcase size={18} />, roles: ["player", "coach"], feature: "businessHub" },
  { href: "/analyst", label: "Analyst Hub", icon: <BarChart3 size={18} />, roles: ["analyst"], feature: "analystHub" },
  
  // UTILITIES
  { href: "/settings", label: "Settings", icon: <Settings size={18} />, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
];

export function SimplifiedSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const userRole = user?.role || "fan";
  
  const visibleItems = NAV_ITEMS.filter(item => {
    // Check if user role is allowed
    if (!item.roles.includes(userRole)) return false;
    // Check if feature is enabled (if feature is specified)
    if (item.feature && !FEATURES[item.feature]) return false;
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return (pathname ?? '').startsWith(href);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 h-screen bg-[#1a5c2a] text-white
          flex flex-col transition-transform duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <h1 className="text-lg font-black tracking-tight">
            GrassRoots<span className="text-[#f0b429]">Sports</span>
          </h1>
          <p className="text-[9px] text-white/50 mt-0.5">Identify · Nurture · Market</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive(item.href) 
                    ? "bg-[#f0b429] text-[#1a5c2a]" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
              <span className="text-xs font-bold text-[#f0b429]">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user?.name || "Guest"}</p>
              <p className="text-[9px] text-white/50 capitalize">{user?.role || "Fan"}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}