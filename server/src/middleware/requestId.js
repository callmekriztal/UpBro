const crypto = require('crypto');

/**
 * Request ID Middleware
 * Generates or propagates a unique request ID (X-Request-ID) across request pipeline
 */
const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

module.exports = requestIdMiddleware;
