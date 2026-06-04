import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth-server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) return Response.redirect(`${APP_URL}/auth/login?error=github_denied`);

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return Response.redirect(`${APP_URL}/auth/login?error=github_token`);

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    };

    // Fetch profile + emails in parallel
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers: ghHeaders }),
      fetch('https://api.github.com/user/emails', { headers: ghHeaders }),
    ]);
    const profile = await profileRes.json();
    const emails: any[] = await emailsRes.json();

    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email || profile.email;
    if (!primaryEmail) return Response.redirect(`${APP_URL}/auth/login?error=github_no_email`);

    // Upsert user
    let user = await prisma.user.findUnique({ where: { githubId: String(profile.id) } });
    if (!user) user = await prisma.user.findUnique({ where: { email: primaryEmail } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { githubId: String(profile.id), githubLogin: profile.login, avatarUrl: user.avatarUrl || profile.avatar_url },
      });
    } else {
      const defaultCredits = parseInt(process.env.DEFAULT_CREDITS || '100');
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          name: profile.name || profile.login,
          githubId: String(profile.id),
          githubLogin: profile.login,
          avatarUrl: profile.avatar_url,
          credits: defaultCredits,
        },
      });
      await prisma.creditLog.create({
        data: { userId: user.id, delta: defaultCredits, reason: 'Welcome bonus (GitHub)', balanceAfter: defaultCredits },
      });
    }

    return Response.redirect(`${APP_URL}/auth/callback?token=${signToken(user.id)}`);
  } catch (err: any) {
    console.error('GitHub OAuth error:', err);
    return Response.redirect(`${APP_URL}/auth/login?error=github_error`);
  }
}
