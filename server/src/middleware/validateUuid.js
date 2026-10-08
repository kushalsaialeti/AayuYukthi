import { uuidSchema } from '../validation/common.js';
import { httpError } from './errorHandler.js';

// Guards every :id route against malformed UUIDs (which would otherwise
// surface as database errors). Slug/key routes are unaffected — only mount
// this where :id is genuinely a UUID.
export function validateUuidParam(req, _res, next, value) {
  if (!uuidSchema.safeParse(value).success) {
    return next(httpError(400, 'INVALID_INPUT', 'Invalid identifier format'));
  }
  return next();
}
