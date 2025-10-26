/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
  env: {
    JARVIS_API_URL: process.env.JARVIS_API_URL || 'http://localhost:8000',
    FLOW_API_URL: process.env.FLOW_API_URL || 'http://localhost:3003',
    WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'ws://localhost:3003',
  }
};

export default nextConfig;