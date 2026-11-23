import { redirect, notFound } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

export default async function CampaignDetailRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const res = await fetch(`${API_BASE}/campaigns/${params.id}/public`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return notFound();
    const { data } = await res.json();
    redirect(
      data?.public_code
        ? `/sponsorships/${data.public_code}`
        : `/sponsorships/${params.id}`
    );
  } catch {
    return notFound();
  }
}
