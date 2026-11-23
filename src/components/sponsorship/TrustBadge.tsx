export type TrustLevel =
  | "coach_vouched"
  | "community_vouched"
  | "grs_verified"
  | "unverified"
  | null
  | undefined;

const CFG: Record<string, { label: string; bg: string; color: string }> = {
  coach_vouched:     { label: "Coach Vouched",     bg: "#d1fae5", color: "#065f46" },
  community_vouched: { label: "Community Vouched",  bg: "#fef3c7", color: "#92400e" },
  grs_verified:      { label: "GRS Verified",       bg: "#dbeafe", color: "#1e40af" },
};

export default function TrustBadge({ level }: { level: TrustLevel }) {
  if (!level || level === "unverified" || !CFG[level]) return null;
  const { label, bg, color } = CFG[level];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: bg, color }}
    >
      ✓ {label}
    </span>
  );
}
