import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip TypeScript errors during build for production
    ignoreBuildErrors: true,
  },
  // Use webpack for builds (required for WASM support)
  experimental: {
    turbo: {
      rules: {
        '*.wasm': {
          loaders: ['file-loader'],
          as: '*.wasm',
        },
      },
    },
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files for @xenova/transformers
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
