"use client";

import { Camera, AlertTriangle, Smartphone, Monitor } from "lucide-react";

interface CameraPermissionHelpProps {
  onRetry: () => void;
}

function getInstructions() {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent;
  const isIOS     = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari  = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isFirefox = /Firefox/.test(ua);

  if (isIOS && isSafari) {
    return {
      device: "iPhone / iPad",
      Icon: Smartphone,
      steps: [
        "Open the iPhone Settings app",
        "Scroll down and tap Safari",
        "Tap Camera → select Allow",
        "Come back here and tap Try Again",
      ],
    };
  }
  if (isAndroid) {
    return {
      device: "Android",
      Icon: Smartphone,
      steps: [
        "Tap the lock icon (🔒) in the address bar",
        "Tap Permissions → Camera",
        "Select Allow",
        "Tap Try Again below",
      ],
    };
  }
  if (isFirefox) {
    return {
      device: "Firefox",
      Icon: Monitor,
      steps: [
        "Click the camera blocked icon in the address bar",
        "Select 'Allow Camera Access'",
        "Click Try Again below",
      ],
    };
  }
  // Default — Chrome desktop
  return {
    device: "Chrome",
    Icon: Monitor,
    steps: [
      "Click the lock icon (🔒) in the address bar",
      "Click Site settings",
      "Set Camera to Allow",
      "Click Try Again below",
    ],
  };
}

export function CameraPermissionHelp({ onRetry }: CameraPermissionHelpProps) {
  const info = getInstructions();

  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>

      <div>
        <p className="font-semibold text-white">Camera access blocked</p>
        <p className="mt-1 text-xs text-white/50">
          Your browser has blocked camera access. Follow these steps to fix it:
        </p>
      </div>

      {info && (
        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left">
          <div className="mb-3 flex items-center gap-2">
            <info.Icon className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">{info.device}</span>
          </div>
          <ol className="space-y-2">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">
                  {i + 1}
                </span>
                <span className="text-xs text-white/70 leading-5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-[#0d1f12] hover:bg-amber-400 transition-colors"
      >
        <Camera className="h-4 w-4" />
        Try Again
      </button>

      <p className="text-[10px] text-white/30">
        After allowing, you may need to refresh the page once.
      </p>
    </div>
  );
}
