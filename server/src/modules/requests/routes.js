import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireCustomer } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { draftUpsertSchema, requestSubmitSchema, requestListQuerySchema } from './schemas.js';
import { saveDraft, getDraft, submitRequest, listCustomerRequests, getCustomerRequest, getCustomerRequestDetails, cancelCustomerRequest } from './service.js';

export function createCustomerRequestsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireCustomer());
  router.param('id', validateUuidParam);

  router.put('/draft', validate(draftUpsertSchema), async (req, res, next) => {
    try {
      res.json({ data: await saveDraft(db, req.user.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/draft', async (req, res, next) => {
    try {
      const key = String(req.query.idempotency_key ?? '');
      if (!key) return res.json({ data: null });
      res.json({ data: await getDraft(db, req.user.id, key) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/submit', validate(requestSubmitSchema), async (req, res, next) => {
    try {
      const { request, duplicate } = await submitRequest(db, actorFrom(req), req.body);
      res.status(duplicate ? 200 : 201).json({ data: { ...request, duplicate: duplicate || undefined } });
    } catch (err) {
      next(err);
    }
  });

  router.get('/', validate(requestListQuerySchema, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listCustomerRequests(db, req.user.id, { page, limit, status: req.query.status });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  // Dedicated separate API for detailed telemetry & journey metrics
  router.get('/:id/details', async (req, res, next) => {
    try {
      res.json({ data: await getCustomerRequestDetails(db, req.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getCustomerRequest(db, req.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  });


  router.post('/:id/cancel', async (req, res, next) => {
    try {
      res.json({ data: await cancelCustomerRequest(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      res.json({ data: await cancelCustomerRequest(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
