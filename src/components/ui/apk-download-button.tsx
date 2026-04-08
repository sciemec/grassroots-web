"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Monitor } from "lucide-react";

interface Props {
  className?: string;
  size?: "sm" | "lg";
}

export function ApkDownloadButton({ className = "", size = "lg" }: Props) {
  const [isAndroid, setIsAndroid] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  function handleDownload() {
    setDownloading(true);
    // Hit tracking route → redirects to APK
    window.location.href = "/api/download/apk";
    setTimeout(() => setDownloading(false), 3000);
  }

  if (isAndroid === null) {
    // SSR / hydrating — show neutral button
    return (
      <button
        onClick={handleDownload}
        className={`inline-flex items-center gap-2 rounded-xl font-bold transition hover:-translate-y-px ${
          size === "lg"
            ? "px-8 py-4 text-base"
            : "px-5 py-2.5 text-sm"
        } bg-[#E6A817] text-[#1a1a1a] ${className}`}
      >
        <Download className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        Download App (.apk)
      </button>
    );
  }

  if (isAndroid) {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`inline-flex items-center gap-2 rounded-xl font-bold transition hover:-translate-y-px disabled:opacity-70 ${
          size === "lg"
            ? "px-8 py-4 text-base"
            : "px-5 py-2.5 text-sm"
        } bg-[#E6A817] text-[#1a1a1a] ${className}`}
      >
        <Smartphone className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        {downloading ? "Starting download…" : "Download for Android"}
      </button>
    );
  }

  // Desktop — show QR hint
  return (
    <div className={`text-center ${className}`}>
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm text-white/60">
        <Monitor className="h-4 w-4" />
        Open this page on your Android phone to download
      </div>
    </div>
  );
}
