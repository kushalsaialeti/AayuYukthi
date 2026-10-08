import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

// Short-lived access tokens (stateless JWT). Roles are embedded at login;
// a role change takes effect at next login/refresh — documented in docs/API.md.
const ACCESS_TTL_SECONDS = 15 * 60;

export function signAccessToken(user) {
  return jwt.sign(
    { roles: user.roles ?? [] },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: ACCESS_TTL_SECONDS, issuer: 'aayuyukthi-api' },
  );
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET, { issuer: 'aayuyukthi-api' });
  if (!payload.sub) throw new Error('Token has no subject');
  return { id: payload.sub, roles: Array.isArray(payload.roles) ? payload.roles : [] };
}

// Opaque refresh tokens: raw value goes to the customer once,
// SHA-256 hash is what lands in user_sessions.token_hash.
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}
