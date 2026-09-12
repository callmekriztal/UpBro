const Monitor = require('../models/Monitor');
const { enqueueMonitorPing } = require('../queue/producerService');

let schedulerTimer = null;

/**
 * Core Producer Scheduler Loop
 * Queries MongoDB for due active monitors and enqueues check jobs to BullMQ.
 */
const checkDueMonitors = async () => {
  console.log('[Producer Tick] Polling for due monitors...');
  try {
    const activeMonitors = await Monitor.find({ isActive: true });
    const now = Date.now();

    const dueMonitors = activeMonitors.filter((monitor) => {
      if (!monitor.lastCheckedAt) return true;
      const elapsedMs = now - new Date(monitor.lastCheckedAt).getTime();
      return elapsedMs >= monitor.interval * 60 * 1000;
    });

    if (dueMonitors.length > 0) {
      console.log(`[Producer] Found ${dueMonitors.length} due monitor(s). Enqueuing jobs to BullMQ...`);

      const results = await Promise.allSettled(
        dueMonitors.map((monitor) => enqueueMonitorPing(monitor))
      );

      const enqueued = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      console.log(`[Producer] Enqueue batch complete: ${enqueued}/${dueMonitors.length} jobs pushed to queue.`);
    } else {
      console.log(`[Producer] ${activeMonitors.length} active monitor(s) checked — none due currently.`);
    }
  } catch (error) {
    console.error('[Producer Error]:', error);
  }
};

/**
 * Start background producer scheduler loop
 * @param {number} tickIntervalMs - Polling interval in ms (default 15 seconds)
 */
const startScheduler = (tickIntervalMs = 15000) => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(`[Producer] Started. Polling for due monitors every ${tickIntervalMs / 1000}s...`);

  // Run immediately on boot
  checkDueMonitors().catch((err) => console.error('[Producer Boot Error]:', err));

  // Set periodic timer
  schedulerTimer = setInterval(() => {
    checkDueMonitors().catch((err) => console.error('[Producer Interval Error]:', err));
  }, tickIntervalMs);
};

const stopScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[Producer] Stopped.');
  }
};

module.exports = {
  checkDueMonitors,
  startScheduler,
  stopScheduler
};
