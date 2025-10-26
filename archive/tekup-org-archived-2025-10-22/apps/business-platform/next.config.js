/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  env: {
    CONVERTKIT_API_KEY: process.env.CONVERTKIT_API_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
  },
  async redirects() {
    return [
      {
        source: '/ai-consulting',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig