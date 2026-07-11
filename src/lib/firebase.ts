// Firebase removed — auth is handled by Laravel JWT.
// Stub kept for any residual type imports.
import type { ConfirmationResult } from "firebase/auth";

export const auth = { currentUser: null };

let _pendingConfirmation: ConfirmationResult | null = null;
export const getPendingConfirmation  = () => _pendingConfirmation;
export const setPendingConfirmation  = (r: ConfirmationResult) => { _pendingConfirmation = r; };
export const clearPendingConfirmation = () => { _pendingConfirmation = null; };
