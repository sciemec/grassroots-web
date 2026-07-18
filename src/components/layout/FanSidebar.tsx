// src/components/layout/FanSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Star, Heart, Trophy, Users, Radio, Video,
  Globe, Briefcase, Building2, User, Settings, LogOut,
  Menu, X, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const NAV_ITEMS = [
  // ── Hub ───────────────────────────────────────────────────────────────────
  { href: '/fan',                  label: 'Fan Hub',          icon: <Home size={18} />,       exact: true },

  // ── Discovery & Players ───────────────────────────────────────────────────
  { href: '/fan/discover',         label: 'Discover Talent',  icon: <Star size={18} /> },
  { href: '/fan/following',        label: 'Following',        icon: <Heart size={18} /> },
  { href: '/fan/leaderboard',      label: 'Leaderboard',      icon: <Trophy size={18} /> },
  { href: '/talent-leaderboard',   label: 'Rising Stars',     icon: <Users size={18} /> },

  // ── Live & Matches ────────────────────────────────────────────────────────
  { href: '/fan/live-commentary',  label: 'Live Commentary',  icon: <Radio size={18} /> },
  { href: '/streaming',            label: 'Live Matches',     icon: <Video size={18} /> },
  { href: '/world-cup',            label: 'World Cup',        icon: <Trophy size={18} /> },

  // ── Community ─────────────────────────────────────────────────────────────
  { href: '/arena',                label: 'The Arena',        icon: <Globe size={18} /> },
  { href: '/arena/recruitment',    label: 'Talent Board',     icon: <Briefcase size={18} /> },
  { href: '/arena/clubs',          label: 'Schools & Clubs',  icon: <Building2 size={18} /> },

  // ── Account ───────────────────────────────────────────────────────────────
  { href: '/fan/profile',          label: 'My Profile',       icon: <User size={18} /> },
  { href: '/fan/notifications',    label: 'Notifications',    icon: <Bell size={18} /> },
  { href: '/settings',             label: 'Settings',         icon: <Settings size={18} /> },
];

export function FanSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href) ?? false;
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
        aria-label="Open navigation menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 w-72 h-screen bg-[#1a5c2a] text-white flex flex-col transition-transform duration-300 shadow-xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/fan" className="block" onClick={() => setIsMobileOpen(false)}>
            <h1 className="text-xl font-black tracking-tight">
              Grass<span className="text-[#f0b429]">Roots</span> Sports
            </h1>
            <p className="text-[9px] text-white/40 mt-0.5">Fan Hub</p>
          </Link>
        </div>

        {user && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0b429]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#f0b429]">{user.name?.charAt(0) ?? 'F'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50">Fan</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive(item.href, item.exact) ? 'bg-[#f0b429] text-[#1a5c2a]' : 'text-white/80 hover:bg-white/10'}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}
