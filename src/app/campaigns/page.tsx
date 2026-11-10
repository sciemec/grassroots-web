import { redirect } from "next/navigation";

// /campaigns → /sponsorships (permanent redirect — platform renamed)
export default function CampaignsRedirect() {
  redirect("/sponsorships");
}
