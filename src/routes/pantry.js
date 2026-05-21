/**
 * Smart Pantry AI — Pantry Routes
 * =================================
 * CRUD operations for pantry items with expiry tracking.
 */

const express = require('express');
const { Op } = require('sequelize');
const { PantryItem, ConsumptionLog, Family } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ========================
// GET /api/pantry — List all pantry items
// ========================
router.get('/', async (req, res) => {
  try {
    const { status, category, sort, search } = req.query;

    const where = { familyId: req.familyId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    // Default: active items, sorted by expiry (soonest first)
    if (!status) where.status = 'active';

    let order = [['expiryDate', 'ASC']];
    if (sort === 'name') order = [['name', 'ASC']];
    if (sort === 'category') order = [['category', 'ASC'], ['expiryDate', 'ASC']];
    if (sort === 'added') order = [['createdAt', 'DESC']];

    const items = await PantryItem.findAll({ where, order });

    // Add computed fields
    const now = new Date();
    const enrichedItems = items.map(item => {
      const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
      const daysLeft = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

      let urgency = 'ok';
      if (daysLeft !== null) {
        if (daysLeft <= 0) urgency = 'expired';
        else if (daysLeft <= 2) urgency = 'critical';
        else if (daysLeft <= 5) urgency = 'warning';
      }

      return {
        ...item.toJSON(),
        daysLeft,
        urgency
      };
    });

    res.json({
      count: enrichedItems.length,
      items: enrichedItems
    });
  } catch (error) {
    console.error('Pantry list error:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

// ========================
// GET /api/pantry/expiring — Items expiring within N days
// ========================
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const items = await PantryItem.findAll({
      where: {
        familyId: req.familyId,
        status: 'active',
        expiryDate: {
          [Op.between]: [now.toISOString().split('T')[0], cutoff.toISOString().split('T')[0]]
        }
      },
      order: [['expiryDate', 'ASC']]
    });

    res.json({
      daysWindow: days,
      count: items.length,
      items: items.map(item => ({
        ...item.toJSON(),
        daysLeft: Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// ========================
// POST /api/pantry — Add a single item manually
// ========================
router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiryDate, purchaseDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const item = await PantryItem.create({
      familyId: req.familyId,
      addedBy: req.userId,
      name,
      category: category || 'other',
      quantity: quantity || 1,
      unit: unit || 'item',
      expiryDate,
      purchaseDate: purchaseDate || new Date(),
      confidence: 1.0 // manual entry = full confidence
    });

    res.status(201).json({ message: 'Item added', item });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// ========================
// POST /api/pantry/bulk — Add multiple items (from scan)
// ========================
router.post('/bulk', async (req, res) => {
  try {
    const { items, scanSessionId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const createdItems = await PantryItem.bulkCreate(
      items.map(item => ({
        familyId: req.familyId,
        addedBy: req.userId,
        name: item.name,
        category: item.category || 'other',
        quantity: item.quantity || 1,
        unit: item.unit || 'item',
        expiryDate: item.expiryDate,
        purchaseDate: new Date(),
        confidence: item.confidence || 0.9,
        scanSessionId: scanSessionId || null
      }))
    );

    res.status(201).json({
      message: `${createdItems.length} items added to pantry`,
      items: createdItems
    });
  } catch (error) {
    console.error('Bulk add error:', error);
    res.status(500).json({ error: 'Failed to add items' });
  }
});

// ========================
// PUT /api/pantry/:id — Update an item
// ========================
router.put('/:id', async (req, res) => {
  try {
    const item = await PantryItem.findOne({
      where: { id: req.params.id, familyId: req.familyId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const allowedFields = ['name', 'category', 'quantity', 'unit', 'expiryDate', 'status'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await item.update(updates);

    // If marking as used/wasted, log it
    if (updates.status && ['used', 'wasted', 'expired'].includes(updates.status)) {
      await ConsumptionLog.create({
        pantryItemId: item.id,
        familyId: req.familyId,
        action: updates.status,
        quantity: item.quantity
      });
    }

    res.json({ message: 'Item updated', item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ========================
// DELETE /api/pantry/:id — Remove an item
// ========================
router.delete('/:id', async (req, res) => {
  try {
    const item = await PantryItem.findOne({
      where: { id: req.params.id, familyId: req.familyId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await item.destroy();
    res.json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ========================
// POST /api/pantry/:id/use — Mark item as used (partial or full)
// ========================
router.post('/:id/use', async (req, res) => {
  try {
    const { quantityUsed } = req.body;
    const item = await PantryItem.findOne({
      where: { id: req.params.id, familyId: req.familyId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const used = quantityUsed || item.quantity;
    const remaining = parseFloat(item.quantity) - parseFloat(used);

    if (remaining <= 0) {
      await item.update({ status: 'used', quantity: 0 });
    } else {
      await item.update({ quantity: remaining });
    }

    await ConsumptionLog.create({
      pantryItemId: item.id,
      familyId: req.familyId,
      action: 'used',
      quantity: used
    });

    res.json({
      message: remaining <= 0 ? 'Item fully used' : `Used ${used}, ${remaining} remaining`,
      item
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark item as used' });
  }
});

module.exports = router;
