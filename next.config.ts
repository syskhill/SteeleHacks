// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* you can add other Next.js options here, e.g. images, experimental, etc. */
};

export default nextConfig;
