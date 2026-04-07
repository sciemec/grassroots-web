import { redirect } from "next/navigation";

// THUTO circle on all /coach pages now handles AI coaching.
// Old bookmarks land on the coach hub where THUTO is always available.
export default function CoachAiInsightsRedirect() {
  redirect("/coach");
}
