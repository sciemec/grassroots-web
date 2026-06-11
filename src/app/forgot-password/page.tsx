"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    
    try {
      // Direct post action hits your AuthController endpoint safely
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: any } })?.response?.data;
      
      // ✅ Dynamic parsing handles standard message arrays, error properties, or validation lists safely
      if (resData) {
        if (resData.message) {
          setError(resData.message);
        } else if (resData.error) {
          setError(resData.error);
        } else if (resData.errors?.email) {
          setError(resData.errors.email[0]);
        } else {
          setError("Unable to process request. Please confirm your email is correct and try again.");
        }
      } else {
        setError("Network connection dropped out. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 to-emerald-800 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-4xl">⚽</span>
          <h1 className="mt-3 text-2xl font-bold text-white">Reset your password</h1>
          <p className="mt-1 text-sm text-green-200">
            {sent ? "Check your inbox" : "Enter your email and we'll send a reset link"}
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-300" />
              <h2 className="mb-2 text-lg font-semibold text-white">Email sent!</h2>
              <p className="mb-6 text-sm text-green-200">
                If <strong>{email}</strong> is registered on our platform, you&apos;ll receive a secure password reset link within a few minutes. Check your spam folder if it doesn&apos;t arrive.
              </p>
              <Link
                href="/login"
                className="block w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-green-900 hover:bg-green-50 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-[#f0b429]/20 bg-white/10 py-3 pl-9 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#f0b429]/40 focus:ring-1 focus:ring-white/30"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/20 px-4 py-2.5 text-sm text-red-200 font-medium border border-red-500/30">
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-green-900 hover:bg-green-50 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {loading ? "Sending link..." : "Send reset link"}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-green-200 hover:text-white transition-colors font-semibold"
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