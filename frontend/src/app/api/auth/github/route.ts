import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_CALLBACK_URL!,
    scope: 'user:email read:user',
  });
  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
