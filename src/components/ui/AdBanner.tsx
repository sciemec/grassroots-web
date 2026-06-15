// src/components/ui/AdBanner.tsx
import { ADS_CONFIG } from "@/config/ads.config";

interface AdBannerProps {
  slot: string;
  className?: string;
  fallback?: boolean;
}

export function AdBanner({ slot, className = "", fallback = false }: AdBannerProps) {
  const ad = ADS_CONFIG[slot];

  // ── Nothing to show ───────────────────────────────────────────────────────
  if (!ad || !ad.active) {
    // No fallback requested → render nothing (fixes mobile corruption)
    if (!fallback) return null;

    // Fallback requested → show placeholder ONLY on desktop (md and up)
    // On mobile this element is hidden via "hidden md:flex" — this is what
    // was causing the striped visual corruption on the Player/Admin hub.
    return (
      <div
        className={`hidden md:flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center ${className}`}
        style={{ minHeight: 60 }}
      >
        <div>
          <p className="text-xs font-semibold text-gray-400">Advertise here</p>
          <p className="mt-0.5 text-[10px] text-gray-300">
            Contact{" "}
            <a href="mailto:sciemeq@gmail.com" className="underline hover:text-gray-500">
              sciemeq@gmail.com
            </a>{" "}
            to book this slot
          </p>
        </div>
      </div>
    );
  }

  // ── Active ad ─────────────────────────────────────────────────────────────
  return (
    <div className={className}>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ad.altText}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.imageUrl}
          alt={ad.altText}
          className="w-full rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    </div>
  );
}