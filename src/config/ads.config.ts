export interface AdSlot {
  imageUrl: string;
  linkUrl: string;
  altText: string;
  /** Set to true when an ad has been sold and the image is ready in public/ads/ */
  active: boolean;
}

/**
 * Ad slot configuration.
 * To activate a slot: drop the image into public/ads/, fill in imageUrl + linkUrl + altText, set active: true.
 * Images must be WebP format, max 200KB (Zimbabwe network optimisation).
 */
export const ADS_CONFIG: Record<string, AdSlot> = {
  /** 300×250 — right sidebar of player/coach/scout dashboards */
  "sidebar-top": {
    imageUrl: "/ads/econet-300x250.webp",
    linkUrl:  "https://econet.co.zw",
    altText:  "Econet Zimbabwe — Connect With Us",
    active:   false,
  },

  /** 728×90 leaderboard — below nav, above page content on all authenticated pages */
  "banner-below-nav": {
    imageUrl: "",
    linkUrl:  "",
    altText:  "",
    active:   false,
  },

  /** Full-width 1200×120 — landing page, between school pitch and features */
  "landing-mid": {
    imageUrl: "",
    linkUrl:  "",
    altText:  "",
    active:   false,
  },

  /** 300×250 — below player public profile, high-intent scout audience */
  "player-profile-bottom": {
    imageUrl: "",
    linkUrl:  "",
    altText:  "",
    active:   false,
  },
};
