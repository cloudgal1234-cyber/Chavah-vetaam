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
    serverComponentsExternalPackages: ['bcryptjs', '@prisma/client', 'prisma'],
    outputFileTracingIncludes: {
      '/api/**/*': [
        './node_modules/.prisma/client/**/*',
        './node_modules/@prisma/client/**/*',
        './prisma/schema.prisma',
      ],
    },
  },
};

module.exports = nextConfig;
