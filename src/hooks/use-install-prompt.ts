"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [isDismissed, setIsDismissed]     = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      // Track installation on the backend
      const ua  = navigator.userAgent.toLowerCase();
      const platform =
        /android/.test(ua) ? "android" :
        /iphone|ipad/.test(ua) ? "ios" :
        /windows/.test(ua) ? "windows" :
        /mac/.test(ua) ? "macos" :
        /linux/.test(ua) ? "linux" : "unknown";
      const browser =
        /edg\//.test(ua) ? "edge" :
        /chrome/.test(ua) ? "chrome" :
        /firefox/.test(ua) ? "firefox" :
        /safari/.test(ua) ? "safari" : "unknown";
      const device_type =
        /mobile|android|iphone/.test(ua) ? "mobile" :
        /tablet|ipad/.test(ua) ? "tablet" : "desktop";
      api.post("/pwa-install", { platform, browser, device_type }).catch(() => {});
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setIsDismissed(true);
    setInstallPrompt(null);
  };

  const canInstall = !!installPrompt && !isInstalled && !isDismissed;

  return { canInstall, isInstalled, install, dismiss };
}
