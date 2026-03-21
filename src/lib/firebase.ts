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

// Shared confirmation result — set by registration form, read by verify-phone page.
// Lives in module scope so it survives client-side navigation between pages.
let _pendingConfirmation: ConfirmationResult | null = null;

export const getPendingConfirmation = () => _pendingConfirmation;
export const setPendingConfirmation = (r: ConfirmationResult) => { _pendingConfirmation = r; };
export const clearPendingConfirmation = () => { _pendingConfirmation = null; };
