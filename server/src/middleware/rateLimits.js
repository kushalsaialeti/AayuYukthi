import rateLimit from 'express-rate-limit';

// Strict limiters for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
});

// Strict OTP limiter: exactly 4 attempts allowed
export const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many OTP attempts. Maximum 4 attempts exceeded. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Universal API limiter: rolling window per unique API endpoint per IP
export const apiLimiter = rateLimit({
  windowMs: 20_000, // 20 seconds rolling window per unique API endpoint per IP
  max: process.env.NODE_ENV === 'production' ? 100 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip || 'ip'}_${req.method}_${req.baseUrl || ''}${req.path}`,
  message: { code: 'RATE_LIMITED', message: 'Rate limit exceeded. Please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.originalUrl?.includes('/analytics/events'),
});
