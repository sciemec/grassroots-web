"use client";

import { ALL_SPORTS } from "@/lib/use-sport";

interface SportSwitcherProps {
  activeSport: string;
  onSelect: (sport: string) => void;
  size?: "sm" | "md";
}

export default function SportSwitcher({
  activeSport,
  onSelect,
  size = "md",
}: SportSwitcherProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mb-1">
      <div className="flex gap-2 min-w-max px-0.5 py-1">
        {ALL_SPORTS.map((sport) => {
          const isActive = activeSport === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => onSelect(sport.id)}
              className={`flex items-center gap-1.5 rounded-full font-bold transition-all whitespace-nowrap shrink-0 ${
                size === "sm"
                  ? "text-[10px] px-2.5 py-1"
                  : "text-xs px-3 py-1.5"
              }`}
              style={{
                backgroundColor: isActive ? "#1a5c2a" : "white",
                color: isActive ? "white" : "#6b7280",
                border: `1.5px solid ${isActive ? "#1a5c2a" : "#e5e7eb"}`,
              }}
            >
              <span>{sport.emoji}</span>
              <span>{sport.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
