// components/AttributeSlider.tsx
import { ReactNode } from 'react';

interface AttributeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: ReactNode;
  min?: number;
  max?: number;
  color?: string;
  showComparison?: number; // Team average
}

export function AttributeSlider({
  label,
  value,
  onChange,
  icon,
  min = 0,
  max = 100,
  color = 'emerald',
  showComparison,
}: AttributeSliderProps) {
  const getColorClass = (val: number) => {
    if (val >= 80) return `text-${color}-500`;
    if (val >= 60) return `text-amber-500`;
    return `text-red-500`;
  };

  const getTrackColor = (val: number) => {
    if (val >= 80) return `bg-${color}-500`;
    if (val >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className="text-xs font-semibold text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${getColorClass(value)}`}>
            {value}/100
          </span>
          {showComparison !== undefined && (
            <span className="text-[10px] text-gray-500">
              ⚡ Avg: {showComparison}
            </span>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`w-full accent-${color}-500 bg-gray-800 rounded-lg appearance-none h-1.5 cursor-pointer`}
        />
        {showComparison !== undefined && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-gray-400"
            style={{ left: `${showComparison}%` }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 whitespace-nowrap">
              avg
            </div>
          </div>
        )}
      </div>
    </div>
  );
}