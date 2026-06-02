"use client";

import { useState, useEffect } from "react";
import { Heart, Activity, Sliders, Timer, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function FatigueTracker({ playerId }: { playerId: string }) {
  const [step, setStep] = useState<"idle" | "peak_countdown" | "peak_input" | "resting" | "recovery_countdown" | "recovery_input" | "saving">("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  
  // Input form variables
  const [beatsPeak, setBeatsPeak] = useState<number>(0);
  const [beatsRecovery, setBeatsRecovery] = useState<number>(0);
  const [soreness, setSoreness] = useState(2);
  const [sleep, setSleep] = useState(4);
  const [stress, setStress] = useState(2);
  const [serverMessage, setServerMessage] = useState("");

  // Countdown clock engine layout loop
  useEffect(() => {
    if (secondsLeft <= 0) {
      if (step === "peak_countdown") setStep("peak_input");
      if (step === "resting") setStep("recovery_countdown");
      if (step === "recovery_countdown") setStep("recovery_input");
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, step]);

  const startTimer = (seconds: number, nextStep: typeof step) => {
    setSecondsLeft(seconds);
    setStep(nextStep);
  };

  const handleSavePipeline = async () => {
    setStep("saving");
    try {
      const res = await fetch("/api/analytics/log-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, beatsPeak, beatsRecovery, soreness, sleep, stress })
      });
      const result = await res.json();
      setServerMessage(result.message);
      setStep("idle");
    } catch {
      setServerMessage("Failed to submit telemetry metrics.");
      setStep("idle");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm max-w-md w-full space-y-6">
      <div className="flex items-center gap-2 border-b pb-3 border-gray-100">
        <Heart className="text-red-500 fill-red-500 animate-pulse" size={20} />
        <div>
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">Nurture Lifecycle Lab</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Manual Heart Rate Recovery & Fatigue Monitor</p>
        </div>
      </div>

      {/* ⏱️ LIVE TIMER SCREEN SECTION */}
      {secondsLeft > 0 && (
        <div className="bg-gray-950 text-center py-6 rounded-2xl border border-gray-800 space-y-1">
          <Timer className="mx-auto text-[#f0b429] animate-spin" size={28} />
          <h1 className="text-4xl font-mono font-black text-white">{secondsLeft}s</h1>
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">
            {step === "peak_countdown" || step === "recovery_countdown" ? "Count Every Pulse Beat Now" : "Rest Completely"}
          </p>
        </div>
      )}

      {/* 🧭 CONVERSION STEPS MACHINERY */}
      {step === "idle" && !serverMessage && (
        <button 
          onClick={() => startTimer(15, "peak_countdown")}
          className="w-full bg-[#1c3d22] hover:bg-[#234c2b] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
        >
          Initialize Post-Drill Pulse Evaluation
        </button>
      )}

      {step === "peak_input" && (
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase text-gray-500">How many pulse beats did you count in 15s?</label>
          <input 
            type="number" 
            placeholder="e.g. 42"
            onChange={(e) => setBeatsPeak(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
          />
          <button 
            onClick={() => startTimer(60, "resting")}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Lock Peak Pulse & Start 60s Rest Clock
          </button>
        </div>
      )}

      {step === "recovery_input" && (
        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase text-gray-500">Enter your 15s pulse recovery count now:</label>
          <input 
            type="number" 
            placeholder="e.g. 30"
            onChange={(e) => setBeatsRecovery(parseInt(e.target.value) || 0)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
          />

          {/* 🎛️ WELLNESS BIOMETRIC SLIDERS */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Wellness Input Fields</span>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>Muscle Soreness</span><span>Level {soreness}/5</span></div>
              <input type="range" min="1" max="5" value={soreness} onChange={(e) => setSoreness(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1c3d22]" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase"><span>Sleep Quality</span><span>Level {sleep}/5</span></div>
              <input type="range" min="1" max="5" value={sleep} onChange={(e) => setSleep(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1c3d22]" />
            </div>
          </div>

          <button 
            onClick={handleSavePipeline}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-xs"
          >
            Transmit Fatigue Matrix Data
          </button>
        </div>
      )}

      {step === "saving" && (
        <div className="text-center py-4 text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-[#1c3d22]" size={16} /> Compiling Heart Recovery Vectors...
        </div>
      )}

      {/* 📢 DYNAMIC SYSTEM FEEDBACK MESSAGES */}
      {serverMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          serverMessage.includes("🚨") ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-800"
        }`}>
          <p className="leading-relaxed">{serverMessage}</p>
          <button 
            onClick={() => setServerMessage("")}
            className="mt-3 block text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-800 underline"
          >
            Clear Log Matrix
          </button>
        </div>
      )}
    </div>
  );
}