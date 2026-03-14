"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function ConfirmContent() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    const email = params.get("email") ?? "";

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }

    api
      .get(`/auth/email/verify`, { params: { token, email } })
      .then(() => {
        setStatus("success");
        setTimeout(() => {
          router.push(user ? "/welcome" : "/login");
        }, 2500);
      })
      .catch((err) => {
        const msg =
          err.response?.data?.message ??
          "Verification failed. The link may have expired.";
        setStatus("error");
        setMessage(msg);
      });
  }, [params, router, user]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-400" />
            <h1 className="text-xl font-bold text-white">Verifying your email…</h1>
            <p className="mt-2 text-sm text-green-400">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/40">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Email verified!</h1>
            <p className="mt-3 text-sm text-green-300">
              Your account is now active. Redirecting you to your dashboard…
            </p>
            <div className="mt-6">
              <Link
                href="/welcome"
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-400"
              >
                Get started →
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-500/40">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Verification failed</h1>
            <p className="mt-3 text-sm text-red-300">{message}</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/verify-email"
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-400"
              >
                Request a new link
              </Link>
              <Link href="/login" className="text-sm text-green-400 transition-colors hover:text-white">
                Sign in instead
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-green-950" />}>
      <ConfirmContent />
    </Suspense>
  );
}
