"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Wind, BarChart3, Settings } from "lucide-react";

const NAV = [
  { href: "/admin",        icon: Home,     label: "Hub"     },
  { href: "/admin/users",  icon: Users,    label: "Users"   },
  { href: "/warmup",       icon: Wind,     label: "Warm-Up" },
  { href: "/admin/stats",  icon: BarChart3,label: "Stats"   },
  { href: "/settings",     icon: Settings, label: "Settings"},
];

export default function AdminBottomNav() {
  const path = usePathname();

  return (
    <>
      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
                      bg-white border-t border-gray-200 shadow-lg
                      flex items-center justify-around px-1 py-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/admin"
              ? path === "/admin"
              : (path?.startsWith(href) ?? false);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5
                          px-3 py-2 rounded-xl min-w-[56px] transition-all
                          ${active ? "text-[#1c3d22]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold leading-none
                                ${active ? "text-[#1c3d22]" : "text-gray-400"}`}>
                {label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-[#1c3d22] mt-0.5" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer so page content doesn't hide behind the nav bar */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
