"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function VerifyOtpContent() {
  const params     = useSearchParams();
  const router     = useRouter();
  const login      = useAuthStore((s) => s.login);
  const identifier = params.get("identifier") ?? "";

  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      refs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const submit = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { identifier, otp: code });
      const { token, user } = res.data;
      login({ id: user.id, name: user.name ?? `${user.first_name} ${user.surname}`, email: user.email ?? user.phone, role: user.role, token });
      router.push("/welcome");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Invalid or expired code. Please try again.");
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    try {
      await api.post("/auth/resend-otp", { identifier });
      setResent(true);
    } catch {
      // Silently ignore — OTP may still be valid
    } finally {
      setResending(false);
    }
  };

  const maskedIdentifier = identifier.includes("@")
    ? identifier.replace(/(.{2}).+(@.+)/, "$1***$2")
    : identifier.replace(/(.{3}).+(\d{4})$/, "$1****$2");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">⚽</span>
            <span className="text-xl font-bold">Grassroots Sport</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/30">
              <span className="text-2xl">📱</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Verify your account</h1>
            <p className="mt-2 text-sm text-green-300">
              We sent a 6-digit code to<br />
              <span className="font-semibold text-white">{maskedIdentifier || "your contact"}</span>
            </p>
            <p className="mt-1 text-xs text-green-500">
              Wrong address?{" "}
              <Link href="/register" className="text-green-300 underline hover:text-white transition-colors">
                Go back and re-register
              </Link>
            </p>
          </div>

          {/* OTP boxes */}
          <div className="mb-6 flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-xl border border-white/20 bg-white/10 text-center text-lg font-bold text-white outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2.5 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {resent && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-2.5 text-center text-sm text-green-300">
              New code sent!
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading || otp.join("").length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white transition-colors hover:bg-green-400 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</> : <><CheckCircle2 className="h-4 w-4" /> Verify Account</>}
          </button>

          <div className="mt-4 text-center text-sm text-green-400">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={resend}
              disabled={resending}
              className="font-semibold text-white hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-950" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
