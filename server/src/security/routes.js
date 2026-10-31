import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { parsePagination, paginatedResponse } from '../utils/http.js';

// Operations → Security: the admin alarm surface. Reads the security_events
// rows written by the monitor. Restricted to operations_head — event detail
// contains attacker IPs/paths and must not leak to staff/content roles.
export function createSecurityOpsRouter(db) {
  const router = Router();
  router.use(requireRole('operations_head'));

  // Paged event feed, filterable by severity/type.
  router.get('/events', async (req, res, next) => {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const severity = ['low', 'medium', 'high', 'critical'].includes(req.query.severity) ? req.query.severity : null;
      const eventType = typeof req.query.event_type === 'string' && req.query.event_type.length <= 64
        ? req.query.event_type
        : null;

      const where = [];
      const params = [];
      if (severity) {
        params.push(severity);
        where.push(`severity = $${params.length}`);
      }
      if (eventType) {
        params.push(eventType);
        where.push(`event_type = $${params.length}`);
      }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const total = (await db.query(
        `SELECT count(*)::int AS n FROM security_events ${whereSql}`, params,
      )).rows[0].n;
      params.push(limit, offset);
      const { rows } = await db.query(
        `SELECT id, event_type, severity, ip, method, path, detail, request_id, created_at
         FROM security_events ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      res.json(paginatedResponse(rows, total, page, limit));
    } catch (err) {
      next(err);
    }
  });

  // Small counts for the dashboard alarm card (last 24h).
  router.get('/summary', async (_req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT severity, count(*)::int AS count
         FROM security_events
         WHERE created_at > now() - interval '24 hours'
         GROUP BY severity`,
      );
      const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
      let total24h = 0;
      for (const r of rows) {
        bySeverity[r.severity] = r.count;
        total24h += r.count;
      }
      res.json({ data: { total24h, bySeverity } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
