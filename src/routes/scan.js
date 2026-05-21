/**
 * Smart Pantry AI — Scan Routes
 * ===============================
 * Upload grocery photos or receipts → AI detects items → returns results.
 */

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { ScanSession, PantryItem } = require('../models');
const { detectFoodFromPhoto, parseReceiptImage } = require('../services/visionService');
const { uploadToS3 } = require('../utils/s3Upload');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Multer config: accept images up to 10MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// ========================
// POST /api/scan/photo — Scan a grocery photo
// ========================
router.post('/photo', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Optimize image before sending to AI
    const optimized = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to S3 for record-keeping
    const imageUrl = await uploadToS3(optimized, 'image/jpeg', 'scans');

    // Send to Vision AI for detection
    const base64 = optimized.toString('base64');
    const detectedItems = await detectFoodFromPhoto(base64);

    // Create scan session record
    const session = await ScanSession.create({
      userId: req.userId,
      familyId: req.familyId,
      scanType: 'photo',
      imageUrl,
      rawAiResponse: detectedItems,
      itemCount: detectedItems.length
    });

    res.json({
      message: `Detected ${detectedItems.length} items`,
      scanSessionId: session.id,
      imageUrl,
      items: detectedItems
    });
  } catch (error) {
    console.error('Photo scan error:', error);
    res.status(500).json({ error: 'Failed to scan photo. Please try again.' });
  }
});

// ========================
// POST /api/scan/receipt — Scan a receipt image
// ========================
router.post('/receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt image is required' });
    }

    const optimized = await sharp(req.file.buffer)
      .resize(1500, 2000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const imageUrl = await uploadToS3(optimized, 'image/jpeg', 'receipts');

    const base64 = optimized.toString('base64');
    const detectedItems = await parseReceiptImage(base64);

    const session = await ScanSession.create({
      userId: req.userId,
      familyId: req.familyId,
      scanType: 'receipt',
      imageUrl,
      rawAiResponse: detectedItems,
      itemCount: detectedItems.length
    });

    res.json({
      message: `Extracted ${detectedItems.length} items from receipt`,
      scanSessionId: session.id,
      imageUrl,
      items: detectedItems
    });
  } catch (error) {
    console.error('Receipt scan error:', error);
    res.status(500).json({ error: 'Failed to parse receipt. Please try again.' });
  }
});

// ========================
// POST /api/scan/base64 — Scan from base64 (mobile camera)
// ========================
router.post('/base64', async (req, res) => {
  try {
    const { image, type } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    const clean = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(clean, 'base64');

    const optimized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const imageUrl = await uploadToS3(optimized, 'image/jpeg', type === 'receipt' ? 'receipts' : 'scans');
    const base64Optimized = optimized.toString('base64');

    const detectedItems = type === 'receipt'
      ? await parseReceiptImage(base64Optimized)
      : await detectFoodFromPhoto(base64Optimized);

    const session = await ScanSession.create({
      userId: req.userId,
      familyId: req.familyId,
      scanType: type || 'photo',
      imageUrl,
      rawAiResponse: detectedItems,
      itemCount: detectedItems.length
    });

    res.json({
      message: `Detected ${detectedItems.length} items`,
      scanSessionId: session.id,
      imageUrl,
      items: detectedItems
    });
  } catch (error) {
    console.error('Base64 scan error:', error);
    res.status(500).json({ error: 'Failed to process image.' });
  }
});

// ========================
// GET /api/scan/history — Past scan sessions
// ========================
router.get('/history', async (req, res) => {
  try {
    const sessions = await ScanSession.findAll({
      where: { familyId: req.familyId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit) || 20
    });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

module.exports = router;
