
"use client";

import { useState } from "react";
import { Target, AlertCircle } from "lucide-react";

interface ManualTimeInputProps {
  testType: "20m_sprint" | "vertical_leap" | "pro_agility";
  ageGroup: string;
  onSubmit: (durationSeconds: number) => void;
}

export function ManualTimeInput({ testType, ageGroup, onSubmit }: ManualTimeInputProps) {
  const [duration, setDuration] = useState<string>("");
  const [error, setError] = useState<string>("");

  const config = {
    "20m_sprint": { 
      min: 2.5, 
      max: 6.0, 
      placeholder: "e.g., 3.2", 
      label: "Time (seconds)",
      expectedRange: "2.5 - 6.0 seconds"
    },
    "vertical_leap": { 
      min: 0.2, 
      max: 0.8, 
      placeholder: "e.g., 0.48", 
      label: "Hang Time (seconds)",
      expectedRange: "0.2 - 0.8 seconds"
    },
    "pro_agility": { 
      min: 4.0, 
      max: 7.0, 
      placeholder: "e.g., 4.8", 
      label: "Time (seconds)",
      expectedRange: "4.0 - 7.0 seconds"
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(duration);
    
    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }
    
    const { min, max } = config[testType];
    if (value < min || value > max) {
      setError(`Time should be between ${min} and ${max} seconds for ${ageGroup} age group`);
      return;
    }
    
    setError("");
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs text-blue-800">
          Enter your measured time from a stopwatch or timing gates
        </p>
      </div>
      
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          {config[testType].label}
        </label>
        <input
          type="number"
          step="0.01"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder={config[testType].placeholder}
          className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
          required
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Expected range: {config[testType].expectedRange} for {ageGroup}
        </p>
      </div>
      
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
      >
        <Target size={14} />
        Process Results
      </button>
    </form>
  );
}