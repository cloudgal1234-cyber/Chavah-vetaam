const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// GET /api/auth/github  — redirect user to GitHub authorization page
router.get('/', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'user:email read:user',
  });
  res.redirect(`${GITHUB_AUTHORIZE_URL}?${params}`);
});

// GET /api/auth/github/callback  — GitHub redirects here with ?code=...
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/auth/login?error=github_denied`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      GITHUB_TOKEN_URL,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) {
      return res.redirect(`${frontendUrl}/auth/login?error=github_token`);
    }

    const ghHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    };

    // 2. Fetch GitHub profile
    const [profileRes, emailsRes] = await Promise.all([
      axios.get(GITHUB_USER_URL, { headers: ghHeaders }),
      axios.get(GITHUB_EMAILS_URL, { headers: ghHeaders }),
    ]);

    const profile = profileRes.data;
    const primaryEmailObj = emailsRes.data.find((e) => e.primary && e.verified);
    const email = primaryEmailObj?.email || profile.email;

    if (!email) {
      return res.redirect(`${frontendUrl}/auth/login?error=github_no_email`);
    }

    // 3. Upsert user — find by githubId, fall back to email, or create new
    let user = await prisma.user.findUnique({ where: { githubId: String(profile.id) } });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (user) {
      // Link GitHub to an existing email-based account (or refresh GitHub metadata)
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId: String(profile.id),
          githubLogin: profile.login,
          avatarUrl: user.avatarUrl || profile.avatar_url,
        },
      });
    } else {
      // Brand-new user via GitHub
      const defaultCredits = parseInt(process.env.DEFAULT_CREDITS || '100');
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name || profile.login,
          githubId: String(profile.id),
          githubLogin: profile.login,
          avatarUrl: profile.avatar_url,
          credits: defaultCredits,
        },
      });
      await prisma.creditLog.create({
        data: { userId: user.id, delta: defaultCredits, reason: 'Welcome bonus (GitHub signup)', balanceAfter: defaultCredits },
      });
    }

    const token = signToken(user.id);
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('GitHub OAuth error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/login?error=github_error`);
  }
});

module.exports = router;
