/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // ✅ Add empty turbopack config to silence the error
  turbopack: {},

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
      ];
      for (const pkg of emptyStubs) {
        config.resolve.alias[pkg] = false;
      }
      config.resolve.alias['dexie'] = `${process.cwd()}/src/stubs/dexie.js`;
    }

    return config;
  },

  async headers() {
    return [
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