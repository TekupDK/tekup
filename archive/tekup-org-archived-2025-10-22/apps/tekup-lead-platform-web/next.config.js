/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tekup/shared', '@tekup/api-client', '@tekup/config'],
  env: {
    LEAD_PLATFORM_API_URL: process.env.LEAD_PLATFORM_API_URL || 'http://localhost:3001',
    FLOW_API_URL: process.env.FLOW_API_URL || 'http://localhost:3000',
  },
  images: {
    // Avoid native sharp issues on Node 22 in dev
    unoptimized: true,
  },
}

module.exports = nextConfig
