import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsorship Cases | GrassRoots Sports",
  description:
    "Support Zimbabwean athletes. Browse active sponsorship cases and connect directly with the athletes you want to back.",
  openGraph: {
    title: "Support a Zimbabwean Athlete | GRS Sponsorships",
    description:
      "Browse live sponsorship cases and help grassroots athletes get the support they need to reach their potential.",
    url: "https://grassrootssports.live/sponsorships",
    siteName: "GrassRoots Sports",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Support a Zimbabwean Athlete | GRS Sponsorships",
    description:
      "Browse live sponsorship cases and help grassroots athletes get the support they need.",
  },
};

export default function SponsorshipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
