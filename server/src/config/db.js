const mongoose = require('mongoose');

/**
 * Mongoose Database Connection Setup
 */
const connectDB = async () => {
  try {
    // Disable buffering commands so queries fail fast if DB connection is dropped instead of hanging 10s
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uptime_monitor', {
      serverSelectionTimeoutMS: 5000 // Fast 5s connection timeout instead of default 30s
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
