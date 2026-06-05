import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

const SECRET = process.env.JWT_SECRET!;

export const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000001';

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN as any) || '7d',
  });
}

export async function getAuthUser(req: NextRequest) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.split(' ')[1], SECRET) as { sub: string };
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

export async function getOrCreatePublicUser() {
  const existing = await prisma.user.findUnique({ where: { id: PUBLIC_USER_ID } });
  if (existing) return existing;
  return prisma.user.create({
    data: { id: PUBLIC_USER_ID, email: 'public@presenter-ai.app', name: 'Guest' },
  });
}

export async function resolveUser(req: NextRequest) {
  return (await getAuthUser(req)) ?? (await getOrCreatePublicUser());
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
