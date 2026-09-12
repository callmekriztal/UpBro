require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { startScheduler } = require('./src/services/schedulerService');

const authRoutes = require('./src/routes/authRoutes');
const monitorRoutes = require('./src/routes/monitorRoutes');
const testRoutes = require('./src/routes/testRoutes');

const app = express();

// Connect to MongoDB Database & start background scheduler engine
connectDB().then(() => {
  // Start background scheduler tick every 15 seconds
  startScheduler(15000);
});

// Middleware pipeline
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorRoutes);
app.use('/api/test-endpoint', testRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Centralized error handling middleware (must be defined last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
