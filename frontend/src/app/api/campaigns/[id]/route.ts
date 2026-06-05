import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await resolveUser(req);
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId: user.id },
    include: { generations: { orderBy: { createdAt: 'desc' } } },
  });
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  return Response.json(campaign);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await resolveUser(req);
  const existing = await prisma.campaign.findFirst({ where: { id: params.id, userId: user.id } });
  if (!existing) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  try {
    const body = await req.json();
    const campaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience }),
        ...(body.script !== undefined && { script: body.script }),
        ...(body.productImageUrl !== undefined && { productImageUrl: body.productImageUrl }),
        ...(body.status && { status: body.status }),
      },
    });
    return Response.json(campaign);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await resolveUser(req);
  const existing = await prisma.campaign.findFirst({ where: { id: params.id, userId: user.id } });
  if (!existing) return Response.json({ error: 'Campaign not found' }, { status: 404 });
  await prisma.campaign.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
