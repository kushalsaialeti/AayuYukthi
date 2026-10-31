import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { translateBatchSchema, translateBatch } from './service.js';
import { track } from '../analytics/events.js';
import { verifyAccessToken } from '../auth/tokens.js';
import { rateLimitHandler } from '../../security/middleware.js';

const OPS_ROLES = ['operations_head', 'operations_staff', 'content_manager'];

// Optional auth: ops staff may translate drafts; anonymous/customer callers
// only ever touch published content (enforced in the service layer).
function allowUnpublished(req) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return false;
  try {
    const user = verifyAccessToken(token);
    return (user.roles ?? []).some((r) => OPS_ROLES.includes(r));
  } catch {
    return false;
  }
}

const translateLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler('RATE_LIMITED_TRANSLATE'),
});

export function createTranslationRouter(db) {
  const router = Router();
  router.post('/batch', translateLimiter, validate(translateBatchSchema), async (req, res, next) => {
    try {
      const results = await translateBatch(db, req.body, { allowUnpublished: allowUnpublished(req) });
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
