import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { cachePublic } from '../../utils/cache.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { hospitalCreateSchema, hospitalUpdateSchema, hospitalListQuerySchema } from './schemas.js';
import { listHospitals, getHospitalById, getPublishedHospitalBySlug, createHospital, updateHospital, deleteHospital } from './service.js';

export function createHospitalsOpsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(hospitalListQuerySchema, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listHospitals(db, { ...req.query, page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', validate(hospitalCreateSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await createHospital(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getHospitalById(db, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', validate(hospitalUpdateSchema), async (req, res, next) => {
    try {
      res.json({ data: await updateHospital(db, actorFrom(req), req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      res.json({ data: await deleteHospital(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createHospitalsPublicRouter(db) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      cachePublic(res);
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listHospitals(db, {
        page, limit, q: req.query.q, city: req.query.city,
        service_id: req.query.service_id, publishedOnly: true,
      });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:slug', async (req, res, next) => {
    try {
      cachePublic(res);
      res.json({ data: await getPublishedHospitalBySlug(db, req.params.slug) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
