/**
 * Smart Pantry AI — Stats Routes
 * =================================
 * Fridge health score, waste analytics, and consumption insights.
 */

const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { PantryItem, ConsumptionLog, ScanSession } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ========================
// GET /api/stats/health — Fridge health score (0-100)
// ========================
router.get('/health', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all items from last 30 days
    const allItems = await PantryItem.findAll({
      where: {
        familyId: req.familyId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const activeItems = allItems.filter(i => i.status === 'active');
    const usedItems = allItems.filter(i => i.status === 'used');
    const wastedItems = allItems.filter(i => i.status === 'wasted' || i.status === 'expired');

    const total = allItems.length || 1; // avoid division by zero

    // Health score formula:
    // - Items used before expiry: +60 points (weighted heavily)
    // - Low waste ratio: +25 points
    // - Active items freshness: +15 points
    const useRate = usedItems.length / total;
    const wasteRate = wastedItems.length / total;

    // Freshness: what % of active items still have >3 days before expiry
    const freshItems = activeItems.filter(item => {
      if (!item.expiryDate) return true;
      const daysLeft = Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24));
      return daysLeft > 3;
    });
    const freshnessRate = activeItems.length > 0 ? freshItems.length / activeItems.length : 1;

    const score = Math.round(
      (useRate * 60) +
      ((1 - wasteRate) * 25) +
      (freshnessRate * 15)
    );

    // Expiring soon (next 3 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);
    const expiringSoon = activeItems.filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) <= cutoff && new Date(item.expiryDate) >= now;
    });

    // Estimated savings (avg $3 per item not wasted)
    const estimatedSavings = usedItems.length * 3;

    res.json({
      score: Math.min(score, 100),
      breakdown: {
        usedBeforeExpiry: `${Math.round(useRate * 100)}%`,
        wasteRate: `${Math.round(wasteRate * 100)}%`,
        freshnessScore: `${Math.round(freshnessRate * 100)}%`
      },
      stats: {
        totalItems: allItems.length,
        activeItems: activeItems.length,
        usedItems: usedItems.length,
        wastedItems: wastedItems.length,
        expiringSoon: expiringSoon.length,
        estimatedSavings: `$${estimatedSavings}`
      },
      period: '30 days'
    });
  } catch (error) {
    console.error('Health score error:', error);
    res.status(500).json({ error: 'Failed to calculate health score' });
  }
});

// ========================
// GET /api/stats/waste — Waste breakdown by category
// ========================
router.get('/waste', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const wastedItems = await PantryItem.findAll({
      where: {
        familyId: req.familyId,
        status: { [Op.in]: ['wasted', 'expired'] },
        updatedAt: { [Op.gte]: since }
      }
    });

    // Group by category
    const byCategory = {};
    wastedItems.forEach(item => {
      const cat = item.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, items: [] };
      byCategory[cat].count++;
      byCategory[cat].items.push(item.name);
    });

    // Sort by most wasted category
    const sorted = Object.entries(byCategory)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([category, data]) => ({ category, ...data }));

    res.json({
      period: `${days} days`,
      totalWasted: wastedItems.length,
      estimatedCost: `$${wastedItems.length * 3}`,
      byCategory: sorted,
      tip: sorted.length > 0
        ? `You waste the most ${sorted[0].category}. Try buying less or using it in recipes sooner.`
        : 'Great job! Minimal food waste detected.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waste stats' });
  }
});

// ========================
// GET /api/stats/patterns — Consumption patterns
// ========================
router.get('/patterns', async (req, res) => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const logs = await ConsumptionLog.findAll({
      where: {
        familyId: req.familyId,
        action: 'used',
        loggedAt: { [Op.gte]: sixtyDaysAgo }
      },
      include: [{ model: PantryItem, attributes: ['name', 'category'] }]
    });

    // Most used items
    const usageCount = {};
    logs.forEach(log => {
      const name = log.PantryItem?.name;
      if (name) usageCount[name] = (usageCount[name] || 0) + 1;
    });

    const topItems = Object.entries(usageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, timesUsed: count }));

    // Usage by day of week
    const dayUsage = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    logs.forEach(log => {
      const day = dayNames[new Date(log.loggedAt).getDay()];
      dayUsage[day]++;
    });

    // Average items per week
    const weeksTracked = Math.max(1, Math.ceil(
      (new Date() - sixtyDaysAgo) / (7 * 24 * 60 * 60 * 1000)
    ));
    const avgPerWeek = Math.round(logs.length / weeksTracked);

    res.json({
      period: '60 days',
      topItems,
      usageByDay: dayUsage,
      avgItemsPerWeek: avgPerWeek,
      totalConsumed: logs.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// ========================
// GET /api/stats/summary — Quick dashboard summary
// ========================
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const activeCount = await PantryItem.count({
      where: { familyId: req.familyId, status: 'active' }
    });

    const expiringCount = await PantryItem.count({
      where: {
        familyId: req.familyId,
        status: 'active',
        expiryDate: { [Op.between]: [now.toISOString().split('T')[0], threeDaysFromNow.toISOString().split('T')[0]] }
      }
    });

    const expiredCount = await PantryItem.count({
      where: {
        familyId: req.familyId,
        status: 'active',
        expiryDate: { [Op.lt]: now.toISOString().split('T')[0] }
      }
    });

    const scanCount = await ScanSession.count({
      where: { familyId: req.familyId }
    });

    res.json({
      activeItems: activeCount,
      expiringSoon: expiringCount,
      expiredItems: expiredCount,
      totalScans: scanCount,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router;
