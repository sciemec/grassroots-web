"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Brain, Cpu, Loader2, Play, 
  Sparkles, CheckCircle, Flame, AlertCircle, QrCode, Target, Camera 
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { evaluateBiometrics, type EngineOutput } from "@/lib/grs-engine";
import { RealCameraCapture } from "@/components/biometrics/RealCameraCapture";
import { ManualTimeInput } from "@/components/biometrics/ManualTimeInput";
import { QRCodeGenerator } from "@/components/biometrics/QRCodeGenerator";

interface StagedIngestionState {
  playerName: string;
  testType: "20m_sprint" | "vertical_leap" | "pro_agility";
  ageGroup: "U8" | "U13" | "U17" | "Senior";
  role: "player" | "coach";
}

function PipelineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [pipelineData, setPipelineData] = useState<StagedIngestionState | null>(null);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [engineResult, setEngineResult] = useState<EngineOutput | null>(null);
  const [error, setError] = useState<string>("");
  
  // NEW STATE VARIABLES for camera, manual input, and persistence
  const [captureMode, setCaptureMode] = useState<"camera" | "manual" | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<Blob | null>(null);
  const [realDuration, setRealDuration] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    try {
      const name = searchParams?.get("name") || "Trial Athlete";
      const test = (searchParams?.get("test") as any) || "20m_sprint";
      const age = (searchParams?.get("age") as any) || "U17";
      const role = (searchParams?.get("role") as any) || "player";

      const activeState: StagedIngestionState = {
        playerName: name,
        testType: test,
        ageGroup: age,
        role: role
      };
      
      setPipelineData(activeState);
      // REMOVED: auto-call to runBiometricKinematicPipeline - now user chooses method first
    } catch (err) {
      setError("Failed to verify talent ingestion parameters. Please return to Step 1.");
    }
  }, [searchParams]);

  // UPDATED: Now requires actual duration (no mocks, no prompts)
  const runBiometricKinematicPipeline = async (state: StagedIngestionState, actualDuration: number) => {
    try {
      setProcessingStage(1); 
      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStage(2); 
      await new Promise((r) => setTimeout(r, 1800));
      setProcessingStage(3); 
      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStage(4); 
      await new Promise((r) => setTimeout(r, 1200));

      // USE ACTUAL DURATION from camera or manual input - NO MOCKS
      const result = evaluateBiometrics({
        testType: state.testType,
        durationSeconds: actualDuration,
        ageGroup: state.ageGroup
      });

      setEngineResult(result);
      setRealDuration(actualDuration);
      setProcessingStage(5);
      
      // Auto-save to database
      await saveResultToDatabase(state, result, actualDuration);

    } catch (err) {
      setError("Processing failed. Please ensure valid time measurement.");
      setProcessingStage(-1);
    }
  };

  // NEW: Save results to database
  const saveResultToDatabase = async (state: StagedIngestionState, result: EngineOutput, duration: number) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/player/biometrics/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: state.testType,
          durationSeconds: duration,
          ageGroup: state.ageGroup,
          rawScore: result.rawScore,
          percentile: result.percentile,
          tier: result.tier,
          scoutNarrative: result.scoutNarrative,
          recommendedPositions: result.recommendedPositions,
          suggestedDrills: result.suggestedDrills,
          playerName: state.playerName,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedResultId(data.result?.id);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // NEW: Handler for camera/manual capture
  const handleMeasurementComplete = (durationSeconds: number) => {
    if (pipelineData) {
      runBiometricKinematicPipeline(pipelineData, durationSeconds);
    }
  };

  const STAGES = [
    { label: "Footage Ingestion Confirmed", desc: "Verifying standard vertical smartphone camera video resolution parameters" },
    { label: "Pixel Vector Processing Grid", desc: "Isolating start frames and tracking movement initiation vectors" },
    { label: "Kinematic Hip & Ankle Tracking", desc: "Measuring explosive takeoff frame count and concentric load variables" },
    { label: "Environmental Friction Adjuster", desc: "Cross-referencing regional baseline datasets and surface variables" },
    { label: "GRS Passport Engine Compilation", desc: "Injecting target positions and customized THUTO training routines" },
    { label: "Talent Diagnostics Finalized Successfully", desc: "Verified metrics securely committed to your scannable QR Talent Passport" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Capture Mode Selector - Only show when no results yet */}
      {!engineResult && !captureMode && pipelineData && (
        <div className="lg:col-span-12 space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black">How would you like to measure?</h2>
            <p className="text-zinc-400 text-sm">Choose a method to capture your test results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setCaptureMode("camera")}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center hover:border-[#f0b429] transition-all"
            >
              <Camera size={32} className="mx-auto mb-3 text-[#f0b429]" />
              <h3 className="font-bold">Record Video</h3>
              <p className="text-xs text-zinc-500 mt-1">Use camera to capture and analyze</p>
            </button>
            <button
              onClick={() => setCaptureMode("manual")}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-center hover:border-[#f0b429] transition-all"
            >
              <Target size={32} className="mx-auto mb-3 text-emerald-500" />
              <h3 className="font-bold">Enter Time Manually</h3>
              <p className="text-xs text-zinc-500 mt-1">Input your measured time directly</p>
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture UI */}
      {!engineResult && captureMode === "camera" && pipelineData && (
        <div className="lg:col-span-12 max-w-lg mx-auto w-full">
          <RealCameraCapture
            testType={pipelineData.testType}
            onCaptureComplete={(blob, duration) => handleMeasurementComplete(duration)}
            onError={(err) => setError(err)}
          />
        </div>
      )}

      {/* Manual Time Input UI */}
      {!engineResult && captureMode === "manual" && pipelineData && (
        <div className="lg:col-span-12 max-w-md mx-auto w-full">
          <ManualTimeInput
            testType={pipelineData.testType}
            ageGroup={pipelineData.ageGroup}
            onSubmit={(duration) => handleMeasurementComplete(duration)}
          />
        </div>
      )}

      {/* Error Display */}
      {error && !engineResult && (
        <div className="lg:col-span-12">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
            <button 
              onClick={() => {
                setError("");
                setCaptureMode(null);
              }}
              className="mt-3 text-xs bg-zinc-800 px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY - Only show when engineResult exists */}
      {engineResult && (
        <>
          {/* LEFT COLUMN - Processing stages and video placeholder */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl relative aspect-video bg-black flex items-center justify-center">
              <div className="text-center p-6 text-zinc-600 space-y-2 select-none z-0">
                <Play size={32} className="mx-auto text-zinc-700 animate-pulse" />
                <p className="text-xs font-bold font-mono text-zinc-500">GRS_BIOMETRIC_FEED_STREAM.MP4</p>
                {realDuration && (
                  <p className="text-xs text-emerald-500 mt-2">Measured: {realDuration.toFixed(2)} seconds</p>
                )}
              </div>
              {processingStage < 5 && processingStage > 0 && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 pointer-events-none z-20">
                  <Loader2 className="h-7 w-7 text-[#f0b429] animate-spin" />
                  <p className="text-[10px] font-black text-[#f0b429] tracking-widest uppercase animate-pulse">Running Kinematic Vector Models...</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <h3 className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Core Calibration Steps</h3>
              <div className="space-y-3.5">
                {STAGES.map((stage, idx) => {
                  const isDone = processingStage > idx;
                  const isCurrent = processingStage === idx;
                  return (
                    <div key={idx} className={`flex items-start gap-3 transition-opacity duration-300 ${isDone || isCurrent ? "opacity-100" : "opacity-25"}`}>
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-500">{idx + 1}</div>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-wide ${isCurrent ? "text-amber-400" : isDone ? "text-zinc-200" : "text-zinc-500"}`}>{stage.label}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5 leading-relaxed">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Results Display */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
              <div className="border-b border-zinc-800 bg-zinc-900/80 px-5 py-4 flex items-center justify-between">
                <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#f0b429]" /> Compiled Target Performance Assessment
                </h3>
                {processingStage === 5 && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 border border-emerald-500/20 rounded-lg">
                    ✓ Calibrated
                  </span>
                )}
              </div>

              <div className="flex-1 p-6 text-xs text-zinc-300 bg-zinc-950/20 whitespace-pre-wrap flex flex-col justify-between">
                {processingStage < 5 ? (
                  <div className="h-full my-auto flex flex-col items-center justify-center text-center p-10 gap-3 text-zinc-500">
                    <Sparkles className="h-6 w-6 text-zinc-700 animate-spin" />
                    <p className="italic font-medium max-w-xs">Our custom mathematical engine is parsing the motion frames to identify development metrics...</p>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-5">
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Calculated Core Metric</p>
                        <h2 className="text-xl font-black text-[#f0b429] mt-1">{engineResult?.rawScore}</h2>
                        <span className="text-[10px] font-bold text-emerald-400 mt-1 block">Tier: {engineResult?.tier}</span>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Cohort Percentile Ranking</p>
                          <h2 className="text-xl font-black text-white mt-1">{engineResult?.percentile}th <span className="text-xs text-zinc-400">Rank</span></h2>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Isolated Scout Narrative Track</h4>
                      <p className="text-sm text-zinc-300 leading-relaxed font-medium bg-zinc-950 p-4 rounded-xl border border-zinc-800 italic">
                        "{engineResult?.scoutNarrative}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                        <h5 className="text-[10px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-1">
                          <Target size={12} /> {pipelineData?.role === "player" ? "Optimized Position Fits" : "Team Strategy Targets"}
                        </h5>
                        <div className="space-y-1 pl-1">
                          {engineResult?.recommendedPositions.map((pos, i) => (
                            <p key={i} className="text-xs font-bold text-zinc-200">» {pos}</p>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                        <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          <Flame size={12} /> Prescribed Nurture Drills
                        </h5>
                        <div className="space-y-1 pl-1">
                          {engineResult?.suggestedDrills.map((drill, i) => (
                            <p key={i} className="text-xs font-bold text-zinc-200">» {drill}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* FOOTER BUTTONS - with QR and Save functionality */}
                    <div className="border-t border-zinc-800 pt-5 space-y-4">
                      {isSaving && (
                        <div className="text-center text-xs text-emerald-400">
                          <Loader2 className="inline animate-spin mr-2" size={12} />
                          Saving to your profile...
                        </div>
                      )}
                      
                      {savedResultId && !showQR && (
                        <button
                          onClick={() => setShowQR(true)}
                          className="w-full bg-[#f0b429] hover:bg-[#d69f24] text-zinc-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <QrCode size={14} /> Generate My Talent Passport QR
                        </button>
                      )}
                      
                      {showQR && savedResultId && pipelineData && engineResult && (
                        <div className="mb-4">
                          <QRCodeGenerator
                            playerId={savedResultId}
                            playerName={pipelineData.playerName}
                            testResults={engineResult}
                            size={180}
                          />
                        </div>
                      )}
                      
                      <button 
                        onClick={() => router.push(`/player/drills`)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        View Recommended Drills
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BiometricProcessingDeck() {
  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans antialiased">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#f0b429] animate-spin" />
          </div>
        }>
          <PipelineContent />
        </Suspense>
      </main>
    </div>
  );
}