// src/components/layout/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, Target, Dumbbell, TrendingUp, IdCard, 
  Users, BookOpen, UserSearch, Heart, Settings,
  Activity, Video, Camera, Award, LogOut, Menu, X,
  BarChart3, Medal, Globe, Trophy, Calendar, Zap,
  MessageCircle, Bell, Star, UserCheck, Shield
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// FEATURE FLAGS - Set to false to hide features temporarily
const FEATURES = {
  // CORE - Always on
  biometrics: true,
  drills: true,
  passport: true,
  
  // Extended features (disabled for now)
  arena: true,        // Arena social network - ENABLED
  worldCup: true,     // World Cup feature - ENABLED
  
  // Player extras (disabled for focus)
  successEngine: false,
  nutrition: false,
  trainingPlan: false,
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
  feature?: keyof typeof FEATURES;
}

const NAV_ITEMS: NavItem[] = [
  // CORE - Everyone
  { href: "/", label: "Home", icon: <Home size={18} />, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
  
  // PLAYER CORE
  { href: "/player/training", label: "AI Training Lab", icon: <Target size={18} />, roles: ["player"], feature: "biometrics" },
  { href: "/player/drills", label: "My Drills", icon: <Dumbbell size={18} />, roles: ["player"], feature: "drills" },
  { href: "/player/progress", label: "My Progress", icon: <TrendingUp size={18} />, roles: ["player"], feature: "biometrics" },
  { href: "/player/talent-id", label: "Talent Passport", icon: <IdCard size={18} />, roles: ["player"], feature: "passport" },
  { href: "/player/vault", label: "Highlight Vault", icon: <Video size={18} />, roles: ["player"], feature: "passport" },
  { href: "/player/media", label: "Media Gallery", icon: <Camera size={18} />, roles: ["player"], feature: "passport" },
  
  // ATHLETE CORE (Multi-sport)
  { href: "/athlete/scan", label: "Biometric Scan", icon: <Activity size={18} />, roles: ["athlete"], feature: "biometrics" },
  { href: "/athlete/vault", label: "Video Vault", icon: <Video size={18} />, roles: ["athlete"], feature: "passport" },
  { href: "/athlete/passport", label: "Talent Passport", icon: <IdCard size={18} />, roles: ["athlete"], feature: "passport" },
  
  // COACH CORE
  { href: "/coach/squad", label: "My Squad", icon: <Users size={18} />, roles: ["coach"], feature: "drills" },
  { href: "/coach/hub", label: "Coach Hub", icon: <BookOpen size={18} />, roles: ["coach"], feature: "drills" },
  { href: "/coach/talent-id", label: "Talent ID", icon: <Target size={18} />, roles: ["coach"], feature: "biometrics" },
  
  // SCOUT CORE
  { href: "/scout/discover", label: "Discover Talent", icon: <UserSearch size={18} />, roles: ["scout"], feature: "passport" },
  { href: "/scout/reports", label: "Scouting Reports", icon: <BarChart3 size={18} />, roles: ["scout"], feature: "passport" },
  { href: "/scout/shortlist", label: "My Shortlist", icon: <Heart size={18} />, roles: ["scout"], feature: "passport" },
  
  // FAN CORE
  { href: "/community", label: "Discover Stars", icon: <Medal size={18} />, roles: ["fan"], feature: "passport" },
  { href: "/talent-leaderboard", label: "Leaderboard", icon: <Award size={18} />, roles: ["fan", "scout", "coach"], feature: "passport" },
  
  // ARENA SOCIAL NETWORK
  { href: "/arena", label: "The Arena", icon: <Globe size={18} />, roles: ["player", "athlete", "coach", "scout", "fan"], feature: "arena" },
  
  // WORLD CUP
  { href: "/world-cup", label: "World Cup", icon: <Trophy size={18} />, roles: ["player", "athlete", "coach", "scout", "fan"], feature: "worldCup" },
  
  // DISABLED FEATURES (hidden when FEATURES flag is false)
  { href: "/fan-hub", label: "Fan Hub", icon: <Heart size={18} />, roles: ["fan"], feature: "fanHub" },
  { href: "/business-hub", label: "Business Hub", icon: <Briefcase size={18} />, roles: ["player", "coach"], feature: "businessHub" },
  
  // UTILITIES
  { href: "/settings", label: "Settings", icon: <Settings size={18} />, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
];

// Helper to check if a feature is enabled
const isFeatureEnabled = (feature?: keyof typeof FEATURES): boolean => {
  if (!feature) return true;
  return FEATURES[feature] === true;
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (!hasHydrated) {
    return null;
  }

  const userRole = user?.role || "fan";
  
  const visibleItems = NAV_ITEMS.filter(item => {
    // Check if user role is allowed
    if (!item.roles.includes(userRole)) return false;
    // Check if feature is enabled
    if (!isFeatureEnabled(item.feature)) return false;
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-72 h-screen bg-[#1a5c2a] text-white
          flex flex-col transition-transform duration-300 ease-in-out
          shadow-xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo / Brand */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="block" onClick={() => setIsMobileOpen(false)}>
            <h1 className="text-xl font-black tracking-tight">
              Grass<span className="text-[#f0b429]">Roots</span> Sports
            </h1>
            <p className="text-[9px] text-white/40 mt-0.5 tracking-wider">
              Identify · Nurture · Market
            </p>
          </Link>
        </div>

        {/* User Info (mobile only) */}
        {user && (
          <div className="lg:hidden p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#f0b429]">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {user && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
          
          {/* Feature indicators */}
          <div className="flex justify-center gap-3 pt-2">
            {FEATURES.arena && (
              <span className="text-[6px] text-white/30 uppercase tracking-wider">Arena Active</span>
            )}
            {FEATURES.worldCup && (
              <span className="text-[6px] text-white/30 uppercase tracking-wider">World Cup</span>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-[8px] text-white/30">
              © 2026 GrassRoots Sports
            </p>
            <p className="text-[8px] text-white/20 mt-0.5">
              Identify · Nurture · Market
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}