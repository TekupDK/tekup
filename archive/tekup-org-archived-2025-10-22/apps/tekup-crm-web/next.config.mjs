/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone', // Enable standalone output for Docker
  transpilePackages: ['@tekup/ui', '@tekup/config', '@tekup/auth', '@tekup/api-client'],
  experimental: {
    outputFileTracingRoot: '../../', // Support monorepo structure
  },
};

export default nextConfig;