import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimits.js';
import { opsLoginSchema, refreshSchema } from './schemas.js';
import { opsLogin, rotateRefresh, logout, logoutAll } from './service.js';
import { requireAuth } from '../../middleware/auth.js';

export function createOpsAuthRouter(db) {
  const router = Router();

  router.post('/login', authLimiter, validate(opsLoginSchema), async (req, res, next) => {
    try {
      const result = await opsLogin(db, req.body);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
    try {
      const result = await rotateRefresh(db, req.body.refreshToken);
      res.json({ data: result });
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

  router.post('/logout-all', requireAuth, async (req, res, next) => {
    try {
      res.json({ data: await logoutAll(db, req.user.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
