"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Zap, 
  Activity, 
  BookOpen, 
  Award, 
  Users, 
  TrendingUp, 
  LogOut, 
  Target,
  GraduationCap
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  // 🎛️ FINALIZED LINEAR NAVIGATIONAL ARRAY
  const playerLinks = [
    { href: "/player/success", label: "Success Engine", icon: Zap },
    { href: "/player/training", label: "AI Training Lab", icon: Activity },
    { href: "/player/passport", label: "Talent Passport", icon: BookOpen },
    { href: "/player/talent-id", label: "Scout Visibility", icon: Award },
  ];

  const coachLinks = [
    { href: "/coach", label: "Coach Hub", icon: Target },
    { href: "/coach/squad", label: "Squad Roster", icon: Users },
    { href: "/coach/live-match", label: "Live Match Tracker", icon: Activity },
    { href: "/coach/patterns", label: "Strategic Patterns", icon: TrendingUp },
  ];

  const activeLinks = user.role === "coach" ? coachLinks : playerLinks;

  const handleLogoutClick = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-[#1c3d22] border-r-2 border-[#f0b429] flex flex-col justify-between h-screen sticky top-0 text-white select-none">
      
      <div className="p-6 space-y-6">
        <Link href={user.role === "coach" ? "/coach" : "/player"} className="flex items-center gap-2 group">
          <div className="bg-[#f0b429] p-1.5 rounded-lg text-[#1c3d22] font-black text-xs">GRS</div>
          <span className="font-black text-sm tracking-wider uppercase group-hover:text-[#f0b429] transition-colors">
            The Arena Hub
          </span>
        </Link>

        {/* TEACH FOR ZIMBABWE BRANDING */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2">
          <GraduationCap size={16} className="text-[#f0b429] shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-black uppercase text-[#f0b429] tracking-widest leading-none">Strategic Education Partner</span>
            <span className="text-[10px] font-bold text-gray-200 uppercase tracking-tight block truncate">Teach For Zim</span>
          </div>
        </div>

        <nav className="space-y-1 pt-2">
          <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 px-2">
            Operational Menu
          </span>
          {activeLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  isActive
                    ? "bg-[#f0b429] text-[#1c3d22] border-[#f0b429] shadow-xs"
                    : "text-gray-300 border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 bg-[#142c18]/40 space-y-2">
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-full bg-[#f0b429] text-[#1c3d22] font-black text-[10px] flex items-center justify-center uppercase">
            {user.name ? user.name.slice(0, 2) : "GR"}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-white truncate uppercase tracking-wide leading-none">
              {user.name || "Active Session"}
            </p>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mt-0.5">
              Role: {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer mt-2"
        >
          <LogOut size={14} />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
}