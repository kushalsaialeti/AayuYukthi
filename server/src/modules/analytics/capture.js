import { z } from 'zod';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { verifyAccessToken } from '../auth/tokens.js';
import { CLIENT_EVENTS, scrubMetadata } from './events.js';

const captureLimiter = rateLimit({
  windowMs: 60_000,
  max: process.env.NODE_ENV === 'production' ? 120 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many events. Please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const captureSchema = z.object({
  event_name: z.string().min(1).max(60),
  anonymous_session_id: z.string().trim().min(8).max(100).optional().nullable(),
  page: z.string().trim().max(500).optional().nullable(),
  source: z.string().trim().max(200).optional().nullable(),
  device_category: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional().nullable(),
  locale: z.enum(['en', 'te']).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export function createAnalyticsCaptureRouter(db) {
  const router = Router();

  router.post('/events', captureLimiter, validate(captureSchema), async (req, res, next) => {
    try {
      if (!CLIENT_EVENTS.has(req.body.event_name)) {
        return res.status(400).json({ code: 'UNKNOWN_EVENT', message: 'Event not recognized', requestId: req.requestId ?? null });
      }
      // Optional identity: attach the user when a valid token rides along, keep anonymous otherwise.
      let userId = null;
      const header = req.headers.authorization ?? '';
      const [scheme, token] = header.split(' ');
      if (scheme === 'Bearer' && token) {
        try {
          userId = verifyAccessToken(token).id;
        } catch {
          userId = null;
        }
      }
      await db.query(
        `INSERT INTO analytics_events (event_name, anonymous_session_id, user_id, page, source, device_category, locale, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [req.body.event_name, req.body.anonymous_session_id ?? null, userId,
          req.body.page ?? null, req.body.source ?? null, req.body.device_category ?? null,
          req.body.locale ?? null, JSON.stringify(scrubMetadata(req.body.metadata ?? {}))],
      );
      res.status(202).json({ data: { accepted: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
