// src/components/layout/PlayerBottomNav.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NEW FILE — bottom navigation bar for the player hub on mobile.
// Shows on mobile only (md:hidden). Gives quick access to the 5 core screens
// without needing to open the hamburger sidebar drawer.
//
// FILE PLACEMENT: src/components/layout/PlayerBottomNav.tsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, Dumbbell, BookOpen, User } from "lucide-react";

const NAV = [
  { href: "/player",            icon: Home,     label: "Hub"      },
  { href: "/player/talent-id",  icon: Activity,  label: "Test"     },
  { href: "/player/drills",     icon: Dumbbell,  label: "Drills"   },
  { href: "/player/passport",   icon: BookOpen,  label: "Passport" },
  { href: "/player/profile",    icon: User,      label: "Profile"  },
];

export default function PlayerBottomNav() {
  const path = usePathname();

  return (
    <>
      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                      bg-white border-t border-gray-200 shadow-lg
                      flex items-center justify-around px-1 py-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          // Mark active if path exactly matches or starts with href (except root)
          const active =
            href === "/player"
              ? path === "/player"
              : (path?.startsWith(href) ?? false);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5
                          px-3 py-2 rounded-xl min-w-[56px] transition-all
                          ${active
                            ? "text-[#1c3d22]"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-semibold leading-none
                            ${active ? "text-[#1c3d22]" : "text-gray-400"}`}
              >
                {label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#1c3d22] mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer so page content doesn't hide behind the nav bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}