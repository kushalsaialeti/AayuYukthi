import { httpError } from '../middleware/errorHandler.js';

export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path.join('.') || '_'] = issue.message;
      }
      return next(httpError(400, 'VALIDATION_ERROR', 'Validation failed', fieldErrors));
    }
    req[source] = result.data;
    return next();
  };
}
