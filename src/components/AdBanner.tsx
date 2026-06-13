// src/components/AdBanner.tsx
import React from 'react';

interface AdBannerProps {
  tier: 'GOLD' | 'SILVER' | 'BRONZE';
  targetUrl?: string | null;   // The link the user goes to when clicking the ad
  sponsorName?: string | null; // The text name of the partner company
  imageUrl?: string | null;    // Custom image path from your database or public assets folder
}

export default function AdBanner({ tier, targetUrl, sponsorName, imageUrl }: AdBannerProps) {
  // Fallbacks: If no dynamic link or name is supplied, use these defaults
  const destination = targetUrl || 'https://grassrootssports.live';
  const displaySponsor = sponsorName || 'Official Partner';

  // ==========================================
  // 🥇 GOLD TIER: Premium 300x250 Display Ad
  // ==========================================
  if (tier === 'GOLD') {
    // Check if we have a real image to display (either dynamic URL or local asset)
    const goldAdImage = imageUrl || "/assets/sponsors/default-gold-banner.png";

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[10px] font-bold text-amber-600 block mb-2 uppercase tracking-wide">
          Gold Tournament Partner
        </span>
        
        <a 
          href={destination} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block h-[250px] relative border border-gray-200 rounded overflow-hidden transition-all duration-200 hover:border-amber-500 hover:shadow-md"
        >
          {/* If you have an image asset ready, this renders it perfectly */}
          <img 
            src={goldAdImage} 
            alt={`${displaySponsor} Advertisement`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // If the image path breaks or doesn't exist yet, gracefully fall back to a clean text block
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = "w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 font-medium p-4 text-center";
                fallbackDiv.innerHTML = `<span class="text-sm font-bold text-gray-700">${displaySponsor}</span><span class="text-[11px] text-gray-400 mt-1">Tap to visit partner website</span>`;
                parent.appendChild(fallbackDiv);
              }
            }}
          />
        </a>
      </div>
    );
  }

  // ==========================================
  // 🥈 SILVER TIER: Native Metrics Sponsor Block
  // ==========================================
  if (tier === 'SILVER') {
    return (
      <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
        <span className="text-[9px] text-gray-400 block mb-1 uppercase tracking-wider">
          Silver Metrics Sponsor
        </span>
        
        <a 
          href={destination}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 hover:bg-emerald-100 transition duration-150"
        >
          Match telemetry & analytics powered by <br />
          <span className="underline font-bold text-sm text-emerald-900 block mt-1">
            {displaySponsor}
          </span>
        </a>
      </div>
    );
  }

  // ==========================================
  // 🥉 BRONZE TIER: Left Sidebar Classified Space
  // ==========================================
  // Default to Bronze if no specific tier matches
  const bronzeAdImage = imageUrl || null;

  return (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-center">
      <span className="text-[9px] text-gray-400 block mb-2 uppercase tracking-wider">
        Bronze Grassroots Sponsor
      </span>

      <a 
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-[120px] relative border border-dashed border-gray-300 rounded overflow-hidden hover:border-gray-400 transition bg-gray-50"
      >
        {bronzeAdImage ? (
          <img 
            src={bronzeAdImage} 
            alt={`${displaySponsor} Classified`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-gray-500">
            <span className="font-semibold text-xs text-gray-700">{displaySponsor}</span>
            <span className="text-[10px] text-gray-400 mt-1">Local Academy & Apparel Space</span>
          </div>
        )}
      </a>
    </div>
  );
}