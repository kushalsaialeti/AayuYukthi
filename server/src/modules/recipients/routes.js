import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireCustomer } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { profileUpdateSchema } from '../users/schemas.js';
import { getProfile, updateProfile } from '../users/service.js';
import { recipientCreateSchema, recipientUpdateSchema } from './schemas.js';
import { listRecipients, getRecipient, createRecipient, updateRecipient, deleteRecipient } from './service.js';

export function createCustomerAccountRouter(db) {
  const router = Router();
  router.use(requireAuth, requireCustomer());
  router.param('id', validateUuidParam);

  router.get('/me', async (req, res, next) => {
    try {
      res.json({ data: await getProfile(db, req.user.id) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/me', validate(profileUpdateSchema), async (req, res, next) => {
    try {
      res.json({ data: await updateProfile(db, req.user.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/recipients', async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listRecipients(db, req.user.id, { page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.post('/recipients', validate(recipientCreateSchema), async (req, res, next) => {
    try {
      const { recipient } = await createRecipient(db, actorFrom(req), req.body);
      res.status(201).json({ data: recipient });
    } catch (err) {
      next(err);
    }
  });

  router.get('/recipients/:id', async (req, res, next) => {
    try {
      res.json({ data: await getRecipient(db, req.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/recipients/:id', validate(recipientUpdateSchema), async (req, res, next) => {
    try {
      const { recipient } = await updateRecipient(db, actorFrom(req), req.params.id, req.body);
      res.json({ data: recipient });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/recipients/:id', async (req, res, next) => {
    try {
      res.json({ data: await deleteRecipient(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
