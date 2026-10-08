import { z } from 'zod';
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../../utils/http.js';

// Read-only audit trail. Append-only by design: no UPDATE/DELETE routes exist.
// Least privilege: operations heads (accountable) and analytics viewers
// (read-only oversight). Staff and content roles are intentionally excluded.

const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().max(100).optional(),
  entity_type: z.string().trim().max(100).optional(),
  actor_id: z.string().uuid().optional(),
});

export function createAuditRouter(db) {
  const router = Router();
  router.use(requireAuth, requireRole('operations_head', 'analytics_viewer'));

  router.get('/', validate(auditQuerySchema, 'query'), async (req, res, next) => {
    try {
      const { page, limit } = parsePagination(req.query);
      const params = [];
      const where = [];
      if (req.query.action) {
        params.push(req.query.action);
        where.push(`action = $${params.length}`);
      }
      if (req.query.entity_type) {
        params.push(req.query.entity_type);
        where.push(`entity_type = $${params.length}`);
      }
      if (req.query.actor_id) {
        params.push(req.query.actor_id);
        where.push(`actor_id = $${params.length}`);
      }
      const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await db.query(`SELECT COUNT(*)::int AS count FROM audit_logs ${clause}`, params)).rows[0].count;
      const { rows } = await db.query(
        `SELECT id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at
         FROM audit_logs ${clause} ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, (page - 1) * limit],
      );
      res.json(paginatedResponse(rows, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
