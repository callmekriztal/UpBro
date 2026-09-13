const mongoose = require('mongoose');
const Monitor = require('../models/Monitor');
const Check = require('../models/Check');
const Incident = require('../models/Incident');
const pingQueue = require('../queue/pingQueue');

/**
 * Health Check Endpoint
 * GET /health
 * 
 * Verifies MongoDB and Redis database connectivity for Load Balancers & Liveness Probes
 */
const getHealth = async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  let isRedisConnected = false;
  let isWorkerHealthy = false;

  try {
    const client = await pingQueue.client;
    const redisPing = await client.ping();
    isRedisConnected = redisPing === 'PONG';

    if (isRedisConnected) {
      const heartbeatRaw = await client.get('upbro:worker:heartbeat');
      if (heartbeatRaw) {
        try {
          const parsed = JSON.parse(heartbeatRaw);
          if (parsed && parsed.status === 'healthy') {
            isWorkerHealthy = true;
          }
        } catch (e) {
          isWorkerHealthy = false;
        }
      }
    }
  } catch (e) {
    isRedisConnected = false;
    isWorkerHealthy = false;
  }

  const isHealthy = isMongoConnected && isRedisConnected && isWorkerHealthy;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: isMongoConnected ? 'connected' : 'disconnected',
      redis: isRedisConnected ? 'connected' : 'disconnected',
      worker: isWorkerHealthy ? 'healthy' : 'down'
    }
  });
};

/**
 * Operational Metrics Endpoint
 * GET /metrics
 * 
 * Exposes key platform metrics (Active Monitors, 24h Checks, Ongoing Incidents, Queue Depth)
 */
const getMetrics = async (req, res, next) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalMonitors, activeMonitors, checksLast24h, ongoingIncidents, queueJobCounts] = await Promise.all([
      Monitor.countDocuments(),
      Monitor.countDocuments({ isActive: true }),
      Check.countDocuments({ checkedAt: { $gte: last24h } }),
      Incident.countDocuments({ status: 'ongoing' }),
      pingQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      monitors: {
        total: totalMonitors,
        active: activeMonitors,
        paused: totalMonitors - activeMonitors
      },
      checks: {
        last24hCount: checksLast24h
      },
      incidents: {
        ongoingCount: ongoingIncidents
      },
      queueDepth: {
        waiting: queueJobCounts.waiting || 0,
        active: queueJobCounts.active || 0,
        completed: queueJobCounts.completed || 0,
        failed: queueJobCounts.failed || 0,
        delayed: queueJobCounts.delayed || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getMetrics
};
