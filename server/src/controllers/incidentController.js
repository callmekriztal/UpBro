const Incident = require('../models/Incident');
const Monitor = require('../models/Monitor');

/**
 * Get incident history for a monitor owned by req.userId
 * GET /api/monitors/:id/incidents
 */
const getIncidents = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Security check: verify monitor belongs to req.userId
    const monitor = await Monitor.findOne({ _id: id, userId: req.userId });
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const incidents = await Incident.find({ monitorId: id })
      .sort({ startedAt: -1 })
      .limit(50);

    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncidents
};
