"use client";

/**
 * UploadGate — shared UI shown when the connection quality check is running
 * or when the video has been queued due to a weak connection.
 *
 * This is a pure display component. It does NOT import flushQueue or any
 * queue logic directly — the parent page handles those via callbacks.
 */

import { Wifi, Loader2 } from "lucide-react";
import type { UploadStrategyResult } from "@/lib/use-upload-strategy";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";

interface UploadGateProps {
  /** Current strategy result. Null while the probe is still running. */
  strategy: UploadStrategyResult | null;
  /** True while the connection check / probe is in progress. */
  probing: boolean;
  /** Called when user taps "Upload anyway" — parent should call flushQueue(). */
  onForceUpload: () => void;
  /** Called when user taps "Wait for better connection" — parent transitions UI. */
  onQueue: () => void;
}

export function UploadGate({ strategy, probing, onForceUpload, onQueue }: UploadGateProps) {
  // ── Probing state ──────────────────────────────────────────────────────────
  if (probing || strategy === null) {
    return (
      <div style={{
        border: `1.5px solid ${GOLD}`,
        borderRadius: 16,
        padding: "24px 20px",
        backgroundColor: "#fffbeb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        textAlign: "center",
      }}>
        <Loader2
          size={28}
          color={GOLD}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#92400e" }}>
          Checking connection…
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#b45309" }}>
          Measuring your upload speed. This takes a moment on mobile data.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Queue state ────────────────────────────────────────────────────────────
  // Only rendered when strategy.mode === "queue" (parent decides when to show this)
  const measured = strategy.snapshot.downlinkMbps;
  const speedText = measured !== null ? `${measured.toFixed(1)} Mbps measured` : "Speed unavailable";

  return (
    <div style={{
      border: `1.5px solid ${GOLD}`,
      borderRadius: 16,
      padding: "24px 20px",
      backgroundColor: "#fffbeb",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          backgroundColor: "#fef3c7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Wifi size={20} color={GOLD} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#92400e" }}>
            Waiting for a better connection
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#b45309", marginTop: 2 }}>
            {speedText} — below 2 Mbps upload threshold
          </p>
        </div>
      </div>

      {/* Explanation */}
      <p style={{ margin: 0, fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
        Your video has been queued and will upload automatically once your
        signal improves. <strong>Keep this tab open</strong> — the upload
        will start in the background.
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={onQueue}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            backgroundColor: GRS_GREEN,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Wait for better connection
        </button>
        <button
          onClick={onForceUpload}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: `1.5px solid ${GOLD}`,
            backgroundColor: "transparent",
            color: GOLD,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Upload anyway
        </button>
      </div>
    </div>
  );
}
