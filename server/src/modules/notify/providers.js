import { logger } from '../../config/logger.js';

// Delivery provider abstraction. V1 ships the log provider (in-app rows are
// always written; external dispatch is best-effort and never fails the request).
// Phase 15 wires real SMS/email providers behind this same interface:
//
//   send({ channel: 'sms'|'email'|'push', to, title, body }) => Promise<{ providerMessageId? }>

export const logProvider = {
  name: 'log',
  async send({ channel, to, title }) {
    logger.info({ channel, to: mask(to), title }, 'Notification dispatched (log provider)');
    return {};
  },
};

function mask(to) {
  if (!to || typeof to !== 'string') return 'unknown';
  if (to.includes('@')) {
    const [name, domain] = to.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${to.slice(0, 4)}***`;
}

let provider = logProvider;

export function setProvider(next) {
  provider = next;
}

export async function dispatch({ channel, to, title, body }) {
  try {
    return await provider.send({ channel, to, title, body });
  } catch (err) {
    logger.error({ err: err.message, channel }, 'Notification provider failed (in-app copy preserved)');
    return { failed: true };
  }
}
