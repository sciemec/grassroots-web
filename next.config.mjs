import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Disable symlink resolution to avoid Windows readlink EISDIR issues
    config.resolve.symlinks = false;
    return config;
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
