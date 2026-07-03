// src/components/layout/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Target, Dumbbell, TrendingUp, TrendingDown, IdCard,
  Users, BookOpen, UserSearch, Heart, Settings,
  Activity, Video, Camera, Award, LogOut, Menu, X,
  BarChart3, Medal, Globe, Trophy, Briefcase,
  Crosshair, GraduationCap, CreditCard, Zap, Move, Flag, Shuffle, Send, Shield
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Feature flags — set false to hide features without deleting code ────────
const FEATURES = {
  biometrics:   false,
  drills:       true,
  passport:     true,
  arena:        true,
  worldCup:     true,
  successEngine:false,
  nutrition:    false,
  trainingPlan: false,
  fanHub:       false,
  businessHub:  false,
};

interface NavItem {
  href:    string;
  label:   string;
  icon:    React.ReactNode;
  roles:   string[];
  feature?: keyof typeof FEATURES;
}

const NAV_ITEMS: NavItem[] = [
  // ── Everyone ──────────────────────────────────────────────────────────────
  { href: "/",                  label: "Home",            icon: <Home size={18} />,        roles: ["player","athlete","coach","scout","fan","admin"] },

  // ── Player ────────────────────────────────────────────────────────────────
  { href: "/player",            label: "Player Hub",      icon: <Home size={18} />,        roles: ["player"],                   },
  { href: "/player/ai-coach",   label: "AI Coach",        icon: <BookOpen size={18} />,    roles: ["player"],                   },
  { href: "/player/showcase",   label: "My Showcase",     icon: <Award size={18} />,       roles: ["player"],                   },
  { href: "/player/nutrition",         label: "Nutrition",       icon: <TrendingUp size={18} />, roles: ["player"] },
  { href: "/player/nutrition/guides",  label: "Nutrition Guides",icon: <BookOpen size={18} />,   roles: ["player"] },
  { href: "/player/drills",       label: "My Drills",       icon: <Dumbbell size={18} />,    roles: ["player"], feature: "drills"    },
  { href: "/player/drills/guides", label: "Drill Guides",    icon: <BookOpen size={18} />,    roles: ["player"], feature: "drills"    },
  { href: "/player/talent-id",  label: "Talent ID",       icon: <Target size={18} />,      roles: ["player"], feature: "passport"  },
  { href: "/player/passport",   label: "Talent Passport", icon: <IdCard size={18} />,      roles: ["player"], feature: "passport"  },
  { href: "/player/vault",      label: "Highlight Vault", icon: <Video size={18} />,       roles: ["player"], feature: "passport"  },
  { href: "/player/media",      label: "Media Gallery",   icon: <Camera size={18} />,      roles: ["player"], feature: "passport"  },
  { href: "/player/position-fit",label:"Position Finder", icon: <Crosshair size={18} />,   roles: ["player"], feature: "biometrics" },
  { href: "/player/sprint",      label: "Sprint Analyzer", icon: <Zap size={18} />,          roles: ["player"]                     },
  { href: "/player/shooting",    label: "Shooting Analyzer", icon: <Target size={18} />,      roles: ["player"]                     },
  { href: "/player/first-touch", label: "First Touch",       icon: <Move size={18} />,         roles: ["player"]                     },
  { href: "/player/dribbling",   label: "Dribbling Analyzer",icon: <Shuffle size={18} />,      roles: ["player"]                     },
  { href: "/player/passing",     label: "Passing Analyzer",  icon: <Send size={18} />,         roles: ["player"]                     },
  { href: "/player/tackling",   label: "Tackling Analyzer", icon: <Shield size={18} />,       roles: ["player"]                     },
  { href: "/player/scholarship-reel", label: "Scholarship Reel", icon: <Video size={18} />, roles: ["player"], feature: "passport" },
  { href: "/player/academics",   label: "My Academics",  icon: <BookOpen size={18} />,      roles: ["player"] },
  { href: "/player/pathway",     label: "My Pathway",    icon: <GraduationCap size={18} />, roles: ["player"] },
  { href: "/player/subscription", label: "Subscription",  icon: <CreditCard size={18} />,    roles: ["player"] },

  // ── Athlete (multi-sport) ─────────────────────────────────────────────────
  { href: "/athlete/scan",      label: "Biometric Scan",  icon: <Activity size={18} />,    roles: ["athlete"], feature: "biometrics" },
  { href: "/athlete/vault",     label: "Video Vault",     icon: <Video size={18} />,       roles: ["athlete"], feature: "passport"  },
  { href: "/athlete/passport",  label: "Talent Passport", icon: <IdCard size={18} />,      roles: ["athlete"], feature: "passport"  },

  // ── Coach ─────────────────────────────────────────────────────────────────
  { href: "/coach",             label: "Coach Hub",       icon: <BookOpen size={18} />,    roles: ["coach"]                     },
  { href: "/coach/squad",       label: "My Squad",        icon: <Users size={18} />,       roles: ["coach"], feature: "drills"    },
  { href: "/coach/talent-id",   label: "Talent ID",       icon: <Target size={18} />,      roles: ["coach"], feature: "biometrics" },
  { href: "/coach/ai-insights", label: "THUTO AI",        icon: <BookOpen size={18} />,    roles: ["coach"]                     },
  { href: "/coach/injury-hub", label: "Injury Hub",      icon: <Activity size={18} />,    roles: ["coach"]                     },
  { href: "/coach/fatigue",        label: "Fatigue Monitor", icon: <TrendingDown size={18} />, roles: ["coach"]                     },
  { href: "/coach/set-piece-lab",  label: "Set Piece Lab",   icon: <Flag size={18} />,         roles: ["coach"]                     },

  // ── Scout ─────────────────────────────────────────────────────────────────
  { href: "/scout/discover",    label: "Discover Talent", icon: <UserSearch size={18} />,  roles: ["scout"], feature: "passport"  },
  { href: "/scout/reports",     label: "Scouting Reports",icon: <BarChart3 size={18} />,   roles: ["scout"], feature: "passport"  },
  { href: "/scout/shortlist",   label: "My Shortlist",    icon: <Heart size={18} />,       roles: ["scout"], feature: "passport"  },

  // ── Fan ───────────────────────────────────────────────────────────────────
  { href: "/community",         label: "Discover Stars",  icon: <Medal size={18} />,       roles: ["fan"],   feature: "passport"  },
  { href: "/talent-leaderboard",label: "Leaderboard",     icon: <Award size={18} />,       roles: ["fan","scout","coach"], feature: "passport" },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { href: "/admin",             label: "Admin Hub",       icon: <Home size={18} />,        roles: ["admin"]                     },
  { href: "/admin/users",       label: "Users",           icon: <Users size={18} />,       roles: ["admin"]                     },
  { href: "/admin/fan-hub",     label: "Fan Hub Mod",     icon: <Video size={18} />,       roles: ["admin"]                     },

  // ── Shared: Arena + World Cup ─────────────────────────────────────────────
  { href: "/arena",             label: "The Arena",       icon: <Globe size={18} />,       roles: ["player","athlete","coach","scout","fan"], feature: "arena"   },
  { href: "/world-cup",         label: "🏆 World Cup",    icon: <Trophy size={18} />,      roles: ["player","athlete","coach","scout","fan"], feature: "worldCup"},

  // ── Utilities ─────────────────────────────────────────────────────────────
  { href: "/settings",          label: "Settings",        icon: <Settings size={18} />,    roles: ["player","athlete","coach","scout","fan","admin"] },
];

