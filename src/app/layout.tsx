import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PwaBanner } from "@/components/pwa/install-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const APP_URL = "https://grassrootssports.live";
const APP_NAME = "Grassroots Sport Pro";
const APP_DESC =
  "Zimbabwe's AI-powered multi-sport platform. Train smarter, get scouted, grow your game. Football, rugby, netball and 7 more sports — built for Africa's grassroots athletes.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESC,
  keywords: [
    "Zimbabwe football", "grassroots sport", "AI coaching", "player scouting",
    "youth development", "ZIFA", "African sport", "football training",
  ],
  authors: [{ name: "Grassroots Sport Pro" }],
  creator: "Grassroots Sport Pro",
  publisher: "Grassroots Sport Pro",
  applicationName: APP_NAME,
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_ZW",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESC,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Grassroots Sport Pro — Zimbabwe's AI Sports Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESC,
    images: ["/og-image.png"],
    creator: "@grassrootsports",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <PwaBanner />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}`,
          }}
        />
      </body>
    </html>
  );
}
