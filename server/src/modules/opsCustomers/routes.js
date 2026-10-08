import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { validateUuidParam } from '../../middleware/validateUuid.js';
import { requireAuth, requireOperations } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';
import { z } from 'zod';
import { httpError } from '../../middleware/errorHandler.js';

// Operations customer + team views. PII is limited to what ops needs:
// profile essentials, request history, recipients, ticket counts (Phase 9 fills tickets).

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
});

export function createOpsCustomersRouter(db) {
  const router = Router();
  router.use(requireAuth, requireOperations());
  router.param('id', validateUuidParam);

  router.get('/', validate(listQuery, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const params = [];
      let clause = `WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'customer')`;
      if (req.query.q) {
        params.push(`%${req.query.q}%`);
        clause += ` AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone_e164 ILIKE $1)`;
      }
      const total = (await db.query(`SELECT COUNT(*)::int AS count FROM users u ${clause}`, params)).rows[0].count;
      const { rows } = await db.query(
        `SELECT u.id, u.full_name, u.email, u.phone_e164, u.locale, u.status,
                u.onboarding_last_step, u.onboarding_completed_at, u.created_at,
                (SELECT COUNT(*)::int FROM requests r WHERE r.owner_user_id = u.id) AS request_count
         FROM users u ${clause} ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, (page - 1) * limit],
      );
      res.json(paginatedResponse(rows, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  router.get('/team', async (_req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT u.id, u.full_name, u.email,
                (SELECT json_agg(ur.role) FROM user_roles ur WHERE ur.user_id = u.id) AS roles
         FROM users u WHERE EXISTS (
           SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
             AND ur.role IN ('operations_head','operations_staff','content_manager','analytics_viewer')
         ) AND u.status = 'active' ORDER BY u.full_name ASC`,
      );
      res.json({ data: rows });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT u.id, u.full_name, u.email, u.phone_e164, u.locale, u.status, u.preferences,
                u.email_verified_at, u.phone_verified_at,
                u.onboarding_last_step, u.onboarding_completed_at, u.created_at
         FROM users u WHERE u.id = $1 LIMIT 1`,
        [req.params.id],
      );
      if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Customer not found');
      const recipients = (await db.query(
        'SELECT id, full_name, relationship, date_of_birth FROM care_recipients WHERE owner_user_id = $1 ORDER BY created_at DESC',
        [req.params.id],
      )).rows;
      const requests = (await db.query(
        `SELECT r.id, r.status, r.created_at, s.title_en AS service_title, h.name_en AS hospital_name
         FROM requests r JOIN services s ON s.id = r.service_id JOIN hospitals h ON h.id = r.hospital_id
         WHERE r.owner_user_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
        [req.params.id],
      )).rows;
      res.json({ data: { ...rows[0], recipients, requests } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
