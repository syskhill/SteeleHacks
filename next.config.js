/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Prevent webpack cache issues
    config.cache = false;

    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
  // Prevent auto-cancellation of requests
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;