import { NextRequest } from 'next/server';
import { resolveUser } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  const generation = await prisma.generation.findFirst({
    where: { id: params.id, campaign: { userId: user.id } },
    include: { campaign: { select: { id: true, title: true } } },
  });
  if (!generation) return Response.json({ error: 'Generation not found' }, { status: 404 });
  return Response.json(generation);
}
