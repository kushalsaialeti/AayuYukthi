import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { cachePublic } from '../../utils/cache.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { serviceCreateSchema, serviceUpdateSchema, serviceListQuerySchema } from './schemas.js';
import { listServices, getServiceById, getPublishedServiceBySlug, createService, updateService, deleteService } from './service.js';

export function createServicesOpsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(serviceListQuerySchema, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listServices(db, { ...req.query, page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validate(serviceCreateSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await createService(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getServiceById(db, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', validate(serviceUpdateSchema), async (req, res, next) => {
    try {
      res.json({ data: await updateService(db, actorFrom(req), req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      res.json({ data: await deleteService(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createServicesPublicRouter(db) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      cachePublic(res);
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listServices(db, {
        page, limit, q: req.query.q, category: req.query.category, publishedOnly: true,
      });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:slug', async (req, res, next) => {
    try {
      cachePublic(res);
      res.json({ data: await getPublishedServiceBySlug(db, req.params.slug) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
