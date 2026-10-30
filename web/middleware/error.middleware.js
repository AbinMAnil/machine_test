/**
 * Centralized error handling middleware
 * Prevents stack trace and secret leakage in production responses
 */
export function errorHandler(err, req, res, _next) {
  console.error('API Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred' : err.message;

  res.status(statusCode).json({
    error: message,
  });
}
