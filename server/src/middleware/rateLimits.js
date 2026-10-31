import rateLimit from 'express-rate-limit';
import { rateLimitHandler } from '../security/middleware.js';

// Strict limiters for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('RATE_LIMITED_AUTH'),
});

// Strict OTP limiter: exactly 4 attempts allowed
export const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 4,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('RATE_LIMITED_OTP'),
  skip: () => process.env.NODE_ENV === 'test',
});

// Refresh rotation: one row per refresh, so unauthenticated refresh spam is a
// table-growth DoS vector. Generous for real users (multi-tab), tight for bots.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('RATE_LIMITED_AUTH'),
  skip: () => process.env.NODE_ENV === 'test',
});

// Universal API limiter: rolling window per unique API endpoint per IP
export const apiLimiter = rateLimit({
  windowMs: 20_000, // 20 seconds rolling window per unique API endpoint per IP
  max: process.env.NODE_ENV === 'production' ? 100 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip || 'ip'}_${req.method}_${req.baseUrl || ''}${req.path}`,
  handler: rateLimitHandler('RATE_LIMITED_API'),
  skip: (req) => process.env.NODE_ENV === 'test' || req.originalUrl?.includes('/analytics/events'),
});
