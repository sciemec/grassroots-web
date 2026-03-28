'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore, roleHomePath, type AuthUser } from '@/lib/auth-store';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const loginStore   = useAuthStore((s) => s.login);

  const registered = searchParams.get('registered') === '1';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

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
