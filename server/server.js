require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const requestIdMiddleware = require('./src/middleware/requestId');
const { startScheduler } = require('./src/services/schedulerService');

const authRoutes = require('./src/routes/authRoutes');
const monitorRoutes = require('./src/routes/monitorRoutes');
const testRoutes = require('./src/routes/testRoutes');
const { getHealth, getMetrics } = require('./src/controllers/healthController');

const app = express();

// Global Middleware pipeline
app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// Liveness & Cluster Observability Endpoints
app.get('/health', getHealth);
app.get('/metrics', getMetrics);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/test-endpoint', testRoutes);

// Centralized error handling middleware (must be defined last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Async Server Boot Engine
 * Guarantees MongoDB connection is active BEFORE starting HTTP listener or job scheduler
 */
const startServer = async () => {
  try {
    await connectDB();
    startScheduler(15000);

    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Boot Error] Could not start server:', err.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
