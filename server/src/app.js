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

export function createApp({ db } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

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

      // Automatically allow all Vercel deployments (*.vercel.app) and local development
      if (
        /^https:\/\/[a-zA-Z0-9_\-.]+\.vercel\.app$/.test(cleanOrigin) ||
        /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }

      logger.warn({ origin: cleanOrigin, allowedOrigins }, 'CORS origin blocked');
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
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: false, limit: '20mb' }));

  app.use('/api/', apiLimiter);

  const v1Router = createV1Router(db);
  app.use('/api/v1', v1Router);
  // Also mount v1Router at root so calls without /api/v1 prefix (e.g. /hospitals, /content/home) resolve seamlessly
  app.use('/', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
