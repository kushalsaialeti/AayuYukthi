import { z } from 'zod';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { emailSchema, phoneE164Schema } from '../../validation/common.js';
import { recordAudit } from '../audit/writer.js';

// Public contact form: validated, rate-limited, stored for ops triage.
// At least one contact channel is required (mirrors the DB CHECK).

export const contactSubmitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: emailSchema.optional().nullable(),
  phone_e164: phoneE164Schema.optional().nullable(),
  subject: z.string().trim().max(300).default(''),
  message: z.string().trim().min(1, 'Message is required').max(5000),
}).refine((v) => v.email || v.phone_e164, {
  message: 'Email or phone is required',
  path: ['email'],
});

export async function submitContact(db, input) {
  const { rows } = await db.query(
    `INSERT INTO contact_submissions (name, email, phone_e164, subject, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
    [input.name, input.email ?? null, input.phone_e164 ?? null, input.subject ?? '', input.message],
  );
  await recordAudit(db, {
    action: 'CONTACT_RECEIVED', entityType: 'contact_submissions', entityId: rows[0].id, metadata: {},
  });
  return { id: rows[0].id, created_at: rows[0].created_at };
}

const contactLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many messages. Please try again later.' },
});

export function createContactPublicRouter(db) {
  const router = Router();
  router.post('/', contactLimiter, validate(contactSubmitSchema), async (req, res, next) => {
    try {
      res.status(201).json({ data: await submitContact(db, req.body) });
    } catch (err) {
      next(err);
    }
  });
  return router;
}
