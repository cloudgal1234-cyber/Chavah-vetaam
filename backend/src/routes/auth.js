const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password, name } = req.body;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const defaultCredits = parseInt(process.env.DEFAULT_CREDITS || '100');

      const user = await prisma.user.create({
        data: { email, name, passwordHash, credits: defaultCredits },
        select: { id: true, email: true, name: true, credits: true, role: true, createdAt: true },
      });

      await prisma.creditLog.create({
        data: { userId: user.id, delta: defaultCredits, reason: 'Welcome bonus', balanceAfter: defaultCredits },
      });

      res.status(201).json({ token: signToken(user.id), user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const { passwordHash, ...safeUser } = user;
      res.json({ token: signToken(user.id), user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
