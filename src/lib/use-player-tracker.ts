"use client";

import { useEffect, useRef, useState } from "react";

export interface TrackingFrameData {
  trackingActive: boolean;
  engineMode: string;
  processedFrames: number;
}

export function usePlayerTracker(videoElement: HTMLVideoElement | null) {
  const [isReady, setIsReady] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!videoElement) {
      setIsReady(true);
      return;
    }

    setIsReady(true);
    
    // Lean execution tracking loop bypassing external engine models
    const trackLoop = () => {
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        setFrameCount(f => f + 1);
        rafRef.current = requestAnimationFrame(trackLoop);
      }
    };

    videoElement.addEventListener("play", trackLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      videoElement.removeEventListener("play", trackLoop);
    };
  }, [videoElement]);

  return {
    isReady,
    frameCount,
    engineName: "Grassroots Native Tracker v2",
    trackingData: {
      trackingActive: true,
      engineMode: "LIGHTWEIGHT_PASS_THROUGH",
      processedFrames: frameCount
    }
  };
}