import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Configuration for RenOS Time & Revenue Tracker
  serverExternalPackages: ['googleapis'],
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};

export default nextConfig;