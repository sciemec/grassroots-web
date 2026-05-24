"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Registers the service worker via workbox-window and shows a gold banner
 * when a new SW version is waiting to activate.
 *
 * Pattern: workbox-window `waiting` event → banner → messageSkipWaiting()
 * → SW calls self.skipWaiting() → page reloads with new version.
 *
 * Replaces the raw navigator.serviceWorker.register() inline script in
 * layout.tsx so update detection is handled in one place.
 */
export function SwUpdateBanner() {
  const [waiting, setWaiting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wbRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    import("workbox-window").then(({ Workbox }) => {
      const wb = new Workbox("/sw.js");

      // `waiting` fires when a new SW has installed and is waiting to take over.
      // `externalwaiting` fires when a different tab triggered the install.
      wb.addEventListener("waiting", () => setWaiting(true));

      wbRef.current = wb;
      wb.register().catch(() => {/* silently ignore — no SW support */});
    }).catch(() => {/* workbox-window unavailable — graceful degradation */});
  }, []);

  const handleReload = () => {
    if (!wbRef.current) return;
    // Tell the waiting SW to skip waiting and take control immediately
    wbRef.current.messageSkipWaiting();
    setWaiting(false);
    window.location.reload();
  };

  if (!waiting) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 bg-[#f0b429] px-4 py-2.5 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1a3a1a]">
        <RefreshCw className="h-4 w-4 flex-shrink-0" />
        New version available — update for the latest features
      </div>
      <button
        onClick={handleReload}
        className="flex-shrink-0 rounded-lg bg-[#1a3a1a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#163020] transition-colors"
      >
        Reload
      </button>
    </div>
  );
}
