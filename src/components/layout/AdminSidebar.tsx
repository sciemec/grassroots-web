// src/components/layout/AdminSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, UserCircle, Target, Trophy, Globe, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === href;
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
        className={`fixed lg:sticky top-0 left-0 z-40 w-72 h-screen bg-[#1a5c2a] text-white flex flex-col transition-transform duration-300 shadow-xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="block" onClick={() => setIsMobileOpen(false)}>
            <h1 className="text-xl font-black tracking-tight">
              Grass<span className="text-[#f0b429]">Roots</span> Sports
            </h1>
            <p className="text-[9px] text-white/40 mt-0.5">Admin Console</p>
          </Link>
        </div>

        {user && (
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {[
              { href: '/admin',      label: 'Dashboard',  icon: <Home size={18} /> },
              { href: '/player',     label: 'Player Hub', icon: <UserCircle size={18} /> },
              { href: '/coach',      label: 'Coach Hub',  icon: <Users size={18} /> },
              { href: '/scout',      label: 'Scout Hub',  icon: <Target size={18} /> },
              { href: '/world-cup',  label: 'World Cup',  icon: <Trophy size={18} /> },
              { href: '/arena',      label: 'The Arena',  icon: <Globe size={18} /> },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-[#f0b429] text-[#1a5c2a]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {icon}
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
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
