/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.presenterai.dev' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
};

module.exports = nextConfig;
