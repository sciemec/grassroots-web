"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Phone OTP auth has been replaced with email/password.
// This page redirects to login in case anyone has a stale link.
export default function VerifyPhonePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/login"); }, [router]);
  return null;
}
