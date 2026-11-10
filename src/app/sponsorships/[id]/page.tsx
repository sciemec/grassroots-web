import type { Metadata } from "next";
import SponsorshipDetailClient from "./SponsorshipDetailClient";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
  try {
    const res = await fetch(`${base}/sponsorships/${params.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Not found");
    const json = await res.json();
    const c = json.data ?? json;

    const sport = c.sport ? `${c.sport.charAt(0).toUpperCase() + c.sport.slice(1)} · ` : "";
    const description = c.story_short ?? `${sport}Athlete sponsorship case on GrassRoots Sports.`;

    return {
      title: `${c.title} | GRS Sponsorships`,
      description,
      openGraph: {
        title: c.title,
        description,
        images: c.cover_image_url ? [{ url: c.cover_image_url }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: c.title,
        description,
        images: c.cover_image_url ? [c.cover_image_url] : [],
      },
    };
  } catch {
    return { title: "Sponsorship Case | GRS" };
  }
}

export default function SponsorshipDetailPage({ params }: PageProps) {
  return <SponsorshipDetailClient id={params.id} />;
}
