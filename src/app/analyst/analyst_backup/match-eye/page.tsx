"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Brain, Cpu, FileText, Loader2, Play, 
  Sparkles, CheckCircle, Flame, AlertCircle 
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

interface MatchEyeState {
  filename: string;
  fileKey: string;
  status: string;
  timestamp: string;
}

export default function MatchEyeProcessingDeck() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Pipeline management states
  const [sessionData, setSessionData] = useState<MatchEyeState | null>(null);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [aiReport, setAiReport] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 1. SESSION INITIALIZER LAYER
  useEffect(() => {
    const cached = localStorage.getItem("gs_match_eye_last");
    if (!cached) {
      setError("No active video feed ingestion detected. Please upload footage first.");
      return;
    }
    
    const parsed: MatchEyeState = JSON.parse(cached);
    setSessionData(parsed);

    // Trigger the multi-modal AI telemetry pipeline processing loop sequence
    runVideoProcessingPipeline(parsed.fileKey);
  }, []);

  // 2. SIMULATED COMPUTER VISION SUB-PROCESS TIMER STAGES
  // (In production, these checkpoints hook directly to WebSocket/Server-Sent Events)
  const runVideoProcessingPipeline = async (fileKey: string) => {
    try {
      setProcessingStage(1); // Stage 1: Reading pixel arrays
      await new Promise((r) => setTimeout(r, 4000));

      setProcessingStage(2); // Stage 2: Skeletal player tracking
      await new Promise((r) => setTimeout(r, 5000));

      setProcessingStage(3); // Stage 3: Compiling spatial xG metrics
      await new Promise((r) => setTimeout(r, 4000));

      setProcessingStage(4); // Stage 4: Synthesizing Claude Match Report
      
      // Step 3: Fetch the complete AI generation from your backend Gemini/Claude route
      const response = await fetch("/api/analyst/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey }),
      });

      if (!response.ok) throw new Error("AI reporting matrix returned a compilation failure.");
      
      const data = await response.json();
      setAiReport(data.report);
      setProcessingStage(5); // Complete!

      // Update local storage record status flag to permanent success
      localStorage.setItem("gs_match_eye_last", JSON.stringify({
        ...JSON.parse(localStorage.getItem("gs_match_eye_last") || "{}"),
        status: "completed"
      }));

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to finalize video model processing.");
      setProcessingStage(-1);
    }
  };

  const STAGES = [
    { label: "Footage Offline Queued", desc: "Awaiting framework loop initializations" },
    { label: "Pixel Array Stream Slicing", desc: "Gemini multi-modal vision grid parsing vectors" },
    { label: "Kinematic Tracking Map Engine", desc: "Running deep player identification skeletal models" },
    { label: "Tactical Spatial Matrix Layout", desc: "Compiling positional xG, passing coordinates, and ball trajectories" },
    { label: "Claude Report Synthesis", desc: "Structuring 5-section WhatsApp friendly coaching reports" },
    { label: "Analysis Finalized Successfully", desc: "Tactical performance dataset locked into live database sync" }
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        
        {/* Navigation bar trace */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <Link href="/analyst" className="rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-500 animate-pulse" /> Match Eye Telemetry Lab
              </h1>
              <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mt-1">
                Resource ID: {sessionData?.fileKey ? sessionData.fileKey.slice(0, 20) + "..." : "Acquiring..."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-zinc-300">Target File: {sessionData?.filename || "Loading..."}</span>
          </div>
        </div>

        {error ? (
          <div className="max-w-xl mx-auto border border-red-500/20 bg-red-500/5 rounded-2xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-red-400">{error}</p>
            <Link href="/analyst/match-eye" className="mt-4 inline-block text-xs font-bold bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-800">
              Return to Ingestion Portal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: LIVE VIDEO INTERFACE OR PIPELINE STEPS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl relative aspect-video bg-black flex items-center justify-center">
                {sessionData?.fileKey && (
                  <video 
                    ref={videoRef}
                    src={`${process.env.NEXT_PUBLIC_STORAGE_CDN_URL || ''}/${sessionData.fileKey}`}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
                {processingStage < 5 && processingStage > 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                    <p className="text-xs font-bold text-emerald-400 tracking-wider animate-pulse">Running AI Vision Arrays...</p>
                  </div>
                )}
              </div>

              {/* PIPELINE LIVE STEP REGISTRATION CHECKS */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                <h3 className="text-xs font-black tracking-widest text-zinc-500 uppercase">Processing Pipeline Checklist</h3>
                <div className="space-y-3">
                  {STAGES.map((stage, idx) => {
                    const isDone = processingStage > idx;
                    const isCurrent = processingStage === idx;
                    return (
                      <div key={idx} className={`flex items-start gap-3 transition-opacity duration-300 ${isDone || isCurrent ? "opacity-100" : "opacity-30"}`}>
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                          ) : isCurrent ? (
                            <Loader2 className="h-4 w-4 text-amber-500 anonymity-pulse animate-spin" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-500">{idx}</div>
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${isCurrent ? "text-amber-400" : isDone ? "text-zinc-200" : "text-zinc-500"}`}>{stage.label}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{stage.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REEVALUATED CLAUDE REPORT SYNTHESIS OUTPUT */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="border-b border-zinc-800 bg-zinc-900/80 px-5 py-4 flex items-center justify-between">
                  <h3 className="text-xs font-black tracking-widest text-zinc-400 uppercase flex items-center gap-2">
                    <Brain className="h-4 w-4 text-emerald-500" /> Compiled AI Match Intelligence Report
                  </h3>
                  {processingStage === 5 && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 border border-emerald-500/20 rounded-lg flex items-center gap-1">
                      <Flame className="h-3 w-3 fill-emerald-400" /> Ready to Broadcast
                    </span>
                  )}
                </div>

                <div className="flex-1 p-6 font-mono text-xs leading-relaxed text-zinc-300 bg-zinc-950/40 select-text whitespace-pre-wrap">
                  {processingStage < 5 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-3 text-zinc-500">
                      <Sparkles className="h-6 w-6 text-zinc-700 animate-spin" />
                      <p className="italic">AI vision matrix models are processing tracking maps from your bucket storage data arrays...</p>
                    </div>
                  ) : (
                    <div className="animate-fade-in text-sm font-sans bg-zinc-950 p-5 border border-zinc-800 rounded-xl leading-relaxed text-zinc-200 shadow-inner">
                      {aiReport}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}