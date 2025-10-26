/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disable type checking during build for faster builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Disable ESLint during builds for faster builds
    ignoreDuringBuilds: false,
  },
  env: {
    // API endpoints for health checks
    FLOW_API_URL: process.env.FLOW_API_URL || 'http://localhost:4000',
    CRM_API_URL: process.env.CRM_API_URL || 'http://localhost:4001',
    LEAD_PLATFORM_API_URL: process.env.LEAD_PLATFORM_API_URL || 'http://localhost:4002',
    VOICEDK_API_URL: process.env.VOICEDK_API_URL || 'http://localhost:4003',
    MCP_STUDIO_API_URL: process.env.MCP_STUDIO_API_URL || 'http://localhost:4004',
    INBOX_AI_API_URL: process.env.INBOX_AI_API_URL || 'http://localhost:4005',
    AGENTROOMS_API_URL: process.env.AGENTROOMS_API_URL || 'http://localhost:4006',
  },
};

module.exports = nextConfig;
