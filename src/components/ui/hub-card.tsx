import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface HubCardProps {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Tailwind bg class e.g. "bg-[#1a5276]" */
  bg: string;
  /** Optional gradient overlay class */
  gradient?: string;
}

/**
 * Mobile-style hub card: colored background, white title, golden subtitle,
 * faded large icon bottom-right, "Open →" link.
 */
export function HubCard({ href, title, subtitle, icon: Icon, bg, gradient }: HubCardProps) {
  return (
    <Link href={href} className={`hub-card ${bg} ${gradient ?? ""}`}>
      {/* Faded background icon */}
      <Icon className="hub-card-icon" aria-hidden />

      {/* Content */}
      <p className="hub-card-title">{title}</p>
      <p className="hub-card-sub">{subtitle}</p>
      <p className="hub-card-open">Open →</p>
    </Link>
  );
}
