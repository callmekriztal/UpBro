const rateLimit = require('express-rate-limit');

/**
 * IP-based Rate Limiter for Auth Routes (Login / Register)
 * Prevents password brute-force and credential stuffing attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // Max 10 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  }
});

/**
 * User/IP-based Rate Limiter for Monitor Creation
 * Prevents spamming thousands of monitor creations.
 */
const monitorCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Max 20 monitor creations per hour
  keyGenerator: (req) => {
    // Key by authenticated userId if available, fallback to IP address
    return req.userId ? req.userId.toString() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Monitor creation rate limit exceeded (max 20 per hour). Please try again later.'
  }
});

module.exports = {
  authLimiter,
  monitorCreateLimiter
};
