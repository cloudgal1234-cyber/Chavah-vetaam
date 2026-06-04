const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../config/database');
const aiService = require('../services/aiService');

// POST /api/generations  — kick off a new generation
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { campaignId, mediaType, prompt, options } = req.body;

    if (!campaignId || !mediaType) {
      return res.status(400).json({ error: 'campaignId and mediaType are required' });
    }

    const validTypes = ['VIDEO', 'IMAGE', 'AUDIO', 'UGC'];
    if (!validTypes.includes(mediaType)) {
      return res.status(400).json({ error: `mediaType must be one of: ${validTypes.join(', ')}` });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: req.user.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const cost = aiService.CREDIT_COSTS[mediaType];
    if (req.user.credits < cost) {
      return res.status(402).json({ error: 'Insufficient credits', required: cost, balance: req.user.credits });
    }

    // Deduct credits and create generation record atomically
    const [, generation] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { credits: { decrement: cost } },
      }),
      prisma.generation.create({
        data: {
          campaignId,
          mediaType,
          status: 'PROCESSING',
          prompt: prompt || campaign.script,
          creditsUsed: cost,
        },
      }),
      prisma.creditLog.create({
        data: {
          userId: req.user.id,
          delta: -cost,
          reason: `${mediaType} generation`,
          balanceAfter: req.user.credits - cost,
        },
      }),
    ]);

    // Return immediately so the client can poll; run generation async
    res.status(202).json({ id: generation.id, status: 'PROCESSING', creditsUsed: cost });

    // Fire-and-forget background job
    aiService.run(mediaType, generation.prompt, options || {})
      .then(async (result) => {
        await prisma.generation.update({
          where: { id: generation.id },
          data: { status: 'COMPLETED', resultUrl: result.resultUrl, thumbnailUrl: result.thumbnailUrl, metadata: result.metadata },
        });
      })
      .catch(async (err) => {
        await prisma.generation.update({
          where: { id: generation.id },
          data: { status: 'FAILED', errorMessage: err.message },
        });
        // Refund credits on failure
        const user = await prisma.user.update({
          where: { id: req.user.id },
          data: { credits: { increment: cost } },
        });
        await prisma.creditLog.create({
          data: { userId: req.user.id, delta: cost, reason: 'Generation failed — refund', balanceAfter: user.credits },
        });
      });
  } catch (err) {
    next(err);
  }
});

// GET /api/generations/:id — poll status
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const generation = await prisma.generation.findFirst({
      where: { id: req.params.id, campaign: { userId: req.user.id } },
      include: { campaign: { select: { id: true, title: true } } },
    });
    if (!generation) return res.status(404).json({ error: 'Generation not found' });
    res.json(generation);
  } catch (err) {
    next(err);
  }
});

// GET /api/generations  — list all generations for the current user (gallery)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { mediaType, status, campaignId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      campaign: { userId: req.user.id },
      ...(mediaType && { mediaType }),
      ...(status && { status }),
      ...(campaignId && { campaignId }),
    };

    const [total, items] = await Promise.all([
      prisma.generation.count({ where }),
      prisma.generation.findMany({
        where,
        include: { campaign: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
    ]);

    res.json({ total, page: parseInt(page), limit: parseInt(limit), items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
