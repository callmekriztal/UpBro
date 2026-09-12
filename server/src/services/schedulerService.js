const Monitor = require('../models/Monitor');
const { executeMonitorCheck } = require('./workerService');

let schedulerTimer = null;

/**
 * Core Scheduler Tick Logic
 * Finds all active monitors that are due for a check and executes pings.
 */
const checkDueMonitors = async () => {
  console.log('[Scheduler Tick] Running due monitor check...');
  try {
    const activeMonitors = await Monitor.find({ isActive: true });
    const now = Date.now();

    const dueMonitors = activeMonitors.filter((monitor) => {
      if (!monitor.lastCheckedAt) return true;
      const elapsedMs = now - new Date(monitor.lastCheckedAt).getTime();
      return elapsedMs >= monitor.interval * 60 * 1000;
    });

    if (dueMonitors.length > 0) {
      console.log(`[Scheduler] Found ${dueMonitors.length} due monitor(s) out of ${activeMonitors.length} active. Executing checks...`);

      const results = await Promise.allSettled(
        dueMonitors.map((monitor) => executeMonitorCheck(monitor))
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      console.log(`[Scheduler] Completed check batch: ${succeeded}/${dueMonitors.length} processed successfully.`);
    } else {
      console.log(`[Scheduler] ${activeMonitors.length} active monitor(s) checked — none due currently.`);
    }
  } catch (error) {
    console.error('[Scheduler Error]:', error);
  }
};

/**
 * Start background scheduler loop
 * @param {number} tickIntervalMs - Polling interval in ms (default 15 seconds)
 */
const startScheduler = (tickIntervalMs = 15000) => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(`[Scheduler] Started. Polling for due monitors every ${tickIntervalMs / 1000}s...`);

  // Run immediately on boot
  checkDueMonitors().catch((err) => console.error('[Scheduler Boot Error]:', err));

  // Set periodic timer
  schedulerTimer = setInterval(() => {
    checkDueMonitors().catch((err) => console.error('[Scheduler Interval Error]:', err));
  }, tickIntervalMs);
};

const stopScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[Scheduler] Stopped.');
  }
};

module.exports = {
  checkDueMonitors,
  startScheduler,
  stopScheduler
};
