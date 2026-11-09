"use client";

import dynamic from "next/dynamic";

export const DynamicPlayerStories = dynamic(
  () => import("@/components/home/PlayerStories"),
  { ssr: false }
);

export const DynamicPublicVideoGrid = dynamic(
  () => import("@/components/home/PublicVideoGrid"),
  { ssr: false }
);

export const DynamicThutoChatVisitor = dynamic(
  () => import("@/components/thuto/ThutoChatVisitor"),
  { ssr: false }
);

export const DynamicCampaignStrip = dynamic(
  () => import("@/components/home/CampaignStrip"),
  { ssr: false }
);
