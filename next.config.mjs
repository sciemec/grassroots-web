/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Disable symlink resolution to avoid Windows readlink EISDIR issues
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
