"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Play, Square, RefreshCw, CheckCircle, Activity, Video } from "lucide-react";
import Link from "next/link";

export default function PlayerTrainPage() {
  const [phase, setPhase] = useState<"idle" | "capturing" | "processing" | "done">("idle");
  const [framesMapped, setFramesMapped] = useState(0);
  const [feedback, setFeedback] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => clearTelemetrySession();
  }, []);

  function clearTelemetrySession() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  async function startTrainingDrill() {
    setPhase("capturing");
    setFramesMapped(0);
    setFeedback("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        executionTrackingLoop();
      }
    } catch (err) {
      console.error("Camera feedback stream access rejected:", err);
      setPhase("idle");
    }
  }

  function executionTrackingLoop() {
    animationRef.current = requestAnimationFrame(() => {
      if (streamRef.current?.active && videoRef.current) {
        setFramesMapped(prev => {
          const next = prev + 1;
          // Render lightweight target interface
          renderNativeBoundingOverlay();
          
          // Auto cap evaluation duration lengths safely around 150 target frames
          if (next >= 150) {
            processDrillMetrics();
            return next;
          }
          executionTrackingLoop();
          return next;
        });
      }
    });
  }

  function renderNativeBoundingOverlay() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // Render Native Center Target Guide Line (Lean UI Overhead)
    ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(w * 0.3, h * 0.2, w * 0.4, h * 0.6);
    ctx.setLineDash([]);
  }

  function captureCurrentFrame(): string | null {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const tmp = document.createElement('canvas');
    tmp.width = video.videoWidth;
    tmp.height = video.videoHeight;
    const ctx = tmp.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return tmp.toDataURL('image/jpeg', 0.6).split(',')[1];
  }

  async function processDrillMetrics() {
    const base64 = captureCurrentFrame();
    clearTelemetrySession();
    setPhase("processing");

    try {
      const res = await fetch('/api/vision-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          context: 'Player performing an agility and stability drill. Analyse their body position, movement quality, and technique.',
        }),
      });
      const data = await res.json();
      setFeedback(data.feedback ?? 'Analysis complete. Ask your coach for detailed feedback.');
    } catch {
      setFeedback('Could not reach AI coach. Ask your coach to review your technique in person.');
    }
    setPhase("done");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/player" className="text-gray-400 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-base font-black text-gray-900">Drill Camera</h1>
            <p className="text-xs text-gray-400">Record your drill — AI coach gives feedback on your technique</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800">Active Drill</h2>
            <p className="text-xs text-gray-400 mt-0.5">Face the camera and perform your drill. Stop when done to get AI feedback.</p>
          </div>

          {/* Core Viewport Container Deck */}
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full mb-4">
            {phase === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Video size={24} />
                </div>
                <p className="text-sm font-medium text-gray-300">Face the frontend camera deck to initialize your setup</p>
              </div>
            )}

            {phase === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-center space-y-2">
                <RefreshCw size={24} className="text-emerald-500 animate-spin" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">Evaluating native parameter arrays...</p>
              </div>
            )}

            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>

          {/* AI Feedback */}
          {phase === "done" && feedback && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle size={14} /> AI Coach Feedback
              </span>
              <p className="text-sm text-gray-700 leading-relaxed mt-1">{feedback}</p>
            </div>
          )}

          {/* Interactive Flow Management Triggers */}
          <div className="flex gap-3">
            {phase === "idle" || phase === "done" ? (
              <button
                onClick={startTrainingDrill}
                className="flex-1 bg-[#1a5c2a] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition"
              >
                <Play size={14} /> {phase === "done" ? "Restart Exercise Session" : "Initialize Tracking Camera"}
              </button>
            ) : phase === "capturing" ? (
              <button
                onClick={processDrillMetrics}
                className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
              >
                <Square size={14} /> Stop Exercise & Calculate Results
              </button>
            ) : (
              <button disabled className="flex-1 bg-gray-100 text-gray-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <Activity size={14} className="animate-pulse" /> Compiling Engine Signals...
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}