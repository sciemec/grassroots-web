"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  const links = [
    { href: "/#sports", label: "Sports" },
    { href: "/#features", label: "Features" },
    { href: "/#ai", label: "AI Coach" },
    { href: "/#pricing", label: "Pricing" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-green-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-white">
          <Image src="/logo.png" alt="Grassroots Sport" width={36} height={36} className="rounded-md" />
          <span className="text-lg font-bold tracking-tight">
            Grassroots <span className="text-green-400">Sport</span>
          </span>
          <span className="hidden rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300 sm:inline">
            Pro
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
                href="/login"
                className="text-sm text-green-200 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 transition-colors"
              >
                Get started
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
                <Link href="/login" className="text-sm text-green-200 hover:text-white">Sign in</Link>
                <Link href="/register" className="text-sm font-semibold text-green-400">Get started free →</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
