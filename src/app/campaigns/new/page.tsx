import { redirect } from "next/navigation";

// /campaigns/new → /sponsorships/new (permanent redirect — platform renamed)
export default function CampaignsNewRedirect() {
  redirect("/sponsorships/new");
}
