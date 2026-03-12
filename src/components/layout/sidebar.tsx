"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Dumbbell,
  CreditCard,
  UserSearch,
  ClipboardList,
  BarChart2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "coach", "scout"] },
  { href: "/verifications", label: "Verifications", icon: ShieldCheck, roles: ["admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/sessions", label: "Sessions", icon: Dumbbell, roles: ["admin"] },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard, roles: ["admin"] },
  { href: "/scout-requests", label: "Scout Requests", icon: ClipboardList, roles: ["admin"] },
  { href: "/analytics", label: "Analytics", icon: BarChart2, roles: ["admin"] },
  { href: "/coach", label: "My Squad", icon: Users, roles: ["coach"] },
  { href: "/scout", label: "Find Players", icon: UserSearch, roles: ["scout"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const visible = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card px-3 py-6">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="text-lg font-bold text-primary">⚽ Grassroots Sport</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {visible.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User + Logout */}
      {user && (
        <div className="mt-4 border-t pt-4">
          <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
          <p className="px-3 text-xs font-medium capitalize text-foreground">{user.role}</p>
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
