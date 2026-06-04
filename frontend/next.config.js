/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.presenterai.dev' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Required for bcryptjs in Next.js API routes
  serverExternalPackages: ['bcryptjs'],
};

module.exports = nextConfig;
