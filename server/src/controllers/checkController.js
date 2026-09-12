const Check = require('../models/Check');
const Monitor = require('../models/Monitor');

/**
 * Get check history for a specific monitor
 * GET /api/monitors/:id/checks
 */
const getChecks = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify monitor belongs to user
    const monitor = await Monitor.findOne({ _id: id, userId: req.userId });
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const checks = await Check.find({ monitorId: id })
      .sort({ checkedAt: -1 })
      .limit(100);

    res.json(checks);
  } catch (error) {
    next(error);
  }
};

/**
 * Manually record a fake check (for testing Stage 1 before scheduler exists)
 * POST /api/monitors/:id/checks
 */
const createCheck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statusCode, responseTime, success, error, checkedAt } = req.body;

    // Verify monitor belongs to user
    const monitor = await Monitor.findOne({ _id: id, userId: req.userId });
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const isSuccess = success !== undefined ? Boolean(success) : statusCode === (monitor.expectedStatus || 200);

    const check = await Check.create({
      monitorId: id,
      statusCode: statusCode || (isSuccess ? 200 : 500),
      responseTime: responseTime || Math.floor(Math.random() * 200) + 50,
      success: isSuccess,
      error: error || (isSuccess ? null : 'Simulated check failure'),
      checkedAt: checkedAt ? new Date(checkedAt) : new Date()
    });

    res.status(201).json(check);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChecks,
  createCheck
};
