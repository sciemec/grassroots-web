import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, initializeRecaptchaConfig } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { useEffect, useRef } from "react";

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Initialise reCAPTCHA Enterprise config (required when Enterprise is enabled in Firebase Console).
// Fire-and-forget — if it fails the standard RecaptchaVerifier still works.
initializeRecaptchaConfig(auth).catch(() => {});

// Bypass reCAPTCHA widget entirely in non-production so test phone numbers work immediately.
// Set NEXT_PUBLIC_FIREBASE_TEST_MODE=true in Vercel preview environments if needed.
if (
  typeof window !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_FIREBASE_TEST_MODE === "true")
) {
  auth.settings.appVerificationDisabledForTesting = true;
}

// Shared confirmation result — set by registration form, read by verify-phone page.
// Lives in module scope so it survives client-side navigation between pages.
let _pendingConfirmation: ConfirmationResult | null = null;

export const getPendingConfirmation = () => _pendingConfirmation;
export const setPendingConfirmation = (r: ConfirmationResult) => { _pendingConfirmation = r; };
export const clearPendingConfirmation = () => { _pendingConfirmation = null; };

/**
 * Hook that pre-renders an invisible RecaptchaVerifier on mount so it is
 * fully ready before the user clicks "Send code".
 *
 * Returns:
 *   getVerifier() — returns the live verifier (creates one if cleared)
 *   resetVerifier() — clears the current verifier and pre-renders a new one
 *                     (call this after a send failure)
 */
export function useRecaptcha(containerId: string) {
  const ref = useRef<RecaptchaVerifier | null>(null);

  const initVerifier = (id: string) =>
    new RecaptchaVerifier(auth, id, { size: "invisible" });

  useEffect(() => {
    ref.current = initVerifier(containerId);
    return () => { ref.current?.clear(); ref.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getVerifier = () => {
    if (!ref.current) ref.current = initVerifier(containerId);
    return ref.current;
  };

  const resetVerifier = () => {
    ref.current?.clear();
    ref.current = initVerifier(containerId);
  };

  return { getVerifier, resetVerifier };
}
