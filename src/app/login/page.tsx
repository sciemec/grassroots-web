'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import { useAuthStore, roleHomePath, type AuthUser, type UserRole } from '@/lib/auth-store';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const loginStore   = useAuthStore((s) => s.login);

  const registered = searchParams.get('registered') === '1';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [roleLoading, setRoleLoading]     = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Holds new Google user waiting for role selection
  const [pendingGoogle, setPendingGoogle] = useState<{
    user: AuthUser; token: string; name: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/login', {
        email: identifier,
        password,
      }, { timeout: 60000, baseURL: '' });

      // Handle multiple possible Laravel response formats
      const token: string = data.token ?? data.access_token ?? data.data?.token;
      const user: AuthUser = data.user ?? data.data?.user ?? data.data;

      if (!token || !user) throw new Error('Unexpected response from server.');

      loginStore({ ...user, token });
      router.push(roleHomePath(user.role));
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status?: number; data?: unknown } };
      if (!e.response) {
        // No response = network failure (CORS, connection refused, timeout)
        setError(
          e?.code === 'ECONNABORTED'
            ? 'Server is waking up — please try again in 30 seconds.'
            : `Network error: Cannot reach server. (${e?.code ?? 'no response'})`
        );
      } else {
        const d = e.response.data as Record<string, unknown> | null;
        setError(
          (d?.message as string) ??
          (d?.error as string) ??
          `Server returned ${e.response.status}: ${JSON.stringify(d)}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      const gUser    = result.user;

      const res = await api.post('/auth/google', {
        email:        gUser.email,
        name:         gUser.displayName ?? gUser.email,
        firebase_uid: gUser.uid,
        photo_url:    gUser.photoURL ?? undefined,
      });

      const token: string  = res.data.token ?? res.data.access_token ?? res.data.data?.token;
      const user: AuthUser = res.data.user  ?? res.data.data?.user   ?? res.data.data;
      if (!token || !user) throw new Error('Unexpected response from server.');

      const isNew = res.status === 201;

      if (isNew) {
        // New user — show role picker before logging them in
        setPendingGoogle({ user, token, name: gUser.displayName ?? user.name ?? 'there' });
      } else {
        // Returning user — straight to dashboard
        loginStore({ ...user, token });
        router.push(roleHomePath(user.role));
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
      setError(e.message ?? 'Google sign-in failed. Please use email and password instead.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRolePick = async (role: UserRole) => {
    if (!pendingGoogle) return;
    setRoleLoading(true);
    try {
      // Temporarily store token so api can make the PATCH call
      loginStore({ ...pendingGoogle.user, token: pendingGoogle.token });
      await api.patch('/profile', { role });
      // Update local user with chosen role and redirect
      loginStore({ ...pendingGoogle.user, token: pendingGoogle.token, role });
      router.push(roleHomePath(role));
    } catch {
      // If PATCH fails, still let them in with default player role
      loginStore({ ...pendingGoogle.user, token: pendingGoogle.token });
      router.push(roleHomePath(pendingGoogle.user.role));
    } finally {
      setRoleLoading(false);
      setPendingGoogle(null);
    }
  };

  // ── Role picker — shown to new Google users only ─────────────────────────
  if (pendingGoogle) {
    const roles = [
      { id: 'player' as UserRole, icon: '⚽', label: 'Player',  desc: 'Track my training & get scouted' },
      { id: 'coach'  as UserRole, icon: '🎽', label: 'Coach',   desc: 'Manage my squad & tactics' },
      { id: 'scout'  as UserRole, icon: '🔍', label: 'Scout',   desc: 'Discover & report on talent' },
      { id: 'fan'    as UserRole, icon: '👥', label: 'Fan',     desc: 'Follow players & teams' },
    ];
    return (
      <div className="min-h-screen bg-[#0a1a0e] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">👋</div>
            <h1 className="text-2xl font-bold text-white">
              Welcome, {pendingGoogle.name.split(' ')[0]}!
            </h1>
            <p className="text-white/50 text-sm mt-2">One quick question before you start</p>
          </div>

          <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-6">
            <p className="text-white/70 text-sm font-medium mb-4 text-center">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRolePick(r.id)}
                  disabled={roleLoading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10
                             bg-white/5 hover:bg-[#FFD700]/10 hover:border-[#FFD700]/40
                             disabled:opacity-40 transition-all text-center"
                >
                  <span className="text-3xl">{r.icon}</span>
                  <span className="text-white font-semibold text-sm">{r.label}</span>
                  <span className="text-white/40 text-[11px] leading-tight">{r.desc}</span>
                </button>
              ))}
            </div>
            {roleLoading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-sm">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                Setting up your account…
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1a0e] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Pitch lines background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] border-2 border-[#FFD700] rounded-[50%]" />
        <div className="absolute top-0 left-1/2 -translate-x-px w-px h-full bg-[#FFD700]" />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a3a1f] border border-[#FFD700]/30 mb-4">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            GrassRoots <span className="text-[#FFD700]">Sports</span>
          </h1>
          <p className="text-green-400/60 text-sm mt-1">Zimbabwe&apos;s Sports Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in to your account</h2>

          {registered && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <span>✓</span>
              <span>Account created! Sign in below to get started.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm text-green-300/70 mb-1.5 font-medium">
                Email or phone number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(null); }}
                placeholder="email@example.com or 07X XXX XXXX"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-white/20 text-sm
                           focus:outline-none focus:border-[#FFD700]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-green-300/70 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder-white/20 text-sm
                             focus:outline-none focus:border-[#FFD700]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full py-3 rounded-xl font-semibold text-sm
                         bg-[#FFD700] text-[#0a1a0e]
                         hover:bg-[#FFE44D] active:scale-[0.98]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign in →'}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 rounded-xl font-semibold text-sm
                       bg-white text-[#1a1a1a]
                       hover:bg-gray-100 active:scale-[0.98]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Signing in with Google…
              </>
            ) : (
              <>
                {/* Google G logo */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2 text-center">
          <p className="text-white/40 text-sm">
            New here?{' '}
            <Link href="/register" className="text-[#FFD700] hover:text-[#FFE44D] font-medium transition-colors">
              Create account
            </Link>
          </p>
          <Link
            href="/player"
            className="block text-white/20 text-xs hover:text-white/40 transition-colors"
          >
            Continue exploring without an account →
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
