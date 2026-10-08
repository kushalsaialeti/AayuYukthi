import { z } from 'zod';

// Shared primitives — every module builds its route schemas from these.
export const emailSchema = z.string().trim().toLowerCase().email('Invalid email').max(254);

export const phoneE164Schema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be E.164 format (e.g. +919876543210)');

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128).refine(
  (v) => !COMMON_PASSWORDS.has(v.toLowerCase()),
  { message: 'This password is too common. Choose a stronger one.' },
);

// Small blocklist of breached/common passwords (exact match, case-insensitive).
// Not a substitute for breach-corpus checks at higher scale — documented in SECURITY.md.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwerty123',
  'letmein1', 'welcome1', 'admin123', 'aayuyukthi', 'aayuyukthi1', 'changeme1',
]);

export const uuidSchema = z.string().uuid('Invalid identifier');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const localeSchema = z.enum(['en', 'te']);
