import { z } from 'zod';
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { actorFrom } from '../audit/writer.js';
import { listOpsRequests, getOpsRequest, changeRequestStatus, assignRequest, updateOpsRequest, allowedTransitions } from './opsService.js';

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().max(300).optional(),
  assigned: z.string().trim().max(100).optional(),
  q: z.string().trim().max(200).optional(),
});

const statusChangeSchema = z.object({
  to_status: z.enum(['REQUEST_RECEIVED', 'UNDER_REVIEW', 'COORDINATION_IN_PROGRESS', 'CONFIRMED',
    'SCHEDULED', 'SERVICE_IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ACTION_REQUIRED']),
  note_internal: z.string().trim().max(5000).optional().nullable(),
  customer_message: z.string().trim().max(5000).optional().nullable(),
});

const assignSchema = z.object({
  assigned_to: z.string().uuid().nullable(),
});

const updateDetailsSchema = z.object({
  appointment_type: z.string().trim().max(300).optional().nullable(),
  appointment_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).optional().nullable(),
  schedule_at: z.string().trim().optional().nullable(),
  pickup_required: z.boolean().optional(),
  pickup_address: z.string().trim().max(1000).optional().nullable(),
  additional_requirements: z.string().trim().max(2000).optional().nullable(),
  hospital_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().or(z.literal('')).optional().nullable(),
  doctor_name: z.string().trim().max(200).optional().nullable(),
  room_number: z.string().trim().max(100).optional().nullable(),
  station_manager: z.string().trim().max(200).optional().nullable(),
  station_location: z.string().trim().max(200).optional().nullable(),
  station_intercom: z.string().trim().max(100).optional().nullable(),
  station_phone: z.string().trim().max(100).optional().nullable(),
  companion_phone: z.string().trim().max(100).optional().nullable(),
  companion_badge_id: z.string().trim().max(100).optional().nullable(),
  customer_message: z.string().trim().max(5000).optional().nullable(),
  visit_summary: z.string().trim().max(5000).optional().nullable(),
  note_internal: z.string().trim().max(5000).optional().nullable(),
});


export function createOpsRequestsRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(listQuery, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const { items, total } = await listOpsRequests(db, req.user.id, { ...req.query, page, limit });
      res.json(paginatedResponse(items, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json({ data: await getOpsRequest(db, req.params.id) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', validate(updateDetailsSchema), async (req, res, next) => {
    try {
      res.json({ data: await updateOpsRequest(db, actorFrom(req), req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/status', validate(statusChangeSchema), async (req, res, next) => {
    try {
      res.json({ data: await changeRequestStatus(db, actorFrom(req), req.params.id, req.body) });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/assign', validate(assignSchema), async (req, res, next) => {
    try {
      res.json({ data: await assignRequest(db, actorFrom(req), req.params.id, req.body.assigned_to) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { allowedTransitions };
