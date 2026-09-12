const pino = require('pino');

// Production Pino Structured Logger Instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: process.env.SERVICE_NAME || 'uptime-monitor-api',
    pid: process.pid
  }
});

module.exports = logger;
