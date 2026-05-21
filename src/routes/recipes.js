/**
 * Smart Pantry AI — Recipe Routes
 * =================================
 * "Cook With What You Have" — AI-powered recipe suggestions.
 */

const express = require('express');
const { PantryItem } = require('../models');
const { generateRecipes, getDetailedRecipe, rescueLeftovers } = require('../services/recipeService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ========================
// GET /api/recipes/suggest — Get recipes from current pantry
// ========================
router.get('/suggest', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;

    // Get all active pantry items
    const items = await PantryItem.findAll({
      where: { familyId: req.familyId, status: 'active' },
      order: [['expiryDate', 'ASC']]
    });

    if (items.length === 0) {
      return res.json({
        message: 'Your pantry is empty! Scan some groceries first.',
        recipes: []
      });
    }

    // Enrich with daysLeft
    const now = new Date();
    const enriched = items.map(item => ({
      ...item.toJSON(),
      daysLeft: item.expiryDate
        ? Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24))
        : null
    }));

    const preferences = req.user.dietaryPrefs || {};
    const recipes = await generateRecipes(enriched, preferences, count);

    res.json({
      message: `Found ${recipes.length} recipes from your ${items.length} pantry items`,
      pantryItemCount: items.length,
      expiringItemCount: enriched.filter(i => i.daysLeft !== null && i.daysLeft <= 3).length,
      recipes
    });
  } catch (error) {
    console.error('Recipe suggestion error:', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

// ========================
// GET /api/recipes/detail/:name — Get full recipe details
// ========================
router.get('/detail/:name', async (req, res) => {
  try {
    const items = await PantryItem.findAll({
      where: { familyId: req.familyId, status: 'active' }
    });

    const recipe = await getDetailedRecipe(
      decodeURIComponent(req.params.name),
      items.map(i => i.toJSON()),
      req.user.dietaryPrefs || {}
    );

    res.json({ recipe });
  } catch (error) {
    console.error('Recipe detail error:', error);
    res.status(500).json({ error: 'Failed to get recipe details' });
  }
});

// ========================
// POST /api/recipes/rescue — Leftover rescue mode
// ========================
router.post('/rescue', async (req, res) => {
  try {
    const { leftovers } = req.body;

    if (!leftovers || !Array.isArray(leftovers) || leftovers.length === 0) {
      return res.status(400).json({ error: 'Provide an array of leftover items' });
    }

    const pantryItems = await PantryItem.findAll({
      where: { familyId: req.familyId, status: 'active' }
    });

    const rescueIdeas = await rescueLeftovers(
      leftovers,
      pantryItems.map(i => i.toJSON())
    );

    res.json({
      message: `Found ${rescueIdeas.length} ideas to rescue your leftovers`,
      recipes: rescueIdeas
    });
  } catch (error) {
    console.error('Leftover rescue error:', error);
    res.status(500).json({ error: 'Failed to generate leftover ideas' });
  }
});

// ========================
// POST /api/recipes/quick — Quick meal from specific items
// ========================
router.post('/quick', async (req, res) => {
  try {
    const { itemIds, maxTime } = req.body;

    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'Provide an array of pantry item IDs' });
    }

    const items = await PantryItem.findAll({
      where: { id: itemIds, familyId: req.familyId }
    });

    const now = new Date();
    const enriched = items.map(item => ({
      ...item.toJSON(),
      daysLeft: item.expiryDate
        ? Math.ceil((new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24))
        : null
    }));

    const preferences = {
      ...req.user.dietaryPrefs,
      maxCookTime: maxTime || 30
    };

    const recipes = await generateRecipes(enriched, preferences, 3);

    res.json({
      message: `Quick meal ideas using ${items.length} selected items`,
      recipes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate quick meals' });
  }
});

module.exports = router;
