require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const redisOptions = require('./config/redis');
const { processJob } = require('./services/workerService');

const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 10;

console.log('[Worker Process] Booting standalone background worker node...');

connectDB().then(() => {
  console.log(`[Worker Process] Initializing BullMQ worker (Concurrency: ${WORKER_CONCURRENCY})...`);

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

  const gracefulShutdown = async (signal) => {
    console.log(`\n[Worker Shutdown] Received ${signal}. Initiating graceful shutdown...`);

    try {
      await worker.close();
      console.log('[Worker Shutdown] BullMQ worker closed cleanly.');

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
