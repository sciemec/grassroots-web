// Firebase client SDK — retained for future features (push notifications, analytics).
// Phone OTP auth has been replaced with email/password via Laravel.
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";

const firebaseConfig = {
  apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Kept for type compatibility — no longer used by any page.
let _pendingConfirmation: ConfirmationResult | null = null;
export const getPendingConfirmation  = () => _pendingConfirmation;
export const setPendingConfirmation  = (r: ConfirmationResult) => { _pendingConfirmation = r; };
export const clearPendingConfirmation = () => { _pendingConfirmation = null; };
