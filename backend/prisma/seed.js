const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@presenterai.com' },
    update: {},
    create: {
      email: 'admin@presenterai.com',
      name: 'Admin User',
      passwordHash,
      role: 'ADMIN',
      credits: 9999,
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@presenterai.com' },
    update: {},
    create: {
      email: 'demo@presenterai.com',
      name: 'Demo User',
      passwordHash,
      role: 'USER',
      credits: 100,
    },
  });

  await prisma.campaign.create({
    data: {
      userId: demo.id,
      title: 'Summer Product Launch',
      description: 'AI video ad for our new sunscreen line targeting young adults.',
      targetAudience: 'Ages 18-35, outdoor enthusiasts',
      script: 'Introducing SunGuard Pro — the sunscreen that moves with you.',
      status: 'active',
    },
  });

  console.log('Seed complete:', { admin: admin.email, demo: demo.email });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
