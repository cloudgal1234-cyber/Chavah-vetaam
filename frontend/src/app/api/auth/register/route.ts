import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password || password.length < 8) {
      return Response.json({ error: 'name, email and password (min 8 chars) are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultCredits = parseInt(process.env.DEFAULT_CREDITS || '100');

    const user = await prisma.user.create({
      data: { email, name, passwordHash, credits: defaultCredits },
      select: { id: true, email: true, name: true, credits: true, role: true, createdAt: true },
    });

    await prisma.creditLog.create({
      data: { userId: user.id, delta: defaultCredits, reason: 'Welcome bonus', balanceAfter: defaultCredits },
    });

    return Response.json({ token: signToken(user.id), user }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
