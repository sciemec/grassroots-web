"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  const links = [
    { href: "/#sports", label: "Sports" },
    { href: "/#features", label: "Features" },
    { href: "/#ai", label: "AI Coach" },
    { href: "/schools", label: "Schools & Clubs" },
    { href: "/business-hub", label: "Business Hub" },
    { href: "/#pricing", label: "Pricing" },
  ];

  return (
    <header
      className="fixed top-0 z-50 w-full border-b border-white/10 backdrop-blur-md"
      style={{
        background: "rgba(27,94,32,0.92)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpolygon points='40,8 52,32 40,56 28,32' fill='none' stroke='%23E6A817' stroke-width='0.6' opacity='0.15'/%3E%3Cpolygon points='0,8 12,32 0,56' fill='none' stroke='%23E6A817' stroke-width='0.6' opacity='0.15'/%3E%3Cpolygon points='80,8 80,56 68,32' fill='none' stroke='%23E6A817' stroke-width='0.6' opacity='0.15'/%3E%3C/svg%3E")`,
        backgroundSize: "80px 80px",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots Sport" width={36} height={36} className="rounded-md" />
          <span className="text-lg font-bold tracking-tight">
            Grassroots <span style={{ color: "#F5C842" }}>Sport</span>
          </span>
          <span className="hidden rounded px-2 py-0.5 text-[10px] font-bold sm:inline" style={{ background: "rgba(230,168,23,0.15)", color: "#F5C842", letterSpacing: "2px" }}>
            PRO
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-green-200 hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {user ? (
            <Link
              href={roleHomePath(user.role)}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 transition-colors"
            >
              Go to Hub
            </Link>
          ) : (
            <>
              <Link
                href="/#features"
                className="text-sm text-green-200 hover:text-white transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/login"
                className="rounded px-4 py-2 text-sm font-bold transition hover:opacity-85"
                style={{ background: "#E6A817", color: "#2C2416" }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-green-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-green-200 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <hr className="border-white/10" />
            {user ? (
              <Link href={roleHomePath(user.role)} className="text-sm font-semibold text-green-400">
                Go to Hub →
              </Link>
            ) : (
              <>
                <Link href="/#features" className="text-sm text-green-200 hover:text-white">Explore</Link>
                <Link href="/login" className="text-sm font-semibold text-green-400">Sign In →</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
