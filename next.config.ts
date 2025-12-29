import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript errors during build for production
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
