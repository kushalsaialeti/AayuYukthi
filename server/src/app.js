import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimits.js';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createV1Router } from './routes/v1/index.js';
import { defaultDb } from './database/query.js';
import { securityMonitor, setLimiterSink } from './security/middleware.js';
import { recordSecurityEvent } from './security/events.js';
import { cachePublic } from './utils/cache.js';

// Public, CMS-driven GET reads are cacheable: 60s browser/CDN freshness absorbs
// repeat traffic so the database only sees fresh visitors. Handlers may override.
const PUBLIC_READ_RE = /^\/(api\/v1\/)?(services|hospitals|content|contact|media)(\/|$)/;

export function createApp({ db } = {}) {
  const app = express();
  const dbx = db ?? defaultDb;
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Escalation target for rate-limit blocks (per-app instance, test-safe).
  setLimiterSink((event) => { recordSecurityEvent(dbx, event); });

  app.use(requestIdMiddleware);
  app.use(pinoHttp({
    logger,
    customProps: (req) => ({ requestId: req.requestId }),
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res, responseTime) => {
      return `${req.method} ${req.url} -> ${res.statusCode} (${responseTime}ms)`;
    },
    customErrorMessage: (req, res, err) => {
      return `${req.method} ${req.url} -> ${res.statusCode} [${err?.message || 'Error'}]`;
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }));
  app.use(helmet({
    // JSON API serves no HTML: lock resource loading down completely.
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginEmbedderPolicy: false,
  }));
  const allowedOrigins = env.corsOrigins.map((s) => s.replace(/\/+$/, ''));

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (mobile apps, curl, server-to-server, cron)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // Check configured origins or wildcard
      if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Always allow official AayuYukthi Vercel deployments (production, previews, branch deploys, ops portal)
      if (
        /^https:\/\/(?:[a-zA-Z0-9_\-.]+\.)?aayuyukthi(?:-[a-zA-Z0-9_\-.]+)?\.vercel\.app$/i.test(cleanOrigin) ||
        cleanOrigin === 'https://aayuyukthi.vercel.app'
      ) {
        return callback(null, true);
      }

      // Automatically allow other Vercel deployments (*.vercel.app) in non-production
      if (
        /^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/i.test(cleanOrigin) && !env.isProd
      ) {
        return callback(null, true);
      }
      if (!env.isProd && (
        /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
      )) {
        return callback(null, true);
      }

      logger.warn({ origin: cleanOrigin, allowedOrigins }, 'CORS origin blocked');
      // origin callback has no req in scope — record what we know (the origin).
      recordSecurityEvent(dbx, {
        eventType: 'CORS_BLOCKED',
        severity: 'medium',
        method: 'OPTIONS/GET',
        path: null,
        detail: { origin: cleanOrigin },
        requestId: null,
      });
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key', 'Accept'],
    exposedHeaders: ['X-Request-Id'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Body limits: 2mb everywhere (every JSON API), 20mb ONLY for the authorized
  // ops image-upload route that accepts base64 data URIs. A 20mb global limit
  // would be a trivial memory-exhaustion vector.
  const jsonSmall = express.json({ limit: '2mb' });
  const jsonLarge = express.json({ limit: '20mb' });
  app.use((req, res, next) => {
    const path = (req.originalUrl ?? '').split('?')[0];
    if (path.endsWith('/ops/media/upload')) return jsonLarge(req, res, next);
    return jsonSmall(req, res, next);
  });
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Attack-signature monitor: after body parsing (bodies must be scannable),
  // before routes (blocked probes never reach handlers).
  app.use(securityMonitor(dbx));

  // Global limiter: the v1 router is mounted at /api/v1 AND at root, so the
  // limiter must sit at the app level — mounting it only on /api/ let every
  // root-path call (e.g. /content/faqs) bypass rate limiting entirely.
  app.use(apiLimiter);

  // Cache defaults for public CMS reads (handlers may override the TTL).
  app.use((req, res, next) => {
    if (req.method === 'GET' && PUBLIC_READ_RE.test(req.path)) cachePublic(res);
    next();
  });

  const v1Router = createV1Router(db);
  app.use('/api/v1', v1Router);
  // Also mount v1Router at root so calls without /api/v1 prefix (e.g. /hospitals, /content/home) resolve seamlessly
  app.use('/', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
