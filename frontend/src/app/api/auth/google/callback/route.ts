import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth-server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) return Response.redirect(`${APP_URL}/auth/login?error=google_denied`);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return Response.redirect(`${APP_URL}/auth/login?error=google_token`);

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();

    const email = profile.email;
    if (!email) return Response.redirect(`${APP_URL}/auth/login?error=google_no_email`);

    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    if (!user) user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          avatarUrl: user.avatarUrl || profile.picture,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name || email.split('@')[0],
          googleId: profile.id,
          avatarUrl: profile.picture,
        },
      });
    }

    return Response.redirect(`${APP_URL}/auth/callback?token=${signToken(user.id)}`);
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    return Response.redirect(`${APP_URL}/auth/login?error=google_error`);
  }
}
