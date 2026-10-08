import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { paginatedResponse } from '../../utils/http.js';
import { z } from 'zod';
import { rangeQuerySchema, resolveRange, funnel, overview, dropoff, topByMetadata, languageSplit, recentEvents } from './queries.js';

export function createOpsAnalyticsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());

  const withRange = (handler) => async (req, res, next) => {
    try {
      res.json({ data: await handler(resolveRange(req.query)) });
    } catch (err) {
      next(err);
    }
  };

  router.get('/overview', validate(rangeQuerySchema, 'query'), withRange((range) => overview(db, range)));

  router.get('/funnel/:type', validate(rangeQuerySchema, 'query'), async (req, res, next) => {
    try {
      const range = resolveRange(req.query);
      res.json({ data: { type: req.params.type, range, steps: await funnel(db, req.params.type, range) } });
    } catch (err) {
      next(err);
    }
  });

  router.get('/dropoff', async (req, res, next) => {
    try {
      res.json({ data: await dropoff(db, { limit: Number(req.query.limit ?? 50) }) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/services', validate(rangeQuerySchema, 'query'), withRange((range) =>
    topByMetadata(db, { event: 'SERVICE_VIEWED', key: 'service_slug', range }).then(async (views) => ({
      views,
      requests: await topByMetadata(db, { event: 'REQUEST_STEP_COMPLETED', key: 'service_slug', range }),
    }))));

  router.get('/hospitals', validate(rangeQuerySchema, 'query'), withRange((range) =>
    topByMetadata(db, { event: 'HOSPITAL_VIEWED', key: 'hospital_slug', range })));

  router.get('/languages', validate(rangeQuerySchema, 'query'), withRange((range) => languageSplit(db, range)));

  router.get('/events', async (req, res, next) => {
    try {
      const schema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) });
      const parsed = schema.parse(req.query);
      const { items, total } = await recentEvents(db, parsed);
      res.json(paginatedResponse(items, total, parsed.page, parsed.limit));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
