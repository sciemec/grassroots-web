"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { extractApiError } from "@/lib/api-error";

function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const submit = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/verify-otp", { phone, otp: code });
      router.push("/login?verified=1");
    } catch (e: unknown) {
      setError(extractApiError(e, "Invalid code. Please try again."));
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/send-otp", { phone });
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (e: unknown) {
      setError(extractApiError(e, "Could not resend code. Please try again."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={56} height={56} className="mx-auto mb-3" />
          </Link>
          <h1 className="text-2xl font-black text-white">Verify your number</h1>
          <p className="mt-2 text-sm text-green-300">
            We sent a 6-digit code to
          </p>
          <p className="mt-1 font-bold text-white">{phone}</p>
        </div>

        {/* OTP boxes */}
        <div className="mb-6 flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-11 rounded-xl border-2 bg-white/10 text-center text-xl font-bold text-white outline-none transition-all focus:border-green-400 focus:bg-white/20"
              style={{ borderColor: digit ? "#22c55e" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2.5 text-center text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Verify button */}
        <button
          onClick={submit}
          disabled={loading || otp.join("").length < 6}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-400 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
            : <><CheckCircle2 className="h-4 w-4" /> Verify &amp; Continue</>
          }
        </button>

        {/* Resend */}
        <div className="text-center text-sm">
          {canResend ? (
            <button
              onClick={resend}
              disabled={resending}
              className="font-semibold text-green-400 hover:text-white transition-colors"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          ) : (
            <span className="text-green-400/60">
              Resend code in <span className="font-bold text-green-300">{countdown}s</span>
            </span>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-green-400">
          Wrong number?{" "}
          <Link href="/register" className="font-semibold text-white hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense>
      <VerifyPhoneForm />
    </Suspense>
  );
}
