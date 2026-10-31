import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { sendPlainEmail } from '../auth/email.js';

// Delivery provider abstraction. Email goes through the same Resend transport
// OTP uses (so SECURITY_ADMIN_EMAIL red alerts really send once
// RESEND_API_KEY is configured); SMS/push and any provider failure fall back
// to the log provider — dispatch is always best-effort and never fails a
// request. In-app notification rows are always written by the caller.

export const logProvider = {
  name: 'log',
  async send({ channel, to, title }) {
    logger.info({ channel, to: mask(to), title }, 'Notification dispatched (log provider)');
    return {};
  },
};

// Real email sender via Resend (already provisioned for OTP mail).
export const emailProvider = {
  name: 'resend',
  async send({ channel, to, title, body }) {
    if (channel !== 'email') return logProvider.send({ channel, to, title });
    const result = await sendPlainEmail({ to, subject: title, text: body });
    if (result.ok) return { providerMessageId: result.id };
    // Domain not verified / key missing → keep the durable log trail instead.
    return logProvider.send({ channel, to, title });
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

let provider = env.RESEND_API_KEY && !env.isTest ? emailProvider : logProvider;

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
