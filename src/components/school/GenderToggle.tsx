"use client";

import type { Gender } from "@/data/school-gender-data";

interface GenderToggleProps {
  value: Gender;
  onChange: (gender: Gender) => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
      <button
        onClick={() => onChange("boys")}
        className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
          value === "boys"
            ? "bg-[#1a5c2a] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Boys
      </button>
      <button
        onClick={() => onChange("girls")}
        className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-all ${
          value === "girls"
            ? "bg-[#c8962a] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Girls
      </button>
    </div>
  );
}
