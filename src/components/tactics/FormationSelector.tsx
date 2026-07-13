// src/components/tactics/FormationSelector.tsx
"use client";

import { Formation } from "@/types/tactics";
import { FORMATIONS } from "@/lib/tactics-engine";

interface FormationSelectorProps {
  selected: Formation;
  onChange: (f: Formation) => void;
  mode: "player" | "coach";
}

export default function FormationSelector({ selected, onChange, mode }: FormationSelectorProps) {
  const formations = Object.keys(FORMATIONS) as Formation[];

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Formation
      </span>
      {formations.map((f) => {
        const posCount = FORMATIONS[f].positions.length;
        const isSelected = selected === f;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            title={`${f} — ${posCount} players`}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isSelected
                ? "bg-[#1a5c2a] text-white shadow-sm"
                : mode === "coach"
                ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"
            }`}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
