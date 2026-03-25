import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors are caught in CI — don't block Vercel production builds
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["firebase"],

  webpack: (config) => {
    // Disable symlink resolution to avoid Windows readlink EISDIR issues
    config.resolve.symlinks = false;
    return config;
  },

  /**
   * FFmpeg.wasm requires SharedArrayBuffer which requires:
   *   Cross-Origin-Opener-Policy: same-origin
   *   Cross-Origin-Embedder-Policy: require-corp
   *
   * These headers are applied to all routes.  Without them the FFmpeg WASM
   * module will throw "SharedArrayBuffer is not defined" at runtime.
   *
   * NOTE: These headers also affect HLS.js and any third-party iframes.
   * If embedding external content breaks, scope the headers to only
   * the /video-studio and /streaming/broadcast paths.
   */
  async headers() {
    return [
      {
        // Security headers — applied to every page
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // COOP + COEP only where SharedArrayBuffer (FFmpeg WASM) is needed.
        // Applying these to all pages breaks login, registration, and hub pages.
        source: "/(video-studio|streaming/broadcast)(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in CI/production builds
  silent: true,
  disableLogger: true,

  // Automatically tree-shake Sentry logger statements
  automaticVercelMonitors: false,
});
