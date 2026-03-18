"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setOffline(!navigator.onLine);

    const handleOffline = () => setOffline(true);
    const handleOnline  = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/15 px-4 py-2 text-xs font-medium text-yellow-400 shadow-lg backdrop-blur-sm">
      <WifiOff className="h-3.5 w-3.5" />
      Offline — AI replies from local knowledge base
    </div>
  );
}
