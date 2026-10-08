import pino from 'pino';
import { env } from '../config/env.js';

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

export const logger = pino({
  level: env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.otp',
      'req.body.token',
      '*.password',
      '*.otp',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  base: isDev ? undefined : { service: 'aayuyukthi-api' },
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname,req.id,req.headers,res.headers,service',
          messageFormat: '{msg}',
          singleLine: true,
        },
      }
    : undefined,
});
