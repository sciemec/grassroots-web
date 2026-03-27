'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore, roleHomePath, type AuthUser } from '@/lib/auth-store';

export default function LoginPage() {
  const router     = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password }, { timeout: 60000 });
      loginStore({ ...data.user, token: data.token });
      router.push(roleHomePath(data.user.role));
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; response?: { status?: number; data?: unknown } };
      const raw = JSON.stringify({ code: e?.code, status: e?.response?.status, data: e?.response?.data });
      const msg =
        (e?.response?.data as { message?: string })?.message
        ?? (e?.response?.data as { error?: string })?.error
        ?? (e?.code === 'ECONNABORTED' ? 'Server is waking up — please try again in 30 seconds.' : null)
        ?? `Debug: ${raw}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a0e] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background pitch lines */}
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
          <p className="text-green-400/60 text-sm mt-1">Where Champions Begin</p>
        </div>

        {/* Card */}
        <div className="bg-[#0f2614]/80 backdrop-blur border border-[#FFD700]/10 rounded-2xl p-8 shadow-2xl">

          <h2 className="text-white font-semibold text-lg mb-6">Sign in to your account</h2>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm text-green-300/70 mb-1.5 font-medium">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder-white/20 text-sm
                           focus:outline-none focus:border-[#FFD700]/50
                           transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-green-300/70 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 pr-10 py-3 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder-white/20 text-sm
                             focus:outline-none focus:border-[#FFD700]/50
                             transition-all duration-200"
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

            {/* Forgot password */}
            <div className="text-right">
              <a href="/forgot-password" className="text-xs text-[#FFD700]/60 hover:text-[#FFD700] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl font-semibold text-sm
                         bg-[#FFD700] text-[#0a1a0e]
                         hover:bg-[#FFE44D] active:scale-[0.98]
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0a1a0e]/30 border-t-[#0a1a0e] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in with email →'
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-white/30 text-sm mt-6">
          New to GrassRoots Sport?{' '}
          <a href="/register" className="text-[#FFD700] hover:text-[#FFE44D] transition-colors font-medium">
            Create account
          </a>
        </p>

      </div>
    </div>
  );
}
