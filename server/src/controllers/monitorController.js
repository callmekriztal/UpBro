const mongoose = require('mongoose');
const Monitor = require('../models/Monitor');
const Check = require('../models/Check');

/**
 * Get all monitors owned by authenticated user
 * GET /api/monitors
 */
const getMonitors = async (req, res, next) => {
  try {
    const monitors = await Monitor.find({ userId: req.userId }).sort({ createdAt: -1 });

    const monitorsWithStats = await Promise.all(
      monitors.map(async (monitor) => {
        const latestCheck = await Check.findOne({ monitorId: monitor._id }).sort({ checkedAt: -1 });
        const totalChecks = await Check.countDocuments({ monitorId: monitor._id });
        const successfulChecks = await Check.countDocuments({ monitorId: monitor._id, success: true });
        
        const uptimePercentage = totalChecks > 0 ? ((successfulChecks / totalChecks) * 100).toFixed(1) : null;

        return {
          ...monitor.toObject(),
          latestCheck: latestCheck || null,
          uptimePercentage: uptimePercentage ? Number(uptimePercentage) : null
        };
      })
    );

    res.json(monitorsWithStats);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new monitor owned by authenticated user
 * POST /api/monitors
 */
const createMonitor = async (req, res, next) => {
  try {
    const { name, url, method, interval, timeout, expectedStatus } = req.body;

    const monitor = await Monitor.create({
      userId: req.userId,
      name,
      url,
      method: method || 'GET',
      interval: interval || 5,
      timeout: timeout || 5000,
      expectedStatus: expectedStatus || 200,
      isActive: true,
      currentStatus: 'pending'
    });

    res.status(201).json(monitor);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single monitor by ID (scoped to req.userId)
 * GET /api/monitors/:id
 */
const getMonitorById = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.userId });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const latestCheck = await Check.findOne({ monitorId: monitor._id }).sort({ checkedAt: -1 });

    res.json({
      ...monitor.toObject(),
      latestCheck: latestCheck || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update monitor details (scoped to req.userId)
 * PATCH /api/monitors/:id
 */
const updateMonitor = async (req, res, next) => {
  try {
    const { name, url, method, interval, timeout, expectedStatus, isActive } = req.body;

    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.userId });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    if (name !== undefined) monitor.name = name;
    if (url !== undefined) monitor.url = url;
    if (method !== undefined) monitor.method = method;
    if (interval !== undefined) monitor.interval = interval;
    if (timeout !== undefined) monitor.timeout = timeout;
    if (expectedStatus !== undefined) monitor.expectedStatus = expectedStatus;
    if (isActive !== undefined) monitor.isActive = isActive;

    await monitor.save();

    res.json(monitor);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete monitor and associated checks (scoped to req.userId)
 * DELETE /api/monitors/:id
 */
const deleteMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    await Check.deleteMany({ monitorId: req.params.id });

    res.json({ message: 'Monitor and associated check records deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Pause monitor
 * POST /api/monitors/:id/pause
 */
const pauseMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    res.json(monitor);
  } catch (error) {
    next(error);
  }
};

/**
 * Resume monitor
 * POST /api/monitors/:id/resume
 */
const resumeMonitor = async (req, res, next) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: true },
      { new: true }
    );

    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    res.json(monitor);
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated 24h stats for a monitor using MongoDB Aggregation Pipeline
 * GET /api/monitors/:id/stats
 */
const getMonitorStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify monitor ownership
    const monitor = await Monitor.findOne({ _id: id, userId: req.userId });
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // MongoDB Aggregation Pipeline using $facet to calculate total checks, success checks, and avg response time in a single pass
    const statsResult = await Check.aggregate([
      {
        $match: {
          monitorId: new mongoose.Types.ObjectId(id),
          checkedAt: { $gte: last24Hours }
        }
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          successful: [
            { $match: { success: true } },
            { $count: 'count' }
          ],
          avgResponseTime: [
            { $match: { success: true } },
            { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
          ]
        }
      }
    ]);

    const totalChecks = statsResult[0]?.total[0]?.count || 0;
    const successfulChecks = statsResult[0]?.successful[0]?.count || 0;
    const avgResponseTime = Math.round(statsResult[0]?.avgResponseTime[0]?.avgTime || 0);

    const uptimePercentage = totalChecks > 0 ? Number(((successfulChecks / totalChecks) * 100).toFixed(2)) : 100;

    res.json({
      uptimePercentage,
      avgResponseTime,
      totalChecks,
      successfulChecks,
      failedChecks: totalChecks - successfulChecks,
      currentStatus: monitor.currentStatus,
      lastCheckedAt: monitor.lastCheckedAt
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonitors,
  createMonitor,
  getMonitorById,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  getMonitorStats
};
