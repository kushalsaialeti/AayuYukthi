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
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: false, limit: '20mb' }));

  app.use('/api/', apiLimiter);

  app.use('/api/v1', createV1Router(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
