require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const redisOptions = require('./src/config/redis');
const { processJob } = require('./src/services/workerService');

// Concurrency Setting: Controls max parallel HTTP check jobs processed by this worker node
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 10;

console.log('[Worker Process] Booting standalone background worker node...');

// Connect to MongoDB
connectDB().then(() => {
  console.log(`[Worker Process] Initializing BullMQ worker (Concurrency: ${WORKER_CONCURRENCY})...`);

  // Instantiate BullMQ Worker Consumer
  const worker = new Worker(
    'ping-checks-queue',
    async (job) => {
      return await processJob(job);
    },
    {
      connection: redisOptions,
      concurrency: WORKER_CONCURRENCY
    }
  );

  // Worker Lifecycle Event Handlers
  worker.on('completed', (job, result) => {
    if (result && result.skipped) return;
    console.log(`[Worker Event] Job "${job.id}" completed. Latency: ${result?.responseTime}ms, Status: ${result?.statusCode}`);
  });

  worker.on('failed', (job, err) => {
    console.warn(`[Worker Event] Job "${job?.id}" failed (Attempt ${job?.attemptsMade}/${job?.opts?.attempts}): ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker Connection Error]:', err);
  });

  // Graceful Shutdown Logic (SIGTERM / SIGINT)
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Worker Shutdown] Received ${signal}. Initiating graceful shutdown...`);

    try {
      // 1. Stop accepting new jobs and wait for active in-flight jobs to complete
      await worker.close();
      console.log('[Worker Shutdown] BullMQ worker closed cleanly.');

      // 2. Close MongoDB Database connection
      await mongoose.connection.close();
      console.log('[Worker Shutdown] MongoDB connection closed.');

      process.exit(0);
    } catch (shutdownError) {
      console.error('[Worker Shutdown Error]:', shutdownError);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
});
