require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Express App Setup
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoose = require('mongoose');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'StockFlow API is running', timestamp: new Date() });
});

// Check DB connection before handling API routes
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Base de données non connectée. Vérifiez votre connexion Internet et l\'accès IP MongoDB Atlas.',
    });
  }
  next();
});

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error(`⚠️ MongoDB non connecté initialement, tentative en arrière-plan...`);
  }
  app.listen(PORT, () => {
    console.log(`🚀 StockFlow Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
  });
};

startServer();
