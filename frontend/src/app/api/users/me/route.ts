import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  const { passwordHash, ...safe } = user;
  return Response.json(safe);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  try {
    const { name, avatarUrl } = await req.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { ...(name && { name }), ...(avatarUrl && { avatarUrl }) },
      select: { id: true, email: true, name: true, credits: true, role: true, avatarUrl: true },
    });
    return Response.json(updated);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
