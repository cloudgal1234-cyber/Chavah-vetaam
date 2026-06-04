const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const prisma = require('../config/database');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/campaigns
router.get('/', authenticate, async (req, res, next) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { generations: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
});

// POST /api/campaigns
router.post('/', authenticate, upload.single('productImage'), async (req, res, next) => {
  try {
    const { title, description, targetAudience, script } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const productImageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.productImageUrl || null;

    const campaign = await prisma.campaign.create({
      data: { userId: req.user.id, title, description, targetAudience, script, productImageUrl },
    });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

// GET /api/campaigns/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { generations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/campaigns/:id
router.patch('/:id', authenticate, upload.single('productImage'), async (req, res, next) => {
  try {
    const existing = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    const { title, description, targetAudience, script, status } = req.body;
    const productImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(script !== undefined && { script }),
        ...(status && { status }),
        ...(productImageUrl && { productImageUrl }),
      },
    });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/campaigns/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
