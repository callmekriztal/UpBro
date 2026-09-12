const axios = require('axios');
const Check = require('../models/Check');
const Monitor = require('../models/Monitor');
const Incident = require('../models/Incident');
const notificationService = require('./notificationService');

const FAILURE_THRESHOLD = 2;

/**
 * Process a single BullMQ ping check job
 * @param {Object} job - BullMQ Job instance
 */
const processJob = async (job) => {
  const { monitorId, url, timeout, expectedStatus, name } = job.data;
  console.log(`[Worker Processing] Job "${job.id}" for monitor "${name}" (Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3})`);

  const monitor = await Monitor.findById(monitorId);
  if (!monitor || !monitor.isActive) {
    console.log(`[Worker] Monitor ${monitorId} is inactive or deleted. Skipping check.`);
    return { skipped: true };
  }

  const startTime = Date.now();
  let statusCode = null;
  let responseTime = 0;
  let success = false;
  let errorMessage = null;

  try {
    const response = await axios.get(url, {
      timeout: timeout || 5000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'UptimeMonitor-WorkerEngine/2.0'
      }
    });

    responseTime = Date.now() - startTime;
    statusCode = response.status;

    if (response.data && response.data.simulatedGlitch === 'TRANSIENT_WORKER_GLITCH') {
      console.warn(`[Worker Retry Test] Simulated transient infrastructure error on attempt ${job.attemptsMade + 1}`);
      throw new Error('Simulated transient worker infrastructure error — triggering BullMQ retry!');
    }

    if (statusCode === (expectedStatus || 200)) {
      success = true;
    } else {
      success = false;
      errorMessage = `Unexpected HTTP status: ${statusCode} (expected ${expectedStatus || 200})`;
    }
  } catch (error) {
    responseTime = Date.now() - startTime;

    if (error.message && error.message.includes('Simulated transient worker infrastructure error')) {
      throw error;
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = `Request timed out after ${timeout}ms`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused by host (${url})`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `DNS lookup failed for hostname (${url})`;
    } else {
      errorMessage = error.message || 'Network error occurred';
    }
    success = false;
  }

  // 1. Record Check Document
  const check = await Check.create({
    monitorId: monitor._id,
    statusCode,
    responseTime,
    success,
    error: errorMessage,
    checkedAt: new Date()
  });

  // 2. Incident Management & Notification Dispatch
  const now = new Date();

  if (success) {
    monitor.consecutiveFailures = 0;
    monitor.currentStatus = 'up';

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

      // Dispatch decoupled recovery notification
      await notificationService.sendIncidentRecovery(ongoingIncident, monitor);
    }
  } else {
    monitor.consecutiveFailures = (monitor.consecutiveFailures || 0) + 1;
    monitor.currentStatus = 'down';

    if (monitor.consecutiveFailures >= FAILURE_THRESHOLD) {
      const ongoingIncident = await Incident.findOne({
        monitorId: monitor._id,
        status: 'ongoing'
      });

      if (!ongoingIncident) {
        const newIncident = await Incident.create({
          monitorId: monitor._id,
          startedAt: now,
          reason: errorMessage || 'Monitor check failed',
          status: 'ongoing'
        });
        
        console.log(`[Incident Manager] Created new ongoing incident for monitor "${monitor.name}" (Reason: ${errorMessage})`);

        // Dispatch decoupled alert notification
        await notificationService.sendIncidentAlert(newIncident, monitor);
      }
    }
  }

  monitor.lastCheckedAt = now;
  await monitor.save();

  return {
    checkId: check._id,
    success,
    responseTime,
    statusCode
  };
};

module.exports = {
  processJob,
  FAILURE_THRESHOLD
};
