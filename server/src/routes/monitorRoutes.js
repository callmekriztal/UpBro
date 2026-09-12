const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getMonitors,
  createMonitor,
  getMonitorById,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  getMonitorStats
} = require('../controllers/monitorController');
const { getChecks, createCheck } = require('../controllers/checkController');
const { getIncidents } = require('../controllers/incidentController');
const { validateMonitorInput } = require('../validators/monitorValidator');

// Protect all monitor routes with JWT auth middleware
router.use(authMiddleware);

// Monitor CRUD routes
router.get('/', getMonitors);
router.post('/', validateMonitorInput, createMonitor);
router.get('/:id', getMonitorById);
router.patch('/:id', validateMonitorInput, updateMonitor);
router.delete('/:id', deleteMonitor);

// Monitor action control routes
router.post('/:id/pause', pauseMonitor);
router.post('/:id/resume', resumeMonitor);

// 24h Aggregated Stats endpoint
router.get('/:id/stats', getMonitorStats);

// Incident History endpoint
router.get('/:id/incidents', getIncidents);

// Check history & manual check insertion routes
router.get('/:id/checks', getChecks);
router.post('/:id/checks', createCheck);

module.exports = router;
