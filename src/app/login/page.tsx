"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Phone } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, setPendingConfirmation } from "@/lib/firebase";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState("");
  const [error, setError]     = useState("");

  // ONE-TAP RETURN — skip login if already authenticated
  useEffect(() => {
    if (token && user) {
      router.replace(roleHomePath(user.role));
    }
  }, [token, user, router]);

  // Show verified/welcome messages
  const verified = searchParams.get("verified");
  const welcome  = verified === "1"
    ? "Phone verified! Welcome to Grassroots Sport."
    : null;

  const handleSend = async () => {
    if (!phone.trim()) { setError("Nyora nhamba yako. / Please enter your phone number."); return; }
    setLoading(true); setError(""); setStatus("Tirikutuma code... / Sending your code...");

    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      setPendingConfirmation(result);
      router.push(`/verify-phone?phone=${encodeURIComponent(phone.trim())}&mode=login`);
    } catch {
      // Auto-retry once before showing message
      try {
        setStatus("Zviri kutora nguva... / Taking a moment...");
        const verifier2 = new RecaptchaVerifier(auth, "recaptcha-container-retry", { size: "invisible" });
        const result2 = await signInWithPhoneNumber(auth, phone.trim(), verifier2);
        setPendingConfirmation(result2);
        router.push(`/verify-phone?phone=${encodeURIComponent(phone.trim())}&mode=login`);
      } catch {
        setStatus("");
        setError("Zvatadza. Edza zvakare. / Could not send code. Please try again.");
        setLoading(false);
      }
    }
  };

  // If already logged in, show nothing while redirecting
  if (token && user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_v2.png" alt="Grassroots Sport" width={64} height={64} className="mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-green-300">Enter your number to sign in</p>
        </div>

        {welcome && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/20 px-4 py-3 text-center text-sm text-green-300">
            {welcome}
          </div>
        )}

        <div id="recaptcha-container" />
        <div id="recaptcha-container-retry" />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-green-200">
              Phone / WhatsApp number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400/70" />
              <input
                type="tel"
                placeholder="+263 77 123 4567"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-3 text-white placeholder-green-400/50 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 text-sm"
              />
            </div>
            <p className="mt-1.5 text-xs text-green-400/70">
              We&apos;ll send a 6-digit code to verify it&apos;s you
            </p>
          </div>

          {status && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-300">
              <Loader2 className="h-4 w-4 animate-spin" /> {status}
            </div>
          )}
          {error && !status && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2.5 text-center text-sm text-orange-300">
              {error}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-400 disabled:opacity-50 transition-colors"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              : "Send Verification Code →"
            }
          </button>

          <p className="text-center text-xs text-green-400/60">
            Like WhatsApp — phone number, code, you&apos;re in.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-green-400">
          New to Grassroots Sport?{" "}
          <Link href="/register" className="font-semibold text-white hover:underline">
            Create account
          </Link>
        </p>
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
