"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const nextPath    = params.get("next");
  const login       = useAuthStore((s) => s.login);
  const updateUser  = useAuthStore((s) => s.updateUser);

  const registered = params.get("registered") === "1";

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
      const res = await api.post("/auth/login", { identifier: email, password });
      const { token, user } = res.data;
      // Backend may return first_name + surname separately for new accounts
      const displayName =
        user.name ||
        [user.first_name, user.surname].filter(Boolean).join(" ") ||
        user.email;
      login({ id: user.id, name: displayName, email: user.email, role: user.role, token });

      // Fetch profile fields in the background so AI features have context
      api.get("/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then((profileRes) => {
          const p = profileRes.data;
          updateUser({
            sport:     p.sport     ?? undefined,
            position:  p.position  ?? p.position_primary ?? undefined,
            age_group: p.age_group ?? undefined,
            province:  p.province  ?? undefined,
          });
        })
        .catch(() => {}); // non-critical — AI falls back to defaults

      router.push(nextPath ?? roleHomePath(user.role));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br ${BG[portal]} px-4 transition-all duration-500`}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Grassroots Sport" width={40} height={40} />
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

          {registered && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-sm text-green-300">
              Account created! Sign in to get started.
            </div>
          )}

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
            <Link href="/register" className="font-medium text-white/70 hover:text-white transition-colors">
              Create account →
            </Link>
          </div>
        </div>

        {/* Register prompt — links to sport-first registration */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-white/60 mb-3">New to Grassroots Sport?</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            ⚽ Choose your sport &amp; sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-950" />}>
      <LoginContent />
    </Suspense>
  );
}
