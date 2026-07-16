// src/components/layout/CoachSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Users, Target, TrendingUp, TrendingDown, Calendar, BarChart3,
  Activity, Zap, Trophy, Globe, LogOut, Menu, X, BookOpen,
  Flame, UserSearch, Shield, Flag, Video, Brain, Dumbbell,
  Award, Swords, Bell, Crosshair
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

const NAV_ITEMS = [
  // ── Hub ──────────────────────────────────────────────────────────────────
  { href: '/coach',                      label: 'Dashboard',          icon: <Home size={18} />,        exact: true },

  // ── Squad & Players ───────────────────────────────────────────────────────
  { href: '/coach/squad',                label: 'My Squad',           icon: <Users size={18} /> },
  { href: '/coach/talent-id',            label: 'Talent ID',          icon: <UserSearch size={18} /> },
  { href: '/coach/recruitment',          label: 'Recruitment',        icon: <Shield size={18} /> },
  { href: '/coach/scouting',             label: 'Scouting',           icon: <UserSearch size={18} /> },
  { href: '/coach/technical-staff',      label: 'Technical Staff',    icon: <Users size={18} /> },

  // ── Match & Tactics ───────────────────────────────────────────────────────
  { href: '/coach/live-match',           label: 'Live Match',         icon: <Activity size={18} /> },
  { href: '/coach/matches',              label: 'Matches',            icon: <Calendar size={18} /> },
  { href: '/coach/tactics',              label: 'Tactics',            icon: <Target size={18} /> },
  { href: '/coach/tactics/simulator',    label: 'Tactics Simulator',  icon: <Brain size={18} /> },
  { href: '/coach/tactical-analysis',    label: 'Tactical Analysis',  icon: <Swords size={18} /> },
  { href: '/coach/set-pieces',           label: 'Set Pieces',         icon: <Flame size={18} /> },
  { href: '/coach/set-piece-lab',        label: 'Set Piece Lab',      icon: <Flag size={18} /> },
  { href: '/coach/patterns',             label: 'Strategic Patterns', icon: <TrendingUp size={18} /> },

  // ── Training ──────────────────────────────────────────────────────────────
  { href: '/coach/training-plans',       label: 'Training Plans',     icon: <Calendar size={18} /> },
  { href: '/coach/drills',               label: 'Drills Library',     icon: <Dumbbell size={18} /> },
  { href: '/coach/drill-analysis',       label: 'Drill Analysis',     icon: <Video size={18} /> },
  { href: '/coach/session-library',      label: 'Session Library',    icon: <BookOpen size={18} /> },

  // ── Performance & Health ──────────────────────────────────────────────────
  { href: '/coach/chemistry',            label: 'Squad Chemistry',    icon: <Zap size={18} /> },
  { href: '/coach/biometrics',           label: 'Biometrics',         icon: <BarChart3 size={18} /> },
  { href: '/coach/injury-hub',           label: 'Injury Hub',         icon: <Activity size={18} /> },
  { href: '/coach/fatigue',              label: 'Fatigue Monitor',    icon: <TrendingDown size={18} /> },
  { href: '/coach/stats',                label: 'Team Stats',         icon: <BarChart3 size={18} /> },
  { href: '/coach/success',              label: 'Success Tracker',    icon: <Award size={18} /> },

  // ── Analyst Tools ─────────────────────────────────────────────────────────
  { href: '/analyst',                    label: 'Analyst Hub',        icon: <BarChart3 size={18} /> },
  { href: '/analyst/live-match',         label: 'Live Collector',     icon: <Flame size={18} /> },
  { href: '/analyst/team-biomechanics',  label: 'Team Biomechanics',  icon: <Zap size={18} /> },
  { href: '/analyst/match-eye',          label: 'Match Eye',          icon: <Video size={18} /> },
  { href: '/analyst/xg-analysis',        label: 'xG Analysis',        icon: <Target size={18} /> },
  { href: '/analyst/tactical-report',    label: 'Tactical Report',    icon: <Crosshair size={18} /> },
  { href: '/analyst/season',             label: 'Season Intelligence',icon: <TrendingUp size={18} /> },

  // ── AI & General ──────────────────────────────────────────────────────────
  { href: '/coach/ai-insights',          label: 'AI Insights',        icon: <BookOpen size={18} /> },
  { href: '/coach/notifications',        label: 'Notifications',      icon: <Bell size={18} /> },
  { href: '/arena',                      label: 'The Arena',          icon: <Globe size={18} /> },
];

export function CoachSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href) ?? false;
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 w-72 h-screen bg-[#1a5c2a] text-white flex flex-col transition-transform duration-300 shadow-xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/coach" className="block" onClick={() => setIsMobileOpen(false)}>
            <h1 className="text-xl font-black tracking-tight">
              Grass<span className="text-[#f0b429]">Roots</span> Sports
            </h1>
            <p className="text-[9px] text-white/40 mt-0.5">Coach Console</p>
          </Link>
        </div>

        {user && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0b429]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#f0b429]">{user.name?.charAt(0) ?? 'C'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50">Coach</p>
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
