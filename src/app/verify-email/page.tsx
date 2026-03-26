"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck, Loader2, RefreshCw } from "lucide-react";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "@/firebase";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const handleResend = async () => {
    setResending(true);
    setResendError("");
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setResent(true);
      } else {
        setResendError("Please go back to login and sign in again to resend.");
      }
    } catch {
      setResendError("Could not resend email. Please try again.");
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
            <img src="/logo_v2.png" alt="Grassroots Sport" width={64} height={64} className="mx-auto mb-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm text-center space-y-5">

          <div className="flex justify-center">
            <div className="rounded-full bg-green-500/20 p-4">
              <MailCheck className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">Check your email</h1>
            <p className="mt-3 text-sm text-green-200 leading-relaxed">
              We have sent you a verification email to{" "}
              {email && <span className="font-semibold text-white">{email}</span>}.
              {" "}Please verify it and log in.
            </p>
          </div>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 transition-colors"
          >
            Go to Login
          </Link>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs text-green-400/70 mb-3">Didn&apos;t receive the email?</p>

            {resent ? (
              <p className="text-sm text-green-400">Email resent! Check your inbox.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center justify-center gap-2 mx-auto text-sm text-green-300 hover:text-white transition-colors disabled:opacity-50"
              >
                {resending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Resending&hellip;</>
                  : <><RefreshCw className="h-3.5 w-3.5" /> Resend verification email</>
                }
              </button>
            )}

            {resendError && (
              <p className="mt-2 text-xs text-orange-300">{resendError}</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}
