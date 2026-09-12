const axios = require('axios');
const Check = require('../models/Check');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');

// Consecutive failure threshold before declaring an incident (prevents alert flapping)
const FAILURE_THRESHOLD = 2;

/**
 * Execute HTTP Ping check for a single monitor
 * @param {Object} monitor - Mongoose Monitor document
 */
const executeMonitorCheck = async (monitor) => {
  const startTime = Date.now();
  let statusCode = null;
  let responseTime = 0;
  let success = false;
  let errorMessage = null;

  try {
    const response = await axios.get(monitor.url, {
      timeout: monitor.timeout,
      validateStatus: () => true, // Don't throw exception on 4xx/5xx status codes so we can read the exact code
      headers: {
        'User-Agent': 'UptimeMonitor-Engine/1.0'
      }
    });

    responseTime = Date.now() - startTime;
    statusCode = response.status;

    // Check success condition: status code matches expected status
    if (statusCode === (monitor.expectedStatus || 200)) {
      success = true;
    } else {
      success = false;
      errorMessage = `Unexpected HTTP status: ${statusCode} (expected ${monitor.expectedStatus || 200})`;
    }
  } catch (error) {
    responseTime = Date.now() - startTime;

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = `Request timed out after ${monitor.timeout}ms`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused by host (${monitor.url})`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `DNS lookup failed for hostname (${monitor.url})`;
    } else {
      errorMessage = error.message || 'Network error occurred';
    }
    success = false;
  }

  // 1. Create Check Document
  const check = await Check.create({
    monitorId: monitor._id,
    statusCode,
    responseTime,
    success,
    error: errorMessage,
    checkedAt: new Date()
  });

  // 2. Incident Detection & Resolution Logic
  const now = new Date();

  if (success) {
    // Reset consecutive failure counter
    monitor.consecutiveFailures = 0;
    monitor.currentStatus = 'up';

    // Check if there is an active ongoing incident to resolve
    const ongoingIncident = await Incident.findOne({
      monitorId: monitor._id,
      status: 'ongoing'
    });

    if (ongoingIncident) {
      const durationSeconds = Math.max(1, Math.round((now.getTime() - new Date(ongoingIncident.startedAt).getTime()) / 1000));
      ongoingIncident.status = 'resolved';
      ongoingIncident.resolvedAt = now;
      ongoingIncident.durationSeconds = durationSeconds;
      await ongoingIncident.save();
      console.log(`[Incident Manager] Resolved incident for monitor "${monitor.name}" after ${durationSeconds}s`);
    }
  } else {
    // Increment consecutive failure counter
    monitor.consecutiveFailures = (monitor.consecutiveFailures || 0) + 1;
    monitor.currentStatus = 'down';

    // Check if failure threshold reached and no ongoing incident exists
    if (monitor.consecutiveFailures >= FAILURE_THRESHOLD) {
      const ongoingIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: 'ongoing'
      });

      if (!ongoingIncident) {
        await Incident.create({
          monitorId: monitor._id,
          startedAt: now,
          reason: errorMessage || 'Monitor check failed',
          status: 'ongoing'
        });
        console.log(`[Incident Manager] Created new ongoing incident for monitor "${monitor.name}" (Reason: ${errorMessage})`);
      }
    }
  }

  // Update Monitor timestamps & current status
  monitor.lastCheckedAt = now;
  await monitor.save();

  return check;
};

module.exports = {
  executeMonitorCheck,
  FAILURE_THRESHOLD
};
