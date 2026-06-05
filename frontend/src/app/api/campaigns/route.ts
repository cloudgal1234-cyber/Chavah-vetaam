import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await resolveUser(req);
  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    include: { _count: { select: { generations: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(campaigns);
}

export async function POST(req: NextRequest) {
  const user = await resolveUser(req);
  try {
    const { title, description, targetAudience, script, productImageUrl } = await req.json();
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });
    const campaign = await prisma.campaign.create({
      data: { userId: user.id, title, description, targetAudience, script, productImageUrl },
    });
    return Response.json(campaign, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
