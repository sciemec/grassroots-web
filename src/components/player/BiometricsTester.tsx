// components/player/BiometricsTester.tsx
"use client";

import { useState } from "react";
import * as Icons from "lucide-react";

interface BiometricsTesterProps {
  playerId: string;
  playerName: string;
  ageGroup: string;
  onTestComplete?: (result: any) => void;
}

export function BiometricsTester({ playerId, playerName, ageGroup, onTestComplete }: BiometricsTesterProps) {
  const [testType, setTestType] = useState<"20m_sprint" | "vertical_leap" | "pro_agility">("20m_sprint");
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConfig = {
    "20m_sprint": {
      label: "20m Sprint",
      icon: Icons.Zap,
      description: "Linear speed test over 20 meters",
      unit: "seconds",
      placeholder: "e.g., 3.2",
      min: 2.5,
      max: 6.0,
    },
    "vertical_leap": {
      label: "Vertical Leap",
      icon: Icons.TrendingUp,
      description: "Explosive jumping power measurement",
      unit: "seconds (hang time)",
      placeholder: "e.g., 0.48",
      min: 0.2,
      max: 0.8,
    },
    "pro_agility": {
      label: "Pro Agility (5-10-5)",
      icon: Icons.GitBranch,
      description: "Change of direction speed test",
      unit: "seconds",
      placeholder: "e.g., 4.8",
      min: 4.0,
      max: 7.0,
    },
  };

  const config = testConfig[testType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/player/biometrics/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          durationSeconds,
          ageGroup,
          notes: `Test conducted via player portal`,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit test");

      const data = await response.json();
      setResult(data.result);
      onTestComplete?.(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit test");
    } finally {
      setIsLoading(false);
    }
  };

  const ConfigIcon = config.icon;

  if (result) {
    const tierColors = {
      "Elite (Class A)": "border-emerald-500 bg-emerald-50 text-emerald-700",
      "Competitive (Class B)": "border-amber-500 bg-amber-50 text-amber-700",
      "Developmental": "border-blue-500 bg-blue-50 text-blue-700",
    };

    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className={`p-5 border-b ${tierColors[result.tier as keyof typeof tierColors] || "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">{config.label} Results</h3>
              <p className="text-xs text-gray-500 mt-1">Test completed on {new Date(result.date).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{result.rawScore}</p>
              <p className="text-xs font-bold">{result.percentile}th Percentile</p>
            </div>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase text-gray-500 mb-2">Scout Narrative</h4>
            <p className="text-sm text-gray-700">{result.scoutNarrative}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-black uppercase text-gray-500 mb-2">Recommended Positions</h4>
              <div className="flex flex-wrap gap-1">
                {result.recommendedPositions.map((pos: string) => (
                  <span key={pos} className="text-xs bg-gray-100 px-2 py-1 rounded">{pos}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-gray-500 mb-2">Suggested Drills</h4>
              <div className="flex flex-wrap gap-1">
                {result.suggestedDrills.map((drill: string) => (
                  <span key={drill} className="text-xs bg-gray-100 px-2 py-1 rounded">{drill}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setResult(null)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold hover:bg-gray-50"
            >
              Test Another
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-[#1a5c2a] text-white py-2 rounded-xl text-sm font-bold hover:bg-[#1a5c2a]/90"
            >
              View All Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a5c2a]/10 flex items-center justify-center">
          <ConfigIcon size={20} className="text-[#1a5c2a]" />
        </div>
        <div>
          <h3 className="text-base font-black">{config.label} Test</h3>
          <p className="text-xs text-gray-500">{config.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Test Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(testConfig) as Array<keyof typeof testConfig>).map((type) => {
              const Icon = testConfig[type].icon;
              const isSelected = testType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTestType(type)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-[#1a5c2a] bg-[#1a5c2a]/5 text-[#1a5c2a]"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  <p className="text-[9px] font-bold uppercase">{testConfig[type].label.split(" ")[0]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Time ({config.unit})
          </label>
          <input
            type="number"
            step="0.01"
            value={durationSeconds || ""}
            onChange={(e) => setDurationSeconds(parseFloat(e.target.value))}
            placeholder={config.placeholder}
            min={config.min}
            max={config.max}
            required
            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
          />
          <p className="text-[9px] text-gray-400 mt-1">
            Enter your recorded time. {config.min}s - {config.max}s range expected for {ageGroup}.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || durationSeconds <= 0}
          className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1a5c2a]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Icons.Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Icons.ClipboardList size={16} />
              Submit Test
            </>
          )}
        </button>
      </div>
    </form>
  );
}