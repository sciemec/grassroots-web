import { redirect } from "next/navigation";

export default function CampaignManageRedirectPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/account/cases/${params.id}`);
}