const isFeatureEnabled = (feature?: keyof typeof FEATURES) =>
  !feature || FEATURES[feature] === true;

export function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const logout      = useAuthStore((s) => s.logout);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  if (!hasHydrated) return null;

  const userRole = user?.role || "fan";

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(userRole) && isFeatureEnabled(item.feature)
  );

  // Deduplicate by href (some hubs have Home listed for both "/" and hub root)
  const seen = new Set<string>();
  const dedupedItems = visibleItems.filter(item => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : (pathname?.startsWith(href) ?? false);

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <>
      {/* ── Mobile hamburger button ─────────────────────────────────────────
           Sits at top-left. On mobile the bottom nav handles quick links,
           but the sidebar drawer is still accessible for the full menu.    */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a5c2a] text-white rounded-xl shadow-lg"
        aria-label="Open navigation menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Sidebar panel ───────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 z-40
          w-64 h-screen bg-[#1a5c2a] text-white
          flex flex-col transition-transform duration-300 ease-in-out shadow-xl
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" onClick={() => setIsMobileOpen(false)}>
            <h1 className="text-xl font-black tracking-tight">
              Grass<span className="text-[#f0b429]">Roots</span> Sports
            </h1>
            <p className="text-[9px] text-white/40 mt-0.5 tracking-wider">
              Identify · Nurture · Market
            </p>
          </Link>
        </div>

        {/* User info — mobile only */}
        {user && (
          <div className="md:hidden p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
                <span className="text-sm font-bold text-[#f0b429]">
                  {user.name?.charAt(0) ?? "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-0.5 px-3">
            {dedupedItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${isActive(item.href)
                    ? "bg-[#f0b429] text-[#1a5c2a] font-black"
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                         text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
          <p className="text-center text-[8px] text-white/25">© 2026 GrassRoots Sports</p>
        </div>
      </aside>

      {/* Overlay — closes sidebar when tapping outside on mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}