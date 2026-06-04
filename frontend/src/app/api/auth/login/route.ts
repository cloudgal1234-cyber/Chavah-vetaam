import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return Response.json({ error: 'email and password required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { passwordHash, ...safeUser } = user;
    return Response.json({ token: signToken(user.id), user: safeUser });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
