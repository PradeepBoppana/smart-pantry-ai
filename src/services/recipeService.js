/**
 * Smart Pantry AI — Recipe Service
 * ==================================
 * Uses Claude API to generate recipes from current pantry items.
 * The "Cook With What You Have" engine.
 */

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate recipes based on available pantry items
 * @param {Array} pantryItems - Current active pantry items
 * @param {Object} preferences - User dietary preferences
 * @param {number} count - Number of recipes to generate (default 5)
 * @returns {Array} - Generated recipes
 */
async function generateRecipes(pantryItems, preferences = {}, count = 5) {
  const itemList = pantryItems.map(item => {
    const daysLeft = item.daysLeft !== undefined ? item.daysLeft : '?';
    return `- ${item.name} (${item.quantity} ${item.unit}, expires in ${daysLeft} days)`;
  }).join('\n');

  const dietInfo = [];
  if (preferences.diet && preferences.diet !== 'none') dietInfo.push(`Diet: ${preferences.diet}`);
  if (preferences.allergies?.length) dietInfo.push(`Allergies: ${preferences.allergies.join(', ')}`);
  if (preferences.cuisines?.length) dietInfo.push(`Preferred cuisines: ${preferences.cuisines.join(', ')}`);
  if (preferences.goalType && preferences.goalType !== 'none') dietInfo.push(`Goal: ${preferences.goalType}`);

  const prompt = `You are a smart kitchen AI. The user has these items in their pantry:

${itemList}

${dietInfo.length ? 'Dietary preferences:\n' + dietInfo.join('\n') : ''}

Generate exactly ${count} recipes they can make RIGHT NOW using ONLY these ingredients (common pantry staples like salt, pepper, oil, water are assumed available). Prioritize recipes that use items expiring soonest.

For each recipe, respond with a JSON array (no markdown, no explanation):
[{
  "title": "Recipe name",
  "description": "One-sentence description",
  "ingredients": [{"name": "ingredient", "amount": "amount", "fromPantry": true}],
  "steps": ["Step 1", "Step 2", ...],
  "cookTimeMin": 15,
  "cuisine": "Italian",
  "dietTags": ["vegetarian"],
  "calories": 320,
  "usesExpiringItems": ["chicken breast", "spinach"],
  "estimatedSavings": 8.50,
  "difficulty": "easy"
}]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text.trim();
    const recipes = JSON.parse(content.replace(/```json|```/g, '').trim());
    return recipes;
  } catch (error) {
    console.error('Recipe generation error:', error);
    throw new Error('Failed to generate recipes. Please try again.');
  }
}

/**
 * Generate a single detailed recipe with full instructions
 * @param {string} recipeName - Name of the recipe
 * @param {Array} availableItems - Pantry items available
 * @param {Object} preferences - Dietary preferences
 * @returns {Object} - Detailed recipe
 */
async function getDetailedRecipe(recipeName, availableItems, preferences = {}) {
  const itemList = availableItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');

  const prompt = `Generate a detailed recipe for "${recipeName}" using these available ingredients: ${itemList}.

Return a JSON object (no markdown):
{
  "title": "Recipe name",
  "description": "Appetizing 2-sentence description",
  "prepTimeMin": 10,
  "cookTimeMin": 20,
  "totalTimeMin": 30,
  "servings": 4,
  "ingredients": [{"name": "item", "amount": "2 cups", "fromPantry": true, "optional": false}],
  "steps": [
    {"step": 1, "instruction": "Detailed step", "timeMin": 5, "tip": "Optional helpful tip"}
  ],
  "nutrition": {"calories": 320, "protein": "25g", "carbs": "30g", "fat": "12g", "fiber": "4g"},
  "cuisine": "Indian",
  "dietTags": ["high-protein"],
  "difficulty": "easy",
  "storageInstructions": "Keeps in fridge for 3 days",
  "variations": ["Swap spinach for kale", "Add chili flakes for heat"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text.trim();
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('Detailed recipe error:', error);
    throw new Error('Failed to get recipe details.');
  }
}

/**
 * Generate leftover rescue ideas
 * @param {Array} leftovers - Leftover items (e.g. "cooked rice", "leftover chicken")
 * @param {Array} pantryItems - Other available pantry items
 * @returns {Array} - Rescue recipe ideas
 */
async function rescueLeftovers(leftovers, pantryItems) {
  const leftoverList = leftovers.map(l => `- ${l}`).join('\n');
  const pantryList = pantryItems.slice(0, 10).map(i => `- ${i.name}`).join('\n');

  const prompt = `I have these leftovers I need to use up:
${leftoverList}

And these items in my pantry:
${pantryList}

Suggest 3 creative meals that rescue these leftovers. Return a JSON array (no markdown):
[{
  "title": "Meal name",
  "description": "One sentence",
  "usesLeftovers": ["cooked rice"],
  "additionalIngredients": ["soy sauce", "egg"],
  "cookTimeMin": 10,
  "steps": ["Step 1", "Step 2"],
  "difficulty": "easy"
}]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text.trim();
    return JSON.parse(content.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('Leftover rescue error:', error);
    throw new Error('Failed to generate leftover ideas.');
  }
}

module.exports = { generateRecipes, getDetailedRecipe, rescueLeftovers };
