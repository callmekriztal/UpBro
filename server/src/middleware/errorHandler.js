/**
 * Centralized Error Handling Middleware
 * 
 * Intercepts any error passed via `next(err)` across controllers.
 * Ensures a single, predictable error response shape: { message: string }
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Standardized response shape
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
