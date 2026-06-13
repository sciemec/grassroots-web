import React from 'react';
import Image from 'next/image';

interface TacticalPitchProps {
  pitchLogoLeftUrl?: string | null;
  pitchLogoRightUrl?: string | null;
  pitchSponsorName?: string | null;
}

export default function TacticalPitch({ 
  pitchLogoLeftUrl, 
  pitchLogoRightUrl, 
  pitchSponsorName 
}: TacticalPitchProps) {
  
  // Fallback to default branding or transparent spacer if no sponsor exists for this match
  const leftLogo = pitchLogoLeftUrl || "/assets/brand/grassroots-watermark-default.png";
  const rightLogo = pitchLogoRightUrl || "/assets/brand/grassroots-watermark-default.png";

  return (
    <div className="relative w-full aspect-[3/2] bg-emerald-600 rounded-lg border-2 border-white overflow-hidden shadow-inner">
      
      {/* --- STANDARD PITCH MARKINGS --- */}
      <div className="absolute inset-y-0 left-1/2 w-[2px] bg-white/50 transform -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 w-[20%] aspect-square border-2 border-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      
      {/* --- DYNAMIC WATERMARK SPACES --- */}
      {/* Left Side Watermark */}
      <div 
        className="absolute top-1/2 left-[26%] -translate-y-1/2 w-[14%] aspect-square opacity-15 pointer-events-none select-none filter grayscale contrast-200 mix-blend-overlay transition-all duration-300"
        title={pitchSponsorName || "Grassroots Pitch"}
      >
        <Image 
          src={leftLogo} 
          alt="Pitch Left Partner"
          fill
          className="object-contain"
          unoptimized // Useful if pulling images from external cloud storage like Cloudinary or AWS S3
        />
      </div>

      {/* Right Side Watermark */}
      <div 
        className="absolute top-1/2 right-[26%] -translate-y-1/2 w-[14%] aspect-square opacity-15 pointer-events-none select-none filter grayscale contrast-200 mix-blend-overlay transition-all duration-300"
        title={pitchSponsorName || "Grassroots Pitch"}
      >
        <Image 
          src={rightLogo} 
          alt="Pitch Right Partner"
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      {/* --- LIVE TELEMETRY / DOTS RENDER HERE --- */}
      <div className="absolute inset-0">
        {/* Your live player tracking markers layer beautifully on top */}
      </div>

    </div>
  );
}