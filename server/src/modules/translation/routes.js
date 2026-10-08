import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { translateBatchSchema, translateBatch } from './service.js';
import { track } from '../analytics/events.js';

const translateLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many translation requests. Please try again later.' },
});

export function createTranslationRouter(db) {
  const router = Router();
  router.post('/batch', translateLimiter, validate(translateBatchSchema), async (req, res, next) => {
    try {
      const results = await translateBatch(db, req.body);
      const cached = results.filter((r) => r.cached).length;
      const failed = results.filter((r) => r.text == null).length;
      await track(db, {
        eventName: failed ? 'TRANSLATION_FAILED' : 'TRANSLATION_REQUESTED',
        metadata: { requested: results.length, cached, failed, target_locale: req.body.target_locale },
      });
      res.json({ data: results });
    } catch (err) {
      next(err);
    }
  });
  return router;
}
