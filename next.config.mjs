/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force unique build ID on every deploy so browsers always fetch fresh JS chunks
  generateBuildId: async () => `build-${Date.now()}`,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // ✅ Add empty turbopack config to silence the error
  turbopack: {},

  // Raise Next.js body buffer limit for the /api/match-eye/upload proxy route.
  // Default is 10 MB — videos sent in chunks can exceed this.
  experimental: {
    proxyClientMaxBodySize: '500mb',
  },

  webpack: (config, { dev, isServer }) => {
    config.resolve.symlinks = false;

    if (config.infrastructureLogging) {
      config.infrastructureLogging.appendOnly = true;
    }

    if (!dev) {
      config.cache = false;
    }

    config.resolve.alias['@google/genai'] = false;
    config.resolve.alias['@anthropic-ai/sdk'] = false;
    // Optional peer deps of @tensorflow-models/pose-detection not needed for MoveNet
    config.resolve.alias['@mediapipe/pose'] = false;
    config.resolve.alias['@tensorflow/tfjs-backend-webgpu'] = false;

    config.resolve.alias[`${process.cwd()}/src/app/coach/page.jsx`] = false;

    config.resolve.alias[`${process.cwd()}/src/components/tactical-iq/WhatWouldYouDo`] =
      `${process.cwd()}/src/lib/tactical-iq/WhatWouldYouDo.tsx`;

    if (isServer) {
      const emptyStubs = [
        'jspdf',
        'jspdf-autotable',
        'html2canvas',
        'recharts',
        'hls.js',
        '@ffmpeg/ffmpeg',
        '@ffmpeg/util',
        '@sentry/nextjs',
        'firebase/app',
        'firebase/auth',
        'firebase/messaging',
        'firebase/firestore',
        'firebase/analytics',
        'firebase/storage',
        'firebase/compat/app',
        'firebase/compat/auth',
        // Browser-only AI/ML packages — WebGL/WASM, cannot run in Node.js
        '@tensorflow/tfjs',
        '@tensorflow/tfjs-backend-webgl',
        '@tensorflow-models/pose-detection',
        'onnxruntime-web',
      ];
      for (const pkg of emptyStubs) {
        config.resolve.alias[pkg] = false;
      }
      config.resolve.alias['dexie'] = `${process.cwd()}/src/stubs/dexie.js`;
    }

    return config;
  },

  async redirects() {
    return [
      // Retire legacy /video-analysis — superseded by /video-studio
      { source: '/video-analysis', destination: '/video-studio', permanent: true },
      // Retire legacy /athlete/vault — superseded by /player/vault
      { source: '/athlete/vault', destination: '/player/vault', permanent: true },
      // Consolidation: Video Studio → Match Eye (Match Eye covers all sports + focus questions)
      { source: '/video-studio', destination: '/player/match-eye', permanent: false },
      // Consolidation: Showcase → Passport (Arena + Passport replaces scout-facing discovery)
      { source: '/player/showcase', destination: '/player/passport', permanent: false },
    ];
  },

  async headers() {
    return [
      // Security headers on every route
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      // Service worker — must never be served from cache so the browser
      // always byte-compares the freshly deployed file and triggers the
      // update flow when CACHE_VERSION has changed.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Dynamic hub pages — user-generated content, feeds, dashboards.
      // Must not be cached by the browser or any intermediary proxy so
      // users always receive fresh data after a deploy.
      {
        source: "/(player|coach|scout|fan|admin|arena|analyst|academy|verify)(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
      // COOP/COEP required for SharedArrayBuffer (video encoding pages)
      {
        source: "/(video-studio|streaming/broadcast)(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;