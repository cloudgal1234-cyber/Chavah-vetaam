import { NextRequest } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(`${APP_URL}/auth/login?error=google_not_configured`);
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
