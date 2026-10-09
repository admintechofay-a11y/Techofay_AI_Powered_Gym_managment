import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter: 500 requests per 15-minute window
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down and try again after 15 minutes.',
    },
  },
  skip: (req) => process.env.NODE_ENV === 'test' || req.path === '/health' || req.path === '/ready',
});

/**
 * Sensitive Auth rate limiter: 30 attempts per 15-minute window to mitigate brute-force
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});
