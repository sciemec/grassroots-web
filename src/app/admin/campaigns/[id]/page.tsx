import { redirect } from "next/navigation";
export default function AdminCampaignDetailRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/admin/sponsorships/${params.id}`);
}
