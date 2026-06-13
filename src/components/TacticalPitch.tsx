import React from 'react';
import Image from 'next/image';

// Position → [left%, top%] on a landscape pitch (0,0 = top-left, 100,100 = bottom-right)
// Pitch is oriented: attack left → right. Defence on left, attack on right.
const POSITION_ZONES: Record<string, [number, number]> = {
  "goalkeeper":           [8,  50],
  "right back":           [22, 78],
  "left back":            [22, 22],
  "centre back":          [20, 50],
  "defensive midfielder": [38, 50],
  "central midfielder":   [50, 50],
  "attacking midfielder": [62, 50],
  "right winger":         [72, 82],
  "left winger":          [72, 18],
  "centre forward":       [78, 50],
  "striker":              [82, 50],
  // netball
  "goal shooter":         [85, 50],
  "goal keeper":          [12, 50],
  "centre":               [50, 50],
  "goal attack":          [70, 50],
  "goal defence":         [30, 50],
  "wing attack":          [65, 25],
  "wing defence":         [35, 25],
};

interface TacticalPitchProps {
  pitchLogoLeftUrl?: string | null;
  pitchLogoRightUrl?: string | null;
  pitchSponsorName?: string | null;
  position?: string | null;
}

export default function TacticalPitch({
  pitchLogoLeftUrl,
  pitchLogoRightUrl,
  pitchSponsorName,
  position,
}: TacticalPitchProps) {

  const leftLogo  = pitchLogoLeftUrl  || "/assets/brand/grassroots-watermark-default.png";
  const rightLogo = pitchLogoRightUrl || "/assets/brand/grassroots-watermark-default.png";

  const zone = position ? POSITION_ZONES[position.toLowerCase()] : null;

  return (
    <div className="relative w-full aspect-[3/2] bg-emerald-600 rounded-lg border-2 border-white overflow-hidden shadow-inner">

      {/* Pitch markings */}
      <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/50 transform -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-2 border-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      {/* Penalty areas */}
      <div className="absolute left-0 top-[25%] w-[16%] h-[50%] border-r-2 border-t-2 border-b-2 border-white/40" />
      <div className="absolute right-0 top-[25%] w-[16%] h-[50%] border-l-2 border-t-2 border-b-2 border-white/40" />

      {/* Sponsor watermarks */}
      <div
        className="absolute top-1/2 left-[26%] -translate-y-1/2 w-[14%] aspect-square opacity-15 pointer-events-none select-none filter grayscale contrast-200 mix-blend-overlay"
        title={pitchSponsorName || "Grassroots Pitch"}
      >
        <Image src={leftLogo} alt="Pitch Left Partner" fill className="object-contain" unoptimized />
      </div>
      <div
        className="absolute top-1/2 right-[26%] -translate-y-1/2 w-[14%] aspect-square opacity-15 pointer-events-none select-none filter grayscale contrast-200 mix-blend-overlay"
        title={pitchSponsorName || "Grassroots Pitch"}
      >
        <Image src={rightLogo} alt="Pitch Right Partner" fill className="object-contain" unoptimized />
      </div>

      {/* Position dot */}
      {zone && (
        <div
          className="absolute z-10 flex items-center justify-center"
          style={{ left: `${zone[0]}%`, top: `${zone[1]}%`, transform: "translate(-50%, -50%)" }}
        >
          <div className="w-5 h-5 rounded-full bg-[#f0b429] border-2 border-white shadow-lg animate-pulse" />
          <span
            className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white"
          >
            {position}
          </span>
        </div>
      )}

    </div>
  );
}