"use client";

import { useEffect, useState, useCallback } from "react";
import { syncAll, getPendingCount } from "@/lib/sync-manager";

export function useOnlineStatus() {
  const [isOnline, setIsOnline]         = useState(true);
  const [pendingSync, setPendingSync]   = useState(0);
  const [syncing, setSyncing]           = useState(false);
  const [lastSynced, setLastSynced]     = useState<Date | null>(null);

  const checkPending = useCallback(async () => {
    const count = await getPendingCount();
    setPendingSync(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { synced } = await syncAll();
      if (synced > 0) {
        setLastSynced(new Date());
        await checkPending();
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, checkPending]);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    checkPending();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync(); // auto-sync when connection restored
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkPending, triggerSync]);

  return { isOnline, pendingSync, syncing, lastSynced, triggerSync };
}
