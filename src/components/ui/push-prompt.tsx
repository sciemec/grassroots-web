"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const STORAGE_KEY = "gs_push_dismissed";

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    // Only show if: SW supported, push supported, permission not yet granted/denied, not dismissed
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      Notification.permission !== "default" ||
      sessionStorage.getItem(STORAGE_KEY)
    ) return;

    // Delay so it doesn't fight with PWA install banner
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    setAsking(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Optionally subscribe to push here — for now just confirm
        setVisible(false);
      } else {
        dismiss();
      }
    } finally {
      setAsking(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-card shadow-2xl p-4">
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Stay consistent</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enable reminders to keep your training streak going and never miss a session.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={enable}
              disabled={asking}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {asking ? "Enabling…" : "Enable reminders"}
            </button>
            <button
              onClick={dismiss}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/5 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
