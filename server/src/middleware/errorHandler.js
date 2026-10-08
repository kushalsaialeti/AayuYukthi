import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const code = err.code ?? (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    logger.error({ err, requestId: req.requestId, path: req.path }, 'Unhandled error');
  } else {
    logger.warn({ requestId: req.requestId, path: req.path, status, code }, 'Request error');
  }

  res.status(status).json({
    code,
    message: status === 500 ? 'Something went wrong. Please try again.' : (err.message ?? 'Request failed'),
    requestId: req.requestId ?? null,
    ...(err.remainingAttempts !== undefined ? { remainingAttempts: err.remainingAttempts } : {}),
    ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
    ...(!env.isProd && err.stack ? { _debugStack: err.stack.split('\n').slice(0, 5) } : {}),
  });
}

export function httpError(statusCode, code, message, fieldErrors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (fieldErrors) err.fieldErrors = fieldErrors;
  return err;
}
