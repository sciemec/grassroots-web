import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SponsorshipDetailClient from "./SponsorshipDetailClient";

interface PageProps {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function fetchCase(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
  const url = UUID_RE.test(id)
    ? `${base}/sponsorships/${id}`
    : `${base}/sponsorships/by-code/${id}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? json;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const c = await fetchCase(params.id);
    if (!c) throw new Error("Not found");

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

export default async function SponsorshipDetailPage({ params, searchParams }: PageProps) {
  // Redirect legacy UUID links to canonical public_code URLs.
  // redirect() throws a NEXT_REDIRECT error internally — it must NOT be inside
  // a try/catch or the redirect is silently swallowed.
  if (UUID_RE.test(params.id)) {
    const c = await fetchCase(params.id).catch(() => null);
    if (c?.public_code) {
      const qs = searchParams?.submitted === "1" ? "?submitted=1" : "";
      redirect(`/sponsorships/${c.public_code}${qs}`);
    }
  }

  const submitted = searchParams?.submitted === "1";
  return <SponsorshipDetailClient id={params.id} submitted={submitted} />;
}
