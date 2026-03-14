"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import api from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resend = async () => {
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/email/resend", { email });
      setResent(true);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/30">
            <Mail className="h-9 w-9 text-green-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
        <p className="mt-3 text-sm text-green-300">We sent a verification link to</p>
        {email && <p className="mt-1 break-all font-semibold text-white">{email}</p>}
        <p className="mt-3 text-sm text-green-400">
          Click the link in the email to activate your account. The link expires in 24 hours.
        </p>

        {/* Resend card */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="mb-4 text-sm text-green-300">
            Didn&apos;t receive it? Check your spam folder or resend.
          </p>

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Verification email sent!</span>
            </div>
          ) : (
            <button
              onClick={resend}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-400 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Sending…" : "Resend verification email"}
            </button>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        {/* Links */}
        <div className="mt-6 space-y-3">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-green-400 transition-colors hover:text-white"
          >
            Already verified? Sign in <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-green-600">
            Wrong email?{" "}
            <Link href="/register" className="text-green-400 hover:underline">
              Register again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-950" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
