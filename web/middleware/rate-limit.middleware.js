import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for storefront timer resolution requests
 * Limits each IP to 120 requests per minute
 */
export const storefrontRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
});

/**
 * Rate limiter for storefront impression tracking requests
 * Limits each IP to 60 requests per minute
 */
export const impressionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many impression events reported.',
  },
});
