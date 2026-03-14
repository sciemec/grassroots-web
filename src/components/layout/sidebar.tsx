"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShieldCheck, Users, Dumbbell, CreditCard, UserSearch,
  ClipboardList, BarChart2, Bell, Heart, LogOut, Brain, Trophy, Star,
  UserCircle, Apple, TrendingUp, Target, Layers, Zap, Radio, CreditCard as SubIcon,
  Film, Activity, FileText,
  Menu, X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";

type NavItem = { href: string; label: string; icon: React.ElementType; roles: string[] };

const navItems: NavItem[] = [
  // ─── Admin ────────────────────────────────────────────────────────────────
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard, roles: ["admin"] },
  { href: "/verifications",  label: "Verifications",  icon: ShieldCheck,     roles: ["admin"] },
  { href: "/users",          label: "Users",          icon: Users,           roles: ["admin"] },
  { href: "/sessions",       label: "Sessions",       icon: Dumbbell,        roles: ["admin"] },
  { href: "/subscriptions",  label: "Subscriptions",  icon: CreditCard,      roles: ["admin"] },
  { href: "/scout-requests", label: "Scout Requests", icon: ClipboardList,   roles: ["admin"] },
  { href: "/analytics",      label: "Analytics",      icon: BarChart2,       roles: ["admin"] },
  { href: "/notifications",  label: "Notifications",  icon: Bell,            roles: ["admin"] },
  { href: "/community",      label: "Community",      icon: Heart,           roles: ["admin"] },
  // ─── Coach ────────────────────────────────────────────────────────────────
  { href: "/coach",                  label: "Coach Hub",      icon: LayoutDashboard, roles: ["coach"] },
  { href: "/coach/squad",            label: "My Squad",       icon: Users,           roles: ["coach"] },
  { href: "/coach/tactics",          label: "Tactics Board",  icon: ClipboardList,   roles: ["coach"] },
  { href: "/coach/matches",          label: "Matches",        icon: Trophy,          roles: ["coach"] },
  { href: "/coach/ai-insights",      label: "AI Insights",    icon: Brain,           roles: ["coach"] },
  { href: "/video-studio",           label: "Video Studio",   icon: Film,            roles: ["coach"] },
  { href: "/injury-tracker",         label: "Injury Tracker", icon: Activity,        roles: ["coach"] },
  { href: "/streaming",              label: "Live Matches",   icon: Radio,           roles: ["coach"] },
  { href: "/coach/notifications",    label: "Notifications",  icon: Bell,            roles: ["coach"] },
  // ─── Scout ────────────────────────────────────────────────────────────────
  { href: "/scout",           label: "Find Players",  icon: UserSearch,  roles: ["scout"] },
  { href: "/scout/shortlist", label: "Shortlist",     icon: Star,        roles: ["scout"] },
  { href: "/scout/reports",   label: "PDF Reports",   icon: FileText,    roles: ["scout"] },
  // ─── Player ───────────────────────────────────────────────────────────────
  { href: "/player",                      label: "My Hub",          icon: LayoutDashboard, roles: ["player"] },
  { href: "/player/ai-coach",             label: "AI Coach",        icon: Brain,           roles: ["player"] },
  { href: "/player/drills",               label: "Drills",          icon: Dumbbell,        roles: ["player"] },
  { href: "/player/training-formats",     label: "Training Formats",icon: Layers,          roles: ["player"] },
  { href: "/player/sessions",             label: "Sessions",        icon: Target,          roles: ["player"] },
  { href: "/player/milestones",           label: "Milestones",      icon: Trophy,          roles: ["player"] },
  { href: "/player/progress",             label: "Progress",        icon: TrendingUp,      roles: ["player"] },
  { href: "/player/talent-id",            label: "Talent ID",       icon: Zap,             roles: ["player"] },
  { href: "/player/assessment",           label: "Assessment",      icon: Target,          roles: ["player"] },
  { href: "/player/nutrition",            label: "Nutrition",       icon: Apple,           roles: ["player"] },
  { href: "/player/development",          label: "Dev Phases",      icon: Layers,          roles: ["player"] },
  { href: "/player/subscription",         label: "Subscription",    icon: SubIcon,         roles: ["player"] },
  { href: "/player/verification",         label: "Verification",    icon: ShieldCheck,     roles: ["player"] },
  { href: "/player/profile",              label: "My Profile",      icon: UserCircle,      roles: ["player"] },
  { href: "/video-studio",               label: "Video Studio",    icon: Film,            roles: ["player"] },
  { href: "/injury-tracker",             label: "Injury Tracker",  icon: Activity,        roles: ["player"] },
  { href: "/streaming",                   label: "Live Matches",    icon: Radio,           roles: ["player"] },
  { href: "/player/notifications",        label: "Notifications",   icon: Bell,            roles: ["player"] },
  // ─── Fan ──────────────────────────────────────────────────────────────────
  { href: "/fan",                label: "Discover",       icon: Star,          roles: ["fan"] },
  { href: "/fan/leaderboard",    label: "Leaderboard",    icon: Trophy,        roles: ["fan"] },
  { href: "/streaming",          label: "Live Matches",   icon: Radio,         roles: ["fan"] },
];

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const visible = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Logo + notification bell */}
      <div className="mb-6 px-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={onNavClick}>
          <span className="text-lg">⚽</span>
          <span className="text-base font-bold text-primary">Grassroots Sport</span>
        </Link>
        {user && <NotificationBell />}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {visible.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/player" && href !== "/coach" && pathname.startsWith(href + "/")) ||
            (href === "/player" && pathname === "/player") ||
            (href === "/coach" && pathname === "/coach");
          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      {user && (
        <div className="mt-4 border-t pt-4">
          <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
          <p className="px-3 text-xs font-medium capitalize text-foreground">{user.role}</p>
          <button
            onClick={() => { logout(); router.push("/"); onNavClick?.(); }}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 flex-col border-r bg-card px-3 py-6">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">⚽</span>
          <span className="text-base font-bold text-primary">Grassroots Sport</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile overlay sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col border-r bg-card px-3 py-6 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        <NavContent onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
