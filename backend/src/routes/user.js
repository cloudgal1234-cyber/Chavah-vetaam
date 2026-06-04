const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const prisma = require('../config/database');

// GET /api/users/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, credits: true, role: true, avatarUrl: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/credits
router.get('/me/credits', authenticate, async (req, res, next) => {
  try {
    const logs = await prisma.creditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ balance: req.user.credits, history: logs });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }), ...(avatarUrl && { avatarUrl }) },
      select: { id: true, email: true, name: true, credits: true, role: true, avatarUrl: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/me/credits/add  (admin only — or for testing)
router.post('/me/credits/add', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { credits: { increment: amount } },
    });

    await prisma.creditLog.create({
      data: { userId: user.id, delta: amount, reason: reason || 'Manual top-up', balanceAfter: user.credits },
    });

    res.json({ credits: user.credits });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
