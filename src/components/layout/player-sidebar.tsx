"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Flame, Camera, TrendingUp, Video, 
  Film, Layers, BarChart2, Users, Settings, LogOut,
  Award, Heart, Share2, Globe, Image as ImageIcon,
  Menu, X, Activity, Mic, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { NotificationBell } from "./notification-bell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/player", label: "Dashboard", icon: LayoutDashboard },
  { href: "/player/success", label: "Success Engine", icon: Flame, badge: "Track goal" },
  { href: "/player/train", label: "AI Training Lab", icon: Camera, badge: "NEW" },
  { href: "/player/progress", label: "My Progress", icon: TrendingUp },
  { href: "/player/showcase", label: "Showcase", icon: Video },
  { href: "/player/vault", label: "Highlight Vault", icon: Film },
  { href: "/player/media", label: "Media Gallery", icon: Layers },
  { href: "/player/stats", label: "Stats", icon: BarChart2 },
  { href: "/arena", label: "Arena Feed", icon: Globe, badge: "Social" },
  { href: "/arena/network", label: "My Network", icon: Users },
  { href: "/worldcup", label: "🏆 World Cup", icon: Award, badge: "Fan" },
  { href: "/player/brand", label: "Brand Studio", icon: Award, badge: "NEW" },
  { href: "/player/story", label: "My Story", icon: Mic, badge: "Tell it" },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function PlayerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="mb-6 px-3 flex items-center justify-between">
        <Link href="/player" className="flex items-center gap-2">
          <img src="/logo_v2.png" alt="Grassroots Sport" width={28} height={28} className="rounded-sm" />
          <div>
            <span className="text-sm font-bold text-primary">Grassroots Sport</span>
            <p className="text-[9px] text-emerald-500 -mt-0.5">Player Hub</p>
          </div>
        </Link>
        {user && <NotificationBell />}
      </div>

      {/* Player Identity Card */}
      <div className="mx-3 mb-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-3 border border-emerald-800/30">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-emerald-600/30 flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-400">
              {user?.name?.[0]?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user?.name || "Player"}</p>
            <p className="text-[9px] text-emerald-400">Right Back • Form: 84</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="text-gray-400">👁️ 23 views this week</span>
          <span className="text-emerald-400">📈 +12%</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
                isActive
                  ? "bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-400">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 pt-4 mt-4 px-2">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
        <p className="mt-4 text-center text-[9px] text-gray-600">
          © 2026 Grassroots Sports<br />Your Brand, Your Future
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950/95 px-2 py-4">
        <NavContent />
      </aside>

      {/* Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3">
        <Link href="/player" className="flex items-center gap-2">
          <img src="/logo_v2.png" alt="Grassroots Sport" width={24} height={24} className="rounded-sm" />
          <span className="text-sm font-bold text-white">Player Hub</span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-400">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col border-r border-gray-800 bg-gray-950 px-2 py-4 transition-transform",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-gray-400">
          <X className="h-5 w-5" />
        </button>
        <NavContent />
      </aside>
    </>
  );
}