"use client";

import { Download, X, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useOnlineStatus } from "@/hooks/use-online-status";

/** Shows install prompt banner and offline/sync status indicator */
export function PwaBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt();
  const { isOnline, pendingSync, syncing, triggerSync } = useOnlineStatus();

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 shadow-lg backdrop-blur-sm">
            <WifiOff className="h-3.5 w-3.5" />
            You&apos;re offline — changes will sync when reconnected
          </div>
        </div>
      )}

      {/* Sync indicator when back online with pending items */}
      {isOnline && pendingSync > 0 && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/20 px-4 py-2 text-xs font-semibold text-green-300 shadow-lg backdrop-blur-sm hover:bg-green-500/30 disabled:opacity-60 transition-colors"
          >
            {syncing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wifi className="h-3.5 w-3.5" />
            )}
            {syncing ? "Syncing…" : `${pendingSync} change${pendingSync > 1 ? "s" : ""} pending sync`}
          </button>
        </div>
      )}

      {/* Install app banner */}
      {canInstall && (
        <div className="fixed bottom-16 left-4 right-4 z-50 mx-auto max-w-sm sm:left-auto sm:right-4 sm:bottom-4">
          <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-950/90 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/20">
              <span className="text-xl">⚽</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Install Grassroots Sport</p>
              <p className="text-xs text-green-400">Add to home screen for faster access</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={install}
                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-400 transition-colors"
              >
                <Download className="h-3 w-3" /> Install
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg p-1.5 text-green-400 hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
