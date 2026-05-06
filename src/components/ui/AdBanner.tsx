import { ADS_CONFIG } from "@/config/ads.config";

interface AdBannerProps {
  slot: string;
  className?: string;
  /** If true, show an "Advertise here" placeholder when no ad is configured */
  fallback?: boolean;
}

/**
 * Renders an ad banner for the given slot.
 * Falls back to a "Advertise here" placeholder when slot is inactive and fallback=true.
 * Renders nothing when slot is inactive and fallback=false.
 */
export function AdBanner({ slot, className = "", fallback = false }: AdBannerProps) {
  const ad = ADS_CONFIG[slot];

  if (!ad || !ad.active) {
    if (!fallback) return null;

    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-center ${className}`}
        style={{ minHeight: 60 }}
      >
        <div>
          <p className="text-xs font-semibold text-white/40">Advertise here</p>
          <p className="mt-0.5 text-[10px] text-white/25">
            Contact{" "}
            <a href="mailto:sciemeq@gmail.com" className="underline hover:text-white/50">
              sciemeq@gmail.com
            </a>{" "}
            to book this slot
          </p>
        </div>
      </div>
    );
  }

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
