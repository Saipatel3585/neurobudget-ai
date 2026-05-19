// Load .env only in development — Render injects env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const budgetRoutes = require('./routes/budgets');

const app = express();

// CORS — allow Vercel frontend (all preview URLs) + localhost dev
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Render health checks, curl)
    if (!origin) return callback(null, true);
    // Allow localhost dev
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow any Vercel deployment (including preview URLs)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly set FRONTEND_URL
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl && origin === frontendUrl) return callback(null, true);
    // Block everything else
    console.warn(`CORS blocked: ${origin}`);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB with validation + retry
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined.');
    console.error('   → Local dev: make sure backend/.env exists with MONGODB_URI set.');
    console.error('   → Render: go to Dashboard → Your Service → Environment and add MONGODB_URI.');
    process.exit(1); // crash fast so Render shows the real error
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/budgets', budgetRoutes);

// Health check (Render uses this)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'NeuroBudget AI',
    env: process.env.NODE_ENV,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    // Shows which keys are SET (not their values — safe to expose)
    envCheck: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      GROQ_MODEL: process.env.GROQ_MODEL || 'not set',
      FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
    },
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NeuroBudget AI on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
