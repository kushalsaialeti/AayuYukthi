import { httpError } from './errorHandler.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

// Customer + operations auth share this middleware; they diverge at
// requireRole(...) — never mix customer and operations authorization logic.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(httpError(401, 'UNAUTHENTICATED', 'Authentication required'));
  }
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(httpError(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
}

export function requireRole(...allowed) {
  const set = new Set(allowed);
  return (req, _res, next) => {
    if (!req.user) {
      return next(httpError(401, 'UNAUTHENTICATED', 'Authentication required'));
    }
    const roles = req.user.roles ?? [];
    if (!roles.some((r) => set.has(r))) {
      return next(httpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    return next();
  };
}

// Convenience guards with the Phase 1 role names baked in.
export const requireCustomer = () => requireRole('customer');
export const requireOperations = () =>
  requireRole('operations_head', 'operations_staff', 'content_manager', 'analytics_viewer');
