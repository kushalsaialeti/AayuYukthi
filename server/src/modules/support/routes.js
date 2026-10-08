import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireCustomer, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { z } from 'zod';
import { listNotifications, markRead, markAllRead } from '../notify/service.js';
import {
  ticketCreateSchema, messageCreateSchema, opsTicketListQuery, opsTicketStatusSchema,
  opsTicketAssignSchema, opsTicketPrioritySchema, opsMessageSchema,
} from './schemas.js';
import {
  createTicket, listTickets, getTicket, replyToTicket, closeTicket,
  listOpsTickets, getOpsTicket, opsReply, opsSetStatus, opsAssignTicket, opsSetPriority,
} from './service.js';

const notifQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unread: z.enum(['true', 'false']).optional(),
});

export function createCustomerSupportRouter(db) {
  const router = Router();
  router.use(requireAuth, requireCustomer());
  router.param('id', validateUuidParam);

  router.get('/notifications', validate(notifQuery, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total, unreadCount } = await listNotifications(db, req.user.id, { page, limit, unread: req.query.unread });
      res.json({ data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, meta: { unreadCount } });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/notifications/:id/read', async (req, res, next) => {
    try {
      res.json({ data: await markRead(db, req.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/notifications/read-all', async (req, res, next) => {
    try {
      res.json({ data: await markAllRead(db, req.user.id) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/tickets', async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listTickets(db, req.user.id, { page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.post('/tickets', validate(ticketCreateSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await createTicket(db, actorFrom(req), req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/tickets/:id', async (req, res, next) => {
    try {
      res.json({ data: await getTicket(db, req.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/tickets/:id/messages', validate(messageCreateSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await replyToTicket(db, actorFrom(req), req.params.id, req.body.message) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/tickets/:id/close', async (req, res, next) => {
    try {
      res.json({ data: await closeTicket(db, actorFrom(req), req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createOpsSupportRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(opsTicketListQuery, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listOpsTickets(db, { ...req.query, page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getOpsTicket(db, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/messages', validate(opsMessageSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await opsReply(db, actorFrom(req), req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', validate(opsTicketStatusSchema), async (req, res, next) => {
    try {
      res.json({ data: await opsSetStatus(db, actorFrom(req), req.params.id, req.body.to_status) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/assign', validate(opsTicketAssignSchema), async (req, res, next) => {
    try {
      res.json({ data: await opsAssignTicket(db, actorFrom(req), req.params.id, req.body.assigned_to) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/priority', validate(opsTicketPrioritySchema), async (req, res, next) => {
    try {
      res.json({ data: await opsSetPriority(db, actorFrom(req), req.params.id, req.body.priority) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
