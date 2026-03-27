"use client";

import { createContext, useContext, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

// ── Context ───────────────────────────────────────────────────────────────────
// Any component inside a hub can call useGuestGate() to trigger the modal.

interface GuestGateContextType {
  requireAuth: (action?: string) => boolean;
}

const GuestGateContext = createContext<GuestGateContextType>({
  requireAuth: () => true,
});

export function useGuestGate() {
  return useContext(GuestGateContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
// Wrap hub layouts with this so any child page can trigger the modal.

export function GuestGateProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen]     = useState(false);
  const [action, setAction] = useState("save your progress");

  const requireAuth = useCallback(
    (actionLabel = "save your progress"): boolean => {
      if (user) return true; // logged in — allow action
      setAction(actionLabel);
      setOpen(true);
      return false;          // guest — block action, show modal
    },
    [user]
  );

  return (
    <GuestGateContext.Provider value={{ requireAuth }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0f2614] border border-[#f0b429]/20 rounded-2xl p-8 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-[#f0b429]/10 border border-[#f0b429]/20 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">🔒</span>
            </div>

            <h2 className="text-white font-bold text-lg mb-2">
              Create a free account
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Register to {action} — takes 30 seconds, no credit card needed.
            </p>

            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full py-3 rounded-xl bg-[#f0b429] text-[#0a1a0e] font-semibold text-sm hover:bg-[#FFE44D] transition-colors"
                onClick={() => setOpen(false)}
              >
                Register Free →
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl border border-white/10 text-white/70 font-medium text-sm hover:border-white/30 hover:text-white transition-colors"
                onClick={() => setOpen(false)}
              >
                Sign In
              </Link>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 text-white/20 text-xs hover:text-white/40 transition-colors"
            >
              Continue exploring as guest
            </button>
          </div>
        </div>
      )}
    </GuestGateContext.Provider>
  );
}
