// src/components/layout/AdminSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Users, UserCircle, Target, Globe, LogOut, Menu, X,
  ShieldCheck, Search, CreditCard, BarChart3, Megaphone, Film,
  MessageSquare, Building2, Activity, Radio, Smartphone, Sparkles,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useSidebarStore } from '@/lib/sidebar-store';

const ADMIN_TOOLS = [
  { href: '/admin/users',          label: 'Users',           icon: <Users size={16} /> },
  { href: '/admin/verifications',  label: 'Verifications',   icon: <ShieldCheck size={16} /> },
  { href: '/admin/scout-requests', label: 'Scout Requests',  icon: <Search size={16} /> },
  { href: '/admin/subscriptions',  label: 'Subscriptions',   icon: <CreditCard size={16} /> },
  { href: '/admin/stats',          label: 'Platform Stats',  icon: <BarChart3 size={16} /> },
  { href: '/admin/announcements',  label: 'Announcements',   icon: <Megaphone size={16} /> },
  { href: '/admin/fan-hub',        label: 'Fan Hub Mod',     icon: <Film size={16} /> },
  { href: '/admin/whatsapp',       label: 'WhatsApp',        icon: <MessageSquare size={16} /> },
  { href: '/admin/community',      label: 'Community',       icon: <Building2 size={16} /> },
  { href: '/admin/stream',         label: 'Stream Control',  icon: <Radio size={16} /> },
  { href: '/admin/health',         label: 'System Health',   icon: <Activity size={16} /> },
  { href: '/admin/pwa',            label: 'PWA Stats',       icon: <Smartphone size={16} /> },
  { href: '/admin/player-preview', label: 'Player Preview',  icon: <Sparkles size={16} /> },
];

const HUB_LINKS = [
  { href: '/player',    label: 'Player Hub', icon: <UserCircle size={16} /> },
  { href: '/coach',     label: 'Coach Hub',  icon: <Users size={16} /> },
  { href: '/scout',     label: 'Scout Hub',  icon: <Target size={16} /> },
  { href: '/arena',     label: 'The Arena',  icon: <Globe size={16} /> },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isCollapsed, toggle } = useSidebarStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
    return pathname?.startsWith(href) ?? false;
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const NavLink = ({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => setIsMobileOpen(false)}
      title={isCollapsed ? label : undefined}
      className={`flex items-center rounded-xl text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2'} ${
        isActive(href)
          ? 'bg-[#f0b429] text-[#1a5c2a]'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      {icon}
      {!isCollapsed && label}
    </Link>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#1a5c2a] text-white flex flex-col shadow-xl transition-all duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'lg:w-16' : 'w-72'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
          <Link href="/admin" className="block overflow-hidden min-w-0" onClick={() => setIsMobileOpen(false)}>
            {isCollapsed ? (
              <span className="text-xl font-black text-[#f0b429]">G</span>
            ) : (
              <>
                <h1 className="text-xl font-black tracking-tight whitespace-nowrap">
                  Grass<span className="text-[#f0b429]">Roots</span> Sports
                </h1>
                <p className="text-[9px] text-white/40 mt-0.5">Admin Console</p>
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
          <div className={`border-b border-white/10 bg-white/5 shrink-0 ${isCollapsed ? 'p-3' : 'px-4 py-3'}`}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#f0b429]">{user.name?.charAt(0) ?? 'A'}</span>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
              </>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4">
          <div className={isCollapsed ? 'px-2' : 'px-3'}>
            <NavLink href="/admin" label="Dashboard" icon={<Home size={16} />} />
          </div>

          <div className={isCollapsed ? 'px-2' : 'px-3'}>
            {!isCollapsed && (
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5 px-1">Admin Tools</p>
            )}
            <div className="space-y-0.5">
              {ADMIN_TOOLS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div className={isCollapsed ? 'px-2' : 'px-3'}>
            {!isCollapsed && (
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5 px-1">View as User</p>
            )}
            <div className="space-y-0.5">
              {HUB_LINKS.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
