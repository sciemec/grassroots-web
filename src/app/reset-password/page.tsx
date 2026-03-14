"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const valid = password.length >= 8 && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, email, password, password_confirmation: confirm });
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Reset failed. The link may have expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 3 : 2;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-amber-500", "bg-green-500"];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 to-emerald-800 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">⚽</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Create new password</h1>
          <p className="mt-1 text-sm text-green-200">
            {done ? "Password updated!" : "Choose a strong password for your account"}
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
          {done ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-300" />
              <h2 className="mb-2 text-lg font-semibold text-white">Password updated!</h2>
              <p className="mb-6 text-sm text-green-200">Redirecting you to sign in…</p>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-green-900 hover:bg-green-50 transition-colors"
              >
                Sign in now
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-red-300">Invalid or missing reset token.</p>
              <Link href="/forgot-password" className="text-sm text-white hover:underline">Request a new reset link</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {email && (
                <p className="text-xs text-center text-green-200 mb-4">Resetting password for <strong>{email}</strong></p>
              )}

              {/* New password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-9 pr-10 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${strengthColor[strength]}`}
                        style={{ width: `${(strength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-green-200">{strengthLabel[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat your new password"
                    className={`w-full rounded-xl border py-3 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none bg-white/10 ${
                      confirm && password !== confirm ? "border-red-400" : "border-white/20 focus:border-white/40"
                    }`}
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="mt-1 text-xs text-red-300">Passwords don&apos;t match</p>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/20 px-4 py-2.5 text-sm text-red-200">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !valid}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-green-900 hover:bg-green-50 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {loading ? "Updating…" : "Set new password"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-green-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
