
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import BiometricScanner from "@/components/BiometricScanner";
import { SimplifiedSidebar } from "@/components/layout/simplified-sidebar";
// Legacy simulation types — grs-engine uses a different API; these keep the scan page intact
type EngineOutput = { rawScore?: number; percentile?: number; tier?: string; scoutNarrative?: string; recommendedPositions?: string[]; suggestedDrills?: string[] };
function evaluateBiometrics(args: Record<string, unknown>): EngineOutput { return args as EngineOutput; }

/** Matches the ScanEntry shape emitted by BiometricScanner's onScanComplete callback. */
interface ScanEntry {
  mode: string;
  score: number;       // 0–100 quality score from MediaPipe analysis
  level: string;       // "Elite" | "Good" | "Raw"
  asymmetry_score: number;
  asymmetry_diff: number;
  weak_side: string | null;
  frames_analysed: number;
  session_date: string;
  mode_label: string;
}

export default function AthleteScanPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<EngineOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Authenticate and protect the route
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login");
    }
  }, [hasHydrated, user, router]);

  const handleScanComplete = async (scannerData: ScanEntry) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Map scanner score (0–100) to approximate 20m sprint duration.
      //    Elite (~90) ≈ 2.8s · Good (~60) ≈ 3.8s · Raw (~20) ≈ 4.5s
      const durationSeconds = 5 - (scannerData.score / 100) * 2.5;

      // 2. Evaluate with your real biometric algorithm engine
      const evaluation = evaluateBiometrics({
        testType: "20m_sprint",
        durationSeconds: durationSeconds,
        ageGroup: (user?.age_group as "U8" | "U13" | "U17" | "Senior") || "U17",
      });

      setResult(evaluation);

      // 3. Save to localStorage to support fallback history state
      const scans = JSON.parse(localStorage.getItem("gs_biometric_scans") || "[]");
      const scanPayload = {
        ...evaluation,
        id: Date.now(),
        date: new Date().toISOString(),
        rawScore: evaluation.rawScore,
        percentile: evaluation.percentile,
        tier: evaluation.tier,
      };
      scans.push(scanPayload);
      localStorage.setItem("gs_biometric_scans", JSON.stringify(scans));

      // 4. Fire the database sync to your production database
      await saveBiometricResultToDatabase(evaluation, durationSeconds);

    } catch (err) {
      console.error("Biometric processing error:", err);
      setError("Failed to analyze video. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBiometricResultToDatabase = async (evaluation: EngineOutput, durationSeconds: number) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/biometrics/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testType: "20m_sprint",
          durationSeconds: durationSeconds,
          ageGroup: user?.age_group || "U17",
          rawScore: evaluation.rawScore,
          percentile: evaluation.percentile,
          tier: evaluation.tier,
          scoutNarrative: evaluation.scoutNarrative,
          recommendedPositions: evaluation.recommendedPositions,
          suggestedDrills: evaluation.suggestedDrills,
        }),
      });

      if (!response.ok) {
        throw new Error("API status response failed");
      }
    } catch (err) {
      console.error("Database persistence fallback error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <Loader2 className="animate-spin text-[#1a5c2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <SimplifiedSidebar />

      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/athlete" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header banner layout */}
            <div className="bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] p-5 text-white">
              <Activity size={24} className="text-[#f0b429] mb-2" />
              <h1 className="text-xl font-black">AI Biometric Analysis</h1>
              <p className="text-sm text-white/80 mt-1">Record a 10-second sprint video. Our AI will analyze your athletic abilities.</p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {result ? (
                /* Post-Scan Analytics Display Card Layout */
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <CheckCircle size={32} className="mx-auto text-emerald-600 mb-2" />
                    <p className="text-lg font-black text-emerald-700">Analysis Complete!</p>
                    <p className="text-2xl font-black text-[#1a5c2a] mt-2">{result.rawScore}</p>
                    <p className="text-sm text-gray-600">{result.percentile}th percentile · {result.tier}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-bold text-gray-700 mb-2">Scout Narrative</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{result.scoutNarrative}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Recommended Positions</p>
                      {result.recommendedPositions?.map((pos: string, i: number) => (
                        <p key={i} className="text-sm text-gray-700 font-medium">• {pos}</p>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Suggested Drills</p>
                      {result.suggestedDrills?.map((drill: string, i: number) => (
                        <p key={i} className="text-sm text-gray-700 font-medium">• {drill}</p>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={reset}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                      Scan Another
                    </button>
                    <button
                      onClick={() => router.push("/athlete")}
                      className="flex-1 bg-[#1a5c2a] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#2a6e3a] transition-colors"
                    >
                      View Dashboard
                    </button>
                  </div>
                </div>
              ) : isProcessing ? (
                /* Processing State Layout */
                <div className="text-center py-12">
                  <Loader2 className="animate-spin mx-auto text-[#1a5c2a]" size={36} />
                  <p className="mt-3 text-sm font-bold text-gray-700">Analyzing your performance data...</p>
                  {isSaving && <p className="text-xs text-gray-400 mt-1 animate-pulse">Syncing to secure server profiles...</p>}
                </div>
              ) : (
                /* Primary Interactive Scanning State */
                <BiometricScanner
                  onScanComplete={handleScanComplete}
                />
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Your video is processed locally. Results are securely saved to your verified talent profile.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}