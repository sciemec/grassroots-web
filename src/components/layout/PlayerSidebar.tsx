// src/components/layout/PlayerSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, User, IdCard, Activity, Zap, BookOpen, Dumbbell, Calendar,
  Brain, Target, TrendingUp, BarChart3, Trophy, Star, Video,
  GraduationCap, Globe, CreditCard, Bell, Heart, Settings, Flame,
  Shuffle, Send, Shield, Move, Flag, Award, Users, Crosshair, Swords,
  Briefcase, CheckSquare, LogOut, Menu, X, BarChart2, Utensils,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useSidebarStore } from '@/lib/sidebar-store';

const NAV_ITEMS = [
  { href: '/player',                   label: 'Player Hub',         icon: <Home size={18} />,          exact: true },
  { href: '/player/profile',           label: 'My Profile',         icon: <User size={18} /> },
  { href: '/player/passport',          label: 'Talent Passport',    icon: <IdCard size={18} /> },
  { href: '/player/dna',               label: 'Player DNA',         icon: <Zap size={18} /> },
  { href: '/player/my-card',           label: 'My Card',            icon: <IdCard size={18} /> },
  { href: '/player/verification',      label: 'Verification',       icon: <CheckSquare size={18} /> },
  { href: '/player/similar',           label: 'Similar Players',    icon: <Users size={18} /> },
  { href: '/player/talent-id',         label: 'Talent ID',          icon: <Target size={18} /> },
  { href: '/player/sessions',          label: 'My Sessions',        icon: <Calendar size={18} /> },
  { href: '/player/train',             label: 'Train',              icon: <Dumbbell size={18} /> },
  { href: '/player/drills',            label: 'Drills',             icon: <Dumbbell size={18} /> },
  { href: '/player/drills/guides',     label: 'Drill Guides',       icon: <BookOpen size={18} /> },
  { href: '/player/conditioning',      label: 'Conditioning',       icon: <Flame size={18} /> },
  { href: '/player/ubuntu',            label: 'Ubuntu Training',    icon: <Users size={18} /> },
  { href: '/player/weekly-session',    label: 'Weekly Session',     icon: <Calendar size={18} /> },
  { href: '/player/training-formats',  label: 'Training Formats',   icon: <BookOpen size={18} /> },
  { href: '/player/biomechanics',      label: 'Movement Scan',      icon: <Activity size={18} /> },
  { href: '/player/assessment',        label: 'Assessment',         icon: <Target size={18} /> },
  { href: '/player/sprint',            label: 'Sprint Analyzer',    icon: <Flame size={18} /> },
  { href: '/player/shooting',          label: 'Shooting Analyzer',  icon: <Target size={18} /> },
  { href: '/player/dribbling',         label: 'Dribbling',          icon: <Shuffle size={18} /> },
  { href: '/player/passing',           label: 'Passing',            icon: <Send size={18} /> },
  { href: '/player/first-touch',       label: 'First Touch',        icon: <Move size={18} /> },
  { href: '/player/tackling',          label: 'Tackling',           icon: <Shield size={18} /> },
  { href: '/player/position-fit',      label: 'Position Finder',    icon: <Crosshair size={18} /> },
  { href: '/player/ai-coach',          label: 'AI Coach',           icon: <BookOpen size={18} /> },
  { href: '/player/tactics',           label: 'Tactics',            icon: <Brain size={18} /> },
  { href: '/player/tactics/simulator', label: 'Tactics Simulator',  icon: <Swords size={18} /> },
  { href: '/player/coaching',          label: 'Find a Coach',       icon: <GraduationCap size={18} /> },
  { href: '/player/stats',             label: 'My Stats',           icon: <BarChart3 size={18} /> },
  { href: '/player/progress',          label: 'Progress',           icon: <TrendingUp size={18} /> },
  { href: '/player/milestones',        label: 'Milestones',         icon: <Trophy size={18} /> },
  { href: '/player/development',       label: 'Development',        icon: <TrendingUp size={18} /> },
  { href: '/player/potential',         label: 'Potential',          icon: <Star size={18} /> },
  { href: '/player/valuation',         label: 'My Valuation',       icon: <BarChart2 size={18} /> },
  { href: '/player/goal',              label: 'Mission Mode',       icon: <Flag size={18} /> },
  { href: '/player/success',           label: 'Success Tracker',    icon: <Award size={18} /> },
  { href: '/player/showcase',          label: 'My Showcase',        icon: <Star size={18} /> },
  { href: '/player/vault',             label: 'Highlight Vault',    icon: <Video size={18} /> },
  { href: '/player/scholarship-reel',  label: 'Scholarship Reel',   icon: <Award size={18} /> },
  { href: '/player/analyse',           label: 'Video Analysis',     icon: <Video size={18} /> },
  { href: '/player/story',             label: 'My Story',           icon: <BookOpen size={18} /> },
  { href: '/player/brand',             label: 'My Brand',           icon: <Briefcase size={18} /> },
  { href: '/player/nutrition',         label: 'Nutrition',          icon: <Utensils size={18} /> },
  { href: '/player/nutrition/plan',    label: 'Nutrition Plan',     icon: <Utensils size={18} /> },
  { href: '/player/nutrition/foods',   label: 'Food Library',       icon: <BookOpen size={18} /> },
  { href: '/player/nutrition/guides',  label: 'Nutrition Guides',   icon: <BookOpen size={18} /> },
  { href: '/player/pathway',           label: 'My Pathway',         icon: <GraduationCap size={18} /> },
  { href: '/player/academics',         label: 'Academics',          icon: <GraduationCap size={18} /> },
  { href: '/player/business-school',   label: 'Business School',    icon: <Briefcase size={18} /> },
  { href: '/arena',                    label: 'The Arena',          icon: <Globe size={18} /> },
  { href: '/player/pitch',             label: 'Pitch',              icon: <Flag size={18} /> },
  { href: '/world-cup',                label: 'World Cup',          icon: <Trophy size={18} /> },
  { href: '/player/subscription',      label: 'Subscription',       icon: <CreditCard size={18} /> },
  { href: '/player/notifications',     label: 'Notifications',      icon: <Bell size={18} /> },
  { href: '/parent/invite',            label: 'Invite Parent',      icon: <Heart size={18} /> },
  { href: '/settings',                 label: 'Settings',           icon: <Settings size={18} /> },
];

export function PlayerSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const { isCollapsed, toggle } = useSidebarStore();
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
        className={`fixed top-0 left-0 z-40 h-screen bg-[#1a5c2a] text-white flex flex-col shadow-xl transition-all duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-16' : 'w-72'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <Link href="/player" className="block overflow-hidden min-w-0" onClick={() => setIsMobileOpen(false)}>
            {isCollapsed ? (
              <span className="text-xl font-black text-[#f0b429]">G</span>
            ) : (
              <>
                <h1 className="text-xl font-black tracking-tight whitespace-nowrap">
                  Grass<span className="text-[#f0b429]">Roots</span> Sports
                </h1>
                <p className="text-[9px] text-white/40 mt-0.5">Player Hub</p>
              </>
            )}
          </Link>
          <button
            onClick={toggle}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* User */}
        {user && (
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-9 h-9 rounded-full bg-[#f0b429]/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[#f0b429]">{user.name?.charAt(0) ?? 'P'}</span>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{user.name}</p>
                  <p className="text-[10px] text-white/50">Player</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition ${isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'} ${isActive(item.href, item.exact) ? 'bg-[#f0b429] text-[#1a5c2a]' : 'text-white/80 hover:bg-white/10'}`}
              >
                {item.icon}
                {!isCollapsed && item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}
