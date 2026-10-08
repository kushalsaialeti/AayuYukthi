import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './config/db.js';
import { startKeepAliveService, stopKeepAliveService } from './utils/keepAlive.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'AayuYukthi API listening');
  startKeepAliveService();
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  stopKeepAliveService();
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
