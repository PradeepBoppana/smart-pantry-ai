/**
 * Smart Pantry AI — Server Entry Point
 * =====================================
 * Your kitchen memory. AI-powered grocery tracking.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const pantryRoutes = require('./routes/pantry');
const scanRoutes = require('./routes/scan');
const recipeRoutes = require('./routes/recipes');
const shoppingRoutes = require('./routes/shopping');
const statsRoutes = require('./routes/stats');

// Database
const { sequelize } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ===================
// Middleware
// ===================
app.use(helmet());
app.use(cors());
app.use(express.static('public'));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ===================
// Routes
// ===================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Smart Pantry AI', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===================
// Start Server
// ===================
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Smart Pantry AI running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
