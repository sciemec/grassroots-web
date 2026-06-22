"use client";

import React, { useState, useRef, useEffect } from "react";
import { postToArena } from "@/lib/arena-poster";
import { ArrowLeft, Camera, Upload, ShieldCheck, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function TrainingScanPage() {
  const [trackingPhase, setTrackingPhase] = useState<"idle" | "tracking" | "analyzing" | "ready">("idle");
  const [framesCounted, setFramesCounted] = useState(0);
  const [metricsData, setMetricsData] = useState<{ feedback: string } | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const streamObjectRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => shutDownScannerStreams();
  }, []);

  function shutDownScannerStreams() {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamObjectRef.current) {
      streamObjectRef.current.getTracks().forEach(track => track.stop());
      streamObjectRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
      videoElementRef.current.src = "";
    }
  }

  async function activateLiveTrackingStream() {
    setTrackingPhase("tracking");
    setFramesCounted(0);
    setMetricsData(null);

    try {
      const captureStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamObjectRef.current = captureStream;

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = captureStream;
        await videoElementRef.current.play();
        executionMapCycle();
      }
    } catch {
      setTrackingPhase("idle");
    }
  }

  function executionMapCycle() {
    animationFrameRef.current = requestAnimationFrame(() => {
      if (streamObjectRef.current?.active && videoElementRef.current) {
        setFramesCounted(prev => {
          const currentCount = prev + 1;
          renderTelemetryTargetBounds();

          if (currentCount >= 120) {
            evaluateBiomechanicalTelemetry();
            return currentCount;
          }
          executionMapCycle();
          return currentCount;
        });
      }
    });
  }

  function renderTelemetryTargetBounds() {
    const canvas = canvasElementRef.current;
    const video = videoElementRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // Fast Native Boundary Corners Tracking Markers
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    const padding = w * 0.2;
    
    // Top Left Accent Ticks
    ctx.beginPath();
    ctx.moveTo(padding, padding + 20);
    ctx.lineTo(padding, padding);
    ctx.lineTo(padding + 20, padding);
    ctx.stroke();

    // Bottom Right Accent Ticks
    ctx.beginPath();
    ctx.moveTo(w - padding, h - padding - 20);
    ctx.lineTo(w - padding, h - padding);
    ctx.lineTo(w - padding - 20, h - padding);
    ctx.stroke();
  }

  function captureCurrentFrame(): string | null {
    const video = videoElementRef.current;
    if (!video || !video.videoWidth) return null;
    const tmp = document.createElement('canvas');
    tmp.width = video.videoWidth;
    tmp.height = video.videoHeight;
    const ctx = tmp.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return tmp.toDataURL('image/jpeg', 0.6).split(',')[1];
  }

  async function evaluateBiomechanicalTelemetry() {
    const base64 = captureCurrentFrame();
    shutDownScannerStreams();
    setTrackingPhase("analyzing");

    try {
      const res = await fetch('/api/vision-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          context: 'Player performing a posture and movement assessment. Analyse their body position, balance, and athletic stance.',
        }),
      });
      const data = await res.json();
      setMetricsData({ feedback: data.feedback });
    } catch {
      setMetricsData({ feedback: 'Could not reach AI coach. Ask your coach to review your form in person.' });
    }
    setTrackingPhase("ready");

    // Arena: IDENTIFY pillar — biometric scan activity surfaces to scouts
    postToArena(
      "Completed a biometric movement scan.",
      { postType: "milestone", metadata: { scan_type: "kinematic_assessment" } }
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/player" className="text-gray-400 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-black text-gray-900">Kinematic Assessment Studio</h1>
            <p className="text-xs text-gray-400">Verifies execution posture stability arrays cleanly</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800">Movement Scan</h2>
            <p className="text-xs text-gray-400 mt-0.5">Point the camera at your full body. AI coach will give feedback on what it observes.</p>
          </div>

          {/* Operational Viewfinder Canvas */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full mb-4">
            {trackingPhase === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ready to record tracking telemetry layers...</p>
              </div>
            )}

            {trackingPhase === "analyzing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center space-y-2">
                <RefreshCw size={20} className="text-blue-500 animate-spin" />
                <p className="text-xs font-extrabold text-white uppercase tracking-widest">Sending to AI coach...</p>
              </div>
            )}

            <video ref={videoElementRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasElementRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>

          {trackingPhase === "ready" && metricsData && (
            <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
              <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} /> AI Coach Feedback
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{metricsData.feedback}</p>
            </div>
          )}

          <div className="flex gap-3">
            {trackingPhase === "idle" || trackingPhase === "ready" ? (
              <button
                onClick={activateLiveTrackingStream}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
              >
                <Camera size={14} /> {trackingPhase === "ready" ? "Scan Again" : "Open Camera"}
              </button>
            ) : (
              <button
                onClick={evaluateBiomechanicalTelemetry}
                className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
              >
                <Activity size={14} className="animate-pulse" /> Stop & Get Feedback ({framesCounted} frames)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}