// src/app/campaigns/[id]/page.tsx
// Server component — generates OG/Twitter meta tags from live campaign data,
// then renders the client-side campaign detail page.

import { Metadata } from "next";
import CampaignDetailClient from "./CampaignDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${params.id}/public`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error("not found");

    const { data } = await res.json();

    const raisedPct = data.target_cents > 0
      ? Math.round((data.raised_cents / data.target_cents) * 100)
      : 0;

    const raisedUsd = (data.raised_cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const donorLine = data.donor_count > 0
      ? `${data.donor_count} donor${data.donor_count !== 1 ? "s" : ""} · `
      : "";

    const description =
      `${donorLine}${raisedPct}% funded · USD ${raisedUsd} raised — ` +
      (data.story_short || (data.story ?? "").slice(0, 130)).trim();

    const title = `${data.title} — GrassRoots Sports`;
    const url   = `${APP_URL}/campaigns/${params.id}`;
    const image = `${APP_URL}/og-image.png`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "GrassRoots Sports",
        type: "website",
        images: [{ url: image, width: 1200, height: 630, alt: data.title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Campaign — GrassRoots Sports",
      description: "Support a Zimbabwean athlete on GrassRoots Sports.",
      openGraph: {
        title: "Campaign — GrassRoots Sports",
        description: "Support a Zimbabwean athlete on GrassRoots Sports.",
        siteName: "GrassRoots Sports",
        images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630 }],
      },
    };
  }
}

export default function CampaignDetailPage() {
  return <CampaignDetailClient />;
}
