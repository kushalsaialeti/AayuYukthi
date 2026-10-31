import { randomUUID } from 'node:crypto';

// Client-supplied IDs are echoed into response headers, logs, and error
// bodies — accept only a safe charset/length so they cannot forge headers,
// log lines, or terminal escape sequences.
const SAFE_ID = /^[A-Za-z0-9._-]{1,64}$/;

export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
