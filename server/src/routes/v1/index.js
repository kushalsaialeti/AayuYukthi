import { Router } from 'express';
import healthRouter from './health.js';
import { defaultDb } from '../../database/query.js';
import { createOpsAuthRouter } from '../../modules/auth/routes.js';
import { createServicesOpsRouter, createServicesPublicRouter } from '../../modules/services/routes.js';
import { createHospitalsOpsRouter, createHospitalsPublicRouter } from '../../modules/hospitals/routes.js';
import { createContentOpsRouter, createContentPublicRouter } from '../../modules/content/routes.js';
import { createMediaOpsRouter, createMediaPublicRouter } from '../../modules/media/routes.js';
import { createContactPublicRouter } from '../../modules/contact/service.js';
import { createCustomerAuthRouter } from '../../modules/auth/customerRoutes.js';
import { createCustomerAccountRouter } from '../../modules/recipients/routes.js';
import { createCustomerRequestsRouter } from '../../modules/requests/routes.js';
import { createOpsRequestsRouter } from '../../modules/requests/opsRoutes.js';
import { createOpsCustomersRouter } from '../../modules/opsCustomers/routes.js';
import { createCustomerSupportRouter, createOpsSupportRouter } from '../../modules/support/routes.js';
import { createTranslationRouter } from '../../modules/translation/routes.js';
import { createAnalyticsCaptureRouter } from '../../modules/analytics/capture.js';
import { createOpsAnalyticsRouter } from '../../modules/analytics/opsRoutes.js';
import { createAuditRouter } from '../../modules/audit/routes.js';
import { requireAuth } from '../../middleware/auth.js';
import { httpError } from '../../middleware/errorHandler.js';

// Analytics viewers are read-only across operations: they may GET but never
// mutate. Mounted after /ops/auth (login must stay public) and before every
// other /ops router, so the rule lives in exactly one place.
function viewerReadOnly(req, _res, next) {
  const roles = req.user?.roles ?? [];
  const staff = ['operations_head', 'operations_staff', 'content_manager'];
  const viewerOnly = roles.includes('analytics_viewer') && !roles.some((r) => staff.includes(r));
  if (viewerOnly && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next(httpError(403, 'FORBIDDEN', 'Analytics viewers have read-only access'));
  }
  return next();
}

// db is injected so tests can swap the live pool for PGlite.
export function createV1Router(db = defaultDb) {
  const v1 = Router();
  v1.use('/', healthRouter);

  v1.get('/', (_req, res) => {
    res.json({ data: { name: 'AayuYukthi API', version: 'v1' } });
  });

  // Public, CMS-driven reads (consumed by the web app in Phase 4)
  v1.use('/services', createServicesPublicRouter(db));
  v1.use('/hospitals', createHospitalsPublicRouter(db));
  v1.use('/content', createContentPublicRouter(db));
  v1.use('/contact', createContactPublicRouter(db));
  v1.use('/media', createMediaPublicRouter(db));
  v1.use('/translate', createTranslationRouter(db));
  v1.use('/analytics', createAnalyticsCaptureRouter(db));
  v1.use('/auth', createCustomerAuthRouter(db));
  v1.use('/account', createCustomerAccountRouter(db));
  v1.use('/requests', createCustomerRequestsRouter(db));
  v1.use('/support', createCustomerSupportRouter(db));

  // Operations CMS
  v1.use('/ops/auth', createOpsAuthRouter(db));
  v1.use('/ops', requireAuth, viewerReadOnly);
  v1.use('/ops/services', createServicesOpsRouter(db));
  v1.use('/ops/hospitals', createHospitalsOpsRouter(db));
  v1.use('/ops/cms', createContentOpsRouter(db));
  v1.use('/ops/requests', createOpsRequestsRouter(db));
  v1.use('/ops/customers', createOpsCustomersRouter(db));
  v1.use('/ops/support', createOpsSupportRouter(db));
  v1.use('/ops/analytics', createOpsAnalyticsRouter(db));
  v1.use('/ops/audit-logs', createAuditRouter(db));
  v1.use('/ops/media', createMediaOpsRouter(db));

  return v1;
}

export default createV1Router();
