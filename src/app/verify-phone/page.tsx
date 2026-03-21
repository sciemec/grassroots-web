"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, getPendingConfirmation, setPendingConfirmation, clearPendingConfirmation } from "@/lib/firebase";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import axios from "axios";
import api from "@/lib/api";
import { extractApiError } from "@/lib/api-error";

const MSG = {
  sending:   "Tirikutuma code... / Sending your code...",
  slow:      "Zviri kutora nguva... / Taking a moment...",
  verifying: "Tirikuchecka... / Verifying...",
  wrongCode: "Code isiriyo. Edza zvakare. / Wrong code. Try again.",
  expired:   "Code yapera nguva. Tuma zvakare. / Code expired. Resend.",
  fallback:  "Edza WhatsApp verification. / Try WhatsApp verification.",
};

function VerifyPhoneForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const mode  = searchParams.get("mode") ?? "register"; // "register" | "login"

  const { setAuth } = useAuthStore();

  const [otp, setOtp]           = useState(["","","","","",""]);
  const [status, setStatus]     = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const inputRefs        = useRef<(HTMLInputElement | null)[]>([]);
  const resendVerifierRef = useRef<RecaptchaVerifier | null>(null);

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
    if (code.length < 6) return;

    const confirmation = getPendingConfirmation();
    if (!confirmation) {
      setError("Sesheni yapera. Dzokerazve. / Session expired. Please go back.");
      return;
    }

    setLoading(true); setError(""); setStatus(MSG.verifying);

    try {
      const result  = await confirmation.confirm(code);
      const idToken = await result.user.getIdToken();

      if (mode === "login") {
        // Existing user — exchange Firebase token for our app token
        const res = await api.post("/auth/login-phone", { id_token: idToken });
        setAuth(res.data.token, res.data.user);
        clearPendingConfirmation();
        router.replace(roleHomePath(res.data.user.role));
      } else {
        // New user — complete registration
        const raw = sessionStorage.getItem("gs_phone_reg");
        const registrationData = raw ? JSON.parse(raw) : {};
        const res = await api.post("/auth/register-phone", { id_token: idToken, ...registrationData });
        setAuth(res.data.token, res.data.user);
        sessionStorage.removeItem("gs_phone_reg");
        clearPendingConfirmation();
        router.replace(roleHomePath(res.data.user.role));
      }
    } catch (e: unknown) {
      const newCount = failCount + 1;
      setFailCount(newCount);
      setStatus("");

      // If user not found, redirect to register
      if (axios.isAxiosError(e) && e.response?.data?.code === "USER_NOT_FOUND") {
        router.push(`/register?phone=${encodeURIComponent(phone)}`);
        return;
      }

      if (newCount >= 3) {
        setShowWhatsApp(true);
        setError(MSG.fallback);
      } else {
        const msg = extractApiError(e, "");
        setError(msg.includes("expired") ? MSG.expired : MSG.wrongCode);
      }
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.join("").length === 6 && !loading) {
      submit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const resend = async () => {
    setResending(true); setError(""); setShowWhatsApp(false); setFailCount(0);
    setStatus(MSG.sending);
    try {
      if (resendVerifierRef.current) { resendVerifierRef.current.clear(); resendVerifierRef.current = null; }
      const verifier = new RecaptchaVerifier(auth, "recaptcha-resend", { size: "invisible" });
      resendVerifierRef.current = verifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setPendingConfirmation(result);
      setOtp(["","","","","",""]);
      setCountdown(60); setCanResend(false); setStatus("");
      inputRefs.current[0]?.focus();
    } catch {
      setStatus("");
      setError("Zvatadza kutuma code. Edza zvakare. / Could not resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const whatsappUrl = `https://wa.me/263775285106?text=${encodeURIComponent(
    `Hi, I need help verifying my number ${phone} on Grassroots Sport.`
  )}`;

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
          <p className="mt-2 text-sm text-green-300">We sent a 6-digit code to</p>
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

        {/* Status — spinner, no red errors */}
        {status && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-green-300">
            <Loader2 className="h-4 w-4 animate-spin" /> {status}
          </div>
        )}

        {/* Friendly error — orange not red */}
        {error && !status && (
          <div className="mb-4 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-center text-sm text-orange-300">
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
            ? <><Loader2 className="h-4 w-4 animate-spin" /> {mode === "login" ? "Signing in…" : "Creating account…"}</>
            : <><CheckCircle2 className="h-4 w-4" /> Verify &amp; Continue</>
          }
        </button>

        {/* WhatsApp fallback — shown after 3 failed attempts */}
        {showWhatsApp && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-sm font-semibold text-green-300 hover:bg-green-500/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Get help on WhatsApp
          </a>
        )}

        {/* Resend */}
        <div className="text-center text-sm">
          {canResend ? (
            <button onClick={resend} disabled={resending} className="font-semibold text-green-400 hover:text-white transition-colors">
              {resending ? "Kutuma... / Sending…" : "Tumira zvakare / Resend code"}
            </button>
          ) : (
            <span className="text-green-400/60">
              Resend in <span className="font-bold text-green-300">{countdown}s</span>
            </span>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-green-400">
          Wrong number?{" "}
          <Link href={mode === "login" ? "/login" : "/register"} className="font-semibold text-white hover:underline">
            Go back
          </Link>
        </p>
      </div>

      <div id="recaptcha-resend" />
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
