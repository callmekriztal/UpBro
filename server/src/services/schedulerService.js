const Monitor = require('../models/Monitor');
const Check = require('../models/Check');
const { enqueueMonitorPing } = require('../queue/producerService');

let schedulerTimer = null;

/**
 * Detect if system was shut down / restarted by checking time elapsed since last check.
 */
const detectSystemDowntimeGap = async () => {
  try {
    const latestCheck = await Check.findOne().sort({ checkedAt: -1 });
    if (!latestCheck) return;

    const minMonitor = await Monitor.findOne({ isActive: true }).sort({ interval: 1 });
    const minIntervalMinutes = minMonitor ? minMonitor.interval : 1;
    const thresholdMs = minIntervalMinutes * 2 * 60 * 1000;

    const elapsedMs = Date.now() - new Date(latestCheck.checkedAt).getTime();

    // IMPORTANT: System downtime (e.g. laptop restart, server reboot, container restart) must NOT generate target Incidents.
    // Target websites were not necessarily experiencing an outage while our monitoring system was powered off.
    // Creating false incidents during monitoring gaps corrupts telemetry and SLA reporting.
    if (elapsedMs > thresholdMs) {
      const minutesGap = Math.round(elapsedMs / 60000);
      const hoursGap = (elapsedMs / (1000 * 60 * 60)).toFixed(1);
      console.log(
        `[System Lifecycle] ⚠️ Resuming after system downtime — last check was at ${new Date(latestCheck.checkedAt).toISOString()} (~${hoursGap}h / ${minutesGap}m ago). Monitoring gap NOT recorded as target outage.`
      );
    }
  } catch (err) {
    console.error('[System Lifecycle Check Error]:', err.message);
  }
};

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

  // Detect downtime gap & run immediately on boot
  detectSystemDowntimeGap()
    .then(() => checkDueMonitors())
    .catch((err) => console.error('[Producer Boot Error]:', err));

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
  stopScheduler,
  detectSystemDowntimeGap
};

