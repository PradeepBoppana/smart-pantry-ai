/**
 * Smart Pantry AI — Vision Service
 * ==================================
 * Core AI engine that detects food items from photos and receipts.
 * Uses OpenAI Vision API (GPT-4o) for image analysis.
 */

const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Default expiry estimates (in days) by food category
const EXPIRY_ESTIMATES = {
  // Dairy
  'milk': 7, 'yogurt': 10, 'cheese': 21, 'butter': 30, 'cream': 7,
  'sour cream': 14, 'cottage cheese': 10,
  // Meat & Protein
  'chicken': 2, 'beef': 3, 'pork': 3, 'fish': 2, 'shrimp': 2,
  'ground beef': 2, 'turkey': 2, 'eggs': 21, 'tofu': 7,
  // Vegetables
  'spinach': 4, 'lettuce': 5, 'tomatoes': 7, 'onions': 30,
  'potatoes': 21, 'carrots': 21, 'broccoli': 5, 'mushrooms': 5,
  'bell peppers': 7, 'cucumbers': 7, 'celery': 14, 'corn': 3,
  'green beans': 5, 'peas': 5, 'garlic': 30, 'ginger': 21,
  'cilantro': 5, 'avocado': 4,
  // Fruits
  'bananas': 4, 'apples': 21, 'oranges': 14, 'strawberries': 4,
  'blueberries': 7, 'grapes': 7, 'lemons': 21, 'limes': 14,
  'mangoes': 5, 'watermelon': 7,
  // Bread & Grains
  'bread': 5, 'tortillas': 14, 'rice': 180, 'pasta': 365,
  'cereal': 180, 'oats': 180, 'flour': 180,
  // Beverages
  'juice': 7, 'almond milk': 7, 'oat milk': 7,
  // Condiments & Pantry
  'ketchup': 180, 'mustard': 365, 'mayo': 60, 'soy sauce': 365,
  'hot sauce': 365, 'olive oil': 365, 'cooking oil': 365,
  'peanut butter': 90, 'jam': 90, 'honey': 730,
  // Default
  'default': 7
};

/**
 * Detect food items from a photo using OpenAI Vision API
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Array} - Detected food items with metadata
 */
async function detectFoodFromPhoto(imageBase64) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a food detection AI for a smart pantry app. Analyze the image and identify ALL grocery/food items visible. For each item, provide:
- name: common grocery name (lowercase)
- category: one of [dairy, meat, vegetables, fruits, grains, beverages, snacks, condiments, frozen, other]
- quantity: estimated count or amount
- unit: one of [item, lb, oz, gal, ct, bag, box, can, bottle]
- confidence: 0-1 how sure you are

Respond ONLY with a JSON array. No markdown, no explanation.
Example: [{"name":"whole milk","category":"dairy","quantity":1,"unit":"gal","confidence":0.98}]`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: 'Identify all food and grocery items in this image. Return JSON array only.'
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for accuracy
    });

    const content = response.choices[0].message.content.trim();
    const items = JSON.parse(content.replace(/```json|```/g, '').trim());

    // Add expiry estimates
    return items.map(item => ({
      ...item,
      estimatedExpiryDays: getExpiryEstimate(item.name),
      expiryDate: calculateExpiryDate(item.name)
    }));

  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
}

/**
 * Parse a receipt image using OpenAI Vision API
 * @param {string} imageBase64 - Base64 encoded receipt image
 * @returns {Array} - Extracted grocery items
 */
async function parseReceiptImage(imageBase64) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a receipt parser for a grocery tracking app. Extract ALL food/grocery items from this receipt. For each item provide:
- name: clean product name (lowercase, remove brand-specific codes)
- category: one of [dairy, meat, vegetables, fruits, grains, beverages, snacks, condiments, frozen, other]
- quantity: number purchased
- unit: one of [item, lb, oz, gal, ct, bag, box, can, bottle]
- price: price if visible
- confidence: 0-1

Respond ONLY with a JSON array. No markdown.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high'
              }
            },
            {
              type: 'text',
              text: 'Extract all grocery items from this receipt. Return JSON array only.'
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const content = response.choices[0].message.content.trim();
    const items = JSON.parse(content.replace(/```json|```/g, '').trim());

    return items.map(item => ({
      ...item,
      estimatedExpiryDays: getExpiryEstimate(item.name),
      expiryDate: calculateExpiryDate(item.name)
    }));

  } catch (error) {
    console.error('Receipt parsing error:', error);
    throw new Error('Failed to parse receipt. Please try again.');
  }
}

/**
 * Get estimated shelf life in days for a food item
 */
function getExpiryEstimate(itemName) {
  const name = itemName.toLowerCase();
  
  // Check for exact match first
  if (EXPIRY_ESTIMATES[name]) return EXPIRY_ESTIMATES[name];
  
  // Check for partial match
  for (const [key, days] of Object.entries(EXPIRY_ESTIMATES)) {
    if (name.includes(key) || key.includes(name)) return days;
  }
  
  return EXPIRY_ESTIMATES['default'];
}

/**
 * Calculate expiry date from today
 */
function calculateExpiryDate(itemName) {
  const days = getExpiryEstimate(itemName);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

module.exports = {
  detectFoodFromPhoto,
  parseReceiptImage,
  getExpiryEstimate,
  calculateExpiryDate,
  EXPIRY_ESTIMATES
};
