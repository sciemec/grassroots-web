"use client";

import { SPORTS, SportKey } from "@/config/sports";
import { cn } from "@/lib/utils";

interface Props {
  /** Currently selected sport(s) */
  value: SportKey | SportKey[];
  /** Called with new selection */
  onChange: (value: SportKey | SportKey[]) => void;
  /** Allow multiple selections */
  multi?: boolean;
  /** Compact grid size */
  size?: "sm" | "md";
}

/** Reusable sport selector grid — single or multi-select */
export function SportSelector({ value, onChange, multi = false, size = "md" }: Props) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(key: SportKey) {
    if (!multi) {
      onChange(key);
      return;
    }
    const next = selected.includes(key)
      ? selected.filter((s) => s !== key)
      : [...selected, key];
    onChange(next);
  }

  return (
    <div className={cn(
      "grid gap-2",
      size === "sm" ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-5"
    )}>
      {SPORTS.map((sport) => {
        const active = selected.includes(sport.key);
        return (
          <button
            key={sport.key}
            type="button"
            onClick={() => toggle(sport.key)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-2 transition-all",
              size === "sm" ? "py-1.5" : "py-3",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted"
            )}
          >
            <span className={size === "sm" ? "text-base" : "text-2xl"}>{sport.emoji}</span>
            <span className={cn(
              "font-medium leading-tight text-center",
              size === "sm" ? "text-[10px]" : "text-xs"
            )}>
              {sport.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
