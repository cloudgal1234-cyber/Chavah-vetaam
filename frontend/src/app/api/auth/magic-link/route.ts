import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth-server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function sendMagicLinkEmail(email: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Magic Link] ${link}`);
    return;
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Presenter AI <noreply@presenterai.app>',
      to: email,
      subject: 'הקישור שלך לכניסה ל-Presenter AI',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #3a47f5;">Presenter AI</h2>
          <p style="font-size: 16px; color: #333;">לחץ על הכפתור כדי להיכנס לחשבון שלך:</p>
          <a href="${link}" style="display: inline-block; background: #3a47f5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; margin: 16px 0;">
            כניסה לחשבון
          </a>
          <p style="font-size: 13px; color: #888; margin-top: 24px;">הקישור תקף ל-30 דקות ולשימוש חד-פעמי.</p>
          <p style="font-size: 13px; color: #888;">אם לא ביקשת את הקישור, התעלם מהמייל הזה.</p>
        </div>
      `,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.magicLinkToken.create({ data: { email, token, expiresAt } });

    const link = `${APP_URL}/api/auth/magic-link/verify?token=${token}`;
    await sendMagicLinkEmail(email, link);

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return Response.redirect(`${APP_URL}/auth/login?error=magic_invalid`);

  try {
    const record = await prisma.magicLinkToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      return Response.redirect(`${APP_URL}/auth/login?error=magic_expired`);
    }

    await prisma.magicLinkToken.update({ where: { token }, data: { used: true } });

    let user = await prisma.user.findUnique({ where: { email: record.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: record.email,
          name: record.email.split('@')[0],
        },
      });
    }

    return Response.redirect(`${APP_URL}/auth/callback?token=${signToken(user.id)}`);
  } catch (err: any) {
    console.error('Magic link error:', err);
    return Response.redirect(`${APP_URL}/auth/login?error=magic_invalid`);
  }
}
