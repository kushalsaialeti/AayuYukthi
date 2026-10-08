import { z } from 'zod';
import { phoneE164Schema } from '../../validation/common.js';

const ALLOWED_RELATIONSHIPS = ['self', 'parent', 'spouse', 'child', 'sibling', 'relative', 'friend', 'other'];

const relationshipSchema = z.string().trim().default('other').transform((val) => {
  if (!val) return 'other';
  const s = String(val).trim().toLowerCase();
  if (['mother', 'father', 'mom', 'dad', 'parent', 'in-law (mother/father)', 'in-law'].includes(s)) return 'parent';
  if (['spouse', 'husband', 'wife', 'partner'].includes(s)) return 'spouse';
  if (['child', 'son', 'daughter'].includes(s)) return 'child';
  if (['sibling', 'brother', 'sister'].includes(s)) return 'sibling';
  if (['relative / guardian', 'relative', 'guardian'].includes(s)) return 'relative';
  if (['self', 'self (direct account)'].includes(s)) return 'self';
  if (['friend'].includes(s)) return 'friend';
  if (ALLOWED_RELATIONSHIPS.includes(s)) return s;
  return 'other';
});

const genderSchema = z.string().trim().optional().nullable().transform((val) => {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  if (['female', 'f'].includes(s)) return 'female';
  if (['male', 'm'].includes(s)) return 'male';
  if (['other', 'o'].includes(s)) return 'other';
  if (['prefer_not_to_say', 'prefernottosay', 'prefer not to say'].includes(s)) return 'prefer_not_to_say';
  return 'other';
});

const pastDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine((d) => {
  const t = new Date(`${d}T00:00:00Z`).getTime();
  return Number.isFinite(t) && t <= Date.now();
}, { message: 'Date of birth cannot be in the future' });

export const recipientCreateSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(200),
  relationship: relationshipSchema,
  date_of_birth: pastDate.optional().nullable(),
  gender: genderSchema,
  phone_e164: phoneE164Schema.optional().nullable(),
  notes: z.string().trim().max(10000).default(''),
});

export const recipientUpdateSchema = recipientCreateSchema.partial();

