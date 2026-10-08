import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authLimiter, otpLimiter } from '../../middleware/rateLimits.js';
import { refreshSchema } from './schemas.js';
import {
  customerSignupSchema, customerLoginSchema, otpRequestSchema, otpVerifySchema, recoveryConfirmSchema,
} from './customerSchemas.js';
import { customerSignup, verifyCustomerOtp, customerLogin, confirmRecovery, requestOtp, normalizeChannel } from './customerService.js';
import { rotateRefresh, logout, logoutAll } from './service.js';
import { requireAuth, requireCustomer } from '../../middleware/auth.js';

export function createCustomerAuthRouter(db) {
  const router = Router();

  router.post('/signup', authLimiter, validate(customerSignupSchema), async (req, res, next) => {
    try {
      const result = await customerSignup(db, req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/otp/request', otpLimiter, validate(otpRequestSchema), async (req, res, next) => {
    try {
      res.json({ data: await requestOtp(db, { identifier: normalizeChannel(req.body), purpose: req.body.purpose }) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/otp/verify', otpLimiter, validate(otpVerifySchema), async (req, res, next) => {
    try {
      const result = await verifyCustomerOtp(db, {
        channel: normalizeChannel(req.body), purpose: req.body.purpose, code: req.body.code,
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', authLimiter, validate(customerLoginSchema), async (req, res, next) => {
    try {
      res.json({ data: await customerLogin(db, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/recovery/confirm', authLimiter, validate(recoveryConfirmSchema), async (req, res, next) => {
    try {
      res.json({
        data: await confirmRecovery(db, {
          channel: normalizeChannel(req.body), code: req.body.code, newPassword: req.body.newPassword,
        }),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
    try {
      res.json({ data: await rotateRefresh(db, req.body.refreshToken) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', validate(refreshSchema), async (req, res, next) => {
    try {
      await logout(db, req.body.refreshToken);
      res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout-all', requireAuth, requireCustomer(), async (req, res, next) => {
    try {
      res.json({ data: await logoutAll(db, req.user.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
