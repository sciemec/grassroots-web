"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Zap, Activity, BookOpen, Award, Users, TrendingUp, LogOut, Target,
  GraduationCap, Home, Dumbbell, IdCard, Video, Camera, UserSearch, Heart,
  Settings, Menu, X, BarChart3, Medal
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  roles: string[];
}

// 📡 OPERATIONAL BASE PATH MATRIX (NO MOCK RECORDS)
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Arena Dashboard", icon: Home, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
  
  // PLAYER CORE tracks
  { href: "/player/success", label: "Success Engine", icon: Zap, roles: ["player"] },
  { href: "/player/training", label: "AI Training Lab", icon: Activity, roles: ["player"] },
  { href: "/player/drills", label: "Nurture Lab", icon: Dumbbell, roles: ["player"] },
  { href: "/player/passport", label: "Talent Passport", icon: BookOpen, roles: ["player"] },
  { href: "/player/talent-id", label: "Scout Visibility", icon: Award, roles: ["player"] },
  { href: "/player/vault", label: "Highlight Vault", icon: Video, roles: ["player"] },
  
  // MULTI-SPORT ATHLETE PATHWAYS
  { href: "/athlete/scan", label: "Biometric Scan", icon: Activity, roles: ["athlete"] },
  { href: "/athlete/passport", label: "Talent Passport", icon: IdCard, roles: ["athlete"] },
  { href: "/athlete/vault", label: "Video Vault", icon: Video, roles: ["athlete"] },
  
  // COACH CORE TRACKS
  { href: "/coach", label: "Coach Hub", icon: Target, roles: ["coach"] },
  { href: "/coach/squad", label: "Squad Roster", icon: Users, roles: ["coach"] },
  { href: "/coach/live-match", label: "Live Match Tracker", icon: Activity, roles: ["coach"] },
  { href: "/coach/patterns", label: "Strategic Patterns", icon: TrendingUp, roles: ["coach"] },
  { href: "/coach/hub", label: "Drill Library", icon: BookOpen, roles: ["coach"] },
  
  // SCOUT CHANNELS
  { href: "/scout/discover", label: "Discover Talent", icon: UserSearch, roles: ["scout"] },
  { href: "/scout/reports", label: "Scouting Reports", icon: BarChart3, roles: ["scout"] },
  { href: "/scout/shortlist", label: "My Shortlist", icon: Heart, roles: ["scout"] },
  
  // FAN TRACKS
  { href: "/community", label: "Discover Stars", icon: Medal, roles: ["fan"] },
  { href: "/talent-leaderboard", label: "Leaderboard", icon: Award, roles: ["fan", "scout", "coach"] },
  
  // SYSTEM CONFIGURATIONS
  { href: "/settings", label: "Profile Settings", icon: Settings, roles: ["player", "athlete", "coach", "scout", "fan", "admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  if (!hasHydrated || !user) return null;

  const userRole = user.role || "fan";
  
  // Clean filtering checking strictly database user authentication claims
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === href;
    return (pathname ?? '').startsWith(href);
  };

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* 📱 MOBILE NAVIGATION TRIGGER FLOATER */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#e2f0d9] border-2 border-[#1c3d22] text-[#1c3d22] rounded-xl shadow-md cursor-pointer"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* 🌲 HIGH VISIBILITY LIGHT GREENISH-YELLOW SIDEBAR BODY */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 h-screen bg-[#e2f0d9] border-r-2 border-[#f0b429]
          flex flex-col justify-between text-[#1c3d22] select-none
          transition-transform duration-300 ease-in-out shadow-xs
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 space-y-6 flex flex-col min-h-0">
          
          {/* LOGO UNIT */}
          <Link 
            href={userRole === "coach" ? "/coach" : "/player"} 
            className="flex items-center gap-2 group shrink-0"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="bg-[#1c3d22] p-1.5 rounded-lg text-[#f0b429] font-black text-xs">GRS</div>
            <span className="font-black text-sm tracking-wider uppercase text-[#1c3d22] group-hover:text-emerald-800 transition-colors">
              The Arena Hub
            </span>
          </Link>

          {/* TEACH FOR ZIMBABWE BRAND ASSURANCE PANEL */}
          <div className="bg-white border border-[#1c3d22]/10 p-3 rounded-xl flex items-center gap-2 shrink-0 shadow-3xs">
            <GraduationCap size={16} className="text-[#1c3d22] shrink-0" />
            <div className="min-w-0">
              <span className="block text-[8px] font-black uppercase text-emerald-800 tracking-widest leading-none">Strategic Education Partner</span>
              <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tight block truncate mt-0.5">Teach For Zim</span>
            </div>
          </div>

          {/* SCROLLABLE ROUTING MATRIX */}
          <nav className="flex-1 overflow-y-auto space-y-1 pt-2 pr-1 custom-scrollbar">
            <span className="block text-[9px] font-black uppercase tracking-widest text-emerald-900/50 mb-2 px-2">
              Operational Menu
            </span>
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    isActive
                      ? "bg-[#f0b429] text-[#1c3d22] border-[#1c3d22] shadow-xs"
                      : "text-zinc-700 border-transparent hover:bg-white/40 hover:text-[#1c3d22]"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SECURE IDENTITY ACCOUNT CONTAINER */}
        <div className="p-4 border-t border-[#1c3d22]/10 bg-white/30 space-y-2 shrink-0">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full bg-[#1c3d22] text-[#f0b429] font-black text-[10px] flex items-center justify-center uppercase shrink-0">
              {user.name ? user.name.slice(0, 2) : "GR"}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black text-zinc-900 truncate uppercase tracking-wide leading-none">
                {user.name || "Active Session"}
              </p>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mt-0.5 truncate">
                Role: {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-600 hover:text-red-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer mt-2"
          >
            <LogOut size={14} className="shrink-0" />
            <span>Exit Session</span>
          </button>
        </div>
      </aside>

      {/* BACKGROUND MASK FOR SMARTPHONE LAYOUT CLAMPS */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}