import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration for RenOS Time & Revenue Tracker
  serverExternalPackages: ['googleapis'],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;