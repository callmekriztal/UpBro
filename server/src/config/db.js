const mongoose = require('mongoose');

/**
 * Mongoose Database Connection Setup with Retry Loop & Exponential Backoff
 */
const connectDB = async (
  maxRetries = process.env.NODE_ENV === 'test' ? 1 : 10,
  initialDelayMs = process.env.NODE_ENV === 'test' ? 100 : 2000
) => {
  // Disable buffering commands so queries fail fast if DB connection is dropped instead of hanging
  mongoose.set('bufferCommands', false);

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/uptime_monitor';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Attempt ${attempt}/${maxRetries}: Connecting to ${mongoUri}...`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000 // Fast 5s timeout per attempt
      });

      console.log(`[MongoDB] ✅ Connected successfully to host: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[MongoDB Connection Error] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error('[MongoDB Fatal] Max connection retries reached. Database unavailable.');
        throw error;
      }

      const delay = initialDelayMs * Math.pow(1.5, attempt - 1);
      console.log(`[MongoDB] Retrying connection in ${Math.round(delay / 1000)}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;

