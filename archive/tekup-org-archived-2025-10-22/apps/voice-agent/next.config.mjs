import path from 'path'
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Only transpile UI; map shared/api-client to local shims instead of workspace packages
  transpilePackages: ['@tekup/ui'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@tekup/shared': path.resolve(process.cwd(), 'src/shims/tekup-shared.ts'),
      '@tekup/api-client': path.resolve(process.cwd(), 'src/shims/tekup-api-client.ts'),
    };
    return config;
  },
};

export default nextConfig;
