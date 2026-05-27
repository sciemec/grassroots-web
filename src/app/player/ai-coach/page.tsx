import { redirect } from "next/navigation";

// THUTO circle on all /player pages now handles AI coaching.
// Old bookmarks land on the player hub where THUTO is always available.
export default function PlayerAiCoachRedirect() {
  redirect("/player");
}
