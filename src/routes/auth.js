const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Family } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ========================
// POST /api/auth/register
// ========================
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create a personal family for the user
    const family = await Family.create({
      name: `${name}'s Kitchen`,
      inviteCode: uuidv4().slice(0, 8).toUpperCase()
    });

    const user = await User.create({
      email,
      name,
      passwordHash,
      familyId: family.id
    });

    // Update family's createdBy
    await family.update({ createdBy: user.id });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: family.id,
        inviteCode: family.inviteCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ========================
// POST /api/auth/login
// ========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        familyId: user.familyId,
        dietaryPrefs: user.dietaryPrefs
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========================
// GET /api/auth/me
// ========================
router.get('/me', authenticate, async (req, res) => {
  const family = await Family.findByPk(req.user.familyId);
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      familyId: req.user.familyId,
      dietaryPrefs: req.user.dietaryPrefs,
      family: family ? { id: family.id, name: family.name, inviteCode: family.inviteCode } : null
    }
  });
});

// ========================
// PUT /api/auth/preferences
// ========================
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { dietaryPrefs } = req.body;
    await req.user.update({ dietaryPrefs });
    res.json({ message: 'Preferences updated', dietaryPrefs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ========================
// POST /api/auth/join-family
// ========================
router.post('/join-family', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const family = await Family.findOne({ where: { inviteCode } });

    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    await req.user.update({ familyId: family.id });
    res.json({ message: `Joined ${family.name}!`, family });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join family' });
  }
});

module.exports = router;
