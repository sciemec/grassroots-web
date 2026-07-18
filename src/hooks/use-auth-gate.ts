"use client";

// src/hooks/use-auth-gate.ts
//
// Drop this hook into any button or form where a user tries to DO something.
// If they're logged in → the action runs immediately.
// If they're not logged in → a gentle sign-up prompt appears instead.
// The user can always dismiss and keep browsing.
//
// Usage:
//   const { requireAuth } = useAuthGate();
//
//   <button onClick={() => requireAuth(() => handleUpload(), { feature: "upload a video" })}>
//     Upload Video
//   </button>

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export interface AuthGateOptions {
  feature?:    string;   // e.g. "upload a video", "save to showcase"
  returnPath?: string;   // where to send them after login/register
}

export function useAuthGate() {
  const token      = useAuthStore((s) => s.token);
  const isLoggedIn = !!token;
  const router     = useRouter();

  const [showPrompt,    setShowPrompt]    = useState(false);
  const [gateOptions,   setGateOptions]   = useState<AuthGateOptions>({});

  const requireAuth = useCallback(
    (action: () => void, options: AuthGateOptions = {}) => {
      if (isLoggedIn) {
        action();
      } else {
        setGateOptions(options);
        setShowPrompt(true);
      }
    },
    [isLoggedIn],
  );

  const goToRegister = useCallback(() => {
    const path = gateOptions.returnPath
      ? `/register?returnTo=${encodeURIComponent(gateOptions.returnPath)}`
      : "/register";
    router.push(path);
    setShowPrompt(false);
  }, [gateOptions.returnPath, router]);

  const goToLogin = useCallback(() => {
    const path = gateOptions.returnPath
      ? `/login?returnTo=${encodeURIComponent(gateOptions.returnPath)}`
      : "/login";
    router.push(path);
    setShowPrompt(false);
  }, [gateOptions.returnPath, router]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return { isLoggedIn, requireAuth, showPrompt, gateOptions, goToRegister, goToLogin, dismiss };
}
