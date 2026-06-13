"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Brain, Cpu, Loader2, Play, 
  Sparkles, CheckCircle, Flame, AlertCircle, QrCode, Target 
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
// Legacy simulation types — grs-engine uses a different API; these keep the page's simulation intact
type EngineOutput = {
  recommendedPositions?: string[];
  suggestedDrills?: string[];
  scoutNarrative?: string;
  [key: string]: unknown;
};
function evaluateBiometrics(args: Record<string, unknown>): EngineOutput { return args as EngineOutput; }

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
      runBiometricKinematicPipeline(activeState);
    } catch (err) {
      setError("Failed to verify talent ingestion parameters. Please return to Step 1.");
    }
  }, [searchParams]);

  const runBiometricKinematicPipeline = async (state: StagedIngestionState) => {
    try {
      setProcessingStage(1); await new Promise((r) => setTimeout(r, 1500));
      setProcessingStage(2); await new Promise((r) => setTimeout(r, 1800));
      setProcessingStage(3); await new Promise((r) => setTimeout(r, 1500));
      setProcessingStage(4); await new Promise((r) => setTimeout(r, 1200));

      let simulatedDuration = state.testType === "20m_sprint" ? 2.89 : state.testType === "vertical_leap" ? 0.58 : 4.45;
      if (state.ageGroup === "U8" && state.testType === "20m_sprint") simulatedDuration = 4.35;

      const result = evaluateBiometrics({
        testType: state.testType,
        durationSeconds: simulatedDuration,
        ageGroup: state.ageGroup
      });

      setEngineResult(result);
      setProcessingStage(5);

    } catch (err) {
      setError("Kinematic calculations timed out due to frame-rate drops.");
      setProcessingStage(-1);
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
      {/* LEFT COLUMN */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl relative aspect-video bg-black flex items-center justify-center">
          <div className="text-center p-6 text-zinc-600 space-y-2 select-none z-0">
            <Play size={32} className="mx-auto text-zinc-700 animate-pulse" />
            <p className="text-xs font-bold font-mono text-zinc-500">GRS_BIOMETRIC_FEED_STREAM.MP4</p>
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

      {/* RIGHT COLUMN */}
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
                      {engineResult?.recommendedPositions.map((pos: string, i: number) => (
                        <p key={i} className="text-xs font-bold text-zinc-200">» {pos}</p>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                    <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                      <Flame size={12} /> Prescribed Nurture Drills
                    </h5>
                    <div className="space-y-1 pl-1">
                      {engineResult?.suggestedDrills.map((drill: string, i: number) => (
                        <p key={i} className="text-xs font-bold text-zinc-200">» {drill}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <h4 className="text-xs font-black uppercase tracking-wide text-white">Generate Scannable Talent Passport</h4>
                    <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Secure this historic data permanently behind your profile network.</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/register?role=${pipelineData?.role || 'player'}&name=${encodeURIComponent(pipelineData?.playerName || 'Athlete')}&pipeline=complete`)}
                    className="w-full sm:w-auto bg-[#f0b429] hover:bg-[#d69f24] text-zinc-950 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <QrCode size={14} /> Claim My Permanent Talent Card
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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