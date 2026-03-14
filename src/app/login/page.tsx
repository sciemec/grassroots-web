"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

type PortalType = "player" | "professional" | "fan";

const PORTALS: { id: PortalType; label: string; emoji: string; heading: string; sub: string; accent: string; btn: string }[] = [
  {
    id: "player",
    label: "Player",
    emoji: "🏃",
    heading: "Player Portal",
    sub: "Access your AI coach, drills, progress and more",
    accent: "text-green-400",
    btn: "bg-green-500 hover:bg-green-400",
  },
  {
    id: "professional",
    label: "Coach / Scout",
    emoji: "📋",
    heading: "Professional Portal",
    sub: "Manage your squad, scout talent and generate reports",
    accent: "text-blue-400",
    btn: "bg-blue-500 hover:bg-blue-400",
  },
  {
    id: "fan",
    label: "Fan",
    emoji: "🎉",
    heading: "Fan Portal",
    sub: "Follow athletes, watch live matches and explore the leaderboard",
    accent: "text-amber-400",
    btn: "bg-amber-500 hover:bg-amber-400",
  },
];

const BG: Record<PortalType, string> = {
  player:       "from-green-950 via-green-900 to-emerald-800",
  professional: "from-blue-950 via-blue-900 to-indigo-900",
  fan:          "from-amber-950 via-orange-900 to-red-900",
};

export default function LoginPage() {
  const router = useRouter();
  const login  = useAuthStore((s) => s.login);

  const [portal, setPortal]       = useState<PortalType>("player");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const active = PORTALS.find((p) => p.id === portal)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Email and password are required."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      login({ id: user.id, name: user.name, email: user.email, role: user.role, token });
      router.push(roleHomePath(user.role));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const registerHref = portal === "player" ? "/register/player" : portal === "fan" ? "/register/fan" : "/register";

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${BG[portal]} px-4 transition-all duration-500`}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">⚽</span>
            <span className="text-xl font-bold tracking-tight">Grassroots Sport</span>
          </Link>
        </div>

        {/* Portal tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
          {PORTALS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPortal(p.id); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${portal === p.id ? "bg-white/15 text-white shadow" : "text-white/50 hover:text-white/80"}`}
            >
              <span>{p.emoji}</span>
              <span className="hidden sm:block">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{active.heading}</h1>
            <p className={`mt-1 text-sm ${active.accent}`}>{active.sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/30"
              />
            </div>

            {/* Password with eye toggle */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 pr-10 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors ${active.btn}`}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : `Sign in to ${active.heading}`}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-white/50 hover:text-white transition-colors">
              Forgot password?
            </Link>
            <Link href={registerHref} className="font-medium text-white/70 hover:text-white transition-colors">
              Create account →
            </Link>
          </div>
        </div>

        {/* Register prompt */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-white/60 mb-3">New to Grassroots Sport? Choose your path:</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {[
              { href: "/register/player", label: "🏃 Player", color: "border-green-500/40 text-green-300 hover:bg-green-500/20" },
              { href: "/register/coach",  label: "📋 Coach",  color: "border-blue-500/40 text-blue-300 hover:bg-blue-500/20" },
              { href: "/register/scout",  label: "🔍 Scout",  color: "border-purple-500/40 text-purple-300 hover:bg-purple-500/20" },
              { href: "/register/fan",    label: "🎉 Fan",    color: "border-amber-500/40 text-amber-300 hover:bg-amber-500/20" },
            ].map(({ href, label, color }) => (
              <Link key={href} href={href}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${color}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
