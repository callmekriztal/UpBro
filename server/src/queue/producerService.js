const pingQueue = require('./pingQueue');

/**
 * Enqueue a monitor ping check job into BullMQ with deterministic jobId deduplication
 * @param {Object} monitor - Mongoose Monitor document
 */
const enqueueMonitorPing = async (monitor) => {
  try {
    // Deterministic Job ID calculation based on monitor ID and current interval time bucket
    const intervalMs = (monitor.interval || 1) * 60 * 1000;
    const timeBucket = Math.floor(Date.now() / intervalMs);
    const jobId = `ping-${monitor._id.toString()}-${timeBucket}`;

    const job = await pingQueue.add(
      'check-monitor',
      {
        monitorId: monitor._id.toString(),
        url: monitor.url,
        method: monitor.method || 'GET',
        timeout: monitor.timeout || 5000,
        expectedStatus: monitor.expectedStatus || 200,
        name: monitor.name
      },
      {
        jobId, // Idempotency deduplication key
        attempts: 3, // Retry up to 3 times on transient worker errors
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s -> 10s -> 20s exponential backoff
        },
        removeOnComplete: { count: 100 }, // Keep last 100 finished jobs for stats
        removeOnFail: { count: 200 }
      }
    );

    console.log(`[Producer] Enqueued job "${job.id}" for monitor "${monitor.name}"`);
    return job;
  } catch (error) {
    console.error(`[Producer Error] Failed to enqueue job for monitor ${monitor._id}:`, error.message);
  }
};

module.exports = {
  enqueueMonitorPing
};
